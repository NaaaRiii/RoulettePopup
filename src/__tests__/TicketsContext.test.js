import React from 'react';
import { render, renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TicketsContext, TicketsProvider } from '../contexts/TicketsContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';

// fetchWithAuth をモック
jest.mock('../utils/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
}));

describe('TicketsContext', () => {
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  it('初期状態で tickets は 0 である', () => {
    // 成功レスポンスをモック
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tickets: 5 }),
    });

    // テスト用のコンポーネント
    const TestComponent = () => {
      const { tickets } = React.useContext(TicketsContext);
      return <div data-testid="tickets">{tickets}</div>;
    };

    // プロバイダーでラップしてレンダリング
    const { getByTestId } = render(
      <TicketsProvider>
        <TestComponent />
      </TicketsProvider>
    );

    // 初期値が0であることを確認
    expect(getByTestId('tickets')).toHaveTextContent('0');
  });

  it('setTickets と fetchTickets が関数として提供される', () => {
    // 成功レスポンスをモック
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tickets: 5 }),
    });

    // テスト用のコンポーネント
    const TestComponent = () => {
      const { setTickets, fetchTickets } = React.useContext(TicketsContext);
      return (
        <div>
          <div data-testid="setTickets-type">{typeof setTickets}</div>
          <div data-testid="fetchTickets-type">{typeof fetchTickets}</div>
        </div>
      );
    };

    // プロバイダーでラップしてレンダリング
    const { getByTestId } = render(
      <TicketsProvider>
        <TestComponent />
      </TicketsProvider>
    );

    // 両方とも関数であることを確認
    expect(getByTestId('setTickets-type')).toHaveTextContent('function');
    expect(getByTestId('fetchTickets-type')).toHaveTextContent('function');
  });

  describe('複数インスタンスの独立性', () => {
    // テスト用のコンポーネント
    const TestComponent = ({ id }) => {
      const { tickets, setTickets, fetchTickets } = React.useContext(TicketsContext);
      return (
        <div>
          <div data-testid={`tickets-${id}`}>{tickets}</div>
          <button onClick={() => setTickets(10)} data-testid={`set-tickets-button-${id}`}>Set Tickets</button>
          <button onClick={fetchTickets} data-testid={`fetch-button-${id}`}>Fetch</button>
        </div>
      );
    };

    it('複数のコンポーネントで使用しても、それぞれが独立した状態を持つこと', async () => {
      // 成功レスポンスをモック
      fetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tickets: 5 }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tickets: 5 }),
      });

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <>
          <TicketsProvider>
            <TestComponent id="1" />
          </TicketsProvider>
          <TicketsProvider>
            <TestComponent id="2" />
          </TicketsProvider>
        </>
      );

      // 初期状態を確認
      expect(getByTestId('tickets-1')).toHaveTextContent('0');
      expect(getByTestId('tickets-2')).toHaveTextContent('0');

      // 1つ目のコンポーネントの setTickets を実行
      getByTestId('set-tickets-button-1').click();

      // 1つ目のコンポーネントの状態が更新されることを確認
      await waitFor(() => {
        expect(getByTestId('tickets-1')).toHaveTextContent('10');
      });

      // 2つ目のコンポーネントの setTickets を実行
      getByTestId('set-tickets-button-2').click();

      // 2つ目のコンポーネントの状態が更新されることを確認
      await waitFor(() => {
        expect(getByTestId('tickets-2')).toHaveTextContent('10');
      });
    });

    it('fetchTickets の呼び出しが重複しないこと', async () => {
      // 成功レスポンスをモック
      fetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tickets: 5 }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tickets: 5 }),
      });

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <>
          <TicketsProvider>
            <TestComponent id="1" />
          </TicketsProvider>
          <TicketsProvider>
            <TestComponent id="2" />
          </TicketsProvider>
        </>
      );

      // 初期状態を確認
      expect(getByTestId('tickets-1')).toHaveTextContent('0');
      expect(getByTestId('tickets-2')).toHaveTextContent('0');

      // 1つ目のコンポーネントの fetchTickets を実行
      getByTestId('fetch-button-1').click();

      // 2つ目のコンポーネントの fetchTickets を実行
      getByTestId('fetch-button-2').click();

      // API レスポンス後の状態を確認
      await waitFor(() => {
        expect(getByTestId('tickets-1')).toHaveTextContent('5');
        expect(getByTestId('tickets-2')).toHaveTextContent('5');
      });

      // fetchWithAuth が4回呼ばれたことを確認（各プロバイダーのマウント時とボタン押下時で計4回）
      expect(fetchWithAuth).toHaveBeenCalledTimes(4);
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts/tickets');
    });
  });

  describe('マウント/アンマウントの動作', () => {
    // テスト用のコンポーネント
    const TestComponent = () => {
      const { tickets } = React.useContext(TicketsContext);
      return <div data-testid="tickets">{tickets}</div>;
    };

    it('マウント時に fetchTickets が呼ばれること', async () => {
      // 成功レスポンスをモック
      const expectedTickets = 10;
      fetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tickets: expectedTickets }),
      });

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <TicketsProvider>
          <TestComponent />
        </TicketsProvider>
      );

      // 初期状態を確認
      expect(getByTestId('tickets')).toHaveTextContent('0');

      // fetchWithAuth が呼ばれたことを確認
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts/tickets');

      // API レスポンス後の状態を確認
      await waitFor(() => {
        expect(getByTestId('tickets')).toHaveTextContent(expectedTickets.toString());
      });
    });

    it('アンマウント後に非同期処理が完了しても状態が更新されないこと', async () => {
      // 遅延付きの成功レスポンスをモック
      const expectedTickets = 10;
      let resolvePromise;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      fetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          await delayedPromise;
          return { tickets: expectedTickets };
        },
      });

      // プロバイダーでラップしてレンダリング
      const { getByTestId, unmount } = render(
        <TicketsProvider>
          <TestComponent />
        </TicketsProvider>
      );

      // 初期状態を確認
      expect(getByTestId('tickets')).toHaveTextContent('0');

      // コンポーネントをアンマウント
      unmount();

      // 非同期処理を完了
      resolvePromise();

      // 少し待機して状態が更新されないことを確認
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts/tickets');
    });
  });

  describe('setTickets の機能', () => {
    // テスト用のコンポーネント
    const TestComponent = () => {
      const { tickets, setTickets } = React.useContext(TicketsContext);
      return (
        <div>
          <div data-testid="tickets">{tickets}</div>
          <button onClick={() => setTickets(10)} data-testid="set-tickets-button">Set Tickets</button>
        </div>
      );
    };

    it('手動で tickets の値を更新できること', async () => {
      // 成功レスポンスをモック
      fetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tickets: 5 }),
      });

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <TicketsProvider>
          <TestComponent />
        </TicketsProvider>
      );

      // 初期状態を確認
      expect(getByTestId('tickets')).toHaveTextContent('0');

      // setTickets を実行
      getByTestId('set-tickets-button').click();

      // 状態が更新されることを確認
      await waitFor(() => {
        expect(getByTestId('tickets')).toHaveTextContent('10');
      });
    });

    it('更新された値が正しく反映されること', async () => {
      // 成功レスポンスをモック
      fetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tickets: 5 }),
      });

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <TicketsProvider>
          <TestComponent />
        </TicketsProvider>
      );

      // 初期状態を確認
      expect(getByTestId('tickets')).toHaveTextContent('0');

      // setTickets を実行
      getByTestId('set-tickets-button').click();

      // 状態が更新されることを確認
      await waitFor(() => {
        expect(getByTestId('tickets')).toHaveTextContent('10');
      });

      // 再度 setTickets を実行
      getByTestId('set-tickets-button').click();

      // 状態が再度更新されることを確認
      await waitFor(() => {
        expect(getByTestId('tickets')).toHaveTextContent('10');
      });
    });
  });

  describe('fetchTickets の正常系', () => {
    // テスト用のコンポーネント
    const TestComponent = () => {
      const { tickets, fetchTickets } = React.useContext(TicketsContext);
      return (
        <div>
          <div data-testid="tickets">{tickets}</div>
          <button onClick={fetchTickets} data-testid="fetch-button">Fetch</button>
        </div>
      );
    };

    it('ログ出力が正しく行われること', async () => {
      // 成功レスポンスをモック
      const expectedTickets = 10;
      fetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tickets: expectedTickets }),
      });

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <TicketsProvider>
          <TestComponent />
        </TicketsProvider>
      );

      // 初期状態を確認
      expect(getByTestId('tickets')).toHaveTextContent('0');

      // fetchTickets を実行
      getByTestId('fetch-button').click();

      // ログ出力を確認
      expect(console.log).toHaveBeenCalledWith('[Tickets] fetch start');
      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('[Tickets] received', expectedTickets);
      });

      // API レスポンス後の状態を確認
      await waitFor(() => {
        expect(getByTestId('tickets')).toHaveTextContent(expectedTickets.toString());
      });
    });

    it('data.tickets が存在する場合、その値が tickets に設定される', async () => {
      // 成功レスポンスをモック
      const expectedTickets = 10;
      fetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tickets: expectedTickets }),
      });

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <TicketsProvider>
          <TestComponent />
        </TicketsProvider>
      );

      // 初期状態を確認
      expect(getByTestId('tickets')).toHaveTextContent('0');

      // fetchTickets を実行
      getByTestId('fetch-button').click();

      // API レスポンス後の状態を確認
      await waitFor(() => {
        expect(getByTestId('tickets')).toHaveTextContent(expectedTickets.toString());
      });

      // fetchWithAuth が正しいエンドポイントで呼ばれたことを確認
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts/tickets');
    });

    it('data.tickets が存在せず data.play_tickets が存在する場合、play_tickets の値が tickets に設定される', async () => {
      // 成功レスポンスをモック
      const expectedTickets = 15;
      fetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ play_tickets: expectedTickets }),
      });

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <TicketsProvider>
          <TestComponent />
        </TicketsProvider>
      );

      // 初期状態を確認
      expect(getByTestId('tickets')).toHaveTextContent('0');

      // fetchTickets を実行
      getByTestId('fetch-button').click();

      // API レスポンス後の状態を確認
      await waitFor(() => {
        expect(getByTestId('tickets')).toHaveTextContent(expectedTickets.toString());
      });

      // fetchWithAuth が正しいエンドポイントで呼ばれたことを確認
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts/tickets');
    });

    it('data.tickets も data.play_tickets も存在しない場合、0 が設定される', async () => {
      // 成功レスポンスをモック
      fetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <TicketsProvider>
          <TestComponent />
        </TicketsProvider>
      );

      // 初期状態を確認
      expect(getByTestId('tickets')).toHaveTextContent('0');

      // fetchTickets を実行
      getByTestId('fetch-button').click();

      // API レスポンス後の状態を確認
      await waitFor(() => {
        expect(getByTestId('tickets')).toHaveTextContent('0');
      });

      // fetchWithAuth が正しいエンドポイントで呼ばれたことを確認
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts/tickets');
    });
  });

  describe('fetchTickets の異常系', () => {
    // テスト用のコンポーネント
    const TestComponent = () => {
      const { tickets, fetchTickets } = React.useContext(TicketsContext);
      return (
        <div>
          <div data-testid="tickets">{tickets}</div>
          <button onClick={fetchTickets} data-testid="fetch-button">Fetch</button>
        </div>
      );
    };

    it('エラー時にログ出力が正しく行われること', async () => {
      // 失敗レスポンスをモック
      const error = new Error('Network Error');
      fetchWithAuth.mockRejectedValueOnce(error);

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <TicketsProvider>
          <TestComponent />
        </TicketsProvider>
      );

      // 初期状態を確認
      expect(getByTestId('tickets')).toHaveTextContent('0');

      // fetchTickets を実行
      getByTestId('fetch-button').click();

      // ログ出力を確認
      expect(console.log).toHaveBeenCalledWith('[Tickets] fetch start');
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('[Tickets] fetch failed:', error);
      });

      // 状態が更新されていないことを確認
      await waitFor(() => {
        expect(getByTestId('tickets')).toHaveTextContent('0');
      });
    });

    it('API が失敗した場合（res.ok = false）、エラーが console.error に出力され、tickets の値は変更されない', async () => {
      // 失敗レスポンスをモック
      const status = 500;
      fetchWithAuth.mockResolvedValueOnce({
        ok: false,
        status,
      });

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <TicketsProvider>
          <TestComponent />
        </TicketsProvider>
      );

      // 初期状態を確認
      const initialTickets = getByTestId('tickets').textContent;
      expect(initialTickets).toBe('0');

      // fetchTickets を実行
      getByTestId('fetch-button').click();

      // エラーが出力されることを確認
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          '[Tickets] fetch failed:',
          expect.any(Error)
        );
      });

      // エラーメッセージにステータスコードが含まれていることを確認
      const errorMessage = console.error.mock.calls[0][1].message;
      expect(errorMessage).toContain(`status=${status}`);

      // 状態が更新されていないことを確認
      await waitFor(() => {
        expect(getByTestId('tickets')).toHaveTextContent(initialTickets);
      });

      // fetchWithAuth が正しいエンドポイントで呼ばれたことを確認
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts/tickets');
    });

    it('ネットワークエラーの場合、エラーが console.error に出力され、tickets の値は変更されない', async () => {
      // ネットワークエラーをモック
      const networkError = new Error('Network Error');
      fetchWithAuth.mockRejectedValueOnce(networkError);

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <TicketsProvider>
          <TestComponent />
        </TicketsProvider>
      );

      // 初期状態を確認
      const initialTickets = getByTestId('tickets').textContent;
      expect(initialTickets).toBe('0');

      // fetchTickets を実行
      getByTestId('fetch-button').click();

      // エラーが出力されることを確認
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          '[Tickets] fetch failed:',
          networkError
        );
      });

      // 状態が更新されていないことを確認
      await waitFor(() => {
        expect(getByTestId('tickets')).toHaveTextContent(initialTickets);
      });

      // fetchWithAuth が正しいエンドポイントで呼ばれたことを確認
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts/tickets');
    });

    it('JSON 解析エラーの場合、エラーが console.error に出力され、tickets の値は変更されない', async () => {
      // JSON 解析エラーをモック
      const jsonError = new SyntaxError('Unexpected token');
      fetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw jsonError; },
      });

      // プロバイダーでラップしてレンダリング
      const { getByTestId } = render(
        <TicketsProvider>
          <TestComponent />
        </TicketsProvider>
      );

      // 初期状態を確認
      const initialTickets = getByTestId('tickets').textContent;
      expect(initialTickets).toBe('0');

      // fetchTickets を実行
      getByTestId('fetch-button').click();

      // エラーが出力されることを確認
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          '[Tickets] fetch failed:',
          jsonError
        );
      });

      // 状態が更新されていないことを確認
      await waitFor(() => {
        expect(getByTestId('tickets')).toHaveTextContent(initialTickets);
      });

      // fetchWithAuth が正しいエンドポイントで呼ばれたことを確認
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts/tickets');
    });
  });
}); 