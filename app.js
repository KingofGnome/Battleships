"use strict";
var MatchHandler = require("./includes/MatchHandler");

var express = require("express"),
	app = express(),
	server = require("http").createServer(app),
	io = require("socket.io").listen(server);
server.listen(8000);
var lobbyBuffer = "";
var runningGames = new Map();
var perPlayerInformation = new Map(); // Stores a players Socket.id and his gameId in the runningGames Map

app.get('/', function (req, res) {
	res.sendFile(__dirname + "/index.html");
});

app.use(express.static(__dirname + '/'));

io.sockets.on("connection", function (socket) {

	playerSearchingForGame(socket.id);

	socket.on("disconnect", function () {
		if (socket.id === lobbyBuffer) {
			lobbyBuffer = "";
		} else {
			try {
				var gameId = perPlayerInformation.get(socket.id);
				console.log("Clearing game: " + gameId);
				io.sockets.to(runningGames.get(gameId).playerOne).emit("gameIsAborted", true);
				io.sockets.to(runningGames.get(gameId).playerTwo).emit("gameIsAborted", true);
				perPlayerInformation.delete(runningGames.get(gameId).playerOne);
				perPlayerInformation.delete(runningGames.get(gameId).playerTwo);
				if (runningGames.get(gameId).playerOne === socket.id) {
					playerSearchingForGame(runningGames.get(gameId).playerTwo);
				} else {
					playerSearchingForGame(runningGames.get(gameId).playerOne);
				}
				runningGames.delete(gameId);
			} catch (error) {
				console.log(error, "Disconnect - ERROR");
			}
		}
	});

	socket.on("clickOnOpponentGameField", function (data) {
		var gameIdForPlayer = perPlayerInformation.get(socket.id);
		runningGames.get(gameIdForPlayer).clickOnOpponentGameField(socket.id, data);
		sendRunningGameItsInformations(gameIdForPlayer);
	});

});

function playerSearchingForGame(socketId) {
	if (lobbyBuffer === "") {
		lobbyBuffer = socketId;
	} else {
		var gameId = createNewGame(socketId, lobbyBuffer);
		console.log("Creating game: " + gameId);
		perPlayerInformation.set(socketId, gameId);
		perPlayerInformation.set(lobbyBuffer, gameId);
		lobbyBuffer = "";
	}
}

function createNewGame(playerOneId, playerTwoId) {
	runningGames.set(runningGames.size,
		new MatchHandler(playerOneId, playerTwoId, predefinedGameField, predefinedGameField)
		);

	io.sockets.to(playerOneId).emit("gameIsStarting", true);
	io.sockets.to(playerTwoId).emit("gameIsStarting", true);

	sendRunningGameItsInformations(runningGames.size - 1);

	return runningGames.size - 1;
}

function sendRunningGameItsInformations(gameId) {
	var playerOneId = runningGames.get(gameId).playerOne;
	var playerTwoId = runningGames.get(gameId).playerTwo;

	io.sockets.to(playerOneId).emit("gameField", runningGames.get(gameId).gameFieldOne);
	io.sockets.to(playerTwoId).emit("gameField", runningGames.get(gameId).gameFieldTwo);

	// Send the player the opponent game fields but with all ships displayed as water
	var playerOneGameField = runningGames.get(gameId).gameFieldOne.slice();
	var playerTwoGameField = runningGames.get(gameId).gameFieldTwo.slice();
	for (var i = 0; i < playerOneGameField.length; i++) {
		if (playerOneGameField[i].substring(0, 1) === "x") {
			playerOneGameField[i] = "o";
		}
	}
	for (var i = 0; i < playerTwoGameField.length; i++) {
		if (playerTwoGameField[i].substring(0, 1) === "x") {
			playerTwoGameField[i] = "o";
		}
	}

	io.sockets.to(playerOneId).emit("opponentGameField", playerTwoGameField);
	io.sockets.to(playerTwoId).emit("opponentGameField", playerOneGameField);

	if (runningGames.get(gameId).playerWhoWon === "none") {
		if (playerOneId === runningGames.get(gameId).playerWhosMoveItIs) {
			io.sockets.to(playerOneId).emit("isItMyTurn", true);
			io.sockets.to(playerTwoId).emit("isItMyTurn", false);
		} else {
			io.sockets.to(playerOneId).emit("isItMyTurn", false);
			io.sockets.to(playerTwoId).emit("isItMyTurn", true);
		}
	} else {
		// Send out winning/loosing infos
		io.sockets.to(runningGames.get(gameId).playerWhoWon).emit("won", true);
		if (runningGames.get(gameId).playerWhoWon === runningGames.get(gameId).playerOne) {
			io.sockets.to(runningGames.get(gameId).playerTwo).emit("won", false);
		} else {
			io.sockets.to(runningGames.get(gameId).playerOne).emit("won", false);
		}
		// Clean up
		perPlayerInformation.delete(runningGames.get(gameId).playerOne);
		perPlayerInformation.delete(runningGames.get(gameId).playerTwo);
		runningGames.delete(gameId);
	}
}

var predefinedGameField = ["x1", "x1", "x1", "x1", "x1", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "x2", "x2", "x2", "x3", "o", "o", "o", "o", "x5", "o", "o", "o", "o", "x3", "o", "x4", "x4", "o", "x5", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "x9", "x9", "x9", "x6", "o", "o", "x7", "x7", "x7", "o", "o", "o", "o", "x6", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "x0", "x0", "x0", "x0", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "x8", "x8", "x8", "x8", "o", "o", "o", "o", "o", "o"];






