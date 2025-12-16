# 参考資料

## 類似サービス

### ドキュメント×データベース系

| サービス                         | 特徴                                       |
| -------------------------------- | ------------------------------------------ |
| [Notion](https://www.notion.so/) | データベース機能・マルチビューが参考になる |

### スプレッドシート×データベース系

| サービス                              | 特徴                          |
| ------------------------------------- | ----------------------------- |
| [Airtable](https://www.airtable.com/) | UI/UX・リレーション機能の参考 |
| [NocoDB](https://www.nocodb.com/)     | オープンソースのAirtable代替  |

### 業務アプリ構築系

| サービス                                 | 特徴                                 |
| ---------------------------------------- | ------------------------------------ |
| [Kintone](https://kintone.cybozu.co.jp/) | 日本の業務アプリプラットフォーム     |
| [Pleasanter](https://pleasanter.org/)    | オープンソース・権限管理が参考になる |

## 技術参考

### Next.js関連

| リソース                                                                                                           | 説明                                     |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| [Next.js App Router](https://nextjs.org/docs/app)                                                                  | 公式ドキュメント                         |
| [Next.jsの考え方](https://zenn.dev/akfm/books/nextjs-basic-principle)                                              | App Routerの基本原則とベストプラクティス |
| [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) | データ更新の推奨パターン                 |
| [Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns)             | データ取得のベストプラクティス           |

### データベース・ORM

| リソース                              | 説明                           |
| ------------------------------------- | ------------------------------ |
| [Prisma](https://www.prisma.io/)      | 型安全なORM                    |
| [Supabase](https://supabase.com/docs) | PostgreSQL + 認証 + ストレージ |

### UI・スタイリング

| リソース                                     | 説明                         |
| -------------------------------------------- | ---------------------------- |
| [shadcn/ui](https://ui.shadcn.com/)          | 再利用可能なコンポーネント集 |
| [Tailwind CSS](https://tailwindcss.com/docs) | ユーティリティファーストCSS  |

### コードエディタ・スクリプト実行

| リソース                                                    | 説明                         |
| ----------------------------------------------------------- | ---------------------------- |
| [Monaco Editor](https://microsoft.github.io/monaco-editor/) | VS Code のエディタエンジン   |
| [vm2](https://github.com/patriksimek/vm2)                   | セキュアなJavaScript実行環境 |

### その他

| リソース                                                   | 説明                                       |
| ---------------------------------------------------------- | ------------------------------------------ |
| [Zod](https://zod.dev/)                                    | TypeScript-firstなバリデーションライブラリ |
| [@tanstack/react-table](https://tanstack.com/table/latest) | 高機能なテーブルライブラリ                 |
| [@dnd-kit](https://dndkit.com/)                            | ドラッグ&ドロップライブラリ                |

## 技術的な検討事項

### 動的スキーマの実装

- PostgreSQLのJSONB型を活用
- スキーマ定義とデータを分離
- バリデーションはサーバーサイド（Server Actions）で実行

### スクリプトの安全性

- サーバーサイド: vm2でサンドボックス実行
- クライアントサイド: 制限されたAPIのみ提供
- タイムアウト設定（5秒）
- 利用可能なAPIを制限

### パフォーマンス最適化（必要になった時点で実装）

- レコード数が多い場合の対策: ページネーション、仮想スクロール、インデックス最適化
- リレーション取得の最適化: N+1問題の回避（Prismaの`include`を活用）、キャッシング
