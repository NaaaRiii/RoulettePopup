//import React from 'react';
//import { useEffect, useState } from 'react';
//import { useRouter } from 'next/router';

//const withAuth = (WrappedComponent) => {
//  const ComponentWithAuth = (props) => {
//    const [loading, setLoading] = useState(true);
//    const router = useRouter();

//    useEffect(() => {
//      const checkLoginStatus = async () => {
//        try {
//          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/check_login`, {
//            method: 'GET',
//            credentials: 'include'
//          });
//          const data = await response.json();

//          if (!data.logged_in) {
//            router.push({
//              pathname: '/login',
//              query: { message: 'ログインをしてください' }
//            });
//          } else {
//            setLoading(false);
//          }
//        } catch (error) {
//          console.error('Error checking login status:', error);
//          router.push('/');
//        }
//      };

//      checkLoginStatus();
//    }, [router]);

//    if (loading) {
//      return <p>Loading...</p>; // ローディング中のUIを表示
//    }

//    return <WrappedComponent {...props} />;
//  };

//  ComponentWithAuth.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

//  return ComponentWithAuth;
//};

//export default withAuth;
