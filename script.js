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
const localTheme = localStorage.getItem('theme')

if (localTheme === 'dark') {
    container.classList.add('dark-theme')
    themeToggle.innerHTML = '☀️';
} else {
    themeToggle.innerHTML = '🌙'
}
themeToggle.addEventListener('click', () => {
    container.classList.toggle('dark-theme');
    if (container.classList.contains('dark-theme')) {
        localStorage.setItem('theme', 'dark')
        themeToggle.innerHTML = '☀️';
    } else {
        localStorage.setItem('theme', 'light')
        themeToggle.innerHTML = '🌙';
    }
});
const gameBoard = document.querySelector('.game-board');
const pointsContainer = document.querySelector('.points');
const messageDiv = document.querySelector('.message');
const blackScoreSpan = document.getElementById('black-score');
const whiteScoreSpan = document.getElementById('white-score');
const resetButton = document.getElementById('reset-button');
const aiLevelSelect = document.getElementById('ai-level'); // Get the AI level select element

let boardState = Array(24).fill(null);
let currentPlayer = 'black';
let blackPiecesLeft = 9;
let whitePiecesLeft = 9;
let placingPhase = true;
let selectedPieceIndex = null;
let canRemovePiece = false; // NEW: Flag to indicate if a piece can be removed
let aiLevel = 'easy'; // Default AI level

function createPoints() {
    pointsData.forEach((point, index) => {
        const pointDiv = document.createElement('div');
        pointDiv.classList.add('point');
        pointDiv.style.left = `${point.x}%`;
        pointDiv.style.top = `${point.y}%`;
        pointDiv.dataset.index = index;
        pointDiv.addEventListener('click', handlePointClick);
        pointsContainer.appendChild(pointDiv);
        updatePointVisualState(pointDiv, null);
    });
}

function updatePointVisualState(pointDiv, player) {
    pointDiv.classList.remove('empty', 'black', 'white');
    if (player === 'black') {
        pointDiv.classList.add('black');
    } else if (player === 'white') {
        pointDiv.classList.add('white');
    } else {
        pointDiv.classList.add('empty');
    }
}

function handlePointClick(event) {
    const pointIndex = parseInt(event?.target?.dataset?.index);

    if (canRemovePiece) {
        removeOpponentPiece(pointIndex);
        return;
    }

    if (currentPlayer === 'black') {
        if (placingPhase) {
            handlePlacement(pointIndex);
        } else {
            handleMovement(pointIndex);
        }
    }
}


function handlePlacement(pointIndex) {
    if (boardState[pointIndex] === null) {
        boardState[pointIndex] = currentPlayer;
        const pointDiv = document.querySelector(`.point[data-index="${pointIndex}"]`);
        updatePointVisualState(pointDiv, currentPlayer);

        if (currentPlayer === 'black') {
            blackPiecesLeft--;
            blackScoreSpan.textContent = blackPiecesLeft;
        } else {
            whitePiecesLeft--;
            whiteScoreSpan.textContent = whitePiecesLeft;
        }

        const formedMill = checkMill(pointIndex, currentPlayer);
        if (formedMill) {
            canRemovePiece = true;
            updateMessage("Mill formed! " + currentPlayer.toUpperCase() + ", remove an opponent's piece.");
            drawMillLine(formedMill);
            highlightMillPieces(formedMill);
        } else {
            switchTurn();
        }

        if (blackPiecesLeft === 0 && whitePiecesLeft === 0) {
            placingPhase = false;
            updateMessage(currentPlayer.toUpperCase() + "'s turn to move.");
        }
        if (currentPlayer === 'white' && !placingPhase) {
            aiMove(); // Make AI move immediately
        }
    }
}

