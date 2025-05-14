import { fetchAuthSession } from 'aws-amplify/auth';

//export const callAPIWithAuth = async (
//  input: RequestInfo,
//  init: RequestInit = {},
//): Promise<Response> => {
//  //const session = await Auth.currentSession()
//	const session = await fetchAuthSession();
//  //const token = session.getAccessToken().getJwtToken()
//	const accessToken = session.tokens?.accessToken?.toString();
//  if (!init.headers) init.headers = {}
//  const result = await fetch(input, {
//    ...init,
//    headers: {
//      ...init.headers,
//      Authorization: accessToken,
//    },
//  })
//  return result
//}

export async function getAccessToken(): Promise<string | null> {
  try {
    const { tokens } = await fetchAuthSession();
    return tokens?.accessToken?.toString() ?? null;
  } catch (error) {
    console.error('[getAccessToken] 取得エラー:', error);
    return null;
  }
}