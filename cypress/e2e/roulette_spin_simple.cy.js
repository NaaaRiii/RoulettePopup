describe('ルーレット回転 E2Eテスト（簡潔版）', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4000/dashboard')
    cy.mockRouletteAPI()
  })

  it('チケットを1枚消費してルーレットを回す完全なフロー', () => {
    // 初期状態の確認
    cy.get('[data-testid="roulette-container"]').should('be.visible')
    cy.get('[data-testid="start-button"]').should('not.be.disabled')
    
    // ルーレットを回す
    cy.spinRoulette()
    
    // APIリクエストが送信されることを確認
    cy.wait('@spinRoulette')
    
    // ルーレットが回転開始することを確認
    cy.get('[data-testid="roulette-wheel"]')
      .should('have.css', 'transition')
      .and('include', 'transform 6s cubic-bezier')
    
    // ボタンが無効化されることを確認
    cy.get('[data-testid="start-button"]').should('be.disabled')
    
    // ルーレット回転完了を待機
    cy.waitForRouletteSpin()
    
    // モーダルが表示されることを確認
    cy.get('[role="dialog"]').should('be.visible')
    cy.contains('Matched text is: テスト用ルーレットテキスト').should('be.visible')
    
    // モーダルを閉じる
    cy.get('[data-testid="close-modal-button"]').click()
    cy.get('[role="dialog"]').should('not.exist')
    
    // チケット情報が再取得されることを確認
    cy.wait('@fetchTickets')
    
    // ボタンが再び有効化されることを確認
    cy.get('[data-testid="start-button"]').should('not.be.disabled')
  })

  it('チケットが0枚の場合のエラーハンドリング', () => {
    // チケットが0枚の状態をモック
    cy.intercept('GET', '/api/tickets', {
      statusCode: 200,
      body: { tickets: 0 }
    }).as('fetchTicketsZero')
    
    cy.reload()
    cy.wait('@fetchTicketsZero')
    
    // ルーレットボタンをクリック
    cy.get('[data-testid="start-button"]').click()
    
    // アラートが表示されることを確認
    cy.on('window:alert', (str) => {
      expect(str).to.equal('チケットが不足しています')
    })
  })

  it('APIエラー時のエラーハンドリング', () => {
    // APIエラーをモック
    cy.intercept('PATCH', '/api/roulette_texts/spin', {
      statusCode: 500,
      body: { error: 'サーバーエラーが発生しました' }
    }).as('spinRouletteError')
    
    // ルーレットを回そうとする
    cy.spinRoulette()
    
    // エラーアラートが表示されることを確認
    cy.on('window:alert', (str) => {
      expect(str).to.equal('サーバーエラーが発生しました')
    })
    
    // ルーレットが回転しないことを確認
    cy.get('[data-testid="roulette-wheel"]')
      .should('have.css', 'transform', 'rotate(90deg)')
  })
}) 