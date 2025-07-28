import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditRouletteText from '../../pages/edit-roulette-text';
import { TicketsContext } from '../../contexts/TicketsContext';
import { useRouter } from 'next/router';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
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
jest.mock('../../hooks/useFetchRouletteTexts', () => {
  const React = require('react');
  return {
    useFetchRouletteTexts: () => {
      const [rouletteTexts, setRouletteTexts] = React.useState(mockRouletteTexts);
      return { rouletteTexts, setRouletteTexts };
    },
  };
});

jest.mock('../../utils/fetchWithAuth', () => {
  const fetchWithAuth = jest.fn((url, opts = {}) => {
    return global.fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
  });
  return { __esModule: true, default: fetchWithAuth, fetchWithAuth };
});

jest.mock('../../utils/getIdToken');

const fetchTicketsMock = jest.fn();

const TestWrapper = ({ children }) => {
  const [tickets, setTickets] = React.useState(5);

  React.useEffect(() => {
    fetchTicketsMock.mockReset();
    fetchTicketsMock.mockImplementation(() =>
      setTickets((prev) => prev - 1)
    );
  }, []);

  return (
    <TicketsContext.Provider
      value={{ tickets, setTickets, fetchTickets: fetchTicketsMock }}
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
  const { method = 'GET' } = options;

  if (url === '/api/roulette_texts' && method === 'GET') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockRouletteTexts),
    });
  }
  // ---------------- PATCH /api/roulette_texts/:number ------
  const idMatch = url.match(/^\/api\/roulette_texts\/(\d+)$/);
  if (idMatch && method === 'PATCH') {
    const body = JSON.parse(options.body);
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          roulette_text: {
            id: Number(idMatch[1]),
            number: Number(idMatch[1]),
            text: body.roulette_text.text,
          },
        }),
    });
  }

  // ユーザー情報を取得するエンドポイントのモック
  if (url === '/api/current_user' && method === 'GET') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          id: 7,
          name: 'Sample User',
          email: 'sample@example.com',
          totalExp: 140,
          rank: 10,
        }),
    });
  }

  if (url === '/api/roulette_texts/spin' && method === 'PATCH') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ play_tickets: 4 }),
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
    tickets: 5,
    setTickets: jest.fn(),
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
    it('displays the correct tickets value from TicketsContext', async () => {
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );

      await waitFor(() => {
        const ticketsText = screen.getByTestId('tickets');
        expect(ticketsText).toHaveTextContent('チケットを『5』枚持っています。');
      });
    });

    it('updates the displayed tickets when context values change', async () => {
      const Wrapper = () => {
        const [tickets, setTickets] = React.useState(5);
    
        return (
          <TicketsContext.Provider
            value={{ tickets, setTickets, fetchTickets: jest.fn() }}
          >
            <EditRouletteText />
            <button data-testid="inc" onClick={() => setTickets(8)}>
              change tickets
            </button>
          </TicketsContext.Provider>
        );
      };
    
      render(
        <Authenticator.Provider>
          <Wrapper />
        </Authenticator.Provider>
      );
    
      const ticketsText = await screen.findByTestId('tickets');
      expect(ticketsText).toHaveTextContent('チケットを『5』枚持っています。');

      userEvent.click(screen.getByTestId('inc'));
    
      await waitFor(() => {
        expect(ticketsText).toHaveTextContent('チケットを『8』枚持っています。');
      });
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

      const textInput = await screen.findByLabelText('内容を編集してください。');
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

      const textInput = screen.getByLabelText('内容を編集してください。');

      await waitFor(() => expect(textInput).toHaveValue('Prize 1'));

      await userEvent.selectOptions(numberSelect, '2');

      await waitFor(() => expect(textInput).toHaveValue('Prize 2'));
    });
  });

  describe('Form Submission', () => {
    it('edits the text and submits the form correctly', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      global.fetch.mockClear();
  
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
  
      const textInput = screen.getByLabelText('内容を編集してください。');
      await waitFor(() => expect(textInput).toHaveValue('Prize 1'));
  
      userEvent.clear(textInput);
      await userEvent.type(textInput, 'Updated Prize 1');
  
      const submitButton = screen.getByText('内容を保存する');
      userEvent.click(submitButton);
  
      await waitFor(() => {
        const patchCall = global.fetch.mock.calls.find(
          ([url, opts]) =>
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
  
      const textInput = screen.getByLabelText('内容を編集してください。');
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
      const textInput = screen.getByLabelText('内容を編集してください。');
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
        expect(screen.getByText('Number: 1 を Updated Prize 1 に変更しました。')).toBeInTheDocument();
      });
    
        window.confirm.mockRestore();
      });
    
    it('handles *new* API format without roulette_text wrapper', async () => {
      // confirm を常に YES
      jest.spyOn(window, 'confirm').mockReturnValue(true);
  
      // ------- fetch をこのテスト専用で差し替え -------
      global.fetch.mockImplementationOnce((url, opts) => {
        // GET /api/roulette_texts (初期一覧) は既存モックに任せる
        if (opts?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockRouletteTexts),
          });
        }
        // PATCH /api/roulette_texts/1 だけ新形式を返す
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              id: 1,
              number: 1,
              text: 'Brand-new Prize 1',
            }),
        });
      });
  
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
  
      // ------ フォームを開いて編集操作 ------
      await userEvent.click(screen.getByRole('button', { name: /ルーレットを編集する/i }));
      await userEvent.selectOptions(
        screen.getByLabelText('編集したい数字を選んでください。'),
        '1'
      );
      const textInput = screen.getByLabelText('内容を編集してください。');
      // 初期値は API 取得に失敗した場合は空文字の可能性があるため、値を直接入力
      await userEvent.clear(textInput);
      await userEvent.type(textInput, 'Brand-new Prize 1');
  
      // ------ 送信 ------
      await userEvent.click(screen.getByText('内容を保存する'));
  
      // ------ 検証 ------
      await waitFor(() => {
        // flash
        expect(
          screen.getByText('Number: 1 を Brand-new Prize 1 に変更しました。')
        ).toBeInTheDocument();
        // list 書き換え
        expect(screen.getByTestId('roulette-text-item-1')).toHaveTextContent('Brand-new Prize 1');
        // fetchTickets()
        expect(fetchTicketsMock).toHaveBeenCalled();
      });
  
      window.confirm.mockRestore();
    });
  });

  describe('Insufficient Edit Tickets', () => {
    it('always displays the edit button regardless of tickets', async () => {
      const mockTicketsContextValue = {
        tickets: 5,
        fetchTickets: jest.fn(),
      };
  
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );
  
      // ボタンが存在することを確認
      const editButton = screen.getByText('ルーレットを編集する');
      expect(editButton).toBeInTheDocument();
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
      expect(listItems).toHaveLength(3);
  
      // 各 <li> のテキストを確認
      expect(listItems[0]).toHaveTextContent('Rankが10上がるごとに、チケットが付与されます。');
      expect(listItems[1]).toHaveTextContent('ルーレットを回すには、チケットを1枚使用する必要があります。');
      expect(listItems[2]).toHaveTextContent('各チケットの枚数は、左上に表示されています。');
    });
  });

  describe('TicketsContext Data Usage', () => {
    it('retrieves and displays tickets correctly', () => {
      render(
        <Authenticator.Provider>
          <TestWrapper tickets={5}>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );

      // tickets の表示を確認
      const ticketsElement = screen.getByTestId('tickets');
      expect(ticketsElement).toBeInTheDocument();
      expect(ticketsElement).toHaveTextContent('チケットを『5』枚持っています。');
    });

    it('displays a flash message after successful edit and updates the displayed text', async () => {
      jest.spyOn(window, 'confirm').mockImplementation(() => true);
    
      // ① レンダリング
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
    
      // ② フォームを開く
      userEvent.click(screen.getByRole('button', { name: /ルーレットを編集する/i }));
      await screen.findByTestId('edit-roulette-text-form');
    
      // ③ セレクト→入力
      userEvent.selectOptions(
        screen.getByLabelText('編集したい数字を選んでください。'),
        '1'
      );
      await waitFor(() =>
        expect(screen.getByLabelText('内容を編集してください。')).toHaveValue('Prize 1')
      );
      await userEvent.clear(screen.getByLabelText('内容を編集してください。'));
      await userEvent.type(screen.getByLabelText('内容を編集してください。'), 'New Prize 1');
    
      // ④ confirm をモック、fetch 履歴をクリア
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      global.fetch.mockClear();
    
      // ⑤ 送信
      userEvent.click(screen.getByText('内容を保存する'));
    
      // ⑥ PATCH が正しく投げられたことを検証
      await waitFor(() => {
        const patchCall = global.fetch.mock.calls.find(
          ([url, opts]) =>
            url.endsWith('/api/roulette_texts/1') && opts.method === 'PATCH'
        );
        expect(patchCall).toBeDefined();
        const [, options] = patchCall;
        expect(options).toMatchObject({
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roulette_text: { text: 'New Prize 1' } }),
        });
      });
    
      // ⑦ フラッシュメッセージが表示されることを検証
      await waitFor(() => {
        expect(
          screen.getByText('Number: 1 を New Prize 1 に変更しました。')
        ).toBeInTheDocument();
      });
    
      // ⑧ ✅ 追加：リスト上のリールテキストが更新されていることを検証
      await waitFor(() => {
        const updatedItem = screen.getByTestId('roulette-text-item-1');
        expect(updatedItem).toHaveTextContent('New Prize 1');
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
      const textInput = screen.getByLabelText('内容を編集してください。');
  
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
    
      const textInput = screen.getByLabelText('内容を編集してください。');
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
    
      const textInput = screen.getByLabelText('内容を編集してください。');
      await waitFor(() => expect(textInput).toHaveValue('Prize 1'));
    
      await userEvent.clear(textInput);
      await userEvent.type(textInput, 'Updated Prize 1');
    
      await userEvent.click(screen.getByText('内容を保存する'));
    
      // fetchTickets が呼ばれるまで待つ
      await waitFor(() => expect(fetchTicketsMock).toHaveBeenCalled());
    
      window.confirm.mockRestore();
    });
    
    it('starts the roulette when the "チケットを消費して回す" button is clicked', async () => {
      // window.confirm をモックして常に true を返す
      jest.spyOn(window, 'confirm').mockImplementation(() => true);
    
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
    
      // 「チケットを消費して回す」ボタンを取得
      const startButton = screen.getByText('チケットを消費して回す');
    
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

    it('does not consume tickets when the "お試しで回す" button is clicked', async () => {
      // window.confirm は呼ばれない想定
      jest.spyOn(window, 'confirm').mockImplementation(() => true);

      // fetchWithAuth のモックをクリア
      fetchWithAuth.mockClear();

      const mockSetTickets   = jest.fn();
      const mockFetchTickets = jest.fn();

      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={{ tickets: 3, setTickets: mockSetTickets, fetchTickets: mockFetchTickets }}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );

      // 「お試しで回す」ボタンを取得
      const trialButton = await screen.findByText('お試しで回す');

      // クリック
      userEvent.click(trialButton);

      // window.confirm は呼ばれていない
      expect(window.confirm).not.toHaveBeenCalled();

      // fetchWithAuth は呼ばれていない（チケット消費 API 不呼出）
      expect(fetchWithAuth).not.toHaveBeenCalled();

      // setTickets も呼ばれていない（チケット枚数更新なし）
      expect(mockSetTickets).not.toHaveBeenCalled();

      // ボタンが一時的に無効化される（スピン中）→ waitFor を使い disabled になるまで確認
      await waitFor(() => {
        expect(trialButton).toBeDisabled();
      });

      window.confirm.mockRestore();
    });
  });
  
});