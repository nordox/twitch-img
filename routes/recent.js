const express = require('express');
const db = require("../db");
const config = Object.freeze(require('../config/config.js'));

var router = express.Router();

/* Get 100 most recent messages */
router.get('/', async function(req, res, next) {
    const recents = await db.findMostRecentMessages();
    res.render('recent', { messages: recents || [],  title: "ANY" });
});

/* Get 100 most recent messages with imgur */
router.get('/imgur', async function(req, res, next) {
    const recents = await db.findMostRecentImgur();
    res.render('recent', { messages: recents || [], title: "IMGUR" });
});

/* Get 100 most recent messages with clips */
router.get('/clips', async function(req, res, next) {
    const recents = await db.findMostRecentClips();
    res.render('recent', { messages: recents || [], title: "CLIPS" });
});

module.exports = router;
