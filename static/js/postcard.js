window.initPostcardEvents = function() {
    const fallbackMemes = [
        'https://i.imgflip.com/2cp3na.jpg',
        'https://i.imgflip.com/9vct.jpg'
    ];

    if (!window.postcardGlobalEventsBound) {
        window.postcardGlobalEventsBound = true;
        window.currentPostcardData = null;

        document.addEventListener('click', (e) => {
            const targetBtn = e.target.closest('button') || e.target;
            
            // 1. 點擊產生日誌明信片 -> 顯示 Modal
            if (targetBtn.id === 'btn-generate-postcard') {
                const journalInput = document.getElementById('journal-input');
                const journalModal = document.getElementById('journal-modal');
                if (journalInput && journalModal) {
                    journalInput.value = '';
                    journalModal.style.display = 'flex';
                }
            }

            // 2. 取消產生日誌
            if (targetBtn.id === 'btn-cancel-journal') {
                const journalModal = document.getElementById('journal-modal');
                if (journalModal) journalModal.style.display = 'none';
            }

            // 3. 確定產生日誌
            if (targetBtn.id === 'btn-confirm-journal') {
                const journalInput = document.getElementById('journal-input');
                const journalModal = document.getElementById('journal-modal');
                if (journalInput && journalModal) {
                    const userJournal = journalInput.value.trim() || "今天是很棒的一天，繼續保持！";
                    journalModal.style.display = 'none';
                    window.generatePostcard(userJournal, fallbackMemes);
                }
            }

            // 4. 關閉 Lightbox
            if (targetBtn.id === 'btn-close-lightbox' || targetBtn.id === 'gallery-lightbox') {
                const galleryLightbox = document.getElementById('gallery-lightbox');
                const lightboxContent = document.getElementById('lightbox-content');
                if (galleryLightbox) galleryLightbox.style.display = 'none';
                if (lightboxContent) lightboxContent.innerHTML = '';
            }

            // 5. 收藏至圖鑑
            if (targetBtn.id === 'btn-save-gallery') {
                if (!window.currentPostcardData) return;
                let gallery = JSON.parse(localStorage.getItem('lms_postcard_gallery_data')) || [];
                gallery.push(window.currentPostcardData);
                localStorage.setItem('lms_postcard_gallery_data', JSON.stringify(gallery));
                alert('⭐ 成功收藏至您的旅行圖鑑！');
                window.loadGallery();
            }

            // 6. 下載圖片
            if (targetBtn.id === 'btn-download') {
                const el = document.getElementById('postcard-element');
                if (!el) return;
                if (typeof html2canvas === 'undefined') {
                    alert('載入截圖套件失敗，請稍後再試！');
                    return;
                }
                html2canvas(el, { useCORS: true, allowTaint: false }).then(canvasElement => {
                    const link = document.createElement('a');
                    link.download = "MemeLogic_Postcard_" + Date.now() + ".png";
                    link.href = canvasElement.toDataURL('image/png');
                    link.click();
                }).catch(err => {
                    console.error("html2canvas error:", err);
                    alert("產生圖片失敗，請重試！");
                });
            }

            // 7. 分享
            if (targetBtn.id === 'btn-share') {
                alert('🚀 分享功能即將推出！可以先下載圖片發到 IG 喔！');
            }
        });

        // 點擊外部區域也能關閉 Lightbox
        document.addEventListener('click', (e) => {
            const galleryLightbox = document.getElementById('gallery-lightbox');
            if (galleryLightbox && e.target === galleryLightbox) {
                galleryLightbox.style.display = 'none';
                const lightboxContent = document.getElementById('lightbox-content');
                if (lightboxContent) lightboxContent.innerHTML = '';
            }
        });
    }

    window.loadGallery();
};

