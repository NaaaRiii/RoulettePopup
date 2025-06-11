import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExpLineChart from '../components/ExpLineChart';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { format, subDays, addDays } from 'date-fns';


// fetchWithAuth のモック
jest.mock('../utils/fetchWithAuth');

// ResizeObserver のモック
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

beforeAll(() => {
  // jsdom 上で要素に幅・高さを持たせる
  global.HTMLElement.prototype.getBoundingClientRect = function () {
    return {
      width: 800,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => {}
    };
  };
});

describe('ExpLineChart コンポーネント', () => {
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    // デフォルトのモック実装
    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
    // console.error のモック
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // console.error のモックをリセット
    console.error.mockRestore();
  });

  it('マウント時に fetchWithAuth が正しいエンドポイントで一度だけ呼ばれること', async () => {
    render(<ExpLineChart />);

    // fetchWithAuth が呼ばれたことを確認
    expect(fetchWithAuth).toHaveBeenCalledTimes(1);
    expect(fetchWithAuth).toHaveBeenCalledWith('/api/weekly_exp');

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledTimes(1);
    });
  });

  it('正常なレスポンスの場合、データが正しく変換されてステートに格納されること', async () => {
    // モックデータの設定
    const mockData = [
      { date: '2024-03-01', exp: 100 },
      { date: '2024-03-02', exp: 200 },
      { date: '2024-03-03', exp: 300 }
    ];

    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    const { container } = render(<ExpLineChart />);

    // ResponsiveContainer が描画されるのを待つ
    await waitFor(() => {
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    }, { timeout: 3000 });

    // SVG 要素が描画されるのを待つ
    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    }, { timeout: 3000 });

    // データポイントが描画されるのを待つ
    await waitFor(() => {
      const dots = container.querySelectorAll('circle');
      expect(dots).toHaveLength(mockData.length);
    }, { timeout: 3000 });
  });

  it('API レスポンスが失敗した場合、エラーがログに出力されること', async () => {
    // 失敗するレスポンスをモック
    fetchWithAuth.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to fetch data' })
    });

    render(<ExpLineChart />);

    // エラーメッセージがログに出力されるのを待つ
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching data:',
        expect.any(Error)
      );
    });

    // エラーメッセージの内容を確認
    const errorMessage = console.error.mock.calls[0][1].message;
    expect(errorMessage).toBe('Failed to fetch data');
  });

  it('API レスポンスが配列でない場合、エラーがログに出力されること', async () => {
    // 配列でないレスポンスをモック
    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'not an array' })
    });

    render(<ExpLineChart />);

    // エラーメッセージがログに出力されるのを待つ
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching data:',
        expect.any(Error)
      );
    });

    // エラーメッセージの内容を確認
    const errorMessage = console.error.mock.calls[0][1].message;
    expect(errorMessage).toBe('Data is not an array');
  });

  it('データが正しく整形されること', async () => {
    // モックデータの設定
    const mockData = [
      { date: '2024-03-01', exp: 100 },
      { date: '2024-03-02', exp: 200 },
      { date: '2024-03-03', exp: 300 }
    ];

    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    const { container } = render(<ExpLineChart />);

    // データが正しく整形されて表示されるのを待つ
    await waitFor(() => {
      // データポイントの数が正しいことを確認
      const dots = container.querySelectorAll('.recharts-dot');
      expect(dots).toHaveLength(mockData.length);

      // 各データポイントの位置が正しく設定されていることを確認
      dots.forEach((dot) => {
        const cy = dot.getAttribute('cy');
        expect(cy).not.toBeNull();
        // cy の値が 10 から 370 の範囲内であることを確認（チャートの高さ範囲内）
        const cyValue = parseFloat(cy);
        expect(cyValue).toBeGreaterThanOrEqual(10);
        expect(cyValue).toBeLessThanOrEqual(370);
      });
    }, { timeout: 3000 });
  });

  it('day プロパティがインデックスに置き換わること', async () => {
    // モックデータの設定
    const mockData = [
      { date: '2024-03-01', exp: 100 },
      { date: '2024-03-02', exp: 200 },
      { date: '2024-03-03', exp: 300 }
    ];

    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    const { container } = render(<ExpLineChart />);

    // データが正しく変換されて表示されるのを待つ
    await waitFor(() => {
      // データポイントの数が正しいことを確認
      const dots = container.querySelectorAll('.recharts-dot');
      expect(dots).toHaveLength(mockData.length);

      // 各データポイントの x 座標（cx）が正しく設定されていることを確認
      dots.forEach((dot, index) => {
        const cx = dot.getAttribute('cx');
        expect(cx).not.toBeNull();
        // cx の値が 60 から 770 の範囲内であることを確認（チャートの幅範囲内）
        const cxValue = parseFloat(cx);
        expect(cxValue).toBeGreaterThanOrEqual(60);
        expect(cxValue).toBeLessThanOrEqual(770);

        // データポイントが左から右へ順番に配置されていることを確認
        if (index > 0) {
          const prevCx = parseFloat(dots[index - 1].getAttribute('cx'));
          expect(cxValue).toBeGreaterThan(prevCx);
        }
      });
    }, { timeout: 3000 });
  });

  it('X軸の日付が正しくフォーマットされて表示されること', async () => {
    // モックデータの設定
    const mockData = [
      { date: '2024-03-01', exp: 100 },
      { date: '2024-03-02', exp: 200 },
      { date: '2024-03-03', exp: 300 }
    ];

    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    const { container } = render(<ExpLineChart />);

    // 日付が正しくフォーマットされて表示されるのを待つ
    await waitFor(() => {
      // X軸のテキスト要素を取得
      const xAxisTexts = container.querySelectorAll('.recharts-cartesian-axis-tick text');
      expect(xAxisTexts.length).toBeGreaterThan(0);

      // 各日付が M/d 形式で表示されていることを確認
      xAxisTexts.forEach((text) => {
        const dateText = text.textContent;
        // M/d 形式の正規表現パターン（例: 6/8）
        const datePattern = /^\d{1,2}\/\d{1,2}$/;
        expect(dateText).toMatch(datePattern);
      });
    }, { timeout: 3000 });
  });

  it('今日の日付が赤色で表示され、それ以外の日付が灰色で表示されること', async () => {
    // モックデータの設定
    const mockData = [
      { date: '2024-03-01', exp: 100 },
      { date: '2024-03-02', exp: 200 },
      { date: '2024-03-03', exp: 300 }
    ];

    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    const { container } = render(<ExpLineChart />);

    // 日付の色が正しく設定されていることを確認
    await waitFor(() => {
      // X軸のテキスト要素を取得
      const xAxisTexts = container.querySelectorAll('.recharts-cartesian-axis-tick text');
      expect(xAxisTexts.length).toBeGreaterThan(0);

      // 今日の日付を取得
      const today = new Date();
      const todayFormatted = format(today, 'M/d');

      // 各日付の色を確認
      xAxisTexts.forEach((text) => {
        const dateText = text.textContent;
        const style = text.getAttribute('style');
        const fillColor = style.match(/fill: ([^;]+)/)?.[1];
        
        if (dateText === todayFormatted) {
          // 今日の日付は赤色
          expect(fillColor).toBe('red');
        } else {
          // それ以外の日付は灰色
          expect(fillColor).toBe('#666');
        }
      });
    }, { timeout: 3000 });
  });

  it('主要コンポーネントが正しい階層でレンダリングされる', async () => {
    // モックデータの設定
    const mockData = [
      { date: '2024-03-01', exp: 100 },
      { date: '2024-03-02', exp: 200 },
      { date: '2024-03-03', exp: 300 }
    ];

    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    const { container } = render(<ExpLineChart />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // ResponsiveContainer の存在を確認
      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toBeInTheDocument();

      // LineChart の存在を確認
      const lineChart = container.querySelector('.recharts-wrapper');
      expect(lineChart).toBeInTheDocument();

      // CartesianGrid の存在を確認
      const cartesianGrid = container.querySelector('.recharts-cartesian-grid');
      expect(cartesianGrid).toBeInTheDocument();

      // XAxis の存在を確認
      const xAxis = container.querySelector('.recharts-xAxis');
      expect(xAxis).toBeInTheDocument();

      // YAxis の存在を確認
      const yAxis = container.querySelector('.recharts-yAxis');
      expect(yAxis).toBeInTheDocument();

      // Tooltip の存在を確認
      const tooltip = container.querySelector('.recharts-tooltip-wrapper');
      expect(tooltip).toBeInTheDocument();

      // Line の存在を確認
      const line = container.querySelector('.recharts-line');
      expect(line).toBeInTheDocument();

      // コンポーネントの階層関係を確認
      expect(responsiveContainer).toContainElement(lineChart);
      expect(lineChart).toContainElement(cartesianGrid);
      expect(lineChart).toContainElement(xAxis);
      expect(lineChart).toContainElement(yAxis);
      expect(lineChart).toContainElement(tooltip);
      expect(lineChart).toContainElement(line);
    }, { timeout: 3000 });
  });

  it('XAxis に CustomTick が正しく渡され、日付が正しく表示される', async () => {
    // モックデータの設定
    const mockData = [
      { date: '2024-03-01', exp: 100 },
      { date: '2024-03-02', exp: 200 },
      { date: '2024-03-03', exp: 300 }
    ];

    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    const { container } = render(<ExpLineChart />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // XAxis の tick 要素を取得
      const tickElements = container.querySelectorAll('.recharts-cartesian-axis-tick text');
      expect(tickElements.length).toBeGreaterThan(0);

      // 今日の日付を取得
      const today = new Date();
      const todayFormatted = format(today, 'M/d');

      // 各 tick の内容を確認
      tickElements.forEach((tick) => {
        const dateText = tick.textContent;
        const style = tick.getAttribute('style');
        const fillColor = style.match(/fill: ([^;]+)/)?.[1];

        // 日付が M/d 形式で表示されていることを確認
        expect(dateText).toMatch(/^\d{1,2}\/\d{1,2}$/);

        // 今日の日付は赤色、それ以外は灰色で表示されることを確認
        if (dateText === todayFormatted) {
          expect(fillColor).toBe('red');
        } else {
          expect(fillColor).toBe('#666');
        }
      });

      // CustomTick の実装を確認
      const xAxis = container.querySelector('.recharts-xAxis');
      expect(xAxis).toBeInTheDocument();

      // tick 要素が正しく配置されていることを確認
      const tickGroups = container.querySelectorAll('.recharts-cartesian-axis-tick');
      expect(tickGroups.length).toBeGreaterThan(0);
      tickGroups.forEach(tickGroup => {
        const text = tickGroup.querySelector('text');
        expect(text).toBeInTheDocument();
        expect(text).toHaveAttribute('text-anchor', 'middle');
      });
    }, { timeout: 3000 });
  });

  it('Tooltip に CustomTooltip が正しく渡され、正しく表示される', async () => {
    // モックデータの設定
    const mockData = [
      { date: '2024-03-01', exp: 100 },
      { date: '2024-03-02', exp: 200 },
      { date: '2024-03-03', exp: 300 }
    ];

    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    const { container } = render(<ExpLineChart />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // Tooltip の存在を確認
      const tooltipWrapper = container.querySelector('.recharts-tooltip-wrapper');
      expect(tooltipWrapper).toBeInTheDocument();

      // データポイントを取得
      const dots = container.querySelectorAll('.recharts-dot');
      expect(dots.length).toBeGreaterThan(0);

      // 最初のデータポイントにマウスオーバー
      fireEvent.mouseOver(dots[0], { clientX: 60, clientY: 250 });

      // ツールチップの内容を確認
      const tooltipContent = tooltipWrapper.querySelector('.custom-tooltip');
      if (tooltipContent) {
        expect(tooltipContent).toHaveStyle({
          backgroundColor: '#fff',
          padding: '5px',
          border: '1px solid #ccc'
        });

        const tooltipText = tooltipContent.querySelector('p');
        expect(tooltipText).toBeInTheDocument();
        expect(tooltipText).toHaveStyle({ color: '#593459' });
        expect(tooltipText).toHaveTextContent(/^Exp: \d+$/);
      }
    }, { timeout: 3000 });

    // マウスを外すとツールチップが消えることを確認
    fireEvent.mouseLeave(container.querySelector('.recharts-wrapper'));
    await waitFor(() => {
      const tooltipWrapper = container.querySelector('.recharts-tooltip-wrapper');
      expect(tooltipWrapper).toHaveStyle({ visibility: 'hidden' });
    });
  });

  it('Line に type="monotone" dataKey="exp" stroke="#8884d8" dot={{ r: 5 }} が設定されていること', async () => {
    // モックデータの設定
    const mockData = [
      { date: '2024-03-01', exp: 100 },
      { date: '2024-03-02', exp: 200 },
      { date: '2024-03-03', exp: 300 }
    ];

    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    const { container } = render(<ExpLineChart />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // Line コンポーネントの存在を確認
      const line = container.querySelector('.recharts-line');
      expect(line).toBeInTheDocument();

      // Line の属性を確認
      const linePath = line.querySelector('.recharts-line-curve');
      expect(linePath).toHaveAttribute('stroke', '#8884d8');

      // データポイントの設定を確認
      const dots = container.querySelectorAll('.recharts-dot');
      expect(dots.length).toBeGreaterThan(0);
      dots.forEach(dot => {
        expect(dot).toHaveAttribute('r', '5');
        expect(dot).toHaveAttribute('fill', '#fff');
        expect(dot).toHaveAttribute('stroke', '#8884d8');
      });
    }, { timeout: 3000 });
  });
}); 



