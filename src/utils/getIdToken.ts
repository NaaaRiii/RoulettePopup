import { fetchAuthSession } from '@aws-amplify/auth';

export async function getIdToken(): Promise<string | null> {
  try {
    const { tokens } = await fetchAuthSession();
    // ここを accessToken ではなく idToken に変更
    return tokens?.idToken?.toString() ?? null;
  } catch (error) {
    console.error('[getIdToken] 取得エラー:', error);
    return null;
  }
}