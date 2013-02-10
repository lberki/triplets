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
    var self = this;

    if (username === null) {
	console.log("Game started for anonymous user.");
    } else {
	console.log("Game started for user " + username);
    }
    var gameId = idgen.hex(32);
    var game = new engine.Game(2, 2);
    this.games[gameId] = { username: username, game: game };
    this.tickle(gameId);

    if (username === null) {
	callback({ id: gameId, state: game.getState() });
	return;
    }
    
    self.recordMove(gameId, game.lastMove, function(ok) {	
	if (ok) {
	    callback({ id: gameId, state: game.getState() });
	} else {
	    callback({ error: "Server error, cannot start game" });
	}
    });
}

Manager.prototype.tickle = function(gameId) {
    var self = this;
    if (gameId in this.timeouts) {
	clearTimeout(this.timeouts[gameId]);
    }

    this.timeouts[gameId] = setTimeout(function() {
	console.log("game " + gameId + " timed out");
	self.finishGame(gameId, true);
    }, GAME_TIMEOUT_MS);
}

Manager.prototype.finishGame = function(gameId, record) {
    var game = this.games[gameId];
    if (gameId in this.timeouts) {
	clearTimeout(this.timeouts[gameId]);
    }

    delete this.games[gameId];
    delete this.timeouts[gameId];

    if (record && game !== undefined && game.username !== null) {
	this.recordFinishedGame(game.username, gameId, game.game.getState());
    }
}

Manager.prototype.recordFinishedGame = function(username, gameId, state) {
    this.redis.multi()
	.sadd("userGames:" + username, gameId)
	.hincrby("user:" + username, "cumulativeScore", state.score)
	.hincrby("user:" + username, "gameCount", 1)
        .hmset("game:" + gameId, "score", state.score, "turns", state.turns)
	.exec(function(err) {
	    if (err !== null) {
		console.log("Could not record game " + gameId);
	    }
	});
}

Manager.prototype.recordMove = function(gameId, move, callback, errorCallback) {
    var self = this;
    this.redis.rpush("gameMoves:" + gameId, move, function(err) {
	if (err === null) {
	    callback(true);
	} else {
	    console.log("Error while recording move for game " + gameId + ", aborting game");
	    self.finishGame(gameId, false);
	    callback(false);
	}
    });
}

Manager.prototype.action = function(data, callback) {
    var self = this;

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

    var respond = function() {
	var state = game.getState();
	if (state.gameOver) {
	    console.log("Game " + data.gameId + " over.");
	    self.finishGame(data.gameId, true);
	} else {
	    self.tickle(data.gameId);
	}

	callback({ state: state });
    }
    
    if (this.games[data.gameId].username === null) {
	respond();
	return;
    }

    this.recordMove(data.gameId, game.lastMove, function(ok) {
	if (!ok) {
	    callback({ error: "Server error, game aborted." });
	} else {
	    respond();
	}
    });

}

exports.Manager = Manager;
