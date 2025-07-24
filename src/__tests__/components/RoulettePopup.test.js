import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoulettePopup from '../../components/RoulettePopup';
import { isValidAngle } from '../../components/RoulettePopup';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { TicketsContext } from '../../contexts/TicketsContext';
import { fetchRouletteText } from '../../components/utils';
import * as utils from '../../components/utils';


jest.mock('../../contexts/TicketsContext', () => {
  const React = require('react');
  return {
    TicketsContext: React.createContext({
      tickets: 0,
      setTickets: jest.fn(),
      fetchTickets: jest.fn(),
    }),
  };
});

jest.mock('../../utils/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock('../../components/Modal', () => {
  const React = require('react');
  /*
    モック Modal
    - isOpen===true なら <div role="dialog"> を返す
    - data-testid は付けない（付いていても構わない）
    これにより、実装側で data-testid を外してもテストが role="dialog" で通る
  */
  return function MockedModal({ isOpen, children }) {
    return isOpen ? <div role="dialog">{children}</div> : null;
  };
});

jest.mock('../../components/utils', () => ({
  ...jest.requireActual('../../components/utils'),
  fetchRouletteText: jest.fn()
}));


describe('ユーティリティ関数 isValidAngle', () => {
  /* ── 正常系 ───────────────────────────────────── */
  it.each([10, 50, 100])('%i° は除外レンジ外なので true を返す', (angle) => {
    expect(isValidAngle(angle)).toBe(true);
  });

  /* ── 境界値 ───────────────────────────────────── */
  const boundaryAngles = [
    0, 5,
    25, 35,
    55, 65,
    85, 95,
    115, 125,
    145, 155,
    175, 185,
    205, 215,
    235, 245,
    265, 275,
    295, 305,
    325, 335,
    355, 359,
  ];

  it.each(boundaryAngles)('%i° は除外レンジ境界なので false を返す', (angle) => {
    expect(isValidAngle(angle)).toBe(false);
  });

  /* ── 異常・限界値 ─────────────────────────────── */
  it.each([-10, -1, 360, 720])(
    '%i° は 0–359° の範囲外だが除外対象ではないため true を返す',
    (angle) => {
      expect(isValidAngle(angle)).toBe(true);
    },
  );
});


