# Generating a random word to pass into GenerateInitalBoxes
def GenerateWord():
    return ""

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


# Guessing mechanic
def guessing(wordGuessed):
    word = wordGuessed.upper()
    box = "<div class=\"wordle-box\"> Letter </div>"
    line = "\t    "
    for x in range(5):
        line += box.replace("Letter", word[x])
    return line

# If  player enters a guess, replace the current line with a new line 
replaceLine = guessing("Never")
temp = boxes.split("\n")
temp[currentLine] = replaceLine
boxes = "\n".join(temp)
currentLine += 1


print(boxes)