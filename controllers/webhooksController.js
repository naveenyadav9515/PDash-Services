const User = require('../models/User');
const PendingTransaction = require('../models/PendingTransaction');
const { google } = require('googleapis');

// Reusable logic to fetch and parse emails
const syncRecentBankEmails = async (user) => {
  try {
    if (!user || !user.googleRefreshToken) return;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

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
      const msgData = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full'
      });

      let emailBody = '';
      const payload = msgData.data.payload;
      
      const decodeBase64 = (data) => Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');

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

      let extractedAmount = 0;
      let extractedMerchant = "Axis Bank Transaction";
      let extractedDate = new Date();

      const amountMatch = emailBody.match(/Amount Debited:\s*INR\s*([\d,]+\.\d{2})/i);
      if (amountMatch && amountMatch[1]) {
        extractedAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
      } else {
        const altAmountMatch = emailBody.match(/INR\s*([\d,]+\.\d{2})\s*was debited/i);
        if (altAmountMatch) extractedAmount = parseFloat(altAmountMatch[1].replace(/,/g, ''));
      }

      const infoMatch = emailBody.match(/Transaction Info:\s*(.+)/i);
      if (infoMatch && infoMatch[1]) {
        let rawInfo = infoMatch[1].trim();
        if (rawInfo.startsWith('UPI/')) {
          const parts = rawInfo.split('/');
          extractedMerchant = parts[parts.length - 1] || rawInfo;
        } else {
          extractedMerchant = rawInfo;
        }
      }

      // Extract exact date
      const dateMatch = emailBody.match(/Date & Time:\s*(\d{2})-(\d{2})-(\d{2}),\s*(\d{2}):(\d{2}):(\d{2})/i);
      if (dateMatch) {
        const [_, day, month, year, hours, minutes, seconds] = dateMatch;
        const fullYear = year.length === 2 ? `20${year}` : year;
        extractedDate = new Date(`${fullYear}-${month}-${day}T${hours}:${minutes}:${seconds}+05:30`);
      } else if (msgData.data.internalDate) {
        extractedDate = new Date(parseInt(msgData.data.internalDate));
      }

      if (extractedAmount === 0) extractedAmount = 100;

      // 1. Ignore transactions before June 30, 2026
      const cutoffDate = new Date('2026-06-30T00:00:00+05:30');
      if (extractedDate < cutoffDate) {
        await gmail.users.messages.modify({
          userId: 'me',
          id: msg.id,
          requestBody: { removeLabelIds: ['UNREAD'] }
        });
        continue; // Skip saving
      }

      // 2. Prevent Duplicates (match amount, merchant, and time within +/- 5 minutes)
      const fiveMins = 5 * 60 * 1000;
      const minDate = new Date(extractedDate.getTime() - fiveMins);
      const maxDate = new Date(extractedDate.getTime() + fiveMins);

      const Expense = require('../models/Expense');
      
      const duplicateExpense = await Expense.findOne({
        user: user._id,
        amount: extractedAmount,
        merchant: extractedMerchant,
        date: { $gte: minDate, $lte: maxDate }
      });

      const duplicatePending = await PendingTransaction.findOne({
        user: user._id,
        amount: extractedAmount,
        merchant: extractedMerchant,
        date: { $gte: minDate, $lte: maxDate }
      });

      if (duplicateExpense || duplicatePending) {
        // Already exists, just mark email as read to prevent loop
        await gmail.users.messages.modify({
          userId: 'me',
          id: msg.id,
          requestBody: { removeLabelIds: ['UNREAD'] }
        });
        continue;
      }

      await PendingTransaction.create({
        user: user._id,
        amount: extractedAmount,
        merchant: extractedMerchant,
        paymentMethod: 'UPI',
        status: 'Pending',
        date: extractedDate
      });

      await gmail.users.messages.modify({
        userId: 'me',
        id: msg.id,
        requestBody: { removeLabelIds: ['UNREAD'] }
      });
    }
  } catch (err) {
    console.error('Error during bank email sync:', err);
  }
};

/**
 * @desc    Handle incoming Google Cloud Pub/Sub Push Notifications for Gmail
 * @route   POST /api/webhooks/gmail
 */
const handleGmailPushNotification = async (req, res, next) => {
  try {
    if (!req.body || !req.body.message || !req.body.message.data) {
      return res.status(400).send('Invalid Pub/Sub message format');
    }

    const messageData = Buffer.from(req.body.message.data, 'base64').toString('utf-8');
    const parsedData = JSON.parse(messageData);
    const emailAddress = parsedData.emailAddress; 

    if (!emailAddress) {
      return res.status(400).send('Missing email address');
    }

    const user = await User.findOne({ 
      email: emailAddress, 
      gmailConnected: true,
      expenseAutomationEnabled: true 
    }).select('+googleRefreshToken');

    if (!user || !user.googleRefreshToken) {
      return res.status(200).send('Ignored');
    }

    // Call the exact same logic we use for initial sync
    await syncRecentBankEmails(user);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Internal Server Error'); 
  }
};

module.exports = {
  handleGmailPushNotification,
  syncRecentBankEmails
};