describe('初期レンダリング', () => {
  it('ルーレット用コンテナ・ポインタ・ホイールが存在していること', () => {
    render(
      <TicketsContext.Provider
        value={{
          tickets: 1,
          setTickets: jest.fn(),
          fetchTickets: jest.fn(),
        }}
      >
        <RoulettePopup />
      </TicketsContext.Provider>
    );

    expect(screen.getByTestId('roulette-container')).toBeTruthy();
    expect(screen.getByTestId('roulette-pointer')).toBeTruthy();
    expect(screen.getByTestId('roulette-wheel')).toBeTruthy();
  });

  it('segment 要素が 12 個生成され、data-number が 1〜12 の連番になっていること', () => {
    render(
      <TicketsContext.Provider value={{ tickets: 1, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
        <RoulettePopup />
      </TicketsContext.Provider>
    );

    // テストIDを正規表現で取得
    const segments = screen.getAllByTestId((testId) => /^segment-\d+$/.test(testId));

    // 12 個あること
    expect(segments.length).toBe(12);

    // data-number が 1〜12 の連番になっていること
    segments.forEach((seg, idx) => {
      expect(seg.getAttribute('data-number')).toBe(String(idx + 1));
    });
  });

  it('初期状態では rotation が 90deg で適用され、transition が none である', () => {
    render(
      <TicketsContext.Provider value={{ tickets: 1, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
        <RoulettePopup />
      </TicketsContext.Provider>
    );

    const wheel = screen.getByTestId('roulette-wheel');
    // transform style の確認
    expect(wheel.style.transform).toBe('rotate(90deg)');
    // isSpinning=false のため transition は none
    expect(wheel.style.transition).toBe('none');
  });

  it('「ルーレットを回す」ボタンが存在し、初期状態で disabled=false', () => {
    render(
      <TicketsContext.Provider value={{ tickets: 1, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
        <RoulettePopup />
      </TicketsContext.Provider>
    );

    const button = screen.getByTestId('start-button');
    expect(button).toBeTruthy();
    expect(button.disabled).toBe(false);
  });
});


describe('チケット関連の分岐', () => {
  it('tickets が 0 の場合、クリック時に alert が呼び出され、fetchWithAuth が呼ばれない', () => {
    // alert をモック
    window.alert = jest.fn();

    // tickets=0 のコンテキスト値を Provider で注入
    render(
      <TicketsContext.Provider
        value={{
          tickets: 0,
          setTickets: jest.fn(),
          fetchTickets: jest.fn(),
        }}
      >
        <RoulettePopup />
      </TicketsContext.Provider>
    );

    fireEvent.click(screen.getByTestId('start-button'));

    // アラートが呼ばれる
    expect(window.alert).toHaveBeenCalledWith('チケットが不足しています');
    // API 呼び出しは行われない
    expect(fetchWithAuth).not.toHaveBeenCalled();
  });

  it('window.confirm が false を返した場合、スピンが開始されない（setIsSpinning も呼ばれない）', () => {
    // confirm をモックして「いいえ」を返す
    window.confirm = jest.fn(() => false);
  
    render(
      <TicketsContext.Provider
        value={{ tickets: 1, setTickets: jest.fn(), fetchTickets: jest.fn() }}
      >
        <RoulettePopup />
      </TicketsContext.Provider>
    );
  
    const wheel = screen.getByTestId('roulette-wheel');
    const button = screen.getByTestId('start-button');
  
    // ボタンをクリック
    fireEvent.click(button);
  
    // 確認ダイアログが出ていること
    expect(window.confirm).toHaveBeenCalledWith(
      'チケットを1枚消費して、ルーレットを回しますか？'
    );
  
    // API 呼び出しは行われない
    expect(fetchWithAuth).not.toHaveBeenCalled();
  
    // スピン開始フラグが立っていないので transition は none のまま
    expect(wheel.style.transition).toBe('none');
    // ボタンもまだ有効
    expect(button.disabled).toBe(false);
  });


  it('window.confirm が true の場合、fetchWithAuth("/api/roulette_texts/spin", PATCH) が呼ばれ、成功時に setTickets へレスポンスの tickets が反映される', async () => {
    // confirm をモックして「はい」を返す
    window.confirm = jest.fn(() => true);

    // fetchWithAuth のモックレスポンスを用意
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tickets: 3 }),
    });

    const mockSetTickets = jest.fn();
    const mockFetchTickets = jest.fn();

    render(
      <TicketsContext.Provider
        value={{
          tickets: 1,
          setTickets: mockSetTickets,
          fetchTickets: mockFetchTickets,
        }}
      >
        <RoulettePopup />
      </TicketsContext.Provider>
    );

    // ボタンをクリックして処理を開始
    fireEvent.click(screen.getByTestId('start-button'));

    // fetchWithAuth が正しい引数で呼ばれるのを待機
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/roulette_texts/spin',
        { method: 'PATCH' }
      );
    });

    // 成功レスポンスから setTickets が呼ばれるのを確認
    expect(mockSetTickets).toHaveBeenCalledWith(3);
  });

  it('response.ok が false の場合、alert にエラーメッセージを表示し、スピンを開始しない', async () => {
    // confirm は「はい」を返す
    window.confirm = jest.fn(() => true);
    // alert をモック
    window.alert = jest.fn();
    // fetchWithAuth をエラー返却でモック
    fetchWithAuth.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'テスト用エラー' }),
    });
  
    render(
      <TicketsContext.Provider
        value={{
          tickets: 1,
          setTickets: jest.fn(),
          fetchTickets: jest.fn(),
        }}
      >
        <RoulettePopup />
      </TicketsContext.Provider>
    );
  
    // ボタンをクリックして API 呼び出しへ
    fireEvent.click(screen.getByTestId('start-button'));
  
    // fetchWithAuth が呼ばれるのを待機
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/roulette_texts/spin',
        { method: 'PATCH' }
      );
    });
  
    // エラーメッセージで alert が呼ばれる
    expect(window.alert).toHaveBeenCalledWith('テスト用エラー');
  
    // 角度は変わらず 90deg のまま（回転していない）
    const wheel = screen.getByTestId('roulette-wheel');
    expect(wheel.style.transform).toBe('rotate(90deg)');
  });
});


