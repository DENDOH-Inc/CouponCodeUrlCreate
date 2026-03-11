// DOM要素の取得
const urlForm = document.getElementById('urlForm');
const generateBtn = document.getElementById('generateBtn');
const result = document.getElementById('result');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const generatedUrl = document.getElementById('generatedUrl');
const copyBtn = document.getElementById('copyBtn');
const utmDetails = document.getElementById('utmDetails');
const spreadsheetStatus = document.getElementById('spreadsheetStatus');
const webAppUrlInput = document.getElementById('webAppUrl');
const saveWebAppUrlBtn = document.getElementById('saveWebAppUrl');

// 翻訳ペアのフィールド
const campaignGroupJaSelect = document.getElementById('campaignGroupJa');
const utmCampaignDisplay = document.getElementById('utmCampaign');
const targetSegmentJaSelect = document.getElementById('targetSegmentJa');
const utmTermDisplay = document.getElementById('utmTerm');
const creativeNameJaInput = document.getElementById('creativeNameJa');
const utmContentDisplay = document.getElementById('utmContent');

// キャンペーングループ選択時 → utm_campaign表示を更新
campaignGroupJaSelect.addEventListener('change', () => {
    const val = campaignGroupJaSelect.value;
    if (val) {
        utmCampaignDisplay.textContent = val;
    } else {
        utmCampaignDisplay.textContent = 'キャンペーンを選択すると表示されます';
    }
});

// ターゲット区分選択時 → utm_term表示を更新
targetSegmentJaSelect.addEventListener('change', () => {
    const val = targetSegmentJaSelect.value;
    if (val) {
        utmTermDisplay.textContent = val;
    } else {
        utmTermDisplay.textContent = 'ターゲットを選択すると表示されます';
    }
});

creativeNameJaInput.addEventListener('blur', async () => {
    if (creativeNameJaInput.value.trim()) {
        const translated = await translateWithMyMemory(creativeNameJaInput.value.trim());
        utmContentDisplay.textContent = translated;
    }
});

// LocalStorageからWeb App URLを読み込む
const STORAGE_KEY = 'google_apps_script_web_app_url';
let webAppUrl = localStorage.getItem(STORAGE_KEY) || '';
if (webAppUrl) {
    webAppUrlInput.value = webAppUrl;
}

// 今日の日付をデフォルトとして設定
document.getElementById('campaignDate').valueAsDate = new Date();

// キャンペーンマスター取得
async function loadCampaignMaster() {
    if (!webAppUrl) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'マスター未取得（GAS設定が必要です）';
        opt.disabled = true;
        campaignGroupJaSelect.appendChild(opt);
        return;
    }
    try {
        const response = await fetch(webAppUrl + '?action=campaigns');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const campaigns = await response.json();
        if (campaigns.error) throw new Error(campaigns.error);
        if (!Array.isArray(campaigns) || campaigns.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'キャンペーンマスターにデータがありません';
            opt.disabled = true;
            campaignGroupJaSelect.appendChild(opt);
            return;
        }
        campaigns.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.utm_campaign;
            opt.textContent = c.campaign_name;
            campaignGroupJaSelect.appendChild(opt);
        });
    } catch (err) {
        console.warn('キャンペーンマスター取得エラー:', err);
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'マスター取得失敗（GAS設定を確認してください）';
        opt.disabled = true;
        campaignGroupJaSelect.appendChild(opt);
    }
}
loadCampaignMaster();

// ターゲット区分マスター取得
async function loadTargetMaster() {
    if (!webAppUrl) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'マスター未取得（GAS設定が必要です）';
        opt.disabled = true;
        targetSegmentJaSelect.appendChild(opt);
        return;
    }
    try {
        const response = await fetch(webAppUrl + '?action=targets');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const targets = await response.json();
        if (targets.error) throw new Error(targets.error);
        if (!Array.isArray(targets) || targets.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'ターゲット区分マスターにデータがありません';
            opt.disabled = true;
            targetSegmentJaSelect.appendChild(opt);
            return;
        }
        targets.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.utm_term;
            opt.textContent = t.target_name;
            targetSegmentJaSelect.appendChild(opt);
        });
    } catch (err) {
        console.warn('ターゲット区分マスター取得エラー:', err);
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'マスター取得失敗（GAS設定を確認してください）';
        opt.disabled = true;
        targetSegmentJaSelect.appendChild(opt);
    }
}
loadTargetMaster();

