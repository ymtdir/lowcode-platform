# REST API 設計

## 概要

外部アプリケーションからmukuのデータにアクセスするためのREST API。
テーブルのレコードに対してCRUD操作を行い、ソート・ページネーションに対応する。

### 設計方針

| 項目           | 方針                                                             |
| -------------- | ---------------------------------------------------------------- |
| ベースパス     | `/api/v1/`                                                       |
| 認証           | APIキー（`Authorization: Bearer mk_xxx` or `X-API-Key: mk_xxx`） |
| リクエスト形式 | JSON（`Content-Type: application/json`）                         |
| レスポンス形式 | JSON                                                             |
| アイテム操作   | **読み取り専用**（構造変更は不可）                               |
| レコード操作   | **フルCRUD**（権限に応じて制限）                                 |

### APIスコープ

- **アイテム（フォルダ・テーブル）**: 一覧取得、詳細取得のみ
- **レコード**: 一覧取得（フィルタ・ソート・ページネーション）、作成、取得、更新、削除

---

## エンドポイント一覧

### アイテム（読み取り専用）

| メソッド | パス                    | 用途             | 状態        |
| -------- | ----------------------- | ---------------- | ----------- |
| `GET`    | `/api/v1/items`         | アイテム一覧取得 | ✅ 実装済み |
| `GET`    | `/api/v1/items/:itemId` | アイテム詳細取得 | ✅ 実装済み |

### レコード（CRUD）

| メソッド | パス                                      | 用途             | 状態                             |
| -------- | ----------------------------------------- | ---------------- | -------------------------------- |
| `GET`    | `/api/v1/items/:itemId/records`           | レコード一覧取得 | ✅ 実装済み                      |
| `POST`   | `/api/v1/items/:itemId/records`           | レコード作成     | ✅ 実装済み                      |
| `GET`    | `/api/v1/items/:itemId/records/:recordId` | レコード詳細取得 | ✅ 実装済み                      |
| `PATCH`  | `/api/v1/items/:itemId/records/:recordId` | レコード部分更新 | ✅ 実装済み（PUTも後方互換維持） |
| `DELETE` | `/api/v1/items/:itemId/records/:recordId` | レコード削除     | ✅ 実装済み                      |

---

## 共通仕様

### 認証

すべてのリクエストにAPIキーが必要。

```bash
# Authorization ヘッダー方式
curl -H "Authorization: Bearer mk_xxxxxxxxxxxx" \
  https://example.com/api/v1/items

# X-API-Key ヘッダー方式
curl -H "X-API-Key: mk_xxxxxxxxxxxx" \
  https://example.com/api/v1/items
```

### エラーレスポンス

```json
{
  "error": {
    "message": "エラーの説明",
    "code": "ERROR_CODE"
  }
}
```

| HTTPステータス | コード                | 説明                       |
| -------------- | --------------------- | -------------------------- |
| 400            | `BAD_REQUEST`         | リクエストが不正           |
| 401            | `UNAUTHORIZED`        | 認証が必要 / APIキーが無効 |
| 403            | `FORBIDDEN`           | 権限不足                   |
| 404            | `NOT_FOUND`           | リソースが見つからない     |
| 422            | `VALIDATION_ERROR`    | バリデーションエラー       |
| 429            | `RATE_LIMIT_EXCEEDED` | レート制限超過             |
| 500            | `INTERNAL_ERROR`      | サーバー内部エラー         |

### APIキーのセキュリティ

- APIキーはSHA-256ハッシュとしてDBに保存される（平文は保存しない）
- キー生成時に一度だけ平文を表示し、以降はprefix（先頭8文字、例: `mk_abc1d`）でマスク表示する
- `lastUsedAt`: APIキーの最終使用日時を記録（fire-and-forgetで非同期更新）
- `expiresAt`: 有効期限（設定されている場合、期限切れキーは401を返す）
- 1ユーザーにつきAPIキーは1個まで（再生成時は既存キーを削除）

### レート制限

インメモリの固定ウィンドウ方式で、1ユーザーあたり **100リクエスト/分** に制限。

