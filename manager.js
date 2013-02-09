function Manager() {
}

Manager.prototype.startGame = function(data, callback) {
    console.log("start: " + data.name);
    callback.state({name: "Jane"});
}

Manager.prototype.gameStep = function(data) {
    console.log("step: " + data.name);
}

exports.Manager = Manager;
