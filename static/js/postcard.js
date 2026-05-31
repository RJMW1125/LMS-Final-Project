document.addEventListener('DOMContentLoaded', () => {
    const btnGenerate = document.getElementById('btn-generate-postcard');
    const loadingScreen = document.getElementById('loading-screen');
    const previewArea = document.getElementById('postcard-preview-area');
    const canvas = document.getElementById('postcard-canvas');
    const btnSaveGallery = document.getElementById('btn-save-gallery');
    
    // Gallery DOM
    const galleryContainer = document.getElementById('gallery-container');

    // 預設 fallback 迷因 (若使用者還沒抽過卡)
    const fallbackMemes = [
        'https://i.imgflip.com/1iruch.jpg', 
        'https://i.imgflip.com/2cp3na.jpg'
    ];

    let currentPostcardDataUrl = null;

    btnGenerate.addEventListener('click', async () => {
        // 1. 顯示 Loading
        previewArea.style.display = 'none';
        canvas.innerHTML = '';
        loadingScreen.style.display = 'block';
        btnGenerate.disabled = true;

        await new Promise(resolve => setTimeout(resolve, 1500)); // 假裝 AI 在畫圖

        // 2. 獲取本週使用者紀錄 (計算專注、焦慮與任務數)
        let userRecords = JSON.parse(localStorage.getItem('lms_user_records')) || [];
        let totalTasks = 0;
        let focusDays = 0;
        let anxiousDays = 0;
        
        // 簡單統計最近 7 天的資料
        const recentRecords = userRecords.slice(-7);
        recentRecords.forEach(r => {
            totalTasks += r.tasksCompleted || 0;
            if (r.primaryMood === 'focus') focusDays++;
            if (r.primaryMood === 'anxious') anxiousDays++;
        });

        // 3. 獲取最近抽到的迷因圖 (作為皮克敏)
        let memeGallery = JSON.parse(localStorage.getItem('lms_meme_gallery')) || [];
        let pikmin1 = fallbackMemes[0];
        let pikmin2 = fallbackMemes[1];
        
        if (memeGallery.length >= 2) {
            // 取最後兩張
            pikmin1 = memeGallery[memeGallery.length - 1].url;
            pikmin2 = memeGallery[memeGallery.length - 2].url;
        } else if (memeGallery.length === 1) {
            pikmin1 = memeGallery[0].url;
        }

        const todayDate = new Date().toISOString().split('T')[0];
        let weeklySummary = `本週你完成了 ${totalTasks} 項任務！其中有 ${focusDays} 天專注力爆棚。繼續保持！`;
        if (anxiousDays > focusDays) {
            weeklySummary = `本週有 ${anxiousDays} 天感到焦慮，但你依然撐過來了，共完成了 ${totalTasks} 項任務。辛苦了！`;
        }

        // 4. 繪製明信片 (Pikmin Bloom 風格)
        canvas.innerHTML = `
            <div id="postcard-element" class="postcard-container">
                <!-- 模擬旅行郵戳 -->
                <div class="postcard-stamp">
                    <span class="postcard-stamp-date">${todayDate}</span>
                    <span class="postcard-stamp-text">✓ ${totalTasks}</span>
                </div>
                
                <!-- 像皮克敏一樣在畫面上點綴的迷因圖 -->
                <img src="${pikmin1}" crossorigin="anonymous" class="postcard-meme postcard-meme-1">
                <img src="${pikmin2}" crossorigin="anonymous" class="postcard-meme postcard-meme-2">

                <!-- 統計資料與 AI 結語 -->
                <div class="postcard-content">
                    <div class="postcard-stats">
                        <span>🔥 專注: ${focusDays}天</span>
                        <span>💦 焦慮: ${anxiousDays}天</span>
                    </div>
                    <div class="postcard-ai-analysis">
                        <h4>🤖 園丁結語：</h4>
                        <p>${weeklySummary}</p>
                    </div>
                </div>
            </div>
        `;

        loadingScreen.style.display = 'none';
        previewArea.style.display = 'flex';
        btnGenerate.disabled = false;

        // 5. 將明信片預先轉成 Canvas / DataURL 方便下載與收藏
        setTimeout(() => {
            html2canvas(document.getElementById('postcard-element'), {
                scale: 2, 
                backgroundColor: null,
                useCORS: true,
                allowTaint: true
            }).then(renderedCanvas => {
                currentPostcardDataUrl = renderedCanvas.toDataURL('image/jpeg', 0.8);
            }).catch(err => {
                console.error("明信片截圖失敗：", err);
            });
        }, 500); // 稍微等待圖片載入
    });

    // --- 下載功能邏輯 ---
    const btnDownload = document.getElementById('btn-download');
    if (btnDownload) {
        btnDownload.onclick = () => {
            if (!currentPostcardDataUrl) return alert('圖片仍在產生中，請稍後再試！');
            const link = document.createElement('a');
            link.download = 'MemeLogic_心情明信片.jpg';
            link.href = currentPostcardDataUrl;
            link.click();
        };
    }

    // --- 收藏至圖鑑功能邏輯 ---
    if (btnSaveGallery) {
        btnSaveGallery.onclick = () => {
            if (!currentPostcardDataUrl) return alert('圖片仍在產生中，請稍後再試！');
            
            let postcardGallery = JSON.parse(localStorage.getItem('lms_postcard_gallery')) || [];
            
            // 避免重複收藏同一天的
            const todayDate = new Date().toISOString().split('T')[0];
            const alreadyExists = postcardGallery.some(p => p.date === todayDate);
            
            if (alreadyExists) {
                if(!confirm('今天已經收藏過明信片了，確定要覆蓋嗎？')) return;
                postcardGallery = postcardGallery.filter(p => p.date !== todayDate);
            }

            postcardGallery.push({
                id: 'pc_' + Date.now(),
                date: todayDate,
                image: currentPostcardDataUrl
            });
            
            localStorage.setItem('lms_postcard_gallery', JSON.stringify(postcardGallery));
            alert('⭐ 成功收藏至我的旅行圖鑑！');
            renderGallery();
        };
    }

    // --- 渲染圖鑑邏輯 ---
    function renderGallery() {
        if (!galleryContainer) return;
        
        let postcardGallery = JSON.parse(localStorage.getItem('lms_postcard_gallery')) || [];
        galleryContainer.innerHTML = '';
        
        if (postcardGallery.length === 0) {
            galleryContainer.innerHTML = '<p style="color: #999;">目前還沒有收藏任何明信片喔！</p>';
            return;
        }

        postcardGallery.reverse().forEach(pc => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
                <img src="${pc.image}" alt="Postcard on ${pc.date}">
                <div class="gallery-item-date">${pc.date}</div>
            `;
            
            // 點擊放大預覽 (簡單實作，另開視窗或放入 modal)
            item.onclick = () => {
                const w = window.open();
                w.document.write(`<img src="${pc.image}" style="max-width:100%; display:block; margin:auto;">`);
            };
            
            galleryContainer.appendChild(item);
        });
    }

    // 初始化時渲染圖鑑
    renderGallery();
    
    // ==========================================
    // 社群分享邏輯
    // ==========================================
    const btnShare = document.getElementById('btn-share');
    if (btnShare) {
        btnShare.onclick = async () => {
            const currentUrl = window.location.href;
            const isLocalhost = currentUrl.includes('127.0.0.1') || currentUrl.includes('localhost') || currentUrl.includes('file://');
            const displayUrl = isLocalhost ? 'https://memelogic-demo.app/my-postcard' : currentUrl;

            const shareData = {
                title: 'MemeLogic 專屬心情明信片',
                text: `我在 MemeLogic 收集到了新的旅行明信片！來看看我跟迷因們的冒險成果吧！🚀`,
                url: displayUrl
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                } else {
                    const textToCopy = `${shareData.text}\n連結: ${shareData.url}`;
                    await navigator.clipboard.writeText(textToCopy);
                    alert('已將專屬分享文案與連結複製到剪貼簿！');
                }
            } catch (err) {
                console.log('分享取消或發生異常狀態：', err);
            }
        };
    }
});