//
// Purpose: Add functinality to the dictionary and word pages
//
// Author: Sam Fitzgerald - pageSet function and reveal function. Slight edit to playAudio function to make suit the specific need sof the dictionary better
//

// List of Audios for the words
const audioList = [   
    "../audios/wiktm.wav",
    "../audios/teluisi.wav",
    "../audios/nin.wav",
    "../audios/mijisi.wav",
    "../audios/ltu.wav",
    "../audios/kil.wav",
    "../audios/kesalk.wav",
    "../audios/eliey.wav",
    "../audios/aqq.wav"
]

//for use in the pageSet function
var currentWordPage;

// Purpose: keep track of the word page that is currently being accessed
//
// Parameters: x, int code for each word page
// return: void
function pageSet(x) {
    currentWordPage = x;
}

// Purpose: plays the audio associated with the current word page
//
// Parameters: none
//return: void
function playAudio() {
    var audio = new Audio();
    audio.src = audioList[currentWordPage];
    audio.play();
}

// Purpose: reveals hidden elements on the word page
//
// Parameters: none
//return: void
function reveal() {
    document.getElementById("revealButton").setAttribute("hidden", "true");
    document.getElementById("hiddenText").removeAttribute("hidden");
    document.getElementById("hiddenImg").removeAttribute("hidden");
}