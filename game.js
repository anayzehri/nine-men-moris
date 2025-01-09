const pointsData = [
    { x: 5, y: 3.5 }, { x: 50.5, y: 3.5 }, { x: 96, y: 3.5 },
    { x: 16.5, y: 19 }, { x: 50.5, y: 18.5 }, { x: 82, y: 19 },
    { x: 36.5, y: 35.3 }, { x: 50.5, y: 35.3 }, { x: 65, y: 35.3 },
    { x: 5, y: 50 }, { x: 16.5, y: 50 }, { x: 36.5, y: 50 }, { x: 65, y: 50 }, { x: 83, y: 50 }, { x: 96, y: 50 },
    { x: 36.5, y: 65 }, { x: 50.5, y: 65 }, { x: 65, y: 65 },
    { x: 16.5, y: 82.5 }, { x: 50, y: 82 }, { x: 83, y: 82 },
    { x: 5, y: 97 }, { x: 50, y: 97 }, { x: 96, y: 97 }
];

const mills = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [9, 10, 11], [12, 13, 14],
    [15, 16, 17], [18, 19, 20], [21, 22, 23],
    [0, 9, 21], [3, 10, 18], [6, 11, 15],
    [1, 4, 7], [16, 19, 22],
    [8, 12, 17], [5, 13, 20],
    [2, 14, 23]
];

const neighbors = {
    0: [1, 9],
    1: [0, 2, 4],
    2: [1, 14],
    3: [4, 10],
    4: [1, 3, 5, 7],
    5: [4, 13],
    6: [7, 11],
    7: [4, 6, 8],
    8: [7, 12],
    9: [0, 10, 21],
    10: [3, 9, 11, 18],
    11: [6, 10, 15],
    12: [8, 13, 17],
    13: [5, 12, 14, 20],
    14: [2, 13, 23],
    15: [11, 16],
    16: [15, 17, 19],
    17: [12, 16],
    18: [10, 19],
    19: [16, 18, 20, 22],
    20: [13, 19],
    21: [9, 22],
    22: [19, 21, 23],
    23: [14, 22]
};
const themeToggle = document.getElementById('theme-toggle');
const container = document.querySelector('.container');
const localTheme = localStorage.getItem('theme');

if (localTheme === 'dark') {
    container.classList.add('dark-theme');
    themeToggle.innerHTML = '☀️';
} else {
    themeToggle.innerHTML = '🌙';
}

themeToggle.addEventListener('click', () => {
    container.classList.toggle('dark-theme');
    localStorage.setItem('theme', container.classList.contains('dark-theme') ? 'dark' : 'light');
    themeToggle.innerHTML = container.classList.contains('dark-theme') ? '☀️' : '🌙';
});

const gameBoard = document.querySelector('.game-board');
const pointsContainer = document.querySelector('.points');
const messageDiv = document.querySelector('.message');
const blueScoreSpan = document.getElementById('black-score');
const redScoreSpan = document.getElementById('white-score');
const resetButton = document.getElementById('reset-button');
const playerVsPlayerRadio = document.getElementById('player-vs-player');
const playerVsAIRadio = document.getElementById('player-vs-ai');
const aiDifficultySelect = document.getElementById('ai-difficulty');

let boardState = Array(24).fill(null);
let currentPlayer = 'blue';
let bluePiecesLeft = 9;
let redPiecesLeft = 9;
let placingPhase = true;
let selectedPieceIndex = null;
let canRemovePiece = false;
let gameMode = 'player';
let aiDifficulty = 'medium';
let placedPiecesCount = 0;

aiDifficultySelect.addEventListener('change', () => {
    aiDifficulty = aiDifficultySelect.value;
    resetGame();
    if (currentPlayer === 'red' && gameMode === 'ai') {
        setTimeout(makeNextAIMove, 100);
    }
});

playerVsPlayerRadio.addEventListener('change', () => {
    gameMode = 'player';
    resetGame();
});

playerVsAIRadio.addEventListener('change', () => {
    gameMode = 'ai';
    resetGame();
    if (currentPlayer === 'red' && gameMode === 'ai') {
        setTimeout(makeNextAIMove, 500);
    }
});

function createPoints() {
    pointsData.forEach((point, index) => {
        const pointDiv = document.createElement('div');
        pointDiv.classList.add('point', 'empty');
        pointDiv.style.left = `${point.x}%`;
        pointDiv.style.top = `${point.y}%`;
        pointDiv.dataset.index = index;
        pointDiv.addEventListener('click', handlePointClick);
        pointsContainer.appendChild(pointDiv);
        updatePointVisualState(pointDiv, null);
    });
}

function updatePointVisualState(pointDiv, player) {
    pointDiv.classList.remove('empty', 'blue', 'red', 'forbidden');
    if (player === 'blue') {
        pointDiv.classList.add('blue');
    } else if (player === 'red') {
        pointDiv.classList.add('red');
    } else {
        pointDiv.classList.add('empty');
    }
}

