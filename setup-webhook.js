const mongoose = require('mongoose');
const { google } = require('googleapis');
const { decryptSecret } = require('./utils/crypto.util');
require('dotenv').config();

// =========================================================================
// IMPORTANT: Replace these two values with your actual Project ID and Topic ID
// from the Google Cloud Console!
// =========================================================================
const PROJECT_ID = 'pdash-1997'; 
const TOPIC_NAME = 'gmail-expenses-topic'; // Change if you named it differently
// =========================================================================

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./models/User');
  const user = await User.findOne({ gmailConnected: true }).select('+googleRefreshToken');
  
  if(!user) { 
    console.log('❌ No connected user found in the database. Please connect Gmail in the app first.'); 
    process.exit(0); 
  }

  console.log(`✅ Found user: ${user.email}`);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID, 
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({ refresh_token: decryptSecret(user.googleRefreshToken) });
  
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  try {
    const fullTopicName = `projects/${PROJECT_ID}/topics/${TOPIC_NAME}`;
    console.log(`\n📡 Sending watch request to Gmail for topic: ${fullTopicName}...`);

    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        labelIds: ['INBOX'], // Only notify for emails that hit the inbox
        labelFilterAction: 'include',
        topicName: fullTopicName
      }
    });

    console.log('\n🎉 SUCCESS! Gmail push notifications are now active.');
    console.log('Google responded with:', response.data);
    console.log('\nAny new emails sent to your inbox will now instantly ping your webhook!');
    
  } catch (error) {
    console.error('\n❌ Error setting up watch request:');
    console.error(error.message);
    if (error.code === 403) {
      console.log('\n💡 TIP: A 403 error usually means the service account (gmail-api-push@system.gserviceaccount.com) does not have Publisher permissions on your topic.');
    }
  }

  process.exit(0);
}).catch(e => { 
  console.error('Database connection failed:', e); 
  process.exit(1); 
});