制限を超えた場合は `429 Too Many Requests` を返し、以下のヘッダーを付与する:

| ヘッダー                | 説明                                 |
| ----------------------- | ------------------------------------ |
| `X-RateLimit-Limit`     | ウィンドウあたりの最大リクエスト数   |
| `X-RateLimit-Remaining` | 残りリクエスト数                     |
| `X-RateLimit-Reset`     | ウィンドウリセット時刻（UNIXタイム） |

### 成功レスポンス

```json
// 単一リソース
{
  "data": { ... }
}

// 一覧（ページネーション付き）
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 230,
    "totalPages": 5
  }
}
```

---

## アイテムAPI

### GET /api/v1/items

アイテム（フォルダ・テーブル）の一覧を取得する。

#### クエリパラメータ

| パラメータ | 型                | デフォルト | 説明                                                  |
| ---------- | ----------------- | ---------- | ----------------------------------------------------- |
| `type`     | `FOLDER \| TABLE` | -          | アイテムタイプでフィルタ                              |
| `parentId` | `string`          | -          | 親フォルダIDでフィルタ（`null`でルート直下）          |
| `flat`     | `boolean`         | `false`    | `true`の場合フラットなリスト、`false`の場合ツリー構造 |

#### レスポンス例（フラット）

```bash
GET /api/v1/items?type=TABLE&flat=true
```

```json
{
  "data": [
    {
      "id": "item-abc123",
      "type": "TABLE",
      "name": "顧客マスタ",
      "icon": null,
      "parentId": "folder-xyz",
      "meta": {
        "schema": {
          "columns": [
            {
              "id": "col-1",
              "name": "会社名",
              "type": "TEXT",
              "required": true,
              "order": 0,
              "config": {}
            },
            {
              "id": "col-2",
              "name": "電話番号",
              "type": "TEXT",
              "required": false,
              "order": 1,
              "config": {}
            }
          ]
        }
      },
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-02-10T08:30:00.000Z"
    }
  ]
}
```

#### レスポンス例（ツリー構造）

```bash
GET /api/v1/items
```

```json
{
  "data": [
    {
      "id": "folder-xyz",
      "type": "FOLDER",
      "name": "営業部",
      "icon": null,
      "parentId": null,
      "children": [
        {
          "id": "item-abc123",
          "type": "TABLE",
          "name": "顧客マスタ",
          "icon": null,
          "parentId": "folder-xyz",
          "meta": {
            "schema": {
              "columns": [
                {
                  "id": "col-1",
                  "name": "会社名",
                  "type": "TEXT",
                  "required": true,
                  "order": 0,
                  "config": {}
                },
                {
                  "id": "col-2",
                  "name": "電話番号",
                  "type": "TEXT",
                  "required": false,
                  "order": 1,
                  "config": {}
                }
              ]
            }
          },
          "createdAt": "2026-01-15T10:00:00.000Z",
          "updatedAt": "2026-02-10T08:30:00.000Z",
          "children": []
        }
      ],
      "createdAt": "2026-01-10T09:00:00.000Z",
      "updatedAt": "2026-01-10T09:00:00.000Z"
    }
  ]
}
```

---

### GET /api/v1/items/:itemId

アイテムの詳細を取得する。（✅ 実装済み）

- **FOLDERの場合**: 子アイテム一覧を含む
- **TABLEの場合**: スキーマ（`meta.schema.columns`）を含む

> **注意**: レコードはこのエンドポイントには含めない。レコード取得は `GET /api/v1/items/:itemId/records` を使用する。

#### レスポンス例（TABLE）

```json
{
  "data": {
    "id": "item-abc123",
    "type": "TABLE",
    "name": "顧客マスタ",
    "icon": null,
    "parentId": "folder-xyz",
    "meta": {
      "schema": {
        "columns": [
          {
            "id": "col-1",
            "name": "会社名",
            "type": "TEXT",
            "required": true,
            "order": 0,
            "config": {}
          },
          {
            "id": "col-2",
            "name": "売上",
            "type": "NUMBER",
            "required": false,
            "order": 1,
            "config": { "unit": "円", "unitPosition": "suffix" }
          }
        ]
      }
    },
    "children": [],
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-02-10T08:30:00.000Z"
  }
}
```

