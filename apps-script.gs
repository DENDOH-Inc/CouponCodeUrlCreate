/**
 * Google Apps Script - スプレッドシート連携用（UTM 4層構造対応版）
 *
 * 設定手順:
 * 1. Googleスプレッドシートを新規作成
 * 2. 1行目に見出しを設定: 管理ID | 日付 | キャンペーングループ(日本語) | utm_campaign | ターゲット区分(日本語) | utm_term | 試作名(日本語) | utm_content | クーポンコード | 参照ページ | 参照先 | メディア | 生成URL
 * 3. 「拡張機能」→「Apps Script」を開く
 * 4. このコードを貼り付けて保存
 * 5. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択
 * 6. 「次のユーザーとして実行」→「自分」
 * 7. 「アクセスできるユーザー」→「全員」を選択
 * 8. デプロイして、表示されたURLをツールに設定
 */

/**
 * 管理ID自動生成
 * 形式: {Source頭文字}{Medium頭文字}-YYMMDD-NNN (例: TC-260301-001)
 */
function generateManagementId(sheet, source, medium, dateStr) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sourceMap = { 'twitter': 'X' };
    var s = sourceMap[(source || '').toLowerCase()] || (source || 'X').charAt(0).toUpperCase();
    var m = (medium || 'X').charAt(0).toUpperCase();
    // dateStr: "2026-03-01" → "260301"
    var yymmdd = dateStr.replace(/-/g, '').substring(2);
    var prefix = s + m + '-' + yymmdd + '-';

    var lastRow = sheet.getLastRow();
    var maxSeq = 0;

    if (lastRow >= 2) {
      var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        var id = String(ids[i][0]);
        if (id.indexOf(prefix) === 0) {
          var seq = parseInt(id.substring(prefix.length), 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    }

    var newSeq = String(maxSeq + 1).padStart(3, '0');
    return prefix + newSeq;
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  try {
    Logger.log('Received request: ' + JSON.stringify(e));

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // 管理IDを生成
    var managementId = generateManagementId(sheet, data.source, data.medium, data.date);

    // 受信URLにutm_idを付加
    var finalUrl = data.urlWithoutId;
    if (finalUrl.indexOf('?') !== -1) {
      finalUrl = finalUrl + '&utm_id=' + encodeURIComponent(managementId);
    } else {
      finalUrl = finalUrl + '?utm_id=' + encodeURIComponent(managementId);
    }

    // 13列でデータを追加
    sheet.appendRow([
      managementId,              // 1. 管理ID
      data.date,                 // 2. 日付
      data.campaignGroupJa,      // 3. キャンペーングループ(日本語)
      data.utmCampaign,          // 4. utm_campaign
      data.targetSegmentJa,      // 5. ターゲット区分(日本語)
      data.utmTerm,              // 6. utm_term
      data.creativeNameJa,       // 7. 試作名(日本語)
      data.utmContent,           // 8. utm_content
      data.couponCode,           // 9. クーポンコード
      data.refPage || '',        // 10. 参照ページ
      data.source,               // 11. 参照先
      data.medium,               // 12. メディア
      finalUrl                   // 13. 生成URL
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'データを追加しました',
        managementId: managementId,
        url: finalUrl
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error: ' + error.toString());

    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GETリクエスト対応（キャンペーンマスター取得 / ステータス確認）
function doGet(e) {
  var action = e && e.parameter && e.parameter.action;

  if (action === 'campaigns') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var masterSheet = ss.getSheetByName('キャンペーンマスター');
      if (!masterSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({ error: 'キャンペーンマスターシートが見つかりません' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var lastRow = masterSheet.getLastRow();
      var campaigns = [];
      if (lastRow >= 2) {
        var data = masterSheet.getRange(2, 1, lastRow - 1, 3).getValues();
        for (var i = 0; i < data.length; i++) {
          if (data[i][0] || data[i][1] || data[i][2]) {
            campaigns.push({
              id: data[i][0],
              campaign_name: data[i][1],
              utm_campaign: data[i][2]
            });
          }
        }
      }
      return ContentService
        .createTextOutput(JSON.stringify(campaigns))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === 'targets') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var masterSheet = ss.getSheetByName('ターゲット区分マスター');
      if (!masterSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({ error: 'ターゲット区分マスターシートが見つかりません' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var lastRow = masterSheet.getLastRow();
      var targets = [];
      if (lastRow >= 2) {
        var data = masterSheet.getRange(2, 1, lastRow - 1, 3).getValues();
        for (var i = 0; i < data.length; i++) {
          if (data[i][0] || data[i][1] || data[i][2]) {
            targets.push({
              id: data[i][0],
              target_name: data[i][1],
              utm_term: data[i][2]
            });
          }
        }
      }
      return ContentService
        .createTextOutput(JSON.stringify(targets))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === 'coupons') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var masterSheet = ss.getSheetByName('クーポンコードマスター');
      if (!masterSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({ error: 'クーポンコードマスターシートが見つかりません' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var lastRow = masterSheet.getLastRow();
      var coupons = [];
      if (lastRow >= 2) {
        var data = masterSheet.getRange(2, 1, lastRow - 1, 2).getValues();
        for (var i = 0; i < data.length; i++) {
          if (data[i][0] || data[i][1]) {
            coupons.push({
              id: data[i][0],
              coupon_code: data[i][1]
            });
          }
        }
      }
      return ContentService
        .createTextOutput(JSON.stringify(coupons))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === 'sources') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var masterSheet = ss.getSheetByName('表_1');
      if (!masterSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({ error: '参照先マスターシート（表_1）が見つかりません' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var lastRow = masterSheet.getLastRow();
      var sources = [];
      if (lastRow >= 2) {
        var data = masterSheet.getRange(2, 1, lastRow - 1, 3).getValues();
        for (var i = 0; i < data.length; i++) {
          if (data[i][0] || data[i][1] || data[i][2]) {
            sources.push({
              id: data[i][0],
              source_name: data[i][1],
              utm_source: data[i][2]
            });
          }
        }
      }
      return ContentService
        .createTextOutput(JSON.stringify(sources))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  if (action === 'mediums') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var masterSheet = ss.getSheetByName('メディア一覧');
      if (!masterSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({ error: 'メディアマスターシート（メディア一覧）が見つかりません' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var lastRow = masterSheet.getLastRow();
      var mediums = [];
      if (lastRow >= 2) {
        var data = masterSheet.getRange(2, 1, lastRow - 1, 3).getValues();
        for (var i = 0; i < data.length; i++) {
          if (data[i][0] || data[i][1] || data[i][2]) {
            mediums.push({
              id: data[i][0],
              medium_name: data[i][1],
              utm_medium: data[i][2]
            });
          }
        }
      }
      return ContentService
        .createTextOutput(JSON.stringify(mediums))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Use ?action=campaigns, ?action=targets, ?action=coupons, ?action=sources, or ?action=mediums to get master data.'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * テスト用関数
 * Apps Scriptエディタで実行して動作確認できます
 */
function testDoPost() {
  var testData = {
    postData: {
      contents: JSON.stringify({
        date: '2026-03-02',
        campaignGroupJa: '30周年イベント',
        utmCampaign: '202603_30thanniversaryevent',
        targetSegmentJa: '新規ユーザー',
        utmTerm: 'newuser',
        creativeNameJa: '30thはじまりのガチャ緑',
        utmContent: 'gacha_gr_01',
        couponCode: 'FC39X',
        refPage: 'lottery/290',
        source: 'x',
        medium: 'cpc',
        urlWithoutId: 'https://fortune-cookie.tokyo/lottery/290?utm_source=x&utm_medium=cpc&utm_campaign=202603_30thanniversaryevent&utm_term=lal&utm_content=gacha_gr_01&code=FC39X'
      })
    }
  };

  var result = doPost(testData);
  Logger.log(result.getContent());
}
