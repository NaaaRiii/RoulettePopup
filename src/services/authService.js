//const login = async (email, password) => {
//  try {
//    const response = await fetch('http://localhost:3000/login', {
//      method: 'POST',
//      headers: {
//        'Content-Type': 'application/json',
//      },
//      body: JSON.stringify({
//        session: {
//          email: email,
//          password: password,
//        },
//      }),
//    });
//    const data = await response.json();
//    if (!response.ok) {
//      throw new Error(data.error || 'Login failed');
//    }
//    // ログイン成功時にトークンをlocalStorageに保存
//    localStorage.setItem('token', data.token);
//    // 必要に応じてユーザー情報も保存
//    return data;
//  } catch (error) {
//    console.error('Login failed:', error);
//    throw error;
//  }
//};

//export { login };
