import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExpLineChart from '../components/ExpLineChart';
import { fetchWithAuth } from '../utils/fetchWithAuth';

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
});beforeAll(() => {
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
}); 