describe('ルーレット回転処理', () => {
  beforeEach(() => {
    // confirm は「はい」を返し、API モックも成功レスポンスを返す
    window.confirm = jest.fn(() => true);
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tickets: 5 }),
    });
    jest.spyOn(Math, 'random').mockReturnValue(100 / 360);
    // fetchRouletteText のデフォルト戻り値
    utils.fetchRouletteText.mockResolvedValue({ text: 'テストテキスト' });
  });

  afterEach(() => {
    jest.spyOn(Math, 'random').mockRestore();
  });

  it('スピン開始後 isSpinning が true になり、ボタンが disabled になる', () => {
    const mockSetTickets = jest.fn();
    const mockFetchTickets = jest.fn();

    render(
      <TicketsContext.Provider value={{ tickets: 5, setTickets: mockSetTickets, fetchTickets: mockFetchTickets }}>
        <RoulettePopup />
      </TicketsContext.Provider>
    );

    const button = screen.getByTestId('start-button');
    // 初期状態では有効
    expect(button.disabled).toBe(false);

    // クリックでスピン開始
    fireEvent.click(button);

    // isSpinning が true になってボタンが無効化される
    expect(button.disabled).toBe(true);
  });

  it('Math.random をモックして決定角を固定 → setRotation に 5×360 + randomAngle + 初期 90 が適用される', async () => {
    jest.useRealTimers();

    render(
      <TicketsContext.Provider value={{ tickets: 5, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
        <RoulettePopup spinDuration={0} />
      </TicketsContext.Provider>
    );

    // スピン開始
    fireEvent.click(screen.getByTestId('start-button'));

    await waitFor(() => {
      const wheel = screen.getByTestId('roulette-wheel');
      const expected = 90 + 5 * 360 + 100;
      expect(wheel.style.transform).toBe(`rotate(${expected}deg)`);
    });
  });

  it('isSpinning が true の間、transition が cubic-bezier(0.17, 0.67, 0.83, 0.67) 付きで 6s になる', () => {
    const mockSetTickets = jest.fn();
    const mockFetchTickets = jest.fn();
    render(
      <TicketsContext.Provider value={{ tickets: 5, setTickets: mockSetTickets, fetchTickets: mockFetchTickets }}>
        <RoulettePopup />
      </TicketsContext.Provider>
    );

    const button = screen.getByTestId('start-button');
    fireEvent.click(button);

    const wheel = screen.getByTestId('roulette-wheel');
    expect(wheel.style.transition).toBe(
      'transform 6s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
    );
  });

  it('onSpinComplete prop が渡された場合、setTimeout 後に正しい matchNumber が渡される', async () => {
    // Math.random → 100°
    jest.spyOn(Math, 'random').mockReturnValue(100 / 360);
    // confirm は OK
    window.confirm = jest.fn(() => true);
    // API 成功
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tickets: 5 }),
    });
  
    // FakeTimers
    jest.useFakeTimers();
  
    const mockOnSpinComplete = jest.fn();
  
    render(
      <TicketsContext.Provider value={{ tickets: 5, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
        <RoulettePopup spinDuration={0} onSpinComplete={mockOnSpinComplete} />
      </TicketsContext.Provider>
    );
  
    // スピン開始
    fireEvent.click(screen.getByTestId('start-button'));
  
    /* ① fetchWithAuth の Promise が解決するまで待つ
         （ここで startSpinning() が呼ばれる） */
    await waitFor(() => expect(fetchWithAuth).toHaveBeenCalled());
  
    /* ② setTimeout(0) を即実行して onSpinComplete をコール */
    jest.runAllTimers();
  
    // matchNumber の検証（randomAngle=100 → matchNumber=9）
    expect(mockOnSpinComplete).toHaveBeenCalledWith(9);
  
    jest.useRealTimers();
    Math.random.mockRestore();
  });
  
  
  it('Math.random をレンジ内 → レンジ外の順で返すようにし、再抽選が機能するか確認', async () => {
    // confirm は OK
    window.confirm = jest.fn(() => true);

    // spin API は成功
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tickets: 5 }),
    });

    // fetchRouletteText のモックを追加
    utils.fetchRouletteText.mockResolvedValueOnce({ text: 'テストテキスト' });

    // 最初 randomAngle=3（除外範囲内）、次に randomAngle=50（有効）
    const randomValues = [3 / 360, 50 / 360];
    jest.spyOn(Math, 'random').mockImplementation(() => randomValues.shift());

    // リアルタイマーに戻す
    jest.useRealTimers();

    render(
      <TicketsContext.Provider value={{ tickets: 5, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
        {/* spinDuration=0 で待ち時間なしに */}
        <RoulettePopup spinDuration={0} />
      </TicketsContext.Provider>
    );

    // スピン開始
    fireEvent.click(screen.getByTestId('start-button'));

    // fetchWithAuth が呼ばれて startSpinning が実行されるまで待つ
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts/spin', { method: 'PATCH' });
    });

    // rotation が更新されるまでポーリング
    await waitFor(() => {
      const wheel = screen.getByTestId('roulette-wheel');
      // 初期 90 + 5*360 + 50 = 90 + 1800 + 50 = 1940
      expect(wheel.style.transform).toBe('rotate(1940deg)');
    });

    // モーダルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText('ごほうびルーレットの結果です！！！: テストテキスト')).toBeTruthy();
    });

    // cleanup
    Math.random.mockRestore();
  }, 10000); // Add 10 second timeout
});


