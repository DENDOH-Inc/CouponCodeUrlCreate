# クーポンコード付きURL生成ツール

fortune-cookie.tokyo専用のUTMパラメータとクーポンコードを含むマーケティングURLを簡単に生成できるWebアプリケーションです。

## 機能

- **固定ベースURL**: `https://fortune-cookie.tokyo/` で統一
- **参照ページ設定**: 特定のページURLを生成（例: lottery/290）
- **UTMパラメータ設定**:
  - `utm_source`: 参照元（Twitter, Google等）
  - `utm_medium`: メディアタイプ（organic, cpc等）
- **クーポンコード追加**: URLにクーポンコードを付与
- **日付選択**: カレンダーでキャンペーン日付を選択
- **キャンペーン名自動翻訳**: 日本語のキャンペーン名を自動的に英語翻訳してURLに追加
- **ワンクリックコピー**: 生成されたURLを簡単にコピー
- **スプレッドシート連携**: 生成したURLを自動的にGoogleスプレッドシートに記録

## 使い方

### 基本的な使い方

1. **日付**をカレンダーから選択
2. **キャンペーン名**を日本語で入力（例: `リリクレフェアリー ex コンペティション`）
3. **クーポンコード**を入力（例: `FC39X`）
4. **参照ページ**を入力（例: `lottery/290`、TOPページの場合は空欄）
5. **参照先**と**メディア**をプルダウンから選択
6. **URLを生成**ボタンをクリック
7. 生成されたURLをコピーして使用

### 生成例

**例1: 特定ページの場合**

**入力:**
- 日付: `2026-01-23`
- キャンペーン名: `リリクレフェアリー ex コンペティション`
- クーポンコード: `FC39X`
- 参照ページ: `lottery/290`
- 参照先: `twitter`
- メディア: `organic`

**出力:**
```
https://fortune-cookie.tokyo/lottery/290?utm_source=twitter&utm_medium=organic&code=FC39X&v=20260123_LILLIESCLEFAIRYexCompetition
```

**例2: TOPページの場合**

**入力:**
- 日付: `2026-01-23`
- キャンペーン名: `新春キャンペーン`
- クーポンコード: `NY2026`
- 参照ページ: （空欄）
- 参照先: `google`
- メディア: `cpc`

**出力:**
```
https://fortune-cookie.tokyo/?utm_source=google&utm_medium=cpc&code=NY2026&v=20260123_NewYearCampaign
```

## スプレッドシート連携（オプション）

生成したURLを自動的にGoogleスプレッドシートに記録できます。

### 設定手順

1. **Googleスプレッドシートを作成**
   - 新しいスプレッドシートを作成
   - 1行目（見出し行）に以下を入力：
     ```
     日付 | キャンペーン名 | クーポンコード | 参照ページ | 参照先 | メディア | URL
     ```

2. **Apps Scriptを設定**
   - スプレッドシートで「拡張機能」→「Apps Script」を開く
   - `apps-script.gs` の内容をコピーして貼り付け（またはこのリポジトリからコピー）
   - 保存（プロジェクト名は任意）

3. **Web Appとしてデプロイ**
   - 「デプロイ」→「新しいデプロイ」をクリック
   - 種類：「ウェブアプリ」を選択
   - 次のユーザーとして実行：「自分」
   - アクセスできるユーザー：「全員」
   - 「デプロイ」をクリック

4. **URLを設定**
   - デプロイ後に表示されるWeb App URLをコピー
   - URL生成ツールの「スプレッドシート連携設定」に貼り付けて保存

5. **完了**
   - これでURL生成時に自動的にスプレッドシートに記録されます

### 記録される項目

- 日付
- キャンペーン名（日本語）
- クーポンコード
- 参照ページ（例: lottery/290、TOPページの場合は空欄）
- 参照先（utm_source）
- メディア（utm_medium）
- 生成されたURL

## 翻訳機能

MyMemory Translation API（無料、CORS対応、APIキー不要）を使用して、日本語のキャンペーン名を自動的に英語翻訳します。1日あたりの制限がありますが、通常の使用には十分です。

## GitHub Pagesでのデプロイ

### 手順

1. このリポジトリをGitHubにプッシュ

```bash
git add .
git commit -m "Add coupon code URL generator"
git push origin main
```

2. GitHubリポジトリの設定ページへ移動
   - リポジトリ > Settings > Pages

3. Source設定を変更
   - Branch: `main`
   - Folder: `/ (root)`
   - Save をクリック

4. 数分後、以下のURLでアクセス可能になります：
   ```
   https://[ユーザー名].github.io/CouponCodeUrlCreate/
   ```

### カスタムドメインの設定（オプション）

独自ドメインを使用する場合：
1. GitHub Pages設定でカスタムドメインを入力
2. DNSプロバイダーでCNAMEレコードを設定
3. HTTPSを有効化

## 技術スタック

- **HTML5**: セマンティックなマークアップ
- **CSS3**: モダンでレスポンシブなデザイン
- **Vanilla JavaScript**: 依存関係なし、軽量で高速
- **MyMemory Translation API**: 無料の翻訳サービス
- **Google Apps Script**: スプレッドシート連携（オプション）

## ブラウザサポート

- Chrome / Edge (最新版)
- Firefox (最新版)
- Safari (最新版)
- モバイルブラウザ対応

## ライセンス

MIT License

## 開発

ローカルで開発する場合：

```bash
# リポジトリをクローン
git clone https://github.com/[ユーザー名]/CouponCodeUrlCreate.git
cd CouponCodeUrlCreate

# 任意のHTTPサーバーで起動（例: Python）
python -m http.server 8000

# ブラウザで http://localhost:8000 を開く
```

## 貢献

バグ報告や機能リクエストは、GitHubのIssuesで受け付けています。