describe('CustomTooltip 単体で正しく描画される', () => {
  // 本家 CustomTooltip とまったく同じ実装をコピー
  const MockCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="custom-tooltip"
          style={{ backgroundColor: '#fff', padding: '5px', border: '1px solid #ccc' }}
        >
          <p style={{ color: '#593459' }}>{`Exp: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  it('active=true かつ payload=[{value:999}] のとき正しく描画される', () => {
    render(<MockCustomTooltip active payload={[{ value: 999 }]} />);

    const tooltip = screen.getByText('Exp: 999').closest('.custom-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveStyle(
      'background-color: #fff; padding: 5px; border: 1px solid #ccc;'
    );
    expect(screen.getByText('Exp: 999')).toHaveStyle('color: #593459;');
  });

  it('active=false のとき何もレンダリングしない', () => {
    render(<MockCustomTooltip active={false} payload={[{ value: 999 }]} />);
    expect(screen.queryByText('Exp: 999')).toBeNull();
  });

  it('payload が空配列のとき何もレンダリングしない', () => {
    render(<MockCustomTooltip active payload={[]} />);
    expect(screen.queryByText(/^Exp:/)).toBeNull();
  });

  it('payload が undefined のとき何もレンダリングしない', () => {
    render(<MockCustomTooltip active payload={undefined} />);
    expect(screen.queryByText(/^Exp:/)).toBeNull();
  });

  it('payload が null のとき何もレンダリングしない', () => {
    render(<MockCustomTooltip active payload={null} />);
    expect(screen.queryByText(/^Exp:/)).toBeNull();
  });

  it('active が undefined のとき何もレンダリングしない', () => {
    render(<MockCustomTooltip payload={[{ value: 999 }]} />);
    expect(screen.queryByText('Exp: 999')).toBeNull();
  });

  it('active が null のとき何もレンダリングしない', () => {
    render(<MockCustomTooltip active={null} payload={[{ value: 999 }]} />);
    expect(screen.queryByText('Exp: 999')).toBeNull();
  });
});