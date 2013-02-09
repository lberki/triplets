function id(v) { return v; }

var name = "John";
var socket = io.connect("http://oldie.muc.lberki.net:8080");
socket.emit("startGame", { name: name });
socket.on("state", function(data) { 
    console.log(data);
    setBoard(data.board, data.height, data.width);
    $("#score").text(data.score);
    $("#next").attr("class", "tile figure_" + data.next).text(data.next);
    $("#stash").attr("class", "tile figure_" + data.stash).text(data.stash);
});

$(document).ready(function() {
    $("#stash").click(stash);
});

function stash() {
    socket.emit("stash", { name: name });
}

function cellClicked(cell) {
    socket.emit("place", { name: name, x: cell.x, y: cell.y });
}

function setBoard(board, height, width) {
    var boardMatrix = new Array();
    for (var y = 0; y < height; y++) {
	boardMatrix[y] = new Array();
	for (var x = 0; x < width; x++) {
	    boardMatrix[y][x] = { x: x, y: y, figure: board[y*width + x] };
	}
    }

    var rows = d3.select("#board").selectAll("div.boardRow")
	.data(boardMatrix)
    rows.enter().append("div")
        .attr("class", "boardRow");

    var classAttr = function(d) { return "tile boardCell figure_" + d.figure; };
    var cells = rows.selectAll("div.boardCell")
	.data(id)
        .text(function(d) { return d.figure; })
        .attr("class", classAttr);
    cells
        .enter().append("div")
            .text(function(d) { return d.figure; })
            .on("click", cellClicked)
            .attr("class", classAttr);
}

function setScore(score) {
}

