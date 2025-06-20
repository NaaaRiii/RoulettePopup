const BASE = 'https://plusoneup.net';

describe('新規ユーザー登録と認証テスト', () => {
  beforeEach(() => {
    // テスト用のユニークなメールアドレスを生成
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';
    
    // テストデータを保存
    cy.wrap({ email: testEmail, password: testPassword }).as('testData');
  });

  it('新規ユーザー登録が成功する', function() {
    const { email, password } = this.testData;

    // ホームページにアクセス
    cy.visit(`${BASE}/`);
    
    // サインアップボタンをクリック
    cy.get('button').contains('Sign Up').click();

    // サインアップページに遷移することを確認（存在しない場合はログインページにリダイレクト）
    cy.url().should('include', '/login');

    // Amplify Authenticatorのサインアップフォームが表示されることを確認
    cy.get('[data-testid="authenticator"]', { timeout: 10000 }).should('be.visible');

    // サインアップタブをクリック（存在する場合）
    cy.get('button').contains('Create account').click();

    // メールアドレスを入力
    cy.get('input[type="email"]').type(email);

    // パスワードを入力
    cy.get('input[type="password"]').first().type(password);

    // 確認用パスワードを入力
    cy.get('input[type="password"]').last().type(password);

    // サインアップボタンをクリック
    cy.get('button[type="submit"]').contains('Create account').click();

    // 確認コードの入力画面が表示されることを確認
    cy.get('[data-testid="confirm-sign-up"]', { timeout: 10000 }).should('be.visible');
    
    // メール確認コードの入力フィールドが表示されることを確認
    cy.get('input[placeholder*="code"], input[name="code"]').should('be.visible');
  });

  it('既存ユーザーでログインが成功する', function() {
    const { email, password } = this.testData;

    // ホームページにアクセス
    cy.visit(`${BASE}/`);
    
    // ログインボタンをクリック
    cy.get('button').contains('Log In').click();

    // ダッシュボードに遷移することを確認（認証が必要）
    cy.url().should('include', '/dashboard');

    // ログインページにリダイレクトされることを確認
    cy.url().should('include', '/login');

    // Amplify Authenticatorのログインフォームが表示されることを確認
    cy.get('[data-testid="authenticator"]', { timeout: 10000 }).should('be.visible');

    // メールアドレスを入力
    cy.get('input[type="email"]').type(email);

    // パスワードを入力
    cy.get('input[type="password"]').type(password);

    // ログインボタンをクリック
    cy.get('button[type="submit"]').contains('Sign In').click();

    // ダッシュボードにリダイレクトされることを確認
    cy.url().should('include', '/dashboard');
    
    // ダッシュボードの要素が表示されることを確認
    cy.get('.dashboard').should('be.visible');
  });

  it('無効な認証情報でログインが失敗する', () => {
    // ホームページにアクセス
    cy.visit(`${BASE}/`);
    
    // ログインボタンをクリック
    cy.get('button').contains('Log In').click();

    // ログインページにリダイレクトされることを確認
    cy.url().should('include', '/login');

    // Amplify Authenticatorのログインフォームが表示されることを確認
    cy.get('[data-testid="authenticator"]', { timeout: 10000 }).should('be.visible');

    // 無効なメールアドレスとパスワードを入力
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');

    // ログインボタンをクリック
    cy.get('button[type="submit"]').contains('Sign In').click();

    // エラーメッセージが表示されることを確認
    cy.get('[data-testid="error-message"], .error, [role="alert"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'error');
  });

  it('パスワードリセットフローが動作する', () => {
    // ホームページにアクセス
    cy.visit(`${BASE}/`);
    
    // ログインボタンをクリック
    cy.get('button').contains('Log In').click();

    // ログインページにリダイレクトされることを確認
    cy.url().should('include', '/login');

    // Amplify Authenticatorのログインフォームが表示されることを確認
    cy.get('[data-testid="authenticator"]', { timeout: 10000 }).should('be.visible');

    // パスワードを忘れた場合のリンクをクリック
    cy.get('a').contains('Forgot your password?').click();

    // パスワードリセット画面が表示されることを確認
    cy.get('[data-testid="forgot-password"]', { timeout: 10000 }).should('be.visible');
    
    // メールアドレス入力フィールドが表示されることを確認
    cy.get('input[type="email"]').should('be.visible');
  });
});

describe('認証状態の管理テスト', () => {
  it('ログイン後にセッションが保持される', () => {
    // 既存のログイン処理を使用（環境変数から取得）
    const email = Cypress.env('PROD_EMAIL');
    const password = Cypress.env('PROD_PASSWORD');

    if (!email || !password) {
      cy.log('PROD_EMAIL / PROD_PASSWORD が未設定のため、このテストをスキップします');
      return;
    }

    // ログイン処理
    cy.visit(`${BASE}/`);
    cy.get('button').contains('Log In').click();
    cy.url().should('include', '/login');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').contains('Sign In').click();

    // ダッシュボードにリダイレクトされることを確認
    cy.url().should('include', '/dashboard');

    // ページをリロード
    cy.reload();

    // ログイン状態が保持されていることを確認
    cy.url().should('include', '/dashboard');
    cy.get('.dashboard').should('be.visible');
  });

  it('ログアウト後にセッションがクリアされる', () => {
    // 既存のログイン処理を使用
    const email = Cypress.env('PROD_EMAIL');
    const password = Cypress.env('PROD_PASSWORD');

    if (!email || !password) {
      cy.log('PROD_EMAIL / PROD_PASSWORD が未設定のため、このテストをスキップします');
      return;
    }

    // ログイン処理
    cy.visit(`${BASE}/`);
    cy.get('button').contains('Log In').click();
    cy.url().should('include', '/login');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').contains('Sign In').click();

    // ダッシュボードにリダイレクトされることを確認
    cy.url().should('include', '/dashboard');

    // ログアウトボタンをクリック（ヘッダーなどにある場合）
    cy.get('button').contains('Logout').click();

    // ホームページにリダイレクトされることを確認
    cy.url().should('eq', `${BASE}/`);
  });
}); 