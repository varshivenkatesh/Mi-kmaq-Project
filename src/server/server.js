/**
 * This file handles all server side operations and performs various
 * functions such as post, get, and listen, as well as callbacks to the client side.
 *
 * Authors: Sarah Derby   -  created the get function to retrieve files from server
 *          Ishani Kasaju - created the post function to upload files to server
 *          Terry Goldsmith - gave base code for getting a server properly set up
 */

//Loads in required frameworks and sets server and port constants

//File system, allows access into file system structure
const fs = require("fs");

//Path allows for movement through file system structure
const path = require("path");

//allows setup of an express server
const express = require("express");

//allows upload to an express server
const upload = require("express-fileupload");

//sets server to be express
const server = express();

//port number
const port = 40608;

// public files
server.use(express.static(__dirname + "../../src/client"));

//creates constants for file paths
const AUDIO_PATH = "assets/server/audio",
    IMAGE_PATH = "assets/server/images";

// admin authentication passphrase
const USERS = {
    teacher: "teacher",
};

// set JSON recognition
server.use(express.json());

// set incoming name:value pairs to be any type
server.use(express.urlencoded({ extended: true }));

//Code provided by Terry Goldsmith
let allowCrossDomain = function (req, res, next) {
    // allow any origin
    res.header("Access-Control-Allow-Origin", "*");
    // allow any method
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    // accept only headers with Content-Type included
    res.header("Access-Control-Allow-Headers", "Content-Type");
    // link express process to next operation
    next();
};

// set allowable domain characteristics and upload capabilities
//Provided by Terry Goldsmith
server.use(allowCrossDomain);
server.use(upload());

/**
 * Log a received request to the console
 *
 * @param {string} reqType type of request (GET, POST)
 * @param {string} url endpoint at which request was received
 */
function reqLogger(reqType, url) {
    console.log(`${reqType} request at ${url}`);
}

/**
 * Save a file to a given location in the filesystem
 *
 * @param {File} file file object to save in filesystem
 * @param {string} targetPath location to save file to
 * @returns {boolean} success status
 */
function saveFile(file, targetPath) {
    let error = null;

    file.mv(targetPath, (err) => {
        error = err;
    });

    // the only time loosely-typed equality checking is excusable:
    // checking if something is undefined
    return error == null;
}

function moveFile(sourcePath, targetPath) {
    let status = "";

    fs.readFile(sourcePath, (err, data) => {
        fs.writeFile(targetPath, data, (err) => {
            fs.unlink(sourcePath, () => {
                status = err ? err : `File moved to ${targetPath}`;
            });
        });
    });

    return status;
}

function deleteMediaFile(media_name, media_path) {
    let status = "";

    fs.unlinkSync(
        `${path.resolve(__dirname, "../../" + media_path)}/${media_name}`,
        (err) => {
            status = err ? err : `Deleted ${media_name}`;
        }
    );

    return status;
}

/**
 * Purpose: Authenticates password so teachers can access admin page
 *
 * Author: Sheikh Saad Abdullah
 */
server.post("/authenticate", (req, res) => {
    reqLogger("POST", req.url);

    return res.status(200).send({
        authenticated: req.body.passphrase === USERS[req.body.username],
    });
});

/**
 * Purpose: Recieves get information and saves audio, image and vocab words  directories from server to arrays
 * then sends this information to an object to return data to client side.
 *
 * Author: Sarah Derby
 *         Sheikh Saad Abdullah
 */
server.get("/wordlist", (req, res) => {
    reqLogger("GET", req.url);

    // save words to array
    let words = fs
        .readdirSync(path.resolve(__dirname, "../../" + AUDIO_PATH))
        .map((word) => {
            // remove file extension
            return path.basename(word, path.extname(word));
        });

    //send object to js file
    return res.status(200).send({ wordList: words });
});

/**
 * Purpose: Recieves post request and uploads audio and img files to server.
 *
 * Author: Ishani Kasaju
 *         Sheikh Saad Abdullah
 */
server.post("/upload", (req, res) => {
    reqLogger("POST", req.url);

    // handle uploading of new word
    if (req.files) {
        if (
            req.body.fileName !== req.body.oldName &&
            req.body.oldName !== "newWord"
        ) {
            // TODO: handle case when existing word is updated and only one media file is uploaded
        }

        // save audio file if uploaded
        if (req.files.audioFile) {
            let audioFile = req.files.audioFile;
            console.log(audioFile.name);
            if (
                saveFile(
                    audioFile,
                    `../../${AUDIO_PATH}/${req.body.fileName}.wav`
                )
            ) {
                console.log(`Uploaded Audio File: ${req.body.fileName}.wav`);
            } else {
                console.log("Could not upload Audio File.");
            }
        }

        // save image file if uploaded
        if (req.files.imageFile) {
            let imageFile = req.files.imageFile;
            console.log(imageFile.name);
            if (
                saveFile(
                    imageFile,
                    `../../${IMAGE_PATH}/${req.body.fileName}.jpg`
                )
            ) {
                console.log(`Uploaded Image File: ${req.body.fileName}.jpg`);
            } else {
                console.log("Could not upload Image File.");
            }
        }
    } else {
        // handle updating of existing word
        if (req.body.oldWord !== "newWord") {
            console.log(
                moveFile(
                    `../../${AUDIO_PATH}/${req.body.oldName}.wav`,
                    `../../${AUDIO_PATH}/${req.body.fileName}.wav`
                )
            );
            console.log(
                moveFile(
                    `../../${IMAGE_PATH}/${req.body.oldName}.jpg`,
                    `../../${IMAGE_PATH}/${req.body.fileName}.jpg`
                )
            );
        }
    }
});

/**
 * Handle requests to delete file
 *
 * @author Sheikh Saad Abdullah
 */
server.post("/delete", (req, res) => {
    reqLogger("POST", req.url);

    let responses = [];

    // delete audio file
    responses.push(deleteMediaFile(`${req.body.word}.wav`, AUDIO_PATH));

    // delete image file except if it's the placeholder image
    if (req.body.word !== "newWord") {
        responses.push(deleteMediaFile(`${req.body.word}.jpg`, IMAGE_PATH));
    }

    res.send({ responses: responses });
});

/**
 * Purpose: Listen for action on url port
 *
 * Authors: Terry Goldsmith
 *          Sarah Derby (A00443128)
 */
server.listen(port, function () {
    console.log("Listening on port " + port);
});
