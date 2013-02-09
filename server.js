var http = require("http");
var io = require("socket.io");
var url = require("url");
var path = require("path");
var fs = require("fs");

var MIME_TYPES = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".ico": "image/x-icon"
};

function mimeTypeOf(p) {
    for (suffix in MIME_TYPES) {
	if (endsWith(p, suffix)) {
	    return MIME_TYPES[suffix];
	}
    }

    return "text/plain";
}

function endsWith(str, suffix) {
    return str.substr(str.length - suffix.length) === suffix;
}

function startsWith(str, prefix) {
    return str.substr(0, prefix.length) === prefix;
}

function Server() {
    this.staticFiles = {};
}

Server.prototype.onRequest = function(request, response) {
    var reqUrl = url.parse(request.url, true);
    console.log("Request coming in, url=" + request.url);
    var urlPath = reqUrl.pathname.substr(1);
    if (urlPath === "") {
	urlPath = "index.html";
    }

    if (urlPath in this.staticFiles) {
	var contents = fs.readFileSync(this.staticFiles[urlPath]);
	var mimeType = mimeTypeOf(this.staticFiles[urlPath]);
	response.writeHead("200", {"Content-Type": mimeType});
	response.write(contents);
	response.end();
	return;
    }

    response.writeHead("404", {"Content-Type": "text/plain"});
    response.write("Not found.");
    response.end();
    return;
}

Server.prototype.registerStaticFile = function(urlPath, localPath) {
    this.staticFiles[urlPath] = localPath;
}

Server.prototype.startGame = function(data) {
    console.log("start: " + data.name);
}

Server.prototype.gameStep = function(data) {
    console.log("step: " + data);
}

Server.prototype.start = function() {
    var self = this;
    this.app = http.createServer(function() { self.onRequest.apply(self, arguments); });    
    this.io = io.listen(this.app);
    this.app.listen(8080);
    this.io.sockets.on("connection", function(socket) {
	socket.on("startGame", function(data) { self.startGame(data); });
	socket.on("gameStep", function(data) { self.gameStep(data); });
    });

    this.registerStaticFile("index.html", "./web/index.html");
    this.registerStaticFile("client.js", "./web/client.js");
}

exports.Server = Server;
