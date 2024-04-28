import sqlite3

conn = sqlite3.connect('users.db')

create_user = ('''CREATE TABLE users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
                );''')

conn.execute(create_user)

create_games = ('''CREATE TABLE games (
                game_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                word TEXT NOT NULL,
                guess INT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
                );''')

conn.execute(create_games)