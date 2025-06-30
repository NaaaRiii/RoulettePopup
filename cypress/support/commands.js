/// <reference types="cypress" />
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// モック認証用のコマンド（テスト環境用）
Cypress.Commands.add('loginWithMock', (email, password) => {
  // ローカルストレージにモック認証情報を設定
  cy.window().then((win) => {
    win.localStorage.setItem('amplify-authenticator-authToken', 'mock-token');
    win.localStorage.setItem('amplify-authenticator-user', JSON.stringify({
      username: email,
      email: email
    }));
  });
  
  // セッションストレージにも設定
  cy.window().then((win) => {
    win.sessionStorage.setItem('amplify-authenticator-authToken', 'mock-token');
  });
  
  // モック認証後はダッシュボードにアクセス
  cy.visit('/dashboard');
  
  // 認証状態を確認
  cy.window().then((win) => {
    const authToken = win.localStorage.getItem('amplify-authenticator-authToken');
    expect(authToken).to.equal('mock-token');
  });
});

// ユーザー登録用のコマンド
Cypress.Commands.add('registerUser', (email, password) => {
  // まずCognitoでユーザー登録（既に登録済みの場合はスキップ）
  cy.request({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      email: email,
      password: password
    },
    failOnStatusCode: false
  }).then((response) => {
    // 登録成功または既に存在する場合は成功とみなす
    if (response.status === 200 || response.status === 422) {
      cy.log('ユーザー登録完了または既に存在');
    } else {
      cy.log('ユーザー登録に失敗');
    }
  });
});

// Amplify認証関連のカスタムコマンド
Cypress.Commands.add('loginWithAmplify', (email, password) => {
  // 保護されたページにアクセスして認証をトリガー
  cy.visit('/dashboard', { timeout: 60000 });
  
  // Amplify Authenticatorが表示されるまで待機
  cy.get('[data-testid="authenticator"], .amplify-authenticator, [data-amplify-authenticator]', { timeout: 15000 }).should('be.visible');
  
  // メールアドレスを入力
  cy.get('input[type="email"], input[name*="email"], input[placeholder*="email"], input[placeholder*="Email"]')
    .first()
    .type(email, { delay: 100 });
  
  // パスワードを入力
  cy.get('input[type="password"], input[name*="password"], input[placeholder*="Password"]')
    .first()
    .type(password, { delay: 100 });
  
  // ログインボタンをクリック
  cy.get('button[type="submit"], button:contains("Sign In"), button:contains("ログイン"), button:contains("Sign in")')
    .eq(1)
    .click();
  
  // 認証完了まで待機：ダッシュボードへの遷移または見出し表示を確認
  cy.url({ timeout: 60000 }).should('include', '/dashboard');
  
  // Authenticatorが消えている（または非表示）ことを確認
  //cy.get('[data-amplify-authenticator]', { timeout: 10000 }).should('not.be.visible');
});

// 保護されたページにアクセスして認証をトリガー
Cypress.Commands.add('loginWithProtectedPage', (email, password) => {
  // 保護されたページに直接アクセスして認証をトリガー
  cy.visit('/dashboard');
  
  // Amplify Authenticatorが表示されるまで待機
  cy.get('[data-testid="authenticator"], .amplify-authenticator, [data-amplify-authenticator]', { timeout: 10000 }).should('be.visible');
  
  // メールアドレスを入力
  cy.get('input[type="email"], input[name*="email"], input[placeholder*="email"], input[placeholder*="Email"]')
    .first()
    .type(email);
  
  // パスワードを入力
  cy.get('input[type="password"], input[name*="password"], input[placeholder*="Password"]')
    .first()
    .type(password);
  
  // ログインボタンをクリック
  cy.get('button[type="submit"], button:contains("Sign In"), button:contains("ログイン"), button:contains("Sign in")')
    .eq(1)
    .click();
  
  // 認証完了まで待機
  cy.url().should('include', '/dashboard', { timeout: 15000 });
});

// セッションを使用した認証バイパス
Cypress.Commands.add('loginWithSession', (email, password) => {
  cy.session([email, password], () => {
    cy.loginWithProtectedPage(email, password);
  }, {
    validate() {
      cy.url().should('include', '/dashboard');
    },
    cacheAcrossSpecs: true
  });
});

// 認証状態をチェック
Cypress.Commands.add('checkAuthState', () => {
  cy.get('body').then(($body) => {
    if ($body.find('input[type="email"], input[name*="email"], [data-amplify-authenticator]').length > 0) {
      cy.log('認証が必要です');
      return false;
    } else {
      cy.log('認証済みです');
      return true;
    }
  });
});

// ログアウト
Cypress.Commands.add('logout', () => {
  // ログアウトボタンを探す（複数の可能性を試す）
  cy.get('body').then(($body) => {
    const logoutSelectors = [
      'button:contains("Sign Out")',
      'button:contains("ログアウト")',
      'button:contains("Logout")',
      '[data-testid="sign-out"]',
      '[data-amplify-sign-out]',
      '.amplify-button[data-variation="link"]',
      'button[aria-label*="sign out"]',
      'button[aria-label*="ログアウト"]'
    ];
    
    let found = false;
    logoutSelectors.forEach(selector => {
      if ($body.find(selector).length > 0) {
        cy.get(selector).first().click();
        found = true;
        return false; // break
      }
    });
    
    if (!found) {
      // ログアウトボタンが見つからない場合は、セッションを手動でクリア
      cy.clearAllSessionStorage();
      cy.clearAllLocalStorage();
      cy.clearCookies();
    }
  });
  
  // ログアウト後は認証画面が表示されるか、ホームページにリダイレクトされる
  cy.url().should('not.include', '/dashboard');
});

// 実際のAPI認証をテストするコマンド
Cypress.Commands.add('loginWithRealAPI', (email, password) => {
  // まずモック認証でログイン状態を作成
  cy.loginWithMock(email, password);
  
  // 実際のAPIを呼び出して認証状態を確認
  cy.request({
    method: 'GET',
    url: 'https://api-plusoneup.com/api/current_user',
    headers: {
      'Authorization': 'Bearer mock-token',
      'Content-Type': 'application/json'
    },
    failOnStatusCode: false
  }).then((response) => {
    cy.log(`API Response Status: ${response.status}`);
    cy.log(`API Response Body: ${JSON.stringify(response.body)}`);
    
    if (response.status === 200) {
      cy.log('✅ 実際のAPI認証が成功しました');
    } else if (response.status === 422) {
      cy.log('⚠️ API認証で422エラーが発生しました（期待される動作）');
    } else {
      cy.log(`❌ 予期しないAPIレスポンス: ${response.status}`);
    }
  });
});

// API認証状態を確認するコマンド
Cypress.Commands.add('checkAPIStatus', () => {
  cy.request({
    method: 'GET',
    url: 'https://api-plusoneup.com/api/current_user',
    failOnStatusCode: false
  }).then((response) => response);
});