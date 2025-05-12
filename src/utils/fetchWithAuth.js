import '../lib/amplifyClient';
import { Auth } from 'aws-amplify';

export async function fetchWithAuth(path, options = {}) {
  console.debug('[fetchWithAuth] start', path, options); 
  const session = await Auth.currentSession();
  const token   = session.getIdToken().getJwtToken();

  console.debug('[fetchWithAuth] got token?', !!token);

  // SSR／Node.js 環境かどうかをまず判定
  if (typeof window === 'undefined' || typeof Auth?.currentSession !== 'function') {
    console.debug('[fetchWithAuth] SSR fallback → anonymous fetch', url);
    return fetch(url, { credentials: 'include', ...options });
  }

  try {
    console.debug('[fetchWithAuth] Attempting Auth.currentSession()');
    const session = await Auth.currentSession();
    console.debug('[fetchWithAuth] session obtained:', session);
    const token   = session.getIdToken().getJwtToken();
    console.debug('[fetchWithAuth] JWT token:', token.slice(0,10) + '…');

    console.debug('[fetchWithAuth] Performing fetch with Authorization header');
    return fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });
  } catch (err) {
    console.warn('[fetchWithAuth] no valid session, falling back to anonymous fetch', err);
    return fetch(url, { credentials: 'include', ...options });
  }
}
