import random

# Creates bank of words

file = open("words.txt", "r")

words = []

for line in file:
    words.append(line.strip())
file.close()

# Generating a random word to pass into GenerateInitalBoxes
def GenerateWord():
    return words[random.randint(0, len(words))]

word = GenerateWord()

# Creates a dictionary of the indexes and the character at that index for the word the user is trying to guess
word_letters = {index: letter for index, letter in enumerate(word)}

# Returns an array of strings specifying the colors assigned to each box in given order
def process_guess(guess):
    # Creates another dictionary that is similar to word_letters, but for the guessed word
    guess_letters = {index: letter for index, letter in enumerate(guess)}
    placements = []
    # Assigns colors to the letters
    for i in range(len(guess_letters)):
        if guess_letters[i] in word_letters.values():
            if guess_letters[i] == word_letters[i]:
                placements.append("green")
            else:
                placements.append("yellow")
        else:
            placements.append("gray")
    return placements

def GenerateInitalBoxes(initialWord):
    word = initialWord.upper()
    boxTable = ''' \t<div class="wordle-grid">
            stuff
        </div>'''
    
    box = "<div class=\"wordle-box\"> Letter </div>"
    line = ""
    # First inital word
    for x in range(5):
        line += box.replace("Letter", word[x])
    line += "\n\t    "
    
    # Other boxes
    for x in range(4):
        for y in range(5):
            line += box.replace("Letter", " ")
        line += "\n\t    "
    boxTable = boxTable.replace("stuff", line[: len(line) - 6])
    return boxTable

boxes = GenerateInitalBoxes("HELLO")
currentLine = 2
print(boxes)


# Guessing mechanic
def guessing(wordGuessed):
    word = wordGuessed.upper()
    box = "<div class=\"wordle-box\"> Letter </div>"
    line = "\t    "
    for x in range(5):
        line += box.replace("Letter", word[x])
    return line
'''
# If  player enters a guess, replace the current line with a new line 
replaceLine = guessing("Never")
temp = boxes.split("\n")
temp[currentLine] = replaceLine
boxes = "\n".join(temp)
currentLine += 1
'''

