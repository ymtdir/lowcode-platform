# テスト方針

このプロジェクトでは**Server Actionsを中心にテストを実装**する方針とする。

## テスト対象の優先度

1. **Server Actions（`features/*/api/`）** - 最優先
   - ビジネスロジックの中核
   - データ整合性やバリデーション
   - 副作用が大きい（DB書き込み、外部API呼び出し）
   - 型安全性だけでは不十分なエッジケースの確認

2. **ユーティリティ関数（`lib/utils/`）** - 次点
   - 純粋関数のテスト
   - 汎用的なロジック

3. **Hooks（`features/*/hooks/`）** - 必要に応じて
   - 状態管理ロジックの複雑度に応じて

4. **Components（`features/*/components/`）** - 後回し
   - Server Componentsは統合テストで十分なケースが多い
   - UIの変更頻度が高くメンテナンスコストが増大しやすい
   - E2Eテスト（Playwright等）でカバーする選択肢も検討

## テストフレームワーク

- **Jest**: Next.js公式推奨、`next/jest`による簡単セットアップ
- **テスト環境**: `node`（Server Actions向け、UIテストは対象外）
- **カバレッジプロバイダ**: `v8`（高速で正確）

## ディレクトリ構成

```
features/
├── group/
│   ├── api/
│   │   ├── __tests__/              # テストファイル
│   │   │   ├── add-members.test.ts
│   │   │   ├── remove-members.test.ts
│   │   │   ├── create-group.test.ts
│   │   │   └── ...
│   │   ├── add-members.ts
│   │   ├── remove-members.ts
│   │   └── ...
│   └── ...
└── user/
    ├── api/
    │   ├── __tests__/
    │   │   ├── create-user.test.ts
    │   │   └── ...
    │   └── ...
    └── ...
```

**命名規則**:

- ディレクトリ: `__tests__`（複数形）
- ファイル: `*.test.ts` または `*.spec.ts`

## テストの実装方針

- **Prismaのモック**: `jest.mock()`でPrismaクライアントをモック化
- **テストデータベース**: 初期フェーズではモックのみ、統合テストが必要になったら検討
- **カバレッジ**: Server Actionsの主要な処理経路とエラーハンドリングを優先
- **コロケーション**: テスト対象ファイルと同じ階層に`__tests__`を配置

## Jest設定

```typescript
// jest.config.ts
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  clearMocks: true,
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default createJestConfig(config);
```

**設定のポイント**:

- `next/jest`を使用してNext.jsの設定を自動読み込み
- `testEnvironment: 'node'`でServer Actions向けの軽量な環境
- `clearMocks: true`でテスト間の独立性を確保
- `moduleNameMapper`でパスエイリアス（`@/`）を解決

## テスト実装状況（2025-11-23時点）

**実装済みのテスト**:

| 機能     | ファイル数 | テスト数 |
| -------- | ---------- | -------- |
| auth     | 3          | 12       |
| item     | 7          | 36       |
| column   | 4          | 32       |
| record   | 4          | 31       |
| group    | 7          | 33       |
| user     | 5          | 21       |
| **合計** | **31**     | **154**  |

## テストコマンド

```bash
npm test                 # 全テスト実行
npm run test:coverage    # カバレッジ付きテスト実行
```
