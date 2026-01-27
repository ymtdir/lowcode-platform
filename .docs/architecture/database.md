# データベース設計

## 環境変数

```.env.local
# Database（Neon PostgreSQL）
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]?sslmode=require

# NextAuth.js
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

## Prismaスキーマ

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String?
  role          UserRole      @default(MEMBER)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  groupMembers  GroupMember[]
  tables        Table[]
  records       Record[]
  folders       Folder[]
}

model Group {
  id          String            @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  members     GroupMember[]
  permissions TablePermission[]
}

model GroupMember {
  id        String   @id @default(cuid())
  userId    String
  groupId   String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([userId, groupId])
  @@index([userId])
  @@index([groupId])
}

model Table {
  id          String            @id @default(cuid())
  name        String
  description String?
  schema      Json              // フィールド定義
  ownerId     String
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  owner       User              @relation(fields: [ownerId], references: [id])
  records     Record[]
  views       View[]
  scripts     Script[]
  styles      Style[]
  permissions TablePermission[]

  @@index([ownerId])
}

model TablePermission {
  id        String     @id @default(cuid())
  tableId   String
  groupId   String
  level     Permission @default(NONE)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  table     Table      @relation(fields: [tableId], references: [id], onDelete: Cascade)
  group     Group      @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([tableId, groupId])
  @@index([tableId])
  @@index([groupId])
}

model Record {
  id          String   @id @default(cuid())
  tableId     String
  data        Json     // 実際のデータ
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  table       Table    @relation(fields: [tableId], references: [id], onDelete: Cascade)
  createdBy   User     @relation(fields: [createdById], references: [id])

  @@index([tableId])
  @@index([createdById])
}

model View {
  id        String   @id @default(cuid())
  tableId   String
  name      String
  type      ViewType // grid, kanban, calendar, gallery
  config    Json     // ビュー設定
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  table     Table    @relation(fields: [tableId], references: [id], onDelete: Cascade)

  @@index([tableId])
}

model Script {
  id          String     @id @default(cuid())
  tableId     String
  event       String     // beforeCreate, onChange, etc.
  scriptType  ScriptType // server, client
  code        String     @db.Text
  enabled     Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  table       Table      @relation(fields: [tableId], references: [id], onDelete: Cascade)

  @@index([tableId])
}

model Style {
  id        String   @id @default(cuid())
  tableId   String
  scope     String   // global, table, view
  css       String   @db.Text
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  table     Table    @relation(fields: [tableId], references: [id], onDelete: Cascade)

  @@index([tableId])
}

model Folder {
  id          String   @id @default(cuid())
  name        String
  parentId    String?
  order       Int      @default(0)
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  parent      Folder?  @relation("FolderHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Folder[] @relation("FolderHierarchy")
  createdBy   User     @relation(fields: [createdById], references: [id])

  @@index([parentId])
  @@index([createdById])
  @@index([order])
}

enum UserRole {
  ADMIN
  MEMBER
}

enum Permission {
  NONE
  READ
  WRITE
  ADMIN
}

enum ViewType {
  GRID
  KANBAN
  CALENDAR
  GALLERY
}

enum ScriptType {
  SERVER
  CLIENT
}
```

## Enum定義

### UserRole

- `ADMIN`: すべての操作が可能
- `MEMBER`: 所属グループの権限に応じた操作

### Permission（テーブル単位）

- `NONE`: アクセス不可
- `READ`: 閲覧のみ
- `WRITE`: 閲覧・作成・編集
- `ADMIN`: すべての操作（削除・権限設定含む）

### ViewType

- `GRID`: 表形式（デフォルト）
- `KANBAN`: カンバン形式
- `CALENDAR`: カレンダー形式
- `GALLERY`: カード形式

### ScriptType

- `SERVER`: サーバーサイドスクリプト
- `CLIENT`: クライアントサイドスクリプト

## 技術的な検討事項

### 動的スキーマの実装

- PostgreSQLのJSONB型を活用
- スキーマ定義とデータを分離
- バリデーションはサーバーサイド（Server Actions）で実行

### パフォーマンス最適化

- レコード数が多い場合: ページネーション、仮想スクロール、インデックス最適化
- リレーション取得: N+1問題の回避（Prismaの`include`を活用）、キャッシング
