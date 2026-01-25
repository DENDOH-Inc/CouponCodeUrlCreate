/**
 * Google Apps Script - スプレッドシート連携用
 *
 * 設定手順:
 * 1. Googleスプレッドシートを新規作成
 * 2. 1行目に見出しを設定: 日付 | キャンペーン名 | クーポンコード | 参照先 | メディア | URL
 * 3. 「拡張機能」→「Apps Script」を開く
 * 4. このコードを貼り付けて保存
 * 5. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択
 * 6. 「次のユーザーとして実行」→「自分」
 * 7. 「アクセスできるユーザー」→「全員」を選択
 * 8. デプロイして、表示されたURLをツールに設定
 */

function doPost(e) {
  try {
    // リクエストの内容をログに記録（デバッグ用）
    Logger.log('Received request: ' + JSON.stringify(e));

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    // データを追加（見出し行の下に追加）
    sheet.appendRow([
      data.date,           // 日付
      data.campaignName,   // キャンペーン名
      data.couponCode,     // クーポンコード
      data.source,         // 参照先
      data.medium,         // メディア
      data.url             // URL
    ]);

    // CORS対応の成功レスポンス
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'データを追加しました'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // エラーをログに記録
    Logger.log('Error: ' + error.toString());

    // CORS対応のエラーレスポンス
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// OPTIONSリクエスト（プリフライト）への対応
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'This endpoint accepts POST requests only'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * テスト用関数（オプション）
 * Apps Scriptエディタで実行して動作確認できます
 */
function testDoPost() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        date: '2026-01-25',
        campaignName: 'テストキャンペーン',
        couponCode: 'TEST123',
        source: 'twitter',
        medium: 'organic',
        url: 'https://fortune-cookie.tokyo/?utm_source=twitter&utm_medium=organic&code=TEST123&v=20260125_TestCampaign'
      })
    }
  };

  const result = doPost(testData);
  Logger.log(result.getContent());
}
