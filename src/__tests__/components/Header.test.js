import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../../components/Header';


const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockUseAuthenticator = jest.fn();
const mockSignOut = jest.fn();
jest.mock('@aws-amplify/ui-react', () => ({
  useAuthenticator: () => mockUseAuthenticator(),
}));

describe('Header コンポーネント', () => {
  beforeEach(() => {
    mockUseAuthenticator.mockReturnValue({
      route: 'unauthenticated',
      user: null,
      signOut: mockSignOut,
    });
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
      
      expect(screen.getByText('ログイン中')).toBeInTheDocument();
      expect(screen.getByText('ログアウト')).toBeInTheDocument();
    });

    it('isLoggedIn の判定が正しく機能すること', () => {
      mockUseAuthenticator.mockReturnValue({
        route: 'unauthenticated',
        user: null,
        signOut: mockSignOut,
      });
      const { rerender } = render(<Header />);
      expect(screen.getByText('使い方')).toBeInTheDocument();
      expect(screen.getByText('お試し')).toBeInTheDocument();
      expect(screen.getByText('ログイン')).toBeInTheDocument();
      expect(screen.queryByText('ログイン中')).not.toBeInTheDocument();

      mockUseAuthenticator.mockReturnValue({
        route: 'authenticated',
        user: { username: 'testuser' },
        signOut: mockSignOut,
      });
      rerender(<Header />);
      expect(screen.getByText('ログイン中')).toBeInTheDocument();
      expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
      expect(screen.getByText('使い方')).toBeInTheDocument();
      expect(screen.getByText('ログアウト')).toBeInTheDocument();
      expect(screen.queryByText('お試し')).not.toBeInTheDocument();
      expect(screen.queryByText('ログイン')).not.toBeInTheDocument();
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
      expect(howToLink).toHaveAttribute('href', 'https://qiita.com/NaaaRiii/items/b79753445554530fafd7');

      expect(trialLink).toBeInTheDocument();
      expect(trialLink).toHaveAttribute('href', '/guest-signin');

      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/dashboard');
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
      expect(screen.getByText('ログイン中')).toBeInTheDocument();

      const dashboardLink = screen.getByText('ダッシュボード');
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');

      const howToUseLink = screen.getByText('使い方');
      expect(howToUseLink).toBeInTheDocument();
      expect(howToUseLink).toHaveAttribute('href', 'https://qiita.com/NaaaRiii/items/b79753445554530fafd7');

      expect(screen.getByText('ログアウト')).toBeInTheDocument();
    });

    it('ログアウトリンクをクリックした時に適切な処理が実行されること', async () => {
      const logoutLink = screen.getByText('ログアウト');

      fireEvent.click(logoutLink, {
        preventDefault: () => {},
      });

      expect(mockSignOut).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });
});
 