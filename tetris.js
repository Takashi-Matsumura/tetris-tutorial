// https://tetris.fandom.com/wiki/Tetris_Guideline

/**
 * Returns a random integer between the specified range.
 * @param {number} min - The minimum value of the range (inclusive).
 * @param {number} max - The maximum value of the range (inclusive).
 * @returns {number} A random integer between the specified range.
 *
 * @see https://stackoverflow.com/a/1527820/2124254
 */
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generates a new sequence of tetrominos to be used in the game.
 * The sequence is generated randomly and contains one of each tetromino type.
 * @returns {void}
 *
 * @see https://tetris.fandom.com/wiki/Random_Generator
 */
const generateSequence = () => {
  const sequence = ["I", "J", "L", "O", "S", "T", "Z"];

  while (sequence.length) {
    const rand = getRandomInt(0, sequence.length - 1);
    const name = sequence.splice(rand, 1)[0];
    tetrominoSequence.push(name);
  }
};

/**
 * Returns the next tetromino in the sequence.
 * If the sequence is empty, generates a new sequence.
 * @returns {Object} An object containing the name, matrix, row, and col of the next tetromino.
 *
 * @see https://tetris.fandom.com/wiki/Random_Generator
 */
const getNextTetromino = () => {
  if (tetrominoSequence.length === 0) {
    generateSequence();
  }

  const name = tetrominoSequence.pop();
  const matrix = tetrominos[name];

  // I and O start centered, all others start in left-middle
  const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);

  // I starts on row 21 (-1), all others start on row 22 (-2)
  const row = name === "I" ? -1 : -2;

  return {
    name: name, // name of the piece (L, O, etc.)
    matrix: matrix, // the current rotation matrix
    row: row, // current row (starts offscreen)
    col: col, // current col
  };
};

/**
 * Rotates an NxN matrix 90 degrees clockwise.
 * @param {Array<Array>} matrix - The matrix to rotate.
 * @returns {Array<Array>} The rotated matrix.
 *
 * @see https://codereview.stackexchange.com/a/186834
 */
const rotate = (matrix) => {
  const N = matrix.length - 1;
  const result = matrix.map((row, i) => row.map((val, j) => matrix[N - j][i]));

  return result;
};

/**
 * Checks if a tetromino can be moved to the specified cell on the playfield.
 * @param {Array<Array>} matrix - The matrix representing the tetromino.
 * @param {number} cellRow - The row of the cell to move the tetromino to.
 * @param {number} cellCol - The column of the cell to move the tetromino to.
 * @returns {boolean} True if the tetromino can be moved to the specified cell, false otherwise.
 */
const isValidMove = (matrix, cellRow, cellCol) => {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (
        matrix[row][col] &&
        // outside the game bounds
        (cellCol + col < 0 ||
          cellCol + col >= playfield[0].length ||
          cellRow + row >= playfield.length ||
          // collides with another piece
          playfield[cellRow + row][cellCol + col])
      ) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Places the current tetromino on the playfield and checks for line clears.
 * If any part of the tetromino is offscreen, the game is over.
 * @returns {void}
 */
const placeTetromino = () => {
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        // game over if piece has any part offscreen
        if (tetromino.row + row < 0) {
          return showGameOver();
        }

        playfield[tetromino.row + row][tetromino.col + col] = tetromino.name;
      }
    }
  }

  // check for line clears starting from the bottom and working our way up
  for (let row = playfield.length - 1; row >= 0; ) {
    if (playfield[row].every((cell) => !!cell)) {
      // drop every row above this one
      for (let r = row; r >= 0; r--) {
        for (let c = 0; c < playfield[r].length; c++) {
          playfield[r][c] = playfield[r - 1][c];
        }
      }
    } else {
      row--;
    }
  }

  tetromino = getNextTetromino();
};

/**
 * Ends the game and displays the game over screen.
 * Cancels the animation frame and sets the `gameOver` flag to true.
 * Fills the canvas with a semi-transparent black rectangle and displays "GAME OVER!" in white text.
 * @returns {void}
 */
const showGameOver = () => {
  cancelAnimationFrame(rAF);
  gameOver = true;

  context.fillStyle = "black";
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);

  context.globalAlpha = 1;
  context.fillStyle = "white";
  context.font = "36px monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("GAME OVER!", canvas.width / 2, canvas.height / 2);
};

