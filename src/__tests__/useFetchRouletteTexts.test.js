import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useFetchRouletteTexts } from '../hooks/useFetchRouletteTexts';
import { fetchWithAuth } from '../utils/fetchWithAuth';

// fetchWithAuth をモック
jest.mock('../utils/fetchWithAuth', () => ({
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

  it('マウント時に fetchWithAuth("/api/roulette_texts") が呼ばれ、取得データが state に入る', async () => {
    const mockTexts = ['hello', 'world'];

    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTexts,
    });

    const { result } = renderHook(() => useFetchRouletteTexts());

    await waitFor(() => {
      expect(result.current.rouletteTexts).toEqual(mockTexts);
    });

    expect(fetchWithAuth).toHaveBeenCalledTimes(1);
    expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts');
  });

  it('fetchWithAuth が例外を投げた場合 console.error が呼ばれ、state は空配列のまま', async () => {
    const error = new Error('network error');
    fetchWithAuth.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useFetchRouletteTexts());

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Error fetching roulette texts:', error);
      expect(result.current.rouletteTexts).toEqual([]);
    });
  });
}); 