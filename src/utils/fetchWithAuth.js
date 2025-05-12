import '../lib/amplifyClient';
import { fetchAuthSession } from 'aws-amplify/auth';

export async function fetchWithAuth(path, options = {}) {
  const base = process.env.NEXT_PUBLIC_RAILS_API_URL;
  const url  = `${base}${path.startsWith('/') ? '' : '/'}${path}`;

  // SSR ではトークンを付けずにそのまま
  if (typeof window === 'undefined') {
    return fetch(url, { credentials: 'include', ...options });
  }

  try {
    const { tokens } = await fetchAuthSession();   // ★ v6 の取得API
    const token = tokens?.idToken?.toString();

    console.debug('[fetchWithAuth] token‑present?', !!token);

    return fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });
  } catch (err) {
    console.warn('[fetchWithAuth] no session', err);
    return fetch(url, { credentials: 'include', ...options });
  }
}
