import sqlite3, os
db_path = 'backend/data/meeting_app.sqlite3'
if not os.path.exists('backend/data'):
    os.makedirs('backend/data')
conn = sqlite3.connect(db_path)
cur = conn.cursor()
try:
    cur.execute("PRAGMA table_info(meeting_sessions)")
    cols = {row[1] for row in cur.fetchall()}
    
    if "channel_id" not in cols:
        cur.execute("ALTER TABLE meeting_sessions ADD COLUMN channel_id TEXT DEFAULT 'default'")
        
    cur.execute('''INSERT OR REPLACE INTO meeting_sessions (id, room_name, channel_id, title, meeting_time, status, created_at) VALUES ('dummy-1', 'default_room', 'default', 'UI 컴포넌트 점검 회의', '60', 'completed', '2026-05-12T10:00:00Z')''')
    cur.execute('''INSERT OR REPLACE INTO meeting_sessions (id, room_name, channel_id, title, meeting_time, status, created_at) VALUES ('dummy-2', 'default_room', 'default', '프로젝트 UX 리뷰', '60', 'completed', '2026-05-05T11:00:00Z')''')
    
    cur.execute('''CREATE TABLE IF NOT EXISTS meeting_reports (session_id TEXT PRIMARY KEY, report_json TEXT)''')
    cur.execute('''INSERT OR REPLACE INTO meeting_reports (session_id, report_json) VALUES ('dummy-1', '{"meetingSummary": {"summary": "- 디자인 시스템 Button 컴포넌트의 상태별 스타일을 정리하고 가이드 문서에 반영하기로 결정했습니다.\n- Input 컴포넌트의 에러 처리 방식과 접근성 개선 사항을 논의했습니다.\n- 컴포넌트 스토리북 정비 및 테스트 케이스 보강을 다음 스프린트에서 진행하기로 했습니다."}}')''')
    conn.commit()
    print('Dummy data inserted.')
except Exception as e:
    print(e)
finally:
    conn.close()
