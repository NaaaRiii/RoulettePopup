const BASE = 'https://plusoneup.net';

describe('認証要素のデバッグテスト', () => {
  it('ログインページの要素を確認する', () => {
    // ホームページにアクセス
    cy.visit(`${BASE}/`);
    
    // ログインボタンをクリック
    cy.get('button').contains('Log In').click();

    // 現在のURLを確認
    cy.url().then((url) => {
      cy.log('Current URL:', url);
    });

    // ページのHTMLを確認
    cy.get('body').then(($body) => {
      cy.log('Body HTML:', $body.html());
    });

    // 利用可能なボタンを確認
    cy.get('button').each(($button, index) => {
      cy.log(`Button ${index}:`, $button.text());
    });

    // 利用可能なinput要素を確認
    cy.get('input').each(($input, index) => {
      cy.log(`Input ${index}:`, $input.attr('type'), $input.attr('placeholder'));
    });

    // 利用可能なリンクを確認
    cy.get('a').each(($link, index) => {
      cy.log(`Link ${index}:`, $link.text());
    });

    // ページ全体のスクリーンショットを撮影
    cy.screenshot('login-page-debug');
  });

  it('Amplify Authenticatorの要素を確認する', () => {
    // 直接ログインページにアクセス
    cy.visit(`${BASE}/login`);

    // ページのHTMLを確認
    cy.get('body').then(($body) => {
      cy.log('Login page HTML:', $body.html());
    });

    // data-testid属性を持つ要素を確認
    cy.get('[data-testid]').each(($el, index) => {
      cy.log(`data-testid ${index}:`, $el.attr('data-testid'));
    });

    // class属性にamplifyを含む要素を確認
    cy.get('[class*="amplify"]').each(($el, index) => {
      cy.log(`Amplify class ${index}:`, $el.attr('class'));
    });

    // ページ全体のスクリーンショットを撮影
    cy.screenshot('amplify-debug');
  });
}); 