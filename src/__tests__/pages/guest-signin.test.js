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

describe('GuestSigninページ', () => {
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

  describe('ゲストログイン成功フロー', () => {
    it('ゲストログインを成功し、ダッシュボードにリダイレクトすること', async () => {
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

  describe('Rails API失敗シナリオ', () => {
    it('Rails APIがエラーを返したときにログインにリダイレクトすること', async () => {
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

    it('Rails APIがネットワークエラーを発生させたときにログインにリダイレクトすること', async () => {
      // Mock network error
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      renderGuestSignin();

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Amplify signIn失敗シナリオ', () => {
    it('Amplify signInが失敗したときにログインにリダイレクトすること', async () => {
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

    it('Amplify signInがisSignedIn: falseを返したときにログインにリダイレクトすること', async () => {
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

  describe('環境変数シナリオ', () => {
    it('ゲストメールが欠けているときにログインにリダイレクトすること', async () => {
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

    it('ゲストパスワードが欠けているときにログインにリダイレクトすること', async () => {
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

    it('Rails API URLの欠如を適切に処理すること', async () => {
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

  describe('コンポーネントのレンダリング', () => {
    it('ローディングメッセージをレンダリングすること', () => {
      renderGuestSignin();
      expect(screen.getByText('ログイン中...')).toBeInTheDocument();
    });

    it('ローディングコンテナに適切なスタイリングを適用すること', () => {
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

  describe('エラーログ出力', () => {
    it('エラーをコンソールに出力すること', async () => {
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

    it('Amplify signInエラーをコンソールに出力すること', async () => {
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