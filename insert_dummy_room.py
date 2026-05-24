import sqlite3, os
db_path = 'backend/data/meeting_app.sqlite3'
conn = sqlite3.connect(db_path)
cur = conn.cursor()
try:
    room_name = '캡디'
    channel_id = 'e03abcd6-3ee0-42e3-89aa-85c25bf9cadd'
    
    cur.execute('''INSERT OR REPLACE INTO meeting_sessions (id, room_name, channel_id, title, meeting_time, status, created_at) VALUES ('dummy-1', ?, ?, 'UI 컴포넌트 점검 회의', '60', 'completed', '2026-05-12T10:00:00Z')''', (room_name, channel_id))
    cur.execute('''INSERT OR REPLACE INTO meeting_sessions (id, room_name, channel_id, title, meeting_time, status, created_at) VALUES ('dummy-2', ?, ?, '프로젝트 UX 리뷰', '60', 'completed', '2026-05-05T11:00:00Z')''', (room_name, channel_id))
    
    cur.execute('''INSERT OR REPLACE INTO meeting_reports (session_id, report_json) VALUES ('dummy-1', '{"meetingSummary": {"summary": "- 디자인 시스템 Button 컴포넌트의 상태별 스타일을 정리하고 가이드 문서에 반영하기로 결정했습니다.\n- Input 컴포넌트의 에러 처리 방식과 접근성 개선 사항을 논의했습니다.\n- 컴포넌트 스토리북 정비 및 테스트 케이스 보강을 다음 스프린트에서 진행하기로 했습니다."}}')''')
    conn.commit()
    print('Dummy data inserted for room: 캡디, channel_id:', channel_id)
except Exception as e:
    print(e)
finally:
    conn.close()
