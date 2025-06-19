///// <reference types="cypress" />
//// ***********************************************
//// This example commands.ts shows you how to
//// create various custom commands and overwrite
//// existing commands.
////
//// For more comprehensive examples of custom
//// commands please read more here:
//// https://on.cypress.io/custom-commands
//// ***********************************************
////
////
//// -- This is a parent command --
//// Cypress.Commands.add('login', (email, password) => { ... })
////
////
//// -- This is a child command --
//// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
////
////
//// -- This is a dual command --
//// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
////
////
//// -- This will overwrite an existing command --
//// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
////
//// declare global {
////   namespace Cypress {
////     interface Chainable {
////       login(email: string, password: string): Chainable<void>
////       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
////       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
////       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
////     }
////   }
//// }

//// 環境変数のヘルパー関数
//const getEnvVar = (key: string, defaultValue?: string): string => {
//  const value = Cypress.env(key) || process.env[key] || defaultValue
//  if (!value && key.includes('PASSWORD') || key.includes('EMAIL')) {
//    cy.log(`警告: ${key} が設定されていません。cypress.env.json または環境変数を確認してください。`)
//  }
//  return value
//}

//// ルーレット回転テスト用のカスタムコマンド
//Cypress.Commands.add('spinRoulette', () => {
//  cy.get('[data-testid="start-button"]').click()
//  cy.on('window:confirm', () => true)
//})

//// 型定義を追加
//declare global {
//  namespace Cypress {
//    interface Chainable {
//      spinRoulette(): Chainable<void>
//    }
//  }
//}

//Cypress.Commands.add('waitForRouletteSpin', () => {
//  cy.wait(6000) // ルーレット回転時間を待機
//})

//Cypress.Commands.add('mockRouletteAPI', (tickets = 4) => {
//  cy.intercept('PATCH', '/api/roulette_texts/spin', {
//    statusCode: 200,
//    body: { tickets }
//  }).as('spinRoulette')
  
//  cy.intercept('GET', '/api/roulette_texts/*', {
//    statusCode: 200,
//    body: { text: 'テスト用ルーレットテキスト' }
//  }).as('fetchRouletteText')
  
//  cy.intercept('GET', '/api/tickets', {
//    statusCode: 200,
//    body: { tickets }
//  }).as('fetchTickets')
//})

//// Amplify認証関連のカスタムコマンド
//Cypress.Commands.add('loginIfNeeded', () => {
//  cy.get('body').then(($body) => {
//    if ($body.find('input[type="email"], input[name*="email"]').length > 0) {
//      cy.log('認証が必要です。ログインを実行します。')
      
//      const email = getEnvVar('PROD_EMAIL') || getEnvVar('TEST_EMAIL')
//      const password = getEnvVar('PROD_PASSWORD') || getEnvVar('TEST_PASSWORD')
      
//      if (!email || !password) {
//        cy.log('認証情報が設定されていません。')
//        cy.log('cypress.env.json ファイルに PROD_EMAIL と PROD_PASSWORD を設定してください。')
//        return
//      }
      
//      // より柔軟なセレクターで要素を探す
//      cy.get('input[type="email"], input[name*="email"], input[placeholder*="email"]').first().type(email)
//      cy.get('input[type="password"], input[name*="password"]').first().type(password)
      
//      // 送信ボタンを探してクリック
//      cy.get('button[type="submit"], input[type="submit"], button:contains("ログイン"), button:contains("Sign In"), button:contains("Login")').first().click()
      
//      cy.wait(5000)
//    } else {
//      cy.log('認証は不要です。')
//    }
//  })
//})

//// Amplify認証をバイパスするコマンド（セッション保存）
//Cypress.Commands.add('loginWithSession', () => {
//  const email = getEnvVar('PROD_EMAIL')
//  const password = getEnvVar('PROD_PASSWORD')
  
//  if (!email || !password) {
//    cy.log('認証情報が設定されていません。')
//    return
//  }
  
//  // セッションを保存して認証をバイパス
//  cy.session([email, password], () => {
//    cy.visit('https://plusoneup.net/dashboard')
    
//    // ログインフォームが表示されるまで待機
//    cy.get('input[type="email"], input[name*="email"], input[placeholder*="email"]', { timeout: 10000 }).first().type(email)
//    cy.get('input[type="password"], input[name*="password"]').first().type(password)
//    cy.get('button[type="submit"], input[type="submit"], button:contains("ログイン"), button:contains("Sign In"), button:contains("Login")').first().click()
    
//    // 認証完了まで待機（URLがログインページでなくなるまで）
//    cy.url().should('not.include', '/login', { timeout: 15000 })
//    cy.url().should('not.include', '/auth', { timeout: 15000 })
    
//    // ダッシュボードページに遷移したことを確認
//    cy.url().should('include', '/dashboard', { timeout: 15000 })
//  }, {
//    validate() {
//      // セッションが有効かチェック（より柔軟な条件）
//      cy.url().should('include', '/dashboard')
      
//      // ルーレット要素が存在するかチェック（タイムアウトを短く）
//      cy.get('body').then(($body) => {
//        if ($body.find('[data-testid="roulette-container"]').length > 0) {
//          cy.log('ルーレット要素が見つかりました')
//        } else {
//          cy.log('ルーレット要素が見つかりませんが、セッションは有効です')
//        }
//      })
//    },
//    cacheAcrossSpecs: true
//  })
//})

