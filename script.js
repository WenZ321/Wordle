document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.wordle-grid');
    const keyboard = document.getElementById('keyboard');
    const input = document.getElementById('guessInput');
    const message = document.getElementById('message');
    
    
    const wordsArray = [
        "apple", "brick", "crane", "drake", "eagle", 
        "frame", "grape", "haste", "image", "joker", 
        "knife", "laser", "mango", "noble", "opera", 
        "pride", "quill", "robin", "snake", "tiger", 
        "ultra", "vivid", "wheat", "xenon", "yacht", 
        "zebra", "alert", "bench", "craft", "dance", 
        "elope", "fancy", "globe", "hobby", "ivory", 
        "jolly", "koala", "lemon", "mirth", "nylon",
        "octal", "piano", "query", "rally", "saint", 
        "teach", "unity", "valor", "worry", "xerox", 
        "yield", "zesty"
    ];
    
    for(let i = 0; i < wordsArray.length; i++){
        wordsArray[i] = wordsArray[i].toUpperCase();
    }

    const lettersGuessed = [];

    /* reading file (doesnt quite work yet)
    const fs = require("fs");
    const path = require("path");

    const filePath = path.join(__dirname, 'words.txt');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if(err) {
            console.error('Problem reading the file: ', err);
            return;
        }

        wordsArray = data.split('\n').map(word => word.trim()).filter(word => word.length > 0);
    });
    */


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

    

    for (let i = 0; i < 5; i++) {
        const boxes = document.querySelectorAll('.wordle-box');
        boxes[i].textContent = randomWord[i].toUpperCase();
    }

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
        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === randomWord[i]) {
                boxes[startIdx + i].style.backgroundColor = 'green';
            } else if (randomWord.includes(guess[i])) {
                boxes[startIdx + i].style.backgroundColor = 'yellow';
            } else {
                boxes[startIdx + i].style.backgroundColor = 'gray';
            }
            boxes[startIdx + i].textContent = guess[i];
        }
    }


});
