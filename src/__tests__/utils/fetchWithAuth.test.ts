import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { getIdToken } from '../../utils/getIdToken';

jest.mock('../../utils/getIdToken');

describe('fetchWithAuth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('URL construction', () => {
    it('末尾にスラッシュがあるベースURLを正しく処理できること', async () => {
      process.env.NEXT_PUBLIC_RAILS_API_URL = 'https://api.example.com/';
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      await fetchWithAuth('users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      );
    });

    it('末尾にスラッシュがないベースURLを正しく処理できること', async () => {
      process.env.NEXT_PUBLIC_RAILS_API_URL = 'https://api.example.com';
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      await fetchWithAuth('users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      );
    });

    it('先頭にスラッシュがあるパスを正しく処理できること', async () => {
      process.env.NEXT_PUBLIC_RAILS_API_URL = 'https://api.example.com';
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      await fetchWithAuth('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      );
    });

    it('先頭にスラッシュがないパスを正しく処理できること', async () => {
      process.env.NEXT_PUBLIC_RAILS_API_URL = 'https://api.example.com';
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      await fetchWithAuth('users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.any(Object)
      );
    });
  });

  describe('Authorization header', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_RAILS_API_URL = 'https://api.example.com';
      const mockFetch = jest.fn();
      global.fetch = mockFetch;
    });

    it('getIdTokenがトークンを返す場合、Authorizationヘッダーを含めること', async () => {
      const mockToken = 'test-token-123';
      (getIdToken as jest.Mock).mockResolvedValue(mockToken);

      await fetchWithAuth('users');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });

    it('getIdTokenがnullを返す場合、Authorizationヘッダーを含めないこと', async () => {
      (getIdToken as jest.Mock).mockResolvedValue(null);

      await fetchWithAuth('users');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });

    it('getIdTokenがundefinedを返す場合、Authorizationヘッダーを含めないこと', async () => {
      (getIdToken as jest.Mock).mockResolvedValue(undefined);

      await fetchWithAuth('users');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });

    it('Content-Type: application/json が常に含まれること', async () => {
      await fetchWithAuth('users');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('options.headers で追加ヘッダーを渡した場合、それがマージされること', async () => {
      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        'Accept': 'application/json'
      };

      await fetchWithAuth('users', { headers: customHeaders });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value',
            'Accept': 'application/json'
          })
        })
      );
    });
  });

  describe('fetch options', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_RAILS_API_URL = 'https://api.example.com';
      const mockFetch = jest.fn();
      global.fetch = mockFetch;
    });

    it('credentials: include が常に設定されていること', async () => {
      await fetchWithAuth('users');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          credentials: 'include'
        })
      );
    });

    it('method が正しく反映されること', async () => {
      await fetchWithAuth('users', { method: 'POST' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include'
        })
      );
    });

    it('body が正しく反映されること', async () => {
      const body = { name: 'test' };
      await fetchWithAuth('users', { 
        method: 'POST',
        body: JSON.stringify(body)
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
          credentials: 'include'
        })
      );
    });

    it('複数のオプションが正しく反映されること', async () => {
      const options = {
        method: 'PUT',
        body: JSON.stringify({ name: 'test' }),
        cache: 'no-cache' as const,
        mode: 'cors' as const
      };

      await fetchWithAuth('users', options);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          ...options,
          credentials: 'include'
        })
      );
    });

    it('options で渡したプロパティが credentials を上書きできること', async () => {
      await fetchWithAuth('users', { credentials: 'omit' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          credentials: 'omit'
        })
      );
    });
  });

  describe('return value', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_RAILS_API_URL = 'https://api.example.com';
    });

    it('fetch の戻り値がそのまま返されること', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'test' })
      };
      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      global.fetch = mockFetch;

      const response = await fetchWithAuth('users');

      expect(response).toBe(mockResponse);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toEqual({ data: 'test' });
    });

    it('fetch がエラーを投げた場合、そのエラーがそのまま投げられること', async () => {
      const mockError = new Error('Network error');
      const mockFetch = jest.fn().mockRejectedValue(mockError);
      global.fetch = mockFetch;

      await expect(fetchWithAuth('users')).rejects.toThrow('Network error');
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_RAILS_API_URL = 'https://api.example.com';
      (getIdToken as jest.Mock).mockReset();
    });

    it('getIdToken が例外を投げた場合、その例外がそのまま投げられること', async () => {
      const mockError = new Error('Auth error');
      (getIdToken as jest.Mock).mockRejectedValue(mockError);

      await expect(fetchWithAuth('users')).rejects.toThrow('Auth error');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('fetch が例外を投げた場合、その例外がそのまま投げられること', async () => {
      (getIdToken as jest.Mock).mockResolvedValue(null);
      const mockError = new Error('Network error');
      const mockFetch = jest.fn().mockRejectedValue(mockError);
      global.fetch = mockFetch;

      await expect(fetchWithAuth('users')).rejects.toThrow('Network error');
    });

    it('getIdToken が例外を投げた場合、fetch は呼ばれないこと', async () => {
      const mockError = new Error('Auth error');
      (getIdToken as jest.Mock).mockRejectedValue(mockError);
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      await expect(fetchWithAuth('users')).rejects.toThrow('Auth error');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
