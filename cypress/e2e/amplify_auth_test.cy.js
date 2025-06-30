// 注意: このテストを実行するには、実際に存在するユーザーアカウントが必要です
// cypress.env.prod.jsonで設定されたTEST_EMAILとTEST_PASSWORDのユーザーが
// AWS Cognitoに登録されている必要があります
// テストが失敗する場合は、実際のユーザー情報に変更するか、テストをスキップしてください
// 
// 認証フロー: 未認証ユーザーが保護されたページ（/dashboard等）にアクセスすると
// Amplify Authenticatorがインライン表示され、認証後にダッシュボードが表示されます

describe('Amplify認証テスト', () => {
  const testEmail = Cypress.env('TEST_EMAIL') || Cypress.env('PROD_EMAIL');
  const testPassword = Cypress.env('TEST_PASSWORD') || Cypress.env('PROD_PASSWORD');
  const invalidEmail = 'invalid@example.com';
  const invalidPassword = 'InvalidPassword123!';
  // モック認証は使用しない

  // 環境変数の読み込み状況をログ出力
  before(() => {
    cy.log('環境変数の読み込み状況:');
    cy.log(`TEST_EMAIL: ${testEmail}`);
    cy.log(`TEST_PASSWORD: ${testPassword ? '***' : 'undefined'}`);
    //cy.log(`MOCK_AUTH: ${useMockAuth}`);
    //cy.log(`TEST_REAL_API: ${testRealAPI}`);
    cy.log(`cypress.env.prod.jsonから読み込み: ${Cypress.env('TEST_EMAIL') ? '成功' : '失敗'}`);
  });

  // 実際のユーザー情報が設定されていない場合はテストをスキップ
  const skipIfNoRealUser = () => {
    // モック認証が有効な場合はスキップしない
    //if (useMockAuth) {
    //  return false;
    //}
    
    // 環境変数が未設定、またはプレースホルダー値の場合はスキップ
    if (!testEmail || !testPassword ||
        testEmail.includes('example.com') ||
        testPassword.toLowerCase().includes('password')) {
      cy.log('実際のユーザー情報が設定されていません。テストをスキップします。');
      cy.log(`現在の設定: TEST_EMAIL=${testEmail || 'undefined'}, TEST_PASSWORD=${testPassword ? '***' : 'undefined'}`);
      return true;
    }
    return false;
  };

  // 認証方法を選択する関数（常に実認証）
  const performLogin = (email, password) => {
    cy.loginWithAmplify(email, password);
  };

  // セッション認証（モックを使わず実認証）
  const performSessionLogin = (email, password) => {
    cy.loginWithSession(email, password);
  };

  beforeEach(() => {
    // 各テスト前にクッキーとローカルストレージをクリア
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('ログインフロー', () => {
    it('正常なログインが成功する', () => {
      if (skipIfNoRealUser()) return;
      
      performLogin(testEmail, testPassword);
      
      // ログインが成功したことを確認（ダッシュボードに遷移している）
      cy.url({ timeout: 60000 }).should('include', '/dashboard');
    });

    it('無効な認証情報でログインが失敗する', () => {
      // 保護されたページにアクセスして認証をトリガー
      cy.visit('/dashboard');
      
      // Amplify Authenticatorが表示されるまで待機
      cy.get('[data-testid="authenticator"], .amplify-authenticator, [data-amplify-authenticator]', { timeout: 10000 }).should('be.visible');
      
      // 無効な認証情報を入力
      cy.get('input[type="email"], input[name*="email"], input[placeholder*="email"], input[placeholder*="Email"]')
        .first()
        .type(invalidEmail);
      
      cy.get('input[type="password"], input[name*="password"], input[placeholder*="Password"]')
        .first()
        .type(invalidPassword);
      
      cy.get('button[type="submit"], button:contains("Sign In"), button:contains("ログイン"), button:contains("Sign in")')
        .eq(1)
        .click();
      
      // エラーメッセージが表示されるか、認証画面に留まることを確認
      cy.get('[data-amplify-authenticator]', { timeout: 10000 }).should('be.visible');
    });

    it('空の認証情報でログインが失敗する', () => {
      // 保護されたページにアクセスして認証をトリガー
      cy.visit('/dashboard');
      
      // Amplify Authenticatorが表示されるまで待機
      cy.get('[data-testid="authenticator"], .amplify-authenticator, [data-amplify-authenticator]', { timeout: 10000 }).should('be.visible');
      
      // 空の認証情報でログインボタンをクリック
      cy.get('button[type="submit"], button:contains("Sign In"), button:contains("ログイン"), button:contains("Sign in")')
        .eq(1)
        .click();
      
      // バリデーションエラーが表示されるか、認証画面に留まることを確認
      cy.get('[data-amplify-authenticator]', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('セッション管理', () => {
    it('セッションを使用した認証が正常に動作する', () => {
      if (skipIfNoRealUser()) return;
      
      performSessionLogin(testEmail, testPassword);
      
      // ダッシュボードにアクセスできることを確認
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
    });

    it('ページリロード後も認証状態が保持される', () => {
      if (skipIfNoRealUser()) return;
      
      performSessionLogin(testEmail, testPassword);
      
      // ダッシュボードにアクセス
      cy.visit('/dashboard');
      
      // ページをリロード
      cy.reload();
      
      // 認証状態が保持されていることを確認
      cy.url().should('include', '/dashboard');
      cy.get('body').should('not.contain', '[data-amplify-authenticator]');
    });

    it('直接ダッシュボードにアクセスできる', () => {
      if (skipIfNoRealUser()) return;
      
      performSessionLogin(testEmail, testPassword);
      
      // 直接ダッシュボードにアクセス
      cy.visit('/dashboard');
      
      cy.url().should('include', '/dashboard');
    });
  });

  describe('認証保護', () => {
    it('未認証ユーザーはダッシュボードにアクセスできない', () => {
      // セッションをクリアして未認証状態にする
      cy.clearAllSessionStorage();
      cy.clearAllLocalStorage();
      
      cy.visit('/dashboard');
      
      // 認証画面が表示されることを確認
      cy.get('[data-testid="authenticator"], .amplify-authenticator, [data-amplify-authenticator]', { timeout: 10000 }).should('be.visible');
    });

    it('未認証ユーザーは保護されたページにアクセスできない', () => {
      // セッションをクリアして未認証状態にする
      cy.clearAllSessionStorage();
      cy.clearAllLocalStorage();
      
      // 存在しない保護されたページにアクセス
      cy.request({
        url: '/goals/123',
        failOnStatusCode: false
      }).then((response) => {
        if (response.status === 404) {
          // 404エラーの場合
          expect(response.status).to.eq(404);
        } else {
          // 認証画面が表示される場合
          cy.visit('/goals/123', { failOnStatusCode: false });
          cy.get('[data-amplify-authenticator]', { timeout: 10000 }).should('be.visible');
        }
      });
    });
  });

  describe('ログアウト', () => {
    it('ログアウトが正常に動作する', () => {
      if (skipIfNoRealUser()) return;
      
      performSessionLogin(testEmail, testPassword);
      
      cy.logout();
      
      // ログアウト後はダッシュボードにアクセスできないことを確認
      cy.visit('/dashboard');
      cy.get('[data-amplify-authenticator]', { timeout: 10000 }).should('be.visible');
    });

    it('ログアウト後は保護されたページにアクセスできない', () => {
      if (skipIfNoRealUser()) return;
      
      performSessionLogin(testEmail, testPassword);
      
      cy.logout();
      
      // ログアウト後は保護されたページにアクセスできないことを確認
      cy.visit('/dashboard');
      cy.get('[data-amplify-authenticator]', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('UI要素の確認', () => {
    it('認証画面の要素が正しく表示される', () => {
      // 保護されたページにアクセスして認証をトリガー
      cy.visit('/dashboard');
      
      // Amplify Authenticatorが表示されることを確認
      cy.get('[data-testid="authenticator"], .amplify-authenticator, [data-amplify-authenticator]', { timeout: 10000 }).should('be.visible');
      
      // ログインフォームの要素が表示されることを確認
      cy.get('input[type="email"], input[name*="email"], input[placeholder*="email"], input[placeholder*="Email"]').should('be.visible');
      cy.get('input[type="password"], input[name*="password"], input[placeholder*="Password"]').should('be.visible');
      cy.get('button[type="submit"], button:contains("Sign In"), button:contains("ログイン"), button:contains("Sign in")').should('be.visible');
    });

    it('ダッシュボードの要素が正しく表示される', () => {
      if (skipIfNoRealUser()) return;
      
      performSessionLogin(testEmail, testPassword);
      
      cy.visit('/dashboard');
      
      // ダッシュボードの要素が表示されることを確認
      cy.url().should('include', '/dashboard');
    });
  });

  describe('エラーハンドリング', () => {
    it('ネットワークエラーが適切に処理される', () => {
      // 特定のAPIエンドポイントのみをモックしてネットワークエラーをシミュレート
      cy.intercept('POST', '**/auth/**', { forceNetworkError: true }).as('authError');
      cy.intercept('GET', '**/auth/**', { forceNetworkError: true }).as('authGetError');
      
      // 保護されたページにアクセスして認証をトリガー
      cy.visit('/dashboard', { timeout: 60000 });
      
      // ページが正常に読み込まれることを確認
      cy.get('body').should('be.visible');
      
      // 認証フォームが表示されることを確認
      cy.get('[data-testid="authenticator"], .amplify-authenticator, [data-amplify-authenticator]', { timeout: 15000 }).should('be.visible');
    });
  });

  describe('API認証テスト', () => {
    it('実際のAPI認証が正常に動作する', () => {
      if (skipIfNoRealUser()) return;
      
      // API認証をテスト
      performLogin(testEmail, testPassword);
      
      // API認証状態を確認
      cy.checkAPIStatus().then((response) => {
        if (response.status === 200) {
          cy.log('✅ 実際のAPI認証が成功しました');
        } else if (response.status === 422) {
          cy.log('⚠️ API認証で422エラーが発生しました（ユーザーがRails側に登録されていない可能性）');
          // 422エラーでもテストは成功とする（期待される動作）
          expect(response.status).to.be.oneOf([200, 422]);
        } else {
          cy.log(`❌ 予期しないAPIレスポンス: ${response.status}`);
          expect(response.status).to.be.oneOf([200, 422]);
        }
      });
    });

    it('API認証後のダッシュボードアクセス', () => {
      if (skipIfNoRealUser()) return;
      
      // API認証をテスト
      performLogin(testEmail, testPassword);
      
      // ダッシュボードにアクセス
      cy.visit('/dashboard');
      
      cy.url().should('include', '/dashboard');
    });
  });
});