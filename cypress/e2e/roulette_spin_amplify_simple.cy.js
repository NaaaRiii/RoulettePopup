describe('Amplify Hosted-UI 経由でダッシュボードに到達し、ルーレットを回す', () => {
  /** ❶ 共通ログイン処理（＝別オリジン）をセッションに切り出す */
  const loginByHostedUI = () => {
    const email    = Cypress.env('PROD_EMAIL')
    const password = Cypress.env('PROD_PASSWORD')

    if (!email || !password) throw new Error('PROD_EMAIL / PROD_PASSWORD が未設定')

    /* plusoneup.net にアクセス → 302 で Cognito へリダイレクトさせる */
    cy.request({
      url               : 'https://plusoneup.net/dashboard',
      followRedirect    : false,
      failOnStatusCode  : false       // 302 を握り潰す
    }).then(res => {
      const redirectUrl = res.headers['location'];
      expect(redirectUrl).to.match(/^https:\/\/plusoneup\.auth/);

      /** ❷ ↑で得た Hosted-UI の URL を cy.origin で開きフォーム入力 */
      cy.origin('https://plusoneup.auth.ap-northeast-1.amazoncognito.com',
        { args: { redirectUrl, email, password } },
        ({ redirectUrl, email, password }) => {
          cy.visit(redirectUrl, { failOnStatusCode: false })

          cy.get('input[type="email"]',     { timeout: 10_000 }).type(email)
          cy.get('input[type="password"]').type(password)
          cy.get('button[type="submit"]').click()

          /* Cognito 側で認証が通ると、元の redirect_uri に戻る */
        }
      )
    })

    /* ❸ クッキーがセットされた状態で plusoneup に戻る */
    cy.visit('https://plusoneup.net/dashboard', { timeout: 20_000 })
    cy.location('pathname').should('eq', '/dashboard')
  }

  /* ❹ 一回ログインしたら以降の it でセッションを再利用 */
  Cypress.Commands.add('loginOnce', () => {
    cy.session('prod-user', loginByHostedUI)
  })

  beforeEach(() => {
    cy.validateEnvVars()
    cy.loginOnce()   // ★
  })

  /* ---------------- テスト本体 ---------------- */
  it('ルーレットを回せる', () => {
    cy.get('[data-testid="roulette-container"]', { timeout: 20_000 }).should('be.visible')
    cy.get('[data-testid="start-button"]').should('not.be.disabled').click()

    cy.on('window:confirm', () => true)      // 「回しますか？」を OK

    cy.get('[data-testid="start-button"]').should('be.disabled')
    cy.get('[data-testid="roulette-wheel"]')
      .should('have.css', 'transition')
      .and('include', 'transform')

    cy.wait(6_000)

    cy.get('[role="dialog"]', { timeout: 20_000 }).should('be.visible')
    cy.get('[data-testid="close-modal-button"]').click()
    cy.get('[role="dialog"]').should('not.exist')
    cy.get('[data-testid="start-button"]').should('not.be.disabled')
  })
})