// DOM要素の取得
const urlForm = document.getElementById('urlForm');
const generateBtn = document.getElementById('generateBtn');
const result = document.getElementById('result');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const generatedUrl = document.getElementById('generatedUrl');
const copyBtn = document.getElementById('copyBtn');
const translatedCampaign = document.getElementById('translatedCampaign');
const webAppUrlInput = document.getElementById('webAppUrl');
const saveWebAppUrlBtn = document.getElementById('saveWebAppUrl');

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
    const code = `function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    // データを追加
    sheet.appendRow([
      data.date,
      data.campaignName,
      data.couponCode,
      data.refPage || '',
      data.source,
      data.medium,
      data.url
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'データを追加しました'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
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

    // フォームデータの取得
    const refPageInput = document.getElementById('refPage').value.trim();
    // 先頭の / を削除
    const refPage = refPageInput.replace(/^\/+/, '');

    const formData = {
        baseUrl: 'https://fortune-cookie.tokyo/',
        utmSource: document.getElementById('utmSource').value,
        utmMedium: document.getElementById('utmMedium').value,
        couponCode: document.getElementById('couponCode').value.trim(),
        refPage: refPage,
        campaignDate: document.getElementById('campaignDate').value,
        campaignName: document.getElementById('campaignName').value.trim()
    };

    // ローディング表示
    loading.classList.remove('hidden');
    generateBtn.disabled = true;

    try {
        // キャンペーン名を翻訳
        const translatedName = await translateToEnglish(formData.campaignName);

        // URLを生成
        const url = generateURL(formData, translatedName);

        // 結果を表示
        generatedUrl.value = url;
        translatedCampaign.innerHTML = `
            <strong>翻訳されたキャンペーン名:</strong> ${translatedName}
        `;
        result.classList.remove('hidden');

        // スプレッドシートに送信
        if (webAppUrl) {
            await sendToSpreadsheet({
                date: formData.campaignDate,
                campaignName: formData.campaignName,
                couponCode: formData.couponCode,
                refPage: formData.refPage,
                source: formData.utmSource,
                medium: formData.utmMedium,
                url: url
            });
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
        // フォールバック: input要素を選択してコピー
        generatedUrl.select();
        document.execCommand('copy');
        showMessage('URLをコピーしました', 'success');
    }
});

// 英語翻訳関数
async function translateToEnglish(text) {
    return await translateWithMyMemory(text);
}

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
        // エラー時は日本語をそのままサニタイズ（ローマ字として扱う）
        return sanitizeForURL(text);
    }
}

// URLに適した形式に変換
function sanitizeForURL(text) {
    return text
        // 英数字、ハイフン、アンダースコアのみを残す
        .replace(/[^a-zA-Z0-9\-_\s]/g, '')
        // スペースを削除
        .replace(/\s+/g, '')
        // 先頭・末尾のハイフンやアンダースコアを削除
        .replace(/^[-_]+|[-_]+$/g, '');
}

// URL生成関数
function generateURL(formData, translatedCampaignName) {
    // ベースURLの処理
    let baseUrl = formData.baseUrl;

    // 参照ページがある場合は追加
    if (formData.refPage) {
        // 末尾の / を削除してから、refPage を追加
        baseUrl = baseUrl.replace(/\/$/, '') + '/' + formData.refPage;
    }

    let url = new URL(baseUrl);

    // UTMパラメータの追加
    url.searchParams.set('utm_source', formData.utmSource);
    url.searchParams.set('utm_medium', formData.utmMedium);

    // クーポンコードの追加
    url.searchParams.set('code', formData.couponCode);

    // 日付とキャンペーン名の処理
    const date = formData.campaignDate.replace(/-/g, ''); // YYYYMMDD形式
    const versionParam = `${date}_${translatedCampaignName}`;
    url.searchParams.set('v', versionParam);

    return url.toString();
}

// スプレッドシートに送信
async function sendToSpreadsheet(data) {
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
            const result = await response.text();
            console.log('スプレッドシートに送信成功:', result);
            showMessage('スプレッドシートに記録しました', 'success');
        } else {
            console.warn('スプレッドシートへの送信が失敗しました:', response.status);
            showMessage('スプレッドシートへの記録に失敗しました', 'error');
        }

    } catch (err) {
        console.error('スプレッドシートへの送信エラー:', err);
        // エラーがあっても続行（URL生成は成功しているため）
        showMessage('スプレッドシートへの送信エラー（URL生成は成功）', 'warning');
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

    // タイプごとの背景色
    let backgroundColor = '#3b82f6'; // info
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
