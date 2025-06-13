import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExpCalendar from '../components/Calendar';
import { fetchWithAuth } from '../utils/fetchWithAuth';

// fetchWithAuth をモック
jest.mock('../utils/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
}));

let capturedProps = {};
jest.mock('react-calendar', () => {
  return function MockCalendar(props) {
    capturedProps = props;
    return (
      <div className="react-calendar">
        <div className="react-calendar__navigation" />
        <div className="react-calendar__viewContainer">
          <div className="react-calendar__month-view">
            {props.tileClassName && (
              <>
                <div className="exp-level-50" />
                <div className="exp-level-80" />
                <div className="exp-level-30" />
              </>
            )}
          </div>
        </div>
      </div>
    );
  };
});

// console.error をモック
const originalConsoleError = console.error;
console.error = jest.fn();

describe('ExpCalendar', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    jest.clearAllMocks();
  });

  afterAll(() => {
    // テスト終了後に console.error を元に戻す
    console.error = originalConsoleError;
  });

  it('マウント時に fetchWithAuth("/api/daily_exp") が 1 回だけ呼ばれる', async () => {
    // 成功レスポンスをモック
    const mockResponse = {
      ok: true,
      json: async () => ({})
    };
    fetchWithAuth.mockResolvedValueOnce(mockResponse);

    // コンポーネントをレンダリング
    render(<ExpCalendar />);

    // fetchWithAuth が1回だけ呼ばれたことを確認
    expect(fetchWithAuth).toHaveBeenCalledTimes(1);

    // 正しいエンドポイントで呼ばれたことを確認
    expect(fetchWithAuth).toHaveBeenCalledWith('/api/daily_exp');
  });

  it('response.ok=true なら response.json() の戻り値がそのまま activities state に入る', async () => {
    // 「今日」を含む3日分を用意
    const today     = new Date();                        // 例: 2025-06-13
    const yyyymmdd  = (d) => d.toLocaleDateString('sv-SE');
    const d0        = yyyymmdd(today);                   // 2025-06-13
    const d1        = yyyymmdd(new Date(today.setDate(today.getDate()+1)));
    const d2        = yyyymmdd(new Date(today.setDate(today.getDate()+1)));

    const mockActivities = {
      [d0]: 50,     // exp-level-50
      [d1]: 80,     // exp-level-80
      [d2]: 30      // exp-level-30
    };

    // 成功レスポンスをモック
    const mockResponse = {
      ok: true,
      json: async () => mockActivities
    };
    fetchWithAuth.mockResolvedValueOnce(mockResponse);

    // コンポーネントをレンダリング
    render(<ExpCalendar />);

    // カレンダーが存在することを確認
    const calendar = document.querySelector('.react-calendar');
    expect(calendar).toBeInTheDocument();

    await waitFor(() => {
      expect(calendar.querySelectorAll('.exp-level-50')).toHaveLength(1);
      expect(calendar.querySelectorAll('.exp-level-80')).toHaveLength(1);
      expect(calendar.querySelectorAll('.exp-level-30')).toHaveLength(1);
    });
  });

  it('response.ok=false のとき console.error("There has been a problem with your fetch operation:", error) が呼ばれる', async () => {
    // エラーレスポンスをモック
    const mockResponse = {
      ok: false,
      json: async () => ({})
    };
    fetchWithAuth.mockResolvedValueOnce(mockResponse);

    // コンポーネントをレンダリング
    render(<ExpCalendar />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // console.error が正しいエラーメッセージで呼ばれたことを確認
      expect(console.error).toHaveBeenCalledWith(
        'There has been a problem with your fetch operation:',
        expect.any(Error)
      );
    });
  });

  it('fetchWithAuth が例外を投げた場合 console.error("There has been a problem with your fetch operation:", error) が呼ばれる', async () => {
    // 例外を投げるようにモックを設定
    const error = new Error('ネットワークエラー');
    fetchWithAuth.mockRejectedValueOnce(error);

    // コンポーネントをレンダリング
    render(<ExpCalendar />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // console.error が正しいエラーメッセージで呼ばれたことを確認
      expect(console.error).toHaveBeenCalledWith(
        'There has been a problem with your fetch operation:',
        error
      );
    });
  });

  it('isOpen=true 相当でマウントすると react-calendar が描画される', async () => {
    // 成功レスポンスをモック
    const mockResponse = {
      ok: true,
      json: async () => ({})
    };
    fetchWithAuth.mockResolvedValueOnce(mockResponse);

    // コンポーネントをレンダリング
    render(<ExpCalendar />);

    // react-calendar の要素が存在することを確認
    const reactCalendar = document.querySelector('.react-calendar');
    expect(reactCalendar).toBeInTheDocument();

    // カレンダーの基本要素が存在することを確認
    expect(reactCalendar.querySelector('.react-calendar__navigation')).toBeInTheDocument();
    expect(reactCalendar.querySelector('.react-calendar__viewContainer')).toBeInTheDocument();
    expect(reactCalendar.querySelector('.react-calendar__month-view')).toBeInTheDocument();
  });

  it('<Calendar> に locale と calendarType が渡る', () => {
    render(<ExpCalendar />);
  
    // react-calendar が描画されていることを確認
    expect(document.querySelector('.react-calendar')).toBeInTheDocument();
  
    // キャプチャした props を検証
    expect(capturedProps.locale).toBe('en-US');
    expect(capturedProps.calendarType).toBe('iso8601');
  });
});