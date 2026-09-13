import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SkipLink from '../components/SkipLink';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import { useAuthStore } from '../store/authStore';

describe('Frontend UI Components', () => {
  describe('SkipLink Component', () => {
    it('renders skip to main content anchor with correct href', () => {
      render(<SkipLink />);
      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '#main-content');
    });
  });

  describe('EmailVerificationBanner Component', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      useAuthStore.setState({ user: null });
    });

    it('does not render when no user is logged in', () => {
      const { container } = render(<EmailVerificationBanner />);
      expect(container).toBeEmptyDOMElement();
    });

    it('does not render when user email is already verified', () => {
      useAuthStore.setState({
        user: { _id: 'u1', name: 'Verified User', emailVerified: true },
      });
      const { container } = render(<EmailVerificationBanner />);
      expect(container).toBeEmptyDOMElement();
    });

    it('renders warning banner when user email is not verified', () => {
      useAuthStore.setState({
        user: { _id: 'u2', name: 'Unverified User', emailVerified: false },
      });
      render(<EmailVerificationBanner />);
      expect(screen.getByText(/verify your email address/i)).toBeInTheDocument();
      expect(screen.getByText(/you need to verify your email/i)).toBeInTheDocument();
    });

    it('dismisses the banner when close button is clicked', () => {
      useAuthStore.setState({
        user: { _id: 'u3', name: 'User 3', emailVerified: false },
      });
      render(<EmailVerificationBanner />);
      const closeButton = screen.getByLabelText(/^dismiss$/i);
      fireEvent.click(closeButton);
      expect(screen.queryByText(/verify your email address/i)).not.toBeInTheDocument();
    });
  });
});
