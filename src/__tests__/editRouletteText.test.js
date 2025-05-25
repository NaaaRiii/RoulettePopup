import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditRouletteText from '../pages/edit-roulette-text';
import { TicketsContext } from '../contexts/TicketsContext';
import { useRouter } from 'next/router';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Authenticator } from '@aws-amplify/ui-react';
import '@testing-library/jest-dom';

// `next/router` のモック
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockRouletteTexts = [
  { id: 1, number: 1, text: 'Prize 1' },
  { id: 2, number: 2, text: 'Prize 2' },
];

// `useFetchRouletteTexts` のモック
jest.mock('../hooks/useFetchRouletteTexts', () => {
  const React = require('react');
  return {
    useFetchRouletteTexts: () => {
      const [rouletteTexts, setRouletteTexts] = React.useState(mockRouletteTexts);
      return { rouletteTexts, setRouletteTexts };
    },
  };
});

//jest.mock('../utils/fetchWithAuth');
jest.mock('../utils/fetchWithAuth', () => {
  const fetchWithAuth = jest.fn(async (url, opts = {}) => {
    /* 1) マージ */
    const merged = {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    };

    /* 2) ここで global.fetch を呼ぶ -------------- */
    return global.fetch(url, merged);
  });

  return { __esModule: true, default: fetchWithAuth, fetchWithAuth };
});

jest.mock('../utils/getIdToken');

const fetchTicketsMock = jest.fn();

// `TestWrapper` コンポーネントを修正して `fetchTicketsMock` に実装を追加
const TestWrapper = ({ children }) => {
  const [playTickets, setPlayTickets] = React.useState(5);
  const [editTickets, setEditTickets] = React.useState(2);

  // `fetchTicketsMock` の実装を設定
  React.useEffect(() => {
    fetchTicketsMock.mockReset();
    fetchTicketsMock.mockImplementation(() =>
      setEditTickets(prev => prev - 1)
    );
  }, []);

  return (
    <TicketsContext.Provider
      value={{ playTickets, setPlayTickets, editTickets, fetchTickets: fetchTicketsMock }}
    >
      {children}
    </TicketsContext.Provider>
  );
};

beforeEach(() => {
  //jest.clearAllMocks();

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
});

beforeAll(() => {
  // window.alert をモック
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

afterAll(() => {
  // モックを元に戻す
  window.alert.mockRestore();
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
      status: 200,
      json: () => Promise.resolve({
        id: 7,
        name: 'Sample User',
        email: 'sample@example.com',
        totalExp: 140,
        rank: 10,
      }),
    });
  }

  if (parsedUrl.pathname === '/api/roulette_texts/spin' && options.method === 'PATCH') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        play_tickets: 4, // プレイチケットの残数を適切に設定
      }),
    });
  }

  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  });
});

