from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, session
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
import json

app = Flask(__name__)
CORS(app)
secret_key = os.urandom(24)
app.secret_key = os.environ.get('SECRET_KEY') or 'optional_default_key'  # Necessary for session management and flashing messages

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        # Generate a password hash
        password_hash = generate_password_hash(password)
        
        # Serialize user_data
        letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        dic = {letter: 0 for letter in letters}
        serialized_data = json.dumps(dic)  # Ensures it's a valid JSON string

        try:
            basedir = os.path.abspath(os.path.dirname(__file__))
            database_path = os.path.join(basedir, 'db', 'users.db')
            conn = sqlite3.connect(database_path)
            cur = conn.cursor()

            # Create the users table if it doesn't already exist
            cur.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    user_data TEXT, 
                    num_games INT,
                    last_word TEXT,
                    current_win_streak INTEGER DEFAULT 0,
                    max_win_streak INTEGER DEFAULT 0,
                    wins INTEGER DEFAULT 0,
                    average_guesses INTEGER DEFAULT 0
                );
            ''')

            # Insert the username and the hashed password into the database
            cur.execute("INSERT INTO users (username, password_hash, user_data, num_games) VALUES (?, ?, ?, ?)", (username, password_hash, serialized_data, 0))
            conn.commit()
            flash('Registration successful!', 'success')
            return redirect(url_for('home'))
        except sqlite3.IntegrityError:
            conn.rollback()  # Roll back the transaction on error
            flash('Username already exists!', 'error')
        finally:
            conn.close()

    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']  # You should validate and check this against the database
        
        # Function to check if username and password match:
        if validate_login(username, password):
            session['username'] = username
            flash('Login successful!', 'success')
            user_data = fetch_user_data(username)
            return redirect(url_for('home'))
    
    return render_template('SmartWordle.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    flash('You have been logged out.', 'success')
    return redirect(url_for('home'))

def validate_login(acc_username, password):
    basedir = os.path.abspath(os.path.dirname(__file__))
    database_path = os.path.join(basedir, 'db', 'users.db')
    conn = sqlite3.connect(database_path)
    cur = conn.cursor()

    # Use parameterized query to prevent SQL injection
    cur.execute("SELECT password_hash FROM users WHERE username = ?", (acc_username,))
    user_password_hash = cur.fetchone()  # Fetches the first row of the query result
    conn.close()

    if user_password_hash:
        # Check if the password hash matches the hash of the entered password
        if check_password_hash(user_password_hash[0], password):
            return True
        else:
            flash('The password you entered is incorrect!', 'error')
            return False
    else:
        flash('Invalid username!', 'error')
        return False  

@app.route('/get_unsuccessful_guesses', methods=['POST'])
def get_unsuccessful_guesses():
    if 'username' in session:
        username = session['username']
        basedir = os.path.abspath(os.path.dirname(__file__))
        database_path = os.path.join(basedir, 'db', 'users.db')

        with sqlite3.connect(database_path) as conn:
            cur = conn.cursor()
            cur.execute("SELECT id, last_word FROM users WHERE username = ?", (username,))
            result = cur.fetchone()
            if result:
                if result[1] == None:
                    return jsonify({'guesses': [], 'randomWord': ''})
                else:
                    user_id = result[0]
                    guesses, word = get_unsuccessful_game_data(user_id)
                    return jsonify({'guesses': guesses, 'randomWord': word})
    else:
        return jsonify({'guesses': [], 'randomWord': ''})

def get_unsuccessful_game_data(user_id):
    basedir = os.path.abspath(os.path.dirname(__file__))
    database_path = os.path.join(basedir, 'db', 'users.db')
    
    with sqlite3.connect(database_path) as conn:
        cur = conn.cursor()
        
        # Retrieve all guesses for that user_id up until the last true
        cur.execute('''
            SELECT guess, game_over FROM game_data
            WHERE user_id = ?
            ORDER BY ROWID DESC;
        ''', (user_id,))
        all_entries = cur.fetchall()

        guesses = []
        word = get_last_word(user_id)
        for i in range(len(all_entries)):
            guess, game_over = all_entries[i][0], all_entries[i][1]
            if game_over and i != 0:
                break
            else:
                guesses.append(guess)
                
        last_game = all_entries[0][1]

        if word[0][0] != guesses[0] and last_game == 0 or (word[0][0] == guesses[0] and last_game == 1):
            return list(reversed(guesses)), word
        else:
            return [], word
    
def get_last_word(user_id):
    basedir = os.path.abspath(os.path.dirname(__file__))
    database_path = os.path.join(basedir, 'db', 'users.db')
    
    with sqlite3.connect(database_path) as conn:
        cur = conn.cursor()
        cur.execute('''
            SELECT last_word FROM users
            WHERE id = ?;
        ''', (user_id,))
        word = cur.fetchall()
        return word
    
# Saves player's data within games so they can resume once they relogin   
@app.route('/update_game', methods=['POST'])
def update_game():
    content = request.json
    guess = content.get('guess', "")
    game_over = content.get('game_over', bool)
    if 'username' in session:    
        username = session['username']
        basedir = os.path.abspath(os.path.dirname(__file__))
        database_path = os.path.join(basedir, 'db', 'users.db')
        with sqlite3.connect(database_path) as conn:
            cur = conn.cursor()
            # Creates the game_data table if it doesn't exist
            cur.execute('''
                CREATE TABLE IF NOT EXISTS game_data (
                    user_id INTEGER,
                    guess INT NOT NULL,
                    game_over BOOLEAN,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            ''')
            # Gets user ID
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            result = cur.fetchone()
            if result:
                user_id = result[0]
                cur.execute('''INSERT INTO game_data (user_id, guess, game_over) VALUES (?, ?, ?)''', (user_id, guess, game_over))
    return('', 204)

@app.route('/')
def home():
    if 'username' in session:
        username = session['username']
        # Fetch user data from the database using username
        letter_freq, user_data, num_games = fetch_user_data(username)
        # Render a template with user-specific data
        return render_template('SmartWordle.html', username=username, letter_freq=letter_freq, user_data=user_data, num_games = num_games)
    else:
        # If no user is logged in, just render the template without user-specific data
        return render_template('SmartWordle.html')
    
def fetch_user_data(username):
    basedir = os.path.abspath(os.path.dirname(__file__))
    database_path = os.path.join(basedir, 'db', 'users.db')
    
    # Use context manager for handling the database connection
    with sqlite3.connect(database_path) as conn:
        cur = conn.cursor()
        
        # Retrieve the serialized letter frequency data associated with the username
        cur.execute("SELECT user_data FROM users WHERE username = ?", (username,))
        data_row = cur.fetchone()
        
        letter_freq = {}
        if data_row and data_row[0]:
            letter_freq = json.loads(data_row[0])  # Deserialize the JSON string back to a dictionary

        # Ensure the games table exists
        cur.execute('''
            CREATE TABLE IF NOT EXISTS games (
                game_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                word TEXT NOT NULL,
                guess INT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
        ''')

        # Fetch the user ID based on username
        cur.execute("SELECT id FROM users WHERE username = ?", (username,))
        result = cur.fetchone()
        
        user_data = {}
        if result:
            user_id = result[0]
            
            # Fetch game data for the user
            cur.execute("SELECT word, guess FROM games WHERE user_id = ?", (user_id,))
            games_data = cur.fetchall()
            
            # Convert list of tuples into a dictionary of word: guess
            user_data = {word: guess for word, guess in games_data}

            cur.execute("SELECT num_games FROM users WHERE username = ?", (username,))
            result = cur.fetchone()

            # Return both letter frequencies and game data
            return letter_freq, user_data, result[0]

    # If no data is found, return empty structures
    letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    dic = {letter: 0 for letter in letters}
    return dic, {}, 0

@app.route('/get_leaderboard_data', methods=['POST'])
def get_leaderboard_data():
    basedir = os.path.abspath(os.path.dirname(__file__))
    database_path = os.path.join(basedir, 'db', 'users.db')
    
    # Use context manager for handling the database connection
    with sqlite3.connect(database_path) as conn:
        cur = conn.cursor()
        
        # Get max_win_streak data
        cur.execute("SELECT username, max_win_streak FROM users ORDER BY max_win_streak DESC")
        max_win_streak_data = cur.fetchall()
        win_streak_list = [{'player': row[0], 'score': row[1]} for row in max_win_streak_data]
        cur.execute("SELECT username, wins FROM users ORDER BY wins DESC")
        wins_data = cur.fetchall()
        wins_list = [{'player': row[0], 'score': row[1]} for row in wins_data ]
        cur.execute("SELECT username, average_guesses FROM users WHERE average_guesses != 0 ORDER BY average_guesses ASC")
        guesses_data = cur.fetchall()
        guesses_list = [{'player': row[0], 'score': row[1]} for row in guesses_data]
        return jsonify({'win_streak': win_streak_list, 'wins': wins_list, 'guesses': guesses_list})
    
@app.route('/get_username', methods=['POST'])
def get_username():
    if 'username' in session:
        username = session['username']
        return jsonify({'username': username})
    else:
        return jsonify({'username': None})
        
       
@app.route('/choose_new_word', methods=['POST'])
def choose_new_word_api():
    content = request.json
    dic = content.get('dic', {})
    test_words = content.get('test', [])  # This should match the expected structure in `choose_new_word`
    letter_frequency = content.get('frequency', {})
    win = content.get('win', bool)
    
    if 'username' in session:    
        username = session['username']
        basedir = os.path.abspath(os.path.dirname(__file__))
        database_path = os.path.join(basedir, 'db', 'users.db')

        # Get the most recent word and guess
        most_recent_word, most_recent_guess = list(dic.items())[-1]

        with sqlite3.connect(database_path) as conn:
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            result = cur.fetchone()
            if result:
                user_id = result[0]

                # Check if the word already exists for the user
                cur.execute("SELECT * FROM games WHERE user_id = ? AND word = ?", (user_id, most_recent_word))
                existing_word = cur.fetchone()

                if existing_word is None:
                    # Insert the new word and guess
                    cur.execute('''INSERT INTO games (user_id, word, guess) VALUES (?, ?, ?)''', (user_id, most_recent_word, most_recent_guess))
                    cur.execute("UPDATE users SET num_games = ? WHERE username = ?", (len(dic), username))
                    serialized_data = json.dumps(letter_frequency)
                    cur.execute("UPDATE users SET user_data = ? WHERE username = ?", (serialized_data, username))
            cur.execute("SELECT current_win_streak FROM users WHERE username = ?", (username,))
            current_win_streak = cur.fetchone()[0]
            cur.execute("SELECT max_win_streak FROM users WHERE username = ?", (username,))
            max_win_streak = cur.fetchone()[0]
            cur.execute("SELECT wins FROM users WHERE username = ?", (username,))
            wins = cur.fetchone()[0]
            cur.execute("SELECT average_guesses FROM users WHERE username = ?", (username,))
            average_guesses = cur.fetchone()[0]
            cur.execute("SELECT num_games FROM users WHERE username = ?", (username,))
            games = cur.fetchone()[0]
            average_guesses *= (games - 1)
            cur.execute("UPDATE users SET average_guesses = ? WHERE username = ?", (round((average_guesses + most_recent_guess) / games, 2), username))
            if win:
                cur.execute("UPDATE users SET wins = ? WHERE username = ?", (wins + 1, username))
                current_win_streak += 1
                cur.execute("UPDATE users SET current_win_streak = ? WHERE username = ?", (current_win_streak, username))
                if current_win_streak > max_win_streak:
                    cur.execute("UPDATE users SET max_win_streak = ? WHERE username = ?", (current_win_streak, username))
                
            else:
                cur.execute("UPDATE users SET current_win_streak = ? WHERE username = ?", (0, username))
            
    result_word = choose_new_word(dic, test_words, letter_frequency)
    set_last_word(result_word)
    return jsonify({'word': result_word})

@app.route('/set_last', methods=['POST'])
def set_last():
    content = request.json
    word = content.get('word', '')
    set_last_word(word)
    return('', 204)
    
def set_last_word(word):
    if 'username' in session:    
        username = session['username']
        basedir = os.path.abspath(os.path.dirname(__file__))
        database_path = os.path.join(basedir, 'db', 'users.db')
        with sqlite3.connect(database_path) as conn:
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            result = cur.fetchone()
            if result:
                user_id = result[0]
                cur.execute("UPDATE users SET last_word = ? WHERE username = ?", (word, username))

def word_to_numbers(word):
    word = word.lower()
    # Convert each character in the word to a number and return as a 2D array
    return np.array([[ord(char) - ord('a') + 1 for char in word]])

def letter_frequency(word, letter_freqs):
    # Ensure the word is uppercase for consistency
    word = word.upper()
    sum_freq = sum(letter_freqs.get(letter, 0) for letter in word)
    return sum_freq * 0.05

def choose_new_word(dic, test_words, letter_freqs):
    # Prepare training data with updated features
    X_train = np.array([word_to_numbers(key)[0] for key in dic.keys()])
    y_train = np.array(list(dic.values()))
    
    # Prepare testing data
    X_test = np.array([word_to_numbers(word)[0] for word in test_words])  # This ensures it's a 2D array

    # Initialize and train the model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Make predictions and evaluate
    predictions = model.predict(X_test)
    
    hard_words = []

    # Associate the predictions with the corresponding words
    for word, prediction in zip(test_words, predictions):
        hard_words.append([round(prediction, 2), word])
        
    # Penalizes the difficulty of the words that uses more commonly guessed letters
    for word in hard_words:
        word[0] = word[0] - letter_frequency(word[1], letter_freqs)
        
    hard_words.sort(reverse=True)
    return hard_words[0][1]  # Return the word with the highest prediction value

if __name__ == '__main__':
    app.run(debug=True, port=5000)