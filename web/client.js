console.log("Hello, world!");
var socket = io.connect("http://oldie.muc.lberki.net");
socket.emit("startGame", { name: "John" });
socket.on("state", function(data) { console.log(data.name); });

