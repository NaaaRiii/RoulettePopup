import '../lib/amplifyClient';
import { Auth } from 'aws-amplify';

//export async function fetchWithAuth(path, options = {}) {
//  console.debug('[fetchWithAuth] start', path, options); 
//  const session = await Auth.currentSession();
//  const token   = session.getIdToken().getJwtToken();

//  console.debug('[fetchWithAuth] got token?', !!token);

//  // SSR／Node.js 環境かどうかをまず判定
//  if (typeof window === 'undefined' || typeof Auth?.currentSession !== 'function') {
//    console.debug('[fetchWithAuth] SSR fallback → anonymous fetch', url);
//    return fetch(url, { credentials: 'include', ...options });
//  }

//  try {
//    console.debug('[fetchWithAuth] Attempting Auth.currentSession()');
//    const session = await Auth.currentSession();
//    console.debug('[fetchWithAuth] session obtained:', session);
//    const token   = session.getIdToken().getJwtToken();
//    console.debug('[fetchWithAuth] JWT token:', token.slice(0,10) + '…');

//    console.debug('[fetchWithAuth] Performing fetch with Authorization header');
//    return fetch(url, {
//      credentials: 'include',
//      headers: {
//        'Content-Type': 'application/json',
//        Authorization: `Bearer ${token}`,
//        ...options.headers,
//      },
//      ...options,
//    });
//  } catch (err) {
//    console.warn('[fetchWithAuth] no valid session, falling back to anonymous fetch', err);
//    return fetch(url, { credentials: 'include', ...options });
//  }
//}


export async function fetchWithAuth(path, options = {}) {
  const base = process.env.NEXT_PUBLIC_RAILS_API_URL;
  const url  = `${base}${path.startsWith('/') ? '' : '/'}${path}`;

  // SSR or Auth モジュール未登録時はヘッダー抜きフェッチ
  if (
    typeof window === 'undefined' ||
    !Auth ||
    typeof Auth.currentSession !== 'function'
  ) {
    console.debug('[fetchWithAuth] SSR or no Auth → anonymous:', url);
    return fetch(url, { credentials: 'include', ...options });
  }

  try {
    const session = await Auth.currentSession();
    const token   = session.getIdToken().getJwtToken();
    console.debug('[fetchWithAuth] token present →', url);

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
    console.warn('[fetchWithAuth] no session → anonymous:', err);
    return fetch(url, { credentials: 'include', ...options });
  }
}
