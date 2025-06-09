import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoulettePopup from '../components/RoulettePopup';
import { isValidAngle } from '../components/RoulettePopup';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { TicketsContext } from '../contexts/TicketsContext';


jest.mock('../utils/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
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

  
});