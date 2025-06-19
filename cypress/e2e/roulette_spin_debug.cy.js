describe('デバッグ: ページ状態確認', () => {
  it('現在のページの状態を確認', () => {
    // ダッシュボードページにアクセス
    cy.visit('/dashboard')
    
    // ページのタイトルを確認
    cy.title().then((title) => {
      cy.log(`ページタイトル: ${title}`)
    })
    
    // 現在のURLを確認
    cy.url().then((url) => {
      cy.log(`現在のURL: ${url}`)
    })
    
    // ページ全体のHTMLを確認
    cy.get('body').then(($body) => {
      cy.log('ページのHTML構造:')
      cy.log($body.html().substring(0, 1000)) // 最初の1000文字をログ出力
    })
    
    // 認証関連の要素を確認
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login"]').length > 0) {
        cy.log('ログインフォームが表示されています')
      }
      if ($body.find('[data-testid="start-button"]').length > 0) {
        cy.log('ルーレットボタンが見つかりました')
      } else {
        cy.log('ルーレットボタンが見つかりません')
      }
    })
    
    // スクリーンショットを撮影
    cy.screenshot('debug-page-state')
  })

  it('認証が必要な場合の処理', () => {
    cy.visit('/dashboard')
    
    // ログインフォームが表示されているかチェック
    cy.get('body').then(($body) => {
      if ($body.find('input[type="email"], input[name="email"]').length > 0) {
        cy.log('ログインフォームが検出されました')
        
        // ログイン情報を入力（環境変数から取得）
        const email = Cypress.env('TEST_EMAIL') || 'test@example.com'
        const password = Cypress.env('TEST_PASSWORD') || 'testpassword'
        
        cy.get('input[type="email"], input[name="email"]').type(email)
        cy.get('input[type="password"], input[name="password"]').type(password)
        cy.get('button[type="submit"], input[type="submit"]').click()
        
        // ログイン後のページ遷移を待機
        cy.wait(3000)
        
        // 再度ルーレットボタンを確認
        cy.get('[data-testid="start-button"]').should('be.visible')
      } else {
        cy.log('ログインフォームが見つかりません')
      }
    })
  })
}) 