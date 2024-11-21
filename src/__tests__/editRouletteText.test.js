import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditRouletteText from '../pages/edit-roulette-text';
import { TicketsContext } from '../contexts/TicketsContext';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import '@testing-library/jest-dom';

// `next/router` のモック
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// `useAuth` のモック
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// `useFetchRouletteTexts` のモック
jest.mock('../hooks/useFetchRouletteTexts', () => {
  const React = require('react');
  return {
    useFetchRouletteTexts: () => {
      const [rouletteTexts, setRouletteTexts] = React.useState([
        { id: 1, number: 1, text: 'Prize 1' },
        { id: 2, number: 2, text: 'Prize 2' },
      ]);
      return { rouletteTexts, setRouletteTexts };
    },
  };
});

// `withAuth` HOC のモック
jest.mock('../utils/withAuth', () => (Component) => Component);

const fetchTicketsMock = jest.fn();

// `TestWrapper` コンポーネントを修正して `fetchTicketsMock` に実装を追加
const TestWrapper = ({ children }) => {
  const [playTickets, setPlayTickets] = React.useState(5);
  const [editTickets, setEditTickets] = React.useState(2);

  // `fetchTicketsMock` の実装を設定
  React.useEffect(() => {
    fetchTicketsMock.mockImplementation(() => {
      setEditTickets((prev) => prev - 1); // 編集チケットを1減少
    });
  }, []);

  return (
    <TicketsContext.Provider value={{ playTickets, editTickets, fetchTickets: fetchTicketsMock }}>
      {children}
    </TicketsContext.Provider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();

  // `useRouter` のモック実装
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

  // `useAuth` のモック実装
  useAuth.mockImplementation(() => ({
    isLoggedIn: true,
    userRank: 20,
    setUserRank: jest.fn(),
    setIsLoggedIn: jest.fn(),
  }));
});

