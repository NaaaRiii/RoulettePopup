const BASE = 'https://plusoneup.net';

describe('シンプル認証テスト', () => {
  it('ホームページにアクセスできる', () => {
    cy.visit(`${BASE}/`);
    
    // ホームページの要素を確認
    cy.get('h1').should('contain', 'Plus ONE');
    cy.get('button').contains('Sign Up').should('be.visible');
    cy.get('button').contains('Log In').should('be.visible');
  });

  it('ログインボタンをクリックしてダッシュボードに遷移する', () => {
    cy.visit(`${BASE}/`);
    
    // ログインボタンをクリック
    cy.get('button').contains('Log In').click();
    
    // URLの変化を確認
    cy.url().then((url) => {
      cy.log('URL after clicking Log In:', url);
    });
    
    // ページのタイトルを確認
    cy.title().then((title) => {
      cy.log('Page title:', title);
    });
    
    // ページ全体のスクリーンショットを撮影
    cy.screenshot('after-login-click');
  });

  it('直接ダッシュボードにアクセスする', () => {
    cy.visit(`${BASE}/dashboard`);
    
    // URLの変化を確認
    cy.url().then((url) => {
      cy.log('URL when accessing dashboard directly:', url);
    });
    
    // ページのタイトルを確認
    cy.title().then((title) => {
      cy.log('Dashboard page title:', title);
    });
    
    // ページ全体のスクリーンショットを撮影
    cy.screenshot('direct-dashboard-access');
  });

  it('直接ログインページにアクセスする', () => {
    cy.visit(`${BASE}/login`);
    
    // URLの変化を確認
    cy.url().then((url) => {
      cy.log('URL when accessing login directly:', url);
    });
    
    // ページのタイトルを確認
    cy.title().then((title) => {
      cy.log('Login page title:', title);
    });
    
    // ページ全体のスクリーンショットを撮影
    cy.screenshot('direct-login-access');
  });
}); 