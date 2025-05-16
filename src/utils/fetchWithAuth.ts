//import { getAccessToken } from  './getIdToken';

//export async function fetchWithAuth(path: string, options: RequestInit = {}) {
//  const base = process.env.NEXT_PUBLIC_RAILS_API_URL!.replace(/\/$/, '');
//  const url  = `${base}/${path.replace(/^\//, '')}`;

//  const cfg: RequestInit = {
//    credentials: 'include',
//    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
//    ...options,
//  };

//  const token = await getAccessToken();
//  if (token) (cfg.headers as Record<string,string>).Authorization = `Bearer ${token}`;

//  return fetch(url, cfg);
//}


import { getIdToken } from './getIdToken';

export async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_RAILS_API_URL?.replace(/\/$/, '');
  const url  = `${base}/${path.replace(/^\//, '')}`;

  const token = await getIdToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    // IDトークンを Authorization ヘッダにセット
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config: RequestInit = {
    credentials: 'include',
    ...options,
    headers,
  };

  return fetch(url, config);
}
