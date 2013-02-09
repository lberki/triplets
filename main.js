var server = require("./server");
var manager = require("./manager");

var m = new manager.Manager();
var s = new server.Server();
s.registerMethod("startGame", m, m.startGame);
s.registerMethod("gameStep", m, m.gameStep);
s.registerCallback("state");
s.start();
