from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import RandomForestRegressor

app = Flask(__name__)
CORS(app)
            
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
    y_train = np.array([value - letter_frequency(key, letter_freqs) for key, value in dic.items()])
    
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
    hard_words.sort(reverse=True)
    return hard_words[0][1]  # Return the word with the highest prediction value

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)