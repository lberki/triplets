var engine = require("./engine");
var idgen = require("idgen");

var GAME_TIMEOUT_MS = 5000;

function bind(obj, fn) {
    return function() { 
	return fn.apply(obj, arguments);
    }    
}

function Manager(redis) {
    this.redis = redis;
    this.games = {};
    this.timeouts = {};
}

Manager.prototype.startGame = function(data, callback) {
    var self = this;

    if (!("username" in data) || !("password" in data)) {
	this.createGame(null, callback);
	return;
    }
    
    if (!data.username.match(/^[a-zA-Z0-9_-]+$/)) {
	callback({error: "Invalid username"});
	return;
    }

    this.redis.hget("user:" + data.username, "password", function(err, stored) {
	self.verifyPassword(data.username, data.password, stored, callback);
    });
}

Manager.prototype.verifyPassword = function(username, provided, stored, callback) {
    console.log(provided + " " + stored);
    var self = this;
    if (stored === null) {
	this.redis.hset("user:" + username, "password", provided, function(err, stored) {
	    if (err === null) {
		console.log("User " + username + " created.");
		self.createGame(username, callback);
	    } else {
		callback({error: "Cannot create new user"});
	    }
	});	
    } else if (provided === stored) {
	self.createGame(username, callback);
    } else {
	console.log("invalid password for user " + username);
	callback({error: "Invalid password"});
    }
}

Manager.prototype.createGame = function(username, callback) {
    if (username === null) {
	console.log("Game started for anonymous user.");
    } else {
	console.log("Game started for user " + username);
    }
    var gameId = idgen.hex(32);
    this.games[gameId] = { username: username, game: new engine.Game(2, 2) };
    this.tickle(gameId);
    callback({ id: gameId, state: this.games[gameId].game.getState() });
}

Manager.prototype.tickle = function(gameId) {
    var self = this;
    if (gameId in this.timeouts) {
	clearTimeout(this.timeouts[gameId]);
    }

    this.timeouts[gameId] = setTimeout(function() {
	console.log("game " + gameId + " timed out");
	self.finishGame(gameId);
    }, GAME_TIMEOUT_MS);
}

Manager.prototype.finishGame = function(gameId) {
    var game = this.games[gameId];
    if (gameId in this.timeouts) {
	clearTimeout(this.timeouts[gameId]);
    }

    delete this.games[gameId];
    delete this.timeouts[gameId];

    if (game.username !== null) {
	this.recordFinishedGame(game.username, gameId, game.game.getState().score);
    }
}

Manager.prototype.recordFinishedGame = function(username, gameId, score) {
    console.log("Recording game " + gameId + " for " + username + " with score " + score);
    this.redis.multi()
	.sadd("userGames:" + username, gameId)
	.hincrby("user:" + username, "cumulativeScore", score)
	.hincrby("user:" + username, "gameCount", 1)
        .hset("game:" + gameId, "score", score)
	.exec(function(err) {
	    if (err !== null) {
		console.log("Could not record game " + gameId);
	    }
	});
}

Manager.prototype.action = function(data, callback) {
    if (!(data.gameId in this.games)) {
	callback({error: "Unknown game (timed out? finished?)" });
	return;
    }

    var game = this.games[data.gameId].game;
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

    var state = game.getState();
    if (state.gameOver) {
	this.finishGame(data.gameId);
    } else {
	this.tickle(data.gameId);
    }

    callback({ state: state });
}

exports.Manager = Manager;
