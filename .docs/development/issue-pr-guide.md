# Issue・Pull Request 作成ガイドライン

## Issue 作成のポイント

- テンプレート（`.github/ISSUE_TEMPLATE/`）のフォーマットに沿って記述
- **概要**: 目的や背景を簡潔に記載（2-3文程度）
- **詳細**: 実施内容を箇条書きで簡潔に列挙
- 細かい実装の詳細は書かず、何をするかの方針のみ記載

### 例（enhancement）

```markdown
## 概要

プロジェクト開発を開始するための初期環境をセットアップします。

## 詳細

- Next.js プロジェクトのセットアップ
- shadcn/ui の導入
- ESLint & Prettier の設定
- GitHub テンプレートの作成
```

## Pull Request 作成のポイント

- テンプレート（`.github/pull_request_template.md`）のフォーマットに沿って記述
- **概要**: PR の目的を簡潔に説明
- **実装内容**: 実装した主な内容を箇条書きで記載（サブリストで詳細を追加可）
- **動作確認**: 手動確認した項目をチェックリストで記載
- **関連 Issue**: `Closes #番号` で自動クローズ
- 過去の PR とトーンを合わせる

### 例

```markdown
## 概要

プロジェクトの開発環境を構築し、開発を開始するための基盤を整備しました。

## 実装内容

- **Next.js 環境構築**: App Router を使用したプロジェクトを生成
- **shadcn/ui の導入**: UI コンポーネントライブラリをセットアップ
- **ESLint & Prettier 導入**: コードフォーマッターと Linter の統合設定

## 動作確認

- [x] Next.js の開発サーバーが起動することを確認
- [x] ESLint/Prettier が正常に動作することを確認

## 関連 Issue

Closes #1
```

## ラベル

適切なラベルを付与することで、Issueの分類と優先度を明確にする。

### タイプラベル

- `enhancement`: 新機能
- `bug`: バグ修正
- `documentation`: ドキュメント
- `refactor`: リファクタリング

### 優先度ラベル

- `priority: high`: 高優先度
- `priority: medium`: 中優先度
- `priority: low`: 低優先度

### 機能ラベル

- `feature: auth`: 認証関連
- `feature: table`: テーブル関連
- `feature: record`: レコード関連
- 等
