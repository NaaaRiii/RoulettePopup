import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../../components/Header';

// Next.js の useRouter のモック
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// AWS Amplify の useAuthenticator のモック
const mockUseAuthenticator = jest.fn();
const mockSignOut = jest.fn();
jest.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: () => mockUseAuthenticator(),
}));

describe('Header コンポーネント', () => {
  beforeEach(() => {
    // デフォルトは未ログイン状態
    mockUseAuthenticator.mockReturnValue({
      route: 'unauthenticated',
      user: null,
      signOut: mockSignOut,
    });
    // モックのリセット
    jest.clearAllMocks();
  });

  it('flex_header クラスを持つ要素が存在すること', () => {
    render(<Header />);
    const headerElement = screen.getByText('Plus ONE').closest('.flex_header');
    expect(headerElement).toBeInTheDocument();
  });

  it('ロゴ(Plus ONE)が正しく表示されていること', () => {
    render(<Header />);
    expect(screen.getByText('Plus ONE')).toBeInTheDocument();
  });

  it('ロゴのリンク先が /dashboard であること', () => {
    render(<Header />);
    const logoLink = screen.getByText('Plus ONE').closest('a');
    expect(logoLink).toHaveAttribute('href', '/dashboard');
  });

  describe('認証状態の管理', () => {
    it('useAuthenticator フックが正しく使用されていること', () => {
      render(<Header />);
      expect(mockUseAuthenticator).toHaveBeenCalled();
    });

    it('route、user、signOut が正しく取得されていること', () => {
      const mockUser = { username: 'testuser' };
      mockUseAuthenticator.mockReturnValue({
        route: 'authenticated',
        user: mockUser,
        signOut: mockSignOut,
      });

      render(<Header />);
      
      // コンポーネントが正しい値を取得していることを確認
      expect(screen.getByText('You are Logged In')).toBeInTheDocument();
      expect(screen.getByText('Log out')).toBeInTheDocument();
    });

    it('isLoggedIn の判定が正しく機能すること', () => {
      // 未ログイン状態
      mockUseAuthenticator.mockReturnValue({
        route: 'unauthenticated',
        user: null,
        signOut: mockSignOut,
      });
      const { rerender } = render(<Header />);
      expect(screen.getByText('使い方')).toBeInTheDocument();
      expect(screen.getByText('お試し')).toBeInTheDocument();
      expect(screen.getByText('ログイン')).toBeInTheDocument();
      expect(screen.queryByText('You are Logged In')).not.toBeInTheDocument();

      // ログイン状態
      mockUseAuthenticator.mockReturnValue({
        route: 'authenticated',
        user: { username: 'testuser' },
        signOut: mockSignOut,
      });
      rerender(<Header />);
      expect(screen.getByText('You are Logged In')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('How to Use')).toBeInTheDocument();
      expect(screen.getByText('Log out')).toBeInTheDocument();
      expect(screen.queryByText('お試し')).not.toBeInTheDocument();
      expect(screen.queryByText('ログイン')).not.toBeInTheDocument();
      expect(screen.queryByText('使い方')).not.toBeInTheDocument();
    });
  });

  describe('未ログイン状態', () => {
    beforeEach(() => {
      render(<Header />);
    });

    it('使い方、お試し、ログイン リンクが表示されること', () => {
      const howToLink = screen.getByText('使い方');
      const trialLink = screen.getByText('お試し');
      const loginLink = screen.getByText('ログイン');

      expect(howToLink).toBeInTheDocument();
      expect(howToLink).toHaveAttribute('href', '/dashboard');

      expect(trialLink).toBeInTheDocument();
      expect(trialLink).toHaveAttribute('href', '/signup');

      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('ログイン状態', () => {
    beforeEach(() => {
      mockUseAuthenticator.mockReturnValue({
        route: 'authenticated',
        user: { username: 'testuser' },
        signOut: mockSignOut,
      });
      render(<Header />);
    });

    it('ログイン状態の要素が表示されること', () => {
      // "You are Logged In" テキストの確認
      expect(screen.getByText('You are Logged In')).toBeInTheDocument();

      // Dashboard リンクの確認
      const dashboardLink = screen.getByText('Dashboard');
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');

      // How to Use リンクの確認
      const howToUseLink = screen.getByText('How to Use');
      expect(howToUseLink).toBeInTheDocument();
      expect(howToUseLink).toHaveAttribute('href', '/dashboard');

      // Log out リンクの確認
      expect(screen.getByText('Log out')).toBeInTheDocument();
    });

    it('ログアウトリンクをクリックした時に適切な処理が実行されること', () => {
      const logoutLink = screen.getByText('Log out');

      // クリックイベントを発火し、デフォルトの動作を防止
      fireEvent.click(logoutLink, {
        preventDefault: () => {},
      });

      // signOut 関数が呼ばれること
      expect(mockSignOut).toHaveBeenCalled();

      // ルーターの push('/') が呼ばれること
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});
 