window.generatePostcard = function(userJournal, fallbackMemes) {
    try {
        const currentBtnGenerate = document.getElementById('btn-generate-postcard');
        const currentLoadingScreen = document.getElementById('loading-screen');
        const currentPreviewArea = document.getElementById('postcard-preview-area');
        const currentCanvas = document.getElementById('postcard-canvas');

        if (!currentLoadingScreen || !currentPreviewArea || !currentCanvas) {
            console.error("generatePostcard: Missing DOM elements");
            return;
        }

        if (currentBtnGenerate) currentBtnGenerate.style.display = 'none';
        currentLoadingScreen.style.display = 'block';
        currentPreviewArea.style.display = 'none';

        setTimeout(() => {
            currentLoadingScreen.style.display = 'none';
            currentPreviewArea.style.display = 'flex';

            const totalTasks = (JSON.parse(localStorage.getItem('lms_todos')) || []).filter(t => t.completed).length;
            const records = JSON.parse(localStorage.getItem('lms_user_records')) || [];
            const focusDays = records.filter(r => r.mood === 'focus').length;
            const anxiousDays = records.filter(r => r.mood === 'anxious').length;

            let memeGallery = JSON.parse(localStorage.getItem('lms_meme_gallery')) || [];
            let pikmin1 = fallbackMemes[0];
            
            if (memeGallery.length >= 1) {
                pikmin1 = memeGallery[memeGallery.length - 1].url;
            }

            const todayDate = new Date().toISOString().split('T')[0];

            window.currentPostcardData = {
                id: 'pc_' + Date.now(),
                date: todayDate,
                tasks: totalTasks,
                focus: focusDays,
                anxious: anxiousDays,
                pikminUrl: pikmin1,
                journal: userJournal
            };

            currentCanvas.innerHTML = \
                <div id="postcard-element" class="postcard-container" style="background: url('https://www.transparenttextures.com/patterns/cream-paper.png'), #fffdfa; border: 15px solid white; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border-radius: 2px; padding: 20px; position: relative; min-height: 400px; width: 320px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; box-sizing: border-box;">
                    <div class="postcard-stamp" style="position: absolute; top: 20px; right: 20px; width: 90px; height: 90px; border: 3px solid #d9534f; border-radius: 50%; color: #d9534f; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: rotate(15deg); font-weight: bold; font-family: 'Courier New', Courier, monospace; opacity: 0.8; z-index: 5; background: rgba(255,255,255,0.4);">
                        <span class="postcard-stamp-date" style="font-size: 0.9em; margin-bottom: 2px;">\</span>
                        <span class="postcard-stamp-text" style="font-size: 1.1em; letter-spacing: 1px;">✓ \</span>
                    </div>
                    <img src="\" crossorigin="anonymous" class="postcard-meme postcard-meme-1" style="position: relative; width: 100%; flex-grow: 1; max-height: 260px; object-fit: contain; filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.2)); margin-top: 10px; margin-bottom: 15px; z-index: 2;">
                    <div class="postcard-content" style="z-index: 10; margin-top: auto; background: rgba(255, 255, 255, 0.85); padding: 15px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-around; border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; font-weight: bold; color: #444;">
                            <span>🔥 專注: \天</span>
                            <span>💦 焦慮: \天</span>
                        </div>
                        <h4 style="margin: 0 0 5px 0; color: #2c3e50; display: flex; align-items: center; gap: 5px;">✍️ 今日日誌：</h4>
                        <p style="color: #555; font-size: 0.95em; line-height: 1.5; margin: 0;">\</p>
                    </div>
                </div>
            \;
        }, 1000);
    } catch(err) {
        console.error("generatePostcard exception:", err);
        alert("產生時發生錯誤：" + err.message);
    }
};

