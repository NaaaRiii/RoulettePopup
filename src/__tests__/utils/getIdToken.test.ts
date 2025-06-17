import { fetchAuthSession } from '@aws-amplify/auth';
import { getIdToken } from '../../utils/getIdToken';

// AWS Amplify のモック
jest.mock('@aws-amplify/auth', () => ({
  fetchAuthSession: jest.fn(),
}));

describe('getIdToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // console.error のモックを設定
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // モックを元に戻す
    jest.restoreAllMocks();
  });

  it('認証セッションから idToken を取得できる場合、そのトークンを返す', async () => {
    const mockToken = 'mock.id.token';
    (fetchAuthSession as jest.Mock).mockResolvedValueOnce({
      tokens: {
        idToken: {
          toString: () => mockToken,
        },
      },
    });

    const result = await getIdToken();
    expect(result).toBe(mockToken);
    expect(fetchAuthSession).toHaveBeenCalledTimes(1);
  });

  it('tokens が undefined の場合、null を返す', async () => {
    (fetchAuthSession as jest.Mock).mockResolvedValueOnce({
      tokens: undefined,
    });

    const result = await getIdToken();
    expect(result).toBeNull();
    expect(fetchAuthSession).toHaveBeenCalledTimes(1);
  });

  it('idToken が undefined の場合、null を返す', async () => {
    (fetchAuthSession as jest.Mock).mockResolvedValueOnce({
      tokens: {
        idToken: undefined,
      },
    });

    const result = await getIdToken();
    expect(result).toBeNull();
    expect(fetchAuthSession).toHaveBeenCalledTimes(1);
  });

  it('fetchAuthSession がエラーをスローした場合、null を返す', async () => {
    const mockError = new Error('Auth error');
    (fetchAuthSession as jest.Mock).mockRejectedValueOnce(mockError);

    const result = await getIdToken();
    expect(result).toBeNull();
    expect(fetchAuthSession).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith('[getIdToken] 取得エラー:', mockError);
  });
});