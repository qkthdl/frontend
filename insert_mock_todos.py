import sqlite3
import uuid
import datetime

conn = sqlite3.connect('C:/Chak_frontend_revision/Chak-merge-debug/backend/data/meeting_app.sqlite3')
cursor = conn.cursor()
now = datetime.datetime.now().isoformat()

cursor.execute("SELECT DISTINCT room_name, channel_id FROM calendar_events")
rooms = cursor.fetchall()

if not rooms:
    print("No rooms found, using fallback")
    rooms = [('프론트', 'ch1'), ('default_room', 'default_channel')]

for room_name, channel_id in rooms:
    todos = [
        (str(uuid.uuid4()), room_name, channel_id, None, '디자인 시스템 컴포넌트 정리', 'Button, Input 컴포넌트 상태 정의', 'team', '디자인팀', 'high', 'open', '2026-05-30', '익명', now, now),
        (str(uuid.uuid4()), room_name, channel_id, None, 'API 연동 테스트', '회의록 요약 API 및 To-Do API 연동 테스트 진행', 'user', '개발자A', 'medium', 'in_progress', '2026-06-05', '익명', now, now),
        (str(uuid.uuid4()), room_name, channel_id, None, '기획 리뷰 피드백 반영', '저번 주 회의 피드백 문서화 및 반영', 'team', '기획팀', 'low', 'done', '2026-05-20', '익명', now, now),
        (str(uuid.uuid4()), room_name, channel_id, None, '월간 리포트 작성', '5월 주요 마일스톤 정리 및 리포팅', 'user', '매니저B', 'high', 'open', '2026-06-01', '익명', now, now)
    ]
    cursor.executemany("INSERT INTO todo_items (id, room_name, channel_id, session_id, title, description, assignee_type, assignee_name, priority, status, due_date, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", todos)

conn.commit()
conn.close()
print("Mock To-Dos inserted for all rooms/channels successfully.")
