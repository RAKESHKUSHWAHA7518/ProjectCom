import { body } from 'express-validator';
import { handleValidationErrors } from './authValidators.js';

export const validateReport = [
  body('reportedUserId')
    .trim()
    .notEmpty().withMessage('Reported user ID is required')
    .isMongoId().withMessage('Reported user ID must be a valid MongoDB ObjectId'),
  body('reason')
    .trim()
    .notEmpty().withMessage('Reason is required')
    .isIn(['spam', 'harassment', 'inappropriate_content', 'fake_profile', 'other'])
    .withMessage('Reason must be one of: spam, harassment, inappropriate_content, fake_profile, other'),
  body('details')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 500 }).withMessage('Details must be at most 500 characters'),
];

export { handleValidationErrors };
