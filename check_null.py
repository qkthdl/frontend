import sqlite3
conn = sqlite3.connect('C:/Chak_frontend_revision/Chak-merge-debug/backend/data/meeting_app.sqlite3')
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(calendar_events)")
# index 1: name, index 3: notnull, index 4: default_value
print([(row[1], row[3], row[4]) for row in cursor.fetchall()])
