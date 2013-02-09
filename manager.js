function Manager() {
}

Manager.prototype.startGame = function(data) {
    console.log("start: " + data.name);
}

Manager.prototype.gameStep = function(data) {
    console.log("step: " + data.name);
}

exports.Manager = Manager;
