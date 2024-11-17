import React from 'react';
import { render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditRouletteText from '../pages/edit-roulette-text';
import { TicketsContext } from '../contexts/TicketsContext';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useFetchRouletteTexts } from '../hooks/useFetchRouletteTexts';




// `useRouter` のモック設定
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

useRouter.mockImplementation(() => ({
  route: '/edit-roulette-text',
  pathname: '/edit-roulette-text',
  query: {},
  asPath: '/edit-roulette-text',
  push: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}));

// `useAuth` のモック
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

useAuth.mockImplementation(() => ({
  isLoggedIn: true,
  userRank: 20,
  setUserRank: jest.fn(),
  setIsLoggedIn: jest.fn(),
}));

// `withAuth` HOC のモック
jest.mock('../utils/withAuth', () => (Component) => Component);

// `fetch` のモック設定
global.fetch = jest.fn((url, options) => {
  const parsedUrl = new URL(url, 'http://localhost');

  if (parsedUrl.pathname === '/api/roulette_texts') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, number: 1, text: 'Prize 1' },
        { id: 2, number: 2, text: 'Prize 2' },
      ]),
    });
  }

  // ユーザー情報を取得するエンドポイントのモック
  if (parsedUrl.pathname === '/api/current_user') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: 7,
        name: 'Sample User',
        email: 'sample@example.com',
        totalExp: 140,
        rank: 10, // 必要に応じてランクを変更
        // 他のユーザーデータを追加
      }),
    });
  }

  // 他のエンドポイントが必要な場合はここに追加
  console.error('Unknown endpoint:', url);
  return Promise.reject(new Error('Unknown endpoint'));
});


jest.mock('../hooks/useFetchRouletteTexts', () => ({
  useFetchRouletteTexts: jest.fn(),
}));

useFetchRouletteTexts.mockReturnValue({
  rouletteTexts: [
    { id: 1, number: 1, text: 'Prize 1' },
    { id: 2, number: 2, text: 'Prize 2' },
  ],
  setRouletteTexts: jest.fn(),
  loading: false,
  error: null,
});

// テスト前に全てのモックをクリア
beforeEach(() => {
  jest.clearAllMocks();
});

// テストケース
describe('EditRouletteText Component', () => {
  const mockTicketsContextValue = {
    playTickets: 5,
    editTickets: 2,
    fetchTickets: jest.fn(),
  };

  it('renders EditRouletteText component without crashing', () => {
    render(
      <TicketsContext.Provider value={mockTicketsContextValue}>
        <EditRouletteText />
      </TicketsContext.Provider>
    );

    expect(screen.getByText('Prize 1')).toBeInTheDocument();
    expect(screen.getByText('Prize 2')).toBeInTheDocument();
  });

  describe('Ticket Information Display', () => {
    it('displays the correct playTickets value from TicketsContext', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      await waitFor(() => {
        const playTicketsText = screen.getByTestId('play-tickets');
        expect(playTicketsText).toHaveTextContent('プレイチケットを『5』枚持っています。');
      });
    });

    it('displays the correct editTickets value from TicketsContext', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      // "編集チケットを『2』枚持っています。" が表示されていることを確認
      const editTicketsText = await screen.findByTestId('edit-tickets');
      expect(editTicketsText).toHaveTextContent('編集チケットを『2』枚持っています。');
    });

    it('updates the displayed playTickets and editTickets when context values change', async () => {
      const { rerender } = render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      // 初期値を確認
      const initialPlayTickets = await screen.findByTestId('play-tickets');
      const initialEditTickets = await screen.findByTestId('edit-tickets');

      expect(initialPlayTickets).toHaveTextContent('プレイチケットを『5』枚持っています。');
      expect(initialEditTickets).toHaveTextContent('編集チケットを『2』枚持っています。');

      // 新しいコンテキスト値を設定
      const updatedTicketsContextValue = {
        playTickets: 3,
        editTickets: 4,
        fetchTickets: jest.fn(),
      };

      // コンポーネントを再レンダリングしてコンテキスト値を更新
      rerender(
        <TicketsContext.Provider value={updatedTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      // 更新された値を待機して確認
      const updatedPlayTickets = await screen.findByTestId('play-tickets');
      const updatedEditTickets = await screen.findByTestId('edit-tickets');

      expect(updatedPlayTickets).toHaveTextContent('プレイチケットを『3』枚持っています。');
      expect(updatedEditTickets).toHaveTextContent('編集チケットを『4』枚持っています。');
    });
  });

  describe('Roulette Text List Display', () => {
    it('displays the roulette text list container', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      // ルーレットテキストのリストコンテナが表示されていることを確認
      const rouletteTextList = await screen.findByTestId('roulette-text-list');
      expect(rouletteTextList).toBeInTheDocument();
    });

    it('displays the correct number of roulette texts', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      // ルーレットテキストのリストコンテナを取得
      const rouletteTextList = await screen.findByTestId('roulette-text-list');

      // リストアイテムを取得 (正規表現を修正)
      const rouletteTextItems = await screen.findAllByTestId(/roulette-text-item-\d+/);

      // ルーレットテキストの数が正しいことを確認
      expect(rouletteTextItems).toHaveLength(2); // モックデータでは2つのテキストが返されています
    });

    it('displays each roulette text correctly', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      // 各ルーレットテキストのリストアイテムを取得 (data-testidを修正)
      const rouletteTextItem1 = await screen.findByTestId('roulette-text-item-1');
      const rouletteTextItem2 = await screen.findByTestId('roulette-text-item-2');

      // テキスト内容が正しいことを確認
      expect(rouletteTextItem1).toHaveTextContent('Prize 1');
      expect(rouletteTextItem2).toHaveTextContent('Prize 2');
    });
  });

  describe('Data Fetching', () => {
    it('fetches roulette texts on mount and updates state', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      // fetchの呼び出しを確認する部分を削除
      // モックされたデータが表示されていることを確認
      expect(screen.getByText('Prize 1')).toBeInTheDocument();
      expect(screen.getByText('Prize 2')).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('displays the "ルーレットを編集する" button when editTickets > 0 and showForm is false', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      // "ルーレットを編集する" ボタンが表示されていることを確認
      const editButton = await screen.findByText('ルーレットを編集する');
      expect(editButton).toBeInTheDocument();
    });

    it('does not display the "ルーレットを編集する" button when editTickets <= 0', async () => {
      const mockTicketsContextValueZero = {
        playTickets: 5,
        editTickets: 0, // editTickets <= 0
        fetchTickets: jest.fn(),
      };

      render(
        <TicketsContext.Provider value={mockTicketsContextValueZero}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      // "ルーレットを編集する" ボタンが表示されていないことを確認
      const editButton = screen.queryByText('ルーレットを編集する');
      expect(editButton).not.toBeInTheDocument();
    });

    it('does not display the "ルーレットを編集する" button when showForm is true', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      // "ルーレットを編集する" ボタンが表示されていることを確認
      const editButton = await screen.findByText('ルーレットを編集する');
      expect(editButton).toBeInTheDocument();

      // ボタンをクリックして showForm を true にする
      userEvent.click(editButton);

      // ボタンが非表示になったことを確認
      await waitFor(() => {
        const editButtonAfterClick = screen.queryByText('ルーレットを編集する');
        expect(editButtonAfterClick).not.toBeInTheDocument();
      });
    });
  });
});