function handlePointClick(event) {
    const pointIndex = parseInt(event.target.dataset.index);

    if (canRemovePiece) {
        removeOpponentPiece(pointIndex);
        return;
    }

    if (placingPhase) {
        handlePlacement(pointIndex);
    } else {
        handleMovement(pointIndex);
    }
}

function handlePlacement(pointIndex) {
    if (boardState[pointIndex] === null) {
        boardState[pointIndex] = currentPlayer;
        const pointDiv = document.querySelector(`.point[data-index="${pointIndex}"]`);
        updatePointVisualState(pointDiv, currentPlayer);

        if (currentPlayer === 'blue') {
            bluePiecesLeft--;
            blueScoreSpan.textContent = bluePiecesLeft;
        } else {
            redPiecesLeft--;
            redScoreSpan.textContent = redPiecesLeft;
        }
        placedPiecesCount++;

        const formedMill = checkMill(pointIndex, currentPlayer);
        if (formedMill) {
            canRemovePiece = true;
            updateMessage("Mill formed! " + currentPlayer.toUpperCase() + ", remove an opponent's piece.");
            drawMillLine(formedMill);
            highlightMillPieces(formedMill);
        } else {
            switchTurn();
        }

        if (placedPiecesCount === 18) {
            placingPhase = false;
            updateMessage(currentPlayer.toUpperCase() + "'s turn to move.");
            if (gameMode === 'ai' && currentPlayer === 'red') {
                setTimeout(makeNextAIMove, 500);
            }
        }
    }
}

function handleMovement(targetIndex) {
    if (selectedPieceIndex !== null) {
        const canMove = (boardState.filter(p => p === currentPlayer).length === 3) || neighbors[selectedPieceIndex].includes(parseInt(targetIndex));
        if (boardState[targetIndex] === null && canMove) {
            boardState[targetIndex] = currentPlayer;
            boardState[selectedPieceIndex] = null;
            updateBoardDisplay();
            removeHighlights();
            removeMillLines();
            removeMillHighlight();

            const formedMill = checkMill(targetIndex, currentPlayer);
            if (formedMill) {
                canRemovePiece = true;
                updateMessage("Mill formed! " + currentPlayer.toUpperCase() + ", remove an opponent's piece.");
                drawMillLine(formedMill);
                highlightMillPieces(formedMill);
            } else {
                switchTurn();
                if (!placingPhase) {
                    checkWinCondition();
                }
            }
            selectedPieceIndex = null;
        } else {
            updateMessage("Invalid move.");
            selectedPieceIndex = null;
            removeHighlights();
        }
    } else if (boardState[targetIndex] === currentPlayer) {
        selectedPieceIndex = targetIndex;
        highlightMoves(targetIndex);
    }
}

function highlightMoves(pieceIndex) {
    removeHighlights();
    const pointDiv = document.querySelector(`.point[data-index="${pieceIndex}"]`);
    if (pointDiv) {
        pointDiv.classList.add('highlight');
    }
    const aiPiecesCount = boardState.filter(piece => piece === currentPlayer).length;
    const neighborIndices = (aiPiecesCount === 3) ? boardState.reduce((acc, piece, index) => { if (piece === null) acc.push(index); return acc; }, []) : neighbors[pieceIndex];

    if (neighborIndices) {
        neighborIndices.forEach(neighborIndex => {
            if (boardState[neighborIndex] === null) {
                const neighborPointDiv = document.querySelector(`.point[data-index="${neighborIndex}"]`);
                if (neighborPointDiv) {
                    neighborPointDiv.classList.add('highlight');
                }
            }
        });
    }
}

function removeHighlights() {
    document.querySelectorAll('.point').forEach(point => point.classList.remove('highlight', 'forbidden'));
}

function checkMill(pointIndex, player) {
    const tempBoardState = [...boardState];
    tempBoardState[pointIndex] = player;
    for (const mill of mills) {
        if (mill.includes(pointIndex)) {
            const [a, b, c] = mill;
            if (tempBoardState[a] === player && tempBoardState[b] === player && tempBoardState[c] === player) {
                return mill;
            }
        }
    }
    return null;
}

