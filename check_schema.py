import sqlite3
conn = sqlite3.connect('C:/Chak_frontend_revision/Chak-merge-debug/backend/data/meeting_app.sqlite3')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(calendar_events)")
print([row[1] for row in cursor.fetchall()])
