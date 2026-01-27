# muku

Next.js製の業務アプリケーションプラットフォーム。ノーコード/ローコードで業務アプリを構築できるWebサービス。

## 技術スタック

- **フレームワーク**: Next.js 16.0.0 (App Router with Turbopack)
- **データベース**: Neon (PostgreSQL) + Prisma
- **認証**: NextAuth.js v5 (Credentials Provider)
- **UI**: shadcn/ui + Tailwind CSS
- **テスト**: Jest with next/jest
- **コードエディタ**: Monaco Editor（カスタマイズ機能用）
- **デプロイ**: Vercel

## 必須ルール: 許可が必要な操作

以下の操作は**必ずユーザーの明示的な許可を得てから**実行すること:

### Git操作

- `git commit` / `git push` / `git reset` / `git rebase` / `git merge`

### GitHub操作

- `gh pr create` / `gh pr merge` / `gh issue create`

### 破壊的コマンド

- `rm -rf` / `npm install` / `npx` / データベースマイグレーション

### 推奨フロー

1. コード変更を実装
2. ビルド・テストで動作確認
3. 変更内容をユーザーに報告
4. **許可を得てから**コミット・プッシュ

詳細は `.docs/development/git-workflow.md` を参照。

## クイックリファレンス

### よく使うコマンド

```bash
npm run dev              # 開発サーバー起動
npm test                 # テスト実行
npm run test:coverage    # カバレッジ付きテスト
npm run build            # プロダクションビルド
npm run lint             # ESLintチェック
```

### 環境変数

主要な環境変数（詳細は `.env.local.example` 参照）:

- `DATABASE_URL`: Neon PostgreSQL接続文字列
- `NEXTAUTH_SECRET`: NextAuth用シークレット
- `NEXTAUTH_URL`: アプリケーションURL

## ドキュメント参照ガイド

詳細なドキュメントは `.docs/` 配下に配置。作業内容に応じて参照すること。

| 作業内容               | 参照ドキュメント                                                           |
| ---------------------- | -------------------------------------------------------------------------- |
| 新機能の実装           | `.docs/architecture/overview.md`, `.docs/development/coding-rules.md`      |
| ディレクトリ構成の確認 | `.docs/architecture/directory-structure.md`                                |
| Item/Folder/Table関連  | `.docs/architecture/item-model.md`                                         |
| DBスキーマ変更         | `.docs/architecture/database.md`                                           |
| テスト作成             | `.docs/development/testing.md`                                             |
| コミット・PR作成       | `.docs/development/git-workflow.md`, `.docs/development/issue-pr-guide.md` |
| 機能仕様の確認         | `.docs/features/` 配下の該当ファイル                                       |
| 要件・ロードマップ確認 | `.docs/planning/requirements.md`, `.docs/planning/roadmap.md`              |
| タスク確認・進捗管理   | `.docs/planning/todo.md`                                                   |

## ドキュメント一覧

```text
.docs/
├── README.md                    # ドキュメント全体のインデックス
├── architecture/
│   ├── overview.md              # Server-First Architecture
│   ├── directory-structure.md   # ディレクトリ構成
│   ├── item-model.md            # Itemモデルアーキテクチャ
│   └── database.md              # データベース設計
├── development/
│   ├── coding-rules.md          # コーディング規約
│   ├── testing.md               # テスト方針
│   ├── git-workflow.md          # Git操作ルール
│   └── issue-pr-guide.md        # Issue/PR作成ガイドライン
├── features/
│   ├── authentication.md        # 認証機能
│   ├── groups.md                # グループ管理
│   ├── users.md                 # ユーザー管理
│   ├── items.md                 # Item管理
│   ├── tables.md                # テーブル管理
│   ├── columns.md               # カラム（フィールド）管理
│   └── records.md               # レコード管理
└── planning/
    ├── requirements.md          # 機能要件
    ├── roadmap.md               # 実装ロードマップ
    ├── todo.md                  # 実装TODO
    └── references.md            # 参考資料
```
