const { EventEmitter } = require('events');

const IoMock =  {
    socket: null,
    to (data) {
        return this.socket; 
    }
}

module.exports = IoMock;