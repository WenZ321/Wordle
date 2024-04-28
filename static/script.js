document.addEventListener('DOMContentLoaded', () => {
    
    const messages = document.querySelectorAll('.flash-message');
    // Set a timeout to hide each message after 2 seconds
    messages.forEach((message) => {
        setTimeout(() => {
            message.classList.add('flash-message-hide');
        }, 2000);
    });
    
    // classes need the .
    const grid = document.querySelector('.wordle-grid');

    // div does not
    const keyboard = document.getElementById('keyboard');
    const playAgainButton = document.getElementById('playAgainButton');
    
    // Correct = green, present = yellow, absent = gray
    const correct = 'rgb(106, 170, 100)';
    const present = 'rgb(201, 180, 88)';
    const absent = 'rgb(120, 124, 126)';
    const blank = 'rgb(255, 255, 255)';
    const border = 'rgb(211,214,218)';

    let numberOfGames = 0;

    // changeable values during the game
    let currentGuess = '';
    let currentBox = 1;
    let gameOver = false;
    let currentAttempt = 0;
    let randomWord = "";
    let games = 0;
    let letter_frequency = generateLetterFreqDic();
    let guessed_letters = getDictionary();


    let wordsArray = [];
    let possibleWords = [];
    
    const guessed_words = {};
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    //reads the list of words
    fetch('/static/words.txt')
        // converts words.txt to a string 
        .then(response => response.text())

        // processing the file as a te
        .then(text => {
            // Split the text by new line to create an array
            wordsArray = text.split('\n').map(word => word.trim()).filter(word => word.length > 0);
            console.log("Words loaded from file:", wordsArray);
            for(let i = 0; i < wordsArray.length; i++){
                wordsArray[i] = wordsArray[i].toUpperCase();
            }
            possibleWords = wordsArray.map(item => item);
            newGame();
        })
        .catch(err => {
            console.error('Problem reading the file:', err);
        });
        
    // Creates the boxes
    for (let i = 0; i < 30; i++) {
        const box = document.createElement('div');
        box.className = 'wordle-box';
        grid.appendChild(box);
    }


    // 
    function handleKeyPress(key) {
        if (key === 'Delete') {
            console.log("a");
            if (currentGuess.length !== 0) {
                currentGuess = currentGuess.slice(0, -1);
                removeLetterOnGrid();
            }
        } else if (key === 'Enter') {
            window.submitGuess();
        } else if (currentGuess.length < 5) {
            currentGuess += key;
            displayLetterOnGrid(key);
        }
    }

    // Keyboard layout
    const layout = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM←"];
    layout.forEach((row, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        row.split('').forEach(key => {
            const btn = document.createElement('button');
            btn.textContent = key === "←" ? "Delete" : key;
            btn.className = 'key';
            btn.style.backgroundColor = border;
            btn.addEventListener('click', () => handleKeyPress(key));
            rowDiv.appendChild(btn);
        });
        if (index === 2) { 
            const enterBtn = document.createElement('button');
            enterBtn.textContent = 'Enter';
            enterBtn.className = 'key';
            enterBtn.addEventListener('click', () => handleKeyPress('Enter'));
            rowDiv.appendChild(enterBtn);
        }
        keyboard.appendChild(rowDiv);
    });

    // Generates random word
    function generateRandomWord(){
        const randomIndex = Math.floor(Math.random() * wordsArray.length);
        return wordsArray[randomIndex];
    } 

    // Clears and resets everything
    function newGame(){
        // clears boxes 
        const boxes = document.querySelectorAll('.wordle-box');
        boxes.forEach((box) => {
            box.style.backgroundColor = blank;
            box.textContent = "";
            box.style.borderColor = border;
        });
        for (let i = 0; i < letters.length; i++){
            getKeyButton(letters[i]).style.backgroundColor = border;
        }
        // Updates letter frequency dictionary
        for (const letter in guessed_letters){
            if (guessed_letters[letter] === true){
                letter_frequency[letter] += 1;
            }
        }
        numberOfAttempts = 0;
        console.log(letter_frequency);
        if (games > 1){
            updateRandomWord();
        } else randomWord = generateRandomWord();
        console.log(randomWord);
        currentBox = 0;
        currentGuess = '';
        currentAttempt = 0;
        gameOver = false;
        numberOfGames += 1;
        guessed_letters = getDictionary();
        enableKeyboard();
    }

    document.getElementById('playAgainButton').addEventListener('click', () => {
        games += 1;
        newGame();
        playAgainButton.style.display = 'none';
    });

    // Creating dictionary of true and false for tracking guessed letters
    function getDictionary(){
        const dic = {};
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (const letter of letters) {
            dic[letter] = false;
        }
        return dic;
    }

    window.onload = function() {
        sessionStorage.clear();
    };
    
    // Runs when a key is pressed
    document.addEventListener('keydown', (e) => {
        // Check if the game is over or if the focus is on an input field
        if (gameOver || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
            return; // Ignore the event if the game is over or the focus is on input, textarea, or select
        }

        const key = e.key.toUpperCase();
        if (key.length === 1 && key >= 'A' && key <= 'Z') {
            if (currentGuess.length < 5) {
                currentGuess += key;
                displayLetterOnGrid(key);
            }
        } else if (key === 'BACKSPACE' || e.key === 'Delete') {
            if(currentGuess.length !== 0){
                currentGuess = currentGuess.slice(0, -1);
                removeLetterOnGrid();
            }
        } else if (key === 'ENTER') {
            window.submitGuess();
        }
    });
    

    function displayLetterOnGrid(letter){
        const boxes = document.querySelectorAll('.wordle-box');
        boxes[currentBox].textContent = letter;
        boxes[currentBox].style.color = '';
        boxes[currentBox].style.borderColor = absent;
        currentBox++;
    }

    function removeLetterOnGrid(){
        const boxes = document.querySelectorAll('.wordle-box');
        currentBox--;
        boxes[currentBox].textContent = "";
        boxes[currentBox].style.borderColor = border;
    }
    
    // Chooses new word
    async function getNewWord(dic, test, freq) {
        const response = await fetch('/choose_new_word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dic: dic, test: test, frequency: freq}),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        const word = String(data.word); // Convert the result to a string
        console.log(word);  // Use the returned word as needed, now guaranteed to be a string
        return word;
    }
    
    // Calls the function that generates the new word
    async function updateRandomWord() {
        try {
            const newWord = await getNewWord(guessed_words, possibleWords, letter_frequency);
            randomWord = newWord.toUpperCase(); // Now newWord should be a string and can be converted to upper case
        } catch (error) {
            console.error("Failed to get new word:", error);
        }
    }

    
    window.submitGuess = () => {
        if (currentGuess.length !== 5) {
            console.log("Please enter a 5-letter word.");
            return; 
        }
    
        if (wordsArray.indexOf(currentGuess) === -1) {
            console.log("Not a valid 5-letter word!");
            return; 
        }
    
        for(let i = 0; i < currentGuess.length; i++){
            const letter = currentGuess[i];
            guessed_letters[letter] = true;
        }
        console.log('Updated Dictionary:', guessed_letters);

        if (currentGuess === randomWord) {
            updateColors(currentGuess);
            console.log("You Win!");
            guessed_words[randomWord] = currentAttempt;
            possibleWords = possibleWords.filter(item => item !== randomWord);
            disableKeyboard();
            gameOver = true;
            playAgainButton.style.display = 'inline-block';
            
            currentGuess = '';
        } else {
            updateColors(currentGuess);
            console.log("Guess submitted:", currentGuess);
            currentAttempt++;
            if (currentAttempt >= 6) {
                console.log("Game over! The word was: " + randomWord);
                guessed_words[randomWord] = currentAttempt;
                disableKeyboard(); 
                gameOver = true;
                playAgainButton.style.display = 'inline-block';
            }
            currentGuess = '';
        }
    };
    
    function disableKeyboard() {
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.disabled = true; 
        });
    }

    function enableKeyboard() {
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.disabled = false;
        });
    }
    
    // Function to get the button DOM element for a specific letter
    function getKeyButton(letter) {
        // Select all buttons with class 'key'
        const buttons = document.querySelectorAll('.key');
  
        // Iterate over the buttons to find the one that matches the letter
        for (const btn of buttons) {
          if (btn.textContent === letter) {
            return btn; // Return the button that matches the letter
          }
        }
  
        return null; // If no button matches the letter, return null
      }

    // Processes guess and changes color accordingly
    function updateColors(guess) {
            const startIdx = currentAttempt * 5; // Assuming currentAttempt is zero-based
            const boxes = document.querySelectorAll('.wordle-box');
            let dictionary = createLetterCountDictionary(randomWord);
            for (let i = 0; i < guess.length; i++) {
                if (guess[i] === randomWord[i]) {
                    boxes[startIdx + i].style.backgroundColor = correct;
                    boxes[startIdx + i].style.borderColor = correct;
                    getKeyButton(guess[i]).style.backgroundColor = correct;
                    dictionary[guess[i]] -= 1;
                }
            }
            for (let i = 0; i < guess.length; i++) {
                if (randomWord.includes(guess[i])) {
                    if (dictionary[guess[i]] > 0 && boxes[startIdx + i].style.backgroundColor != correct) {
                        boxes[startIdx + i].style.backgroundColor = present;
                        boxes[startIdx + i].style.borderColor = present;
                        dictionary[guess[i]] -= 1;
                        if (getKeyButton(guess[i]).style.backgroundColor != correct){
                            getKeyButton(guess[i]).style.backgroundColor = present;
                        }
                    } else if (boxes[startIdx + i].style.backgroundColor != correct){
                        boxes[startIdx + i].style.backgroundColor = absent;
                        boxes[startIdx + i].style.borderColor = absent;
                        if (getKeyButton(guess[i]).style.backgroundColor != present && getKeyButton(guess[i]).style.backgroundColor != correct){
                            getKeyButton(guess[i]).style.backgroundColor = absent;
                        }
                    }
                } else {
                    boxes[startIdx + i].style.backgroundColor = absent;
                    boxes[startIdx + i].style.borderColor = absent;
                    getKeyButton(guess[i]).style.backgroundColor = absent;
                }
                boxes[startIdx + i].textContent = guess[i];
                boxes[startIdx + i].style.color = 'white';
            }
        }
    
    function createLetterCountDictionary(word) {
        let letterCount = {};

        if (typeof word === 'string') {
            word = word.toUpperCase();

            // Convert the word to an array of characters and iterate over it
            word.split('').forEach(char => {
                // If the character is already in the dictionary, increment its count
                if (letterCount[char]) {
                    letterCount[char]++;
                } else {
                    // Otherwise, add the character to the dictionary with a count of 1
                    letterCount[char] = 1;
                }
            });
        } else {
            console.error('Expected a string for word, received:', word);
            console.error(typeof word);
        }

        return letterCount;
    }
    
    function generateLetterFreqDic() {
        const dic = {};
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (const letter of letters) {
            dic[letter] = 0;
        }
        return dic;
    }

});