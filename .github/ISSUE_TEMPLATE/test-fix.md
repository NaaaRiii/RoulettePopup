# 失敗しているテストの修正

## 🐛 問題の概要
退会機能実装後に、既存テストが新しいHeader.jsの実装に適合しておらず、複数のテストが失敗している状況です。

## 📋 失敗しているテスト一覧

### Header.test.js (6/8 tests failing)
- `flex_header` クラスを持つ要素が存在すること
- route、user、signOut が正しく取得されていること  
- isLoggedIn の判定が正しく機能すること
- 使い方、お試し、ログイン リンクが表示されること
- ログイン状態の要素が表示されること
- ログアウトリンクをクリックした時に適切な処理が実行されること

### その他のテスト
- editRouletteText.test.js: act() warning
- dashboard.test.js: 複数のテスト失敗
- goalId.test.js: 複数のテスト失敗
- completed-goal.test.js: 複数のテスト失敗

## 🔍 根本原因
1. **Header.jsの構造変更**: 退会機能実装でクラス名や構造が変更された
2. **古いテスト実装**: 古いHeader実装に基づいたテストが残っている
3. **act() warnings**: React state更新のテスト包装不備
4. **認証状態モック**: 新しい認証フローに対応していないモック

## 🎯 修正方針

### 優先度1: Header関連テスト
- [ ] `flex_header` クラス → 新しいクラス構造に対応
- [ ] 認証状態テスト → useEffect の fetchWithAuth を考慮
- [ ] ログイン/ログアウト状態表示テスト更新
- [ ] 退会機能のテスト統合（既存の`Header.withdrawal.test.js`と整合性確保）

### 優先度2: その他テスト
- [ ] React Testing Library の act() warnings 修正
- [ ] ページコンポーネントのテスト更新
- [ ] モック設定の統一

## 📁 影響範囲
```
src/__tests__/
├── components/
│   ├── Header.test.js (要修正)
│   └── Header.withdrawal.test.js (正常動作)
├── pages/
│   ├── dashboard.test.js (要修正)
│   ├── editRouletteText.test.js (act警告修正)
│   ├── goalId.test.js (要修正)
│   └── completed-goal.test.js (要修正)
```

## ✅ 完了条件
- [ ] 全テストが正常に通る（`npm test`）
- [ ] act() warnings が解消される
- [ ] 既存機能の動作が保証される
- [ ] 退会機能テストとの整合性が取れる

## 🔧 作業見積もり
- Header.test.js修正: 2-3時間
- その他テスト修正: 3-4時間
- 総計: 5-7時間

## 📝 関連Issue
- #9 退会機能（論理削除）の実装

## 📋 チェックリスト
- [ ] 失敗テストの詳細分析
- [ ] Header.test.js の完全な書き換え
- [ ] act() warnings の修正
- [ ] 全テスト実行での確認
- [ ] CI/CDパイプラインでの動作確認