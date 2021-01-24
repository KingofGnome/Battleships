'use strict';

$(document).ready(function () {
  var socket = io.connect();

  $('#legendButtonPopover').popover({
    html: true,
    trigger: 'click focus',
    placement: 'top',
    content: function () {
      return '<button class="btn legendButton water-field left20" disabled></button> Water' +
        '<button class="btn legendButton ship-field left20" disabled></button> Ship' +
        '<button class="btn legendButton missed-field left20" disabled></button> Missed' +
        '<button class="btn legendButton hit-field left20" disabled></button> Hit' +
        '<button class="btn legendButton destroyed-field left20" disabled></button> Destroyed';
    }
  });

  $(document).on('click', '#searchForGameButton', function () {
    $('#searchForGameButton').text('Searching for game...');
    socket.emit('searchingForGame', true);
  });

  $(document).on('keypress', '#chatMessageInput', function (event) {
    // Check if 'Enter/Return' was pressed while in the chat input field
    if (event.which === 13) {
      sendNewChatMessage();
    }
  });

  $(document).on('click', '#chatSendButton', function () {
    sendNewChatMessage();
  });

  $(document).on('click', '#getRandomGameFieldButton', function () {
    socket.emit('getRandomGameField', true);
  });

  $(document).on('click', '#readyToPlayButton', function () {
    socket.emit('playerIsReady', true);
  });

  $(document).on('click', '#opponentGameField .fieldButton', function () {
    socket.emit('clickOnOpponentGameField', $(this).attr('squareNumber'));
  });

  socket.on('newChatMessage', function (message) {
    $('#chatTextArea').val($('#chatTextArea').val() + message + '\n');
    $('#chatTextArea').scrollTop($('#chatTextArea')[0].scrollHeight);
  });

  socket.on('preGame', function () {
    $('#lobbyContainer').hide();
    hideAllAlerts();
    resetGameFieldAppearance();
    generateGameFields();
    $('#getRandomGameFieldButton').show();
    $('#readyToPlayButton').text('Ready to play...');
    $('#readyToPlayButton').removeClass('btn-success');
    $('#readyToPlayButton').addClass('btn-danger');
    $('#readyToPlayButton').show();
    $('#preGameInstructions').show();
    $('#gameContainer').show();
    $('#opponentDisplay').hide();
    $('#opponentsShips').hide();
  });

  socket.on('waitingForOpponent', function () {
    $('#readyToPlayButton').removeClass('btn-danger');
    $('#readyToPlayButton').addClass('btn-success');
    $('#readyToPlayButton').text('Waiting for opponent...');
    $('#preGameInstructions').hide();
    showAlert('waitingForOpponent');
  });

  socket.on('gameIsStarting', function () {
    hideAllAlerts();
    $('#getRandomGameFieldButton').hide();
    $('#readyToPlayButton').hide();
    $('#opponentDisplay').show();
    $('#opponentsShips').show();
  });

  socket.on('gameIsAborted', function () {
    returnToLobbyWithAlert('gameWasClosed');
  });

  socket.on('gameField', function (data) {
    fillGameField('myGameField', data);
  });

  socket.on('opponentGameField', function (data) {
    fillGameField('opponentGameField', data);
  });

  socket.on('shipMap', function (data) {
    parseShipMapArray(data);
  });

  socket.on('isItMyTurn', function (data) {
    turnDisplay(data);
  });

  socket.on('won', function (data) {
    if (data) {
      returnToLobbyWithAlert('gameWon');
    } else {
      returnToLobbyWithAlert('gameLost');
    }
  });

  function sendNewChatMessage () {
    socket.emit('chatMessage', $('#chatMessageInput').val());
    $('#chatMessageInput').val('');
  }
});

function parseShipMapArray (data) {
  console.log(data)
  for (var i = 0; i < data.length; i++) {
    if (data[i].isFullyDestroyed) {
      $('.shipMapKey[shipId="' + i + '"]').attr('src', 'img/Ship' + data[i].length + 'Destroyed.png');
    } else {
      $('.shipMapKey[shipId="' + i + '"]').attr('src', 'img/Ship' + data[i].length + 'Intact.png');
    }
  }
}