---

## レコードAPI

### GET /api/v1/items/:itemId/records

レコード一覧を取得する。ソート・ページネーションに対応。（✅ 実装済み）

#### クエリパラメータ（基本）

| パラメータ | 型            | デフォルト  | 説明                                                        |
| ---------- | ------------- | ----------- | ----------------------------------------------------------- |
| `page`     | `number`      | `1`         | ページ番号                                                  |
| `limit`    | `number`      | `50`        | 1ページの件数（最大100）                                    |
| `sort`     | `string`      | `createdAt` | ソートフィールド（カラムIDまたは `createdAt`, `updatedAt`） |
| `order`    | `asc \| desc` | `desc`      | ソート順                                                    |

#### フィルタリング

> フィルタリング機能は Issue #141 で別途実装予定。

#### リクエスト例

```bash
# 基本的な一覧取得
GET /api/v1/items/item-abc123/records?page=1&limit=20

# ソート指定
GET /api/v1/items/item-abc123/records?sort=createdAt&order=desc&limit=20
```

#### レスポンス

```json
{
  "data": [
    {
      "id": "rec-001",
      "tableId": "item-abc123",
      "data": {
        "col-company": "株式会社サンプル",
        "col-phone": "03-1234-5678",
        "col-revenue": 1500000,
        "col-status": "active"
      },
      "createdById": "user-001",
      "createdAt": "2026-02-01T10:00:00.000Z",
      "updatedAt": "2026-02-15T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 85,
    "totalPages": 5
  }
}
```

---

### POST /api/v1/items/:itemId/records

新しいレコードを作成する。（✅ 実装済み）

#### リクエスト

```json
{
  "data": {
    "col-company": "株式会社テスト",
    "col-phone": "03-9876-5432",
    "col-revenue": 800000
  }
}
```

#### レスポンス（201 Created）

```json
{
  "data": {
    "id": "rec-new-001",
    "tableId": "item-abc123",
    "data": {
      "col-company": "株式会社テスト",
      "col-phone": "03-9876-5432",
      "col-revenue": 800000
    },
    "createdById": "user-001",
    "createdAt": "2026-02-16T12:00:00.000Z",
    "updatedAt": "2026-02-16T12:00:00.000Z"
  }
}
```

---

### GET /api/v1/items/:itemId/records/:recordId

レコードの詳細を取得する。（✅ 実装済み）

#### レスポンス

```json
{
  "data": {
    "id": "rec-001",
    "tableId": "item-abc123",
    "data": {
      "col-company": "株式会社サンプル",
      "col-phone": "03-1234-5678"
    },
    "createdById": "user-001",
    "createdAt": "2026-02-01T10:00:00.000Z",
    "updatedAt": "2026-02-15T14:30:00.000Z"
  }
}
```

---

### PATCH /api/v1/items/:itemId/records/:recordId

レコードを部分更新する。（✅ 実装済み）

指定したフィールドのみ更新し、他のフィールドは保持される。
後方互換のため `PUT` も同じ動作で残している。

#### リクエスト

```json
{
  "data": {
    "col-phone": "03-1111-2222",
    "col-revenue": 2000000
  }
}
```

#### レスポンス

```json
{
  "data": {
    "id": "rec-001",
    "tableId": "item-abc123",
    "data": {
      "col-company": "株式会社サンプル",
      "col-phone": "03-1111-2222",
      "col-revenue": 2000000
    },
    "createdById": "user-001",
    "createdAt": "2026-02-01T10:00:00.000Z",
    "updatedAt": "2026-02-16T12:30:00.000Z"
  }
}
```

---

### DELETE /api/v1/items/:itemId/records/:recordId

レコードを削除する。（✅ 実装済み）

#### レスポンス（204 No Content）

レスポンスボディなし。

---

## 権限チェック

