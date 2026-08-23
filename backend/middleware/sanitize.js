import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

export const sanitizeHtml = (dirty) => {
  if (typeof dirty !== 'string') return dirty;
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
};

export const sanitizeText = (dirty) => {
  if (typeof dirty !== 'string') return dirty;
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

export const sanitizeObject = (obj, options = {}) => {
  if (!obj || typeof obj !== 'object') return obj;

  const {
    htmlFields = [], // Fields that allow basic HTML
    textFields = [], // Fields that should be plain text only
    recursive = true,
  } = options;

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
      continue;
    }

    if (typeof value === 'string') {
      if (htmlFields.includes(key)) {
        sanitized[key] = sanitizeHtml(value);
      } else if (textFields.includes(key) || !htmlFields.length) {
        sanitized[key] = sanitizeText(value);
      } else {
        sanitized[key] = sanitizeText(value); // Default to text sanitization
      }
    } else if (typeof value === 'object' && recursive) {
      sanitized[key] = sanitizeObject(value, options);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

export const sanitizeMiddleware = (options = {}) => {
  return (req, res, next) => {
    if (req.body) {
      req.body = sanitizeObject(req.body, options);
    }
    if (req.query) {
      req.query = sanitizeObject(req.query, { ...options, recursive: false });
    }
    if (req.params) {
      req.params = sanitizeObject(req.params, { ...options, recursive: false });
    }
    next();
  };
};

export const createSanitizeMiddleware = (htmlFields = [], textFields = []) => {
  return sanitizeMiddleware({ htmlFields, textFields });
};