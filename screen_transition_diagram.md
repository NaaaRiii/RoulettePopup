# Plus ONE アプリケーション 画面遷移図

## 画面遷移図

```mermaid
graph TD
    A[ホーム画面<br/>index.js] --> B[ログイン画面<br/>login.js]
    A --> C[サインアップ画面<br/>Amplify Authenticator]
    
    B --> D[ダッシュボード<br/>dashboard.js]
    C --> D
    
    D --> E[目標詳細画面<br/>goals/[goalId].js]
    D --> F[達成済み目標一覧<br/>completed-goal.js]
    D --> G[ルーレットテキスト編集<br/>edit-roulette-text.js]
    D --> H[ルーレットポップアップ<br/>RoulettePopup.js]
    
    E --> I[目標編集モーダル<br/>EditGoal.js]
    E --> J[小目標作成モーダル<br/>CreateSmallGoal.js]
    E --> K[小目標編集モーダル<br/>EditSmallGoal.js]
    E --> L[ユーザー名編集モーダル<br/>EditUserNameModal.js]
    
    D --> I
    D --> L
    
    H --> D
    
    I --> E
    J --> E
    K --> E
    L --> D
    
    E --> D
    F --> E
    G --> D
    
    %% 認証フロー
    B --> M[認証失敗]
    M --> B
    
    %% エラーハンドリング
    D --> N[認証エラー]
    N --> B
    
    E --> O[データ取得エラー]
    O --> D
    
    %% スタイル定義
    classDef mainPage fill:#e1f5fe
    classDef modal fill:#fff3e0
    classDef authPage fill:#f3e5f5
    classDef errorPage fill:#ffebee
    
    class A,D,E,F,G mainPage
    class I,J,K,L,H modal
    class B,C authPage
    class M,N,O errorPage
```

## 主要画面の説明

### 1. ホーム画面 (`index.js`)
- アプリケーションのエントリーポイント
- サインアップとログインボタンを提供
- 認証されていないユーザーの最初の画面

### 2. ログイン画面 (`login.js`)
- AWS Amplify Authenticatorを使用
- ログイン成功時は自動的にダッシュボードに遷移

### 3. ダッシュボード (`dashboard.js`)
- メインのアプリケーション画面
- ユーザーの目標一覧表示
- 経験値チャートとカレンダー表示
- 各種モーダルの起動点

### 4. 目標詳細画面 (`goals/[goalId].js`)
- 個別の目標とその小目標の詳細表示
- タスクの完了/未完了切り替え
- 目標の編集・削除機能

### 5. 達成済み目標一覧 (`completed-goal.js`)
- 完了した目標のみを表示
- 各目標の達成日を表示

### 6. ルーレットテキスト編集 (`edit-roulette-text.js`)
- ルーレットの報酬テキストを編集
- チケット残数表示

### 7. ルーレットポップアップ (`RoulettePopup.js`)
- チケットを消費してルーレットを回転
- 結果表示モーダル

## モーダル画面

### 編集系モーダル
- **目標編集**: 目標のタイトルや詳細を編集
- **小目標作成**: 新しい小目標を追加
- **小目標編集**: 既存の小目標を編集
- **ユーザー名編集**: ユーザー名を変更

## 認証フロー

1. 未認証ユーザーはホーム画面から開始
2. ログイン/サインアップで認証
3. 認証成功時はダッシュボードに自動遷移
4. 認証失敗時はログイン画面に戻る

## データフロー

- 各画面でAPI呼び出しによるデータ取得
- 認証トークンを使用したAPI通信
- エラー時は適切な画面にリダイレクト

## 主要機能

1. **目標管理**: 目標の作成・編集・削除・完了
2. **小目標管理**: 目標内の小目標とタスク管理
3. **経験値システム**: レベルアップとランク表示
4. **ルーレットシステム**: チケット消費による報酬獲得
5. **カレンダー表示**: 目標の進捗を日付別に表示
6. **統計表示**: 経験値の推移をグラフで表示
