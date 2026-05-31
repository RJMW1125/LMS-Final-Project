document.addEventListener('DOMContentLoaded', () => {
    const btnStartDraw = document.getElementById('btn-start-draw-session');
    const tokenDisplay = document.getElementById('token-count');
    const spreadArea = document.getElementById('cards-spread-area');
    const revealArea = document.getElementById('card-reveal-area');
    const actionsArea = document.getElementById('gacha-actions');
    const btnDrawAgain = document.getElementById('btn-draw-again');

    let tokens = parseInt(localStorage.getItem('lms_tokens')) || 15;
    if (tokenDisplay) tokenDisplay.innerText = tokens;

    const GIPHY_API_KEY = 'YOUR_GIPHY_API_KEY';

    const rarityConfig = {
        'SSR': { color: '#FFD700', keyword: 'epic win meme', title: '傳說迷因降臨', msg: '神蹟降臨！今天的你無人能擋。' },
        'SR': { color: '#C0C0C0', keyword: 'good job meme', title: '稀有迷因發現', msg: '不急不躁，這才是高手的境界。' },
        'N': { color: '#cd7f32', keyword: 'funny cat', title: '日常迷因', msg: '雖然很慌，但還是活下來了。' }
    };

    // 一次性決定 3 張卡的資料
    async function generateCardsData() {
        const cards = [];
        for (let i = 0; i < 3; i++) {
            const roll = Math.random();
            let rarity = 'N';
            if (roll < 0.05) rarity = 'SSR';
            else if (roll < 0.25) rarity = 'SR';

            const config = rarityConfig[rarity];
            let finalImgUrl = '';
            
            try {
                if (GIPHY_API_KEY === 'YOUR_GIPHY_API_KEY') throw new Error("No API Key");
                const res = await fetch(`https://api.giphy.com/v1/gifs/random?api_key=${GIPHY_API_KEY}&tag=${encodeURIComponent(config.keyword)}&rating=pg-13`);
                const data = await res.json();
                finalImgUrl = data.data.images.downsized_medium.url;
            } catch (err) {
                const fallbackMemes = {
                    'SSR': 'https://i.imgflip.com/2cp3na.jpg',
                    'SR': 'https://i.imgflip.com/9vct.jpg',
                    'N': 'https://i.imgflip.com/1iruch.jpg'
                };
                finalImgUrl = fallbackMemes[rarity];
            }
            
            cards.push({ rarity, config, finalImgUrl });
        }
        return cards;
    }

    btnStartDraw.addEventListener('click', async () => {
        if (tokens <= 0) {
            alert('代幣不足啦！請先去完成今日任務！');
            return;
        }

        tokens -= 1;
        localStorage.setItem('lms_tokens', tokens);
        tokenDisplay.innerText = tokens;
        
        btnStartDraw.style.display = 'none';
        spreadArea.style.display = 'flex';
        spreadArea.innerHTML = '<p style="color:#666; font-weight:bold; font-size:1.2em;">命運洗牌中...</p>';
        revealArea.classList.add('hidden');
        revealArea.innerHTML = '';
        actionsArea.style.display = 'none';

        // 生成卡牌資料
        const cardsData = await generateCardsData();

        spreadArea.innerHTML = '';
        
        // 渲染 3 張覆蓋的牌
        cardsData.forEach((cardData, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'spread-card';
            cardEl.innerHTML = '❓';
            cardEl.style.transform = 'translateY(-100px)'; // 準備滑入動畫
            cardEl.style.opacity = 0;

            cardEl.onclick = () => selectCard(index, cardsData, cardEl);

            spreadArea.appendChild(cardEl);
        });

        // 動畫發牌
        if (typeof anime !== 'undefined') {
            anime({
                targets: '.spread-card',
                translateY: 0,
                opacity: 1,
                delay: anime.stagger(150),
                easing: 'easeOutElastic(1, .8)'
            });
        } else {
            document.querySelectorAll('.spread-card').forEach(el => {
                el.style.transform = 'translateY(0)';
                el.style.opacity = 1;
            });
        }
    });

    function selectCard(selectedIndex, allCardsData, selectedCardEl) {
        // 禁用所有卡片點擊
        document.querySelectorAll('.spread-card').forEach(el => el.onclick = null);

        const chosenData = allCardsData[selectedIndex];

        // 1. 未選中的卡片淡出
        const unselectedCards = Array.from(document.querySelectorAll('.spread-card')).filter(el => el !== selectedCardEl);
        
        if (typeof anime !== 'undefined') {
            anime({
                targets: unselectedCards,
                opacity: 0,
                scale: 0.8,
                duration: 500,
                easing: 'easeOutQuad',
                complete: () => {
                    unselectedCards.forEach(el => el.remove());
                }
            });
        } else {
            unselectedCards.forEach(el => el.remove());
        }

        // 2. 揭曉卡牌 (延遲一下等其他卡牌消失)
        setTimeout(() => {
            spreadArea.style.display = 'none';
            revealArea.classList.remove('hidden');

            revealArea.innerHTML = `
                <div id="gacha-card" style="
                    width: 250px; 
                    height: 350px; 
                    perspective: 1000px;
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
                        <!-- 卡面 -->
                        <div style="
                            position: absolute; 
                            width: 100%; 
                            height: 100%; 
                            backface-visibility: hidden; 
                            background: white;
                            border: 4px solid ${chosenData.config.color};
                            border-radius: 12px;
                            transform: rotateY(180deg);
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            padding: 15px;
                            box-sizing: border-box;
                            box-shadow: 0 0 20px ${chosenData.config.color}88;
                        ">
                            <span style="font-size: 1.2em; font-weight: bold; color: ${chosenData.config.color};">【${chosenData.rarity}】</span>
                            <h3 style="margin: 10px 0; color: #333; font-size: 1.1em; text-align: center;">${chosenData.config.title}</h3>
                            <div style="flex-grow: 1; width: 100%; display: flex; align-items: center; justify-content: center;">
                                <img src="${chosenData.finalImgUrl}" style="max-width: 100%; max-height: 150px; object-fit: contain; border-radius: 8px;">
                            </div>
                            <p style="color: #666; margin-top: 10px; font-size: 0.9em; text-align: center;"><i>"${chosenData.config.msg}"</i></p>
                        </div>
                    </div>
                </div>
            `;

            // 記錄到 Gallery
            let gallery = JSON.parse(localStorage.getItem('lms_meme_gallery')) || [];
            gallery.push({
                id: 'meme_' + Date.now(),
                url: chosenData.finalImgUrl,
                rarity: chosenData.rarity,
                title: chosenData.config.title,
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
                    complete: () => {
                        actionsArea.style.display = 'block';
                    }
                });
            } else {
                document.getElementById('gacha-card-inner').style.transform = 'rotateY(180deg)';
                actionsArea.style.display = 'block';
            }
        }, 600);
    }

    btnDrawAgain.addEventListener('click', () => {
        actionsArea.style.display = 'none';
        revealArea.classList.add('hidden');
        revealArea.innerHTML = '';
        btnStartDraw.style.display = 'inline-block';
    });
});