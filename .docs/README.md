# プロジェクトドキュメント

Lowcode Platformの詳細ドキュメント集です。

## ディレクトリ構成

### architecture/ - アーキテクチャ

システム設計に関するドキュメント。

| ファイル                                                        | 内容                                            | 参照タイミング                |
| --------------------------------------------------------------- | ----------------------------------------------- | ----------------------------- |
| [overview.md](./architecture/overview.md)                       | Server-First Architecture、パフォーマンス最適化 | 新機能実装時、設計判断時      |
| [directory-structure.md](./architecture/directory-structure.md) | ディレクトリ構成、設計原則                      | ファイル配置に迷った時        |
| [item-model.md](./architecture/item-model.md)                   | Itemモデル、Discriminated Union                 | Item/Folder/Table関連の実装時 |
| [database.md](./architecture/database.md)                       | Prismaスキーマ、データモデル                    | DB変更時、データ構造確認時    |

### development/ - 開発ガイド

開発プロセスに関するドキュメント。

| ファイル                                             | 内容                             | 参照タイミング           |
| ---------------------------------------------------- | -------------------------------- | ------------------------ |
| [coding-rules.md](./development/coding-rules.md)     | コーディング規約、コメントルール | コード記述時             |
| [testing.md](./development/testing.md)               | テスト方針、Jest設定             | テスト作成時             |
| [git-workflow.md](./development/git-workflow.md)     | Git操作ルール                    | コミット・ブランチ操作時 |
| [issue-pr-guide.md](./development/issue-pr-guide.md) | Issue/PR作成ガイドライン         | Issue/PR作成時           |

### features/ - 機能仕様

各機能の詳細仕様。

| ファイル                                          | 内容                           | 参照タイミング             |
| ------------------------------------------------- | ------------------------------ | -------------------------- |
| [authentication.md](./features/authentication.md) | 認証機能、Supabase Auth        | 認証関連の実装時           |
| [groups.md](./features/groups.md)                 | グループ管理、権限             | グループ機能の実装時       |
| [users.md](./features/users.md)                   | ユーザー管理                   | ユーザー機能の実装時       |
| [items.md](./features/items.md)                   | Item（フォルダ・テーブル）管理 | ワークスペース機能の実装時 |
| [tables.md](./features/tables.md)                 | テーブル管理、動的スキーマ     | テーブル機能の実装時       |
| [columns.md](./features/columns.md)               | カラム（フィールド）管理       | カラム機能の実装時         |
| [records.md](./features/records.md)               | レコード管理、データ操作       | レコード機能の実装時       |

### planning/ - 計画・参考資料

要件定義とロードマップ。実装状況も本ディレクトリのドキュメントで管理します。

| ファイル                                      | 内容                     | 参照タイミング         |
| --------------------------------------------- | ------------------------ | ---------------------- |
| [requirements.md](./planning/requirements.md) | 機能要件と実装ステータス | 機能追加・進捗確認時   |
| [roadmap.md](./planning/roadmap.md)           | 実装ロードマップと進捗   | スケジュール確認時     |
| [todo.md](./planning/todo.md)                 | 実装TODO（詳細タスク）   | タスク確認・進捗管理時 |
| [references.md](./planning/references.md)     | 参考資料、類似サービス   | 設計・実装の参考に     |

## メンテナンス方針

ドキュメントとコードの乖離を防ぐため、以下の運用を行います。

1. **実装時は必ずドキュメントを更新する**
   - 機能実装完了時: `requirements.md`, `roadmap.md` のステータスを更新
   - 機能仕様変更時: `features/` 配下の仕様書を変更
2. **ステータス表記の統一**
   - 完了: `[x]`
   - 未完了: `[ ]`
