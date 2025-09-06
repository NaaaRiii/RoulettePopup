import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Header from '../../components/Header';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

// Mock外部依存関係
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: jest.fn(),
}));

jest.mock('../../utils/fetchWithAuth');
jest.mock('aws-amplify/auth', () => ({
  signOut: jest.fn(),
  updateUserAttributes: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
  pathname: '/',
};

const mockSignOut = jest.fn();

describe('Header - ゲスト制限機能', () => {
  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    useAuthenticator.mockReturnValue({
      signOut: mockSignOut,
    });
    jest.clearAllMocks();
  });

  describe('退会ボタンの表示制御', () => {
    test('通常ユーザー（is_guest: false）の場合、退会ボタンが表示される', async () => {
      // 通常ユーザーのAPIレスポンスをモック
      fetchWithAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 1,
          name: 'テストユーザー',
          email: 'user@example.com',
          is_guest: false
        })
      });

      render(<Header />);

      // ログイン状態になるまで待機
      await waitFor(() => {
        expect(fetchWithAuth).toHaveBeenCalledWith('/api/current_user');
      });

      // ハンバーガーメニューを開く
      const hamburgerButton = screen.getByRole('button');
      fireEvent.click(hamburgerButton);

      // 退会ボタンが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('退会')).toBeInTheDocument();
      });
    });

    test('ゲストユーザー（is_guest: true）の場合、退会ボタンが表示されない', async () => {
      // ゲストユーザーのAPIレスポンスをモック
      fetchWithAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 1,
          name: 'ゲストユーザー',
          email: 'guest@example.com',
          is_guest: true
        })
      });

      render(<Header />);

      // ログイン状態になるまで待機
      await waitFor(() => {
        expect(fetchWithAuth).toHaveBeenCalledWith('/api/current_user');
      });

      // ハンバーガーメニューを開く
      const hamburgerButton = screen.getByRole('button');
      fireEvent.click(hamburgerButton);

      // 退会ボタンが表示されないことを確認
      await waitFor(() => {
        expect(screen.queryByText('退会')).not.toBeInTheDocument();
      });

      // 他のメニュー項目は表示されることを確認
      expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
      expect(screen.getByText('ログアウト')).toBeInTheDocument();
    });

    test('APIエラーの場合、ログインしていない状態として扱われる', async () => {
      // API呼び出しが失敗した場合をモック
      fetchWithAuth.mockRejectedValue(new Error('API Error'));

      render(<Header />);

      // ログイン前のメニューが表示されることを確認
      await waitFor(() => {
        const hamburgerButton = screen.getByRole('button');
        fireEvent.click(hamburgerButton);
        
        expect(screen.getByText('ログイン')).toBeInTheDocument();
        expect(screen.queryByText('退会')).not.toBeInTheDocument();
      });
    });
  });
});