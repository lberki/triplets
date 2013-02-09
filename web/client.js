console.log("Hello, world!");
var socket = io.connect("http://oldie.muc.lberki.net");
socket.emit("startGame", { name: "John" });
