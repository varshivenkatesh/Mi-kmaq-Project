/**
 * This checks the entered password to see if it is correct. If it is the upload feature is
 * unlocked, if not the user is informed of the incorrect code.
 *
 * Author: Ishani Kasaju
 *         Sheikh Saad Abdullah
 */

//creates conection to server url
const SERVER_URL = "http://" + "140.184.230.209" + ":40608";

// JQuery-like shorthand for referencing DOM objects
const $_ = (el) => document.querySelector(el);

const errorCallback = (err) => console.error(err.responseText);

// data required for the admin page
const adminData = {
    // properties
    username: "",
    passphrase: "",
    showPass: false,
    authenticated: false,

    // methods
    authenticate() {
        // check if password is correct
        $.post(
            SERVER_URL + "/authenticate",
            {
                username: this.username,
                passphrase: this.passphrase,
            },
            (res) => {
                this.authenticated = res.authenticated;
                if (!this.authenticated) {
                    swal({
                        title: "Incorrect Username or Password",
                        icon: "error",
                    });
                }
            }
        );
    },
};

// data required for the editor page
const editorData = {
    // properties
    currentWord: "",
    currentWordImage: "",
    currentWordAudio: "",
    wordList: [],

    // methods
    fetchWordList() {
        $.get(SERVER_URL + "/wordlist", (res) => {
            this.wordList = res.wordList;
        }).fail((err) => console.error(err.responseText));
    },
    audiosrc(word) {
        return `../assets/server/audio/${word}.wav`;
    },
    imgsrc(word) {
        return word === "newWord"
            ? "https://placehold.co/350x350/424242/424242"
            : `../assets/server/images/${word}.jpg`;
    },
    updateImagePreview(event) {
        this.currentWordImage = URL.createObjectURL(event.target.files[0]);
    },
    updateAudioPreview(event) {
        this.currentWordAudio = URL.createObjectURL(event.target.files[0]);
    },
    addNewWord(event) {
        this.wordList.push("newWord");
        this.currentWord = "newWord";
    },
    cancelChanges(event) {
        swal({
            title: "Cancel all changes to word?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willCancel) => {
            if (willCancel) {
                window.location.reload();
            }
        });
    },
    uploadConfirm() {
        swal({
            title: "Changes saved",
            icon: "success",
        }).then(() => {
            this.fetchWordList();
        });
    },
    deleteConfirm(word, index) {
        // double-check if user wants to remove word from list
        swal({
            title: `DELETE "${word}" from word list?`,
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                swal({
                    title: `Are you SURE you want to DELETE "${word}" from word list?`,
                    icon: "error",
                    buttons: true,
                    dangerMode: true,
                }).then((willDelete) => {
                    if (willDelete) {
                        // delete 1 word from given index (currently selected)
                        let wordToDelete = this.wordList.splice(index, 1)[0];
                        this.currentWord = this.wordList[0];
                        this.deleteWord(wordToDelete);
                        this.fetchWordList();
                    }
                });
            }
        });
    },
    deleteWord(wordToDelete) {
        $.post(SERVER_URL + "/delete", { word: wordToDelete }, (res) => {
            console.log("Word has been deleted.");
        }).fail(errorCallback);
    },
};
