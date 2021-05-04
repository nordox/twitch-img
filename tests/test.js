const chaiHttp = require('chai-http');
const chai = require('chai');
const sinon = require('sinon');
const { EventEmitter } = require('events');

const app = require('../app');
const bot = require('../bot');
const iomock = require('./io-mock');
const db = require('../db');

const should = chai.should();
const expect = chai.expect;

chai.use(chaiHttp);


describe('endpoints', () => {
    describe('/', () => {
        it('should render the login page', () => {
            chai.request(app).get('/').end((err, res) => {
                expect(err).to.be.null;
                res.should.have.status(200);
            });
        });
    });
    describe('/auth', () => {
        it('should redirect to twitch login page', (done) => {
            chai.request(app).get('/auth/').end((err, res) => {
                expect(err).to.be.null;
                res.should.have.status(200);
                res.should.redirect;
                done();
            });
        });
    });
    
    describe('/auth/final', () => {
        it('should respond with \'no code\' if code paramater does not exist in path', (done) => {
            chai.request(app).get('/auth/final/').end((err, res) => {
                expect(err).to.not.be.null;
                expect(err.status).to.equal(400);
                expect(res.text).to.equal("no code");
                done();
            });
        });
        
        it('should respond with error message if code is invalid', (done) => {
            chai.request(app).get('/auth/final').query({code: '1234'}).end((err, res) => {
                expect(err).to.not.be.null;
                expect(err.status).to.equal(400);
                done();
            });
        });
    });

    describe('error', () => {
        it('should respond with 404 and display error page if path is not found', (done) => {
            chai.request(app).get('/blahblah/blah/').end((err, res) => {
                expect(err).to.not.be.null;
                expect(err.status).to.equal(404);
                done();
            });
        });
    });
});

describe('bot', () => {
    describe('messageHandler', () => {
        let spy;
        
        beforeEach(function() {
            spy = sinon.spy();
            iomock.socket = new EventEmitter();
            bot.io = iomock;
            iomock.socket.on('link', spy);
        });

        it('should call database insert once', function() {
            const data = { channel: "xx", message: "https://google.com" };
            const ins = sinon.stub(db, 'insertMessage').returns((new Promise(function(r,re){})));
            bot.onMessage(data);
            sinon.assert.calledOnce(ins);
            sinon.assert.calledWith(ins, sinon.match({room: data.channel, message: data.message}));
            ins.restore();
        });
        
        it('should not emit an event when the bot has not been setup', function() {
            const data = { channel: "xx", message: "htt://google.com" };
            bot.io = null;
            bot.onMessage(data);
            sinon.assert.notCalled(spy);
        });
        
        it('should not emit an event when the message does not contain a link', function() {
            const data = { channel: "xx", message: "htt://google.com" };
            bot.onMessage(data);
            sinon.assert.notCalled(spy);
        });
        
        it('should not emit an event when the data does not have a channel', function() {
            const data = { message: "htt://google.com" };
            bot.onMessage(data);
            sinon.assert.notCalled(spy);
        });
        
        it('should not emit an event when the data does not have a message', function() {
            const data = { channel: "xx" };
            bot.onMessage(data);
            sinon.assert.notCalled(spy);
        });

    });
});