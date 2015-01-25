# sets up a super-simple sqlite database
import os
import sqlite3

if not os.path.exists('cokapi-feedback.db'):
    db = sqlite3.connect('cokapi-feedback.db')
    cursor = db.cursor()
    cursor.execute('''
        CREATE TABLE feedback(id INTEGER PRIMARY KEY AUTOINCREMENT,
                              name TEXT, contents TEXT, appStateJSON TEXT,
                              timestamp DATETIME)
    ''')
    db.commit()
