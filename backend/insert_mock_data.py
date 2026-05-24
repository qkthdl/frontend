import sqlite3
import json
import uuid
import time
from datetime import datetime

conn = sqlite3.connect('data/meeting_app.sqlite3')
cur = conn.cursor()

room_name = "Chak_MockRoom"
now = datetime.now().isoformat()

# Insert room
cur.execute("INSERT OR IGNORE INTO rooms (id, room_name, created_at) VALUES (?, ?, ?)",
            (str(uuid.uuid4()), room_name, now))

# Insert session
session_id = "mock_session_001"
cur.execute("INSERT OR REPLACE INTO meeting_sessions (id, room_name, title, meeting_time, meeting_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (session_id, room_name, "프론트엔드 기획 회의", now, "audio", "completed", now))

# Insert meeting report cache
report_json = {
    "totalSec": 600,
    "topicBlocks": [
        {
            "id": "block1",
            "startSec": 0,
            "endSec": 300,
            "topic": "1. UI 구조 개편 논의",
            "summary": "현재 To-Do 보드의 복잡한 UI를 칸반 스타일로 정리하자는 의견이 나왔습니다. 회의록 사이드바의 역할은 Action Item 추출로 좁힙니다.",
            "decisions": ["To-Do 보드 칸반 레이아웃 적용", "사이드바 명칭 변경"],
            "tags": ["UI", "기획"]
        },
        {
            "id": "block2",
            "startSec": 300,
            "endSec": 600,
            "topic": "2. 다음 주차 일정 안내",
            "summary": "개발 기간은 3주차까지로 잡고, 이후 QA를 진행하기로 했습니다.",
            "decisions": [],
            "tags": ["일정"]
        }
    ],
    "minutesMarkdown": "## 1. 개요\nUI 개편 회의입니다.\n\n## 2. To-Do\n- [2026-06-01] 칸반 보드 개발 완료하기\n- 문서 작업 마무리\n\n## 3. 기타\nQA 일정 조율 필요.",
    "todoItems": [
        {"id": "t1", "task": "칸반 보드 개발 완료하기", "assignee": "team", "priority": "high", "dueDate": "2026-06-01"},
        {"id": "t2", "task": "문서 작업 마무리", "assignee": "team", "priority": "medium", "dueDate": "2026-06-02"}
    ]
}

cur.execute("INSERT OR REPLACE INTO meeting_report_cache (session_id, report_json, created_at, updated_at, room_name) VALUES (?, ?, ?, ?, ?)",
            (session_id, json.dumps(report_json), now, now, room_name))

# Insert To-Do Items
todos = [
    ("todo_1", "UI 디자인 시안 작성", "Figma를 사용하여 초기 시안 작성", "done", "medium", "1주차"),
    ("todo_2", "칸반 보드 개발", "TodoBoard.jsx 컴포넌트 수정", "in_progress", "high", "2주차"),
    ("todo_3", "회의록 사이드바 개선", "Action Items 뷰 적용", "open", "medium", "2주차"),
    ("todo_4", "QA 테스트 시나리오 작성", "엣지 케이스 포함하여 시나리오 준비", "open", "low", "3주차")
]

for t in todos:
    tid, title, desc, status, priority, week = t
    cur.execute("""
        INSERT OR REPLACE INTO todo_items 
        (id, room_name, session_id, title, description, assignee_type, priority, status, week_label, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (tid, room_name, session_id, title, desc, "team", priority, status, week, now, now))

conn.commit()
conn.close()
print("Mock data inserted successfully!")
