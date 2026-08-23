/**
 * Client-side XSS prevention utilities
 * Use these when rendering user-generated content
 */

export const escapeHtml = (text) => {
  if (typeof text !== 'string') return text;
  const map = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

export const sanitizeHtml = (html) => {
  if (typeof html !== 'string') return html;

  const allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'];
  const allowedAttrs = ['href', 'target', 'rel'];

  // Simple DOM-based sanitization
  const div = document.createElement('div');
  div.innerHTML = html;

  const walker = document.createTreeWalker(div, NodeFilter.SHOW_ELEMENT);
  const nodesToRemove = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const tagName = node.tagName.toLowerCase();

    if (!allowedTags.includes(tagName)) {
      nodesToRemove.push(node);
      continue;
    }

    // Remove disallowed attributes
    const attrsToRemove = [];
    for (const attr of node.attributes) {
      if (!allowedAttrs.includes(attr.name.toLowerCase())) {
        attrsToRemove.push(attr.name);
      }
    }
    attrsToRemove.forEach((name) => node.removeAttribute(name));

    // Ensure links have safe attributes
    if (tagName === 'a') {
      node.setAttribute('rel', 'noopener noreferrer');
      node.setAttribute('target', '_blank');
      const href = node.getAttribute('href');
      if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:')) {
        node.removeAttribute('href');
      }
    }
  }

  nodesToRemove.forEach((node) => {
    const parent = node.parentNode;
    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node);
    }
    parent.removeChild(node);
  });

  return div.innerHTML;
};

export const sanitizeText = (text) => {
  if (typeof text !== 'string') return text;
  return escapeHtml(text);
};

export const sanitizeObject = (obj, options = {}) => {
  if (!obj || typeof obj !== 'object') return obj;

  const { htmlFields = [], textFields = [], recursive = true } = options;
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
        sanitized[key] = sanitizeText(value);
      }
    } else if (typeof value === 'object' && recursive) {
      sanitized[key] = sanitizeObject(value, options);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

export const sanitizeForRender = (content, type = 'text') => {
  switch (type) {
    case 'html':
      return sanitizeHtml(content);
    case 'text':
    default:
      return sanitizeText(content);
  }
};

export const safeSetInnerHTML = (element, html) => {
  if (!element) return;
  element.innerHTML = sanitizeHtml(html);
};

export const safeSetTextContent = (element, text) => {
  if (!element) return;
  element.textContent = sanitizeText(text);
};