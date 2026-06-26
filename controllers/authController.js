const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/index');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

// Initialize Google Auth Client (Uses placeholder if not set)
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id');

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

    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Google ID token is required' });
    }

    // Verify the Google token payload
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID || 'placeholder_client_id',
    });
    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user. Generate a random secure dummy password to satisfy DB schema.
      const secureRandomPassword = crypto.randomBytes(32).toString('hex');
      user = await User.create({
        firstName: given_name || 'User',
        lastName: family_name || '',
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
    res.status(401).json({ status: 'error', message: 'Invalid Google Token' });
  }
};
