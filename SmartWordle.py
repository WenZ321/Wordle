from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, session
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash

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
                    password_hash TEXT NOT NULL
                );
            ''')

            # Insert the username and the hashed password into the database
            cur.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, password_hash))
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
        
        # Function to check if username and password math:
        if validate_login(username, password):  # Replace with actual validation function
            session['username'] = username
            flash('Login successful!', 'success')
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

@app.route('/')
def home():
    return render_template('SmartWordle.html')

@app.route('/choose_new_word', methods=['POST'])
def choose_new_word_api():
    content = request.json
    dic = content.get('dic', {})
    test_words = content.get('test', [])  # This should match the expected structure in `choose_new_word`
    letter_frequency = content.get('frequency', {})
    result_word = choose_new_word(dic, test_words, letter_frequency)
    return jsonify({'word': result_word})

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