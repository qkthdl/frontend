import sqlite3

conn = sqlite3.connect('data/meeting_app.sqlite3')
cur = conn.cursor()

new_name = 'Chak'

cur.execute("UPDATE rooms SET room_name=?", (new_name,))
cur.execute("UPDATE meeting_sessions SET room_name=?", (new_name,))
cur.execute("UPDATE todo_items SET room_name=?", (new_name,))
cur.execute("UPDATE meeting_report_cache SET room_name=?", (new_name,))

conn.commit()
conn.close()
print("Updated all room_names to 'Chak'")
