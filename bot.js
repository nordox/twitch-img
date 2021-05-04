const TwitchBot = require('twitch-bot');
const db = require('./db');
const config = Object.freeze(require('./config/config.js'));

const bot = {
    username: config.user,
    channels: Object.assign([], config.channels) || [],
    oauth: null,
    irc: null,
    io: null,

    onMessage: messageHandler,
    setup: setupHandler

}

function setupHandler(oauth_token, io) {
    this.oauth = oauth_token;

    const Bot = new TwitchBot({
        username: bot.username,
        oauth: `oauth:${bot.oauth}`,
        channels: bot.channels
    });

    bot.irc = Bot;
    bot.io = io;

    // TODO: This one isn't working very well with twitch-bot...
    Bot.on('join', channel => { console.log(`JOIN: ${channel}`) });

    Bot.on('part', channel => { console.log(`PART: ${channel}`) });
    Bot.on('close', () => { console.log(`closed irc connection`) });
    Bot.on('message', bot.onMessage);
    Bot.on('error', err => { console.log(`bot error: ${err.message}`) });
}

function messageHandler(chatter) {
    if (chatter.message === "!test") {
        bot.irc.say("test msg", chatter.channel);
    }
    if (chatter.channel && chatter.message && containsUrl(chatter.message)) {
        console.log(`${chatter.channel} : ${chatter.message}`);

        if (bot.io && typeof bot.io.to === 'function') {
            let data = {
                room: (chatter.channel).replace('#', ''),
                message: chatter.message,
                created_at: new Date()
            }
            db.insertMessage(data).then(dd => {
                bot.io.to(data.room).emit('link', data);
            }).catch(e => {
                console.error(e);
            });
        }
    }
}

function containsUrl(message) {
    return message.indexOf("http://") > -1 || message.indexOf("https://") > -1;
}

module.exports = bot;
