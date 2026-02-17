# REST API 設計

## 概要

外部アプリケーションからmukuのデータにアクセスするためのREST API。
テーブルのレコードに対してCRUD操作を行い、高度なフィルタリング・ソート・ページネーションにも対応する。

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

| メソッド | パス                                      | 用途             | 状態                          |
| -------- | ----------------------------------------- | ---------------- | ----------------------------- |
| `GET`    | `/api/v1/items/:itemId/records`           | レコード一覧取得 | ✅ 実装済み                   |
| `POST`   | `/api/v1/items/:itemId/records`           | レコード作成     | ✅ 実装済み                   |
| `GET`    | `/api/v1/items/:itemId/records/:recordId` | レコード詳細取得 | ✅ 実装済み                   |
| `PATCH`  | `/api/v1/items/:itemId/records/:recordId` | レコード部分更新 | ✅ 実装済み（PUTも後方互換維持） |
| `DELETE` | `/api/v1/items/:itemId/records/:recordId` | レコード削除     | ✅ 実装済み                   |

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

| HTTPステータス | コード             | 説明                       |
| -------------- | ------------------ | -------------------------- |
| 400            | `BAD_REQUEST`      | リクエストが不正           |
| 401            | `UNAUTHORIZED`     | 認証が必要 / APIキーが無効 |
| 403            | `FORBIDDEN`        | 権限不足                   |
| 404            | `NOT_FOUND`        | リソースが見つからない     |
| 422            | `VALIDATION_ERROR` | バリデーションエラー       |
| 500            | `INTERNAL_ERROR`   | サーバー内部エラー         |

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

レコード一覧を取得する。高度なフィルタリング・ソート・ページネーションに対応。

#### クエリパラメータ（基本）

| パラメータ | 型            | デフォルト  | 説明                                                        |
| ---------- | ------------- | ----------- | ----------------------------------------------------------- |
| `page`     | `number`      | `1`         | ページ番号                                                  |
| `limit`    | `number`      | `50`        | 1ページの件数（最大100）                                    |
| `sort`     | `string`      | `createdAt` | ソートフィールド（カラムIDまたは `createdAt`, `updatedAt`） |
| `order`    | `asc \| desc` | `desc`      | ソート順                                                    |

#### フィルタリング（JSON形式）

クエリパラメータ `filter` にJSON文字列を指定するか、
POSTメソッド（`POST /api/v1/items/:itemId/records/search`）でJSONボディとして送信できる。

```bash
# GETクエリパラメータ方式（シンプルなフィルタ向け）
GET /api/v1/items/:itemId/records?filter={"col-1":{"$contains":"株式会社"}}

# POST方式（複雑なフィルタ向け） ※推奨
POST /api/v1/items/:itemId/records/search
Content-Type: application/json

{
  "filter": { ... },
  "sort": { ... },
  "page": 1,
  "limit": 50
}
```

#### フィルタ構文

##### 基本フィルタ（フィールドごと）

```json
{
  "filter": {
    "<columnId>": {
      "<operator>": "<value>"
    }
  }
}
```

##### 演算子一覧

| 演算子        | 説明           | 対応型         | 例                            |
| ------------- | -------------- | -------------- | ----------------------------- |
| `$eq`         | 等しい         | 全型           | `{ "$eq": "東京" }`           |
| `$ne`         | 等しくない     | 全型           | `{ "$ne": "大阪" }`           |
| `$gt`         | より大きい     | NUMBER, DATE   | `{ "$gt": 100 }`              |
| `$gte`        | 以上           | NUMBER, DATE   | `{ "$gte": 100 }`             |
| `$lt`         | より小さい     | NUMBER, DATE   | `{ "$lt": 1000 }`             |
| `$lte`        | 以下           | NUMBER, DATE   | `{ "$lte": 1000 }`            |
| `$contains`   | 部分一致       | TEXT, TEXTAREA | `{ "$contains": "株式" }`     |
| `$startsWith` | 前方一致       | TEXT, TEXTAREA | `{ "$startsWith": "東京" }`   |
| `$endsWith`   | 後方一致       | TEXT, TEXTAREA | `{ "$endsWith": "株式会社" }` |
| `$in`         | いずれか       | 全型           | `{ "$in": ["A", "B"] }`       |
| `$notIn`      | いずれでもない | 全型           | `{ "$notIn": ["C", "D"] }`    |
| `$isNull`     | NULL判定       | 全型           | `{ "$isNull": true }`         |
| `$isNotNull`  | NOT NULL判定   | 全型           | `{ "$isNotNull": true }`      |

##### 論理演算子

