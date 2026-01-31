# muku

![CI](https://github.com/ymtdir/muku/workflows/CI/badge.svg)
[![codecov](https://codecov.io/gh/ymtdir/muku/graph/badge.svg?token=B0Z8GTSYQK)](https://codecov.io/gh/ymtdir/muku)

Next.js製の業務アプリケーションプラットフォーム

## 概要

ノーコード/ローコードで業務アプリを構築できるWebサービス。
直感的な操作でテーブルを自在に作成し、様々な業務情報を管理できます。

## 技術スタック

- **フロントエンド・バックエンド**: Next.js 16 (App Router)
- **データベース**: PostgreSQL (Neon, Supabase, etc.)
- **ORM**: Prisma
- **認証**: NextAuth.js v5
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
# Database（Prisma）
# プーリング接続用URL (Transaction pooling)
DATABASE_URL="postgresql://user:password@host:5432/db?pgbouncer=true"
# 直接接続用URL (Migration用)
DIRECT_URL="postgresql://user:password@host:5432/db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key" # `npx auth secret` で生成可能
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

## Dockerでの起動

### 前提条件

- Docker / Docker Compose がインストール済みであること

### セットアップ

```bash
# 環境変数ファイルを作成
cp .env.docker.example .env

# 必要に応じて .env を編集（パスワード等）
```

### 起動

```bash
docker compose up --build
```

起動後、以下のURLでアクセスできます:

| サービス         | URL                       |
| ---------------- | ------------------------- |
| アプリケーション | <http://localhost>          |
| pgAdmin          | <http://localhost/pgadmin/> |

### 初期データの投入

起動後、以下のコマンドで管理者アカウントと初期設定を作成します:

```bash
docker compose exec app npx prisma db seed
```

作成されるアカウント（`.env` で変更可能）:

- **メール**: `admin@example.com`
- **パスワード**: `P@ssw0rd`

### pgAdminの接続設定

pgAdminにログイン後、以下の情報でサーバーを追加してください:

#### General

| 項目 | 値                      |
| ---- | ----------------------- |
| Name | `.env` の `POSTGRES_DB` |

#### Connection

| 項目                 | 値                            |
| -------------------- | ----------------------------- |
| Host name/address    | `db`                          |
| Port                 | `5432`                        |
| Maintenance database | `postgres`                    |
| Username             | `.env` の `POSTGRES_USER`     |
| Password             | `.env` の `POSTGRES_PASSWORD` |

### 停止

```bash
docker compose down
```

データベースのデータを含めて完全に削除する場合:

```bash
docker compose down -v
```

### トラブルシューティング

#### ポートが競合する場合

`.env` でポートを変更できます。`NEXTAUTH_URL` もポートに合わせて更新してください:

```env
NGINX_PORT=8080
NEXTAUTH_URL=http://localhost:8080
```

#### データベースをリセットしたい場合

```bash
docker compose down -v
docker compose up --build
```

## ドキュメント

詳細なドキュメントは [.docs/README.md](.docs/README.md) に集約されています。

- **アーキテクチャ**: [overview.md](.docs/architecture/overview.md)
- **ディレクトリ構成**: [directory-structure.md](.docs/architecture/directory-structure.md)
- **開発ガイド**: [development/](.docs/development/)
- **機能仕様**: [features/](.docs/features/)
