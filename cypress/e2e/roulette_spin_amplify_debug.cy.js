describe('Amplify認証デバッグ', () => {
  it('Amplify認証の詳細デバッグ', () => {
    // 本番URLにアクセス
    cy.visit('https://plusoneup.net/dashboard')
    
    // ページのタイトルとURLを確認
    cy.title().then((title) => {
      cy.log(`ページタイトル: ${title}`)
    })
    
    cy.url().then((url) => {
      cy.log(`現在のURL: ${url}`)
    })
    
    // ページ全体のHTMLを確認
    cy.get('body').then(($body) => {
      cy.log('ページのHTML構造（最初の2000文字）:')
      cy.log($body.html().substring(0, 2000))
    })
    
    // Amplify関連の要素を確認
    cy.get('body').then(($body) => {
      // ログインフォームの要素を確認
      const loginForm = $body.find('form, [data-testid*="login"], [data-testid*="auth"]')
      if (loginForm.length > 0) {
        cy.log(`ログインフォーム要素が見つかりました: ${loginForm.length}個`)
        loginForm.each((index, element) => {
          cy.log(`フォーム ${index + 1}: ${element.outerHTML}`)
        })
      }
      
      // メールアドレス入力フィールドを確認
      const emailInputs = $body.find('input[type="email"], input[name*="email"], input[placeholder*="email"]')
      if (emailInputs.length > 0) {
        cy.log(`メールアドレス入力フィールドが見つかりました: ${emailInputs.length}個`)
        emailInputs.each((index, element) => {
          cy.log(`メール入力 ${index + 1}: ${element.outerHTML}`)
        })
      }
      
      // パスワード入力フィールドを確認
      const passwordInputs = $body.find('input[type="password"], input[name*="password"]')
      if (passwordInputs.length > 0) {
        cy.log(`パスワード入力フィールドが見つかりました: ${passwordInputs.length}個`)
        passwordInputs.each((index, element) => {
          cy.log(`パスワード入力 ${index + 1}: ${element.outerHTML}`)
        })
      }
      
      // 送信ボタンを確認
      const submitButtons = $body.find('button[type="submit"], input[type="submit"], button:contains("ログイン"), button:contains("Sign In")')
      if (submitButtons.length > 0) {
        cy.log(`送信ボタンが見つかりました: ${submitButtons.length}個`)
        submitButtons.each((index, element) => {
          cy.log(`送信ボタン ${index + 1}: ${element.outerHTML}`)
        })
      }
      
      // ルーレット要素を確認
      const rouletteElements = $body.find('[data-testid="roulette-container"], [data-testid="start-button"]')
      if (rouletteElements.length > 0) {
        cy.log(`ルーレット要素が見つかりました: ${rouletteElements.length}個`)
      } else {
        cy.log('ルーレット要素が見つかりません')
      }
    })
    
    // スクリーンショットを撮影
    cy.screenshot('amplify-auth-debug')
    
    // 5秒待機してページの読み込みを確認
    cy.wait(5000)
    
    // 再度URLを確認（リダイレクトが発生したかチェック）
    cy.url().then((url) => {
      cy.log(`5秒後のURL: ${url}`)
    })
  })

  it('Amplify認証の手動テスト', () => {
    cy.visit('https://plusoneup.net/dashboard')
    
    // ログインフォームが表示されるまで待機
    cy.get('body').then(($body) => {
      if ($body.find('input[type="email"], input[name*="email"]').length > 0) {
        cy.log('ログインフォームが検出されました。認証を試行します。')
        
        // より柔軟なセレクターで要素を探す
        cy.get('input[type="email"], input[name*="email"], input[placeholder*="email"]').first().type('axenarikilo48698062@gmail.com')
        cy.get('input[type="password"], input[name*="password"]').first().type('Nari11235!')
        
        // 送信ボタンを探してクリック
        cy.get('button[type="submit"], input[type="submit"], button:contains("ログイン"), button:contains("Sign In"), button:contains("Login")').first().click()
        
        // 認証後のページ遷移を待機
        cy.wait(10000)
        
        // 認証後のURLを確認
        cy.url().then((url) => {
          cy.log(`認証後のURL: ${url}`)
        })
        
        // ルーレット要素が表示されるか確認
        cy.get('body').then(($body) => {
          if ($body.find('[data-testid="roulette-container"]').length > 0) {
            cy.log('認証成功！ルーレット要素が見つかりました。')
          } else {
            cy.log('認証後もルーレット要素が見つかりません。')
            cy.screenshot('post-auth-debug')
          }
        })
      } else {
        cy.log('ログインフォームが見つかりません。')
      }
    })
  })
}) 