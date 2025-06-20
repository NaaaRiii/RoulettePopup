# Plus ONE 詳細画面遷移図

## ユーザーフロー図

```mermaid
graph TD
    Start([ユーザーアクセス]) --> Home[ホーム画面]
    Home --> Login[ログイン画面]
    Home --> Signup[サインアップ画面]
    
    Login --> Auth{認証チェック}
    Signup --> Auth
    
    Auth -->|成功| Dashboard[ダッシュボード]
    Auth -->|失敗| Login
    
    Dashboard --> GoalList[目標一覧表示]
    Dashboard --> Roulette[ルーレット機能]
    Dashboard --> Stats[統計表示]
    
    GoalList --> GoalDetail[目標詳細]
    GoalDetail --> TaskComplete[タスク完了]
    TaskComplete --> ExpGain[経験値獲得]
    ExpGain --> LevelUp{レベルアップ?}
    
    LevelUp -->|Yes| RouletteTrigger[ルーレット起動]
    LevelUp -->|No| Dashboard
    
    RouletteTrigger --> RouletteSpin[ルーレット回転]
    RouletteSpin --> Reward[報酬獲得]
    Reward --> Dashboard
    
    Roulette --> RouletteEdit[ルーレット編集]
    RouletteEdit --> Dashboard
    
    Stats --> Dashboard
    
    %% スタイル定義
    classDef start fill:#e8f5e8,stroke:#4caf50,stroke-width:3px
    classDef page fill:#e3f2fd,stroke:#2196f3,stroke-width:2px
    classDef modal fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    classDef decision fill:#fce4ec,stroke:#e91e63,stroke-width:2px
    classDef action fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
    
    class Start start
    class Home,Login,Signup,Dashboard,GoalList,GoalDetail,RouletteEdit,Stats page
    class RouletteTrigger,RouletteSpin,Reward modal
    class Auth,LevelUp decision
    class TaskComplete,ExpGain action
```

## データフロー図

```mermaid
flowchart LR
    subgraph "フロントエンド"
        UI[ユーザーインターフェース]
        State[状態管理]
        Router[ルーティング]
    end
    
    subgraph "認証"
        Auth[Amplify Auth]
        Token[認証トークン]
    end
    
    subgraph "API"
        API[API Gateway]
        Lambda[Lambda Functions]
    end
    
    subgraph "データベース"
        DB[(DynamoDB)]
        Goals[目標データ]
        Users[ユーザーデータ]
        Roulette[ルーレットデータ]
    end
    
    UI --> Router
    Router --> State
    State --> Auth
    Auth --> Token
    Token --> API
    API --> Lambda
    Lambda --> DB
    DB --> Goals
    DB --> Users
    DB --> Roulette
    
    Goals --> Lambda
    Users --> Lambda
    Roulette --> Lambda
    Lambda --> API
    API --> State
    State --> UI
```

## コンポーネント関係図

```mermaid
graph TB
    subgraph "ページコンポーネント"
        Index[Home/index.js]
        Dashboard[Dashboard/dashboard.js]
        GoalDetail[GoalDetail/goals/[goalId].js]
        Login[Auth/login.js]
    end
    
    subgraph "共通コンポーネント"
        Layout[Layout.js]
        Header[Header.js]
        Footer[Footer.js]
        Modal[Modal.js]
    end
    
    subgraph "機能コンポーネント"
        Calendar[Calendar.js]
        Chart[ExpLineChart.js]
        Roulette[RoulettePopup.js]
    end
    
    subgraph "編集コンポーネント"
        EditGoal[EditGoal.js]
        CreateGoal[CreateGoal.js]
        EditSmallGoal[EditSmallGoal.js]
    end
    
    subgraph "コンテキスト"
        GoalsContext[GoalsContext.js]
        TicketsContext[TicketsContext.js]
    end
    
    Index --> Layout
    Dashboard --> Layout
    GoalDetail --> Layout
    Login --> Layout
    
    Layout --> Header
    Layout --> Footer
    
    Dashboard --> Calendar
    Dashboard --> Chart
    Dashboard --> Roulette
    Dashboard --> EditGoal
    Dashboard --> CreateGoal
    
    GoalDetail --> EditGoal
    GoalDetail --> EditSmallGoal
    
    Dashboard --> GoalsContext
    Dashboard --> TicketsContext
    GoalDetail --> GoalsContext
    Roulette --> TicketsContext
    
    EditGoal --> Modal
    CreateGoal --> Modal
    EditSmallGoal --> Modal
    Roulette --> Modal
```

## エラーハンドリングフロー

```mermaid
graph TD
    Request[APIリクエスト] --> CheckAuth{認証チェック}
    
    CheckAuth -->|失敗| AuthError[認証エラー]
    AuthError --> RedirectLogin[ログイン画面へリダイレクト]
    
    CheckAuth -->|成功| APIRequest[API呼び出し]
    APIRequest --> Response{レスポンス}
    
    Response -->|成功| Success[成功処理]
    Response -->|失敗| Error[エラー処理]
    
    Error --> ErrorType{エラータイプ}
    ErrorType -->|ネットワークエラー| NetworkError[ネットワークエラー表示]
    ErrorType -->|サーバーエラー| ServerError[サーバーエラー表示]
    ErrorType -->|データエラー| DataError[データエラー表示]
    
    NetworkError --> Retry{リトライ?}
    ServerError --> Retry
    DataError --> Retry
    
    Retry -->|Yes| APIRequest
    Retry -->|No| Fallback[フォールバック処理]
    
    Success --> UpdateUI[UI更新]
    Fallback --> UpdateUI
    
    %% スタイル
    classDef process fill:#e3f2fd,stroke:#2196f3
    classDef decision fill:#fff3e0,stroke:#ff9800
    classDef error fill:#ffebee,stroke:#f44336
    classDef success fill:#e8f5e8,stroke:#4caf50
    
    class Request,APIRequest,Success,UpdateUI process
    class CheckAuth,Response,ErrorType,Retry decision
    class AuthError,Error,NetworkError,ServerError,DataError error
    class RedirectLogin,Fallback success
``` 