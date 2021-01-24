'use strict';
let logger = require('./includes/Logger');
let GameHandler = require('./includes/GameHandler');

let https = require('https');
let fs = require('fs');

let express = require('express');
let app = express();

//let privateKey = fs.readFileSync( 'cert.key' );
//let certificate = fs.readFileSync( 'cert.pem');

let server = app.listen(8000);


let io = require('socket.io').listen(server);


app.use(express.static(__dirname + '/public/'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

let gameHandler = new GameHandler(io);

io.sockets.on('connection', (socket) => {

  logger.info('Client(' + socket.id + ') connected');

  socket.on('searchingForGame', () => {
    logger.info('Client(' + socket.id + ') is searching for a game');
    gameHandler.playerSearchingForGame(socket.id);
  });

	socket.on('disconnect', () => {
    logger.info('Client(' + socket.id + ') disconnected');
    gameHandler.closeMatch(socket.id, true);
	});

  socket.on('chatMessage', (message) => {
    if (!message || message.length === 0) {
      return;
    }
    io.emit('newChatMessage', message);
    logger.debug('Client(' + socket.id + ') send this chat message: ' + message);
  });

  socket.on('getRandomGameField', () => {
    if (gameHandler.isThisPlayerInAnyMatch(socket.id)) {
      gameHandler.getMatch(socket.id).generateNewGameFieldForPlayer(socket.id);
      logger.debug('Client(' + socket.id + ') got send a new game field');
    }
  });

  socket.on('playerIsReady', () => {
    if (gameHandler.isThisPlayerInAnyMatch(socket.id)) {
      logger.debug('Client(' + socket.id + ') is ready to play');
      gameHandler.getMatch(socket.id).playerIsReady(socket.id);
    }
  });

	socket.on('clickOnOpponentGameField', (data) => {
    if (gameHandler.isThisPlayerInAnyMatch(socket.id)) {
  		if (gameHandler.getMatch(socket.id).clickOnOpponentGameField(socket.id, data)) {
        gameHandler.closeMatch(socket.id, false);
      }
    }
	});

});
