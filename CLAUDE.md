# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## プロジェクト概要

これは美容室の日報収集アプリで、美容室スタッフが音声入力で日報を提出し、サロンオーナーが管理画面で提出された日報を確認できるアプリです。

## アーキテクチャ

### 主要なユーザーフロー
1. **スタッフフロー**: スタッフ選択 → 音声ガイド付き日報作成 → プレビュー/編集 → 提出
2. **管理者フロー**: ログイン → 日報ダッシュボード表示 → スタッフリスト管理

### 主要コンポーネント構造
- **音声入力システム**: Web Speech APIとガイド質問の統合
- **日報フォーマッター**: 音声回答を構造化された日報形式に変換
- **管理ダッシュボード**: 日報表示とスタッフ管理インターフェース

### データベーススキーマ (Supabase)
- `staff`: スタッフマスターデータ (id, name)
- `reports`: 日報 (staff_id, date, raw_responses JSON, formatted_report)
- `admin_auth`: 管理者認証

## 開発コマンド

### 初期セットアップ
```bash
npm install
npm run dev          # 開発サーバー起動
```

### ビルドとデプロイ
```bash
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
npm run lint         # ESLint実行
npm run typecheck    # TypeScriptチェック実行
```

## 必要な環境変数
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名キー
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseサービスロールキー (サーバーサイド)

## 音声入力実装ノート

音声入力システムはWeb Speech APIを使用し、以下の主要機能があります：
- 完全な日報生成のための5つのガイド質問
- 自動進行のための3秒間の無音検出
- 音声認識中の視覚的フィードバック
- 非対応ブラウザ向けのフォールバック

## 日報フォーマット構造

生成される日報は以下の形式に従います：
- 日付とスタッフ名のヘッダー
- 業務パフォーマンス指標
- 顧客との対話ハイライト
- 課題/改善セクション
- 明日の目標
- 追加メモ

## 技術スタック
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Web Speech API
- Vercel deployment