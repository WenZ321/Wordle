import sqlite3

conn = sqlite3.connect('users.db')

conn.execute('''INSERT INTO users (username, password_hash) VALUES ("masteroogway1859", "Pausebreak1!")''')
conn.execute('''INSERT INTO users (username, password_hash) VALUES ("caltechtennis29", "3Apeman60")''')

conn.execute('''INSERT INTO games (user_id, word, guess) VALUES (1, "slump", 3)''')
conn.execute('''INSERT INTO games (user_id, word, guess) VALUES (1, "crimp", 4)''')
conn.execute('''INSERT INTO games (user_id, word, guess) VALUES (1, "freak", 5)''')
conn.execute('''INSERT INTO games (user_id, word, guess) VALUES (2, "dumps", 2)''')
conn.execute('''INSERT INTO games (user_id, word, guess) VALUES (2, "darky", 5)''')

conn.commit()
conn.close()