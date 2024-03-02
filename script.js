document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.wordle-grid');
    const keyboard = document.getElementById('keyboard');
    const input = document.getElementById('guessInput');
    const message = document.getElementById('message');
    
    // Correct = green, present = yellow, absent = gray
    const correct = 'rgb(106, 170, 100)';
    const present = 'rgb(201, 180, 88)';
    const absent = 'rgb(120, 124, 126)';
    
    let currentAttempt = 0;
    
    
    function displayGuess(guess){
        const startIdx = currentAttempt * 5; // Assumes currentAttempt is defined elsewhere
        const boxes = document.querySelectorAll('.wordle-box');
        for (let i = 0; i < guess.length; i++){
            // Correctly setting the text content of each box
            boxes[startIdx + i].textContent = guess[i];
        }
        for (let i = guess.length; i < 5; i++){
            boxes[startIdx + i].textContent = "";
        }
    }
    
    function disableKeyboard(event) {
        event.preventDefault();
    }
    
    
    let currentInput = '';
    let keyboardEnabled = true;

    document.addEventListener('keydown', function(event) {
        // Check if the 'Enter' key is pressed to submit the current guess
        if (!keyboardEnabled) {
            return;
        }
        
        if (event.key === 'Enter') {
            // Call the submitGuess function when the user presses 'Enter'
            // Ensure the currentInput length is 5 to proceed with submission
            if(currentInput.length === 5){
                if (wordsArray.indexOf(currentInput.toUpperCase()) === -1) {
                    message.textContent = "Not a valid 5-letter word!";
                } else{
                    window.submitGuess(currentInput); // Assuming submitGuess handles the guess
                    currentInput = ''; // Reset currentInput after submission for the next guess
                }
            }
        } else {
            // Handle backspace for deletion or character input for guesses
            if (event.key === 'Backspace') {
                // Remove the last character
                currentInput = currentInput.slice(0, -1);
            } else if (event.key.length === 1 && event.key.match(/[a-z]/i) && currentInput.length < 5) {
                // Add new character, ensure it's a letter, and limit the input length
                currentInput += event.key;
            }

            // Display the current input, converted to upper case
            displayGuess(currentInput.toUpperCase());
        }
    });
    
    let wordsArray = []
    
    
    function disableInputAndKeyboard() {
        input.disabled = true; 
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.disabled = true; 
        });
    }
    
    // Reads file
    fetch('words.txt')
        .then(response => response.text())
        .then(text => {
            // Split the text by new line to create an array
            wordsArray = text.split('\n').map(word => word.trim()).filter(word => word.length > 0);
            console.log("Words loaded from file:", wordsArray);
            for(let i = 0; i < wordsArray.length; i++){
                wordsArray[i] = wordsArray[i].toUpperCase();
        }

        // Dictionary of guessed letters
        const lettersGuessed = [];

        // Generates random word
        function generateRandomWord(){
            const randomIndex = Math.floor(Math.random() * wordsArray.length);
            return wordsArray[randomIndex];
        }

        const randomWord = generateRandomWord().toUpperCase();

        // Creates the boxes
        for (let i = 0; i < 30; i++) {
            const box = document.createElement('div');
            box.className = 'wordle-box';
            grid.appendChild(box);
        }

        // Print the random word onto console
        console.log(randomWord)

        // Keyboard layout
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

        // Handles user input
        function handleKeyPress(key) {
            if (key === 'Enter') {
                submitGuess();
            } else if (key === '←') {
                input.value = input.value.slice(0, -1);
            } else if (input.value.length < 5) {
                input.value += key.toUpperCase();
            }
        }


        // Submit guess
        window.submitGuess = () => {
            const guess = currentInput.toUpperCase();

            message.textContent = "";

            if (guess.length !== 5) {
                message.textContent = "Please enter a 5-letter word.";
                return; 
            }

            if (guess === randomWord.toUpperCase()) {
                processGuess(guess);
                message.textContent = "You win!";
                keyboardEnabled = false;
            } else {
                console.log("Guess submitted:", guess);
                processGuess(guess);
                currentAttempt++;
                if (currentAttempt >= 6) {
                message.textContent = "Game over! The word was: " + randomWord;
                keyboardEnabled = false; 
            }
        }};
        
        
        // Processes guess
        function processGuess(guess) {
            const startIdx = currentAttempt * 5; // Assuming currentAttempt is zero-based
            const boxes = document.querySelectorAll('.wordle-box');
            let dictionary = createLetterCountDictionary(randomWord)
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
                        console.log(boxes[startIdx + i].style.backgroundColor);
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
            })
        .catch(err => {
            console.error('Problem reading the file:', err);
        });
    
    // Function that creates a dictionary of letters
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
