import sqlite3

conn = sqlite3.connect('users.db')

conn.execute('''INSERT INTO users (username, password_hash) VALUES ("masteroogway1859", "Pausebreak1!")''')
conn.execute('''INSERT INTO users (username, password_hash) VALUES ("caltechtennis29", "3Apeman60")''')

conn.execute('''INSERT INTO games (user_id, word, guess) VALUES (1, "slump", 3)''')
conn.execute('''INSERT INTO games (user_id, word, guess) VALUES (1, "crimp", 4)''')
conn.execute('''INSERT INTO games (user_id, word, guess) VALUES (1, "freak", 5)''')
conn.execute('''INSERT INTO games (user_id, word, guess) VALUES (2, "dumps", 2)''')
conn.execute('''INSERT INTO games (user_id, word, guess) VALUES (2, "darky", 5)''')
def update_user_stats(username):
    basedir = os.path.abspath(os.path.dirname(__file__))
    database_path = os.path.join(basedir, 'db', 'users.db')
    conn = sqlite3.connect(database_path)
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM users WHERE username = ?", (username,))
    user_id = cur.fetchone()[0]

    # Calculate the win streak and average guesses
    cur.execute("SELECT guess FROM games WHERE user_id = ?", (user_id,))
    guesses = [row[0] for row in cur.fetchall()]

    if guesses:
        win_streak = 0
        max_win_streak = 0
        current_streak = 0
        total_guesses = 0
        games_won = 0

        for guess in guesses:
            if guess <= 6:  # Considering win if guesses <= 6
                current_streak += 1
                games_won += 1
                total_guesses += guess
            else:
                current_streak = 0

            max_win_streak = max(max_win_streak, current_streak)

        avg_guesses = total_guesses / games_won if games_won else 0

        cur.execute("""
            UPDATE users 
            SET win_streak = ?, max_win_streak = ?, avg_guesses = ? 
            WHERE id = ?
        """, (current_streak, max_win_streak, avg_guesses, user_id))

        conn.commit()
    conn.close()
conn.commit()
conn.close()