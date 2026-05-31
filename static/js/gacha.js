document.addEventListener('DOMContentLoaded', () => {
    const btnDraw = document.getElementById('btn-draw-card');
    const tokenDisplay = document.getElementById('token-count');
    const revealArea = document.getElementById('card-reveal-area');

    // 初始化代幣顯示
    let tokens = parseInt(localStorage.getItem('lms_tokens')) || 15;
    if (tokenDisplay) tokenDisplay.innerText = tokens;

    const GIPHY_API_KEY = 'YOUR_GIPHY_API_KEY';

    const rarityConfig = {
        'SSR': { color: '#FFD700', keyword: 'epic win meme', title: '傳說迷因降臨', msg: '神蹟降臨！今天的你無人能擋。' },
        'SR': { color: '#C0C0C0', keyword: 'good job meme', title: '稀有迷因發現', msg: '不急不躁，這才是高手的境界。' },
        'N': { color: '#cd7f32', keyword: 'funny cat', title: '日常迷因', msg: '雖然很慌，但還是活下來了。' }
    };

    btnDraw.addEventListener('click', async () => {
        if (tokens <= 0) {
            alert('代幣不足啦！請先去完成今日任務！');
            return;
        }

        // 扣除代幣並儲存
        tokens -= 1;
        localStorage.setItem('lms_tokens', tokens);
        tokenDisplay.innerText = tokens;
        
        // 停用按鈕防連點
        btnDraw.disabled = true;

        // 決定稀有度
        const roll = Math.random();
        let rarity = 'N';
        if (roll < 0.05) rarity = 'SSR';
        else if (roll < 0.30) rarity = 'SR';

        const config = rarityConfig[rarity];

        // 渲染「卡背」準備翻牌動畫
        revealArea.classList.remove('hidden');
        revealArea.innerHTML = `
            <div id="gacha-card" style="
                width: 250px; 
                height: 350px; 
                margin: 20px auto; 
                perspective: 1000px;
                cursor: pointer;
            ">
                <div id="gacha-card-inner" style="
                    width: 100%; 
                    height: 100%; 
                    position: relative; 
                    transition: transform 0.8s; 
                    transform-style: preserve-3d;
                ">
                    <!-- 卡背 -->
                    <div style="
                        position: absolute; 
                        width: 100%; 
                        height: 100%; 
                        backface-visibility: hidden; 
                        background: linear-gradient(135deg, #2c3e50, #3498db);
                        border: 4px solid #fff;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 3em;
                        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    ">❓</div>
                    <!-- 卡面 (預設隱藏於背面) -->
                    <div id="gacha-card-front" style="
                        position: absolute; 
                        width: 100%; 
                        height: 100%; 
                        backface-visibility: hidden; 
                        background: white;
                        border: 4px solid ${config.color};
                        border-radius: 12px;
                        transform: rotateY(180deg);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        padding: 15px;
                        box-sizing: border-box;
                        box-shadow: 0 0 20px ${config.color}88;
                    ">
                        <span style="font-size: 1.2em; font-weight: bold; color: ${config.color};">【${rarity}】</span>
                        <h3 style="margin: 10px 0; color: #333; font-size: 1.1em; text-align: center;">${config.title}</h3>
                        <div id="gacha-img-container" style="flex-grow: 1; width: 100%; display: flex; align-items: center; justify-content: center;">
                            <span style="color: #999;">召喚中...</span>
                        </div>
                        <p style="color: #666; margin-top: 10px; font-size: 0.9em; text-align: center;"><i>"${config.msg}"</i></p>
                    </div>
                </div>
            </div>
        `;

        // 呼叫 GIPHY API 獲取圖片
        let finalImgUrl = '';
        try {
            if (GIPHY_API_KEY === 'YOUR_GIPHY_API_KEY') throw new Error("No API Key");
            const res = await fetch(`https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=${encodeURIComponent(config.keyword)}&rating=pg-13`);
            const data = await res.json();
            finalImgUrl = data.data.images.downsized_medium.url;
        } catch (err) {
            // Fallback
            const fallbackMemes = {
                'SSR': 'https://i.imgflip.com/2cp3na.jpg',
                'SR': 'https://i.imgflip.com/9vct.jpg',
                'N': 'https://i.imgflip.com/1iruch.jpg'
            };
            finalImgUrl = fallbackMemes[rarity];
        }

        // 載入圖片並存入 localStorage 圖鑑
        const imgEl = document.createElement('img');
        imgEl.src = finalImgUrl;
        imgEl.style.maxWidth = '100%';
        imgEl.style.maxHeight = '150px';
        imgEl.style.objectFit = 'contain';
        imgEl.style.borderRadius = '8px';
        
        const imgContainer = document.getElementById('gacha-img-container');
        imgContainer.innerHTML = '';
        imgContainer.appendChild(imgEl);

        // 記錄到 Gallery
        let gallery = JSON.parse(localStorage.getItem('lms_meme_gallery')) || [];
        gallery.push({
            id: 'meme_' + Date.now(),
            url: finalImgUrl,
            rarity: rarity,
            title: config.title,
            date: new Date().toISOString().split('T')[0]
        });
        localStorage.setItem('lms_meme_gallery', JSON.stringify(gallery));

        // Anime.js 3D 翻牌動畫
        if (typeof anime !== 'undefined') {
            anime({
                targets: '#gacha-card-inner',
                rotateY: 180,
                duration: 1000,
                easing: 'easeInOutSine',
                complete: function() {
                    btnDraw.disabled = false;
                }
            });
        } else {
            // Fallback 如果沒載入 Anime.js
            document.getElementById('gacha-card-inner').style.transform = 'rotateY(180deg)';
            btnDraw.disabled = false;
        }
    });
});