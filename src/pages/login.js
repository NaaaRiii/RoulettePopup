import React from 'react';
//import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/router';
//import outputs from '../../amplify_outputs.json';

//Amplify.configure(outputs);

export default function LoginPage() {
  const router = useRouter();

  const handleAuthStateChange = async (authState) => {
    if (authState === 'signedin') {
      // ログイン成功時
      router.push('/dashboard');
    }
  };

  return (
    <Authenticator
      // ユーザーがログイン状態になったら呼ばれるコールバック
      onStateChange={(authState) => handleAuthStateChange(authState)}
    >
      {/* ログインフォームは Authenticator が自動的に生成 */}
    </Authenticator>
  );
}
