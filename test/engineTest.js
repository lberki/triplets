var engine = require("../engine");
var figures = engine.figures;

directions = {
    "u": new engine.Vector(0, -1),
    "d": new engine.Vector(0, 1),
    "l": new engine.Vector(-1, 0),
    "r": new engine.Vector(1, 0),
};

function moves() {
    moveMap = {};

    for (var i = 0; i < arguments.length/3; i++) {
	var x = arguments[i*3];
	var y = arguments[i*3 + 1];
	var dirNames = arguments[i*3 + 2];

	var dirs = new Array();
	for (var j = 0; j < dirNames.length; j++) {
	    dirs.push(directions[dirNames[j]]);
	}
	moveMap[x + ":" + y] = dirs;
    }

    return function(x, y) {
	var key = x + ":" + y;
	return key in moveMap ? moveMap[key] : new Array();
    }
}

function assertBoard(test, game) {
    var args = Array.prototype.slice.call(arguments, 2);
    var expected = args.join("\n");
    test.equals(game.boardToString(), expected);
}

exports.moreBearsThanRobots = function(test) {
    var robots = 0;
    var bears = 0;

    for (var i = 0; i < 1000; i++) {
	var fig = engine.randomFigure();
	if (fig === figures.bear) { bears++; }
	if (fig === figures.robot) { robots++; }
    }

    test.ok(robots < bears, "robots=" + robots + ", bears=" + bears);
    test.done();
}

exports.cannotPlaceOverSomethingElse = function(test) {
    var g = new engine.Game(1, 1);
    g.setBoard("1");
    g.setNext(figures.grass);
    test.ok(!g.place(0, 0));
    test.done();
}

exports.canPlace = function(test) {
    var g = new engine.Game(2, 2);
    g.setNext(figures.grass);
    test.ok(g.place(0, 1));
    assertBoard(test, g, "  ", "1 ");
    test.done();
}

exports.canCombineThree = function(test) {
    var g = new engine.Game(2, 2);
    g.setBoard(" 1", "1 ");
    g.setNext(figures.grass);
    test.ok(g.place(0, 0));
    assertBoard(test, g, "2 ", "  ");
    test.done();
}

exports.canCombineMore = function(test) {
    var g = new engine.Game(3, 3);
    g.setBoard(
	" 2 ",
	"2 2",
	" 2 ");
    g.setNext(figures.bush);
    test.ok(g.place(1, 1));
    assertBoard(test, g, "   ", " 3 ", "   ");
    test.done();
}

exports.multilevelCombination = function(test) {
    var g = new engine.Game(3, 3);
    g.setBoard(
	"11 ",
	"  2",
	"  2");
    g.setNext(figures.grass);
    test.ok(g.place(2, 0));
    assertBoard(test, g, "  3", "   ", "   ");
    test.done();
}

exports.crystalTurnsIntoRock = function(test) {
    var g = new engine.Game(2, 2);
    g.setNext(figures.crystal);
    test.ok(g.place(0, 0));
    assertBoard(test, g, "r ", "  ");
    test.done();
}

exports.crystalTurnsIntoSomething = function(test) {
    var g = new engine.Game(2, 2);
    g.setBoard(
	" 5",
	"5 ");
    g.setNext(figures.crystal);
    test.ok(g.place(0, 0));
    assertBoard(test, g, "6 ", "  ");
    test.done();
}

exports.crystalChoosesBetterAlternative = function(test) {
    var g = new engine.Game(3, 3);
    g.setBoard(
	"11 ",
	"  3",
	"  3");
    g.setNext(figures.crystal);
    test.ok(g.place(2, 0));
    assertBoard(test, g, "114", "   ", "   ");
    test.done();
}

exports.testCanKillNewBear = function(test) {
    var g = new engine.Game(3, 3);
    g.setBoard(" 1 ", "1  ", "   ");
    g.setNext(figures.bear);
    test.ok(g.place(0, 0));
    assertBoard(test, g, "g1 ", "1  ", "   ");
    test.done();
}

exports.testCanKillOldBear = function(test) {
    var g = new engine.Game(2, 2);
    g.setBoard("g1", "  ");
    g.setNext(figures.grass);
    test.ok(g.place(0, 1));
    assertBoard(test, g, "g1", "1 ");
    test.done();
}

exports.testCanKillMultipleBears = function(test) {
    var g = new engine.Game(7, 1);
    g.setBoard("BB BB1 ");
    g.setNext(figures.grass);
    test.ok(g.place(2, 0));
    assertBoard(test, g, "gg1gg1 ");
    test.done();
}

exports.testCanCreateTempleAtPoint = function(test) {
    var g = new engine.Game(8, 1);
    g.setBoard("BBB BBB1");
    g.setNext(figures.bear);
    test.ok(g.place(3, 0));
    assertBoard(test, g, "   t   1");
    test.done();
}

exports.testCanCreateTempleAtNeighbor = function(test) {
    var g = new engine.Game(4, 1);
    g.setBoard("BBB ");
    g.setNext(figures.grass);
    test.ok(g.place(3, 0));
    assertBoard(test, g, "  t1");
    test.done();
}

exports.canMoveBear = function(test) {
    var g = new engine.Game(3, 3);
    g.setBoard("   ", " B ", "   ");
    g.setNext(figures.empty);
    g.getDirections = moves(1, 1, "u");
    test.ok(g.place(2, 2));
    assertBoard(test, g, " B ", "   ", "   ");
    test.done();
}

exports.doesNotMoveBearIntoObstacle = function(test) {
    var g = new engine.Game(3, 3);
    g.setBoard("   ", " B ", "   ");
    g.setNext(figures.grass);
    g.getDirections = moves(1, 1, "u");
    test.ok(g.place(1, 0));
    assertBoard(test, g, " 1 ", " B ", "   ");
    test.done();
}

exports.robotKillsBear = function(test) {
    var g = new engine.Game(2, 1);
    g.setBoard("B ");
    g.setNext(figures.robot);
    test.ok(g.place(0, 0));
    assertBoard(test, g, "g ");
    test.done();
}

exports.robotClearsBuilding = function(test) {
    var g = new engine.Game(2, 1);
    g.setBoard("2 ");
    g.setNext(figures.robot);
    test.ok(g.place(0, 0));
    assertBoard(test, g, "  ");
    test.done();    
}
