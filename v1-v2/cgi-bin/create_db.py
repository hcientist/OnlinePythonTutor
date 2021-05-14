# Setup sqlite database for optional query logging

from db_common import *
import os

# the 'post_date' field is stored as an int representing GMT time since
# the UNIX epoch; to convert to localtime in sqlite, use:
#   SELECT datetime(1092941466, 'unixepoch', 'localtime'); 

def create_db():
  assert not os.path.exists(DB_FILE)
  (con, cur) = db_connect()
  cur.execute('''CREATE TABLE query_log
    (id INTEGER PRIMARY KEY,
     post_date TEXT,
     ip_addr TEXT,
     user_agent TEXT,
     input_script TEXT,
     had_error INTEGER)''')
  con.commit()
  cur.close()

if __name__ == "__main__":
  create_db()
  print 'Created', DB_FILE