function generateGameFields () {
  $('.gameField').empty();
  var rowident = ['yo', 'tù', 'èl/ella', 'nosotros/-as', 'vosotros/-a', 'ellos/ellas', 'G', 'H', 'I', 'J'];
  var coulmnverbs = ['preferir','dormir','ir','poder','querer','pensar', '7', '8' , '9' , '10'];
  var size = 6;
  var gameFieldHtml = '<table class="margin-auto"><tr><td class="gameFieldHeaderSquare"></td>';
  for(var i = 0; i < size; i++) {
    gameFieldHtml += '<td class="gameFieldHeaderSquare">' + coulmnverbs[i] + '</td>';
  }
  gameFieldHtml += '</tr>';
  var squareCount = 0;
  for(var j = 0; j < size; j++) {
    gameFieldHtml += '<tr><td class="gameFieldHeaderSquare">' + rowident[j] + '</td>';
    for(var k = 0; k < size; k++) {
      gameFieldHtml += '<td class="gameFieldSquare"><button class="btn fieldButton" squareNumber="' + squareCount + '"></button></td>';
      squareCount++;
    }
    gameFieldHtml += '</tr>';
  }
  gameFieldHtml += '</table>';
  $('.gameField').html(gameFieldHtml);
  $('#myGameField button').prop('disabled', true);
}

function fillGameField (targetGameField, data) {
  for(var i = 0; i < data.length; i++) {
    switch (data[i]) {
      case 'w':
        $('#' + targetGameField + ' .fieldButton[squareNumber=' + i + ']').css('background-color', '#2278BF');
        break;

      case 'i':
        $('#' + targetGameField + ' .fieldButton[squareNumber=' + i + ']').css('background-color', '#333');
        break;

      case 'h':
        $('#' + targetGameField + ' .fieldButton[squareNumber=' + i + ']').css('background-color', '#F44336').addClass('disabled').css('cursor', 'default');
        break;

      case 'm':
        $('#' + targetGameField + ' .fieldButton[squareNumber=' + i + ']').css('background-color', '#DDD').addClass('disabled').css('cursor', 'default');
        break;

      case 'd':
        $('#' + targetGameField + ' .fieldButton[squareNumber=' + i + ']').css('background-color', '#4CAF50').addClass('disabled').css('cursor', 'default');
        break;

      default:
        break;
    }
  }
}

function turnDisplay (isItMyTurn) {
  if (isItMyTurn) {
    $('#opponentTitle').text('Your Turn *** Opponents game field *** Your Turn');
    $('#opponentTitleWell').css('background', 'rgba(92, 184, 92, 0.8)');
    $('#opponentGameField > table').addClass('tableRedBorder');
    $('.fieldButton').removeClass('cursor-default');
  } else {
    $('#opponentTitle').text('Opponents Turn - Opponents game field - Opponents Turn');
    $('#opponentTitleWell').css('background', 'rgba(217, 83, 79, 0.59)');
    $('#opponentGameField > table').removeClass('tableRedBorder');
    $('.fieldButton').addClass('cursor-default');
  }
}

function resetGameFieldAppearance () {
  $('#opponentTitle').text('Opponents game field');
  $('#opponentGameField > table').removeClass('tableRedBorder');
}

function showAlert (alertToShow) {
  hideAllAlerts();
  switch (alertToShow) {
    case 'gameWasClosed':
      $('#gameWasClosedAlert').show();
      break;
    case 'gameWon':
      $('#gameWonAlert').show();
      break;
    case 'gameLost':
      $('#gameLostAlert').show();
      break;
    case 'waitingForOpponent':
      $('#waitingForOpponentAlert').show();
      break;
  }
}

function hideAllAlerts () {
  $('#gameWasClosedAlert').hide();
  $('#gameWonAlert').hide();
  $('#gameLostAlert').hide();
  $('#waitingForOpponentAlert').hide();
}

function returnToLobbyWithAlert (alertToShow) {
  $('#gameContainer').hide();
  showAlert(alertToShow);
  $('#searchForGameButton').text('Search for game');
  $('#lobbyContainer').show();
}
