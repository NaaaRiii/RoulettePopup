import { Amplify } from 'aws-amplify';
import outputs from '/amplify_outputs.json';

// 一度だけ、モジュールロード時に初期化
Amplify.configure(outputs);