# Setup sqlite database for optional query logging

import sqlite3

DB_FILE = 'edu-python-log.sqlite3'

def db_connect():
  con = sqlite3.connect(DB_FILE)
  cur = con.cursor()
  return (con, cur)