function drawMillLine(millIndices) {
    const point1 = document.querySelector(`.point[data-index="${millIndices[0]}"]`);
    const point2 = document.querySelector(`.point[data-index="${millIndices[1]}"]`);
    const point3 = document.querySelector(`.point[data-index="${millIndices[2]}"]`);

    if (!point1 || !point2 || !point3) return;

    const rect1 = point1.getBoundingClientRect();
    const rect2 = point2.getBoundingClientRect();
    const rect3 = point3.getBoundingClientRect();

    const pointsContainerRect = pointsContainer.getBoundingClientRect();

    const centerX1 = rect1.left + rect1.width / 2 - pointsContainerRect.left;
    const centerY1 = rect1.top + rect1.height / 2 - pointsContainerRect.top;
    const centerX2 = rect2.left + rect2.width / 2 - pointsContainerRect.left;
    const centerY2 = rect2.top + rect2.height / 2 - pointsContainerRect.top;
    const centerX3 = rect3.left + rect3.width / 2 - pointsContainerRect.left;
    const centerY3 = rect3.top + rect3.height / 2 - pointsContainerRect.top;

    const line = document.createElement('div');
    line.classList.add('mill-line');
    pointsContainer.appendChild(line);

    if (Math.abs(centerY1 - centerY2) < 1 && Math.abs(centerY2 - centerY3) < 1) {
        line.style.width = `${Math.max(centerX1, centerX2, centerX3) - Math.min(centerX1, centerX2, centerX3)}px`;
        line.style.top = `${centerY1 - 3}px`;
        line.style.left = `${Math.min(centerX1, centerX2, centerX3)}px`;
    } else if (Math.abs(centerX1 - centerX2) < 1 && Math.abs(centerX2 - centerX3) < 1) {
        line.style.height = `${Math.max(centerY1, centerY2, centerY3) - Math.min(centerY1, centerY2, centerY3)}px`;
        line.style.left = `${centerX1 - 3}px`;
        line.style.top = `${Math.min(centerY1, centerY2, centerY3)}px`;
    }
}

function removeMillLines() {
    document.querySelectorAll('.mill-line').forEach(line => line.remove());
}

function highlightMillPieces(millIndices) {
    millIndices.forEach(index => {
        const pointDiv = document.querySelector(`.point[data-index="${index}"]`);
        if (pointDiv) {
            pointDiv.classList.add('mill-highlight');
        }
    });
}

function removeMillHighlight() {
    document.querySelectorAll('.point').forEach(point => point.classList.remove('mill-highlight'));
}

function removeOpponentPiece(pointIndex) {
    const opponent = currentPlayer === 'blue' ? 'red' : 'blue';
    const canRemove = canOnlyRemoveFromMill(opponent) || !isPieceInMill(pointIndex, opponent);
    if (boardState[pointIndex] === opponent && canRemove) {
        boardState[pointIndex] = null;
        updateBoardDisplay();
        canRemovePiece = false;
        removeMillLines();
        removeMillHighlight();
        switchTurn();
        if (!placingPhase) {
            checkWinCondition();
        }
        if (gameMode === 'ai' && currentPlayer === 'red' && !placingPhase) {
            setTimeout(makeNextAIMove, 500);
        } else if (gameMode === 'ai' && currentPlayer === 'red' && placingPhase) {
            setTimeout(makeNextAIMove, 500);
        }
    } else {
        updateMessage("Invalid removal. Choose an opponent's piece not in a mill (unless all their pieces are in mills).");
    }
}

function isPieceInMill(pointIndex, player) {
    for (const mill of mills) {
        if (mill.includes(pointIndex)) {
            const [a, b, c] = mill;
            if (boardState[a] === player && boardState[b] === player && boardState[c] === player) {
                return true;
            }
        }
    }
    return false;
}

function canOnlyRemoveFromMill(player) {
    const opponentPiecesIndices = boardState.reduce((acc, piece, index) => {
        if (piece === player) {
            acc.push(index);
        }
        return acc;
    }, []);
    if (opponentPiecesIndices.length <= 3) return true;
    return opponentPiecesIndices.every(index => isPieceInMill(index, player));
}

function switchTurn() {
    currentPlayer = currentPlayer === 'blue' ? 'red' : 'blue';
    console.log(`switchTurn - Current player is now ${currentPlayer}`);
    updateMessage(currentPlayer.toUpperCase() + "'s turn.");
    removeMillHighlight();
    updateTurnIndicator();

    if (gameMode === 'ai' && currentPlayer === 'red') {
        setTimeout(makeNextAIMove, 500);
    }
}

function updateTurnIndicator() {
    if (currentPlayer === 'blue') {
        blueScoreSpan.parentElement.classList.add('current-turn');
        redScoreSpan.parentElement.classList.remove('current-turn');
    } else {
        redScoreSpan.parentElement.classList.add('current-turn');
        blueScoreSpan.parentElement.classList.remove('current-turn');
    }
}

updateTurnIndicator();

function updateMessage(message) {
    messageDiv.textContent = message;
}

function updateBoardDisplay() {
    document.querySelectorAll('.point').forEach((pointDiv, index) => {
        updatePointVisualState(pointDiv, boardState[index]);
        pointDiv.classList.remove('highlight', 'mill-highlight', 'forbidden');
    });
    if (!placingPhase) {
        checkWinCondition();
    }
}

function hasLegalMoves(player) {
    const playerPiecesIndices = boardState.reduce((acc, piece, index) => {
        if (piece === player) {
            acc.push(index);
        }
        return acc;
    }, []);

    for (const pieceIndex of playerPiecesIndices) {
        const canMoveAnywhere = playerPiecesIndices.length === 3;
        const moves = canMoveAnywhere ? boardState.reduce((acc, piece, index) => { if (piece === null) acc.push(index); return acc; }, []) : neighbors[pieceIndex];

        if (moves.some(neighborIndex => boardState[neighborIndex] === null)) {
            return true;
        }
    }
    return false;
}

