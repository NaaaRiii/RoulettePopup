import { fetchAuthSession } from 'aws-amplify/auth';

export async function getAccessToken(): Promise<string | null> {
  try {
    const { tokens } = await fetchAuthSession();
    return tokens?.accessToken?.toString() ?? null;
  } catch (error) {
    console.error('[getAccessToken] 取得エラー:', error);
    return null;
  }
}
