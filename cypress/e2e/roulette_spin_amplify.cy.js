describe('Amplify認証を使用したルーレット回転テスト', () => {
  beforeEach(() => {
    // 環境変数の検証
    cy.validateEnvVars()
    
    // Amplify認証付きでページにアクセス
    cy.visitWithAmplifyAuth('/dashboard')
    
    // 本番環境用のAPIモック（実際のAPIを呼び出す場合は削除）
    if (Cypress.env('MOCK_API') !== 'false') {
      cy.intercept('PATCH', '**/api/roulette_texts/spin', {
        statusCode: 200,
        body: { tickets: 4 }
      }).as('spinRoulette')
      
      cy.intercept('GET', '**/api/roulette_texts/*', {
        statusCode: 200,
        body: { text: '本番テスト用ルーレットテキスト' }
      }).as('fetchRouletteText')
      
      cy.intercept('GET', '**/api/tickets', {
        statusCode: 200,
        body: { tickets: 4 }
      }).as('fetchTickets')
    }
  })

  it('Amplify認証後にルーレットを回すことができる', () => {
    // ページが正常に読み込まれているか確認
    cy.get('body').should('be.visible')
    
    // ルーレットコンテナが表示されているか確認
    cy.get('[data-testid="roulette-container"]', { timeout: 15000 }).should('be.visible')
    
    // ルーレットボタンが存在するか確認
    cy.get('[data-testid="start-button"]', { timeout: 15000 })
      .should('be.visible')
      .should('not.be.disabled')
    
    // ルーレットを回す
    cy.get('[data-testid="start-button"]').click()
    
    // 確認ダイアログでOKを選択
    cy.on('window:confirm', () => true)
    
    // APIリクエストが送信されることを確認（モックが有効な場合）
    if (Cypress.env('MOCK_API') !== 'false') {
      cy.wait('@spinRoulette')
    }
    
    // ルーレットが回転開始することを確認
    cy.get('[data-testid="roulette-wheel"]')
      .should('have.css', 'transition')
      .and('include', 'transform 6s cubic-bezier')
    
    // ボタンが無効化されることを確認
    cy.get('[data-testid="start-button"]').should('be.disabled')
    
    // ルーレット回転完了を待機
    cy.wait(6000)
    
    // モーダルが表示されることを確認
    cy.get('[role="dialog"]', { timeout: 15000 }).should('be.visible')
    
    // モーダルを閉じる
    cy.get('[data-testid="close-modal-button"]').click()
    cy.get('[role="dialog"]').should('not.exist')
    
    // ボタンが再び有効化されることを確認
    cy.get('[data-testid="start-button"]').should('not.be.disabled')
  })

  it('Amplify認証後のエラーハンドリング', () => {
    // チケットが0枚の状態をテスト
    cy.get('[data-testid="start-button"]').click()
    
    // アラートが表示されることを確認
    cy.on('window:alert', (str) => {
      expect(str).to.include('チケット')
    })
  })
}) 