'use strict';

class GameField {
  /**
   * GameField constructor
   * @param  {Number} size Width or height of the symmetrical game field (10
   * is the standard in battleships)
   */
  constructor (size, ships) {
    this.size = size;
    this.ships = ships;
    /**
     * True when the player is ready to play and his game field is valid
     * @type {Boolean}
     */
    this.locked = false;
    /**
     * Stores for each ship Id how long the ship is and if it is fully
     * destroyed
     * @type {Map}
     */
    this.shipMap = new Map();
    this.generateGameField();
  }

  /**
   * Takes in a field id from a flat array and checks if it is a valid
   * coordinate
   * @param  {*}  fieldId Given field id to test
   * @return {Boolean}         True when the fieldId is valid
   */
  isValidCoordinate (fieldId) {
    if (!isNaN(parseFloat(fieldId)) && isFinite(fieldId)) {
      if (fieldId >= 0 && fieldId < (this.size * this.size)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Returns if the game field can not be changed any more
   * @return {Boolean} True if the game field is locked an therefore can not
   * be changed any more
   */
  isLocked () {
    return this.locked;
  }

  /**
   * Locks the game field so that it can't be changed any more
   */
  lock () {
    this.locked = true;
  }

  /**
   * Wraps the private method that generates a random game field to ensure
   * that one gets generated and the private method doesn't get stuck
   */
  generateGameField () {
    this._initGameField();
    this.shipMap.clear();
    let gameFieldGenerated = false;
    while (!gameFieldGenerated) {
      if (this._generateGameField()) {
        gameFieldGenerated = true;
      }
    }
  }

  /**
   * Check if the given fieldId from a flat array would be a clickable field
   * @param  {Number}  fieldId Id in the flat array to check
   * @return {Boolean}         True if the field is clickable
   */
  isClickableField (fieldId) {
    let twoDimensionalCoordinates = this._translateCoordinates(fieldId);
    return this.gameField[twoDimensionalCoordinates.x][twoDimensionalCoordinates.y].isClickable();
  }

  /**
   * Checks if a given fieldId from a flat array would be an intact ship part
   * @param  {Number}  fieldId Id in the flat array to check
   * @return {Boolean}         true if the field is an intact ship part
   */
  isIntactShip (fieldId) {
    let twoDimensionalCoordinates = this._translateCoordinates(fieldId);
    return (this.gameField[twoDimensionalCoordinates.x][twoDimensionalCoordinates.y].getType() === 'intactShipPart');
  }

  /**
   * Performs a click on a ship part
   * @param  {Number} fieldId Id in the flat array to perform the click on
   */
  clickOnShipPart (fieldId) {
    let twoDimensionalCoordinates = this._translateCoordinates(fieldId);
    const shipId = this.gameField[twoDimensionalCoordinates.x][twoDimensionalCoordinates.y].getShipId();
    this.gameField[twoDimensionalCoordinates.x][twoDimensionalCoordinates.y] = new HitShipPart(shipId);
    this._checkIfShipIsFullyDestroyed(shipId);
  }

  /**
   * Sets a given field to status missed
   * @param {Number} fieldId Id in the flat array to set as missed
   */
  setMissed (fieldId) {
    let twoDimensionalCoordinates = this._translateCoordinates(fieldId);
    this.gameField[twoDimensionalCoordinates.x][twoDimensionalCoordinates.y] = new Missed();
  }

  /**
   * Checks if there are still any not fully destroyed ship parts left
   * @return {Boolean} True if there is at least one not fully destroyed ship
   * part left on the game field
   */
  areNotFullyDestroyedShipPartsLeft () {
    let notAllFullyDestroyed = false;

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.gameField[j][i].getType() === 'intactShipPart' || this.gameField[j][i].getType() === 'hitShipPart') {
          notAllFullyDestroyed = true;
        }
      }
    }

    return notAllFullyDestroyed;
  }