//Cypress.Commands.add('visitWithAuth', (url: string) => {
//  const baseUrl = getEnvVar('PRODUCTION_URL', 'http://localhost:4000')
//  cy.visit(`${baseUrl}${url}`)
//  cy.loginIfNeeded()
//})

//// Amplify認証付きでページにアクセス
//Cypress.Commands.add('visitWithAmplifyAuth', (url: string) => {
//  const baseUrl = getEnvVar('PRODUCTION_URL', 'http://localhost:4000')
  
//  // セッションを使用して認証をバイパス
//  cy.loginWithSession()
  
//  // 認証後にページにアクセス
//  cy.visit(`${baseUrl}${url}`)
//})

//// 環境変数の検証コマンド
//Cypress.Commands.add('validateEnvVars', () => {
//  const requiredVars = ['PRODUCTION_URL']
//  const optionalVars = ['PROD_EMAIL', 'PROD_PASSWORD', 'TEST_EMAIL', 'TEST_PASSWORD']
  
//  requiredVars.forEach(varName => {
//    const value = getEnvVar(varName)
//    if (!value) {
//      throw new Error(`必須の環境変数 ${varName} が設定されていません。`)
//    }
//  })
  
//  optionalVars.forEach(varName => {
//    const value = getEnvVar(varName)
//    if (!value) {
//      cy.log(`オプションの環境変数 ${varName} が設定されていません。`)
//    }
//  })
//})

//// Cognito 情報は環境変数から取得する
//const pool = {
//  client_id : getEnvVar('COGNITO_CLIENT_ID'),
//  domain    : getEnvVar('COGNITO_DOMAIN'),
//  region    : getEnvVar('COGNITO_REGION', 'ap-northeast-1'),
//}

//if (!pool.client_id || !pool.domain) {
//  // 明示的にエラーを出さずログだけにしておく（デバッグテストでは未設定でも良い場合があるため）
//  // テスト実行時に validateEnvVars でチェック可能
//  // eslint-disable-next-line no-console
//  console.warn('⚠️  COGNITO_CLIENT_ID または COGNITO_DOMAIN が設定されていません。プログラム的ログインは機能しません。')
//}

//Cypress.Commands.add('programmaticSignIn', () => {
//  cy.request({
//    url: `https://${pool.domain}/oauth2/token`,
//    method: 'POST',
//    form: true,
//    body: {
//      grant_type   : 'password',
//      client_id    : pool.client_id,
//      username     : Cypress.env('PROD_EMAIL'),
//      password     : Cypress.env('PROD_PASSWORD'),
//      scope        : 'aws.cognito.signin.user.admin+email+openid+profile',
//    },
//  }).then(({ body }) => {
//    // Amplify が期待する形式で localStorage に保存
//    const key = `CognitoIdentityServiceProvider.${pool.client_id}.${Cypress.env('PROD_EMAIL')}`
//    const expires = (Date.now() / 1000 + body.expires_in).toString()
//    localStorage.setItem(`${key}.idToken`,  body.id_token)
//    localStorage.setItem(`${key}.accessToken`, body.access_token)
//    localStorage.setItem(`${key}.refreshToken`, body.refresh_token)
//    localStorage.setItem(`${key}.clockDrift`,  '0')
//    localStorage.setItem(`amplify-authenticator-authState`, 'signedIn')
//  })
//})

//// Hosted UI を経由してログイン
//Cypress.Commands.add('loginViaHostedUI', () => {
//  const email = getEnvVar('PROD_EMAIL')
//  const password = getEnvVar('PROD_PASSWORD')
//  const domain = getEnvVar('COGNITO_DOMAIN')
//  const clientId = getEnvVar('COGNITO_CLIENT_ID')
//  const redirectUri = `${getEnvVar('PRODUCTION_URL')}/dashboard`

//  if (!email || !password || !domain || !clientId) {
//    throw new Error('Hosted UI ログインに必要な環境変数が不足しています')
//  }

//  cy.session([email], () => {
//    const authUrl = `https://${domain}/login?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
//    cy.visit(authUrl)

//    // 別オリジン操作
//    cy.origin(domain, { args: { email, password } }, ({ email, password }) => {
//      cy.get('input[type="email"]').type(email)
//      cy.get('input[type="password"]').type(password)
//      cy.get('button[type="submit"], button:contains("Sign in"), button:contains("ログイン")').click()
//    })

//    // リダイレクト先でダッシュボードに到達するまで待機
//    cy.url({ timeout: 30000 }).should('include', '/dashboard')
//  })
//})

//declare global {
//  namespace Cypress {
//    interface Chainable {
//      spinRoulette(): Chainable<void>
//      waitForRouletteSpin(): Chainable<void>
//      mockRouletteAPI(tickets?: number): Chainable<void>
//      loginIfNeeded(): Chainable<void>
//      loginWithSession(): Chainable<void>
//      visitWithAuth(url: string): Chainable<void>
//      visitWithAmplifyAuth(url: string): Chainable<void>
//      validateEnvVars(): Chainable<void>
//      programmaticSignIn(): Chainable<void>
//      loginViaHostedUI(): Chainable<void>
//    }
//  }
//}

//beforeEach(() => {
//  cy.validateEnvVars()
//  cy.loginViaHostedUI()
//  cy.visit('/dashboard')
//})