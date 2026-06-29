const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const config = require('../config/index');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(AppError.unauthorized('Not authorized to access this route. Missing token.'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return next(AppError.unauthorized('The user belonging to this token no longer exists.'));
      }
      
      next();
    } catch (err) {
      return next(AppError.unauthorized('Not authorized. Invalid or expired token.'));
    }
  } catch (error) {
    next(error);
  }
};
