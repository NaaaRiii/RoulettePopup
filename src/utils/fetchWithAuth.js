import '../lib/amplifyClient';   // Amplify.configure を一度だけ実行
import { Auth } from 'aws-amplify';

export async function fetchWithAuth(path, options = {}) {
  const base = process.env.NEXT_PUBLIC_RAILS_API_URL;
  const url  = `${base}${path.startsWith('/') ? '' : '/'}${path}`;

  /* ❶ サーバーサイド（SSR/SSG）では JWT を取れないのでそのまま fetch */
  if (typeof window === 'undefined' || typeof Auth?.currentSession !== 'function') {
    return fetch(url, { credentials: 'include', ...options });
  }

  /* ❷ クライアント側：JWT を付けてリクエスト */
  try {
    const session = await Auth.currentSession();              // 認証済みなら取得
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
    // 未ログイン時は Authorization を付けずに投げる
    return fetch(url, { credentials: 'include', ...options });
  }
}
