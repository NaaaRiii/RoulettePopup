import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../../components/Header';

// Next.js router のモック
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// AWS Amplify UI のモック
const mockSignOut = jest.fn();
const mockUseAuthenticator = jest.fn();
jest.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: () => mockUseAuthenticator(),
}));

// AWS Amplify Auth のモック
jest.mock('aws-amplify/auth', () => ({
  signOut: jest.fn(),
  updateUserAttributes: jest.fn(),
}));

// fetchWithAuth のモック
jest.mock('../../utils/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
}));

// window.confirm のモック
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

// localStorage のモック
const mockRemoveItem = jest.fn();
Object.defineProperty(window, 'localStorage', {
  value: {
    removeItem: mockRemoveItem,
  },
});

describe('Header - 退会機能テスト（論理削除）', () => {
  let mockAmplifySignOut;
  let mockUpdateUserAttributes;
  let mockFetchWithAuth;

  beforeEach(() => {
    // AWS Amplify Auth のモック関数を取得
    const amplifyAuth = require('aws-amplify/auth');
    mockAmplifySignOut = amplifyAuth.signOut;
    mockUpdateUserAttributes = amplifyAuth.updateUserAttributes;
    
    // fetchWithAuth のモック関数を取得
    const fetchWithAuthModule = require('../../utils/fetchWithAuth');
    mockFetchWithAuth = fetchWithAuthModule.fetchWithAuth;
    // ログイン状態のセットアップ
    mockUseAuthenticator.mockReturnValue({
      signOut: mockSignOut,
    });
    
    // mockFetchWithAuthをセットアップ
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: { id: 1 } }),
    });
    
    // グローバルfetchのセットアップ（checkAuth用）
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: { id: 1 } }),
    });
    
    jest.clearAllMocks();
  });

  describe('退会ボタンの表示', () => {
    it('ログイン時にハンバーガーメニューに「退会」ボタンが表示される', async () => {
      render(<Header />);
      
      // ハンバーガーメニューを開く
      const hamburgerButton = screen.getByRole('button');
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        expect(screen.getByText('退会')).toBeInTheDocument();
      });
    });

    it('退会ボタンがhover時に赤色になる', async () => {
      render(<Header />);
      
      const hamburgerButton = screen.getByRole('button');
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const withdrawalButton = screen.getByText('退会');
        expect(withdrawalButton).toHaveClass('hover:text-red-600');
      });
    });
  });

  describe('退会確認ダイアログ', () => {
    it('退会ボタンクリック時に確認ダイアログが表示される', async () => {
      mockConfirm.mockReturnValue(false);
      
      render(<Header />);
      
      const hamburgerButton = screen.getByRole('button');
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const withdrawalButton = screen.getByText('退会');
        fireEvent.click(withdrawalButton);
      });
      
      expect(mockConfirm).toHaveBeenCalledWith(
        'この動作は取り消しができません。このサービスから退会しますか？'
      );
    });

    it('確認ダイアログでキャンセルした場合、退会処理が実行されない', async () => {
      mockConfirm.mockReturnValue(false);
      
      render(<Header />);
      
      // 初期認証チェックを待つ
      await waitFor(() => {
        expect(screen.getByText('退会')).toBeInTheDocument();
      });
      
      // モックをリセット（初期認証チェック後）
      jest.clearAllMocks();
      
      const withdrawalButton = screen.getByText('退会');
      fireEvent.click(withdrawalButton);
      
      expect(mockFetchWithAuth).not.toHaveBeenCalled();
      expect(mockUpdateUserAttributes).not.toHaveBeenCalled();
    });
  });

  describe('退会処理の実行', () => {
    beforeEach(() => {
      mockConfirm.mockReturnValue(true);
    });

    it('確認ダイアログでOKした場合、Rails APIが呼び出される', async () => {
      mockFetchWithAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Account deactivated successfully' }),
      });
      
      render(<Header />);
      
      const hamburgerButton = screen.getByRole('button');
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const withdrawalButton = screen.getByText('退会');
        fireEvent.click(withdrawalButton);
      });
      
      await waitFor(() => {
        expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/users/withdrawal', {
          method: 'DELETE',
        });
      });
    });

    it('Rails API成功時にCognitoユーザー属性が更新される', async () => {
      mockFetchWithAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Account deactivated successfully' }),
      });
      mockUpdateUserAttributes.mockResolvedValue();
      
      render(<Header />);
      
      const hamburgerButton = screen.getByRole('button');
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const withdrawalButton = screen.getByText('退会');
        fireEvent.click(withdrawalButton);
      });
      
      await waitFor(() => {
        expect(mockUpdateUserAttributes).toHaveBeenCalledWith({
          userAttributes: {
            'custom:status': 'deactivated',
          },
        });
      });
    });

    it('Cognito更新成功時にAmplifyサインアウトが実行される', async () => {
      mockFetchWithAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Account deactivated successfully' }),
      });
      mockUpdateUserAttributes.mockResolvedValue();
      mockAmplifySignOut.mockResolvedValue();
      
      render(<Header />);
      
      const hamburgerButton = screen.getByRole('button');
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const withdrawalButton = screen.getByText('退会');
        fireEvent.click(withdrawalButton);
      });
      
      await waitFor(() => {
        expect(mockAmplifySignOut).toHaveBeenCalledWith({ global: true });
      });
    });

    it('退会処理成功時にローカルストレージがクリアされる', async () => {
      mockFetchWithAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Account deactivated successfully' }),
      });
      mockUpdateUserAttributes.mockResolvedValue();
      mockAmplifySignOut.mockResolvedValue();
      
      render(<Header />);
      
      const hamburgerButton = screen.getByRole('button');
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const withdrawalButton = screen.getByText('退会');
        fireEvent.click(withdrawalButton);
      });
      
      await waitFor(() => {
        expect(mockRemoveItem).toHaveBeenCalledWith('token');
      });
    });

    it('退会処理成功時にルートページにリダイレクトされる', async () => {
      mockFetchWithAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Account deactivated successfully' }),
      });
      mockUpdateUserAttributes.mockResolvedValue();
      mockAmplifySignOut.mockResolvedValue();
      
      render(<Header />);
      
      const hamburgerButton = screen.getByRole('button');
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const withdrawalButton = screen.getByText('退会');
        fireEvent.click(withdrawalButton);
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('エラーハンドリング', () => {
    beforeEach(() => {
      mockConfirm.mockReturnValue(true);
    });

    it('Rails API失敗時にCognito更新が実行されない', async () => {
      render(<Header />);
      
      // 初期認証チェックを待つ
      await waitFor(() => {
        expect(screen.getByText('退会')).toBeInTheDocument();
      });
      
      // Rails API失敗のセットアップ（初期認証後）
      mockFetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      
      const withdrawalButton = screen.getByText('退会');
      fireEvent.click(withdrawalButton);
      
      await waitFor(() => {
        expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/users/withdrawal', {
          method: 'DELETE',
        });
      });
      
      expect(mockUpdateUserAttributes).not.toHaveBeenCalled();
      expect(mockAmplifySignOut).not.toHaveBeenCalled();
    });

    it('Cognito更新失敗時にサインアウトが実行されない', async () => {
      mockFetchWithAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Account deactivated successfully' }),
      });
      mockUpdateUserAttributes.mockRejectedValue(new Error('Cognito update failed'));
      
      render(<Header />);
      
      const hamburgerButton = screen.getByRole('button');
      fireEvent.click(hamburgerButton);
      
      await waitFor(() => {
        const withdrawalButton = screen.getByText('退会');
        fireEvent.click(withdrawalButton);
      });
      
      await waitFor(() => {
        expect(mockUpdateUserAttributes).toHaveBeenCalled();
      });
      
      expect(mockAmplifySignOut).not.toHaveBeenCalled();
    });

    it('ネットワークエラー時にエラーハンドリングが実行される', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<Header />);
      
      // 初期認証チェックを待つ
      await waitFor(() => {
        expect(screen.getByText('退会')).toBeInTheDocument();
      });
      
      // ネットワークエラーのセットアップ（初期認証後）
      mockFetchWithAuth.mockRejectedValueOnce(new Error('Network error'));
      
      const withdrawalButton = screen.getByText('退会');
      fireEvent.click(withdrawalButton);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('退会処理でエラーが発生しました:', expect.any(Error));
      });
      
      consoleErrorSpy.mockRestore();
    });
  });
});