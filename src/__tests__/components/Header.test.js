import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../../components/Header';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

const mockUseAuthenticator = jest.fn();
const mockSignOut = jest.fn();
jest.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: () => mockUseAuthenticator(),
}));

jest.mock('../../utils/fetchWithAuth');
jest.mock('aws-amplify/auth', () => ({
  signOut: jest.fn(),
  updateUserAttributes: jest.fn(),
}));

describe('Header コンポーネント', () => {
  beforeEach(() => {
    mockUseAuthenticator.mockReturnValue({
      signOut: mockSignOut,
    });
    fetchWithAuth.mockReset();
    jest.clearAllMocks();
  });

  it('header要素が存在すること', async () => {
    fetchWithAuth.mockResolvedValue({ ok: false });
    render(<Header />);
    const headerElement = screen.getByRole('banner');
    expect(headerElement).toBeInTheDocument();
  });

  it('ロゴ(Plus ONE)が正しく表示されていること', async () => {
    fetchWithAuth.mockResolvedValue({ ok: false });
    render(<Header />);
    expect(screen.getByText('Plus ONE')).toBeInTheDocument();
  });

  it('ロゴのリンク先が /dashboard であること', async () => {
    fetchWithAuth.mockResolvedValue({ ok: false });
    render(<Header />);
    const logoLink = screen.getByText('Plus ONE').closest('a');
    expect(logoLink).toHaveAttribute('href', '/dashboard');
  });

  describe('認証状態の管理', () => {
    it('useAuthenticator フックが正しく使用されていること', async () => {
      fetchWithAuth.mockResolvedValue({ ok: false });
      render(<Header />);
      expect(mockUseAuthenticator).toHaveBeenCalled();
    });

    it('認証確認APIが呼び出されること', async () => {
      fetchWithAuth.mockResolvedValue({ ok: false });
      render(<Header />);
      await waitFor(() => {
        expect(fetchWithAuth).toHaveBeenCalledWith('/api/current_user');
      });
    });
  });

  describe('未ログイン状態', () => {
    beforeEach(() => {
      fetchWithAuth.mockResolvedValue({ ok: false });
    });

    it('使い方、サインイン、ログイン リンクが表示されること', async () => {
      render(<Header />);
      
      await waitFor(() => {
        const desktopNav = screen.getByRole('navigation');
        
        // デスクトップメニュー内の要素を確認
        const howToLink = screen.getByRole('link', { name: '使い方' });
        const signUpLink = screen.getByRole('link', { name: 'サインイン' });
        const loginLink = screen.getByRole('link', { name: 'ログイン' });

        expect(howToLink).toBeInTheDocument();
        expect(howToLink).toHaveAttribute('href', 'https://qiita.com/NaaaRiii/items/b79753445554530fafd7');

        expect(signUpLink).toBeInTheDocument();
        expect(signUpLink).toHaveAttribute('href', '/login?tab=signUp');

        expect(loginLink).toBeInTheDocument();
        expect(loginLink).toHaveAttribute('href', '/login');
      });
    });
  });

  describe('ログイン状態', () => {
    beforeEach(() => {
      fetchWithAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 1,
          name: 'テストユーザー',
          email: 'test@example.com',
          is_guest: false
        })
      });
    });

    it('ハンバーガーメニューがログイン状態で表示されること', async () => {
      render(<Header />);
      
      await waitFor(() => {
        // ハンバーガーメニューボタンが表示されること
        const hamburgerButtons = screen.getAllByRole('button');
        expect(hamburgerButtons.length).toBeGreaterThan(0);
      });
    });

    it('ハンバーガーメニューをクリックするとメニューが開くこと', async () => {
      render(<Header />);
      
      await waitFor(() => {
        const hamburgerButtons = screen.getAllByRole('button');
        const hamburgerButton = hamburgerButtons[0]; // 最初のボタン（ハンバーガー）
        fireEvent.click(hamburgerButton);
        
        // メニューアイテムが表示されること
        expect(screen.getByRole('link', { name: 'ダッシュボード' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '退会' })).toBeInTheDocument();
      });
    });

    it('通常ユーザーの場合、退会ボタンが表示されること', async () => {
      render(<Header />);
      
      await waitFor(() => {
        const hamburgerButtons = screen.getAllByRole('button');
        const hamburgerButton = hamburgerButtons[0];
        fireEvent.click(hamburgerButton);
        
        expect(screen.getByRole('button', { name: '退会' })).toBeInTheDocument();
      });
    });
  });

  describe('ゲスト制限機能', () => {
    it('ゲストユーザーの場合、退会ボタンが表示されないこと', async () => {
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
      
      await waitFor(() => {
        const hamburgerButtons = screen.getAllByRole('button');
        const hamburgerButton = hamburgerButtons[0];
        fireEvent.click(hamburgerButton);
        
        // 他のメニューアイテムは表示されるが、退会ボタンは表示されない
        expect(screen.getByRole('link', { name: 'ダッシュボード' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '退会' })).not.toBeInTheDocument();
      });
    });
  });
});