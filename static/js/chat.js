document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. 懸浮視窗開關邏輯
    // ==========================================
    const chatBtn = document.getElementById('chat-widget-btn');
    const chatWindow = document.getElementById('chat-widget-window');
    const closeBtn = document.getElementById('chat-widget-close');

    // 點擊右下角按鈕：切換顯示/隱藏
    chatBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden-widget');
    });

    // 點擊視窗上的 X 按鈕：隱藏視窗
    closeBtn.addEventListener('click', () => {
        chatWindow.classList.add('hidden-widget');
    });

    // ==========================================
    // 2. 心靈園丁對話與記憶邏輯
    // ==========================================
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // 初始化：從 localStorage 讀取歷史對話，若無則建立空陣列
    let chatHistory = JSON.parse(localStorage.getItem('lms_chat_history')) || [];

    // 載入網頁時，將歷史對話渲染到畫面上
    chatHistory.forEach(msg => {
        appendMessage(msg.role === 'user' ? '我' : '心靈園丁', msg.content);
    });

    // 負責將文字顯示到畫面的共用函式
    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.style.margin = "10px 0";
        msgDiv.style.padding = "10px";
        msgDiv.style.borderRadius = "8px";
        msgDiv.style.backgroundColor = sender === '我' ? '#e3f2fd' : '#f1f8e9';
        msgDiv.innerHTML = `<strong>${sender}：</strong> ${text}`;
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight; 
    }

    // 監聽送出按鈕點擊事件
    sendBtn.addEventListener('click', async () => {
        const text = userInput.value.trim();
        if (!text) return;

        // 顯示使用者訊息，並存入歷史陣列
        appendMessage('我', text);
        chatHistory.push({ role: 'user', content: text });
        userInput.value = '';
        
        const loadingId = 'loading-' + Date.now();
        chatContainer.innerHTML += `<div id="${loadingId}" style="color: gray; font-style: italic;">園丁正在整理思緒...</div>`;

        try {
            // 將包含歷史紀錄的陣列發送給 Flask 後端
            const response = await fetch('http://127.0.0.1:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: chatHistory }) // 打包整個陣列送出
            });
            
            const data = await response.json();
            document.getElementById(loadingId).remove();
            
            if (response.ok) {
                // 顯示 AI 回覆，並存入歷史陣列
                appendMessage('心靈園丁', data.reply);
                chatHistory.push({ role: 'model', content: data.reply });
                
                // 更新 localStorage，確保重整網頁後記憶還在
                localStorage.setItem('lms_chat_history', JSON.stringify(chatHistory));
            } else {
                appendMessage('系統', data.error || '連線發生錯誤');
            }
            
        } catch (error) {
            document.getElementById(loadingId).remove();
            appendMessage('系統', '無法連接到伺服器，請確認 Flask 後端已啟動。');
        }
    });

    // 讓使用者按 Enter 鍵也能送出訊息，提升操作體驗
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });
});