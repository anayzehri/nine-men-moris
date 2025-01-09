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

function makeNextAIMove() {
    console.log(`makeNextAIMove() - placingPhase: ${placingPhase}, canRemovePiece: ${canRemovePiece}, currentPlayer: ${currentPlayer}`);

    if (gameMode === 'ai' && currentPlayer === 'red') {
       if (placingPhase) {
          makeAIPlacePiece(boardState); // Pass boardState
        } else if (canRemovePiece) {
          setTimeout(makeAIRemovePiece, 250);
        }
       else {
          makeAIMove();
       }
    } else {
        console.log(`makeNextAIMove - AI should not play. currentPlayer: ${currentPlayer}, gameMode: ${gameMode}`);
    }
}


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


function makeAIPlacePiece(board) {
    console.log(`makeAIPlacePiece() - currentPlayer: ${currentPlayer}`);
    const emptyPoints = board.reduce((acc, piece, index) => {
        if (piece === null) {
            acc.push(index);
        }
        return acc;
    }, []);

    if (emptyPoints.length > 0) {
        let bestMove;
        switch (aiDifficulty) {
            case 'easy':
                bestMove = emptyPoints[Math.floor(Math.random() * emptyPoints.length)];
                break;
            case 'medium':
                let bestScoreMedium = -Infinity;
                 for (const point of emptyPoints) {
                    // Simulate the placement and evaluate
                    const tempBoardState = [...board]; // Use a copy
                    tempBoardState[point] = 'red';
                    const score = evaluateBoard(tempBoardState); // Pass the copied board state
                    if (score > bestScoreMedium) {
                        bestScoreMedium = score;
                        bestMove = point;
                    }
                }
                break;
            case 'hard':
                bestMove = findBestPlaceMove(board, 4);
                break;
        }

        if (bestMove !== undefined && board[bestMove] === null) {
            console.log(`AI Placing piece at ${bestMove}`);
            handlePlacement(bestMove);
        } else {
            console.error("AI attempted an illegal placement or no valid move found.");
            // Fallback: Choose a random empty spot if something went wrong
            if (emptyPoints.length > 0) {
                const randomMove = emptyPoints[Math.floor(Math.random() * emptyPoints.length)];
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
    console.log(`makeAIMove() - currentPlayer
