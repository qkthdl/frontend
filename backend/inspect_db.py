import sqlite3
import json

conn = sqlite3.connect('data/meeting_app.sqlite3')
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
schema = {}

for t in tables:
    table_name = t[0]
    cols = conn.execute(f"PRAGMA table_info({table_name});").fetchall()
    schema[table_name] = [c[1] for c in cols]

print(json.dumps(schema, indent=2))
