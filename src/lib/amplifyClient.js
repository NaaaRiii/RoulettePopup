import { Amplify } from 'aws-amplify';

// Build Amplify configuration from environment variables so that we no longer
// need a local JSON file (amplify_outputs.json).  Make sure the corresponding
// NEXT_PUBLIC_*** variables are defined in both local and hosting
// environments.

const awsConfig = {
  Auth: {
    Cognito: {
      region: process.env.NEXT_PUBLIC_COGNITO_REGION,
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID,
    },
  },
};

// Only configure Amplify once (SSR safety)
if (!Amplify._isConfigured) {
  Amplify.configure(awsConfig);
  Amplify._isConfigured = true;
}