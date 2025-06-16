import { renderHook, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useFetchRouletteTexts } from '../../hooks/useFetchRouletteTexts';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

// fetchWithAuth をモック
jest.mock('../../utils/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
}));

describe('useFetchRouletteTexts', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('フック初期化時に fetchWithAuth("/api/roulette_texts") が 1 回だけ呼ばれる', () => {
    // 成功レスポンスをモック
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    // フックをレンダリング
    renderHook(() => useFetchRouletteTexts());

    // fetchWithAuth が1回だけ呼ばれたことを確認
    expect(fetchWithAuth).toHaveBeenCalledTimes(1);
    // 正しいエンドポイントで呼ばれたことを確認
    expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts');
  });

  it('マウント直後（非同期完了前）は rouletteTexts が空配列である', () => {
    // 成功レスポンスをモック（非同期処理を遅延させる）
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return ['text1', 'text2'];
      },
    });

    // フックをレンダリング
    const { result } = renderHook(() => useFetchRouletteTexts());

    // マウント直後の状態を確認
    expect(result.current.rouletteTexts).toEqual([]);
  });

  it('API取得後に rouletteTexts が更新され、その後 setRouletteTexts で手動更新も可能', async () => {
    // 初期のAPIレスポンス
    const initialTexts = ['text1', 'text2', 'text3'];
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => initialTexts,
    });

    // フックをレンダリング
    const { result } = renderHook(() => useFetchRouletteTexts());

    // API取得後の状態を確認
    await waitFor(() => {
      expect(result.current.rouletteTexts).toEqual(initialTexts);
    });

    // setRouletteTexts で手動更新
    const updatedTexts = ['new1', 'new2', 'new3'];
    result.current.setRouletteTexts(updatedTexts);

    // 手動更新後の状態を確認
    await waitFor(() => {
      expect(result.current.rouletteTexts).toEqual(updatedTexts);
    });
  });

  it('fetchWithAuth が例外を投げた場合 console.error が 1 回呼ばれ、state は空配列のまま', async () => {
    // エラーをモック
    const error = new Error('network error');
    fetchWithAuth.mockRejectedValueOnce(error);

    // フックをレンダリング
    const { result } = renderHook(() => useFetchRouletteTexts());

    // エラーハンドリングと状態を確認
    await waitFor(() => {
      // console.error が1回だけ呼ばれたことを確認
      expect(console.error).toHaveBeenCalledTimes(1);
      // 正しいエラーメッセージで呼ばれたことを確認
      expect(console.error).toHaveBeenCalledWith('Error fetching roulette texts:', error);
      // 状態が空配列のままであることを確認
      expect(result.current.rouletteTexts).toEqual([]);
    });
  });

  it('response.ok=false の場合 console.error が呼ばれ、state は空配列のまま', async () => {
    // エラーレスポンスをモック
    fetchWithAuth.mockRejectedValueOnce(new Error('network'));

    // フックをレンダリング
    const { result } = renderHook(() => useFetchRouletteTexts());

    // エラーハンドリングと状態を確認
    await waitFor(() => {
      // console.error が呼ばれたことを確認
      expect(console.error).toHaveBeenCalled();
      // 状態が空配列のままであることを確認
      expect(result.current.rouletteTexts).toEqual([]);
    });
  });

  it('JSON 解析エラーの場合 console.error が呼ばれ、state は空配列のまま', async () => {
    // JSON 解析エラーをモック
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new SyntaxError('Invalid JSON');
      },
    });

    // フックをレンダリング
    const { result } = renderHook(() => useFetchRouletteTexts());

    // エラーハンドリングと状態を確認
    await waitFor(() => {
      // console.error が呼ばれたことを確認
      expect(console.error).toHaveBeenCalled();
      // 状態が空配列のままであることを確認
      expect(result.current.rouletteTexts).toEqual([]);
    });
  });

  it('アンマウント後に非同期解決しても setState されない', async () => {
    // 遅延付きの成功レスポンスをモック
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return ['text1', 'text2'];
      },
    });

    // フックをレンダリング
    const { result, unmount } = renderHook(() => useFetchRouletteTexts());

    // アンマウント
    act(() => {
      unmount();
    });

    // 非同期処理の完了を待つ
    await new Promise(resolve => setTimeout(resolve, 200));

    // 状態が更新されていないことを確認
    expect(result.current.rouletteTexts).toEqual([]);
    // エラーが出力されていないことを確認
    expect(console.error).not.toHaveBeenCalled();
  });

  it('複数のフックインスタンスは独立して動作し、fetch は重複しない', async () => {
    // 各インスタンス用の異なるレスポンスをモック
    const responses = [
      ['text1', 'text2'],
      ['text3', 'text4'],
      ['text5', 'text6'],
    ];

    responses.forEach((texts, index) => {
      fetchWithAuth.mockResolvedValueOnce({
        ok: true,
        json: async () => texts,
      });
    });

    // 3つのフックインスタンスをレンダリング
    const { result: result1, unmount: unmount1 } = renderHook(() => useFetchRouletteTexts());
    const { result: result2, unmount: unmount2 } = renderHook(() => useFetchRouletteTexts());
    const { result: result3, unmount: unmount3 } = renderHook(() => useFetchRouletteTexts());

    // 各インスタンスの状態が独立して更新されることを確認
    await waitFor(() => {
      expect(result1.current.rouletteTexts).toEqual(responses[0]);
      expect(result2.current.rouletteTexts).toEqual(responses[1]);
      expect(result3.current.rouletteTexts).toEqual(responses[2]);
    });

    // fetchWithAuth が3回だけ呼ばれたことを確認
    expect(fetchWithAuth).toHaveBeenCalledTimes(3);

    // 1つ目のインスタンスをアンマウント
    act(() => {
      unmount1();
    });

    // 2つ目のインスタンスの状態を手動更新
    const updatedTexts = ['new1', 'new2'];
    act(() => {
      result2.current.setRouletteTexts(updatedTexts);
    });

    // 3つ目のインスタンスの状態を手動更新
    const updatedTexts3 = ['new3', 'new4'];
    act(() => {
      result3.current.setRouletteTexts(updatedTexts3);
    });

    // 各インスタンスの状態が独立して更新されていることを確認
    await waitFor(() => {
      expect(result1.current.rouletteTexts).toEqual(responses[0]); // アンマウント済み
      expect(result2.current.rouletteTexts).toEqual(updatedTexts);
      expect(result3.current.rouletteTexts).toEqual(updatedTexts3);
    });

    // 残りのインスタンスをアンマウント
    act(() => {
      unmount2();
      unmount3();
    });
  });
}); 