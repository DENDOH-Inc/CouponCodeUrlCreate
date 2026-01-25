/**
 * Google Apps Script - スプレッドシート連携用（完全版）
 *
 * このコードをすべてコピーして、Apps Scriptエディタに貼り付けてください
 */

function doPost(e) {
  try {
    // リクエストの内容をログに記録
    Logger.log('=== 受信したリクエスト ===');
    Logger.log(JSON.stringify(e));

    // パラメータの確認
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('リクエストデータが不正です');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    Logger.log('=== パースしたデータ ===');
    Logger.log(JSON.stringify(data));

    // データを追加（見出し行の下に追加）
    sheet.appendRow([
      data.date,           // 日付
      data.campaignName,   // キャンペーン名
      data.couponCode,     // クーポンコード
      data.refPage || '',  // 参照ページ（空の場合は空文字）
      data.source,         // 参照先
      data.medium,         // メディア
      data.url             // URL
    ]);

    Logger.log('=== データ追加成功 ===');

    // 成功レスポンス
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'データを追加しました',
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // エラーをログに記録
    Logger.log('=== エラー発生 ===');
    Logger.log(error.toString());
    Logger.log(error.stack);

    // エラーレスポンス
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GETリクエストへの対応（エンドポイント確認用）
function doGet(e) {
  Logger.log('=== GETリクエスト受信 ===');
  Logger.log(JSON.stringify(e));

  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Google Apps Script Web App is working. Use POST method to submit data.',
      endpoint: 'ready',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * テスト用関数
 * Apps Scriptエディタでこの関数を選択して「実行」をクリックすると、
 * スプレッドシートにテストデータが追加されます
 */
function testDoPost() {
  Logger.log('=== テスト実行開始 ===');

  const testData = {
    postData: {
      contents: JSON.stringify({
        date: '2026-01-25',
        campaignName: 'テストキャンペーン',
        couponCode: 'TEST123',
        refPage: 'lottery/290',
        source: 'twitter',
        medium: 'organic',
        url: 'https://fortune-cookie.tokyo/lottery/290?utm_source=twitter&utm_medium=organic&code=TEST123&v=20260125_TestCampaign'
      })
    }
  };

  const result = doPost(testData);
  Logger.log('=== テスト結果 ===');
  Logger.log(result.getContent());

  return result;
}

/**
 * スプレッドシートを初期化（見出し行を追加）
 * 初回のみ実行してください
 */
function setupSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // 1行目に見出しを設定
  sheet.getRange(1, 1, 1, 7).setValues([[
    '日付',
    'キャンペーン名',
    'クーポンコード',
    '参照ページ',
    '参照先',
    'メディア',
    'URL'
  ]]);

  // 見出し行をフォーマット
  sheet.getRange(1, 1, 1, 7)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('white');

  // 列幅を自動調整
  sheet.autoResizeColumns(1, 7);

  Logger.log('スプレッドシートの初期化が完了しました');
}
