var engine = require("./engine");
var idgen = require("idgen");

function Manager() {
    this.games = {};
    this.timeouts = {};
}

Manager.prototype.startGame = function(data, callback) {
    var gameId = idgen(32, "0123456789abcdef");
    this.games[gameId] = new engine.Game(6, 6);
    this.tickle(gameId);
    callback({ id: gameId, state: this.games[gameId].getState() });
}

Manager.prototype.tickle = function(gameId) {
    var self = this;
    if (gameId in this.timeouts) {
	clearTimeout(this.timeouts[gameId]);
    }

    this.timeouts[gameId] = setTimeout(function() {
	self.timedOut(gameId);
    }, 100000000);
}

Manager.prototype.timedOut = function(gameId) {
    console.log("timed out: " + gameId);
    delete this.games[gameId];
    delete this.timeouts[gameId];
}

Manager.prototype.action = function(data, callback) {
    var game = this.games[data.gameId];
    var rxNumber = /^[0-9]+$/;
    switch (data.action) {
    case "place":
	if (data.x.match(rxNumber) && data.y.match(rxNumber)) {
	    game.place(parseInt(data.x), parseInt(data.y));
	}
	break;
    case "stash":
	game.stash();
	break;
    }

    this.tickle(data.gameId);
    callback({ state: game.getState() });
}

exports.Manager = Manager;
