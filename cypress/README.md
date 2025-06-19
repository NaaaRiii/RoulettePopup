# Cypress E2Eテスト

このディレクトリには、ルーレットアプリケーションのE2Eテストが含まれています。

## テストファイル

- `roulette_spin.cy.js` - 詳細なルーレット回転テスト
- `roulette_spin_simple.cy.js` - カスタムコマンドを使用した簡潔なテスト
- `roulette_spin_debug.cy.js` - デバッグ用テスト
- `roulette_spin_production.cy.js` - 本番環境用テスト

## 環境変数の設定

### 1. 環境変数ファイルの作成

```bash
# cypress.env.example.json をコピーして cypress.env.json を作成
cp cypress.env.example.json cypress.env.json
```

### 2. cypress.env.json の編集


### 3. セキュリティ注意事項

- `cypress.env.json` は `.gitignore` に含まれているため、Gitにコミットされません
- 機密情報（パスワードなど）は必ず `cypress.env.json` で管理してください
- チーム開発の場合は、`cypress.env.example.json` を更新して共有してください

## 実行方法

### 開発環境でのテスト

```bash
# 開発サーバーを起動
npm run dev

# 別ターミナルでCypressを開く
npm run cypress:open

# または、ヘッドレスモードでテストを実行
npm run test:e2e
```

### 本番環境でのテスト

```bash
# 環境変数ファイルを設定後、テストを実行
npm run test:e2e:prod
```

### デバッグテスト

```bash
# デバッグ用テストを実行
npm run test:e2e:debug
```

## 環境変数

| 変数名 | 説明 | 必須 | デフォルト値 |
|--------|------|------|-------------|
| `PRODUCTION_URL` | 本番環境のURL | ✅ | `http://localhost:4000` |
| `PROD_EMAIL` | 本番環境のログイン用メールアドレス | ❌ | - |
| `PROD_PASSWORD` | 本番環境のログイン用パスワード | ❌ | - |
| `TEST_EMAIL` | テスト用メールアドレス | ❌ | - |
| `TEST_PASSWORD` | テスト用パスワード | ❌ | - |
| `MOCK_API` | APIモックの有効/無効 | ❌ | `true` |

## カスタムコマンド

### `cy.spinRoulette()`
ルーレットを回す（確認ダイアログでOKを選択）

### `cy.waitForRouletteSpin()`
ルーレット回転完了を待機（6秒）

### `cy.mockRouletteAPI(tickets)`
APIリクエストをモック（デフォルト: 4枚のチケット）

### `cy.loginIfNeeded()`
必要に応じてログインを実行

### `cy.visitWithAuth(url)`
認証付きでページにアクセス

### `cy.validateEnvVars()`
環境変数の設定を検証

## トラブルシューティング

### 認証エラー

1. `cypress.env.json` ファイルが正しく設定されているか確認
2. ログイン情報が正しいか確認
3. 本番環境のURLが正しいか確認

### 要素が見つからない

1. ページが正常に読み込まれているか確認
2. `data-testid`属性が正しく設定されているか確認
3. 認証が必要な場合は、ログインが完了しているか確認

### APIエラー

1. ネットワーク接続を確認
2. APIエンドポイントが正しいか確認
3. 認証トークンが有効か確認

### 環境変数エラー

1. `cypress.env.json` ファイルが存在するか確認
2. 必須の環境変数が設定されているか確認
3. JSONの構文が正しいか確認

## 注意事項

- 本番環境でのテストは、実際のデータに影響を与える可能性があります
- テスト用の専用アカウントを使用することを推奨します
- 機密情報（パスワードなど）は `cypress.env.json` で管理し、リポジトリにコミットしないでください
- `cypress.env.json` は `.gitignore` に含まれているため、手動で作成する必要があります