| 操作             | 必要な権限レベル                           |
| ---------------- | ------------------------------------------ |
| アイテム一覧取得 | 認証済み（アクセス可能なアイテムのみ返す） |
| アイテム詳細取得 | READ以上                                   |
| レコード一覧取得 | READ以上                                   |
| レコード詳細取得 | READ以上                                   |
| レコード作成     | WRITE以上                                  |
| レコード更新     | WRITE以上                                  |
| レコード削除     | WRITE以上                                  |
| レコード検索     | READ以上（Issue #141 で実装予定）          |

---

## 実装の優先順位

| 優先度 | タスク                               | 概要                                             | 状態                     |
| ------ | ------------------------------------ | ------------------------------------------------ | ------------------------ |
| 🔴 1   | レスポンスフォーマット統一           | `{ data: ... }` ラッパーの導入、エラー形式の統一 | ✅ 完了                  |
| 🔴 2   | `GET /items`                         | アイテム一覧エンドポイント                       | ✅ 完了                  |
| 🔴 3   | `GET /items/:itemId` の修正          | レコードを含めない、レスポンスラッパー適用       | ✅ 完了                  |
| 🔴 4   | `GET /items/:itemId/records`         | レコード一覧（ページネーション + 基本ソート）    | ✅ 完了                  |
| 🔴 5   | APIキーセキュリティ                  | SHA-256ハッシュ保存、prefix表示、有効期限        | ✅ 完了                  |
| 🔴 6   | レート制限                           | 100リクエスト/分、429レスポンス                  | ✅ 完了                  |
| 🟡 7   | `PATCH` メソッド追加                 | PUT → PATCH 移行（PUTも維持）                    | ✅ 完了                  |
| 🟡 8   | `POST /items/:itemId/records/search` | 高度なフィルタリング                             | 📋 Issue #141 で実装予定 |
| 🟡 9   | バリデーション強化                   | スキーマに基づくレコード入力バリデーション       | ⚠️ 未実装                |

---

## 将来の拡張（検討中）

| エンドポイント                              | 用途                 |
| ------------------------------------------- | -------------------- |
| `POST /api/v1/items/:itemId/records/bulk`   | レコード一括作成     |
| `PATCH /api/v1/items/:itemId/records/bulk`  | レコード一括更新     |
| `DELETE /api/v1/items/:itemId/records/bulk` | レコード一括削除     |
| `GET /api/v1/items/:itemId/records/export`  | CSV/JSONエクスポート |
| `POST /api/v1/items/:itemId/records/import` | CSV/JSONインポート   |
| `GET /api/v1/me`                            | 認証ユーザー情報取得 |

## ファイル構成

```text
app/api/v1/
├── __tests__/
│   ├── items-api.test.ts                           # アイテム一覧・詳細のテスト
│   └── records-api.test.ts                         # レコードCRUDのテスト
├── items/
│   ├── route.ts                                    # GET: アイテム一覧
│   └── [itemId]/
│       ├── route.ts                                # GET: アイテム詳細
│       └── records/
│           ├── route.ts                            # GET: レコード一覧, POST: レコード作成
│           └── [recordId]/
│               └── route.ts                        # GET: 詳細, PATCH/PUT: 更新, DELETE: 削除
lib/
├── api-auth.ts                                     # APIキー認証（SHA-256ハッシュ照合）
├── api-response.ts                                 # レスポンスヘルパー
├── rate-limit.ts                                   # レート制限（インメモリ）
└── permissions.ts                                  # 権限チェック

features/api-key/
├── api/
│   ├── __tests__/
│   │   ├── delete-api-key.test.ts                  # APIキー削除テスト
│   │   ├── generate-api-key.test.ts                # APIキー生成テスト
│   │   └── get-api-key.test.ts                     # APIキー取得テスト
│   ├── delete-api-key.ts                           # APIキー削除
│   ├── generate-api-key.ts                         # APIキー生成（ハッシュ+prefix保存）
│   └── get-api-key.ts                              # APIキー取得（prefix表示）
├── components/
│   └── api-key-section.tsx                         # APIキー管理UI
└── types/
    └── index.ts                                    # ApiKeyInfo型定義
```
