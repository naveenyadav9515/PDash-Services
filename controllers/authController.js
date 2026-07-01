const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/index');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const AppError = require('../utils/AppError');
const { encryptSecret } = require('../utils/crypto.util');

const getGoogleClientConfig = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId) {
    throw AppError.badRequest('Google authentication is not configured');
  }

  return { clientId, clientSecret };
};

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.registerUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        status: 'success',
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select password since it's hidden by default
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        status: 'success',
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        }
      });
    } else {
      res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate with Google OAuth ID Token
 * @route   POST /api/auth/google
 * @access  Public
 */
exports.googleAuth = async (req, res, next) => {
  try {
    const { token } = req.body;
    const { clientId } = getGoogleClientConfig();

    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Google ID token is required' });
    }

    const client = new OAuth2Client(clientId);

    // Verify the Google token payload
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    if (!email) {
      return next(AppError.badRequest('Google account email is required'));
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user. Generate a random secure dummy password to satisfy DB schema.
      const secureRandomPassword = crypto.randomBytes(32).toString('hex');
      user = await User.create({
        firstName: given_name || 'User',
        lastName: family_name || 'Account',
        email,
        password: secureRandomPassword,
        avatarUrl: picture,
      });
    } else if (!user.avatarUrl && picture) {
      // Optionally update their avatar if they didn't have one
      user.avatarUrl = picture;
      await user.save();
    }

    // Return the standard local JWT token
    res.json({
      status: 'success',
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        token: generateToken(user._id),
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    next(error);
  }
};

exports.getGoogleAuthUrl = (req, res) => {
  const redirectUri = req.query.redirectUri || 'http://localhost:4200/expenses';
  const { clientId, clientSecret } = getGoogleClientConfig();
  const oauth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    redirectUri
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.readonly', 'email', 'profile'],
  });

  res.json({ status: 'success', data: { url } });
};

exports.connectGmail = async (req, res, next) => {
  try {
    const { code, redirectUri } = req.body;
    const { clientId, clientSecret } = getGoogleClientConfig();

    if (!clientSecret) {
      return next(AppError.badRequest('Google Gmail connection is not configured'));
    }

    const oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      redirectUri || 'http://localhost:4200/expenses'
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (tokens.refresh_token) {
      const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        gmailConnected: true,
        googleRefreshToken: encryptSecret(tokens.refresh_token),
        expenseAutomationEnabled: true
      }, { new: true }).select('+googleRefreshToken');
      
      // Perform initial sync of recent emails!
      const { syncRecentBankEmails } = require('./webhooksController');
      await syncRecentBankEmails(updatedUser);

      res.json({ status: 'success', message: 'Gmail connected successfully' });
    } else {
      // If we don't get a refresh token, we just enable the features if they already have one stored
      await User.findByIdAndUpdate(req.user.id, {
        gmailConnected: true,
        expenseAutomationEnabled: true
      });
      res.json({ status: 'success', message: 'Gmail connected successfully (re-authorized)' });
    }
  } catch (error) {
    console.error('Connect Gmail Error:', error);
    next(error);
  }
};
