import { Auth } from 'aws-amplify';

export async function fetchWithAuth(path, options = {}) {
  const base = process.env.NEXT_PUBLIC_RAILS_API_URL;
  const url  = `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

  // 基本設定：Cookie送信も併用する場合は credentials: 'include'
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };

  // SSR 環境や Auth が未初期化時はそのままフェッチ
  if (typeof window === 'undefined' || !Auth?.currentSession) {
    return fetch(url, config);
  }

  try {
    // Cognito から現在のセッションを取得 → JWT を取り出す
    const session = await Auth.currentSession();
    const token   = session.getIdToken().getJwtToken();

    // Authorization ヘッダに Bearer トークンを追加
    config.headers.Authorization = `Bearer ${token}`;
    console.debug('[fetchWithAuth] attaching JWT →', url);

    return fetch(url, config);
  } catch (err) {
    // セッションがない／期限切れの場合は匿名フェッチ
    console.warn('[fetchWithAuth] no valid session, anonymous request', err);
    return fetch(url, config);
  }
}