// `fetch` のモック設定
global.fetch = jest.fn((url, options) => {
  const parsedUrl = new URL(url, 'http://localhost');

  if (parsedUrl.pathname === '/api/roulette_texts') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([
        { id: 1, number: 1, text: 'Prize 1' },
        { id: 2, number: 2, text: 'Prize 2' },
      ]),
    });
  }

  // PATCH リクエストの処理を追加
  if (parsedUrl.pathname === '/api/roulette_texts/1' && options.method === 'PATCH') {
    const requestBody = JSON.parse(options.body);
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        roulette_text: {
          id: 1,
          number: 1,
          text: requestBody.roulette_text.text,
        },
      }),
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
        rank: 10,
      }),
    });
  }

  // 他のエンドポイントが必要な場合はここに追加
  console.error('Unknown endpoint:', url);
  return Promise.reject(new Error('Unknown endpoint'));
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

      const editTicketsText = await screen.findByTestId('edit-tickets');
      expect(editTicketsText).toHaveTextContent('編集チケットを『2』枚持っています。');
    });

    it('updates the displayed playTickets and editTickets when context values change', async () => {
      const { rerender } = render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      const initialPlayTickets = await screen.findByTestId('play-tickets');
      const initialEditTickets = await screen.findByTestId('edit-tickets');

      expect(initialPlayTickets).toHaveTextContent('プレイチケットを『5』枚持っています。');
      expect(initialEditTickets).toHaveTextContent('編集チケットを『2』枚持っています。');

      const updatedTicketsContextValue = {
        playTickets: 3,
        editTickets: 4,
        fetchTickets: jest.fn(),
      };

      rerender(
        <TicketsContext.Provider value={updatedTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

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

      const rouletteTextList = await screen.findByTestId('roulette-text-list');
      expect(rouletteTextList).toBeInTheDocument();
    });

    it('displays the correct number of roulette texts', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      const rouletteTextItems = await screen.findAllByTestId(/roulette-text-item-\d+/);
      expect(rouletteTextItems).toHaveLength(2);
    });

    it('displays each roulette text correctly', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      const rouletteTextItem1 = await screen.findByTestId('roulette-text-item-1');
      const rouletteTextItem2 = await screen.findByTestId('roulette-text-item-2');

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

      const editButton = await screen.findByText('ルーレットを編集する');
      expect(editButton).toBeInTheDocument();
    });

    it('does not display the "ルーレットを編集する" button when editTickets <= 0', async () => {
      const mockTicketsContextValueZero = {
        playTickets: 5,
        editTickets: 0,
        fetchTickets: jest.fn(),
      };

      render(
        <TicketsContext.Provider value={mockTicketsContextValueZero}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      const editButton = screen.queryByText('ルーレットを編集する');
      expect(editButton).not.toBeInTheDocument();
    });

    it('does not display the "ルーレットを編集する" button when showForm is true', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      const editButton = await screen.findByText('ルーレットを編集する');
      expect(editButton).toBeInTheDocument();

      userEvent.click(editButton);

      await waitFor(() => {
        const editButtonAfterClick = screen.queryByText('ルーレットを編集する');
        expect(editButtonAfterClick).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Form', () => {
    it('includes necessary elements in the edit form', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      const editButton = await screen.findByText('ルーレットを編集する');
      userEvent.click(editButton);

      const form = await screen.findByTestId('edit-roulette-text-form');
      expect(form).toBeInTheDocument();
    });

    it('contains a number select box and a text input field', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      const editButton = await screen.findByText('ルーレットを編集する');
      userEvent.click(editButton);

      const numberSelect = await screen.findByLabelText('編集したい数字を選んでください。');
      expect(numberSelect).toBeInTheDocument();

      const textInput = await screen.findByLabelText('Edit text');
      expect(textInput).toBeInTheDocument();
    });
  });

  describe('Edit Form Interaction', () => {
    it('sets the corresponding text when a number is selected', async () => {
      render(
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      );

      const editButton = await screen.findByText('ルーレットを編集する');
      userEvent.click(editButton);

      const numberSelect = await screen.findByLabelText('編集したい数字を選んでください。');

      userEvent.selectOptions(numberSelect, '1');

      const textInput = screen.getByLabelText('Edit text');

      await waitFor(() => expect(textInput).toHaveValue('Prize 1'));

      userEvent.selectOptions(numberSelect, '2');

      await waitFor(() => expect(textInput).toHaveValue('Prize 2'));
    });
  });

  describe('Form Submission', () => {
    it('edits the text and submits the form correctly', async () => {
      jest.spyOn(window, 'confirm').mockImplementation(() => true);
  
      render(
        <TestWrapper>
          <EditRouletteText />
        </TestWrapper>
      );
  
      const editButton = await screen.findByText('ルーレットを編集する');
      userEvent.click(editButton);
  
      const numberSelect = await screen.findByLabelText('編集したい数字を選んでください。');
      userEvent.selectOptions(numberSelect, '1');
  
      const textInput = screen.getByLabelText('Edit text');
      await waitFor(() => expect(textInput).toHaveValue('Prize 1'));
  
      userEvent.clear(textInput);
      await userEvent.type(textInput, 'Updated Prize 1');
  
      const submitButton = screen.getByText('内容を保存する');
      userEvent.click(submitButton);
  
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/roulette_texts/1',
          expect.objectContaining({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              roulette_text: { text: 'Updated Prize 1' },
            }),
          })
        );
      });
  
      window.confirm.mockRestore();
    });
  
    it('updates the rouletteTexts state correctly after editing', async () => {
      jest.spyOn(window, 'confirm').mockImplementation(() => true);
  
      render(
        <TestWrapper>
          <EditRouletteText />
        </TestWrapper>
      );
  
      const editButton = await screen.findByText('ルーレットを編集する');
      userEvent.click(editButton);
  
      const numberSelect = await screen.findByLabelText('編集したい数字を選んでください。');
      userEvent.selectOptions(numberSelect, '1');
  
      const textInput = screen.getByLabelText('Edit text');
      await waitFor(() => expect(textInput).toHaveValue('Prize 1'));
  
      userEvent.clear(textInput);
      await userEvent.type(textInput, 'Updated Prize 1');
  
      const submitButton = screen.getByText('内容を保存する');
      userEvent.click(submitButton);
  
      await waitFor(() => {
        expect(screen.getByText('Updated Prize 1')).toBeInTheDocument();
      });
  
      expect(screen.queryByText('Prize 1')).not.toBeInTheDocument();
  
      window.confirm.mockRestore();
    });
  
    it('decreases the editTickets count by one after successful edit', async () => {
      // window.confirm をモックして常に true を返すように設定
      jest.spyOn(window, 'confirm').mockImplementation(() => true);

      render(
        <TestWrapper>
          <EditRouletteText />
        </TestWrapper>
      );

      const editTicketsText = await screen.findByTestId('edit-tickets');
      expect(editTicketsText).toHaveTextContent('編集チケットを『2』枚持っています。');

      const editButton = await screen.findByText('ルーレットを編集する');
      userEvent.click(editButton);

      const numberSelect = await screen.findByLabelText('編集したい数字を選んでください。');
      userEvent.selectOptions(numberSelect, '1');

      const textInput = screen.getByLabelText('Edit text');
      await waitFor(() => expect(textInput).toHaveValue('Prize 1'));

      userEvent.clear(textInput);
      await userEvent.type(textInput, 'Updated Prize 1');

      const submitButton = screen.getByText('内容を保存する');
      userEvent.click(submitButton);

      await waitFor(() => {
        const updatedEditTicketsText = screen.getByTestId('edit-tickets');
        expect(updatedEditTicketsText).toHaveTextContent('編集チケットを『1』枚持っています。');
      });

      window.confirm.mockRestore();
    });
  });

  it('displays a flash message after successful edit', async () => {
    // window.confirm をモックして常に true を返すように設定
    jest.spyOn(window, 'confirm').mockImplementation(() => true);

    render(
      <TestWrapper>
        <EditRouletteText />
      </TestWrapper>
    );

    // "ルーレットを編集する" ボタンをクリックしてフォームを表示
    const editButton = await screen.findByText('ルーレットを編集する');
    userEvent.click(editButton);

    // セレクトボックスを取得して数字「1」を選択
    const numberSelect = await screen.findByLabelText('編集したい数字を選んでください。');
    userEvent.selectOptions(numberSelect, '1');

    // テキスト入力フィールドを取得
    const textInput = screen.getByLabelText('Edit text');

    // テキストフィールドが 'Prize 1' に更新されるのを待つ
    await waitFor(() => expect(textInput).toHaveValue('Prize 1'));

    // テキストフィールドをクリア
    userEvent.clear(textInput);

    // 新しい値を入力
    await userEvent.type(textInput, 'Updated Prize 1');

    // テキストフィールドの値が更新されたことを確認
    await waitFor(() => {
      expect(textInput).toHaveValue('Updated Prize 1');
    });

    // フォームを送信
    const submitButton = screen.getByText('内容を保存する');
    userEvent.click(submitButton);

    // fetch がPATCHメソッドで正しいURLに呼び出されたことを確認
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/roulette_texts/1',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            roulette_text: { text: 'Updated Prize 1' },
          }),
        })
      );
    });

    // `fetchTickets` が呼び出されたことを確認
    expect(fetchTicketsMock).toHaveBeenCalled();

    // 編集チケットが1減少していることを確認
    await waitFor(() => {
      const editTicketsText = screen.getByTestId('edit-tickets');
      expect(editTicketsText).toHaveTextContent('編集チケットを『1』枚持っています。');
    });

    // 更新後のテキストが表示されていることを確認
    await waitFor(() => {
      expect(screen.getByText('Updated Prize 1')).toBeInTheDocument();
    });

    // フラッシュメッセージが表示されていることを確認
    await waitFor(() => {
      const flashMessage = screen.getByText('Number: 1 を Updated Prize 1 に変更しました。');
      expect(flashMessage).toBeInTheDocument();
    });

    // window.confirm のモックを元に戻す
    window.confirm.mockRestore();
  });

});