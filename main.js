// - Record individual games on disk
// - Record finished games on disk
// - Serve up finished games so that statistics can be made from them
var server = require("./server");
var manager = require("./manager");

var m = new manager.Manager(require("redis").createClient());
var s = new server.Server(m);
s.start();
