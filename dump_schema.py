import sqlite3
conn = sqlite3.connect('backend/data/meeting_app.sqlite3')
cur = conn.cursor()
cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='calendar_events'")
print(cur.fetchone()[0])
conn.close()
