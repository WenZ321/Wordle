document.addEventListener('DOMContentLoaded', async () => {
    
    console.log('Letter Frequencies:', letterFrequency);
    console.log('User Game Data:', userData);
    console.log('Number of games:', num_games);
    
    const messages = document.querySelectorAll('.flash-message');
    // Set a timeout to hide each message after 2 seconds
    messages.forEach((message) => {
        setTimeout(() => {
            message.classList.add('flash-message-hide');
        }, 2000);
    });
    
    // classes need the .
    const grid = document.querySelector('.wordle-grid');

    const chatBox = document.getElementById('chatBox');

    // div does not
    const keyboard = document.getElementById('keyboard');
    const playAgainButton = document.getElementById('playAgainButton');
    const leaderboardIcon = document.getElementById('leaderboardIcon');
    const leaderboardPopup = document.getElementById('leaderboardPopup');
    const closeButton = document.getElementById('closeButton');
    const leaderboardSelect = document.getElementById('leaderboardSelect');
    const leaderboardBody = document.getElementById('leaderboardBody');
    const playerRankBody = document.getElementById('playerRankBody');
    
    // Correct = green, present = yellow, absent = gray
    const correct = 'rgb(106, 170, 100)';
    const present = 'rgb(201, 180, 88)';
    const absent = 'rgb(120, 124, 126)';
    const blank = 'rgb(255, 255, 255)';
    const border = 'rgb(211,214,218)';
    
    // Sidebar
    const toggleSidebarButton = document.getElementById('toggleSidebarButton');
    const statsSidebar = document.getElementById('statsSidebar');

    // changeable values during the game
    let currentGuess = '';
    let currentBox = 1;
    let gameOver = false;
    let currentAttempt = 0;
    let randomWord = "";
    let games = num_games;
    let wins = 0;
    let letter_frequency = letterFrequency;
    let guessed_letters = getDictionary();
    let start_game = false;
    let isAnimating = false;
    let win = false;
    
    // Update the wins
    for (const [word, guessCount] of Object.entries(userData)) {
        if (guessCount <= 6) {
            wins++;  // Increment wins if the number of guesses is 6 or fewer
        }
    }

    let wordsArray = [];
    let possibleWords = [];
    
    const guessed_words = userData;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    let hardMode = false;
    let mustHave = ['', '', '', '', ''];
    let mustContain = [];

    // Function to toggle hard mode
    function toggleHardMode() {
        hardMode = !hardMode;
        const label = document.getElementById('toggleLabel');
        label.textContent = hardMode ? 'Hard Mode: ON' : 'Hard Mode: OFF';
        console.log('Hard Mode:', hardMode);
    }

    // Add event listener to the toggle hard mode switch
    const toggleHardModeSwitch = document.getElementById('toggleHardMode');
    
    const toggleContainer = document.querySelector('.toggle-container');
    console.log(toggleContainer);
    if (!session){
        toggleContainer.classList.add('logged-out-position');
    }
    
    toggleHardModeSwitch.addEventListener('change', () => {
        toggleHardMode();
    });
    
    // For sidebar
    toggleSidebarButton.addEventListener('click', () => {
        statsSidebar.classList.toggle('open');
    });
    
    leaderboardIcon.addEventListener('click', () => {
        leaderboardPopup.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
        leaderboardPopup.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (!leaderboardPopup.contains(event.target) && event.target !== leaderboardIcon) {
            leaderboardPopup.style.display = 'none';
        }
    });
    
    leaderboardSelect.value = 'win_streak';
    
    leaderboardSelect.addEventListener('change', () => {
        const selectedLeaderboard = leaderboardSelect.value;
        // Fetch and display the leaderboard data based on the selection
        updateLeaderboard(selectedLeaderboard);
    });
    
    const event = new Event('change');
    leaderboardSelect.dispatchEvent(event);
    
    let messageQueue = [];

    function displayMessage(message) {
      const chatBox = document.getElementById('chatBox');
      const messageElement = document.createElement('div');
      messageElement.className = 'message';
      messageElement.textContent = message;

      chatBox.prepend(messageElement); // Add message to the top
      messageElement.style.display = 'block'; // Ensure the message is displayed
      messageQueue.push(messageElement);

      setTimeout(() => {
        messageElement.classList.add('message-disappearing'); // Add disappearing class to fade out

        setTimeout(() => {
          chatBox.removeChild(messageElement); // Remove the message from the DOM
          messageQueue.shift(); // Remove the first message from the queue
        }, 1000); // Wait for the fade-out transition to complete
      }, 2000); // Display the message for 2 seconds
    }

    function updateMessagePositions() {
      messageQueue.forEach((message, index) => {
        message.style.transform = `translateY(${index * 50}px)`;
      });
    }

    //reads the list of words
    await fetch('/static/words.txt')
        // converts words.txt to a string 
        .then(response => response.text())

        // processing the file as a text
        .then(text => {
            // Split the text by new line to create an array
            wordsArray = text.split('\n').map(word => word.trim()).filter(word => word.length > 0);
            console.log("Words loaded from file:", wordsArray);
            for(let i = 0; i < wordsArray.length; i++){
                wordsArray[i] = wordsArray[i].toUpperCase();
            }
            possibleWords = wordsArray.map(item => item);
            possibleWords = possibleWords.filter(word => !(word in guessed_words));
        })
        .catch(err => {
            console.error('Problem reading the file:', err);
        });
        
    // Creates the boxes
    for (let i = 0; i < 29; i++) {
        const box = document.createElement('div');
        box.className = 'wordle-box';

        const front = document.createElement('div');
        front.className = 'front';

        const back = document.createElement('div');
        back.className = 'back';

        box.appendChild(front);
        box.appendChild(back);
        grid.appendChild(box);
    }


    // 
    function handleKeyPress(key) {
        if (isAnimating) return;
        if (key === 'Delete') {
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
    const layout = ["QWERTYUIOP", "ASDFGHJKL", "EZXCVBNM←"];
    layout.forEach((row, index) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        row.split('').forEach(key => {
            if (key === "E" && index === 2) {
                const enterBtn = document.createElement('button');
                enterBtn.textContent = 'Enter';
                enterBtn.className = 'key enter-key';
                enterBtn.style.backgroundColor = border;
                enterBtn.addEventListener('click', () => handleKeyPress('Enter'));
                rowDiv.appendChild(enterBtn);
            } else if (key === "←") {
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '&#x232B;'; // Unicode for Delete (Backspace) symbol
                deleteBtn.className = 'key delete-key';
                deleteBtn.style.backgroundColor = border;
                deleteBtn.addEventListener('click', () => handleKeyPress('Delete'));
                rowDiv.appendChild(deleteBtn);
            } else {
                const btn = document.createElement('button');
                btn.textContent = key;
                btn.className = 'key';
                btn.style.backgroundColor = border;
                btn.addEventListener('click', () => handleKeyPress(key));
                rowDiv.appendChild(btn);
            }
        });
        keyboard.appendChild(rowDiv);
    });

    // Generates random word
    function generateRandomWord(){
        const randomIndex = Math.floor(Math.random() * wordsArray.length);
        return wordsArray[randomIndex];
    } 

    function updateStats(games, wins) {
        document.getElementById('games-played').textContent = games;
        document.getElementById('wins').textContent = wins;
        document.getElementById('win-percentage').textContent = Math.round((wins / games) * 100) + '%';
    }

    updateStats(games, wins);
    
    function renderGuessStats() {
        const totalGames = games;
        const guessStats = Array(7).fill(0); // 6 for guesses 1-6 and 1 for losses

        for (const [word, guessCount] of Object.entries(userData)) {
            if (guessCount <= 6) {
                guessStats[guessCount - 1]++;
            } else {
                guessStats[6]++; // Count losses
            }
        }

        const statsContainer = document.getElementById('guess-stats');
        statsContainer.innerHTML = '';

        guessStats.forEach((count, index) => {
            const percentage = totalGames ? (count / totalGames * 100).toFixed(2) : 0;
            console.log(`Index: ${index}, Count: ${count}, Percentage: ${percentage}%`);

            const barContainer = document.createElement('div');
            barContainer.classList.add('guess-bar');

            const guessNumber = index < 6 ? `${index + 1}` : "Lost"; // Label for guesses 1-6 and Lost
            const barColor = index < 6 ? '#4CAF50' : '#FF0000'; // Green for guesses, Red for losses

            const barFill = document.createElement('div');
            barFill.classList.add('guess-bar-fill');
            barFill.style.width = percentage + '%';
            barFill.style.backgroundColor = barColor;
            barFill.textContent = count > 0 ? `${count}` : ''; // Show count inside the bar

            const label = document.createElement('span');
            label.classList.add('guess-label');
            label.textContent = guessNumber;

            barContainer.appendChild(label);
            barContainer.appendChild(barFill);
            statsContainer.appendChild(barContainer);
        });
    }

    renderGuessStats();
   

    // Clears and resets everything
    function newGame(){
        // clears boxes 
        const boxes = document.querySelectorAll('.wordle-box');
        boxes.forEach((box) => {
            const front = box.querySelector('.front');
            front.style.backgroundColor = blank;
            front.textContent = "";
            front.style.borderColor = border;
            const back = box.querySelector('.back');
            back.style.backgroundColor = blank;
            back.textContent = "";
            back.style.borderColor = border;
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
        if (start_game === true){
            if (games > 1){
                updateRandomWord();
            } else if (games === 1) {
                updateRandomWord();
            } else randomWord = generateRandomWord();
        }
        console.log(randomWord);
        currentBox = 0;
        currentGuess = '';
        currentAttempt = 0;
        gameOver = false;
        mustContain = [];
        mustHave = ['', '', '', '', ''];
        guessed_letters = getDictionary();
        enableKeyboard();
        updateStats(games, wins);
        renderGuessStats();
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
        const key = e.key.toUpperCase();
        // Check if the game is over or if the focus is on an input field
        if ((isAnimating && key != 'ENTER')|| gameOver || document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') {
            return; // Ignore the event if the game is over or the focus is on input, textarea, or select
        }
        

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
        const front = boxes[currentBox].querySelector('.front');
        front.textContent = letter;
        front.style.color = '';
        front.style.borderColor = absent;
        currentBox++;
    }

    function removeLetterOnGrid(){
        const boxes = document.querySelectorAll('.wordle-box');
        currentBox--;
        const front = boxes[currentBox].querySelector('.front');
        front.textContent = "";
        front.style.borderColor = border;
    }
    
    // Function to flip the boxes
    function flipBox(box, letter, state) {
        const front = box.querySelector('.front');
        const back = box.querySelector('.back');

        if (!front || !back) {
            console.error("Missing .front or .back element in .wordle-box", box);
            return;
        }
        // Update front face
        front.textContent = letter;
        // Update back face with state-specific styles
        back.textContent = letter;
        front.style.color = 'white';
        back.style.color = 'white';
        if (state === 'correct') {
            back.style.backgroundColor = correct;
            back.style.borderColor = correct;
        } else if (state === 'present') {
            back.style.backgroundColor = present;
            back.style.borderColor = present;
        } else if (state === 'absent') {
            back.style.backgroundColor = absent;
            back.style.borderColor = absent;
        }

        // Add the flipped class to trigger the animation
        box.classList.add('flipped');
            setTimeout(() => {
            box.classList.add('no-transition'); // Disable transition
            box.classList.remove('flipped');
            front.style.backgroundColor = back.style.backgroundColor;
            front.style.borderColor = back.style.borderColor;

            // Force reflow to apply the no-transition class immediately
            void box.offsetWidth;

            // Remove the no-transition class to re-enable transition
            box.classList.remove('no-transition');
        }, 400);
    }
    
    // Chooses new word
    async function getNewWord(dic, test, freq) {
        const response = await fetch('/choose_new_word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ dic: dic, test: test, frequency: freq, win: win}),
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
    
    async function update_game(guess, game_over){
        const response = await fetch('/update_game',{
            method: 'POST',
            headers: {'Content-Type': 'application/json',
            },
            body: JSON.stringify({ guess: guess, game_over: game_over}),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
    }
    
    async function setRandom(word) {
        const response = await fetch('/set_last',{
            method: 'POST',
            headers: {'Content-Type': 'application/json',
            },
            body: JSON.stringify({ word: word}),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
    }
    
    // Define the async function get_game_data
    async function get_game_data() {
        try {
            const response = await fetch('/get_unsuccessful_guesses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            randomWord = String(data.randomWord).toUpperCase();
            if (randomWord === ''){
                randomWord = generateRandomWord();
                setRandom(randomWord);
            }
            console.log(randomWord)
            return data.guesses // Ensure the function returns the guesses array
        } catch (error) {
            console.error('Failed to fetch game data:', error);
            return [];
        }
    }

    
    window.submitGuess = () => {
        if (currentGuess.length !== 5) {
            console.log("Please enter a 5-letter word.");
            displayMessage("Please enter a 5-letter word.");
            shake();
            return; 
        }
    
        if (wordsArray.indexOf(currentGuess) === -1) {
            console.log("Not a valid 5-letter word!");
            displayMessage("Not a valid 5-letter word!");
            shake();
            return; 
        }
        
        if (hardMode === true){
            for (let i = 0; i < 5; i++){
                if (mustHave[i] != currentGuess[i] && mustHave[i] != ''){
                    let end = "st";
                    if (i === 1){
                        end = "nd";
                    } else if (i === 2){
                        end = "rd";
                    } else if (i === 3 || i === 4){
                        end = "th";
                    }
                    displayMessage(i + 1 + end + " letter must be " + mustHave[i]);
                    shake();
                    return;
                }
            }
            for (let i = 0; i < mustContain.length; i++){
                if (!currentGuess.includes(mustContain[i])){
                    displayMessage("Guess must contain " + mustContain[i]);
                    shake();
                    return;
                }
            }
        }
    
        for(let i = 0; i < currentGuess.length; i++){
            const letter = currentGuess[i];
            guessed_letters[letter] = true;
        }
        
        console.log('Updated Dictionary:', guessed_letters);

        if (currentGuess === randomWord) {
            updateColors(currentGuess);
            displayMessage("You Win!");
            console.log("You Win!");
            currentAttempt++;
            guessed_words[randomWord] = currentAttempt;
            possibleWords = possibleWords.filter(item => item !== randomWord);
            disableKeyboard();
            gameOver = true;
            win = true;
            if (start_game){
                update_game(currentGuess, gameOver);
            }
            wins++;
            setTimeout(() => {
                playAgainButton.style.display = 'inline-block';
            }, 3000);
            currentGuess = '';
        } else {
            chatBox.textContent = "";
            updateColors(currentGuess);
            console.log("Guess submitted:", currentGuess);
            currentAttempt++;
            if (currentAttempt >= 6) {
                console.log("Game over! The word was: " + randomWord);
                displayMessage("Game over! The word was: " + randomWord);
                guessed_words[randomWord] = 10;
                possibleWords = possibleWords.filter(item => item !== randomWord);
                disableKeyboard(); 
                gameOver = true;
                win = false;
                playAgainButton.style.display = 'inline-block';
            }
            if (start_game){
                update_game(currentGuess, gameOver);
            }
            currentGuess = '';
        }
    };
    
    let game_guesses = await get_game_data();
    
    console.log(game_guesses);

    function submitPreviousGuesses(guesses) {
        for (let guess of guesses) {
            currentGuess = guess;
            window.submitGuess();
        }
        currentBox = currentAttempt * 5;
    }
    
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
    function updateColors(guess) {
        const startIdx = currentAttempt * 5; // Assuming currentAttempt is zero-based
        const boxes = document.querySelectorAll('.wordle-box');
        let dictionary = createLetterCountDictionary(randomWord);
        let guessState = ['absent', 'absent', 'absent', 'absent', 'absent']
        console.log(randomWord);
    
        for (let i = 0; i < guess.length; i++) {
            if (guess[i] === randomWord[i]) {
                guessState[i] = 'correct';
                getKeyButton(guess[i]).style.backgroundColor = correct;
                dictionary[guess[i]] -= 1;
                mustHave[i] = guess[i];
                console.log(mustHave);
            }
        }
        for (let i = 0; i < guess.length; i++) {
            if (randomWord.includes(guess[i])) {
                if (dictionary[guess[i]] > 0 && guessState[i] != 'correct') {
                    guessState[i] = 'present';
                    dictionary[guess[i]] -= 1;
                    if (!mustContain.includes(guess[i])){
                        mustContain.push(guess[i]);
                        console.log(mustContain);
                    }
                    if (getKeyButton(guess[i]).style.backgroundColor != correct){
                        getKeyButton(guess[i]).style.backgroundColor = present;
                    }
                } else if (guessState[i] != 'correct'){
                    guessState[i] = 'absent';
                    if (getKeyButton(guess[i]).style.backgroundColor != present && getKeyButton(guess[i]).style.backgroundColor != correct){
                        getKeyButton(guess[i]).style.backgroundColor = absent;
                    }
                }
            } else {
                guessState[i] = 'absent';
                getKeyButton(guess[i]).style.backgroundColor = absent;
            }
        }
        
        isAnimating = true;
        for (let i = 0; i < guess.length; i++){
            setTimeout(() => {
                flipBox(boxes[startIdx + i], guess[i], guessState[i]);
            }, i * 400);
            setTimeout(() => {
                isAnimating = false; // End animation
            }, 2000);
        }
    
        // Check if win
        if (guess === randomWord) {
            setTimeout(() => {
                for (let i = startIdx; i < startIdx + 5; i++) {
                    setTimeout(() => {
                        boxes[i].classList.add('win');
                    }, (i - startIdx) * 100);
                }

                // Set a timeout to remove the 'win' class and change color to 'present'
                setTimeout(() => {
                    for (let i = startIdx; i < startIdx + 5; i++) {
                        boxes[i].classList.remove('win');
                    }
                }, 2000); // Delay in milliseconds
            }, guess.length * 400); // Ensure this runs after all boxes have flipped
            win = true;
        }
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
    

    function shake(){
        const boxes = document.querySelectorAll('.wordle-box');
        const startIdx = currentAttempt * 5;
        if (isAnimating){
            return;
        }
        for (let i = startIdx; i < startIdx + 5; i++){
            boxes[i].classList.add('shake');
        }
        isAnimating = true
        setTimeout(() => {
            for (let i = startIdx; i < startIdx + 5; i++){
                boxes[i].classList.remove('shake');
            }
            isAnimating = false;
        }, 500);
    }
    
    async function updateLeaderboard(leaderboardType) {
        try {
            const data = await fetchLeaderboardData(leaderboardType);
            const username = await getUsername();
            displayLeaderboard(data, username);
        } catch (error) {
            console.error('Error updating leaderboard:', error);
        }
    }

    function displayLeaderboard(data, username) {
        const leaderboardBody = document.getElementById('leaderboard-body');
        if (!leaderboardBody) {
            console.error('leaderboard-body element not found');
            return;
        }

        console.log('data', data);
        leaderboardBody.innerHTML = '';  // Clear existing content

        for (let i = 0; i < data.length; i++) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${i + 1}</td>
                <td>${data[i].player}</td>
                <td>${data[i].score}</td>
            `;
            if (username === data[i].player) {
                row.classList.add('highlighted');
            }
            leaderboardBody.appendChild(row);
        }
    }

    async function fetchLeaderboardData(leaderboardType) {
        try {
            const leaderboard = await getLeaderBoardData();

            const data = {
                win_streak: leaderboard.win_streak,
                wins: leaderboard.wins,
                average_guesses: leaderboard.average_guesses
            };

            console.log(data); // Debugging line
            return data[leaderboardType];
        } catch (error) {
            console.error('Error fetching leaderboard data:', error);
        }
    }

    async function getLeaderBoardData(){
        const response = await fetch('/get_leaderboard_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const leaderboard_win_streak = data.win_streak;
        const leaderboard_wins = data.wins;
        const leaderboard_guesses = data.guesses;

        console.log("streak", leaderboard_win_streak);
        console.log("wins", leaderboard_wins);
        console.log("guesses", leaderboard_guesses);

        return {
            win_streak: leaderboard_win_streak,
            wins: leaderboard_wins,
            average_guesses: leaderboard_guesses
        };
    }

    async function getUsername(){
        const response = await fetch('/get_username', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        return String(data.username);
    }

    newGame();
    
    submitPreviousGuesses(game_guesses);
    
    start_game = true;

});