// テストケース
describe('EditRouletteText Component', () => {
  const mockTicketsContextValue = {
    playTickets: 5,
    setPlayTickets: jest.fn(),
    editTickets: 2,
    fetchTickets: jest.fn(),
  };

  it('renders EditRouletteText component without crashing', () => {
    render(
      <Authenticator.Provider>
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <EditRouletteText />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    expect(screen.getByText('Prize 1')).toBeInTheDocument();
    expect(screen.getByText('Prize 2')).toBeInTheDocument();
  });

  describe('Ticket Information Display', () => {
    it('displays the correct playTickets value from TicketsContext', async () => {
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );

      await waitFor(() => {
        const playTicketsText = screen.getByTestId('play-tickets');
        expect(playTicketsText).toHaveTextContent('プレイチケットを『5』枚持っています。');
      });
    });

    it('displays the correct editTickets value from TicketsContext', async () => {
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );

      const editTicketsText = await screen.findByTestId('edit-tickets');
      expect(editTicketsText).toHaveTextContent('編集チケットを『2』枚持っています。');
    });

    it('updates the displayed playTickets and editTickets when context values change', async () => {
      const { rerender } = render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
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
        <Authenticator.Provider>
          <TicketsContext.Provider value={updatedTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
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
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );

      const rouletteTextList = await screen.findByTestId('roulette-text-list');
      expect(rouletteTextList).toBeInTheDocument();
    });

    it('displays the correct number of roulette texts', async () => {
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );

      const rouletteTextItems = await screen.findAllByTestId(/roulette-text-item-\d+/);
      expect(rouletteTextItems).toHaveLength(2);
    });

    it('displays each roulette text correctly', async () => {
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );

      const rouletteTextItem1 = await screen.findByTestId('roulette-text-item-1');
      const rouletteTextItem2 = await screen.findByTestId('roulette-text-item-2');

      expect(rouletteTextItem1).toHaveTextContent('Prize 1');
      expect(rouletteTextItem2).toHaveTextContent('Prize 2');
    });

    it('displays the correct image for each roulette text item', async () => {
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );
  
      // ルーレットテキスト項目を取得
      const rouletteTextItems = await screen.findAllByTestId(/roulette-text-item-\d+/);
  
      expect(rouletteTextItems).toHaveLength(2); // テストデータに合わせて調整
  
      // 各項目を検証
      for (const item of rouletteTextItems) {
        // data-testid から番号を取得
        const testId = item.getAttribute('data-testid');
        const match = testId.match(/roulette-text-item-(\d+)/);
        const id = match ? parseInt(match[1], 10) : null;
  
        expect(id).not.toBeNull();
  
        // ルーレットテキストを取得して対応する番号を取得
        const rouletteText = mockRouletteTexts.find(text => text.id === id);
        const number = rouletteText.number;
  
        // 画像を取得
        const image = within(item).getByAltText(`Roulette Image ${number}`);
        expect(image).toBeInTheDocument();
  
        // src 属性を検証
        expect(image).toHaveAttribute('src', `/images/${number}.jpeg`);
      }
    });
  });

  describe('Data Fetching', () => {
    it('fetches roulette texts on mount and updates state', async () => {
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );

      expect(screen.getByText('Prize 1')).toBeInTheDocument();
      expect(screen.getByText('Prize 2')).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('displays the "ルーレットを編集する" button when editTickets > 0 and showForm is false', async () => {
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
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
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValueZero}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );

      const editButton = screen.queryByText('ルーレットを編集する');
      expect(editButton).not.toBeInTheDocument();
    });

    it('does not display the "ルーレットを編集する" button when showForm is true', async () => {
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
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
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );

      const editButton = await screen.findByText('ルーレットを編集する');
      userEvent.click(editButton);

      const form = await screen.findByTestId('edit-roulette-text-form');
      expect(form).toBeInTheDocument();
    });

    it('contains a number select box and a text input field', async () => {
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
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
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );

      const editButton = await screen.findByText('ルーレットを編集する');
      userEvent.click(editButton);

      const numberSelect = await screen.findByLabelText('編集したい数字を選んでください。');

      await userEvent.selectOptions(numberSelect, '1');

      const textInput = screen.getByLabelText('Edit text');

      await waitFor(() => expect(textInput).toHaveValue('Prize 1'));

      await userEvent.selectOptions(numberSelect, '2');

      await waitFor(() => expect(textInput).toHaveValue('Prize 2'));
    });
  });

  describe('Form Submission', () => {
    it('edits the text and submits the form correctly', async () => {
      jest.spyOn(window, 'confirm').mockImplementation(() => true);
  
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
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
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
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
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
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
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    global.fetch.mockClear();
  
    render(
      <Authenticator.Provider>
        <TestWrapper>
          <EditRouletteText />
        </TestWrapper>
      </Authenticator.Provider>
    );
  
    // フォームを開く
    await userEvent.click(await screen.findByText('ルーレットを編集する'));
  
    // 数字選択して初期値が入るまで待つ
    const numberSelect = await screen.findByLabelText('編集したい数字を選んでください。');
    userEvent.selectOptions(numberSelect, '1');
    const textInput = screen.getByLabelText('Edit text');
    await waitFor(() => expect(textInput).toHaveValue('Prize 1'));
  
    // 新しいテキストを入れて
    await userEvent.clear(textInput);
    await userEvent.type(textInput, 'Updated Prize 1');
  
    // 送信→PATCH
    userEvent.click(screen.getByText('内容を保存する'));
  
    // ―― ① PATCH リクエストが行われたかを待機
    await waitFor(() => {
      const patchCall = global.fetch.mock.calls.find(([url, opts]) =>
        url.endsWith('/api/roulette_texts/1') &&
        opts.method === 'PATCH'
      );
      expect(patchCall).toBeDefined();
      
      const [, options] = patchCall;
      expect(options).toMatchObject({
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roulette_text: { text: 'Updated Prize 1' } }),
      });
    });
  
    await waitFor(() => {
      expect(fetchTicketsMock).toHaveBeenCalled();
      expect(screen.getByTestId('edit-tickets')).toHaveTextContent('編集チケットを『1』枚持っています。');
      expect(screen.getByText('Number: 1 を Updated Prize 1 に変更しました。')).toBeInTheDocument();
    });
  
    window.confirm.mockRestore();
  });

  describe('Insufficient Edit Tickets', () => {
    it('does not display the edit button when editTickets <= 0', async () => {
      const mockTicketsContextValueZero = {
        playTickets: 5,
        editTickets: 0,
        fetchTickets: jest.fn(),
      };
      
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValueZero}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );
      
      // "ルーレットを編集する" ボタンが存在しないことを確認
      const editButton = screen.queryByText('ルーレットを編集する');
      expect(editButton).not.toBeInTheDocument();
    });
  });
  
  describe('Cancel Button Functionality', () => {
    it('closes the edit form when the "Cancel" button is clicked', async () => {
      // window.confirm をモックして常に true を返すように設定
      jest.spyOn(window, 'confirm').mockImplementation(() => true);
  
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
  
      // "ルーレットを編集する" ボタンをクリックしてフォームを表示
      const editButton = await screen.findByText('ルーレットを編集する');
      userEvent.click(editButton);
  
      // 編集フォームが表示されていることを確認
      const editForm = await screen.findByTestId('edit-roulette-text-form');
      expect(editForm).toBeInTheDocument();
  
      // 「キャンセル」ボタンを取得してクリック
      const cancelButton = screen.getByText('キャンセル');
      userEvent.click(cancelButton);
  
      // 編集フォームが閉じていることを確認
      await waitFor(() => {
        expect(screen.queryByTestId('edit-roulette-text-form')).not.toBeInTheDocument();
      });
  
      // window.confirm のモックを元に戻す
      window.confirm.mockRestore();
    });
  });
  
  describe('RoulettePopup Rendering within EditRouletteText', () => {
    it('renders RoulettePopup component correctly within EditRouletteText', () => {
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );

      // RoulettePopup の主要な要素を確認
      const rouletteContainer = screen.getByTestId('roulette-container');
      expect(rouletteContainer).toBeInTheDocument();

      const rouletteWheel = screen.getByTestId('roulette-wheel');
      expect(rouletteWheel).toBeInTheDocument();

      const startButton = screen.getByTestId('start-button');
      expect(startButton).toBeInTheDocument();
      expect(startButton).toBeEnabled();

      // 12個のセグメントが存在することを確認
      for (let i = 1; i <= 12; i++) {
        const segment = screen.getByTestId(`segment-${i}`);
        expect(segment).toBeInTheDocument();
      }
    });
  });

  describe('Roulette Description Section', () => {
    it('displays the roulette description correctly in a list format', () => {
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );

      // ルーレット説明セクションの <ul> を取得
      const descriptionList = screen.getByTestId('roulette-description-list');
      expect(descriptionList).toBeInTheDocument();

      // <ul> 内のすべての <li> 要素を取得
      const listItems = descriptionList.querySelectorAll('li');
      expect(listItems).toHaveLength(4);

      // 各 <li> のテキストを確認
      expect(listItems[0]).toHaveTextContent('Rankが10上がるごとに、プレイチケットと編集チケットが付与されます。');
      expect(listItems[1]).toHaveTextContent('ルーレットを回すには、プレイチケットを1枚使用する必要があります。');
      expect(listItems[2]).toHaveTextContent('ルーレットの各テキストを編集するには、編集チケットを1枚使用する必要があります。');
      expect(listItems[3]).toHaveTextContent('各チケットの枚数は、左上に表示されています。');
    });
  });

  describe('TicketsContext Data Usage', () => {
    it('retrieves and displays playTickets and editTickets correctly', () => {
      render(
        <Authenticator.Provider>
          <TestWrapper playTickets={5} editTickets={2}>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );

      // playTickets の表示を確認
      const playTicketsElement = screen.getByTestId('play-tickets');
      expect(playTicketsElement).toBeInTheDocument();
      expect(playTicketsElement).toHaveTextContent('プレイチケットを『5』枚持っています。');

      // editTickets の表示を確認
      const editTicketsElement = screen.getByTestId('edit-tickets');
      expect(editTicketsElement).toBeInTheDocument();
      expect(editTicketsElement).toHaveTextContent('編集チケットを『2』枚持っています。');
    });

    it('verifies that tickets are consumed correctly and the display is updated accordingly', async () => {
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
  
      // 初期表示を確認
      const playTicketsElement = screen.getByTestId('play-tickets');
      const editTicketsElement = screen.getByTestId('edit-tickets');
      expect(playTicketsElement).toHaveTextContent('プレイチケットを『5』枚持っています。');
      expect(editTicketsElement).toHaveTextContent('編集チケットを『2』枚持っています。');
  
      userEvent.click(screen.getByRole('button', { name: /ルーレットを編集する/i }));
      await screen.findByTestId('edit-roulette-text-form');
    
      // セレクト→入力
      userEvent.selectOptions(screen.getByLabelText('編集したい数字を選んでください。'), '1');
      await waitFor(() => expect(screen.getByLabelText('Edit text')).toHaveValue('Prize 1'));
      await userEvent.clear(screen.getByLabelText('Edit text'));
      await userEvent.type(screen.getByLabelText('Edit text'), 'New Prize 1');
    
      jest.spyOn(window, 'confirm').mockImplementation(() => true);
    
      // **ここで global.fetch の履歴を消す！**
      global.fetch.mockClear();
    
      // 送信
      userEvent.click(screen.getByText('内容を保存する'));
    
      // 以降はその呼び出しだけを検証
      await waitFor(() => {
        const patchCall = global.fetch.mock.calls.find(
          ([url, opts]) =>
            url.endsWith('/api/roulette_texts/1') &&
            opts.method === 'PATCH'
        );
        expect(patchCall).toBeDefined();
        const [, options] = patchCall;
        expect(options).toMatchObject({
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roulette_text: { text: 'New Prize 1' } }),
        });
      });
    
      window.confirm.mockRestore();
    });

  });

  describe('Form Input State Updates', () => {
    it('updates state variables when select box and input field values change', async () => {
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
  
      // 編集フォームを表示
      const editButton = await screen.findByText('ルーレットを編集する');
      userEvent.click(editButton);
  
      // セレクトボックスと入力フィールドを取得
      const numberSelect = await screen.findByLabelText('編集したい数字を選んでください。');
      const textInput = screen.getByLabelText('Edit text');
  
      // 初期状態の確認
      expect(numberSelect).toHaveValue('');
      expect(textInput).toHaveValue('');
  
      // セレクトボックスで数字「2」を選択
      userEvent.selectOptions(numberSelect, '2');
  
      // `editedText` が対応するテキストに更新されるのを待つ
      await waitFor(() => expect(textInput).toHaveValue('Prize 2'));
  
      // テキストフィールドに新しい値を入力
      await userEvent.clear(textInput);
      await userEvent.type(textInput, 'New Prize 2');
  
      // 入力フィールドの値が更新されたことを確認
      expect(textInput).toHaveValue('New Prize 2');
    });
  });

  describe('Button Click Events', () => {
    it('shows the edit form when the "ルーレットを編集する" button is clicked', async () => {
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
  
      // 編集フォームが初期状態で表示されていないことを確認
      expect(screen.queryByTestId('edit-roulette-text-form')).not.toBeInTheDocument();
  
      // 「ルーレットを編集する」ボタンをクリック
      const editButton = screen.getByText('ルーレットを編集する');
      userEvent.click(editButton);
  
      // 編集フォームが表示されていることを確認
      expect(await screen.findByTestId('edit-roulette-text-form')).toBeInTheDocument();
    });

    it('hides the edit form when the "キャンセル" button is clicked', async () => {
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
    
      // 編集フォームを表示する
      const editButton = screen.getByText('ルーレットを編集する');
      userEvent.click(editButton);
    
      // 編集フォームが表示されていることを確認
      expect(await screen.findByTestId('edit-roulette-text-form')).toBeInTheDocument();
    
      // 「キャンセル」ボタンをクリック
      const cancelButton = screen.getByText('キャンセル');
      userEvent.click(cancelButton);
    
      // 編集フォームが非表示になっていることを確認
      await waitFor(() => {
        expect(screen.queryByTestId('edit-roulette-text-form')).not.toBeInTheDocument();
      });
    });

    it('calls handleSubmit and sends PATCH request', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      fetchWithAuth.mockClear();
      global.fetch.mockClear();
    
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
    
      userEvent.click(await screen.findByText('ルーレットを編集する'));
    
      const numberSelect = await screen.findByLabelText('編集したい数字を選んでください。');
      userEvent.selectOptions(numberSelect, '1');
    
      const textInput = screen.getByLabelText('Edit text');
      await waitFor(() => expect(textInput).toHaveValue('Prize 1'));
    
      await userEvent.clear(textInput);
      await userEvent.type(textInput, 'Updated Prize 1');
    
      userEvent.click(screen.getByText('内容を保存する'));
    
      await waitFor(() => {
        const call = global.fetch.mock.calls.find(([url, opts]) =>
          url.endsWith('/api/roulette_texts/1') && opts.method === 'PATCH'
        );
        expect(call).toBeDefined();
      
        const [, mergedOpts] = call;
        expect(mergedOpts).toMatchObject({
          method     : 'PATCH',
          credentials: 'include',
          headers    : {'Content-Type':'application/json'},
          body       : JSON.stringify({ roulette_text:{ text:'Updated Prize 1' } }),
        });
      });
    
      window.confirm.mockRestore();
    });

    it('calls fetchTickets after successful edit', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
    
      // ---- fetchTicketsMock を初期化 ----
      fetchTicketsMock.mockReset();
      fetchTicketsMock.mockImplementation(() => {});
    
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
    
      // アンカー
      await screen.findByText('Prize 1');
    
      // フォーム操作
      await userEvent.click(screen.getByText('ルーレットを編集する'));
      const numberSelect = await screen.findByLabelText('編集したい数字を選んでください。');
      await userEvent.selectOptions(numberSelect, '1');
    
      const textInput = screen.getByLabelText('Edit text');
      await waitFor(() => expect(textInput).toHaveValue('Prize 1'));
    
      await userEvent.clear(textInput);
      await userEvent.type(textInput, 'Updated Prize 1');
    
      await userEvent.click(screen.getByText('内容を保存する'));
    
      // fetchTickets が呼ばれるまで待つ
      await waitFor(() => expect(fetchTicketsMock).toHaveBeenCalled());
    
      window.confirm.mockRestore();
    });
    
    it('starts the roulette when the "ルーレットを回す" button is clicked', async () => {
      // window.confirm をモックして常に true を返す
      jest.spyOn(window, 'confirm').mockImplementation(() => true);
    
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
    
      // 「ルーレットを回す」ボタンを取得
      const startButton = screen.getByText('ルーレットを回す');
    
      // ボタンが有効であることを確認
      expect(startButton).toBeEnabled();
    
      // ボタンをクリック
      userEvent.click(startButton);
    
      // ボタンが無効化されるのを待つ
      await waitFor(() => {
        expect(startButton).toBeDisabled();
      });
    
      // window.confirm のモックを元に戻す
      window.confirm.mockRestore();
    });
  });
  
});