/**
 * The canvas element used to draw the game.
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("game");

/**
 * The 2D rendering context for the canvas element used to draw the game.
 * @type {CanvasRenderingContext2D}
 */
const context = canvas.getContext("2d");

/**
 * The 2D rendering context for the canvas element used to draw the game.
 * @type {CanvasRenderingContext2D}
 */
const grid = 32;

/**
 * An array containing the sequence of tetrominos to be used in the game.
 * The sequence is generated randomly and contains one of each tetromino type.
 * @type {Array<string>}
 *
 * @see https://tetris.fandom.com/wiki/Random_Generator
 */
const tetrominoSequence = [];

/**
 * A 2D array representing the playfield of the Tetris game.
 * Each cell in the playfield is either empty (0) or occupied by a tetromino (1).
 * The playfield is 10 cells wide and 20 cells tall, with a few rows offscreen.
 * @type {Array<Array<number>>}
 */
const playfield = [];

// populate the empty state
for (let row = -2; row < 20; row++) {
  playfield[row] = [];

  for (let col = 0; col < 10; col++) {
    playfield[row][col] = 0;
  }
}

// how to draw each tetromino
// @see https://tetris.fandom.com/wiki/SRS
const tetrominos = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

/**
 * An object containing the color of each tetromino.
 * @type {Object<string, string>}
 */
const colors = {
  I: "cyan",
  O: "yellow",
  T: "purple",
  S: "green",
  Z: "red",
  J: "blue",
  L: "orange",
};

/**
 * The number of times a certain action has been performed.
 * @type {number}
 */
let count = 0;

/**
 * The current active tetromino that is falling down the playfield.
 * @type {Array<Array<number>>}
 */
let tetromino = getNextTetromino();

/**
 * The ID of the current animation frame request.
 * Used to keep track of the animation frame so it can be cancelled if needed.
 * @type {number|null}
 */
let rAF = null; // keep track of the animation frame so we can cancel it

/**
 * A boolean indicating whether the game is over or not.
 * @type {boolean}
 */
let gameOver = false;

/**
 * The main game loop that runs continuously to update the game state and render the game.
 */
const loop = () => {
  rAF = requestAnimationFrame(loop);
  context.clearRect(0, 0, canvas.width, canvas.height);

  // draw the playfield
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (playfield[row][col]) {
        const name = playfield[row][col];
        context.fillStyle = colors[name];

        // drawing 1 px smaller than the grid creates a grid effect
        context.fillRect(col * grid, row * grid, grid - 1, grid - 1);
      }
    }
  }

  // draw the active tetromino
  if (tetromino) {
    // tetromino falls every 35 frames
    if (++count > 35) {
      tetromino.row++;
      count = 0;

      // place piece if it runs into anything
      if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
        tetromino.row--;
        placeTetromino();
      }
    }

    context.fillStyle = colors[tetromino.name];

    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {
          // drawing 1 px smaller than the grid creates a grid effect
          context.fillRect(
            (tetromino.col + col) * grid,
            (tetromino.row + row) * grid,
            grid - 1,
            grid - 1
          );
        }
      }
    }
  }
};

// listen to keyboard events to move the active tetromino
document.addEventListener("keydown", (e) => {
  if (gameOver) return;

  switch (e.code) {
    // move tetromino left and Right
    case "ArrowLeft":
    case "ArrowRight":
      const col =
        e.code === "ArrowLeft" ? tetromino.col - 1 : tetromino.col + 1;
      if (isValidMove(tetromino.matrix, tetromino.row, col)) {
        tetromino.col = col;
      }
      break;

    case "ArrowUp":
      const matrix = rotate(tetromino.matrix);
      if (isValidMove(matrix, tetromino.row, tetromino.col)) {
        tetromino.matrix = matrix;
      }
      break;

    // drop tetromino
    case "ArrowDown":
      const row = tetromino.row + 1;
      if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
        tetromino.row = row - 1;
        placeTetromino();
        return;
      }
      tetromino.row = row;
      break;
  }
});

// start the game
rAF = requestAnimationFrame(loop);
