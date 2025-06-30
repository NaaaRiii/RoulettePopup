/// <reference types="cypress" />

// Goal作成のE2Eテスト（実API使用）
// 前提: TEST_EMAIL / TEST_PASSWORD のユーザーがCognitoおよびRails APIに存在する
// MOCK_AUTH=false で実行すること

describe('Goal作成 E2Eテスト', () => {
  const testEmail = Cypress.env('TEST_EMAIL');
  const testPassword = Cypress.env('TEST_PASSWORD');


  it('DashboardからGoalを作成してAPIが200系で応答する', () => {

    // 認証
    cy.loginWithAmplify(testEmail, testPassword);

    // ダッシュボードが表示されるまで待機
    cy.url({ timeout: 60000 }).should('include', '/dashboard');

    // ボタン要素（div / a / button いずれでも）を待機してクリック
    cy.contains('div.btn.btn-primary', 'Goalを設定する', { timeout: 60000 })
      .scrollIntoView()
      .click({ force: true });

    // モーダルが表示されていること
    cy.get('[role="dialog"]').should('be.visible');

    // フォーム入力
    const title = `E2E Test Goal ${Date.now()}`;
    const content = 'これはCypress E2Eテストで生成されたGoalです';
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    cy.get('#title').type(title);
    cy.get('#content').type(content);
    cy.get('#deadline').type(futureDate);

    // APIリクエストを監視
    cy.intercept('POST', '/api/goals').as('createGoal');

    // 送信
    cy.contains('button', '設定する').click();

    // APIが成功していることを確認 (200-299)
    cy.wait('@createGoal').its('response.statusCode').should('be.within', 200, 299);

    // goals/:id へ遷移していること
    cy.url({ timeout: 15000 }).should('match', /\/goals\/[0-9]+/);

    // 画面に入力したタイトルが表示されること
    cy.contains(title).should('be.visible');
  });
}); 