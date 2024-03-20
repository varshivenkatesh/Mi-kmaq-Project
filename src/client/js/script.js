document.addEventListener("alpine:init", () => {
    Alpine.store("started", false);
});

//creates conection to server url
const SERVER_URL = "http://140.184.230.209:40608";

const globalData = {
    // attributes

    atMenu: true,
    gameStarted: false,
    currentWord: "",
    wordOptions: [],
    wordList: [],
    correctList: [],

    // functions

    /**
     * plays audio
     * @author Naziya Tasnim
     * @param {string} url audio url
     */
    playAudio(url) {
        new Audio(url).play();
    },
    /**
     * displays game page and starts the game loop
     * @author Sheikh Saad Abdullah
     * @author Naziya Tasnim
     */
    startGame() {
        this.gameStarted = true;
        this.gameSetup();
    },
    /**
     * resets game variable and displays main page
     * @author Sheikh Saad Abdullah
     * @author Naziya Tasnim
     */
    endGame() {
        this.correctList = [];
        this.gameStarted = false;
    },
    /**
     * pulls word list from server
     * @author Naziya Tasnim
     * @author Sarah Derby
     */
    getWordBank() {
        $.get(SERVER_URL + "/wordlist", (res) => {
            this.wordList = res.wordList;
        }).fail((err) => {
            console.log(err);
        });
    },
    /**
     * get random word from wordList
     * @author Naziya Tasnim
     * @returns {string} random word
     */
    getRandomWord() {
        return this.wordList[Math.floor(Math.random() * this.wordList.length)];
    },
    /**
     * assigns a new word from wordList to currentWord
     * @author Naziya Tasnim
     */
    resetCurrentWord() {
        let word = this.getRandomWord();
        while (this.correctList.includes(word)) {
            word = this.getRandomWord();
        }
        this.currentWord = word;
    },
    /**
     * sets up Multiple Choice game by assigning words for other options
     * @author Naziya Tasnim
     */
    setGameMultiChoice() {
        this.wordOptions[0] = this.currentWord;

        let word = this.getRandomWord();
        for (let i = 1; i <= 2; i++) {
            while (
                word == this.currentWord ||
                word == this.wordOptions[i - 1]
            ) {
                word = this.getRandomWord();
            }
            this.wordOptions[i] = word;
        }
        this.wordOptions.sort(() => Math.random() - 0.5);
    },
    /**
     * checks if response is correct and moves to next round
     * @author Naziya Tasnim
     * @param {string} selection selected word
     */
    evaluateResponse(selection) {
        if (selection == this.currentWord) {
            swal({
                title: "kelu'lk tela'tekn",
                text: `Correct picture for ${this.currentWord}`,
                icon: "success",
                button: "OK",
            });
            this.correctList.push(this.currentWord);
        } else {
            swal({
                title: "tknu'kwalsi ap",
                icon: "error",
                button: "Try Again",
            });
        }
        this.gameSetup();
    },
    /**
     * sets game variables for new round
     * @author Naziya Tasnim
     */
    gameSetup() {
        if (
            this.gameStarted &&
            this.correctList.length != this.wordList.length
        ) {
            this.resetCurrentWord();
            this.setGameMultiChoice();
        } else {
            this.endGame();
        }
    },
};