describe('モーダルの挙動', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fetchRouletteText が matchNumber を引数に呼ばれ、戻り値で rouletteText が更新される', async () => {
    // ----------------- モック設定 -----------------
    window.confirm = jest.fn(() => true);
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tickets: 5 }),
    });

    // ここで "実装版" を spy して戻り値を差し替える
    utils.fetchRouletteText.mockResolvedValueOnce({ text: 'テストテキスト' });

    // randomAngle: 3° (除外) → 60° (有効)
    const rands = [3 / 360, 50 / 360];
    jest.spyOn(Math, 'random').mockImplementation(() => rands.shift());

    // ----------------- レンダリング -----------------
    render(
      <TicketsContext.Provider value={{ tickets: 5, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
        <RoulettePopup spinDuration={0} />
      </TicketsContext.Provider>
    );

    fireEvent.click(screen.getByTestId('start-button'));

    // API → startSpinning() 完了を待つ
    await waitFor(() =>
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts/spin', { method: 'PATCH' })
    );

    // 60° ⇒ matchNumber = ceil((360-60)/30) = 10
    await waitFor(() =>
      expect(utils.fetchRouletteText).toHaveBeenCalledWith(11)
    );

    const modal = await screen.findByRole('dialog');
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain('ごほうびルーレットの結果です！！！: テストテキスト');

    Math.random.mockRestore();
  });

  it('API完了後に <Modal> が isOpen=true でレンダリングされ、テキストが表示される', async () => {
  
    // 確認ダイアログ／APIレスポンスをモック
    window.confirm = jest.fn(() => true);
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tickets: 5 }),
    });

    utils.fetchRouletteText.mockResolvedValueOnce({ text: 'テストテキスト' });
  
    // randomAngle: 3° (除外) → 50° (有効)
    const rands = [3 / 360, 50 / 360];
    jest.spyOn(Math, 'random').mockImplementation(() => rands.shift());
  
    // コンポーネントをレンダリング
    render(
      <TicketsContext.Provider value={{ tickets: 5, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
        <RoulettePopup spinDuration={0} />
      </TicketsContext.Provider>
    );
  
    // スピン開始
    fireEvent.click(screen.getByTestId('start-button'));
  
    // fetchWithAuth と fetchRouletteText の呼び出しを待機
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts/spin', { method: 'PATCH' });
    });
    // matchNumber = ceil((360 - 50)/30) = 11
    await waitFor(() => {
      expect(utils.fetchRouletteText).toHaveBeenCalledWith(11);
    });
  
    // モーダル要素が出現し、テキストが表示されていることを確認
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain('ごほうびルーレットの結果です！！！: テストテキスト');
  
    Math.random.mockRestore();
  });

  it('「Close」ボタン押下でモーダルが閉じ、スピン状態が解除され、fetchTickets() が呼ばれる', async () => {
    // モック設定
    window.confirm = jest.fn(() => true);
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tickets: 5 }),
    });
    // fetchRouletteText の戻り値
    utils.fetchRouletteText.mockResolvedValueOnce({ text: 'テストテキスト' });
  
    // randomAngle: 3° (除外) → 50° (有効)
    const rands = [3 / 360, 50 / 360];
    jest.spyOn(Math, 'random').mockImplementation(() => rands.shift());
  
    const mockFetchTickets = jest.fn();
  
    // レンダリング
    render(
      <TicketsContext.Provider
        value={{
          tickets: 5,
          setTickets: jest.fn(),
          fetchTickets: mockFetchTickets,
        }}
      >
        <RoulettePopup spinDuration={0} />
      </TicketsContext.Provider>
    );
  
    // スピン開始してモーダルを開く
    fireEvent.click(screen.getByTestId('start-button'));
    await screen.findByRole('dialog');
  
    // モーダルの「Close」ボタンをクリック
    fireEvent.click(screen.getByTestId('close-modal-button'));
  
    // モーダルが閉じていること
    expect(screen.queryByRole('dialog')).toBeNull();
  
    // スピン解除でボタンが再び有効化されていること
    const startButton = screen.getByTestId('start-button');
    expect(startButton.disabled).toBe(false);
  
    // fetchTickets が呼ばれていること
    expect(mockFetchTickets).toHaveBeenCalled();
  
    Math.random.mockRestore();
  });
  
});


