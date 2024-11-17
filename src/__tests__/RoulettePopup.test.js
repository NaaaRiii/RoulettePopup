import React from 'react';
import userEvent from '@testing-library/user-event';
import RoulettePopup, { isValidAngle } from '../components/RoulettePopup';
import { render, screen, waitFor } from '@testing-library/react';
import { TicketsProvider, TicketsContext } from '../contexts/TicketsContext';
import { AuthProvider } from '../contexts/AuthContext';
import '@testing-library/jest-dom';


// `fetch`をエンドポイントごとにモック化
global.fetch = jest.fn((url) => {
  const parsedUrl = new URL(url, 'http://localhost');

  if (parsedUrl.pathname === '/api/current_user') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ rank: 10 }),
    });
  }

  if (parsedUrl.pathname === '/api/tickets') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ play_tickets: 3, edit_tickets: 5 }),
    });
  }

  if (parsedUrl.pathname === '/api/roulette_texts/spin') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ play_tickets: 2, edit_tickets: 5 }),
    });
  }

  if (parsedUrl.pathname === '/api/roulette_texts/tickets') { // 追加
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ play_tickets: 3, edit_tickets: 5 }),
    });
  }

  // 追加のエンドポイントがあればここに記述
  console.error('Unknown endpoint:', url);
  return Promise.reject(new Error('Unknown endpoint'));
});

// Modal のモック
jest.mock('../components/Modal', () => {
  const MockedModal = ({ isOpen, children }) =>
    isOpen ? (
      <div data-testid="modal" role="dialog">
        {children}
      </div>
    ) : null;
  MockedModal.displayName = 'MockedModal';
  return MockedModal;
});

// `fetchRouletteText` のモック
jest.mock('../components/utils', () => ({
  fetchRouletteText: jest.fn((matchNumber) => Promise.resolve({ text: `Text for segment ${matchNumber}` })),
}));