function checkWinCondition() {
    const bluePieces = boardState.filter(piece => piece === 'blue').length;
    const redPieces = boardState.filter(piece => piece === 'red').length;

    if (redPieces < 3) {
        updateMessage("Blue wins!");
        return true;
    }

    if (bluePieces < 3) {
        updateMessage("Red wins!");
        return true;
    }

    if (!placingPhase) {
        if (currentPlayer === 'blue' && !hasLegalMoves('blue')) {
            updateMessage("Red wins! Blue cannot move.");
            return true;
        }
        if (currentPlayer === 'red' && !hasLegalMoves('red')) {
            updateMessage("Blue wins! Red cannot move.");
            return true;
        }
    }
    return false;
}

function resetGame() {
    boardState = Array(24).fill(null);
    currentPlayer = 'blue';
    bluePiecesLeft = 9;
    redPiecesLeft = 9;
    placingPhase = true;
    selectedPieceIndex = null;
    canRemovePiece = false;
    placedPiecesCount = 0;

    updateBoardDisplay();
    updateMessage(currentPlayer.toUpperCase() + "'s turn to place piece.");
    blueScoreSpan.textContent = bluePiecesLeft;
    redScoreSpan.textContent = redPiecesLeft;
    removeHighlights();
    removeMillLines();
    removeMillHighlight();

    if (gameMode === 'ai' && currentPlayer === 'red') {
        setTimeout(makeNextAIMove, 500);
    }
}

function makeNextAIMove(gameState, aiStrategy) {
    const { placingPhase, canRemovePiece, currentPlayer, gameMode, boardState } = gameState;

    console.log(`makeNextAIMove() - placingPhase: ${placingPhase}, canRemovePiece: ${canRemovePiece}, currentPlayer: ${currentPlayer}, gameMode: ${gameMode}`);

    if (gameMode === 'ai' && currentPlayer === 'red') {
        if (placingPhase) {
            aiStrategy.makeAIPlacePiece(boardState); // Using an AI strategy object
        } else if (canRemovePiece) {
            // Consider if the delay is really needed
            setTimeout(() => aiStrategy.makeAIRemovePiece(boardState), 250);
        } else {
            aiStrategy.makeAIMove(boardState);
        }
    } else {
        console.log(`makeNextAIMove - AI should not play. currentPlayer: ${currentPlayer}, gameMode: ${gameMode}`);
    }
}

// Example of how gameState might be structured
const gameState = {
    placingPhase: true,
    canRemovePiece: false,
    currentPlayer: 'red',
    gameMode: 'ai',
    boardState: /* ... your board state object ... */
};

// Example of an AI strategy object
const basicAIStrategy = {
    makeAIPlacePiece: function(board) { /* ... implementation ... */ },
    makeAIRemovePiece: function(board) { /* ... implementation ... */ },
    makeAIMove: function(board) { /* ... implementation ... */ }
};

// Calling the improved function
makeNextAIMove(gameState, basicAIStrategy);


// Evaluate the board state for the AI
function evaluateBoard(board) {
    let score = 0;

    // Prioritize forming mills
    for (const mill of mills) {
        const positions = mill.map(index => board[index]);
        const redCount = positions.filter(p => p === 'red').length;
        const blueCount = positions.filter(p => p === 'blue').length;

        if (redCount === 2 && positions.includes(null)) {
            score += 50; // Potential mill for AI
        } else if (redCount === 3) {
            score += 500; // AI has a mill
        }

        if (blueCount === 2 && positions.includes(null)) {
            score -= 30; // Potential mill for opponent
        } else if (blueCount === 3) {
            score -= 300; // Opponent has a mill
        }
    }

    // Consider piece count
    const redPieces = board.filter(p => p === 'red').length;
    const bluePieces = board.filter(p => p === 'blue').length;
    score += (redPieces - bluePieces) * 10;

    // Consider mobility (number of legal moves)
    const redMoves = getAllPossibleMoves(board, 'red').length;
    const blueMoves = getAllPossibleMoves(board, 'blue').length;
    score += (redMoves - blueMoves) * 5;

    return score;
}

function getAllPossibleMoves(board, player) {
    const possibleMoves = [];
    const playerPieces = board.reduce((acc, piece, index) => {
        if (piece === player) acc.push(index);
        return acc;
    }, []);
    const canMoveAnywhere = playerPieces.length === 3;

    for (const pieceIndex of playerPieces) {
        const moves = canMoveAnywhere ? board.reduce((acc, piece, index) => { if (piece === null) acc.push(index); return acc; }, []) : neighbors[pieceIndex];
        for (const move of moves) {
            if (board[move] === null) {
                possibleMoves.push([pieceIndex, move]);
            }
        }
    }
    return possibleMoves;
}





function getEmptyPoints(board) {
    const empty = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === null) {
            empty.push(i);
        }
    }
    return empty;
}