window.loadGallery = function() {
    const galleryContainer = document.getElementById('gallery-container');
    if (!galleryContainer) return;
    
    let galleryData = JSON.parse(localStorage.getItem('lms_postcard_gallery_data')) || [];
    let oldGallery = JSON.parse(localStorage.getItem('lms_postcard_gallery')) || [];

    galleryContainer.innerHTML = '';

    if (galleryData.length === 0 && oldGallery.length === 0) {
        galleryContainer.innerHTML = '<p style="color: #999; grid-column: 1 / -1; text-align: center;">尚未收藏任何明信片，趕快去產生一張吧！</p>';
        return;
    }

    galleryData.forEach(item => {
        const cardItem = document.createElement('div');
        cardItem.className = 'gallery-item';
        cardItem.style.cursor = 'pointer';
        
        cardItem.addEventListener('click', () => {
            const galleryLightbox = document.getElementById('gallery-lightbox');
            const lightboxContent = document.getElementById('lightbox-content');
            if (!galleryLightbox || !lightboxContent) return;
            
            lightboxContent.innerHTML = \
                <div class="postcard-container" style="background: url('https://www.transparenttextures.com/patterns/cream-paper.png'), #fffdfa; border: 15px solid white; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border-radius: 2px; padding: 20px; position: relative; min-height: 400px; width: 320px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; box-sizing: border-box;">
                    <div class="postcard-stamp" style="position: absolute; top: 20px; right: 20px; width: 90px; height: 90px; border: 3px solid #d9534f; border-radius: 50%; color: #d9534f; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: rotate(15deg); font-weight: bold; font-family: 'Courier New', Courier, monospace; opacity: 0.8; z-index: 5; background: rgba(255,255,255,0.4);">
                        <span class="postcard-stamp-date" style="font-size: 0.9em; margin-bottom: 2px;">\</span>
                        <span class="postcard-stamp-text" style="font-size: 1.1em; letter-spacing: 1px;">✓ \</span>
                    </div>
                    <img src="\" crossorigin="anonymous" class="postcard-meme postcard-meme-1" style="position: relative; width: 100%; flex-grow: 1; max-height: 260px; object-fit: contain; filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.2)); margin-top: 10px; margin-bottom: 15px; z-index: 2;">
                    <div class="postcard-content" style="z-index: 10; margin-top: auto; background: rgba(255, 255, 255, 0.85); padding: 15px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-around; border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; font-weight: bold; color: #444;">
                            <span>🔥 專注: \天</span>
                            <span>💦 焦慮: \天</span>
                        </div>
                        <h4 style="margin: 0 0 5px 0; color: #2c3e50; display: flex; align-items: center; gap: 5px;">✍️ 今日日誌：</h4>
                        <p style="color: #555; font-size: 0.95em; line-height: 1.5; margin: 0;">\</p>
                    </div>
                </div>
            \;
            galleryLightbox.style.display = 'flex';
        });

        cardItem.innerHTML = \
            <div style="background: url('https://www.transparenttextures.com/patterns/cream-paper.png'), #fffdfa; border: 5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border-radius: 2px; padding: 10px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; position: relative; overflow: hidden; pointer-events: none;">
                <div style="position: absolute; top: 5px; right: 5px; border: 2px solid #d9534f; border-radius: 50%; color: #d9534f; transform: rotate(15deg); font-size: 0.7em; padding: 2px; text-align: center; font-weight: bold; opacity: 0.8; background: rgba(255,255,255,0.4); z-index: 5;">
                    <div>\</div>
                    <div>✓\</div>
                </div>
                <img src="\" crossorigin="anonymous" style="width: 100%; height: 150px; object-fit: contain; margin-bottom: 10px; z-index: 2; position: relative;">
                <div style="background: rgba(255,255,255,0.9); padding: 5px; border-radius: 4px; font-size: 0.8em; flex-grow: 1; z-index: 10;">
                    <div style="display:flex; justify-content: space-around; border-bottom: 1px dashed #ccc; padding-bottom: 5px; margin-bottom: 5px; font-weight: bold;">
                        <span>🔥 \</span>
                        <span>💦 \</span>
                    </div>
                    <p style="margin: 0; color: #555; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">\</p>
                </div>
            </div>
        \;
        galleryContainer.appendChild(cardItem);
    });

    oldGallery.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'gallery-item';
        galleryContainer.appendChild(img);
    });
};