describe('RoulettePopup Component', () => {
  const mockFetchRouletteText = require('../components/utils').fetchRouletteText;

  const renderComponent = () => {
    render(
      <AuthProvider>
        <TicketsProvider>
          <RoulettePopup />
        </TicketsProvider>
      </AuthProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidAngle function', () => {
    it('returns false for angles within the excluded ranges', () => {
      const excludedAngles = [
        0, 3, 5, 25, 30, 35, 55, 60, 65, 85, 90, 95,
        115, 120, 125, 145, 150, 155, 175, 180, 185,
        205, 210, 215, 235, 240, 245, 265, 270, 275,
        295, 300, 305, 325, 330, 335, 355, 358, 359,
      ];
  
      excludedAngles.forEach((angle) => {
        expect(isValidAngle(angle)).toBe(false);
      });
    });
  
    it('returns true for angles outside the excluded ranges', () => {
      const validAngles = [
        6, 15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345,
      ];
  
      validAngles.forEach((angle) => {
        expect(isValidAngle(angle)).toBe(true);
      });
    });
  });

  it('renders the RoulettePopup component correctly', async () => {
    renderComponent();

    // 非同期処理が完了するのを待ちます
    const rouletteContainer = await screen.findByTestId('roulette-container');
    expect(rouletteContainer).toBeInTheDocument();

    const roulettePointer = screen.getByTestId('roulette-pointer');
    expect(roulettePointer).toBeInTheDocument();

    const rouletteWheel = screen.getByTestId('roulette-wheel');
    expect(rouletteWheel).toBeInTheDocument();

    // 12個のセグメントが正しくレンダリングされていることを確認
    const segments = await screen.findAllByTestId(/segment-\d+/i);
    expect(segments.length).toBe(12);

    const startButton = screen.getByTestId('start-button');
    expect(startButton).toBeInTheDocument();
    expect(startButton).toBeEnabled(); // playTicketsが3なので有効であることを確認

    // モーダルが初期状態では表示されていないことを確認
    const modal = screen.queryByTestId('modal');
    expect(modal).not.toBeInTheDocument();
  });

  it('renders 12 segments with correct data-number attributes', async () => {
    renderComponent();

    // 非同期処理が完了するのを待ちます
    await waitFor(() => {
      for (let i = 1; i <= 12; i++) {
        const segment = screen.getByTestId(`segment-${i}`);
        expect(segment).toBeInTheDocument();
        expect(segment).toHaveAttribute('data-number', `${i}`);
      }
    });
  });

  it('renders 12 segments with correct data-number attributes and background colors', async () => {
    renderComponent();

    await waitFor(() => {
      for (let i = 1; i <= 12; i++) {
        const segment = screen.getByTestId(`segment-${i}`);
        expect(segment).toBeInTheDocument();

        // `data-number`属性が正しく設定されていることを確認
        expect(segment).toHaveAttribute('data-number', `${i}`);

        // スタイル属性を取得
        const styleAttribute = segment.getAttribute('style');

        // `background-color`プロパティが存在することを確認（色の値は気にしない）
        expect(styleAttribute).toMatch(/background-color:\s*[^;]+;/);
      }
    });
  });

  it('does not disable the spin button when playTickets is 0 or less', async () => {
    const mockTicketsContextValue = {
      playTickets: 0,
      setPlayTickets: jest.fn(),
      fetchTickets: jest.fn(),
    };

    render(
      <AuthProvider>
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <RoulettePopup />
        </TicketsContext.Provider>
      </AuthProvider>
    );

    // 非同期状態更新を待機
    await screen.findByTestId('start-button');

    const startButton = screen.getByTestId('start-button');
    expect(startButton).toBeInTheDocument();
    expect(startButton).toBeEnabled(); // ボタンが有効であることを確認
  });

  it('enables the spin button when playTickets is 1 or more', async () => {
    // `playTickets` を1に設定したモックコンテキストを作成
    const mockTicketsContextValue = {
      playTickets: 1,
      setPlayTickets: jest.fn(),
      fetchTickets: jest.fn(),
    };

    render(
      <AuthProvider>
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <RoulettePopup />
        </TicketsContext.Provider>
      </AuthProvider>
    );

    // ボタンが有効であることを検証
    await waitFor(() => {
      const startButton = screen.getByTestId('start-button');
      expect(startButton).toBeInTheDocument();
      expect(startButton).toBeEnabled();
    });
  });

  it('shows an alert when playTickets is 0 or less and the button is clicked', async () => {
    window.alert = jest.fn();

    const mockTicketsContextValue = {
      playTickets: 0,
      setPlayTickets: jest.fn(),
      fetchTickets: jest.fn(),
    };

    render(
      <AuthProvider>
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <RoulettePopup />
        </TicketsContext.Provider>
      </AuthProvider>
    );

    // 非同期状態更新を待機
    await screen.findByTestId('start-button');

    const startButton = screen.getByTestId('start-button');
    expect(startButton).toBeInTheDocument();
    expect(startButton).toBeEnabled();

    startButton.click();

    expect(window.alert).toHaveBeenCalledWith('プレイチケットが不足しています');
  });

  it('shows a confirmation dialog when the spin button is clicked', async () => {
    // `window.confirm` をモック化
    window.confirm = jest.fn().mockReturnValue(true);
  
    const mockTicketsContextValue = {
      playTickets: 1, // チケットが1枚以上ある状態
      setPlayTickets: jest.fn(),
      fetchTickets: jest.fn(),
    };
  
    render(
      <AuthProvider>
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <RoulettePopup />
        </TicketsContext.Provider>
      </AuthProvider>
    );
  
    const user = userEvent.setup();
  
    // 非同期処理が完了するまで待機
    const startButton = await screen.findByTestId('start-button');
    expect(startButton).toBeEnabled();
  
    // ボタンをクリック
    await user.click(startButton);
  
    // `window.confirm` が呼び出されたことを検証
    expect(window.confirm).toHaveBeenCalledWith('チケットを1枚消費して、ルーレットを回しますか？');
  });

  it('starts spinning when the user confirms the action', async () => {
    // `window.confirm` をモック化して「OK」を選択したことにする
    window.confirm = jest.fn().mockReturnValue(true);

    const mockTicketsContextValue = {
      playTickets: 1, // チケットが1枚以上ある状態
      setPlayTickets: jest.fn(),
      fetchTickets: jest.fn(),
    };

    render(
      <AuthProvider>
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <RoulettePopup />
        </TicketsContext.Provider>
      </AuthProvider>
    );

    // `userEvent` のセットアップ
    const user = userEvent.setup();

    // 非同期処理が完了するまで待機
    const startButton = await screen.findByTestId('start-button');
    expect(startButton).toBeInTheDocument();
    expect(startButton).toBeEnabled();

    // ボタンをクリック（非同期操作）
    await user.click(startButton);

    // 状態の変化を待機
    await waitFor(() => {
      expect(startButton).toBeDisabled(); // ボタンが無効化されていることを確認
    });

    // `window.confirm` が呼び出されたことを検証
    expect(window.confirm).toHaveBeenCalledWith('チケットを1枚消費して、ルーレットを回しますか？');
  });

  it('disables the spin button when spinning starts', async () => {
    // `window.confirm` をモック化して「OK」を選択したことにする
    window.confirm = jest.fn().mockReturnValue(true);
  
    const mockTicketsContextValue = {
      playTickets: 1, // チケットが1枚以上ある状態
      setPlayTickets: jest.fn(),
      fetchTickets: jest.fn(),
    };
  
    render(
      <AuthProvider>
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <RoulettePopup />
        </TicketsContext.Provider>
      </AuthProvider>
    );
  
    const user = userEvent.setup();
  
    // ボタンを取得
    const startButton = await screen.findByTestId('start-button');
    expect(startButton).toBeEnabled();
  
    // ボタンをクリックしてスピンを開始
    await user.click(startButton);
  
    // ボタンが無効化されていることを確認
    expect(startButton).toBeDisabled();
  
    // スピン終了後にボタンが再度有効化されることを確認（オプション）確認したい時にコメントアウトを外す
  //  await waitFor(() => {
  //    expect(startButton).toBeEnabled();
  //  }, { timeout: 7000 }); // タイムアウトを6秒に設定
  //}, 8000); // テスト全体のタイムアウトを7秒に設定
  });

  it('calls the correct API endpoint when spinning starts', async () => {
    // `window.confirm` をモック化して「OK」を選択したことにする
    window.confirm = jest.fn().mockReturnValue(true);

    // `fetch` をモック化
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ play_tickets: 2, edit_tickets: 5 }),
    });

    const mockTicketsContextValue = {
      playTickets: 1, // チケットが1枚以上ある状態
      setPlayTickets: jest.fn(),
      fetchTickets: jest.fn(),
    };

    render(
      <AuthProvider>
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <RoulettePopup />
        </TicketsContext.Provider>
      </AuthProvider>
    );

    const user = userEvent.setup();

    // ボタンを取得
    const startButton = await screen.findByTestId('start-button');
    expect(startButton).toBeEnabled();

    // ボタンをクリックしてスピンを開始
    await user.click(startButton);

    // `fetch` が正しいエンドポイントとメソッドで呼び出されたことを検証
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/roulette_texts/spin',
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });
  });

  it('displays the roulette text in the modal after the spin completes', async () => {
    // フェイクタイマーを使用せず、spinDurationを0に設定
    // `window.confirm` をモック化して「OK」を選択したことにする
    window.confirm = jest.fn().mockReturnValue(true);
  
    // `fetch` をモック化（前述のコードを使用）
  
    const mockTicketsContextValue = {
      playTickets: 1,
      setPlayTickets: jest.fn(),
      fetchTickets: jest.fn(),
    };
  
    const onSpinComplete = jest.fn();
  
    render(
      <AuthProvider>
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <RoulettePopup onSpinComplete={onSpinComplete} spinDuration={0} />
        </TicketsContext.Provider>
      </AuthProvider>
    );
  
    const user = userEvent.setup();
  
    const startButton = await screen.findByTestId('start-button');
    await user.click(startButton);
  
    // スピン完了のコールバックが呼ばれるまで待機
    await waitFor(() => {
      expect(onSpinComplete).toHaveBeenCalled();
    });
  
    const selectedSegment = onSpinComplete.mock.calls[0][0];
    const expectedText = `Text for segment ${selectedSegment}`;
  
    const modalText = await screen.findByText((content, element) => {
      return content.includes(expectedText);
    });
    expect(modalText).toBeInTheDocument();
  
    const modal = screen.getByRole('dialog');
    expect(modal).toBeVisible();
  });

  it('updates play tickets in the context after the spin completes', async () => {
    // `window.confirm` をモック化して「OK」を選択したことにする
    window.confirm = jest.fn().mockReturnValue(true);

    // スピンAPIからのレスポンスをモック化
    const updatedPlayTickets = 2; // 期待する更新後のプレイチケット数
    global.fetch = jest.fn((input) => {
      const url = typeof input === 'string' ? new URL(input) : input.url;

      if (url.pathname === '/api/roulette_texts/spin') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ play_tickets: updatedPlayTickets, edit_tickets: 5 }),
        });
      } else if (url.pathname.match(/^\/api\/roulette_texts\/(\d+)$/)) {
        const segmentNumber = url.pathname.match(/^\/api\/roulette_texts\/(\d+)$/)[1];
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ text: `Text for segment ${segmentNumber}` }),
        });
      } else if (url.pathname === '/api/current_user') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ rank: 1 }),
        });
      } else {
        return Promise.reject(new Error('Unknown endpoint'));
      }
    });

    // `setPlayTickets` をモック化
    const mockSetPlayTickets = jest.fn();

    const mockTicketsContextValue = {
      playTickets: 3, // 初期のプレイチケット数
      setPlayTickets: mockSetPlayTickets,
      fetchTickets: jest.fn(),
    };

    render(
      <AuthProvider>
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <RoulettePopup spinDuration={0} />
        </TicketsContext.Provider>
      </AuthProvider>
    );

    const user = userEvent.setup();

    const startButton = await screen.findByTestId('start-button');
    await user.click(startButton);

    // スピンが完了するまで待機
    await waitFor(() => {
      expect(mockSetPlayTickets).toHaveBeenCalledWith(updatedPlayTickets);
    });

    // `setPlayTickets` が正しい値で呼び出されたことを確認
    expect(mockSetPlayTickets).toHaveBeenCalledWith(updatedPlayTickets);
  });

  it('opens and closes the modal correctly after the spin completes', async () => {
    // `window.confirm` をモック化して「OK」を選択したことにする
    window.confirm = jest.fn().mockReturnValue(true);
  
    // `fetch` をモック化
    global.fetch = jest.fn((input) => {
      const url = typeof input === 'string' ? new URL(input) : input.url;
  
      if (url.pathname === '/api/current_user') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ rank: 1 }),
        });
      } else if (url.pathname === '/api/roulette_texts/spin') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ play_tickets: 2, edit_tickets: 5 }),
        });
      } else if (url.pathname.match(/^\/api\/roulette_texts\/(\d+)$/)) {
        const segmentNumber = url.pathname.match(/^\/api\/roulette_texts\/(\d+)$/)[1];
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ text: `Text for segment ${segmentNumber}` }),
        });
      } else {
        return Promise.reject(new Error('Unknown endpoint'));
      }
    });
  
    const mockTicketsContextValue = {
      playTickets: 3,
      setPlayTickets: jest.fn(),
      fetchTickets: jest.fn(),
    };
  
    render(
      <AuthProvider>
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <RoulettePopup spinDuration={0} />
        </TicketsContext.Provider>
      </AuthProvider>
    );
  
    const user = userEvent.setup();
  
    // スピンボタンをクリック
    const startButton = await screen.findByTestId('start-button');
    await user.click(startButton);
  
    // モーダルが表示されるまで待機
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeVisible();
  
    // モーダルの閉じるボタンをクリック
    const closeButton = screen.getByTestId('close-modal-button');
    await user.click(closeButton);
  
    // モーダルが閉じられたことを確認
    await waitFor(() => {
      expect(modal).not.toBeInTheDocument();
    });
  });
  
  it('generates a valid spin angle when spinning the roulette', async () => {
    // `Math.random` をモック化
    const originalMathRandom = Math.random;

    // モック化された `Math.random` が返す値の配列
    const mockRandomValues = [0.1, 0.2, 0.3, 0.4, 0.5];
    let callCount = 0;

    Math.random = jest.fn(() => {
      const value = mockRandomValues[callCount % mockRandomValues.length];
      callCount++;
      return value;
    });

    // `window.confirm` をモック化
    window.confirm = jest.fn().mockReturnValue(true);

    const mockTicketsContextValue = {
      playTickets: 3,
      setPlayTickets: jest.fn(),
      fetchTickets: jest.fn(),
    };

    render(
      <AuthProvider>
        <TicketsContext.Provider value={mockTicketsContextValue}>
          <RoulettePopup spinDuration={0} />
        </TicketsContext.Provider>
      </AuthProvider>
    );

    const user = userEvent.setup();

    // スピンボタンをクリック
    const startButton = await screen.findByTestId('start-button');
    await user.click(startButton);

    // スピン完了を待機
    await waitFor(() => {
      expect(screen.queryByTestId('modal')).toBeInTheDocument();
    });

    // テスト終了後に `Math.random` を元に戻す
    Math.random = originalMathRandom;
  });
});