// 参照先マスター取得
const utmSourceSelect = document.getElementById('utmSource');
async function loadSourceMaster() {
    if (!webAppUrl) return;
    try {
        const response = await fetch(webAppUrl + '?action=sources');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const sources = await response.json();
        if (sources.error) throw new Error(sources.error);
        if (!Array.isArray(sources) || sources.length === 0) return;
        sources.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.utm_source;
            opt.textContent = s.source_name;
            utmSourceSelect.appendChild(opt);
        });
    } catch (err) {
        console.warn('参照先マスター取得エラー:', err);
    }
}
loadSourceMaster();

// メディアマスター取得
const utmMediumSelect = document.getElementById('utmMedium');
async function loadMediumMaster() {
    if (!webAppUrl) return;
    try {
        const response = await fetch(webAppUrl + '?action=mediums');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const mediums = await response.json();
        if (mediums.error) throw new Error(mediums.error);
        if (!Array.isArray(mediums) || mediums.length === 0) return;
        mediums.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.utm_medium;
            opt.textContent = m.medium_name;
            utmMediumSelect.appendChild(opt);
        });
    } catch (err) {
        console.warn('メディアマスター取得エラー:', err);
    }
}
loadMediumMaster();

// クーポンコードマスター取得
const couponCodeSelect = document.getElementById('couponCode');
async function loadCouponMaster() {
    if (!webAppUrl) return;
    try {
        const response = await fetch(webAppUrl + '?action=coupons');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const coupons = await response.json();
        if (coupons.error) throw new Error(coupons.error);
        if (!Array.isArray(coupons) || coupons.length === 0) return;
        coupons.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.coupon_code;
            opt.textContent = c.coupon_code;
            couponCodeSelect.appendChild(opt);
        });
    } catch (err) {
        console.warn('クーポンコードマスター取得エラー:', err);
    }
}
loadCouponMaster();

// Web App URL保存
saveWebAppUrlBtn.addEventListener('click', () => {
    const url = webAppUrlInput.value.trim();
    if (url) {
        localStorage.setItem(STORAGE_KEY, url);
        webAppUrl = url;
        showMessage('Web App URLを保存しました', 'success');
        // マスターを再取得
        campaignGroupJaSelect.innerHTML = '<option value="">キャンペーンを選択してください</option>';
        utmCampaignDisplay.textContent = 'キャンペーンを選択すると表示されます';
        loadCampaignMaster();
        targetSegmentJaSelect.innerHTML = '<option value="">ターゲットを選択してください</option>';
        utmTermDisplay.textContent = 'ターゲットを選択すると表示されます';
        loadTargetMaster();
        couponCodeSelect.innerHTML = '<option value="">なし</option>';
        loadCouponMaster();
        utmSourceSelect.innerHTML = '<option value="">選択してください</option>';
        loadSourceMaster();
        utmMediumSelect.innerHTML = '<option value="">選択してください</option>';
        loadMediumMaster();
    } else {
        localStorage.removeItem(STORAGE_KEY);
        webAppUrl = '';
        showMessage('Web App URLを削除しました', 'success');
        campaignGroupJaSelect.innerHTML = '<option value="">キャンペーンを選択してください</option>';
        utmCampaignDisplay.textContent = 'キャンペーンを選択すると表示されます';
        targetSegmentJaSelect.innerHTML = '<option value="">ターゲットを選択してください</option>';
        utmTermDisplay.textContent = 'ターゲットを選択すると表示されます';
        couponCodeSelect.innerHTML = '<option value="">なし</option>';
        utmSourceSelect.innerHTML = '<option value="">選択してください</option>';
        utmMediumSelect.innerHTML = '<option value="">選択してください</option>';
    }
});