const aiPlacementStrategies = {
    'easy': (board) => {
        const emptyPoints = getEmptyPoints(board);
        return emptyPoints[Math.floor(Math.random() * emptyPoints.length)];
    },
    'medium': (board) => {
        const emptyPoints = getEmptyPoints(board);
        let bestScoreMedium = -Infinity;
        let bestMove;
        for (const point of emptyPoints) {
            const tempBoardState = [...board];
            tempBoardState[point] = 'red'; // Assuming AI is 'red'
            const score = evaluateBoard(tempBoardState);
            if (score > bestScoreMedium) {
                bestScoreMedium = score;
                bestMove = point;
            }
        }
        return bestMove;
    },
    'hard': (board) => findBestPlaceMove(board, 4)
};

function makeAIPlacePiece(board, currentPlayer, aiDifficulty) {
    console.log(`makeAIPlacePiece() - currentPlayer: ${currentPlayer}, difficulty: ${aiDifficulty}`);

    const emptyPoints = getEmptyPoints(board);

    if (emptyPoints.length > 0) {
        const bestMove = aiPlacementStrategies[aiDifficulty](board);

        if (bestMove !== undefined && board[bestMove] === null) {
            console.log(`AI Placing piece at ${bestMove}`);
            handlePlacement(bestMove);
        } else {
            console.error("AI attempted an illegal placement or no valid move found.");
            // Fallback
            const emptyPointsFallback = getEmptyPoints(board);
            if (emptyPointsFallback.length > 0) {
                const randomMove = emptyPointsFallback[Math.floor(Math.random() * emptyPointsFallback.length)];
                console.log(`AI Placing piece at random ${randomMove}`);
                handlePlacement(randomMove);
            } else {
                console.error("No empty spots available, this should not happen.");
            }
        }
    } else {
        console.error("No empty points available for AI placement, this should not happen.");
    }
}
function makeAIMove() {
    console.log(`makeAIMove() - currentPlayer: ${currentPlayer}`);
    const aiPiecesIndices = boardState.reduce((acc, piece, index) => {
        if (piece === 'red') {
            acc.push(index);
        }
        return acc;
    }, []);

    if (aiPiecesIndices.length === 0) {
        console.log("makeAIMove - No AI pieces to move.");
        return;
    }

    let bestMove = null;
    let bestTarget = null;
    let bestScore = -Infinity;

    const isFlying = aiPiecesIndices.length === 3;
     console.log(`makeAIMove - isFlying: ${isFlying}`);

    for (const pieceIndex of aiPiecesIndices) {
        const possibleMoves = isFlying
            ? boardState.reduce((acc, piece, index) => piece === null ? [...acc, index] : acc, [])
            : neighbors[pieceIndex];
      console.log(`makeAIMove - Piece at ${pieceIndex} has possible moves:`, possibleMoves);

        for (const targetIndex of possibleMoves) {
            if (boardState[targetIndex] === null) {
                 console.log(`makeAIMove - Trying Move: ${pieceIndex} to ${targetIndex}`);
                const tempBoardState = [...boardState];
                tempBoardState[targetIndex] = 'red';
                tempBoardState[pieceIndex] = null;
                let score;
                if (aiDifficulty === 'hard') {
                     score = minimax(tempBoardState, 4, -Infinity, Infinity, false);
                     console.log(`makeAIMove - Hard Mode Score of ${pieceIndex} to ${targetIndex} is ${score}`);
                } else {
                   score = evaluateBoard(tempBoardState); // Pass the temporary board state
                     console.log(`makeAIMove - Score of ${pieceIndex} to ${targetIndex} is ${score}`);
                }
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = pieceIndex;
                    bestTarget = targetIndex;
                     console.log(`makeAIMove - New Best Move: ${bestMove} to ${bestTarget} with score ${bestScore}`);
                }
            }
        }
    }
      console.log(`makeAIMove - Best Move: ${bestMove} to ${bestTarget} with score ${bestScore}`);
    if (bestMove !== null && bestTarget !== null) {

        if (boardState[bestMove] === 'red' && boardState[bestTarget] === null) {
            const canMove = isFlying || neighbors[bestMove].includes(parseInt(bestTarget));
            if (canMove) {
                 console.log(`makeAIMove - Applying Move: ${bestMove} to ${bestTarget}`);
                boardState[bestTarget] = 'red';
                boardState[bestMove] = null;
                updateBoardDisplay();
                 removeHighlights();
                  removeMillLines();
                 removeMillHighlight();

                  const formedMill = checkMill(bestTarget, 'red');
                if (formedMill) {
                    canRemovePiece = true;
                    updateMessage("Mill formed! " + currentPlayer.toUpperCase() + ", remove an opponent's piece.");
                    drawMillLine(formedMill);
                    highlightMillPieces(formedMill);
                    if (gameMode === 'ai') {
                        setTimeout(makeAIRemovePiece, 250);
                    }
                } else {
                     switchTurn();
                    if (!placingPhase) {
                      checkWinCondition();
                   }
               }
            } else {
                console.error(`makeAIMove - AI attempted an illegal move (not a neighbor) from ${bestMove} to ${bestTarget}.`);
                // Fallback: Make a random legal move
                makeRandomLegalMove();
            }
        } else {
            console.error(`makeAIMove - AI attempted an illegal move (source or target invalid) from ${bestMove} to ${bestTarget}.`);
            // Fallback: Make a random legal move
           makeRandomLegalMove();
        }
    } else {
        console.error("makeAIMove - AI could not find a valid move.");
        // Fallback: If no best move is found, try making a random legal move
        makeRandomLegalMove();
    }
}


