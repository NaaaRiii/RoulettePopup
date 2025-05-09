import '../lib/amplifyClient';
import { Auth } from 'aws-amplify';

export async function fetchWithAuth(path, options = {}) {
  console.debug('[fetchWithAuth] →', path, options.headers);
  const base = process.env.NEXT_PUBLIC_RAILS_API_URL;
  const url  = `${base}${path.startsWith('/') ? '' : '/'}${path}`;

  if (typeof window === 'undefined' || typeof Auth?.currentSession !== 'function') {
    return fetch(url, { credentials: 'include', ...options });
  }

  try {
    const session = await Auth.currentSession();
    const token   = session.getIdToken().getJwtToken();

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
    return fetch(url, { credentials: 'include', ...options });
  }
}
