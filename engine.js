function randomChoice(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function copyBoard(board) {
    var result = new Array();
    for (var y = 0; y < board.length; y++) {
	result.push(board[y].slice(0));
    }
    return result;
}

function Figure(symbol, prob) {
    this.symbol = symbol;
    this.prob = prob;
    return this;
}

function quadraticScore(min, base) {
    return function(n) {
	var tail = n-min+1;
	return base*(min-1 + (tail*(tail+1)) / 2); 
    };
}

function constantScore(c) {
    return function(n) {
	return c;
    };
}

function Combination(from, to, min, score) {
    this.from = from;
    this.to = to;
    this.min = min;
    this.score = score;
}

function Vector(x, y) {
    this.x = x;
    this.y = y;
}

var DIRECTIONS = [
    new Vector(0, -1),
    new Vector(0, 1),
    new Vector(1, 0),
    new Vector(-1, 0) 
];


FIGURES = {
    empty: new Figure('e', 0),
    grass: new Figure('1', 0.60),
    bush: new Figure('2', 0.15),
    tree: new Figure('3', 0.02),
    hut: new Figure('4', 0.005),
    house: new Figure('5', 0),
    mansion: new Figure('6', 0),
    town: new Figure('7', 0),
    floatingCastle: new Figure('8', 0),
    tripleTown: new Figure('9', 0),
    bear: new Figure('B', 0.15),
    grave: new Figure('g', 0),
    temple: new Figure('t', 0),
    cathedral: new Figure('c', 0),
    robot: new Figure('R', 0.045),
    rock: new Figure('r',  0),
    mountain: new Figure('m', 0),
    crystal: new Figure('C', 0.03)
};

FIGURE_BY_SYMBOL = {};
for (var k in FIGURES) {
    FIGURE_BY_SYMBOL[FIGURES[k].symbol] = FIGURES[k];
}
FIGURE_BY_SYMBOL[" "] = FIGURES.empty;

COMBINATIONS = [
    new Combination(FIGURES.grass, FIGURES.bush, 3, quadraticScore(3, 1)),
    new Combination(FIGURES.bush, FIGURES.tree, 3, quadraticScore(3, 5)),
    new Combination(FIGURES.tree, FIGURES.hut, 3, quadraticScore(3, 40)),
    new Combination(FIGURES.hut, FIGURES.house, 3, quadraticScore(3, 200)),
    new Combination(FIGURES.house, FIGURES.mansion, 3, quadraticScore(3, 1000)),
    new Combination(FIGURES.mansion, FIGURES.town, 3, quadraticScore(3, 5000)),
    new Combination(FIGURES.town, FIGURES.floatingCastle, 3, quadraticScore(3, 20000)),
    new Combination(FIGURES.floatingCastle, FIGURES.tripleTown, 3, quadraticScore(3, 100000)),
    new Combination(FIGURES.grave, FIGURES.temple, 3, constantScore(0)),
    new Combination(FIGURES.temple, FIGURES.cathedral, 3, constantScore(0)),
    new Combination(FIGURES.rock, FIGURES.mountain, 3, constantScore(0)),
];

CRYSTAL_CANDIDATES = [
    FIGURES.grass, FIGURES.bush, FIGURES.tree, FIGURES.hut, FIGURES.house,
    FIGURES.mansion, FIGURES.town, FIGURES.floatingCastle, FIGURES.grave, 
    FIGURES.temple, FIGURES.rock
];

function findCombination(figure, count) {
    for (var i = 0; i < COMBINATIONS.length; i++) {
	var c = COMBINATIONS[i];
	if (c.from === figure && count >= c.min) {
	    return c;
	}
    }

    return null;
}

SORTED_FIGURES=new Array();
for (k in FIGURES) { 
    SORTED_FIGURES.push(FIGURES[k]);
}

SORTED_FIGURES.sort(function(a, b) { return b.prob - a.prob; });

function randomFigure() {
    var x = Math.random();
    var cumulative = 0.0;
    for (var i = 0; i < SORTED_FIGURES.length; i++) {
	var figure = SORTED_FIGURES[i];
	cumulative += figure.prob;
	if (x < cumulative) {
	    return figure;
	}
    }
}

function createArray(width, height, elem) {
    var result = new Array(height);
    for (var y = 0; y < height; y++) {
	result[y] = new Array(width);
	for (var x = 0; x < width; x++) {
	    result[y][x] = elem;
	}
    }

    return result;
}

function Game(width, height) {
    this.width = width;
    this.height = height;
    this.board = createArray(width, height, FIGURES.empty);
    this.stashed = FIGURES.empty;
    this.next = randomFigure();
    this.score = 0;
}

Game.prototype.getState = function() {
    var board = "";
    for (var y = 0; y < this.height; y++) {
 	for (var x = 0; x < this.width; x++) {
	    board += this.board[y][x].symbol;
	}
    }

    return {
	board: board,
	score: this.score,
	next: this.next.symbol,
	stash: this.stashed.symbol,
	width: this.width,
	height: this.height
    };
}

Game.prototype.killImmobileBearsAt = function(x, y) {
    var self = this;
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
	return;
    }

    var deadBears = this.findCluster(x, y, function(x, y) {
	return self.isImmobileBear(x, y);
    });

    deadBears.forEach(function(l) {
	self.board[l.y][l.x] = FIGURES.grave;
    });

}