function makeRandomLegalMove() {
    const aiPiecesIndices = boardState.reduce((acc, piece, index) => {
        if (piece === 'red') {
            acc.push(index);
        }
        return acc;
    }, []);

    const legalMoves = [];
    const isFlying = aiPiecesIndices.length === 3;

    for (const pieceIndex of aiPiecesIndices) {
        const possibleMoves = isFlying
            ? boardState.reduce((acc, piece, index) => piece === null ? [...acc, index] : acc, [])
            : neighbors[pieceIndex];

        for (const targetIndex of possibleMoves) {
            if (boardState[targetIndex] === null) {
                legalMoves.push([pieceIndex, targetIndex]);
            }
        }
    }

    if (legalMoves.length > 0) {
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        const bestMove = randomMove[0];
        const bestTarget = randomMove[1];

          if (boardState[bestMove] === 'red' && boardState[bestTarget] === null) {
            const canMove = isFlying || neighbors[bestMove].includes(parseInt(bestTarget));
            if (canMove) {
                 console.log(`makeRandomLegalMove - Applying Move: ${bestMove} to ${bestTarget}`);
                boardState[bestTarget] = 'red';
                boardState[bestMove] = null;
                updateBoardDisplay();
                  removeHighlights();
                  removeMillLines();
                 removeMillHighlight();

                  const formedMill = checkMill(bestTarget, 'red');
                if (formedMill) {
                    canRemovePiece = true;
                    updateMessage("Mill formed! " + currentPlayer.toUpperCase() + ", remove an opponent's piece.");
                    drawMillLine(formedMill);
                    highlightMillPieces(formedMill);
                    if (gameMode === 'ai') {
                        setTimeout(makeAIRemovePiece, 250);
                    }
                } else {
                     switchTurn();
                    if (!placingPhase) {
                      checkWinCondition();
                   }
               }
             } else {
                 console.error(`makeRandomLegalMove - AI attempted an illegal move (not a neighbor) from ${bestMove} to ${bestTarget}.`);

            }
           } else {
                 console.error(`makeRandomLegalMove - AI attempted an illegal move (source or target invalid) from ${bestMove} to ${bestTarget}.`);

          }
    } else {
        console.error("AI has no legal moves (this should ideally be handled by win condition check).");
    }
}


 function makeAIRemovePiece() {
        console.log(`makeAIRemovePiece() - currentPlayer: ${currentPlayer}`);
        const opponent = 'blue';
        const opponentPieces = boardState.reduce((acc, piece, index) => {
            if (piece === opponent) {
                acc.push(index);
            }
            return acc;
        }, []);

        if (opponentPieces.length > 0) {
            let pieceToRemoveIndex;
            switch (aiDifficulty) {
                case 'easy':
                    pieceToRemoveIndex = opponentPieces[Math.floor(Math.random() * opponentPieces.length)];
                    break;
                case 'medium':
                    const safeRemovals = opponentPieces.filter(index => !isPieceInMill(index, opponent));
                    pieceToRemoveIndex = safeRemovals.length > 0 ? safeRemovals[Math.floor(Math.random() * safeRemovals.length)] : opponentPieces[Math.floor(Math.random() * opponentPieces.length)];
                    break;
                case 'hard':
                    let bestEval = Infinity;
                    for (const index of opponentPieces) {
                        const tempBoardState = [...boardState];
                        tempBoardState[index] = null;
                        const eval = minimax(tempBoardState, 3, -Infinity, Infinity, true);
                        if (eval < bestEval) {
                            bestEval = eval;
                            pieceToRemoveIndex = index;
                        }
                    }
                    break;
            }

            if (pieceToRemoveIndex !== undefined && boardState[pieceToRemoveIndex] === opponent) {
                const canRemove = canOnlyRemoveFromMill(opponent) || !isPieceInMill(pieceToRemoveIndex, opponent);
                if (canRemove) {
                    console.log(`makeAIRemovePiece - Removing piece at index: ${pieceToRemoveIndex}`);
                      boardState[pieceToRemoveIndex] = null;
                        updateBoardDisplay();
                       canRemovePiece = false;
                      removeMillLines();
                     removeMillHighlight();
                     switchTurn();
                     if (!placingPhase) {
                         checkWinCondition();
                       }
                    if (gameMode === 'ai' && currentPlayer === 'red' && !placingPhase) {
                        setTimeout(makeNextAIMove, 500);
                    } else if (gameMode === 'ai' && currentPlayer === 'red' && placingPhase) {
                        setTimeout(makeNextAIMove, 500);
                    }

                } else {
                    console.error("AI attempted to remove a piece illegally (in a mill when other options exist).");
                    // Fallback: Remove a random opponent piece if allowed
                    if (canOnlyRemoveFromMill(opponent)) {
                        const randomOpponentPiece = opponentPieces[Math.floor(Math.random() * opponentPieces.length)];
                         console.log(`makeAIRemovePiece - Removing random piece at index: ${randomOpponentPiece}`);
                         boardState[randomOpponentPiece] = null;
                           updateBoardDisplay();
                           canRemovePiece = false;
                          removeMillLines();
                         removeMillHighlight();
                         switchTurn();
                           if (!placingPhase) {
                               checkWinCondition();
                           }
                         if (gameMode === 'ai' && currentPlayer === 'red' && !placingPhase) {
                             setTimeout(makeNextAIMove, 500);
                         } else if (gameMode === 'ai' && currentPlayer === 'red' && placingPhase) {
                              setTimeout(makeNextAIMove, 500);
                         }

                    } else {
                        console.error("AI could not find a legal piece to remove.");
                    }
                }
            } else {
                console.error("AI attempted to remove an invalid piece.");
                 // Fallback: Remove a random opponent piece if possible
                if (opponentPieces.length > 0) {
                    const randomOpponentPiece = opponentPieces[Math.floor(Math.random() * opponentPieces.length)];
                     console.log(`makeAIRemovePiece - Removing random piece at index(fallback): ${randomOpponentPiece}`);
                    boardState[randomOpponentPiece] = null;
                       updateBoardDisplay();
                       canRemovePiece = false;
                      removeMillLines();
                     removeMillHighlight();
                     switchTurn();
                       if (!placingPhase) {
                           checkWinCondition();
                       }
                       if (gameMode === 'ai' && currentPlayer === 'red' && !placingPhase) {
                           setTimeout(makeNextAIMove, 500);
                       } else if (gameMode === 'ai' && currentPlayer === 'red' && placingPhase) {
                           setTimeout(makeNextAIMove, 500);
                       }

                } else {
                    console.error("No opponent pieces to remove (should not happen).");
                }
            }
        } else {
            console.error("No opponent pieces available for removal, but removal was requested.");
        }
    }



