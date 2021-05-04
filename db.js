const { MongoClient } = require('mongodb');
const assert = require('assert');
var debug = require('debug')('twitch-img:db');
const config = Object.freeze(require('./config/config.js'));

const url = `mongodb://${config.db.hostname}:${config.db.port}`;
const dbName = config.db.name;

const mongo = {

    db: null,
    client: null,
    
    connect:                connect,
    findAllMessages:        findAllMessages,
    findMostRecentMessages: findMostRecentMessages,
    findMostRecentImgur:    findMostRecentImgur,
    findMostRecentClips:    findMostRecentClips,
    insertMessage:          insertMessage
    
}


function connect() {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function(err, client) {
            if(err !== null) {
                reject("failed to connect to db");
            }
            debug("connected to the database");
            const db = client.db(dbName);
            mongo.client = client;
            mongo.db = db;
            resolve(db);
        });
    });
}


/* TODO: error handling on these functions */


async function findAllMessages() {
    if(!this.db) {
        throw new Error("not connected to database");
    }
    const result = await this.db.collection('messages').find({}).toArray();
    return result
}

async function findMostRecentMessages() {
    if(!this.db) {
        throw new Error("not connected to database");
    }
    const result = await this.db.collection('messages').find({
        room: {
            $not: {
                $eq: "tsm_myth"
            }
        }
    }).sort({
        created_at: -1
    }).limit(100).toArray();

    return result;
}

async function findMostRecentImgur() {
    if(!this.db) {
        throw new Error("not connected to database");
    }
    const result = await this.db.collection('messages').find({
        room: {
            $not: {
                $eq: "tsm_myth"
            }
        },
        message: {
            $regex: ".*imgur\.com.*"
        }
    }).sort({
        created_at: -1
    }).limit(100).toArray();

    return result;
}

async function findMostRecentClips() {
    if(!this.db) {
        throw new Error("not connected to database");
    }
    const result = await this.db.collection('messages').find({
        room: {
            $not: {
                $eq: "tsm_myth"
            }
        },
        message: {
            $regex: ".*clips\.twitch\.tv.*"
        }
    }).sort({
        created_at: -1
    }).limit(100).toArray();
    
    return result;
}

async function insertMessage(data) {
    if(!this.db) {
        throw new Error("not connected to database");
    }
    const result = await this.db.collection('messages').insertOne(data);
    if(result.ok === result.n) {
        return result;
    }
    throw new Error("insert failed");
}


module.exports = mongo;