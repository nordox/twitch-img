const express = require('express');
const https = require('https');
const bot = require("../bot");
const config = Object.freeze(require('../config/config.js'));

var router = express.Router();

const view_object = {
	channels: bot.channels
};

/* GET home page. */
router.get('/', async function(req, res, next) {
	try {
		await checkLogin();
		res.render('index', view_object);
	} catch(e) {
		res.render('login');
	}	
});

function checkLogin() {
	const options = {
		hostname: config.oauth.hostname,
		path: '/oauth2/validate',
		method: 'GET',
		headers: {
			'Authorization': `OAuth ${bot.oauth}`
		}
	}

	return new Promise((resolve, reject) => {
		https.get(options, res => {
			res.statusCode === 200 ? resolve() : reject();
			// if(res.statusCode !== 200) { reject(); return; }
			// res.on('data', data => {
			// 	const js = JSON.parse(data.toString());
			// 	console.log(`js: ${js}`)
			// 	js.token.valid ? resolve() : reject();
			// });
		});
	});
}

module.exports = router;
