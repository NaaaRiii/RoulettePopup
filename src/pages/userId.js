export async function getServerSideProps(context) {
  const userId = await fetchUserData(context.req);
  console.log('Server-side UserId:', userId);
  return { props: { userId } };
}

export default function UserId({ userId }) {
  return <UserProfile userId={userId} />;
}

//export async function getServerSideProps(context) {
//  // クッキーを取得
//  const cookies = context.req.headers.cookie;

//  // サーバーサイドからユーザーデータを取得するためのAPIリクエスト
//  const res = await fetch(`http://localhost:3000/api/v1/users/${userId}`, {
//    headers: {
//      Cookie: cookies
//    }
//  });
//  const data = await res.json();

//  return {
//    props: {
//      userId: data.user_id  // APIレスポンスからユーザーIDを取得
//    }
//  };
//}