// Apps Scriptコードをコピー
function copyScriptCode() {
    const code = `function generateManagementId(sheet, source, medium, dateStr) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sourceMap = { 'twitter': 'X' };
    var s = sourceMap[(source || '').toLowerCase()] || (source || 'X').charAt(0).toUpperCase();
    var m = (medium || 'X').charAt(0).toUpperCase();
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
          if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
      }
    }
    return prefix + String(maxSeq + 1).padStart(3, '0');
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('クーポン付きURL管理テーブル');
    var data = JSON.parse(e.postData.contents);
    var managementId = generateManagementId(sheet, data.source, data.medium, data.date);
    var finalUrl = data.urlWithoutId;
    if (finalUrl.indexOf('?') !== -1) {
      finalUrl = finalUrl + '&utm_id=' + encodeURIComponent(managementId);
    } else {
      finalUrl = finalUrl + '?utm_id=' + encodeURIComponent(managementId);
    }
    sheet.appendRow([
      managementId, data.date,
      data.campaignGroupJa, data.utmCampaign,
      data.targetSegmentJa, data.utmTerm,
      data.creativeNameJa, data.utmContent,
      data.couponCode, data.refPage || '',
      data.sourceName, data.source,
      data.mediumName, data.medium, finalUrl
    ]);
    return ContentService.createTextOutput(JSON.stringify({
      success: true, message: 'データを追加しました',
      managementId: managementId, url: finalUrl
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false, message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  if (action === 'campaigns') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var masterSheet = ss.getSheetByName('キャンペーンマスター');
      if (!masterSheet) {
        return ContentService.createTextOutput(JSON.stringify({
          error: 'キャンペーンマスターシートが見つかりません'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      var lastRow = masterSheet.getLastRow();
      var campaigns = [];
      if (lastRow >= 2) {
        var data = masterSheet.getRange(2, 1, lastRow - 1, 3).getValues();
        for (var i = 0; i < data.length; i++) {
          if (data[i][0] || data[i][1] || data[i][2]) {
            campaigns.push({ id: data[i][0], campaign_name: data[i][1], utm_campaign: data[i][2] });
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify(campaigns))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({
        error: error.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  if (action === 'targets') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var masterSheet = ss.getSheetByName('ターゲット区分マスター');
      if (!masterSheet) {
        return ContentService.createTextOutput(JSON.stringify({
          error: 'ターゲット区分マスターシートが見つかりません'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      var lastRow = masterSheet.getLastRow();
      var targets = [];
      if (lastRow >= 2) {
        var data = masterSheet.getRange(2, 1, lastRow - 1, 3).getValues();
        for (var i = 0; i < data.length; i++) {
          if (data[i][0] || data[i][1] || data[i][2]) {
            targets.push({ id: data[i][0], target_name: data[i][1], utm_term: data[i][2] });
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify(targets))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({
        error: error.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  if (action === 'coupons') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var masterSheet = ss.getSheetByName('クーポンコードマスター');
      if (!masterSheet) {
        return ContentService.createTextOutput(JSON.stringify({
          error: 'クーポンコードマスターシートが見つかりません'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      var lastRow = masterSheet.getLastRow();
      var coupons = [];
      if (lastRow >= 2) {
        var data = masterSheet.getRange(2, 1, lastRow - 1, 2).getValues();
        for (var i = 0; i < data.length; i++) {
          if (data[i][0] || data[i][1]) {
            coupons.push({ id: data[i][0], coupon_code: data[i][1] });
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify(coupons))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({
        error: error.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  if (action === 'sources') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var masterSheet = ss.getSheetByName('参照先マスター');
      if (!masterSheet) {
        return ContentService.createTextOutput(JSON.stringify({
          error: '参照先マスターシートが見つかりません'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      var lastRow = masterSheet.getLastRow();
      var sources = [];
      if (lastRow >= 2) {
        var data = masterSheet.getRange(2, 1, lastRow - 1, 3).getValues();
        for (var i = 0; i < data.length; i++) {
          if (data[i][0] || data[i][1] || data[i][2]) {
            sources.push({ id: data[i][0], source_name: data[i][1], utm_source: data[i][2] });
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify(sources))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({
        error: error.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  if (action === 'mediums') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var masterSheet = ss.getSheetByName('メディアマスター');
      if (!masterSheet) {
        return ContentService.createTextOutput(JSON.stringify({
          error: 'メディアマスターシートが見つかりません'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      var lastRow = masterSheet.getLastRow();
      var mediums = [];
      if (lastRow >= 2) {
        var data = masterSheet.getRange(2, 1, lastRow - 1, 3).getValues();
        for (var i = 0; i < data.length; i++) {
          if (data[i][0] || data[i][1] || data[i][2]) {
            mediums.push({ id: data[i][0], medium_name: data[i][1], utm_medium: data[i][2] });
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify(mediums))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({
        error: error.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'Use ?action=campaigns, ?action=targets, ?action=coupons, ?action=sources, or ?action=mediums.'
  })).setMimeType(ContentService.MimeType.JSON);
}`;

    navigator.clipboard.writeText(code).then(() => {
        showMessage('Apps Scriptコードをコピーしました', 'success');
    }).catch(() => {
        alert('コピーに失敗しました。手動でコピーしてください。');
    });
}

// グローバルに公開
window.copyScriptCode = copyScriptCode;

