# トーク分析 — Talk Log Analyzer

[![CI](https://github.com/yutopias09/talk-log/actions/workflows/ci.yml/badge.svg)](https://github.com/yutopias09/talk-log/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/yutopias09/talk-log/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/yutopias09/talk-log/actions/workflows/deploy-pages.yml)

LINEのトーク履歴（テキスト書き出し）を読み込んで、ふたりの会話を可視化するローカル分析ツールです。
データはブラウザの中だけで処理され、サーバーへの送信は一切ありません。

## すぐに使う

`line_chat_analyzer_web.html` をブラウザで開くだけです。ビルド済みの単一HTMLなので、
ローカルサーバーやインストールは不要です。ファイルを開いたら「サンプルで試す」で動作を確認できます。

1. LINEのトーク画面右上の設定を開く
2. 「トーク履歴を送信」→「テキストファイル」を選ぶ
3. 保存した `.txt` ファイルを画面にドロップ（または「ファイルを選ぶ」）

## 主な機能

| 画面 | 内容 |
| --- | --- |
| 概要 | 期間のメッセージ数・文字数・ピーク時間、推移チャート、ふたりの割合、盛り上がった話、直近7日間 |
| 詳細統計 | 返信スピード、生活タイプ診断、文字数の推移、メッセージ種類、最多・最少日 |
| 時間帯分析 | 24時間の分布、時間帯の内訳、曜日×時間帯ヒートマップ |
| 内訳・ランキング | メッセージ種別、よく使う言葉（日本語の形態素分割）、絵文字、話題分類、絵文字の推移 |
| 日別履歴 | 日ごとの一覧、絞り込み、並び替え、その日のメッセージ表示 |
| 連続記録 | いまの記録・最長記録・次の目標、直近60日、マイルストーン |
| カレンダー | 月ごとのヒートマップ、日付ごとのメッセージ |
| 月次トレンド | 月ごとの増減、月別内訳、累計 |
| キーワード検索 | 送信者・種類で絞り込める全文検索、ハイライト |
| 比較 | 前期間との比較、または別のトークファイルとの比較 |
| シェアカード | 4:5 / 1:1 / 9:16 の画像を生成。3テーマ、PNG保存・共有 |
| トーク再生 | 一日の会話を再生（1x / 2x / 4x） |

デスクトップでは左サイドバー＋マルチカラム、スマートフォンでは下部タブ＋メニューシートに切り替わります。
ライト／ダークテーマに対応し、配色は WCAG AA のコントラストを満たすよう調整しています。

## 開発

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 型チェック → dist/ に単一HTMLを生成し、line_chat_analyzer_web.html にコピー
```

### 構成

```
src/
  App.tsx              アプリシェル、ファイル読み込み、画面切り替え
  nav.ts               画面定義とナビゲーション
  styles.css           デザイントークンと全スタイル
  lib/
    parse.ts           LINEトーク履歴パーサー（タブ区切り／CRLF／Shift-JISフォールバック）
    analytics.ts       集計ロジック（連続記録、時間帯、返信速度、ランキング、話題、盛り上がり検出など）
    share.ts           シェアカードのCanvas描画
    useStats.ts        期間スライスとテーマ／保存状態のフック
    sample.ts          サンプルデータ生成
  components/          アイコン、汎用UI、SVGチャート
  views/               12画面
legacy/
  line_chat_analyzer_web.html   旧・単一HTML版（参考用）
```

- React 18 + TypeScript + Vite
- チャートは外部ライブラリを使わない手書きSVG（軽量・テーマ追従・キーボード／スクリーンリーダー向けの説明付き）
- シェアカードは Canvas 2D で描画し、端末内でPNG化
- 単一HTML出力は `vite-plugin-singlefile`

## 公開（GitHub Pages）

`main` に push すると GitHub Actions が自動でビルドし、GitHub Pages に公開します
（`.github/workflows/deploy-pages.yml`）。手動実行は Actions タブの「Deploy to GitHub Pages」→「Run workflow」から。

初回だけ、リポジトリの **Settings → Pages → Build and deployment → Source** を
**GitHub Actions** に設定してください。公開URLは通常 `https://yutopias09.github.io/talk-log/` です。

### CI

`.github/workflows/ci.yml` が push / pull request 時に型チェックとビルドを実行し、
単一HTMLが外部アセットを参照していないこと（自己完結していること）を検証します。
ビルド成果物は Actions の Artifacts からダウンロードできます。

## プライバシー

- 読み込んだファイルは `FileReader` でブラウザ内だけに読み込まれます
- 解析結果・カード画像はどこにもアップロードされません
- Webフォント（Google Fonts）だけは読み込み時に通信します。オフラインでもシステムフォントで動作します

## 旧版

`legacy/line_chat_analyzer_web.html` に、リニューアル前の単一HTML版を残しています。

