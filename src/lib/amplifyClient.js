import { Amplify } from 'aws-amplify';
import awsconfig from '../aws-exports';   
import { Auth } from '@aws-amplify/auth';
import { API } from '@aws-amplify/api-rest';

Amplify.configure({
  ...awsconfig,
  API: {
    endpoints: [
      {
        name: 'plusOneApi',
        endpoint: process.env.NEXT_PUBLIC_RAILS_API_URL,
        region: awsconfig.aws_project_region,
        custom_header: async () => {
          const session = await Auth.currentSession();
          return { Authorization: `Bearer ${session.getIdToken().getJwtToken()}` };
        }
      }
    ]
  }
});