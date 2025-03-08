import { Amplify, Auth } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);

export const fetchWithAuth = async (url, options = {}) => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    const token = user.signInUserSession.idToken.jwtToken;

    // CognitoのIDトークンをAuthorizationヘッダーに付与
    const defaultHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    return await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    console.error('Error in fetchWithAuth:', error);
    throw error;
  }
};
