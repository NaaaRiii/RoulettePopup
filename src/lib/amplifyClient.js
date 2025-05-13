//import { Amplify, Auth } from 'aws-amplify';
//import awsExports from '../amplify_outputs.json';

//Amplify.configure({
//  ...awsExports,
//  API: {
//    endpoints: [
//      {
//        name: 'plusOneApi',
//        endpoint: process.env.NEXT_PUBLIC_RAILS_API_URL,
//        region: awsExports.aws_cognito_region,
//        custom_header: async () => ({
//          Authorization: (await Auth.currentSession())
//            .getIdToken()
//            .getJwtToken()
//        })
//      }
//    ]
//  }
//});


import { Amplify } from 'aws-amplify';
import awsExports from '../amplify_outputs.json';

Amplify.configure({
  ...awsExports,
});