import os
import re

files_to_check = [
    'static/js/teammate_script.js',
    'static/js/postcard.js',
    'static/js/gacha.js'
]

keys_to_isolate = [
    'lms_tokens',
    'lms_daily_earned_tokens',
    'lms_daily_earned_date',
    'lms_last_draw_date',
    'lms_daily_draws',
    'lms_meme_gallery',
    'lms_postcard_gallery_data',
    'lms_postcard_gallery',
    'lms_user_records',
    'lms_todos'
]

for file in files_to_check:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for key in keys_to_isolate:
        content = content.replace("'" + key + "'", "`" + key + "_${JSON.parse(localStorage.getItem('moodstudy_login')||'{}').username || ''}`")
        content = content.replace('"' + key + '"', "`" + key + "_${JSON.parse(localStorage.getItem('moodstudy_login')||'{}').username || ''}`")

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
