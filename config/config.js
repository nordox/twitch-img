module.exports = {
    "user": process.env.TWITCH_BOT_USER,
    "client_id": process.env.TWITCH_CLIENT_ID,
    "client_secret": process.env.TWITCH_CLIENT_SECRET,
    "channels": process.env.TWITCH_CHANNELS.split(","),
    
    "oauth": {
        "hostname": "id.twitch.tv",
        "redirect": {
            "protocol": "http",
            "hostname": "localhost",
            "port": "3000"
        }
    },

    "db": {
        "name": "twitch",
        "hostname": "localhost",
        "port": 27017
    },

    "twitch": {
        "hostname": "api.twitch.tv"
    }
};