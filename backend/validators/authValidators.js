import { body, validationResult } from 'express-validator';

// Reusable password field builder — caller supplies the field name
const passwordField = (fieldName) =>
  body(fieldName)
    .trim()
    .escape()
    .isLength({ min: 8, max: 72 }).withMessage('Password must be 8–72 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one digit');

export const validateRegister = [
  body('name')
    .trim()
    .escape()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 1000 }).withMessage('Name must be at most 1000 characters'),
  body('email')
    .trim()
    .escape()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  passwordField('password'),
];

export const validateLogin = [
  body('email')
    .trim()
    .escape()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .trim()
    .escape()
    .notEmpty().withMessage('Password is required'),
];

export const validateForgotPassword = [
  body('email')
    .trim()
    .escape()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
];

export const validateResetPassword = [
  body('token')
    .trim()
    .escape()
    .notEmpty().withMessage('Token is required'),
  passwordField('newPassword'),
];

export const validateChangePassword = [
  body('currentPassword')
    .trim()
    .escape()
    .notEmpty().withMessage('Current password is required'),
  passwordField('newPassword'),
];

export const validateResendVerification = [
  body('email')
    .trim()
    .escape()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
];

/**
 * Shared validation error handler middleware.
 * Runs express-validator's validationResult and returns HTTP 422 with
 * { errors: [{ field, message }] } if any validation rules failed.
 * Calls next() when the request is valid.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};
