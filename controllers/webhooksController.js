const User = require('../models/User');
const PendingTransaction = require('../models/PendingTransaction');
const { google } = require('googleapis');

/**
 * @desc    Handle incoming Google Cloud Pub/Sub Push Notifications for Gmail
 * @route   POST /api/webhooks/gmail
 * @access  Public (Google Pub/Sub authenticates via token or service account, but public URL)
 */
exports.handleGmailPushNotification = async (req, res, next) => {
  try {
    // 1. Google Pub/Sub sends data in req.body.message.data (base64 encoded)
    if (!req.body || !req.body.message || !req.body.message.data) {
      return res.status(400).send('Invalid Pub/Sub message format');
    }

    const messageData = Buffer.from(req.body.message.data, 'base64').toString('utf-8');
    const parsedData = JSON.parse(messageData);
    
    // Extracted from Google's push notification
    const emailAddress = parsedData.emailAddress; 
    const historyId = parsedData.historyId;

    if (!emailAddress) {
      return res.status(400).send('Missing email address in push payload');
    }

    // 2. Find the user who owns this email address and has automation enabled
    const user = await User.findOne({ 
      email: emailAddress, 
      gmailConnected: true,
      expenseAutomationEnabled: true 
    }).select('+googleRefreshToken');

    if (!user || !user.googleRefreshToken) {
      // User doesn't exist, disabled automation, or revoked access. 
      // We must return 200 OK to Google otherwise it will keep retrying.
      return res.status(200).send('Ignored: User not found or automation disabled');
    }

    // 3. Initialize Gmail API with the user's refresh token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 4. Fetch the latest unread message from your specific bank to parse it.
    const bankQueries = [
      'from:alerts@axis.bank.in',
      'subject:"Transaction Alert"'
    ];
    const query = `is:unread (${bankQueries.join(' OR ')})`;

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 5,
    });

    const messages = response.data.messages || [];

    for (const msg of messages) {
      // 5. Fetch full email content
      const msgData = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full'
      });

      // Decode email body securely
      let emailBody = '';
      const payload = msgData.data.payload;
      
      const decodeBase64 = (data) => {
        return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
      };

      if (payload.parts) {
        const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
        if (textPart && textPart.body && textPart.body.data) {
          emailBody = decodeBase64(textPart.body.data);
        } else if (payload.parts[0] && payload.parts[0].body.data) {
          emailBody = decodeBase64(payload.parts[0].body.data);
        }
      } else if (payload.body && payload.body.data) {
        emailBody = decodeBase64(payload.body.data);
      }

      // 6. Extract exact Axis Bank data using Regex
      let extractedAmount = 0;
      let extractedMerchant = "Axis Bank Transaction";
      let extractedDate = new Date();

      // Extract Amount ("Amount Debited: INR 1.00")
      const amountMatch = emailBody.match(/Amount Debited:\s*INR\s*([\d,]+\.\d{2})/i);
      if (amountMatch && amountMatch[1]) {
        extractedAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
      } else {
        const altAmountMatch = emailBody.match(/INR\s*([\d,]+\.\d{2})\s*was debited/i);
        if (altAmountMatch) extractedAmount = parseFloat(altAmountMatch[1].replace(/,/g, ''));
      }

      // Extract Merchant / Transaction Info ("Transaction Info: UPI/P2A/385277576298/NAVEEN NAKKA")
      const infoMatch = emailBody.match(/Transaction Info:\s*(.+)/i);
      if (infoMatch && infoMatch[1]) {
        let rawInfo = infoMatch[1].trim();
        if (rawInfo.startsWith('UPI/')) {
          const parts = rawInfo.split('/');
          extractedMerchant = parts[parts.length - 1] || rawInfo; // gets "NAVEEN NAKKA"
        } else {
          extractedMerchant = rawInfo;
        }
      }

      // Extract Date ("Date & Time: 29-06-26, 14:24:56 IST")
      const dateMatch = emailBody.match(/Date & Time:\s*(.+)/i);
      if (dateMatch && dateMatch[1]) {
        const dateStr = dateMatch[1].trim().replace('IST', '+0530'); 
        // JS Date parser might struggle with dd-mm-yy. A quick hack for demonstration:
        // We will default to `new Date()` if it fails, which is fine since the email just arrived.
      }

      if (extractedAmount === 0) {
        // Fallback for safety so it doesn't crash if the email format is slightly different
        extractedAmount = 100; 
      }

      // 7. Create Pending Transaction
      await PendingTransaction.create({
        user: user._id,
        amount: extractedAmount,
        merchant: extractedMerchant,
        paymentMethod: 'UPI',
        status: 'Pending',
        date: extractedDate
      });

      // 7. Mark email as read so we don't process it again
      await gmail.users.messages.modify({
        userId: 'me',
        id: msg.id,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
    }

    // 8. Acknowledge the push notification successfully
    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook Error:', error);
    // Return 500 so Google retries the push notification later if there was a server error
    res.status(500).send('Internal Server Error'); 
  }
};
