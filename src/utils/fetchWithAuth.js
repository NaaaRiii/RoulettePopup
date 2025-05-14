import { Auth } from 'aws-amplify';

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
    if (typeof window !== 'undefined' && Auth?.currentSession) {
      const session = await Auth.currentSession();
      // ※ Rails 側で aud 検証をしているなら ACCESS トークン
      const token   = session.getAccessToken().getJwtToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('[fetchWithAuth] no session', e);
  }

  console.debug('[fetchWithAuth]', url, config.headers);
  return fetch(url, config);
}
