import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import google.generativeai as genai

# --- 1. 載入環境變數與初始化 ---
load_dotenv()

app = Flask(__name__)
CORS(app) # 允許前端跨網域請求

# --- 2. 設定資料庫 (SQLite) ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lms_data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'soul-gardener-super-secret'

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    tokens = db.Column(db.Integer, default=15) # 預設代幣

with app.app_context():
    db.create_all()

# --- 3. 設定 Gemini API (心靈園丁) ---
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
genai.configure(api_key=GEMINI_API_KEY)

system_instruction = """
你現在是 MemeLogic 平台上的專屬「情緒自律教練」兼「心靈園丁」。
你的使命不是解答學科問題，而是陪伴學生平復學習焦慮、找回專注力，並將龐大的學習壓力「降維拆解」成可執行的小關卡。
你的說話語氣必須溫暖、幽默、具備同理心，請多使用遊戲化的比喻（例如：打怪、存檔、回血、種下種子、解鎖成就）。

【核心對話階段與引導原則】
1. 接住情緒（Validation）：當學生表達焦慮、疲累或不想努力時，第一步絕對是肯定並接納他們的情緒。
2. 任務拆解（Micro-stepping）：當學生面對龐大任務，請引導他們切碎目標。「我們現在先不看整本書。你能不能幫我挑出 3 個最不熟的單元？」
3. 蘇格拉底式反問：不要直接給予死板的讀書計畫。引導他們自己思考下一步。

【安全防護與邊界設定】
1. 拒絕解題：如果學生把具體的數學題目丟給你，請溫和拒絕，請他們自己打怪升級。
2. 偏題導回：若學生聊與情緒調節無關的話題，請幽默地將焦點拉回進度網格。
"""

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=system_instruction
)

# ==========================================
# 🔌 4. 定義 API 路由 (Routes)
# ==========================================

# 【功能 A：使用者註冊】
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': '這個暱稱已經被別人用過囉！'}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password_hash=hashed_password)
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'success': True, 'message': '註冊成功！'})

# 【功能 B：使用者登入】
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        return jsonify({
            'success': True, 
            'user': {'id': user.id, 'username': user.username, 'tokens': user.tokens}
        })
    return jsonify({'success': False, 'message': '帳號或密碼錯誤。'}), 401

# 【功能 C：GIPHY 迷因製造機】
@app.route('/api/meme', methods=['GET'])
def get_random_meme():
    status = request.args.get('status', 'stable')
    GIPHY_API_KEY = os.getenv('GIPHY_API_KEY')
    
    tag_mapping = {
        'focus': 'study focus cat',
        'anxious': 'this is fine fire',
        'stable': 'good job dog',
        'unmotivated': 'lazy potato',
        'SSR': 'epic legendary success',
        'SR': 'smart thinking meme',
        'N': 'funny meme'
    }
    search_tag = tag_mapping.get(status, status)
    giphy_url = f"https://api.giphy.com/v1/gifs/random?api_key={GIPHY_API_KEY}&tag={search_tag}&rating=g"

    
    try:
        response = requests.get(giphy_url)
        data = response.json()
        img_url = data['data']['images']['original']['url']
        return jsonify({"success": True, "imgUrl": img_url})
    except Exception as e:
        return jsonify({"success": False, "imgUrl": "https://i.imgflip.com/9vct.jpg"}), 500

# 【功能 D：Gemini 心靈園丁對話】
@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    try:
        data = request.get_json()
        chat_history = data.get('history', [])
        
        if not chat_history:
            return jsonify({'error': '沒有收到對話內容'}), 400

        formatted_history = []
        for msg in chat_history[:-1]: 
            formatted_history.append({
                "role": msg["role"], 
                "parts": [msg["content"]]
            })
            
        latest_message = chat_history[-1]["content"]
        chat_session = model.start_chat(history=formatted_history)
        response = chat_session.send_message(latest_message)
        
        return jsonify({'reply': response.text}), 200

    except Exception as e:
        print(f"API 呼叫失敗: {e}")
        return jsonify({'error': '伺服器端發生錯誤，請稍後再試！'}), 500

# 測試用：確認伺服器有活著
@app.route('/', methods=['GET'])
def home():
    return "四季之庭 API 伺服器正常運作中！🌱"

# --- 5. 啟動伺服器 ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)