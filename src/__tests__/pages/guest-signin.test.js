import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import { signIn } from 'aws-amplify/auth';
import '@testing-library/jest-dom';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock aws-amplify/auth
jest.mock('aws-amplify/auth', () => ({
  signIn: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock environment variables
const originalEnv = process.env;

describe('GuestSigninPage', () => {
  let mockRouter;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup router mock
    mockRouter = {
      replace: jest.fn(),
    };
    useRouter.mockReturnValue(mockRouter);

    // Setup environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_RAILS_API_URL: 'https://api.example.com',
      NEXT_PUBLIC_GUEST_EMAIL: 'test2user@example.com',
      NEXT_PUBLIC_GUEST_PASSWORD: '?TePPstPd0ajsrhpig824t!',
    };

    // Setup fetch mock
    global.fetch.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const renderGuestSignin = () => {
    const GuestSigninPage = require('../../pages/guest-signin').default;
    return render(<GuestSigninPage />);
  };

  describe('Successful guest login flow', () => {
    it('should complete guest login successfully and redirect to dashboard', async () => {
      // Mock successful Rails API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });

      // Mock successful Amplify signIn
      signIn.mockResolvedValueOnce({
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' },
      });

      renderGuestSignin();

      // Check loading message is displayed
      expect(screen.getByText('ログイン中...')).toBeInTheDocument();

      // Wait for the login process to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://api.example.com/api/guest_login',
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });

      // Wait for Amplify signIn to be called
      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith({
          username: 'test2user@example.com',
          password: '?TePPstPd0ajsrhpig824t!',
        });
      });

      // Wait for redirect to dashboard
      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
      }, { timeout: 3000 });
    });
  });

  describe('Rails API failure scenarios', () => {
    it('should redirect to login when Rails API returns error', async () => {
      // Mock failed Rails API response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      renderGuestSignin();

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect to login when Rails API throws network error', async () => {
      // Mock network error
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      renderGuestSignin();

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Amplify signIn failure scenarios', () => {
    it('should redirect to login when Amplify signIn fails', async () => {
      // Mock successful Rails API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });

      // Mock failed Amplify signIn
      signIn.mockRejectedValueOnce(new Error('Amplify sign in failed'));

      renderGuestSignin();

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect to login when Amplify signIn returns isSignedIn: false', async () => {
      // Mock successful Rails API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });

      // Mock Amplify signIn with isSignedIn: false
      signIn.mockResolvedValueOnce({
        isSignedIn: false,
        nextStep: { signInStep: 'CONFIRM_SIGN_IN' },
      });

      renderGuestSignin();

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Environment variable scenarios', () => {
    it('should redirect to login when guest email is missing', async () => {
      // Remove guest email from environment
      delete process.env.NEXT_PUBLIC_GUEST_EMAIL;

      // Mock successful Rails API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });

      renderGuestSignin();

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect to login when guest password is missing', async () => {
      // Remove guest password from environment
      delete process.env.NEXT_PUBLIC_GUEST_PASSWORD;

      // Mock successful Rails API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });

      renderGuestSignin();

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });
    });

    it('should handle missing Rails API URL gracefully', async () => {
      // Remove Rails API URL from environment
      delete process.env.NEXT_PUBLIC_RAILS_API_URL;

      // Mock successful Rails API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });

      // Mock successful Amplify signIn
      signIn.mockResolvedValueOnce({
        isSignedIn: true,
        nextStep: { signInStep: 'DONE' },
      });

      renderGuestSignin();

      // Should still work with empty base URL
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/guest_login',
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      });
    });
  });

  describe('Component rendering', () => {
    it('should render loading message', () => {
      renderGuestSignin();
      expect(screen.getByText('ログイン中...')).toBeInTheDocument();
    });

    it('should have proper styling for loading container', () => {
      renderGuestSignin();
      const container = screen.getByText('ログイン中...').parentElement;
      expect(container).toHaveStyle({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      });
    });
  });

  describe('Error logging', () => {
    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock failed Rails API response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      renderGuestSignin();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Guest login failed:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should log Amplify signIn errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock successful Rails API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });

      // Mock failed Amplify signIn
      signIn.mockRejectedValueOnce(new Error('Amplify sign in failed'));

      renderGuestSignin();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Amplify sign in failed:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });
}); 