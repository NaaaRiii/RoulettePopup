const BASE = 'https://plusoneup.net';

describe('認証統合テスト', () => {
  // テスト用の既存ユーザー（事前に作成済み）
  const testUser = {
    email: Cypress.env('TEST_EMAIL') || 'test@example.com',
    password: Cypress.env('TEST_PASSWORD') || 'TestPassword123!'
  };

  beforeEach(() => {
    // 各テスト前にログアウト状態にする
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('認証フロー全体が正常に動作する', () => {
    // 1. ホームページにアクセス
    cy.visit(`${BASE}/`);
    cy.get('h1').should('contain', 'Plus ONE');

    // 2. ログインボタンをクリック
    cy.get('button').contains('Log In').click();

    // 3. ダッシュボードに遷移し、認証が必要でログインページにリダイレクトされる
    cy.url().should('include', '/login');

    // 4. Amplify Authenticatorが表示されることを確認
    cy.get('[data-testid="authenticator"]', { timeout: 10000 }).should('be.visible');

    // 5. ログイン情報を入力
    cy.get('input[type="email"]').type(testUser.email);
    cy.get('input[type="password"]').type(testUser.password);

    // 6. ログインボタンをクリック
    cy.get('button[type="submit"]').contains('Sign In').click();

    // 7. ダッシュボードにリダイレクトされることを確認
    cy.url().should('include', '/dashboard');
    cy.get('.dashboard').should('be.visible');

    // 8. ユーザー情報が表示されることを確認
    cy.get('.user-profile__name').should('be.visible');
  });

  it('認証エラーが適切に処理される', () => {
    cy.visit(`${BASE}/`);
    cy.get('button').contains('Log In').click();

    // ログインページにリダイレクトされることを確認
    cy.url().should('include', '/login');

    // Amplify Authenticatorが表示されることを確認
    cy.get('[data-testid="authenticator"]', { timeout: 10000 }).should('be.visible');

    // 無効な認証情報でログイン試行
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').contains('Sign In').click();

    // エラーメッセージが表示されることを確認
    cy.get('[data-testid="error-message"], .error, [role="alert"]', { timeout: 10000 })
      .should('be.visible');
  });

  it('認証状態が適切に管理される', () => {
    // ログイン
    cy.visit(`${BASE}/`);
    cy.get('button').contains('Log In').click();
    cy.url().should('include', '/login');
    cy.get('input[type="email"]').type(testUser.email);
    cy.get('input[type="password"]').type(testUser.password);
    cy.get('button[type="submit"]').contains('Sign In').click();

    // ダッシュボードにアクセス
    cy.url().should('include', '/dashboard');

    // ページをリロードしてもログイン状態が保持される
    cy.reload();
    cy.url().should('include', '/dashboard');
    cy.get('.dashboard').should('be.visible');

    // 直接ダッシュボードにアクセスしても表示される
    cy.visit(`${BASE}/dashboard`);
    cy.url().should('include', '/dashboard');
  });

  it('未認証ユーザーはダッシュボードにアクセスできない', () => {
    // クッキーとローカルストレージをクリア
    cy.clearCookies();
    cy.clearLocalStorage();

    // 直接ダッシュボードにアクセス
    cy.visit(`${BASE}/dashboard`);

    // ログインページにリダイレクトされることを確認
    cy.url().should('include', '/login');
  });
});

describe('API認証テスト', () => {
  it('認証済みユーザーでAPIが正常に動作する', () => {
    // ログイン
    cy.visit(`${BASE}/`);
    cy.get('button').contains('Log In').click();
    cy.url().should('include', '/login');
    cy.get('input[type="email"]').type(testUser.email);
    cy.get('input[type="password"]').type(testUser.password);
    cy.get('button[type="submit"]').contains('Sign In').click();

    // ダッシュボードにアクセス
    cy.url().should('include', '/dashboard');

    // APIリクエストが正常に動作することを確認
    cy.intercept('GET', '**/api/current_user').as('getCurrentUser');
    cy.wait('@getCurrentUser').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      expect(interception.response.body).to.have.property('id');
      expect(interception.response.body).to.have.property('name');
    });
  });

  it('未認証ユーザーでAPIがエラーを返す', () => {
    // クッキーとローカルストレージをクリア
    cy.clearCookies();
    cy.clearLocalStorage();

    // 未認証状態でAPIリクエスト
    cy.request({
      url: `${BASE}/api/current_user`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.be.oneOf([401, 403, 302]);
    });
  });
}); 