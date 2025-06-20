const mockUser = {
  id: 1,
  name: 'TestUser',
  rank: 15,
  last_roulette_rank: 0,
  totalExp: 1000,
  latestCompletedGoals: []
};

const BASE  = 'https://plusoneup.net';
const DASH  = `${BASE}/dashboard`;

const currentUserRoute = /^https?:\/\/(?:www\.)?plusoneup\.net\/api\/current_user\/?(?:\?.*)?$/;


describe('Amplify Hosted-UI 経由でダッシュボードに到達し、ルーレットを回す', () => {
  /** ❶ 共通ログイン処理（＝別オリジン）をセッションに切り出す */
  const loginByHostedUI = () => {
    const email    = Cypress.env('PROD_EMAIL');
    const password = Cypress.env('PROD_PASSWORD');

    //cy.intercept('GET', '**/api/current_user', mockUser).as('getUserInitial');

    if (!email || !password) throw new Error('PROD_EMAIL / PROD_PASSWORD が未設定')

    /* plusoneup.net にアクセス → 302 で Cognito へリダイレクトさせる */
    cy.request({
      url               : 'https://plusoneup.net/dashboard',
      followRedirect    : false,
      failOnStatusCode  : false       // 302 を握り潰す
    }).then(res => {
      let redirectUrl = res.headers['location'];

      // 本番環境が 302 を返さない場合は手動で Hosted-UI URL を組み立てる
      if (!redirectUrl) {
        const clientId = Cypress.env('COGNITO_CLIENT_ID');
        const domain   = Cypress.env('COGNITO_DOMAIN');
        const redirect = encodeURIComponent('https://plusoneup.net/dashboard');
        redirectUrl = `https://${domain}/login?response_type=code&client_id=${clientId}&redirect_uri=${redirect}`;
      }

      expect(redirectUrl).to.match(/^https:\/\/[^/]+\.auth\./);

      /** ❷ ↑で得た Hosted-UI の URL を cy.origin で開きフォーム入力 */
      const { origin } = new URL(redirectUrl);

      cy.origin(
        origin,
        { args: { redirectUrl, email, password } },
        ({ redirectUrl: url, email, password }) => {
          cy.visit(url, { failOnStatusCode: false })

          // Hosted-UI のバージョンにより、ユーザ名入力欄の属性が異なる場合があるため柔軟に取得する
          const usernameSelector = [
            'input[type="email"]',          // type=email
            'input[name="username"]',       // Cognito デフォルト name
            'input#signInFormUsername',      // id 指定
            'input[type="text"]'            // fallback
          ].join(', ');

          cy.get('body').then($body => {
            if ($body.find(usernameSelector).length) {
              // --- ユーザ名入力 ---
              cy.get(usernameSelector).first().type(email, { log: false })

              // 「次へ」などをクリックしてパスワード入力へ
              cy.get('button[type="submit"], button#next_button, button:contains("Next"), button:contains("次へ")')
                .first()
                .click();

              const passwordSelector = [
                'input[type="password"]',
                'input#signInFormPassword'
              ].join(', ');

              cy.get(passwordSelector, { timeout: 30_000 })
                .first()
                .type(password, { log: false });

              cy.get('button[type="submit"], button#signInFormSubmitButton, button:contains("Sign in"), button:contains("サインイン")')
                .first()
                .click();
            }
          })
          /* Cognito 認証成功後、元の redirect_uri に戻る */
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
    /* 1) current_user と tickets を必ず先にモック */
    cy.intercept('GET', '**/api/current_user*', mockUser)
    cy.intercept('GET', '**/api/roulette_texts/tickets*',
                 { tickets: 5 }).as('getTickets')

    /* 2) セッション復元 → ダッシュボード表示 */
    cy.loginOnce()
    cy.visit(`${BASE}/dashboard?bust=${Date.now()}`)
    // tickets API は非同期で遅れる場合があるため待たない

    /* 3) 直接 ルーレットページへ */
    cy.visit(`${BASE}/edit-roulette-text?bust=${Date.now()}`)
  })

  /* ---------------- テスト本体 ---------------- */
  it('ごほうびルーレットでチケットを 1 枚消費して回せる', () => {
    cy.get('[data-testid="roulette-container"]', { timeout: 40_000 })
      .should('be.visible')

    cy.intercept('PATCH', '**/api/roulette_texts/spin', { tickets: 4 })
      .as('spin')

    cy.get('[data-testid="start-button"]', { timeout: 40_000 }).click()
    cy.on('window:confirm', () => true)
    cy.wait('@spin')

    cy.get('[data-testid="start-button"]').should('be.disabled')

    // アニメーション終了を待機（6秒間）
    cy.wait(6_000)

    /* ---------- 結果モーダル確認 & 閉じる ---------- */
    cy.get('[role="dialog"]', { timeout: 20_000 }).should('be.visible')
    cy.get('[data-testid="close-modal-button"]').click()
    cy.get('[role="dialog"]').should('not.exist')

    /* ---------- チケットが1枚減っていることを確認 ---------- */
    cy.contains('残りチケット').parent().should('contain', '4')  // UI に合わせて要修正
  })
})