function handleMovement(targetIndex) {
    if (selectedPieceIndex !== null) {
        if (boardState[targetIndex] === null && neighbors[selectedPieceIndex].includes(parseInt(targetIndex))) {
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
    if (currentPlayer === 'white' && !placingPhase) {
        aiMove(); // Make AI move immediately
    }
}


function highlightMoves(pieceIndex) {
    removeHighlights();
    const pointDiv = document.querySelector(`.point[data-index="${pieceIndex}"]`);
    if (pointDiv) {
        pointDiv.classList.add('highlight');
    }
    const neighborsOfPiece = neighbors[pieceIndex];
    if (neighborsOfPiece) {
        neighborsOfPiece.forEach(neighborIndex => {
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
    document.querySelectorAll('.point').forEach(point => point.classList.remove('highlight'));
}

function checkMill(pointIndex, player) {
    for (const mill of mills) {
        if (mill.includes(pointIndex)) {
            const [a, b, c] = mill;
            if (boardState[a] === player && boardState[b] === player && boardState[c] === player) {
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
    const opponent = currentPlayer === 'black' ? 'white' : 'black';
    if (boardState[pointIndex] === opponent && !isPieceInMill(pointIndex, opponent)) {
        boardState[pointIndex] = null;
        updateBoardDisplay();
        canRemovePiece = false;
        removeMillLines();
        removeMillHighlight();
        switchTurn();
        if (!placingPhase) {
            checkWinCondition();
        }
    } else if (boardState[pointIndex] === opponent && canOnlyRemoveFromMill(opponent)) {
        boardState[pointIndex] = null;
        updateBoardDisplay();
        canRemovePiece = false;
        removeMillLines();
        removeMillHighlight();
        switchTurn();
        if (!placingPhase) {
            checkWinCondition();
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
    const opponentPieces = boardState.reduce((count, piece) => count + (piece === player ? 1 : 0), 0);
    if (opponentPieces <= 3) return true;

    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === player && !isPieceInMill(i, player)) {
            return false;
        }
    }
    return true;
}

function switchTurn() {
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    updateMessage(currentPlayer.toUpperCase() + "'s turn.");
    removeMillHighlight();
    updateTurnIndicator();
    if (currentPlayer === 'white' && !placingPhase) {
        aiMove(); // Make AI move immediately
    }
}

function updateTurnIndicator() {
    if (currentPlayer === 'black') {
        blackScoreSpan.parentElement.classList.add('current-turn');
        whiteScoreSpan.parentElement.classList.remove('current-turn');
    } else {
        whiteScoreSpan.parentElement.classList.add('current-turn');
        blackScoreSpan.parentElement.classList.remove('current-turn');
    }
}

updateTurnIndicator();

function updateMessage(message) {
    messageDiv.textContent = message;
}

function updateBoardDisplay() {
    document.querySelectorAll('.point').forEach((pointDiv, index) => {
        updatePointVisualState(pointDiv, boardState[index]);
        pointDiv.classList.remove('highlight', 'mill-highlight');
    });
    if (!placingPhase) {
        checkWinCondition();
    }
}

function hasLegalMoves(player) {
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === player) {
            const neighborsOfPiece = neighbors[i];
            if (neighborsOfPiece) {
                for (const neighborIndex of neighborsOfPiece) {
                    if (boardState[neighborIndex] === null) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function checkWinCondition() {
    const blackPieces = boardState.filter(piece => piece === 'black').length;
    const whitePieces = boardState.filter(piece => piece === 'white').length;

    if (whitePieces < 3) {
        updateMessage("Black wins!");
        return true;
    }

    if (blackPieces < 3) {
        updateMessage("White wins!");
        return true;
    }

    if (!placingPhase) {
        if (currentPlayer === 'black' && !hasLegalMoves('black')) {
            updateMessage("White wins! Black cannot move.");
            return true;
        }
        if (currentPlayer === 'white' && !hasLegalMoves('white')) {
            updateMessage("Black wins! White cannot move.");
            return true;
        }
    }
    return false;
}

function resetGame() {
    boardState = Array(24).fill(null);
    currentPlayer = 'black';
    blackPiecesLeft = 9;
    whitePiecesLeft = 9;
    placingPhase = true;
    selectedPieceIndex = null;
    canRemovePiece = false;

    updateBoardDisplay();
    updateMessage(currentPlayer.toUpperCase() + "'s turn to place piece.");
    blackScoreSpan.textContent = blackPiecesLeft;
    whiteScoreSpan.textContent = whitePiecesLeft;
    removeHighlights();
    removeMillLines();
    removeMillHighlight();
}


// AI Logic
function aiMove() {
    if (canRemovePiece) {
        aiRemovePiece();
    } else if (placingPhase) {
        aiPlacePiece();
    } else {
        aiMovePiece();
    }
}


function aiPlacePiece() {
    let bestMove = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === null) {
            boardState[i] = 'white'
            let score = calculateMoveScore('white');
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
            boardState[i] = null;
        }
    }
    if (bestMove !== -1) {
        handlePlacement(bestMove);
    }
}


function aiMovePiece() {
    let bestMove = null;
    let bestScore = -Infinity;

    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === 'white') {
            const moves = neighbors[i];
            for (const target of moves) {
                if (boardState[target] === null) {
                    boardState[target] = 'white';
                    boardState[i] = null;
                    let score = calculateMoveScore('white');
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { from: i, to: target };
                    }
                    boardState[target] = null;
                    boardState[i] = 'white';
                }
            }
        }
    }
    if (bestMove) {
        selectedPieceIndex = bestMove.from;
        handleMovement(bestMove.to);
    }
}


function aiRemovePiece() {
    let bestRemove = -1;
    let bestScore = -Infinity
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === 'black' && !isPieceInMill(i, 'black')) {
            boardState[i] = null;
            let score = calculateRemoveScore('white');
            if (score > bestScore) {
                bestScore = score;
                bestRemove = i;
            }
            boardState[i] = 'black'
        }
    }
    if (bestRemove === -1) {
        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === 'black') {
                bestRemove = i;
                break;
            }
        }
    }
    removeOpponentPiece(bestRemove);
}

function calculateMoveScore(player) {
    let score = 0;
    const opponent = player === 'black' ? 'white' : 'black';
    if (aiLevel === 'easy') {
        return Math.random() - 0.5;
    }
    if (aiLevel === 'medium') {
        for (const mill of mills) {
            const [a, b, c] = mill;
            let playerPieces = 0;
            let opponentPieces = 0;

            if (boardState[a] === player) playerPieces++;
            if (boardState[b] === player) playerPieces++;
            if (boardState[c] === player) playerPieces++;

            if (boardState[a] === opponent) opponentPieces++;
            if (boardState[b] === opponent) opponentPieces++;
            if (boardState[c] === opponent) opponentPieces++;

            if (playerPieces === 2 && !opponentPieces) score += 5; // potential mill
            if (playerPieces === 3) score += 15; //complete mill
            if (opponentPieces === 2 && !playerPieces) score -= 10; // Prevent opponent mill
        }
        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === player && hasLegalMoves(player)) {
                score += 1;
            }
        }
        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === player) {
                const moves = neighbors[i];
                for (const target of moves) {
                    if (boardState[target] === null) {
                        score += 2
                        boardState[target] = player;
                        if (checkMill(target, player)) {
                            score += 10
                        }
                        boardState[target] = null
                    }
                }
            }
        }
        return score + Math.random() * 2 - 1;
    }

    if (aiLevel === 'hard') {
        for (const mill of mills) {
            const [a, b, c] = mill;
            let playerPieces = 0;
            let opponentPieces = 0;

            if (boardState[a] === player) playerPieces++;
            if (boardState[b] === player) playerPieces++;
            if (boardState[c] === player) playerPieces++;

            if (boardState[a] === opponent) opponentPieces++;
            if (boardState[b] === opponent) opponentPieces++;
            if (boardState[c] === opponent) opponentPieces++;

            if (playerPieces === 2 && !opponentPieces) score += 10; // potential mill
            if (playerPieces === 3) score += 30; //complete mill
            if (opponentPieces === 2 && !playerPieces) score -= 20; // Prevent opponent mill
        }

        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === player && hasLegalMoves(player)) {
                score += 2;
            }
        }

        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === player) {
                const moves = neighbors[i];
                for (const target of moves) {
                    if (boardState[target] === null) {
                        score += 3
                        boardState[target] = player;
                        if (checkMill(target, player)) {
                            score += 20
                        }
                        boardState[target] = null
                    }
                }
            }
        }
        return score
    }
    return 0;
}

