const mongoose = require('mongoose');
const { google } = require('googleapis');
const { decryptSecret } = require('./utils/crypto.util');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./models/User');
  const user = await User.findOne({ gmailConnected: true }).select('+googleRefreshToken');
  if(!user) { console.log('No user'); process.exit(0); }

  const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: decryptSecret(user.googleRefreshToken) });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // Calculate start of current month in IST
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istNow = new Date(utcTime + (3600000 * 5.5));
  const year = istNow.getFullYear();
  const month = istNow.getMonth();
  const cutoff = new Date(`${year}-${String(month + 1).padStart(2, '0')}-01T00:00:00.000+05:30`);
  const yyyy = cutoff.getUTCFullYear();
  const mm = String(cutoff.getUTCMonth()+1).padStart(2,'0');
  const dd = String(cutoff.getUTCDate()).padStart(2,'0');
  const dateStr = `${yyyy}/${mm}/${dd}`;

  const BANK_SENDER = 'alerts@axis.bank.in';
  const query = `after:${dateStr} from:${BANK_SENDER}`;
  console.log('Query:', query);

  const response = await gmail.users.messages.list({ userId: 'me', q: query, maxResults: 100 });
  console.log('Total matching messages:', response.data.messages ? response.data.messages.length : 0);
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
