import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExpCalendar from '../../components/Calendar';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

// fetchWithAuth をモック
jest.mock('../../utils/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
}));

let capturedProps = {};
const mockTileClassNameCalls = [];
jest.mock('react-calendar', () => {
  return function MockCalendar(props) {
    // 新しい props オブジェクトを作成
    const newProps = {
      ...props,
      tileClassName: (tileProps) => {
        mockTileClassNameCalls.push(tileProps);
        return props.tileClassName(tileProps);
      }
    };
    capturedProps = newProps;

    // テスト用の固定日付を生成
    const baseDate = new Date('2025-06-01');
    const dates = Array.from({ length: 31 }, (_, i) => {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      return date;
    });

    return (
      <div className="react-calendar">
        <div className="react-calendar__navigation" />
        <div className="react-calendar__viewContainer">
          <div className="react-calendar__month-view" role="grid">
            {dates.map((date, index) => {
              const className = newProps.tileClassName({ date, view: 'month' });
              return (
                <div key={index} className={className || 'no-exp'} data-date={date.toLocaleDateString('sv-SE')} />
              );
            })}
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
    mockTileClassNameCalls.length = 0;
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

  it('tileClassName は経験値に応じたクラスを返す', async () => {
    // 各経験値レベルのテストデータを用意
    const today = new Date();
    const yyyymmdd = (d) => d.toLocaleDateString('sv-SE');
    const dates = {
      d0: yyyymmdd(today),                    // 2025-06-13
      d1: yyyymmdd(new Date(today.setDate(today.getDate()+1))),
      d2: yyyymmdd(new Date(today.setDate(today.getDate()+1))),
      d3: yyyymmdd(new Date(today.setDate(today.getDate()+1))),
      d4: yyyymmdd(new Date(today.setDate(today.getDate()+1))),
      d5: yyyymmdd(new Date(today.setDate(today.getDate()+1))),
      d6: yyyymmdd(new Date(today.setDate(today.getDate()+1))),
      d7: yyyymmdd(new Date(today.setDate(today.getDate()+1))),
      d8: yyyymmdd(new Date(today.setDate(today.getDate()+1))),
      d9: yyyymmdd(new Date(today.setDate(today.getDate()+1))),
    };

    const mockActivities = {
      [dates.d0]: 0,      // クラスなし
      [dates.d1]: 5,      // exp-level-1
      [dates.d2]: 15,     // exp-level-10
      [dates.d3]: 25,     // exp-level-20
      [dates.d4]: 35,     // exp-level-30
      [dates.d5]: 45,     // exp-level-40
      [dates.d6]: 55,     // exp-level-50
      [dates.d7]: 65,     // exp-level-60
      [dates.d8]: 75,     // exp-level-70
      [dates.d9]: 85,     // exp-level-80
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
      // 各経験値レベルに対応するクラスが存在することを確認
      expect(calendar.querySelectorAll('.exp-level-1')).toHaveLength(1);
      expect(calendar.querySelectorAll('.exp-level-10')).toHaveLength(1);
      expect(calendar.querySelectorAll('.exp-level-20')).toHaveLength(1);
      expect(calendar.querySelectorAll('.exp-level-30')).toHaveLength(1);
      expect(calendar.querySelectorAll('.exp-level-40')).toHaveLength(1);
      expect(calendar.querySelectorAll('.exp-level-50')).toHaveLength(1);
      expect(calendar.querySelectorAll('.exp-level-60')).toHaveLength(1);
      expect(calendar.querySelectorAll('.exp-level-70')).toHaveLength(1);
      expect(calendar.querySelectorAll('.exp-level-80')).toHaveLength(1);
      
      const totalTiles      = 31;                   // MockCalendar で生成した数
      const positiveExpDays = Object.values(mockActivities)
                                  .filter(v => v > 0).length;   // 9
      const expectedNoExp   = totalTiles - positiveExpDays;        // 22
      expect(calendar.querySelectorAll('.no-exp')).toHaveLength(expectedNoExp);
    });
  });

  it('tileClassName は date.toLocaleDateString("sv-SE") で日付キーを作成する', async () => {
    // テスト用の日付を用意
    const testDate = new Date('2025-06-14');
    const expectedKey = testDate.toLocaleDateString('sv-SE'); // '2025-06-14'

    // テスト用の活動データを用意
    const mockActivities = {
      [expectedKey]: 50 // exp-level-50
    };

    // 成功レスポンスをモック
    const mockResponse = {
      ok: true,
      json: async () => mockActivities
    };
    fetchWithAuth.mockResolvedValueOnce(mockResponse);

    // コンポーネントをレンダリング
    render(<ExpCalendar />);

    // tileClassName が呼ばれるのを待つ
    await waitFor(() => {
      expect(mockTileClassNameCalls.length).toBeGreaterThan(0);
    });

    // tileClassName の呼び出しを確認
    const tileCall = mockTileClassNameCalls.find(call => 
      call.date.toLocaleDateString('sv-SE') === expectedKey
    );

    // デバッグ情報を出力
    console.log('Expected key:', expectedKey);
    console.log('Available dates:', mockTileClassNameCalls.map(call => 
      call.date.toLocaleDateString('sv-SE')
    ));

    expect(tileCall).toBeDefined();
    expect(tileCall.date).toBeInstanceOf(Date);
    expect(tileCall.date.toLocaleDateString('sv-SE')).toBe(expectedKey);
  });

  it('setActivities 後に特定日付セルへ対応クラスが付与される', async () => {
    // テスト用の日付と活動データを用意
    const today = new Date();
    const yyyymmdd = (d) => d.toLocaleDateString('sv-SE');
    const dates = {
      d0: yyyymmdd(today),                    // 2025-06-13
      d1: yyyymmdd(new Date(today.setDate(today.getDate()+1))),
      d2: yyyymmdd(new Date(today.setDate(today.getDate()+1))),
    };

    const mockActivities = {
      [dates.d0]: 30,     // exp-level-30
      [dates.d1]: 50,     // exp-level-50
      [dates.d2]: 80,     // exp-level-80
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
      // 各日付に対応するクラスが正しく付与されていることを確認
      const cell30 = calendar.querySelector(`[data-date="${dates.d0}"]`);
      const cell50 = calendar.querySelector(`[data-date="${dates.d1}"]`);
      const cell80 = calendar.querySelector(`[data-date="${dates.d2}"]`);

      expect(cell30).toHaveClass('exp-level-30');
      expect(cell50).toHaveClass('exp-level-50');
      expect(cell80).toHaveClass('exp-level-80');
    });
  });

  it('activities 更新で Calendar が再描画され、古いクラスが置き換わる', async () => {
    // テスト用の日付を用意
    const today = new Date();
    const yyyymmdd = (d) => d.toLocaleDateString('sv-SE');
    const date = yyyymmdd(today);

    // 初期の活動データ
    const initialActivities = {
      [date]: 30 // exp-level-30
    };

    // 更新後の活動データ
    const updatedActivities = {
      [date]: 80 // exp-level-80
    };

    // 成功レスポンスをモック（2回呼ばれる）
    fetchWithAuth
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: async () => initialActivities
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: async () => updatedActivities
      }));

    // コンポーネントをレンダリング
    let v = 0;
    const { rerender } = render(<ExpCalendar key={v} />);

    // カレンダーが存在することを確認
    const calendar = document.querySelector('.react-calendar');
    expect(calendar).toBeInTheDocument();

    // 初期状態を確認
    await waitFor(() => {
      const cell = document.querySelector(`[data-date="${date}"]`);
      expect(cell).toHaveClass('exp-level-30');
      expect(cell).not.toHaveClass('exp-level-80');
    });

    // コンポーネントを再レンダリングして useEffect を再実行
    v++;
    rerender(<ExpCalendar key={v} />);

    // 更新後の状態を確認（タイムアウトを長く設定）
    await waitFor(() => {
      const cell = document.querySelector(`[data-date="${date}"]`);
      expect(cell).toHaveClass('exp-level-80');
      expect(cell).not.toHaveClass('exp-level-30');
    }, { timeout: 3000 });
  });

  it('react-calendar が role="grid" を持つ', () => {
    render(<ExpCalendar />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});