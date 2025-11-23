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

## プロジェクト構成

```
lowcode-platform/
├── app/                    # Next.js App Router
├── components/             # 共通UIコンポーネント（shadcn/ui）
├── features/               # 機能別モジュール
│   ├── auth/              # 認証機能
│   ├── user/              # ユーザー管理
│   ├── group/             # グループ管理
│   ├── item/              # アイテム（フォルダ・テーブル）管理
│   ├── column/            # テーブルカラム管理
│   ├── record/            # レコード管理
│   └── layout/            # レイアウトコンポーネント
├── lib/                    # ユーティリティ・設定
├── prisma/                 # Prismaスキーマ
└── .github/workflows/      # GitHub Actions設定
```

## アーキテクチャ方針

### Server-First Architecture

Next.jsのベストプラクティスに従い、基本的にサーバーサイドで処理を行う設計。

- デフォルトでServer Componentsを使用
- データ更新はServer Actionsを活用
- クライアント側の処理が必要な場合のみ`'use client'`を使用

詳細は[CLAUDE.md](./CLAUDE.md)を参照。

## テスト

Jestを使用したユニットテストを実装。カバレッジ目標は90%。

```bash
# テスト実行
npm test

# カバレッジ付きテスト
npm run test:coverage
```

## CI/CD

GitHub Actionsを使用したCI環境を構築。

- **Lint**: ESLintによるコードチェック
- **Type Check**: TypeScriptの型チェック
- **Test**: Jestによるテスト実行
- **Coverage**: Codecovへのカバレッジアップロード
- **Build**: 本番ビルドの検証

詳細は[.github/workflows/ci.yml](.github/workflows/ci.yml)を参照。
