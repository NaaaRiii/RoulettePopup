import { Auth } from 'aws-amplify';
import { getAccessToken } from './getAccessToken';

export async function fetchWithAuth(path, options = {}) {
  const base = process.env.NEXT_PUBLIC_RAILS_API_URL.replace(/\/$/, '');
  const url  = `${base}/${path.replace(/^\//, '')}`;

  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  console.debug('[fetchWithAuth] →', url, options, 'headers:', config.headers);

  try {
    const token = await getAccessToken();            // ← ここだけ変更
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('[fetchWithAuth] token なし(anonymous request)');
    }
  } catch (e) {
    console.error('[fetchWithAuth] token 取得失敗', e);
  }

  console.debug('[fetchWithAuth]', url, config.headers); // デバッグ用
  return fetch(url, config);
}
