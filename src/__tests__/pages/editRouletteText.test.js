import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditRouletteText from '../../pages/edit-roulette-text';
import { TicketsContext } from '../../contexts/TicketsContext';
import { useRouter } from 'next/router';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { Authenticator } from '@aws-amplify/ui-react';
import '@testing-library/jest-dom';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

const mockRouletteTexts = [
  { id: 1, number: 1, text: 'Prize 1' },
  { id: 2, number: 2, text: 'Prize 2' },
];

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
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

afterAll(() => {
  window.alert.mockRestore();
});


global.fetch = jest.fn((url, options) => {
  const { method = 'GET' } = options;

  if (url === '/api/roulette_texts' && method === 'GET') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockRouletteTexts),
    });
  }

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


describe('EditRouletteTextコンポーネント', () => {
  const mockTicketsContextValue = {
    tickets: 5,
    setTickets: jest.fn(),
  };

  it('EditRouletteTextコンポーネントがクラッシュすることなくレンダリングされること', () => {
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

  describe('チケット情報の表示', () => {
    it('TicketsContextから正しいチケット値を表示すること', async () => {
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

    it('コンテキストの値が変更されたときに表示されたチケットが更新されること', async () => {
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


  describe('ルーレットテキストリストの表示', () => {
    it('ルーレットテキストリストコンテナを表示すること', async () => {
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

    it('正しい数のルーレットテキストを表示すること', async () => {
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

    it('各ルーレットテキストを正しく表示すること', async () => {
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

    it('各ルーレットテキスト項目に対して正しい画像を表示すること', async () => {
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

  describe('データの取得', () => {
    it('マウント時にルーレットテキストを取得し、状態を更新すること', async () => {
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

  describe('編集フォーム', () => {
    it('編集フォームに必要な要素が含まれていること', async () => {
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

    it('数字選択ボックスとテキスト入力フィールドが含まれていること', async () => {
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

  describe('編集フォームの操作', () => {
    it('数字が選択されたときに対応するテキストが設定されること', async () => {
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

  describe('フォームの送信', () => {
    it('テキストを編集し、フォームを正しく送信すること', async () => {
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
  
    it('編集後にrouletteTexts状態を正しく更新すること', async () => {
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

    it('編集成功後にフラッシュメッセージを表示すること', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      global.fetch.mockClear();
    
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
      
      await userEvent.click(await screen.findByText('ルーレットを編集する'));
      
      const numberSelect = await screen.findByLabelText('編集したい数字を選んでください。');
      userEvent.selectOptions(numberSelect, '1');
      const textInput = screen.getByLabelText('内容を編集してください。');
      await waitFor(() => expect(textInput).toHaveValue('Prize 1'));
    
      await userEvent.clear(textInput);
      await userEvent.type(textInput, 'Updated Prize 1');
    
      userEvent.click(screen.getByText('内容を保存する'));
      
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
    
    it('roulette_textラッパーなしの新しいAPI形式を処理すること', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
  
      global.fetch.mockImplementationOnce((url, opts) => {
        if (opts?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockRouletteTexts),
          });
        }
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
  
      await userEvent.click(screen.getByRole('button', { name: /ルーレットを編集する/i }));
      await userEvent.selectOptions(
        screen.getByLabelText('編集したい数字を選んでください。'),
        '1'
      );
      const textInput = screen.getByLabelText('内容を編集してください。');
      await userEvent.clear(textInput);
      await userEvent.type(textInput, 'Brand-new Prize 1');
  
      await userEvent.click(screen.getByText('内容を保存する'));
  
      await waitFor(() => {
        expect(
          screen.getByText('Number: 1 を Brand-new Prize 1 に変更しました。')
        ).toBeInTheDocument();
        expect(screen.getByTestId('roulette-text-item-1')).toHaveTextContent('Brand-new Prize 1');
        expect(fetchTicketsMock).toHaveBeenCalled();
      });
  
      window.confirm.mockRestore();
    });
  });

  describe('編集チケット不足', () => {
    it('チケット数に関係なく常に編集ボタンを表示すること', async () => {
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
  
      const editButton = screen.getByText('ルーレットを編集する');
      expect(editButton).toBeInTheDocument();
    });
  });
  
  describe('キャンセルボタンの機能', () => {
    it('「キャンセル」ボタンがクリックされたときに編集フォームを閉じること', async () => {
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
  
      const editForm = await screen.findByTestId('edit-roulette-text-form');
      expect(editForm).toBeInTheDocument();
  
      const cancelButton = screen.getByText('キャンセル');
      userEvent.click(cancelButton);
  
      await waitFor(() => {
        expect(screen.queryByTestId('edit-roulette-text-form')).not.toBeInTheDocument();
      });
  
      window.confirm.mockRestore();
    });
  });
  
  describe('EditRouletteText内でのRoulettePopupのレンダリング', () => {
    it('EditRouletteText内でRoulettePopupコンポーネントを正しくレンダリングすること', () => {
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );

      const rouletteContainer = screen.getByTestId('roulette-container');
      expect(rouletteContainer).toBeInTheDocument();

      const rouletteWheel = screen.getByTestId('roulette-wheel');
      expect(rouletteWheel).toBeInTheDocument();

      const startButton = screen.getByTestId('start-button');
      expect(startButton).toBeInTheDocument();
      expect(startButton).toBeEnabled();

      for (let i = 1; i <= 12; i++) {
        const segment = screen.getByTestId(`segment-${i}`);
        expect(segment).toBeInTheDocument();
      }
    });
  });

  describe('ルーレット説明セクション', () => {
    it('ルーレットの説明をリスト形式で正しく表示すること', () => {
      render(
        <Authenticator.Provider>
          <TicketsContext.Provider value={mockTicketsContextValue}>
            <EditRouletteText />
          </TicketsContext.Provider>
        </Authenticator.Provider>
      );
  
      const descriptionList = screen.getByTestId('roulette-description-list');
      expect(descriptionList).toBeInTheDocument();
  
      const listItems = descriptionList.querySelectorAll('li');
      expect(listItems).toHaveLength(3);
  
      expect(listItems[0]).toHaveTextContent('Rankが10上がるごとに、チケットが付与されます。');
      expect(listItems[1]).toHaveTextContent('ルーレットを回すには、チケットを1枚使用する必要があります。');
      expect(listItems[2]).toHaveTextContent('各チケットの枚数は、左上に表示されています。');
    });
  });

  describe('TicketsContextデータの使用', () => {
    it('チケットを正しく取得して表示すること', () => {
      render(
        <Authenticator.Provider>
          <TestWrapper tickets={5}>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );

      const ticketsElement = screen.getByTestId('tickets');
      expect(ticketsElement).toBeInTheDocument();
      expect(ticketsElement).toHaveTextContent('チケットを『5』枚持っています。');
    });

    it('編集成功後にフラッシュメッセージを表示し、表示されたテキストを更新すること', async () => {
      jest.spyOn(window, 'confirm').mockImplementation(() => true);
    
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
    
      userEvent.click(screen.getByRole('button', { name: /ルーレットを編集する/i }));
      await screen.findByTestId('edit-roulette-text-form');
    
      userEvent.selectOptions(
        screen.getByLabelText('編集したい数字を選んでください。'),
        '1'
      );
      await waitFor(() =>
        expect(screen.getByLabelText('内容を編集してください。')).toHaveValue('Prize 1')
      );
      await userEvent.clear(screen.getByLabelText('内容を編集してください。'));
      await userEvent.type(screen.getByLabelText('内容を編集してください。'), 'New Prize 1');
    
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      global.fetch.mockClear();
    
      userEvent.click(screen.getByText('内容を保存する'));
    
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
    
      await waitFor(() => {
        expect(
          screen.getByText('Number: 1 を New Prize 1 に変更しました。')
        ).toBeInTheDocument();
      });
    
      await waitFor(() => {
        const updatedItem = screen.getByTestId('roulette-text-item-1');
        expect(updatedItem).toHaveTextContent('New Prize 1');
      });
    
      window.confirm.mockRestore();
    });
  });

  describe('フォーム入力状態の更新', () => {
    it('選択ボックスと入力フィールドの値が変更されたときに状態変数を更新すること', async () => {
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
      const textInput = screen.getByLabelText('内容を編集してください。');
  
      expect(numberSelect).toHaveValue('');
      expect(textInput).toHaveValue('');
  
      userEvent.selectOptions(numberSelect, '2');
  
      await waitFor(() => expect(textInput).toHaveValue('Prize 2'));
  
      await userEvent.clear(textInput);
      await userEvent.type(textInput, 'New Prize 2');
  
      expect(textInput).toHaveValue('New Prize 2');
    });
  });

  describe('ボタンクリックイベント', () => {
    it('「ルーレットを編集する」ボタンがクリックされたときに編集フォームを表示すること', async () => {
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

    it('「キャンセル」ボタンがクリックされたときに編集フォームを非表示にすること', async () => {
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

    it('handleSubmitを呼び出し、PATCHリクエストを送信すること', async () => {
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

    it('編集成功後にfetchTicketsを呼び出すこと', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
    
      fetchTicketsMock.mockReset();
      fetchTicketsMock.mockImplementation(() => {});
    
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
    
      await screen.findByText('Prize 1');
    
      await userEvent.click(screen.getByText('ルーレットを編集する'));
      const numberSelect = await screen.findByLabelText('編集したい数字を選んでください。');
      await userEvent.selectOptions(numberSelect, '1');
    
      const textInput = screen.getByLabelText('内容を編集してください。');
      await waitFor(() => expect(textInput).toHaveValue('Prize 1'));
    
      await userEvent.clear(textInput);
      await userEvent.type(textInput, 'Updated Prize 1');
    
      await userEvent.click(screen.getByText('内容を保存する'));
    
      await waitFor(() => expect(fetchTicketsMock).toHaveBeenCalled());
    
      window.confirm.mockRestore();
    });
    
    it('「チケットを消費して回す」ボタンがクリックされたときにルーレットを開始すること', async () => {
      jest.spyOn(window, 'confirm').mockImplementation(() => true);
    
      render(
        <Authenticator.Provider>
          <TestWrapper>
            <EditRouletteText />
          </TestWrapper>
        </Authenticator.Provider>
      );
    
      const startButton = screen.getByText('チケットを消費して回す');
    
      expect(startButton).toBeEnabled();
    
      userEvent.click(startButton);
    
      await waitFor(() => {
        expect(startButton).toBeDisabled();
      });
    
      window.confirm.mockRestore();
    });

    it('「お試しで回す」ボタンがクリックされたときにチケットを消費しないこと', async () => {
      jest.spyOn(window, 'confirm').mockImplementation(() => true);

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

      const trialButton = await screen.findByText('お試しで回す');

      userEvent.click(trialButton);

      expect(window.confirm).not.toHaveBeenCalled();

      expect(fetchWithAuth).not.toHaveBeenCalled();

      expect(mockSetTickets).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(trialButton).toBeDisabled();
      });

      window.confirm.mockRestore();
    });
  });
  
});