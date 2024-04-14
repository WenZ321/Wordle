from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import RandomForestRegressor

app = Flask(__name__)
CORS(app)
            
def word_to_numbers(word):
    word = word.lower()
    return [ord(char) - ord('a') + 1 for char in word.lower()]

def choose_new_word(dic, test):
    # Prepare training data
    X_train = np.array([word_to_numbers(key) for key in dic.keys()])
    y_train = np.array(list(dic.values()))
    
    # Prepare testing data
    X_test = np.array([word_to_numbers(word) for word in test])

    # Initialize and train the model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Make predictions and evaluate
    predictions = model.predict(X_test)
    
    hard_words = []

    # Print the predictions with the associated words
    for word, prediction in zip(test, predictions):
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