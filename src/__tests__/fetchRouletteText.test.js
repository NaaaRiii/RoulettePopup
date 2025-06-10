import { fetchRouletteText } from '../components/utils';
import { fetchWithAuth } from '../utils/fetchWithAuth';

jest.mock('../utils/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
}));

describe('fetchRouletteText', () => {
  afterEach(() => jest.clearAllMocks());

  it('成功時に API の json をそのまま返す', async () => {
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ text: 'Hello' }),
    });

    const result = await fetchRouletteText(5);

    expect(fetchWithAuth).toHaveBeenCalledWith('/api/roulette_texts/5');
    expect(result).toEqual({ text: 'Hello' });
  });

  it('失敗時に {text:"Error fetching text"} を返す', async () => {
    // 例1: ok=false
    fetchWithAuth.mockResolvedValueOnce({ ok: false, status: 500 });

    const res1 = await fetchRouletteText(7);
    expect(res1).toEqual({ text: 'Error fetching text' });

    // 例2: fetch が例外 throw
    fetchWithAuth.mockRejectedValueOnce(new Error('Network'));

    const res2 = await fetchRouletteText(9);
    expect(res2).toEqual({ text: 'Error fetching text' });
  });
});