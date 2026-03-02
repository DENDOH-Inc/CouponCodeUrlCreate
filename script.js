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
const managementIdDisplay = document.getElementById('managementIdDisplay');
const webAppUrlInput = document.getElementById('webAppUrl');
const saveWebAppUrlBtn = document.getElementById('saveWebAppUrl');

// 翻訳ペアの入力フィールド
const campaignGroupJaInput = document.getElementById('campaignGroupJa');
const utmCampaignInput = document.getElementById('utmCampaign');
const targetSegmentJaInput = document.getElementById('targetSegmentJa');
const utmTermInput = document.getElementById('utmTerm');
const creativeNameJaInput = document.getElementById('creativeNameJa');
const utmContentInput = document.getElementById('utmContent');

// 手動編集追跡用Set
const manuallyEdited = new Set();

// UTMフィールドの手動入力追跡
[utmCampaignInput, utmTermInput, utmContentInput].forEach(input => {
    input.addEventListener('input', () => {
        manuallyEdited.add(input.id);
    });
});

// 日本語フィールドのblurイベントで自動翻訳
campaignGroupJaInput.addEventListener('blur', async () => {
    if (!manuallyEdited.has('utmCampaign') && campaignGroupJaInput.value.trim()) {
        const translated = await translateWithMyMemory(campaignGroupJaInput.value.trim());
        utmCampaignInput.value = translated;
    }
});

targetSegmentJaInput.addEventListener('blur', async () => {
    if (!manuallyEdited.has('utmTerm') && targetSegmentJaInput.value.trim()) {
        const translated = await translateWithMyMemory(targetSegmentJaInput.value.trim());
        utmTermInput.value = translated;
    }
});

creativeNameJaInput.addEventListener('blur', async () => {
    if (!manuallyEdited.has('utmContent') && creativeNameJaInput.value.trim()) {
        const translated = await translateWithMyMemory(creativeNameJaInput.value.trim());
        utmContentInput.value = translated;
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

// Web App URL保存
saveWebAppUrlBtn.addEventListener('click', () => {
    const url = webAppUrlInput.value.trim();
    if (url) {
        localStorage.setItem(STORAGE_KEY, url);
        webAppUrl = url;
        showMessage('Web App URLを保存しました', 'success');
    } else {
        localStorage.removeItem(STORAGE_KEY);
        webAppUrl = '';
        showMessage('Web App URLを削除しました', 'success');
    }
});

// Apps Scriptコードをコピー
function copyScriptCode() {
    const code = `function generateManagementId(sheet) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var now = new Date();
    var yy = String(now.getFullYear()).slice(-2);
    var mm = String(now.getMonth() + 1).padStart(2, '0');
    var prefix = 'XAD-' + yy + mm + '-';
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
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var managementId = generateManagementId(sheet);
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
      data.source, data.medium, finalUrl
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
    managementIdDisplay.classList.add('hidden');

    // フォームデータの取得
    const refPageInput = document.getElementById('refPage').value.trim();
    const refPage = refPageInput
        .replace(/^(https?:\/\/)?fortune-cookie\.tokyo\/?/, '')
        .replace(/^\/+/, '');

    const campaignDate = document.getElementById('campaignDate').value;

    // 翻訳値の取得（blur時に自動入力済み or 手動入力済み）
    // 未入力ならblur翻訳をトリガー
    let utmCampaignVal = utmCampaignInput.value.trim();
    let utmTermVal = utmTermInput.value.trim();
    let utmContentVal = utmContentInput.value.trim();

    // ローディング表示
    loading.classList.remove('hidden');
    generateBtn.disabled = true;

    try {
        // UTMフィールドが空なら翻訳を実行
        if (!utmCampaignVal && campaignGroupJaInput.value.trim()) {
            utmCampaignVal = await translateWithMyMemory(campaignGroupJaInput.value.trim());
            utmCampaignInput.value = utmCampaignVal;
        }
        if (!utmTermVal && targetSegmentJaInput.value.trim()) {
            utmTermVal = await translateWithMyMemory(targetSegmentJaInput.value.trim());
            utmTermInput.value = utmTermVal;
        }
        if (!utmContentVal && creativeNameJaInput.value.trim()) {
            utmContentVal = await translateWithMyMemory(creativeNameJaInput.value.trim());
            utmContentInput.value = utmContentVal;
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

        // utm_campaignの完全値を計算
        const yyyymm = formData.campaignDate.replace(/-/g, '').substring(0, 6);
        const fullUtmCampaign = `${yyyymm}_${formData.utmCampaign}`;

        // 結果を表示（暫定）
        generatedUrl.value = urlWithoutId;
        utmDetails.innerHTML = `
            <strong>utm_campaign:</strong> ${fullUtmCampaign}<br>
            <strong>utm_term:</strong> ${formData.utmTerm || '(未設定)'}<br>
            <strong>utm_content:</strong> ${formData.utmContent || '(未設定)'}
        `;
        result.classList.remove('hidden');

        // Phase 2: GASに送信
        if (webAppUrl) {
            const gasResult = await sendToSpreadsheet({
                date: formData.campaignDate,
                campaignGroupJa: campaignGroupJaInput.value.trim(),
                utmCampaign: fullUtmCampaign,
                targetSegmentJa: targetSegmentJaInput.value.trim(),
                utmTerm: formData.utmTerm,
                creativeNameJa: creativeNameJaInput.value.trim(),
                utmContent: formData.utmContent,
                couponCode: formData.couponCode,
                refPage: formData.refPage,
                source: formData.utmSource,
                medium: formData.utmMedium,
                urlWithoutId: urlWithoutId
            });

            // GASからの結果で表示を更新
            if (gasResult && gasResult.managementId) {
                managementIdDisplay.textContent = `管理ID: ${gasResult.managementId}`;
                managementIdDisplay.classList.remove('hidden');
            }
            if (gasResult && gasResult.url) {
                generatedUrl.value = gasResult.url;
            }
        } else {
            spreadsheetStatus.textContent = '⚠️ GAS未設定のため、utm_idなしのURLです。スプレッドシート連携を設定すると管理IDが自動採番されます。';
            spreadsheetStatus.className = 'spreadsheet-status warning';
        }

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

// URLに適した形式に変換
function sanitizeForURL(text) {
    return text
        .replace(/[^a-zA-Z0-9\-_\s]/g, '')
        .replace(/\s+/g, '')
        .replace(/^[-_]+|[-_]+$/g, '');
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

    // utm_campaign: YYYYMM_ + 翻訳値
    const yyyymm = formData.campaignDate.replace(/-/g, '').substring(0, 6);
    const campaignParam = `${yyyymm}_${formData.utmCampaign}`;
    url.searchParams.set('utm_campaign', campaignParam);

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
