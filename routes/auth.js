const express = require('express');
const https = require('https');
const zlib = require('zlib');

const config = Object.freeze(require('../config/config.js'));
const bot = require('../bot');

const router = express.Router();

const MAX_NUM_CHANNELS = 5;

router.get('/', function (req, res, next) {
	//TODO: better way to do this?
	const url = `https://${config.oauth.hostname}/oauth2/authorize?client_id=${config.client_id}&redirect_uri=${config.oauth.redirect.protocol}://${config.oauth.redirect.hostname}:${config.oauth.redirect.port}/auth/final&response_type=code&scope=chat_login&force_verify=true`;
	res.redirect(url);
});

router.get('/final', async function (req, res, next) {

	let io = req.app.get('io');

	if (req.query && req.query.code) {

		let js = "";

		try {

			const r = await doPost(req.query.code);

			js = JSON.parse(r);

			if (js.error) {

				res.status(js.status).json(js);

				return;

			}

		} catch (e) {

			console.error(`auth error: ${e}`);

			res.status(500).end();

			return;

		}

		if (bot.oauth) {
			// bot already exists - leave and rejoin channels
			// TODO: doesn't work well
			// for(let channel of bot.channels) {
			// 	bot.irc.part(channel);
			// }

			bot.irc.close();
			bot.channels = Object.assign([], config.channels);
		}

		try {

			let topChannels = await getTopChannels(MAX_NUM_CHANNELS, js.access_token);

			for (let channel of topChannels) {

				bot.channels.push(channel.user_name);

			}

		} catch (e) {

			console.log("errr");
			console.log(e);

			res.status(e.status).send(e.message);
			
			return;
		}

		bot.setup(js.access_token, io);

		res.redirect('/');

	} else {

		res.status(400).send("no code");

	}

});


/* Get top channels based on viewer count
   up to MAX <= 100 number of channels */
async function getTopChannels(max, token) {
	const options = {
		hostname: config.twitch.hostname,
		port: 443,
		path: `/helix/streams/?language=en&stream_type=live&limit=${max}`,
		method: "GET",
		headers: {
			"Client-ID": config.client_id,
			"Authorization": `Bearer ${token}`
		}
	}

	return new Promise((resolve, reject) => {
		https.get(options, res => {
			if (res.statusCode !== 200) { reject({ status: res.statusCode, message: res.statusMessage }); return; }
			let ret = "";
			res.on('data', data => {
				ret = ret + data;
			});
			res.on('end', data => {
				const js = JSON.parse(ret);
				resolve(js.data);
			});
			res.on('error', err => reject(err));
		});
	});
}

function doPost(code) {
	return new Promise((resolve, reject) => {
		const options = {
			hostname: config.oauth.hostname,
			port: 443,
			path: `/oauth2/token?client_id=${config.client_id}&client_secret=${config.client_secret}&redirect_uri=http://localhost:3000/auth/final&code=${code}&grant_type=authorization_code`,
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			}
		};

		const req = https.request(options, res => {
			let output = res;
			if (res.headers['content-encoding'] === 'gzip') {
				let gzip = zlib.createGunzip();
				res.pipe(gzip);
				output = gzip;
			}
			output.on('data', d => {
				resolve(d.toString());
			})
		});
		req.on('error', e => {
			reject(e);
		});
		req.end();
	});
}


module.exports = router;
