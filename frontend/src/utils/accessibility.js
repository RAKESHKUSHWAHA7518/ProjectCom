/**
 * Accessibility (WCAG 2.1 AA) Utilities
 * Helper functions and hooks for accessible React components
 */

import { useEffect, useRef, useState } from 'react';

export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
};

export const focusElement = (selectorOrElement) => {
  const element = typeof selectorOrElement === 'string'
    ? document.querySelector(selectorOrElement)
    : selectorOrElement;
  if (element) {
    element.focus({ preventScroll: true });
    return true;
  }
  return false;
};

export const trapFocus = (containerElement) => {
  const focusableElements = containerElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  containerElement.addEventListener('keydown', handleTab);
  firstElement?.focus();

  return () => containerElement.removeEventListener('keydown', handleTab);
};

export const useFocusTrap = (isActive, containerRef) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    const cleanup = trapFocus(containerRef.current);
    return cleanup;
  }, [isActive, containerRef]);
};

export const useKeyboardNavigation = (callbacks) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          callbacks.onEscape?.(e);
          break;
        case 'Enter':
          callbacks.onEnter?.(e);
          break;
        case 'ArrowLeft':
          callbacks.onArrowLeft?.(e);
          break;
        case 'ArrowRight':
          callbacks.onArrowRight?.(e);
          break;
        case 'ArrowUp':
          callbacks.onArrowUp?.(e);
          break;
        case 'ArrowDown':
          callbacks.onArrowDown?.(e);
          break;
        case 'Home':
          callbacks.onHome?.(e);
          break;
        case 'End':
          callbacks.onEnd?.(e);
          break;
        case 'Tab':
          callbacks.onTab?.(e);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
};

export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handler = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

export const useSkipLink = () => {
  const skipLinkRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab' && !e.shiftKey && document.activeElement === document.body) {
        if (skipLinkRef.current) {
          skipLinkRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <a
      ref={skipLinkRef}
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
};

export const createAccessibleButton = (props) => {
  const {
    children,
    onClick,
    ariaLabel,
    ariaPressed,
    ariaExpanded,
    ariaControls,
    disabled,
    ...rest
  } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      disabled={disabled}
      className={`focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export const createAccessibleInput = (props) => {
  const {
    label,
    id,
    type = 'text',
    required,
    error,
    ariaDescribedBy,
    ...rest
  } = props;

  const errorId = error ? `${id}-error` : undefined;
  const helperId = rest.helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId, ariaDescribedBy].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition ${
          error
            ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900'
            : 'border-gray-200 dark:border-gray-700 focus:ring-primary-200 dark:focus:ring-primary-800'
        } bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${rest.className || ''}`}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {rest.helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {rest.helperText}
        </p>
      )}
    </div>
  );
};

export const createAccessibleSelect = (props) => {
  const {
    label,
    id,
    required,
    error,
    options,
    ariaDescribedBy,
    ...rest
  } = props;

  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, ariaDescribedBy].filter(Boolean).join(' ') || undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={id}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${rest.className || ''} ${
          error
            ? 'border-red-500 focus:ring-red-200 dark:focus:ring-red-900'
            : 'border-gray-200 dark:border-gray-700 focus:ring-primary-200 dark:focus:ring-primary-800'
        }`}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export const liveRegion = (message, priority = 'polite') => {
  announceToScreenReader(message, priority);
};

export const checkColorContrast = (foreground, background) => {
  const getLuminance = (hex) => {
    const rgb = parseInt(hex.replace('#', ''), 16);
    const r = (rgb >> 16 & 0xff) / 255;
    const g = (rgb >> 8 & 0xff) / 255;
    const b = (rgb & 0xff) / 255;
    const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaa: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
};