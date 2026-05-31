# --- 1. 引入必要的模組 ---
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

# --- 2. 初始化 Flask 與 CORS ---
app = Flask(__name__)
CORS(app) # 允許前端跨網域請求

# --- 3. 設定 Gemini API ---
# 【重要】請將下方字串替換成你真正申請到的 Gemini API Key
API_KEY = "YOUR_GEMINI_API_KEY" 
genai.configure(api_key=API_KEY)

# 定義心靈園丁的 System Prompt
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

# 初始化模型
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=system_instruction
)

# --- 4. 定義 API 路由 ---
@app.route('/api/chat', methods=['POST'])
def chat_with_ai():
    try:
        data = request.get_json()
        # 接收前端傳來的整個歷史陣列
        chat_history = data.get('history', [])
        
        if not chat_history:
            return jsonify({'error': '沒有收到對話內容'}), 400

        # 將前端的紀錄轉換為 Gemini 看得懂的歷史格式 (History)
        formatted_history = []
        for msg in chat_history[:-1]: # 除了最後一條最新訊息外，其他都當作歷史
            formatted_history.append({
                "role": msg["role"], # 'user' 或 'model'
                "parts": [msg["content"]]
            })
            
        # 取出最新的一句話作為本次的 Prompt
        latest_message = chat_history[-1]["content"]

        # 啟動帶有記憶的對話 Session
        chat_session = model.start_chat(history=formatted_history)
        response = chat_session.send_message(latest_message)
        
        return jsonify({
            'reply': response.text
        }), 200

    except Exception as e:
        print(f"API 呼叫失敗: {e}")
        return jsonify({'error': '伺服器端發生錯誤，請稍後再試！'}), 500

# --- 5. 啟動伺服器 ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)