// フォーム送信処理
urlForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // エラー表示をクリア
    hideError();
    result.classList.add('hidden');

    // フォームデータの取得
    const refPageInput = document.getElementById('refPage').value.trim();
    const refPage = refPageInput
        .replace(/^(https?:\/\/)?fortune-cookie\.tokyo\/?/, '')
        .replace(/^\/+/, '');

    const campaignDate = document.getElementById('campaignDate').value;

    // キャンペーングループ: selectのvalueがutm_campaign値
    let utmCampaignVal = campaignGroupJaSelect.value;
    let utmTermVal = targetSegmentJaSelect.value;
    let utmContentVal = utmContentDisplay.textContent.trim();
    // プレースホルダーテキストをクリア
    if (utmContentVal === '自動翻訳されます') utmContentVal = '';

    // ローディング表示
    loading.classList.remove('hidden');
    generateBtn.disabled = true;

    try {
        if (!utmContentVal && creativeNameJaInput.value.trim()) {
            utmContentVal = await translateWithMyMemory(creativeNameJaInput.value.trim());
            utmContentDisplay.textContent = utmContentVal;
        }

        const formData = {
            baseUrl: 'https://fortune-cookie.tokyo/',
            utmSource: document.getElementById('utmSource').value,
            utmMedium: document.getElementById('utmMedium').value,
            couponCode: document.getElementById('couponCode').value.trim(),
            refPage: refPage,
            campaignDate: campaignDate,
            utmCampaign: utmCampaignVal,
            utmTerm: utmTermVal,
            utmContent: utmContentVal
        };

        // Phase 1: クライアント側で暫定URL生成（utm_idなし）
        const urlWithoutId = generateURL(formData);

        const fullUtmCampaign = formData.utmCampaign;

        // 結果を表示（暫定 - utm_idなし）
        generatedUrl.value = urlWithoutId;
        let managementId = '';

        // Phase 2: GASに送信
        if (webAppUrl) {
            const gasResult = await sendToSpreadsheet({
                date: formData.campaignDate,
                campaignGroupJa: campaignGroupJaSelect.selectedOptions[0].textContent,
                utmCampaign: fullUtmCampaign,
                targetSegmentJa: targetSegmentJaSelect.selectedOptions[0].textContent,
                utmTerm: formData.utmTerm,
                creativeNameJa: creativeNameJaInput.value.trim(),
                utmContent: formData.utmContent,
                couponCode: formData.couponCode,
                refPage: formData.refPage,
                sourceName: utmSourceSelect.selectedOptions[0].textContent,
                source: formData.utmSource,
                mediumName: utmMediumSelect.selectedOptions[0].textContent,
                medium: formData.utmMedium,
                urlWithoutId: urlWithoutId
            });

            if (gasResult && gasResult.url) {
                generatedUrl.value = gasResult.url;
            }
            if (gasResult && gasResult.managementId) {
                managementId = gasResult.managementId;
            }
        } else {
            spreadsheetStatus.textContent = '⚠️ GAS未設定のため、utm_idなしのURLです。スプレッドシート連携を設定すると管理IDが自動採番されます。';
            spreadsheetStatus.className = 'spreadsheet-status warning';
        }

        // 詳細表示
        utmDetails.innerHTML = `
            <strong>utm_source:</strong> ${formData.utmSource}<br>
            <strong>utm_medium:</strong> ${formData.utmMedium}<br>
            <strong>utm_campaign:</strong> ${fullUtmCampaign}<br>
            <strong>utm_term:</strong> ${formData.utmTerm || '(未設定)'}<br>
            <strong>utm_content:</strong> ${formData.utmContent || '(未設定)'}<br>
            <strong>utm_id:</strong> ${managementId || '(GAS連携時に自動採番)'}
        `;
        result.classList.remove('hidden');

    } catch (err) {
        showError('URLの生成中にエラーが発生しました: ' + err.message);
    } finally {
        loading.classList.add('hidden');
        generateBtn.disabled = false;
    }
});

// コピーボタン
copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(generatedUrl.value);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'コピーしました！';
        copyBtn.classList.add('copied');

        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        generatedUrl.select();
        document.execCommand('copy');
        showMessage('URLをコピーしました', 'success');
    }
});

