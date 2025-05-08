import '../lib/amplifyClient.js'; 
import { Auth } from 'aws-amplify';


export async function fetchWithAuth(path, options = {}) {
  const session = await Auth.currentSession();
  const token = session.getIdToken().getJwtToken();

  return fetch(
    `${process.env.NEXT_PUBLIC_RAILS_API_URL}${path}`,
    {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    }
  );
}