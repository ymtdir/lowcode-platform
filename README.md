# Lowcode Platform

![CI](https://github.com/ymtdir/lowcode-platform/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/ymtdir/lowcode-platform/graph/badge.svg?token=B0Z8GTSYQK)](https://codecov.io/gh/ymtdir/lowcode-platform)

Next.js製の業務アプリケーションプラットフォーム

## 概要

ノーコード/ローコードで業務アプリを構築できるWebサービス。
直感的な操作でテーブルを自在に作成し、様々な業務情報を管理できます。

## 技術スタック

- **フロントエンド・バックエンド**: Next.js 16 (App Router)
- **データベース**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **認証**: Supabase Auth
- **UI**: shadcn/ui + Tailwind CSS
- **テスト**: Jest
- **CI/CD**: GitHub Actions + Codecov

## 開発環境のセットアップ

### 必要な環境

- Node.js 20+
- npm

### インストール

```bash
# 依存関係のインストール
npm install

# Prisma Clientの生成
npx prisma generate
```

### 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database（Prisma）
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)でアプリケーションが起動します。

## スクリプト

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# Lintチェック
npm run lint

# コードフォーマット
npm run format

# テスト実行
npm test

# カバレッジ付きテスト
npm run test:coverage
```

## ドキュメント

詳細なドキュメントは [.docs/README.md](.docs/README.md) に集約されています。

- **アーキテクチャ**: [overview.md](.docs/architecture/overview.md)
- **ディレクトリ構成**: [directory-structure.md](.docs/architecture/directory-structure.md)
- **開発ガイド**: [development/](.docs/development/)
- **機能仕様**: [features/](.docs/features/)
