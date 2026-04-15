# Git Development Rules

本プロジェクトでは **Issueドリブン開発 + シンプルなGit Flow** を採用する。

---

# 1. Development Flow（Issueドリブン開発）

すべての作業は **Issue を起点に開始する。**

## フロー

1. Issue を作成
2. 必要に応じて Sub Issue を作成
3. 自分を Assignee に設定
4. 作業開始時に `In Progress` に変更
5. Issue から **main ブランチをベースにブランチ作成**
6. ローカルで checkout して作業
7. main に対して Pull Request を作成
8. レビュー後に main に merge

```
Issue作成
↓
Assignee設定
↓
In Progress
↓
main からブランチ作成
↓
ローカルで作業
↓
mainへPR
↓
merge
```

---

# 2. Git Flow

本プロジェクトでは **シンプルな Git Flow** を採用する。

## 基本ブランチ

```
main : 本番 / 最新安定コード
```

### ルール

- **すべての作業ブランチは main から作成**
- 作業完了後 **main に Pull Request を作成**
- レビュー後 main に merge

---

# 3. Branch Naming Rules（ブランチ命名規則）

```
<prefix>/<issue-number>-<description>
```

例

```
feat/18-add-login-api
fix/28-auth-error
refactor/35-clean-user-service
docs/40-update-readme
```

---

# 4. Commit Message Rules

フォーマット

```
<prefix>: <message>
```

例（英語）

```
feat: add login api
fix: auth middleware bug
refactor: clean user service
docs: update readme
```

例（日本語）

```
feat: ログインAPIを追加
fix: 認証ミドルウェアのバグを修正
refactor: ユーザーサービスを整理
docs: READMEを更新
```

---

## 作業途中コミット

作業途中の場合は `wip` を使用

```
feat: (wip) implement login api
feat: (wip) ログインAPIを実装中
```

---

## Issue番号を含める場合

```
fix: (#28) auth middleware bug
feat: (#18) add login api
fix: (#28) 認証ミドルウェアのバグを修正
feat: (#18) ログインAPIを追加
```

Issue番号の記載は任意。

---

# 5. Issue Title Rules（Issue タイトル規則）

Issue のタイトルは **日本語、または分かりやすい英語** で記載する。

- 何をするのか・何が問題なのかが一目で分かるように書く
- 曖昧なタイトル（例: `fix bug`、`作業`）は避ける

例

```
ログインAPIを実装する
認証ミドルウェアでエラーが発生する
ユーザー一覧画面のレイアウトを修正する
Add login API
Fix auth middleware error
```

---

# 6. Pull Request

## 基本ルール

- **main に対して作成**
- レビュー後に merge

## PR タイトル

**日本語、または分かりやすい英語** で記載する。対応する Issue の内容が伝わるタイトルにする。

例

```
ログインAPIを追加
認証ミドルウェアのバグを修正
Add login API
Fix auth middleware error
```

## 関連 Issue の紐付け（必須）

PR の本文に以下のキーワードを記載することで、merge 時に Issue が自動でクローズされる。

```
Closes #<issue番号>
```

例

```
Closes #18
Closes #28
```

複数 Issue に対応する場合

```
Closes #18
Closes #35
```

---

# 6. Summary

開発ルールまとめ

- Issueドリブン開発
- main ベースのブランチ運用
- Issue番号付きブランチ
- prefix付きコミットメッセージ
- PRでレビューしてからmainへmerge
