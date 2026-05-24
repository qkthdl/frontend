import sqlite3
import json

db_path = 'backend/data/meeting_app.sqlite3'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

try:
    cur.execute('''CREATE TABLE IF NOT EXISTS meeting_report_cache (
        session_id TEXT PRIMARY KEY,
        report_json TEXT NOT NULL,
        output_info TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )''')
    
    report_json = json.dumps({
        'analysisMode': 'chunked_gemma_analysis',
        'meetingSummary': {
            'summary': '- 디자인 시스템 Button 컴포넌트의 상태별 스타일을 정리하고 가이드 문서에 반영하기로 결정했습니다.\n- Input 컴포넌트의 에러 처리 방식과 접근성 개선 사항을 논의했습니다.\n- 컴포넌트 스토리북 정비 및 테스트 케이스 보강을 다음 스프린트에서 진행하기로 했습니다.'
        },
        'topicBlocks': [
            {
                'id': 'mock-topic-1',
                'title': 'UI 설계 논의',
                'startSec': 0,
                'endSec': 2700,
                'start': '00:00',
                'end': '45:00',
                'summary': '디자인 시스템과 관련하여 논의를 진행하였습니다.',
                'keywords': ['UI', '버튼']
            }
        ],
        'totalSec': 2700
    })
    
    cur.execute('INSERT OR REPLACE INTO meeting_report_cache (session_id, report_json, created_at, updated_at) VALUES (?, ?, datetime("now"), datetime("now"))', ('dummy-1', report_json))
    cur.execute('INSERT OR REPLACE INTO meeting_report_cache (session_id, report_json, created_at, updated_at) VALUES (?, ?, datetime("now"), datetime("now"))', ('dummy-2', report_json))
    
    conn.commit()
    print('Inserted mock report into meeting_report_cache successfully.')
except Exception as e:
    print('Failed:', e)
finally:
    conn.close()