Game.prototype.collapseAt = function(x, y) {
    var self = this;
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
	return false;
    }

    var newFigure = self.board[y][x];
    var friends = this.findCluster(x, y, function(x, y) { 
	return self.board[y][x] === newFigure; });
    var combo = findCombination(newFigure, friends.length);
    if (combo === null) {
	return false;
    }

    var board = this.board;
    friends.forEach(function(l) {
	board[l.y][l.x] = FIGURES.empty;
    });

    board[y][x] = combo.to;
    this.score += combo.score(friends.length);
    return true;
}

Game.prototype.setNext = function(fig) {
    this.next = fig;
}

Game.prototype.decideCrystal = function(x, y) {
    var maxScore = -1, bestFigure = FIGURES.rock;
    var savedBoard = copyBoard(this.board);
    var savedScore = this.score;

    for (var i = 0; i < CRYSTAL_CANDIDATES.length; i++) {
	var candidate = CRYSTAL_CANDIDATES[i];
	this.board = copyBoard(savedBoard);
	this.score = savedScore;
	this.board[y][x] = candidate;
	if (this.placeFigure(x, y, candidate) && this.score > maxScore) {
	    maxScore = this.score;
	    bestFigure = candidate;
	}
    }

    this.board = savedBoard;
    this.score = savedScore;
    return bestFigure;
}

Game.prototype.placeFigure = function(x, y, figure) {
    var collapsed = false;
    this.board[y][x] = figure;
    this.killImmobileBearsAt(x, y);
    for (var i = 0; i < DIRECTIONS.length; i++) {
	this.killImmobileBearsAt(x + DIRECTIONS[i].x, y+DIRECTIONS[i].y);
    }

    while (this.collapseAt(x, y)) collapsed = true;

    for (var i = 0; i < DIRECTIONS.length; i++) {
	while (this.collapseAt(x + DIRECTIONS[i].x, y+DIRECTIONS[i].y)) collapsed = true;
    }

    return collapsed;
}

Game.prototype.place = function(x, y) {
    var figure = this.next;
    if (figure === FIGURES.robot) {
	if (this.board[y][x] === FIGURES.bear) {
	    figure = FIGURES.grave;
	} else {
	    figure = FIGURES.empty;
	}
    } else {
	if (this.board[y][x] !== FIGURES.empty) {
	    return false;
	}
    }

    if (figure === FIGURES.crystal) {
	figure = this.decideCrystal(x, y);
    }

    this.placeFigure(x, y, figure);
    this.moveBears();
    this.next = randomFigure();
    return true;
}

Game.prototype.stash = function() {
    var oldStashed = this.stashed;
    this.stashed = this.next;
    this.next = oldStashed;
    if (this.next === FIGURES.empty) {
	this.next = randomFigure();
    }
}

Game.prototype.isImmobileBear = function(x, y) {
    if (this.board[y][x] !== FIGURES.bear) {
	return false;
    }

    for (var i = 0; i < DIRECTIONS.length; i++) {
	var nx = x + DIRECTIONS[i].x;
	var ny = y + DIRECTIONS[i].y;
	if (nx >= 0 && nx < this.width &&
	    ny >= 0 && ny < this.height &&
	    this.board[ny][nx] === FIGURES.empty) {
	    return false;
	}	
    }

    return true;
}

Game.prototype.findCluster = function(x, y, predicate) {
    var result = new Array();
    var seen = createArray(this.width, this.height, false);
    var queue = new Array();
    queue.push(new Vector(x, y));
    while (queue.length !== 0) {
	var current = queue.pop();
	if (current.x < 0 || current.x >= this.width ||
	    current.y < 0 || current.y >= this.height ||
	    seen[current.y][current.x] ||
	    !predicate(current.x, current.y)) {
	    continue;
	}

	result.push(current);
	seen[current.y][current.x] = true;
	queue.push(new Vector(current.x-1, current.y));
	queue.push(new Vector(current.x+1, current.y));
	queue.push(new Vector(current.x, current.y-1));
	queue.push(new Vector(current.x, current.y+1));
    }

    return result;
}

Game.prototype.moveBears = function() {
    var mobileBears = [];
    for (var y = 0; y < this.height; y++) {
	for (var x = 0; x < this.width; x++) {
	    if (this.board[y][x] === FIGURES.bear &&
		!this.isImmobileBear(x, y)) {
		mobileBears.push(new Vector(x, y));
	    }
	}
    }

    for (var i = 0; i < mobileBears.length; i++) {
	var possibleDirections = [];
	var x = mobileBears[i].x;
	var y = mobileBears[i].y;
	var allDirections = this.getDirections(x, y);
	for (var d = 0; d < allDirections.length; d++) {
	    var dir = allDirections[d];
	    var nx = x + dir.x;
	    var ny = y + dir.y;
	    if (nx >= 0 && nx < this.width &&
		ny >= 0 && ny < this.height &&
		this.board[ny][nx] === FIGURES.empty) {
		possibleDirections.push(dir);
	    }
	}

	if (possibleDirections.length != 0) {
	    var dir = randomChoice(possibleDirections);
	    this.board[y][x] = FIGURES.empty;
	    this.board[y + dir.y][x + dir.x] = FIGURES.bear;
	}
    }
}

Game.prototype.getDirections = function(x, y) {
    return DIRECTIONS;
}

Game.prototype.setBoard = function() {
    for (var y = 0; y < this.height; y++) {
	for (var x = 0; x < this.width; x++) {
	    this.board[y][x] = FIGURE_BY_SYMBOL[arguments[y][x]];
	}
    }
}

exports.Vector = Vector;
exports.figures = FIGURES;
exports.Game = Game;
exports.randomFigure = randomFigure;