function findBestPlaceMove(board, depth) {
    console.log("findBestPlaceMove - Depth:", depth, "board:", board);
    let bestScore = -Infinity;
    let bestMove = -1;

    const emptyPoints = board.reduce((acc, piece, index) => {
        if (piece === null) acc.push(index);
        return acc;
    }, []);

    for (const point of emptyPoints) {
        const tempBoard = [...board];
        tempBoard[point] = 'red';
        const score = minimaxPlace(tempBoard, depth - 1, -Infinity, Infinity, false);
          console.log(`findBestPlaceMove - Evaluating move ${point} Score:`, score);
        if (score > bestScore) {
            bestScore = score;
            bestMove = point;
        }
    }
      console.log("findBestPlaceMove - Best Move:", bestMove, "Best Score:", bestScore);
    return bestMove;
}

function minimaxPlace(board, depth, alpha, beta, isMaximizingPlayer) {
     console.log(`minimaxPlace - Depth: ${depth}, isMaximizingPlayer: ${isMaximizingPlayer}, Board:`, board);
    if (depth === 0 || checkWinCondition()) {
      const eval = evaluateBoard(board);
          console.log(`minimaxPlace - Depth: ${depth},  Evaluation: ${eval} (terminal)`);
        return eval;
    }

    const aiPlayer = 'red';
    const humanPlayer = 'blue';

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        const emptyPoints = board.reduce((acc, piece, index) => {
            if (piece === null) acc.push(index);
            return acc;
        }, []);
        for (const point of emptyPoints) {
            const tempBoard = [...board];
            tempBoard[point] = aiPlayer;
            const eval = minimaxPlace(tempBoard, depth - 1, alpha, beta, false);
             console.log(`minimaxPlace - Maximizing Player - Evaluating move ${point} at depth ${depth} Score:`, eval);
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
      console.log(`minimaxPlace - Maximizing Player, Depth ${depth}, returning MaxEval:`, maxEval);
        return maxEval;
    } else {
        let minEval = Infinity;
        const emptyPoints = board.reduce((acc, piece, index) => {
            if (piece === null) acc.push(index);
            return acc;
        }, []);
        for (const point of emptyPoints) {
            const tempBoard = [...board];
            tempBoard[point] = humanPlayer;
            const eval = minimaxPlace(tempBoard, depth - 1, alpha, beta, true);
             console.log(`minimaxPlace - Minimizing Player - Evaluating move ${point} at depth ${depth} Score:`, eval);
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
      console.log(`minimaxPlace - Minimizing Player, Depth ${depth}, returning MinEval:`, minEval);
        return minEval;
    }
}

function minimax(board, depth, alpha, beta, isMaximizingPlayer) {
    console.log(`minimax - Depth: ${depth}, isMaximizingPlayer: ${isMaximizingPlayer}, Board:`, board, "alpha:", alpha, "beta:", beta);
    if (depth === 0 || checkWinCondition()) {
        const eval = evaluateBoard(board);
        console.log(`minimax - Depth: ${depth},  Evaluation: ${eval} (terminal)`);
        return eval;
    }

    const aiPlayer = 'red';
    const humanPlayer = 'blue';

    const currentPlayerForMoveGen = isMaximizingPlayer ? aiPlayer : humanPlayer;
    const possibleMoves = getAllPossibleBoardStates(board, currentPlayerForMoveGen);

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const nextBoard of possibleMoves) {
           const eval = minimax(nextBoard, depth - 1, alpha, beta, false);
            console.log(`minimax - Maximizing Player - Depth ${depth},  Evaluating Board: `,nextBoard, "Score:", eval);
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) {
                console.log(`minimax - Maximizing Player - Depth ${depth} - Pruning: beta ${beta} <= alpha ${alpha}`);
                break;
            }
        }
         console.log(`minimax - Maximizing Player, Depth ${depth}, returning MaxEval:`, maxEval);
        return maxEval;
    }  else {
        let minEval = Infinity;
        for (const nextBoard of possibleMoves) {
            const eval = minimax(nextBoard, depth - 1, alpha, beta, true);
              console.log(`minimax - Minimizing Player - Depth ${depth}, Evaluating Board:`, nextBoard, "Score:", eval);
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
              if (beta <= alpha) {
                 console.log(`minimax - Minimizing Player - Depth ${depth} - Pruning: beta ${beta} <= alpha ${alpha}`);
                break;
             }
        }
         console.log(`minimax - Minimizing Player, Depth ${depth}, returning MinEval:`, minEval);
        return minEval;
    }
}

