import { Amplify } from 'aws-amplify';
import awsExports from '../amplify_outputs.json';

Amplify.configure({
  ...awsExports,
});