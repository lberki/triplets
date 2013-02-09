var engine = require("./engine");

function Manager() {
    this.games = {};
    this.timeouts = {};
}

Manager.prototype.startGame = function(data, callback) {
    var self = this;
    console.log("start: " + data.name);
    this.games[data.name] = new engine.Game(6, 6);
    callback.state(this.games[data.name].getState());
    this.tickle(data.name);
}

Manager.prototype.tickle = function(name) {
    var self = this;
    if (name in this.timeouts) {
	clearTimeout(this.timeouts[data.name]);
    }

    this.timeouts[name] = setTimeout(function() {
	self.timedOut(name);
    }, 1000);
}

Manager.prototype.timedOut = function(name) {
    console.log("timed out: " + name);
    delete this.games[name];
    delete this.timeouts[name];
}

Manager.prototype.gameStep = function(data) {
    console.log("step: " + data.name);
    this.tickle(data.name);
}

exports.Manager = Manager;
