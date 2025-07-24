import { Amplify } from 'aws-amplify';

// Build Amplify configuration from environment variables so that we no longer
// need a local JSON file (amplify_outputs.json).  Make sure the corresponding
// NEXT_PUBLIC_*** variables are defined in both local and hosting
// environments.

const awsConfig = {
  Auth: {
    region: process.env.NEXT_PUBLIC_COGNITO_REGION,
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    // In v6 the field name changed from userPoolWebClientId → userPoolClientId.
    // Use whichever is available.
    userPoolClientId:
      process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID || process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID,
    mandatorySignIn: true,
    oauth: {
      domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
      scope: ['email', 'profile', 'openid'],
      redirectSignIn:
        process.env.NEXT_PUBLIC_REDIRECT_SIGNIN || (typeof window !== 'undefined' ? `${window.location.origin}/` : '/'),
      redirectSignOut:
        process.env.NEXT_PUBLIC_REDIRECT_SIGNOUT || (typeof window !== 'undefined' ? `${window.location.origin}/` : '/'),
      responseType: 'code',
    },
  },
};

// Only configure Amplify once (SSR safety)
if (!Amplify._isConfigured) {
  Amplify.configure(awsConfig);
  Amplify._isConfigured = true;
}