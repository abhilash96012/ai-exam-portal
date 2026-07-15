import psycopg2
from psycopg2.extras import RealDictCursor
import json

conn = psycopg2.connect(
    dbname="exam_automation",
    user="postgres",
    password="1234",
    host="localhost",
    port="5432"
)

cur = conn.cursor(cursor_factory=RealDictCursor)
cur.execute("SELECT * FROM exam_attempts ORDER BY created_at DESC LIMIT 10;")
rows = cur.fetchall()

print(json.dumps(rows, default=str, indent=2))
cur.close()
conn.close()
