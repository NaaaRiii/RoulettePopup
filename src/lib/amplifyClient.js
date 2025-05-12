import { Amplify } from 'aws-amplify';
import awsExports from '../amplify_outputs.json';

Amplify.configure({
  ...awsExports,
  API: {
    endpoints: [
      {
        name: 'plusOneApi',
        endpoint: process.env.NEXT_PUBLIC_RAILS_API_URL,
        region: awsExports.aws_cognito_region,              // 例: 'ap-northeast-1'
        custom_header: async () => {
          // もし API 認証を UserPool でやるなら、ヘッダーに Authorization を付与
          const session = await Amplify.Auth.currentSession();
          return { Authorization: session.getIdToken().getJwtToken() };
        }
      }
    ]
  }
});