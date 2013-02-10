var http = require("http");
var url = require("url");
var path = require("path");
var fs = require("fs");

var MIME_TYPES = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".ico": "image/x-icon",
    ".css": "text/css",
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

function Server(manager) {
    this.staticFiles = {};
    this.manager = manager;
}

Server.prototype.onRequest = function(request, response) {
    var reqUrl = url.parse(request.url, true);
    console.log("HTTP request, url=" + request.url);
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

    var responseCallback = function(result) {
	response.writeHead("200", {"Content-Type": "text/json"});
	response.write(JSON.stringify(result));
	response.end();
    };

    if (urlPath == "startGame") {
	this.manager.startGame(reqUrl.query, responseCallback);
	return;
    } else if (urlPath == "action") {
	this.manager.action(reqUrl.query, responseCallback);
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

Server.prototype.start = function() {
    var self = this;
    this.app = http.createServer(function() { self.onRequest.apply(self, arguments); });    
    this.app.listen(8080);
    this.registerStaticFile("index.html", "./web/index.html");
    this.registerStaticFile("client.js", "./web/client.js");
    this.registerStaticFile("style.css", "./web/style.css");
}

exports.Server = Server;
