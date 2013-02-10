function id(v) { return v; }

function sendRequest(url, data, callback) {
    $.ajax(url, { data: data })
	.done(callback);
}

$(document).ready(function() {
    $("#game").hide();
    $("#stash").click(stash);
    $("#startButton").click(function() {
	var args = { 
	    username: $("#username").val(),
	    password: $("#password").val()
	};

	if (args.username === "" && args.password === "") {
	    args = {};
	}
	sendRequest("/startGame", args, gameStarted);		    
    });
});

function maybeShowError(response) {
    if ("error" in response) {
	$("#error").text(response.error).show();
	return true;
    } else {
	$("#error").hide();
	return false;
    }
}

function gameStarted(data) {
    console.log(data);
    if (maybeShowError(data)) {
	return;
    }
    gameId = data.id;
    console.log("Game started, id=" + gameId);
    $("#game").show();
    $("#login").hide();
    showState(data);
}

function showState(data) {
    if (maybeShowError(data)) {
	$("#game").hide();
	$("#login").show();
	return;
    }

    var state = data.state;
    setBoard(state.board, state.height, state.width);
    $("#score").text(state.score);
    $("#next").attr("class", "tile figure_" + state.next).text(state.next);
    $("#stash").attr("class", "tile figure_" + state.stash).text(state.stash);
}

function stash() {
    sendRequest("action", { gameId: gameId, action: "stash" }, showState);
}

function cellClicked(cell) {
    sendRequest("/action", { gameId: gameId, action: "place", x: cell.x, y: cell.y },
		showState);
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

