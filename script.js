document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.wordle-grid');
    const keyboard = document.getElementById('keyboard');
    const input = document.getElementById('guessInput');
    const message = document.getElementById('message');
    
    
    for (let i = 0; i < 30; i++) {
        const box = document.createElement('div');
        box.className = 'wordle-box';
        grid.appendChild(box);
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
            input.value += key;
        }
    }

    window.submitGuess = () => {
        const guess = input.value.toUpperCase();
        if (guess.length === 5) {
            
            console.log("Guess submitted: ", guess);
            input.value = ''; 
            message.textContent = ''; 
        } else {
            message.textContent = "Please enter a 5-letter word.";
        }
    };
});
