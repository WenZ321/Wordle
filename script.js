document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.wordle-grid');
    const keyboard = document.getElementById('keyboard');
    const input = document.getElementById('guessInput');
    const message = document.getElementById('message');
    document.addEventListener('keydown', (e) => {
        if (input.disabled) return;
    
        const key = e.key.toUpperCase();

        if (key.length === 1 && key >= 'A' && key <= 'Z') {
            if (input.value.length < 5) {
                input.value += key;
            }
        } else if (key === 'BACKSPACE' || e.key === 'Delete') {
            input.value = input.value.slice(0, -1);
        } else if (key === 'ENTER') {
            window.submitGuess();
        }
    });
    let wordsArray = []
    window.submitGuess = () => {
        
        if (currentAttempt >= 6) {
            message.textContent = "All attempts used. Game over!";
            disableInputAndKeyboard();
            return;
        }
        
        const guess = input.value.toUpperCase();
        message.textContent = "";
    
        if (guess.length !== 5) {
            message.textContent = "Please enter a 5-letter word.";
            return; 
        }
    
        if (wordsArray.indexOf(guess) === -1) {
            message.textContent = "Not a valid 5-letter word!";
            return; 
        }
    
        if (guess === randomWord.toUpperCase()) {
            displayGuessOnGrid(guess);
            message.textContent = "You win!";
            disableInputAndKeyboard(); 
        } else {
            console.log("Guess submitted:", guess);
            displayGuessOnGrid(guess);
            currentAttempt++;
            if (currentAttempt >= 6) {
                message.textContent = "Game over! The word was: " + randomWord;
                disableInputAndKeyboard(); 
            }
        }
    
        input.value = '';
    };
    
    function disableInputAndKeyboard() {
        input.disabled = true; 
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.disabled = true; 
        });
    }
    fetch('words.txt')
        .then(response => response.text())
        .then(text => {
            // Split the text by new line to create an array
            wordsArray = text.split('\n').map(word => word.trim()).filter(word => word.length > 0);
            console.log("Words loaded from file:", wordsArray);
            for(let i = 0; i < wordsArray.length; i++){
                wordsArray[i] = wordsArray[i].toUpperCase();
        }

        const lettersGuessed = [];


        function generateRandomWord(){
            const randomIndex = Math.floor(Math.random() * wordsArray.length);
            return wordsArray[randomIndex];
        }

        const randomWord = generateRandomWord().toUpperCase();

        for (let i = 0; i < 30; i++) {
            const box = document.createElement('div');
            box.className = 'wordle-box';
            grid.appendChild(box);
        }

        console.log(randomWord)

        const layout = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM←"];
        layout.forEach((row, index) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            row.split('').forEach(key => {
                const btn = document.createElement('button');
                btn.textContent = key === "←" ? "Delete" : key;
                btn.className = 'key';
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

        function handleKeyPress(key) {
            if (key === 'Enter') {
                submitGuess();
            } else if (key === '←') {
                input.value = input.value.slice(0, -1);
            } else if (input.value.length < 5) {
                input.value += key.toUpperCase();
            }
        }

        
        
        let currentAttempt = 0;

        window.submitGuess = () => {
            const guess = input.value.toUpperCase();

            message.textContent = "";

            if (guess.length !== 5) {
                message.textContent = "Please enter a 5-letter word.";
                return; 
            }

            if (wordsArray.indexOf(guess) === -1) {
                message.textContent = "Not a valid 5-letter word!";
                return; 
            }

            if (guess === randomWord.toUpperCase()) {
                displayGuessOnGrid(guess);
                message.textContent = "You win!";

            } else {
                console.log("Guess submitted:", guess);
                displayGuessOnGrid(guess);
                currentAttempt++;
            }

            input.value = '';

        };

        function displayGuessOnGrid(guess) {
            const startIdx = currentAttempt * 5; // Assuming currentAttempt is zero-based
            const boxes = document.querySelectorAll('.wordle-box');
            let dictionary = createLetterCountDictionary(randomWord)
            for (let i = 0; i < guess.length; i++) {
                if (guess[i] === randomWord[i]) {
                    boxes[startIdx + i].style.backgroundColor = 'green';
                    getKeyButton(guess[i]).style.backgroundColor = 'green';
                    dictionary[guess[i]] -= 1;
                }
            }
            for (let i = 0; i < guess.length; i++) {
                if (randomWord.includes(guess[i])) {
                    if (dictionary[guess[i]] > 0) {
                        boxes[startIdx + i].style.backgroundColor = 'yellow';
                        dictionary[guess[i]] -= 1;
                        if (getKeyButton(guess[i]).style.backgroundColor != 'green'){
                            getKeyButton(guess[i]).style.backgroundColor = 'yellow';
                        }
                    } else if (boxes[startIdx + i].style.backgroundColor != 'green'){
                        boxes[startIdx + i].style.backgroundColor = 'gray';
                        if (getKeyButton(guess[i]).style.backgroundColor != 'yellow' && getKeyButton(guess[i]).style.backgroundColor != 'green'){
                            getKeyButton(guess[i]).style.backgroundColor = 'gray';
                        }
                    }
                } else {
                    boxes[startIdx + i].style.backgroundColor = 'gray';
                    getKeyButton(guess[i]).style.backgroundColor = 'gray';
                }
                boxes[startIdx + i].textContent = guess[i];
            }
        }
            })
        .catch(err => {
            console.error('Problem reading the file:', err);
        });
    
    function createLetterCountDictionary(word) {
      let letterCount = {};
        
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

      return letterCount;
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


});