describe('プロパティ／外部依存', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('props から短い spinDuration を渡し、setTimeout がその時間で発火する', async () => {
    // --- モック設定 ---
    window.confirm = jest.fn(() => true);
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tickets: 1 }),
    });
    utils.fetchRouletteText.mockResolvedValueOnce({ text: 'OK' });

    // randomAngle を有効値に
    jest.spyOn(Math, 'random').mockReturnValue(45 / 360); // 45° → valid

    // FakeTimers を有効化
    jest.useFakeTimers();

    const mockFetchTickets = jest.fn();

    render(
      <TicketsContext.Provider value={{ tickets: 1, setTickets: jest.fn(), fetchTickets: mockFetchTickets }}>
        <RoulettePopup spinDuration={100} />
      </TicketsContext.Provider>
    );

    // スピン開始
    fireEvent.click(screen.getByTestId('start-button'));

    // タイマー発火前はモーダルなし
    expect(screen.queryByRole('dialog')).toBeNull();

    // 99ms 経過 → まだモーダル出ない
    jest.advanceTimersByTime(99);
    expect(screen.queryByRole('dialog')).toBeNull();

    // 残り 1ms 経過 → モーダルが出る
    jest.advanceTimersByTime(1);

    // API 呼び出し完了とテキスト取得を待ってモーダルがレンダリングされること
    await waitFor(() => {
      expect(utils.fetchRouletteText).toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect(screen.getByText('ごほうびルーレットの結果です！！！: OK')).toBeTruthy();
    });
  });

  it('TicketsContext がない場合でもクラッシュせずデフォルト tickets=0 でボタンが無効', () => {
    render(<RoulettePopup spinDuration={0} />);

    const startButton = screen.getByTestId('start-button');
    expect(startButton).toBeTruthy(); 
    expect(startButton.disabled).toBe(false);

    window.alert = jest.fn();
    fireEvent.click(startButton);
    expect(window.alert).toHaveBeenCalledWith('チケットが不足しています');
  });
});