```json
// AND（デフォルト: 複数フィールドを指定すると暗黙的にAND）
{
  "filter": {
    "col-1": { "$contains": "株式会社" },
    "col-2": { "$gte": 100000 }
  }
}

// 明示的 AND
{
  "filter": {
    "$and": [
      { "col-1": { "$contains": "株式会社" } },
      { "col-2": { "$gte": 100000 } }
    ]
  }
}

// OR
{
  "filter": {
    "$or": [
      { "col-1": { "$eq": "東京" } },
      { "col-1": { "$eq": "大阪" } }
    ]
  }
}

// AND + OR の組み合わせ
{
  "filter": {
    "$and": [
      {
        "$or": [
          { "col-region": { "$eq": "関東" } },
          { "col-region": { "$eq": "関西" } }
        ]
      },
      { "col-revenue": { "$gte": 1000000 } }
    ]
  }
}
```

##### ソート（JSON形式）

```json
// 単一フィールドソート
{
  "sort": { "field": "col-revenue", "order": "desc" }
}

// 複数フィールドソート
{
  "sort": [
    { "field": "col-region", "order": "asc" },
    { "field": "col-revenue", "order": "desc" }
  ]
}
```

#### リクエスト例

```bash
# 基本的な一覧取得
GET /api/v1/items/item-abc123/records?page=1&limit=20

# シンプルなフィルタ（クエリパラメータ）
GET /api/v1/items/item-abc123/records?filter={"col-1":{"$contains":"東京"}}&sort=createdAt&order=desc

# 高度なフィルタ（POST /search）
POST /api/v1/items/item-abc123/records/search
Content-Type: application/json

{
  "filter": {
    "$and": [
      { "col-company": { "$contains": "株式会社" } },
      { "col-revenue": { "$gte": 500000 } },
      {
        "$or": [
          { "col-status": { "$eq": "active" } },
          { "col-status": { "$eq": "pending" } }
        ]
      }
    ]
  },
  "sort": [
    { "field": "col-revenue", "order": "desc" }
  ],
  "page": 1,
  "limit": 20
}
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

## 検索エンドポイント

### POST /api/v1/items/:itemId/records/search

レコードを高度なフィルタ条件で検索する。`GET /records` と同じデータを返すが、
複雑なフィルタ条件をJSONボディで送信できる。

> **なぜPOSTか:** GETのクエリパラメータではURL長制限やエスケープの問題があり、
> ネストされた論理演算子を含む複雑なフィルタには不向きなため。

#### リクエスト

```json
{
  "filter": {
    "$or": [
      {
        "$and": [
          { "col-region": { "$eq": "関東" } },
          { "col-revenue": { "$gte": 1000000 } }
        ]
      },
      {
        "col-status": { "$in": ["VIP", "premium"] }
      }
    ]
  },
  "sort": [
    { "field": "col-revenue", "order": "desc" },
    { "field": "createdAt", "order": "asc" }
  ],
  "page": 1,
  "limit": 50
}
```

#### レスポンス

`GET /records` と同一フォーマット。

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
| レコード検索     | READ以上                                   |

---

## 実装の優先順位

| 優先度 | タスク                               | 概要                                             | 状態        |
| ------ | ------------------------------------ | ------------------------------------------------ | ----------- |
| 🔴 1   | レスポンスフォーマット統一           | `{ data: ... }` ラッパーの導入、エラー形式の統一 | ✅ 完了     |
| 🔴 2   | `GET /items`                         | アイテム一覧エンドポイント                       | ✅ 完了     |
| 🔴 3   | `GET /items/:itemId` の修正          | レコードを含めない、レスポンスラッパー適用       | ✅ 完了     |
| 🔴 4   | `GET /items/:itemId/records`         | レコード一覧（ページネーション + 基本ソート）    | ✅ 完了     |
| 🔴 5   | `POST /items/:itemId/records/search` | 高度なフィルタリング                             | ⚠️ 未実装   |
| 🟡 6   | `PATCH` メソッド追加                 | PUT → PATCH 移行（PUTも維持）                    | ✅ 完了     |
| 🟡 7   | バリデーション強化                   | スキーマに基づくレコード入力バリデーション       | ⚠️ 未実装   |

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
│           ├── search/
│           │   └── route.ts                        # POST: レコード検索（未実装）
│           └── [recordId]/
│               └── route.ts                        # GET: 詳細, PATCH/PUT: 更新, DELETE: 削除
lib/
├── api-auth.ts                                     # APIキー認証
├── api-response.ts                                 # レスポンスヘルパー
├── api-filter.ts                                   # フィルタ構文パーサー（未実装）
└── permissions.ts                                  # 権限チェック
```
