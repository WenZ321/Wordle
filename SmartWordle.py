from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import RandomForestRegressor

app = Flask(__name__)
CORS(app)
            
def word_to_numbers(word):
    word = word.lower()
    # Convert each character in the word to a number and wrap in an array
    return np.array([ord(char) - ord('a') + 1 for char in word]).reshape(1, -1)


def choose_new_word(dic, test_words):
    # Prepare training data
    X_train = np.array([word_to_numbers(key)[0] for key in dic.keys()])  # Assuming dic.keys() are words
    y_train = np.array(list(dic.values()))
    
    # Prepare testing data
    X_test = np.array([word_to_numbers(word)[0] for word in test_words])  # Assuming test is a list of words

    # Initialize and train the model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    
    # Ensure that X_train is a 2D array with shape (n_samples, n_features)
    # This assumes that word_to_numbers() has already ensured a 2D shape per word
    if X_train.ndim == 1:
        X_train = X_train.reshape(-1, 1)
    
    if X_test.ndim == 1:
        X_test = X_test.reshape(-1, 1)

    model.fit(X_train, y_train)

    # Make predictions and evaluate
    predictions = model.predict(X_test)
    
    hard_words = []

    # Print the predictions with the associated words
    for word, prediction in zip(test_words, predictions):
        hard_words.append([round(prediction, 2), word])
    hard_words.sort(reverse = True)
    return hard_words[0][1]

@app.route('/')
def home():
    return render_template('SmartWordle.html')

@app.route('/choose_new_word', methods=['POST'])
def choose_new_word_api():
    content = request.json
    dic = content.get('dic', {})
    test_words = content.get('test', [])  # This should match the expected structure in `choose_new_word`
    result_word = choose_new_word(dic, test_words)
    return jsonify({'word': result_word})

if __name__ == '__main__':
    app.run(debug=True, port=5000)