function calculateRemoveScore(player) {
    let score = 0;
    const opponent = player === 'black' ? 'white' : 'black';
    if (aiLevel === 'easy') {
        return Math.random() - 0.5;
    }
    if (aiLevel === 'medium') {
        for (const mill of mills) {
            const [a, b, c] = mill;
            let playerPieces = 0;
            let opponentPieces = 0;

            if (boardState[a] === player) playerPieces++;
            if (boardState[b] === player) playerPieces++;
            if (boardState[c] === player) playerPieces++;

            if (boardState[a] === opponent) opponentPieces++;
            if (boardState[b] === opponent) opponentPieces++;
            if (boardState[c] === opponent) opponentPieces++;
            if (opponentPieces === 2 && !playerPieces) score += 10; // Prevent opponent mill
        }
        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === opponent) {
                score += 2;
                if (isPieceInMill(i, opponent)) {
                    score -= 2;
                }
            }
        }
        return score + Math.random() * 2 - 1;
    }
    if (aiLevel === 'hard') {
        for (const mill of mills) {
            const [a, b, c] = mill;
            let playerPieces = 0;
            let opponentPieces = 0;

            if (boardState[a] === player) playerPieces++;
            if (boardState[b] === player) playerPieces++;
            if (boardState[c] === player) playerPieces++;

            if (boardState[a] === opponent) opponentPieces++;
            if (boardState[b] === opponent) opponentPieces++;
            if (boardState[c] === opponent) opponentPieces++;
            if (opponentPieces === 2 && !playerPieces) score += 20; // Prevent opponent mill
        }
        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === opponent) {
                score += 5;
                if (isPieceInMill(i, opponent)) {
                    score -= 3;
                }
            }
        }
        return score;
    }
    return 0;
}
// Event Listeners
resetButton.addEventListener('click', resetGame);
aiLevelSelect.addEventListener('change', (event) => {
    aiLevel = event.target.value;
});

// Initial setup
createPoints();
updateMessage(currentPlayer.toUpperCase() + "'s turn to place piece.");