function getAllPossibleBoardStates(board, player) {
    const nextPossibleBoards = [];
     console.log(`getAllPossibleBoardStates - Player ${player}, Current Board:`, board);
    const playerPieces = board.reduce((acc, piece, index) => {
        if (piece === player) acc.push(index);
        return acc;
    }, []);
    const canMoveAnywhere = playerPieces.length === 3;
      console.log(`getAllPossibleBoardStates - Player Pieces:`, playerPieces, "Can Move Anywhere: ", canMoveAnywhere);

    for (const pieceIndex of playerPieces) {
        const possibleMoves = canMoveAnywhere ? board.reduce((acc, piece, index) => piece === null ? [...acc, index] : acc, []) : neighbors[pieceIndex];
        console.log(`getAllPossibleBoardStates - Piece at ${pieceIndex} has possible moves:`, possibleMoves);
        for (const targetIndex of possibleMoves) {
            if (board[targetIndex] === null) {
                const nextBoard = [...board];
                nextBoard[targetIndex] = player;
                nextBoard[pieceIndex] = null;
                 console.log(`getAllPossibleBoardStates - Move from ${pieceIndex} to ${targetIndex} - Next Board`, nextBoard);
                const potentialMill = checkMill(targetIndex, player);
                if (potentialMill) {
                    const opponent = player === 'red' ? 'blue' : 'red';
                    const opponentPieces = nextBoard.reduce((acc, piece, index) => piece === opponent ? [...acc, index] : acc, []);
                    const canOnlyRemoveFromMillOpponent = canOnlyRemoveFromMill(opponent);
                    console.log(`getAllPossibleBoardStates - Mill Formed - Pieces: `, opponentPieces, "Can Only Remove From Mill:", canOnlyRemoveFromMillOpponent );
                    opponentPieces.forEach(removeIndex => {
                        if (canOnlyRemoveFromMillOpponent || !isPieceInMill(removeIndex, opponent)) {
                            const boardAfterRemoval = [...nextBoard];
                            boardAfterRemoval[removeIndex] = null;
                            nextPossibleBoards.push(boardAfterRemoval);
                               console.log(`getAllPossibleBoardStates - Move from ${pieceIndex} to ${targetIndex} with removal at ${removeIndex} - boardAfterRemoval:`, boardAfterRemoval);

                        }
                    });
                     if (opponentPieces.length === 0 || canOnlyRemoveFromMillOpponent) {
                       nextPossibleBoards.push(nextBoard);
                        console.log(`getAllPossibleBoardStates - Mill Formed - No Remove or Can Only Remove From Mill - Added nextBoard:`, nextBoard);

                    }
                } else {
                    nextPossibleBoards.push(nextBoard);
                     console.log(`getAllPossibleBoardStates - No Mill Formed - Added nextBoard:`, nextBoard);
                }
            }
        }
    }
    return nextPossibleBoards;
}

// Event Listeners
resetButton.addEventListener('click', resetGame);

// Initial setup
createPoints();
updateMessage(currentPlayer.toUpperCase() + "'s turn to place piece.");
