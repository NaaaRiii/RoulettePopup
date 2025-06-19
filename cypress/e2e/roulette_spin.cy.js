describe('ルーレット回転 E2Eテスト', () => {
  beforeEach(() => {
    // テスト前にダッシュボードページにアクセス
    cy.visit('http://localhost:4000/dashboard')
    
    // ネットワークリクエストをモック
    cy.intercept('PATCH', '/api/roulette_texts/spin', {
      statusCode: 200,
      body: { tickets: 4 } // チケットが1枚減る
    }).as('spinRoulette')
    
    cy.intercept('GET', '/api/roulette_texts/*', {
      statusCode: 200,
      body: { text: 'テスト用ルーレットテキスト' }
    }).as('fetchRouletteText')
    
    cy.intercept('GET', '/api/tickets', {
      statusCode: 200,
      body: { tickets: 4 }
    }).as('fetchTickets')
  })

  it('チケットが1枚ある状態でルーレットを回すことができる', () => {
    // ルーレットコンテナが表示されていることを確認
    cy.get('[data-testid="roulette-container"]').should('be.visible')
    cy.get('[data-testid="roulette-wheel"]').should('be.visible')
    cy.get('[data-testid="roulette-pointer"]').should('be.visible')
    
    // 開始ボタンが存在し、有効であることを確認
    cy.get('[data-testid="start-button"]')
      .should('be.visible')
      .should('not.be.disabled')
      .should('contain.text', 'ルーレットを回す')
  })

  it('ルーレットボタンをクリックすると確認ダイアログが表示される', () => {
    // ルーレットボタンをクリック
    cy.get('[data-testid="start-button"]').click()
    
    // 確認ダイアログが表示されることを確認
    cy.on('window:confirm', (str) => {
      expect(str).to.equal('チケットを1枚消費して、ルーレットを回しますか？')
      return true // 確認ダイアログで「OK」を選択
    })
  })

  it('確認ダイアログでキャンセルするとルーレットが回らない', () => {
    // ルーレットボタンをクリック
    cy.get('[data-testid="start-button"]').click()
    
    // 確認ダイアログでキャンセル
    cy.on('window:confirm', () => false)
    
    // APIリクエストが送信されないことを確認
    cy.wait(1000) // 少し待機
    cy.get('@spinRoulette.all').should('have.length', 0)
    
    // ルーレットの回転が開始されていないことを確認
    cy.get('[data-testid="roulette-wheel"]')
      .should('have.css', 'transform', 'rotate(90deg)')
  })

  it('確認ダイアログでOKを選択するとチケットが消費されルーレットが回る', () => {
    // ルーレットボタンをクリック
    cy.get('[data-testid="start-button"]').click()
    
    // 確認ダイアログでOKを選択
    cy.on('window:confirm', () => true)
    
    // APIリクエストが送信されることを確認
    cy.wait('@spinRoulette')
    
    // ルーレットが回転開始することを確認
    cy.get('[data-testid="roulette-wheel"]')
      .should('have.css', 'transition')
      .and('include', 'transform 6s cubic-bezier')
    
    // ボタンが無効化されることを確認
    cy.get('[data-testid="start-button"]').should('be.disabled')
  })

  it('ルーレット回転中はボタンが無効化される', () => {
    // ルーレットボタンをクリック
    cy.get('[data-testid="start-button"]').click()
    
    // 確認ダイアログでOKを選択
    cy.on('window:confirm', () => true)
    
    // 回転開始後、ボタンが無効化されることを確認
    cy.wait('@spinRoulette')
    cy.get('[data-testid="start-button"]').should('be.disabled')
  })

  it('ルーレット回転完了後にモーダルが表示される', () => {
    // ルーレットボタンをクリック
    cy.get('[data-testid="start-button"]').click()
    
    // 確認ダイアログでOKを選択
    cy.on('window:confirm', () => true)
    
    // APIリクエスト完了を待機
    cy.wait('@spinRoulette')
    cy.wait('@fetchRouletteText')
    
    // 6秒後にモーダルが表示されることを確認
    cy.wait(6000)
    cy.get('[role="dialog"]').should('be.visible')
    cy.contains('Matched text is: テスト用ルーレットテキスト').should('be.visible')
  })

  it('モーダルのCloseボタンでモーダルが閉じる', () => {
    // ルーレットボタンをクリック
    cy.get('[data-testid="start-button"]').click()
    
    // 確認ダイアログでOKを選択
    cy.on('window:confirm', () => true)
    
    // APIリクエスト完了を待機
    cy.wait('@spinRoulette')
    cy.wait('@fetchRouletteText')
    
    // 6秒後にモーダルが表示される
    cy.wait(6000)
    cy.get('[role="dialog"]').should('be.visible')
    
    // Closeボタンをクリック
    cy.get('[data-testid="close-modal-button"]').click()
    
    // モーダルが閉じることを確認
    cy.get('[role="dialog"]').should('not.exist')
    
    // チケット情報が再取得されることを確認
    cy.wait('@fetchTickets')
  })

  it('チケットが0枚の場合、アラートが表示される', () => {
    // チケットが0枚の状態をモック
    cy.intercept('GET', '/api/tickets', {
      statusCode: 200,
      body: { tickets: 0 }
    }).as('fetchTicketsZero')
    
    // ページをリロードしてチケット情報を更新
    cy.reload()
    cy.wait('@fetchTicketsZero')
    
    // ルーレットボタンをクリック
    cy.get('[data-testid="start-button"]').click()
    
    // アラートが表示されることを確認
    cy.on('window:alert', (str) => {
      expect(str).to.equal('チケットが不足しています')
    })
    
    // APIリクエストが送信されないことを確認
    cy.wait(1000)
    cy.get('@spinRoulette.all').should('have.length', 0)
  })

  it('APIエラー時にアラートが表示される', () => {
    // APIエラーをモック
    cy.intercept('PATCH', '/api/roulette_texts/spin', {
      statusCode: 500,
      body: { error: 'サーバーエラーが発生しました' }
    }).as('spinRouletteError')
    
    // ルーレットボタンをクリック
    cy.get('[data-testid="start-button"]').click()
    
    // 確認ダイアログでOKを選択
    cy.on('window:confirm', () => true)
    
    // エラーアラートが表示されることを確認
    cy.on('window:alert', (str) => {
      expect(str).to.equal('サーバーエラーが発生しました')
    })
    
    // ルーレットが回転しないことを確認
    cy.get('[data-testid="roulette-wheel"]')
      .should('have.css', 'transform', 'rotate(90deg)')
  })

  it('ルーレット回転完了後にonSpinCompleteコールバックが呼ばれる', () => {
    // ルーレットボタンをクリック
    cy.get('[data-testid="start-button"]').click()
    
    // 確認ダイアログでOKを選択
    cy.on('window:confirm', () => true)
    
    // APIリクエスト完了を待機
    cy.wait('@spinRoulette')
    cy.wait('@fetchRouletteText')
    
    // 6秒後にルーレット回転が完了することを確認
    cy.wait(6000)
    
    // ルーレットの回転が停止し、transitionがnoneになることを確認
    cy.get('[data-testid="roulette-wheel"]')
      .should('have.css', 'transition', 'none')
    
    // ボタンが再び有効化されることを確認
    cy.get('[data-testid="start-button"]').should('not.be.disabled')
  })
}) 