// MyMemory Translation APIを使用した翻訳（無料、CORS対応）
async function translateWithMyMemory(text) {
    try {
        const encodedText = encodeURIComponent(text);
        const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=ja|en`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('翻訳APIのリクエストに失敗しました');
        }

        const data = await response.json();

        if (data.responseStatus === 200 && data.responseData) {
            const translated = data.responseData.translatedText;
            return sanitizeForURL(translated);
        } else {
            throw new Error('翻訳結果の取得に失敗しました');
        }
    } catch (err) {
        console.warn('翻訳APIエラー、日本語のままURLに使用します:', err);
        return sanitizeForURL(text);
    }
}

// 翻訳結果から大文字の頭文字を抽出して小文字に（例: "New User" → "nu"）
async function translateToInitials(text) {
    try {
        const encodedText = encodeURIComponent(text);
        const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=ja|en`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('翻訳APIのリクエストに失敗しました');
        const data = await response.json();
        if (data.responseStatus === 200 && data.responseData) {
            const translated = data.responseData.translatedText;
            // スペース区切り＋キャメルケースも分割して頭文字を取得
            const words = translated
                .split(/\s+/)
                .flatMap(w => w.split(/(?=[A-Z])/))
                .filter(w => /[a-zA-Z0-9]/.test(w));
            let initials = words
                .map(w => w.match(/[a-zA-Z0-9]/)[0])
                .join('')
                .toLowerCase();
            // 1単語のみの場合は先頭2文字にする
            if (initials.length === 1 && words.length > 0) {
                const first = words[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                initials = first.substring(0, 2);
            }
            if (initials.length >= 1) {
                return initials.substring(0, initials.length);
            }
            return sanitizeForURL(translated);
        }
        throw new Error('翻訳結果の取得に失敗しました');
    } catch (err) {
        console.warn('翻訳APIエラー:', err);
        return sanitizeForURL(text);
    }
}

// URLに適した形式に変換（小文字、アンダースコア区切り）
function sanitizeForURL(text) {
    return text
        .replace(/[^a-zA-Z0-9\-_\s]/g, '')
        .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase分割
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')  // ABCDef → ABC Def
        .replace(/[\s_-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();
}

// URL生成関数（utm_idなし）
function generateURL(formData) {
    let baseUrl = formData.baseUrl;

    if (formData.refPage) {
        baseUrl = baseUrl.replace(/\/$/, '') + '/' + formData.refPage;
    }

    let url = new URL(baseUrl);

    url.searchParams.set('utm_source', formData.utmSource);
    url.searchParams.set('utm_medium', formData.utmMedium);

    url.searchParams.set('utm_campaign', formData.utmCampaign);

    // utm_term
    if (formData.utmTerm) {
        url.searchParams.set('utm_term', formData.utmTerm);
    }

    // utm_content
    if (formData.utmContent) {
        url.searchParams.set('utm_content', formData.utmContent);
    }

    // クーポンコード
    if (formData.couponCode) {
        url.searchParams.set('code', formData.couponCode);
    }

    return url.toString();
}

// スプレッドシートに送信（レスポンスからmanagementIdとurlを返却）
async function sendToSpreadsheet(data) {
    spreadsheetStatus.textContent = '';
    spreadsheetStatus.className = 'spreadsheet-status';

    try {
        console.log('スプレッドシートに送信中...', data);

        const response = await fetch(webAppUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(data),
            redirect: 'follow'
        });

        console.log('レスポンスステータス:', response.status);

        if (response.ok) {
            const resultText = await response.text();
            console.log('スプレッドシートに送信成功:', resultText);

            let parsed = null;
            try {
                parsed = JSON.parse(resultText);
            } catch (parseErr) {
                console.warn('レスポンスのパースに失敗:', parseErr);
            }

            if (parsed && parsed.managementId) {
                spreadsheetStatus.textContent = `✅ スプレッドシートに記録しました（管理ID: ${parsed.managementId}）`;
            } else {
                spreadsheetStatus.textContent = '✅ スプレッドシートに記録しました';
            }
            spreadsheetStatus.classList.add('success');
            showMessage('スプレッドシートに記録しました', 'success');

            return parsed;
        } else {
            console.warn('スプレッドシートへの送信が失敗しました:', response.status);
            spreadsheetStatus.textContent = '❌ スプレッドシートへの記録に失敗しました';
            spreadsheetStatus.classList.add('error');
            showMessage('スプレッドシートへの記録に失敗しました', 'error');
            return null;
        }

    } catch (err) {
        console.error('スプレッドシートへの送信エラー:', err);
        spreadsheetStatus.textContent = '⚠️ スプレッドシートへの送信エラー';
        spreadsheetStatus.classList.add('warning');
        showMessage('スプレッドシートへの送信エラー（URL生成は成功）', 'warning');
        return null;
    }
}

// エラー表示
function showError(message) {
    error.textContent = message;
    error.classList.remove('hidden');
    setTimeout(() => {
        hideError();
    }, 5000);
}

// エラー非表示
function hideError() {
    error.classList.add('hidden');
}

// メッセージ表示
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    let backgroundColor = '#3b82f6';
    if (type === 'success') backgroundColor = '#10b981';
    if (type === 'error') backgroundColor = '#ef4444';
    if (type === 'warning') backgroundColor = '#f59e0b';

    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${backgroundColor};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// アニメーション用CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
