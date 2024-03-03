document.addEventListener('DOMContentLoaded', () => {
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

    let numberOfGames = 0;

    // changeable values during the game
    let currentGuess = '';
    let currentBox = 1;
    let gameOver = false;
    let currentAttempt = 0;
    let randomWord = "";


    let wordsArray = [];

    //reads the list of words
    fetch('words.txt')
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
            box.style.borderColor = absent;
        });
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < letters.length; i++){
            getKeyButton(letters[i]).style.backgroundColor = '';
        }
        numberOfAttempts = 0;
        randomWord = generateRandomWord();
        console.log(randomWord);
        currentBox = 0;
        currentGuess = '';
        currentAttempt = 0;
        gameOver = false;
        numberOfGames += 1;
        enableKeyboard();
    }

    document.getElementById('playAgainButton').addEventListener('click', () => {
        newGame();
        playAgainButton.style.display = 'none';
    });

    // Accessing sessionStorage's dictionary
    function getDictionary(){
        const dictionaryString = sessionStorage.getItem('dictionary');
        const dictionary = dictionaryString ? JSON.parse(dictionaryString) : {};
        return dictionary;
    }

    // Runs when a key is pressed
    document.addEventListener('keydown', (e) => {
        if (gameOver) return;

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
        currentBox++;
    }

    function removeLetterOnGrid(){
        const boxes = document.querySelectorAll('.wordle-box');
        currentBox--;
        boxes[currentBox].textContent = "";
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
    

        const dictionary = getDictionary();
        for(let i = 0; i < currentGuess.length; i++){
            if(dictionary.hasOwnProperty(currentGuess.substring(i, i+1))){
                dictionary[currentGuess.substring(i, i+1)] += 1;
            } else {
                dictionary[currentGuess.substring(i, i+1)] = 1;
            }
        }

        if (currentGuess === randomWord) {
            updateColors(currentGuess);
            console.log("You Win!");
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
        const boxes = document.querySelectorAll('.wordle-box');
        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === randomWord[i]) {
                boxes[currentBox - 5 + i].style.backgroundColor = correct;
                boxes[currentBox - 5 + i].style.borderColor = correct;
                getKeyButton(guess[i]).style.backgroundColor = correct;
            } else if (randomWord.includes(guess[i])){
                boxes[currentBox - 5 + i].style.backgroundColor = present;
                boxes[currentBox - 5 + i].style.borderColor = present;
                if (getKeyButton(guess[i]).style.backgroundColor != correct){
                    getKeyButton(guess[i]).style.backgroundColor = present;
                }
            } else {
                boxes[currentBox - 5 + i].style.backgroundColor = absent;
                boxes[currentBox - 5  + i].style.borderColor = absent;
                getKeyButton(guess[i]).style.backgroundColor = absent;
            }
        }
        for (let i = 0; i < guess.length; i++){
            boxes[currentBox - 5 + i].style.color = 'white';
        }
    }
});
