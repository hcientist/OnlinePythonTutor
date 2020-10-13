# Setup sqlite database for optional query logging

from db_common import *
import os

# the 'post_date' field is stored as an int representing GMT time since
# the UNIX epoch; to convert to localtime in sqlite, use:
#   SELECT datetime(1092941466, 'unixepoch', 'localtime'); 

def create_db():
  assert not os.path.exists(DB_FILE)
  #connecting to database
  (con, cur) = db_connect()
  # SQL Query for creating table 
  cur.execute('''CREATE TABLE query_log
    (id INTEGER PRIMARY KEY,
     post_date TEXT NOT NULL,
     ip_addr TEXT NOT NULL,
     user_agent TEXT NOT NULL,
     input_script TEXT NOT NULL,
     had_error INTEGER)''')
  #Execute query
  con.commit()
  #close database connection
  cur.close()

if __name__ == "__main__":
  create_db()
  print 'Created', DB_FILE