describe('初期チケット枚数の表示', () => {
  it('tickets が 5 のとき「チケット:5」と表示される', () => {
    /* ルーレット本体はチケット数を直接描画しないため
       ダッシュボード側などで表示している <span data-testid="ticket-count">
       をモックして確認する */

    const TicketViewer = () => {
      const { tickets } = React.useContext(TicketsContext)
      return <span data-testid="ticket-count">チケット:{tickets}</span>
    }

    render(
      <TicketsContext.Provider
        value={{ tickets: 5, setTickets: jest.fn(), fetchTickets: jest.fn() }}
      >
        <TicketViewer />   {/* ←ここで tickets を表示 */}
        <RoulettePopup />
      </TicketsContext.Provider>
    )

    expect(screen.getByTestId('ticket-count').textContent).toBe('チケット:5')
  })
})

/* ──────────────────────────────────────────────────────────────── */
/* お試しスピン (Trial Spin)                                       */
/* ──────────────────────────────────────────────────────────────── */

describe('お試しスピン (Trial Spin)', () => {
  beforeEach(() => {
    // fetchWithAuth など前回までの呼び出しをクリア
    fetchWithAuth.mockClear();

    // Math.random を固定して deterministic にする (100°)
    jest.spyOn(Math, 'random').mockReturnValue(100 / 360);

    // fetchRouletteText の戻り値をモック
    utils.fetchRouletteText.mockResolvedValue({ text: 'トライアルテキスト' });
  });

  afterEach(() => {
    Math.random.mockRestore();
    jest.restoreAllMocks();
  });

  it('「お試しで回す」ボタンが存在し、初期状態で有効', () => {
    render(
      <TicketsContext.Provider value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
        <RoulettePopup />
      </TicketsContext.Provider>
    );

    const trialBtn = screen.getByTestId('trial-button');
    expect(trialBtn).toBeTruthy();
    expect(trialBtn.disabled).toBe(false);
  });

  it('お試しボタン押下で API 呼び出しなしにスピンし、モーダルが表示される', async () => {
    // window.confirm は使われない想定なので spy だけしておく
    window.confirm = jest.fn();

    const mockSetTickets = jest.fn();

    render(
      <TicketsContext.Provider value={{ tickets: 1, setTickets: mockSetTickets, fetchTickets: jest.fn() }}>
        <RoulettePopup spinDuration={0} />
      </TicketsContext.Provider>
    );

    const trialBtn = screen.getByTestId('trial-button');

    // クリックでスピン開始
    fireEvent.click(trialBtn);

    // confirm は呼ばれない
    expect(window.confirm).not.toHaveBeenCalled();

    // API 呼び出しも行われない
    expect(fetchWithAuth).not.toHaveBeenCalled();

    // setTickets も呼ばれない（チケット消費なし）
    expect(mockSetTickets).not.toHaveBeenCalled();

    // fetchRouletteText が呼ばれるのを待機
    await waitFor(() => {
      expect(utils.fetchRouletteText).toHaveBeenCalled();
    });

    // モーダル表示 & テキスト確認
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeTruthy();
    expect(modal.textContent).toContain('トライアルテキスト');
  });
});