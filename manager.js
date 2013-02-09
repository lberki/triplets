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
	clearTimeout(this.timeouts[name]);
    }

    this.timeouts[name] = setTimeout(function() {
	self.timedOut(name);
    }, 100000000);
}

Manager.prototype.timedOut = function(name) {
    console.log("timed out: " + name);
    delete this.games[name];
    delete this.timeouts[name];
}

Manager.prototype.place = function(data, callback) {
    var game = this.games[data.name];
    console.log("place: " + data.x + ":" + data.y);
    game.place(data.x, data.y);
    callback.state(game.getState());
    this.tickle(data.name);
}

Manager.prototype.stash = function(data, callback) {
    var game = this.games[data.name];
    console.log("stash: " + data.name);
    game.stash();
    callback.state(game.getState());
    this.tickle(data.name);
}

exports.Manager = Manager;