  /**
   * Transforms the stored game field to a flat one dimensional array that the
   * client can parse more easily
   * @return {Array(String)} Flat array
   */
  makeFlatArray () {
    let returnArray = [];

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        returnArray.push(this.gameField[j][i].getLabel());
      }
    }

    return returnArray;
  }

  /**
   * Transforms the stored game field to an anonymous flat one dimensional
   * array that doesn't contain any information that the client doesn't
   * already know about and that he can parse more easily
   * @return {Array(String)} Flat array
   */
  makeAnonymousFlatArray () {
    let returnArray = [];

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        returnArray.push(this.gameField[j][i].getAnonymousLabel());
      }
    }

    return returnArray;
  }

  /**
   * Get shipMap as array
   * @return {Array} shipMap as array
   */
  getShipMapAsArray () {
    let returnArray = [];
    this.shipMap.forEach(function (value) {
      returnArray.push(value);
    });
    returnArray.sort(function (a, b) {
      if (a.length > b.length) {
        return 1;
      }
      if (a.length < b.length) {
        return -1;
      }
      return 0;
    });
    return returnArray;
  }

  /**
   * For a given shipId check if all of its parts have been destroyed
   * @param  {Number} shipId Ship Id
   * @return {Boolean}        True if all parts of a ship have been destroyed
   */
  _checkIfShipIsFullyDestroyed (shipId) {
    let allDestroyed = true;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.gameField[j][i].getType() === 'intactShipPart') {
          if (this.gameField[j][i].getShipId() === shipId) {
            allDestroyed = false;
          }
        }
      }
    }

    if (allDestroyed) {
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (this.gameField[j][i].getType() === 'hitShipPart') {
            if (this.gameField[j][i].getShipId() === shipId) {
              this.gameField[j][i] = new DestroyedShipPart(shipId);
            }
          }
        }
      }

      this.shipMap.get(shipId).isFullyDestroyed = true;
    }
  }

  /**
   * Translates the index of a flat array to coordinates in the game field
   * @param  {Number} flatArrayIndex Index in the flat array
   * @return {Object}       Object with parameters x and y that contain the
   * coordinates in the game field
   */
  _translateCoordinates (flatArrayIndex) {
    let returnObject = {};
    returnObject.x = flatArrayIndex % this.size;
    returnObject.y = Math.floor(flatArrayIndex / this.size);
    return returnObject;
  }

  /**
   * Initiate the game field with the right size and makes all field water
   */
  _initGameField () {
    this.gameField = new Array(this.size);
    for (let i = 0; i < this.size; i++) {
      this.gameField[i] = new Array(this.size);
    }
    this._fillGameFieldWithWater();
  }

  /**
   * Fill the whole game field with water
   */
  _fillGameFieldWithWater () {
    for (let i = 0; i < this.gameField.length; i++) {
      for (let j = 0; j < this.gameField[i].length; j++) {
        this.gameField[i][j] = new Water();
      }
    }
  }

  /**
   * Generates a random game field
   *   Note:
   *     - This method can fail when trying to generate a new game field
   *     because there are situations where not all ships fit on the board
   *     -> This is detected by keeping track of how many times the generator
   *     tried placing a new ship. When the amount of tries exceeds 1000 than
   *     the method returns false to indicate the generation failed and needs
   *     to be restarted from its caller
   * @return {Boolean} False if the generation failed
   */
  _generateGameField () {
    let tmpShipsToPlace = this._getShipsToPlace();

    let nextShipId = 0;
    let iterationCounter = 0;

    while (tmpShipsToPlace.length > 0) {
      iterationCounter++;
      // Fall back to ensure the generator doesn't get stuck
      if (iterationCounter > 1000) {
        this._initGameField();
        this.shipMap.clear();
        return false;
      }
      const randomShipIndex = this._getRandomInt(0, tmpShipsToPlace.length - 1);
      const randomShip = tmpShipsToPlace[randomShipIndex];
      if (this._placeShip(randomShip.length, this._getRandomInt(0, this.size - 1), this._getRandomInt(0, this.size - 1), this._getRandomDirection(), nextShipId)) {
        this.shipMap.set(nextShipId, {
          length: randomShip.length,
          isFullyDestroyed: false
        });
        nextShipId++;
        iterationCounter = 0;
        if (tmpShipsToPlace[randomShipIndex].amount === 1) {
          tmpShipsToPlace.splice(randomShipIndex, 1);
        } else {
          tmpShipsToPlace[randomShipIndex].amount = tmpShipsToPlace[randomShipIndex].amount - 1;
        }
      }
    }

    return true;
  }

  /**
   * Returns an Array of objects which contains the ships that should be
   * placed/present on a game field
   * @return {Array(Object)} Object of the ships to be placed/present
   */
  _getShipsToPlace () {
    //TODO: get the ship config from config
    // var config = require('../config');
    // console.log(this.ships);
    return [
      {
        length: 2,
        amount: 2
      },
      {
        length: 3,
        amount: 2
      }
    ];
  }

  /**
   * Places a ship in the game field
   * @param  {Number} length    Length of the ship
   * @param  {Number} x         Start x coordinate of the ship
   * @param  {Number} y         Start y coordinate of the ship
   * @param  {String} direction Orientation of the ship ('up', 'down', 'left', 'right')
   * @param  {Number} id         Id of the ship
   * @return {Boolean}           True if the ship could be placed
   */
  _placeShip (length, x, y, direction, id) {
    if (!this._isFieldWater(x, y) || !this._areCoordinatesWithinBounds(x, y) || !this._wouldShipFitInGameField(length, x, y, direction)) {
      return false;
    }

    if (!this._wouldAllFieldsOfTheShipBeValidFieldsToPlaceAShipOn(length, x, y, direction)) {
      return false;
    }

    // Place ship
    switch (direction) {
      case 'up':
        for (let i = y; i > y - length; i--) {
          this.gameField[x][i] = new IntactShipPart(id);
        }
        break;
      case 'down':
        for (let i = y; i < y + length; i++) {
          this.gameField[x][i] = new IntactShipPart(id);
        }
        break;
      case 'left':
        for (let i = x; i > x - length; i--) {
          this.gameField[i][y] = new IntactShipPart(id);
        }
        break;
      case 'right':
        for (let i = x; i < x + length; i++) {
          this.gameField[i][y] = new IntactShipPart(id);
        }
        break;
    }

    return true;
  }

  /**
   * Check if the given coordinates are within the bounds of the game field
   * @param  {Number} x X coordinate
   * @param  {Number} y Y coordinate
   * @return {Boolean}   True if within bounds
   */
  _areCoordinatesWithinBounds (x, y) {
    return (x < this.size && x >= 0 && y < this.size && y >= 0);
  }

  /**
   * Checks if given coordinates are for a field that is of type water
   * @param  {Number}  x X coordinate
   * @param  {Number}  y Y coordinate
   * @return {Boolean}   True if the field is water
   */
  _isFieldWater (x, y) {
    if (!this._areCoordinatesWithinBounds(x, y)) {
      return 'water';
    } else {
      return this.gameField[x][y].getType() === 'water';
    }
  }

  /**
   * For a given coordinate check if all adjacent field are water
   * @param  {Number} x X coordinate
   * @param  {Number} y Y coordinate
   * @return {Boolean}   True if all adjacent fields are water
   */
  _areAllAdjacentFieldsWater (x, y) {
    // up
    if (this._areCoordinatesWithinBounds(x, y - 1)) {
      if (!this._isFieldWater(x, y - 1)) {
        return false;
      }
    }

    // down
    if (this._areCoordinatesWithinBounds(x, y + 1)) {
      if (!this._isFieldWater(x, y + 1)) {
        return false;
      }
    }

    // left
    if (this._areCoordinatesWithinBounds(x - 1, y)) {
      if (!this._isFieldWater(x - 1, y)) {
        return false;
      }
    }

    // right
    if (this._areCoordinatesWithinBounds(x + 1, y)) {
      if (!this._isFieldWater(x + 1, y)) {
        return false;
      }
    }

    // up left
    if (this._areCoordinatesWithinBounds(x - 1, y - 1)) {
      if (!this._isFieldWater(x - 1, y - 1)) {
        return false;
      }
    }

    // up right
    if (this._areCoordinatesWithinBounds(x + 1, y - 1)) {
      if (!this._isFieldWater(x + 1, y - 1)) {
        return false;
      }
    }

    // down left
    if (this._areCoordinatesWithinBounds(x - 1, y + 1)) {
      if (!this._isFieldWater(x - 1, y + 1)) {
        return false;
      }
    }

    // down right
    if (this._areCoordinatesWithinBounds(x + 1, y + 1)) {
      if (!this._isFieldWater(x + 1, y + 1)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a given ship would fit in the game field
   * @param  {Number} length    Length of the ship
   * @param  {Number} x         X coordinate to start
   * @param  {Number} y         Y coordinate to start
   * @param  {String} direction Direction the ship is facing
   * @return {Boolean}           True if the ship fits
   */
  _wouldShipFitInGameField (length, x, y, direction) {
    switch (direction) {
      case 'up':
        return (y - length >= -1);
      case 'down':
        return (y + length <= this.size);
      case 'left':
        return (x - length >= -1);
      case 'right':
        return (x + length <= this.size);
    }
  }

  /**
   * Checks if all fields on the way are valid and also if all adjacent fields
   * are valid to
   * @param  {Number} length    Length of the ship
   * @param  {Number} x         X coordinate to start
   * @param  {Number} y         Y coordinate to start
   * @param  {String} direction Direction the ship is facing
   * @return {Boolean}           True if all fields are valid
   */
  _wouldAllFieldsOfTheShipBeValidFieldsToPlaceAShipOn (length, x, y, direction) {
    switch (direction) {
      case 'up':
        for (let i = y; i > y - length; i--) {
          if (this._isFieldWater(x, i)) {
            if (!this._areAllAdjacentFieldsWater(x, i)) {
              return false;
            }
          } else {
            return false;
          }
        }
        break;
      case 'down':
        for (let i = y; i < y + length; i++) {
          if (this._isFieldWater(x, i)) {
            if (!this._areAllAdjacentFieldsWater(x, i)) {
              return false;
            }
          } else {
            return false;
          }
        }
        break;
      case 'left':
        for (let i = x; i > x - length; i--) {
          if (this._isFieldWater(i, y)) {
            if (!this._areAllAdjacentFieldsWater(i, y)) {
              return false;
            }
          } else {
            return false;
          }
        }
        break;
      case 'right':
        for (let i = x; i < x + length; i++) {
          if (this._isFieldWater(i, y)) {
            if (!this._areAllAdjacentFieldsWater(i, y)) {
              return false;
            }
          } else {
            return false;
          }
        }
        break;
    }

    return true;
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive)
   * @param  {Number} min Min (inclusive)
   * @param  {Number} max Max (inclusive)
   * @return {Number}     Random number between min and max
   */
  _getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Returns a random direction (up, down, left or right)
   * @return {String} Random direction
   */
  _getRandomDirection () {
    const randomNumber = this._getRandomInt(0, 3);

    switch (randomNumber) {
      case 0:
        return 'up';
      case 1:
        return 'down';
      case 2:
        return 'left';
      case 3:
        return 'right';
    }
  }

  /**
   * Only used for debugging the game field generator
   * This method pretty prints the game field on the console
   */
  _DEBUG_PRINT_GAME_FIELD () {
    console.log("Game Field: ");
    for (let i = 0; i < this.size; i++) {
      let rowString = '';
      for (let j = 0; j < this.size; j++) {
        rowString += this.gameField[j][i].getLabel() + ' ';
      }
      console.log(rowString);
    }
  }
}

/**
 * Generic game field used as base class for the other types
 */
class Field {
  /**
   * Field constructor
   * @param  {String} label     Label of the field
   * @param  {String} anonymousLabel     Anonymous label of the field
   * @param  {String} type      Type of the field
   * @param  {Boolean} clickable Is it clickable
   */
  constructor (label, anonymousLabel, type, clickable) {
    this.label = label;
    this.anonymousLabel = anonymousLabel;
    this.type = type;
    this.clickable = clickable;
  }

  /**
   * Returns the label of the field
   * @return {String} Label
   */
  getLabel () {
    return this.label;
  }

  /**
   * Return the anonymous label
   * @return {String} Anonymous label
   */
  getAnonymousLabel () {
    return this.anonymousLabel;
  }

  /**
   * Returns the type of the field
   * @return {String} Type
   */
  getType () {
    return this.type;
  }

  /**
   * Returns if the field is clickable
   * @return {Boolean} True if the field is clickable
   */
  isClickable () {
    return this.clickable;
  }
}

class Water extends Field {
  /**
   * Water constructor
   */
  constructor () {
    super('w', 'w', 'water', true);
  }
}

class Missed extends Field {
  /**
   * Missed constructor
   */
  constructor () {
    super('m', 'm', 'missed', false);
  }
}

class ShipPart extends Field {
  /**
   * Creates a generic ship part
   * @param  {String} label          Label
   * @param  {String} anonymousLabel Anonymous label
   * @param  {String} type           Type of the field
   * @param  {Boolean} clickable      Is it clickable
   * @param  {Number} shipId         Id if the ship
   */
  constructor (label, anonymousLabel, type, clickable, shipId) {
    super(label, anonymousLabel, type, clickable);
    this.shipId = shipId;
  }

  /**
   * Returns the ship id
   * @return {Number} Ship id
   */
  getShipId () {
    return this.shipId;
  }
}

class IntactShipPart extends ShipPart {
  /**
   * Intact ship part constructor
   * @param  {Number} shipId ShipId
   */
  constructor (shipId) {
    super('i', 'w', 'intactShipPart', true, shipId);
  }
}

class HitShipPart extends ShipPart {
  /**
   * Hit ship part constructor
   * @param  {Number} shipId ShipId
   */
  constructor (shipId) {
    super('h', 'h', 'hitShipPart', false, shipId);
  }
}

class DestroyedShipPart extends ShipPart {
  /**
   * Destroyed ship part constructor
   * @param  {Number} shipId ShipId
   */
  constructor (shipId) {
    super('d', 'd', 'destroyedShipPart', false, shipId);
  }
}

module.exports = GameField;
