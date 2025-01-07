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

if(localTheme === 'dark') {
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

let boardState = Array(24).fill(null);
let currentPlayer = 'black';
let blackPiecesLeft = 9;
let whitePiecesLeft = 9;
let placingPhase = true;
let selectedPieceIndex = null;
let canRemovePiece = false; // NEW: Flag to indicate if a piece can be removed

function createPoints() {
    pointsData.forEach((point, index) => {
        const pointDiv = document.createElement('div');
        pointDiv.classList.add('point'); // Removed 'empty' class here
        pointDiv.style.left = `${point.x}%`;
        pointDiv.style.top = `${point.y}%`;
        pointDiv.dataset.index = index;
        pointDiv.addEventListener('click', handlePointClick);
        pointsContainer.appendChild(pointDiv);
        updatePointVisualState(pointDiv, null); // Set initial visual state
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

        if (currentPlayer === 'black') {
            blackPiecesLeft--;
            blackScoreSpan.textContent = blackPiecesLeft;
        } else {
            whitePiecesLeft--;
            whiteScoreSpan.textContent = whitePiecesLeft;
        }

        const formedMill = checkMill(pointIndex, currentPlayer);
        if (formedMill) {
            canRemovePiece = true; // Set the flag to allow removal
            updateMessage("Mill formed! " + currentPlayer.toUpperCase() + ", remove an opponent's piece.");
            drawMillLine(formedMill); // Draw the green line
            highlightMillPieces(formedMill); // Highlight the pieces forming the mill
        } else {
            switchTurn();
        }

        if (blackPiecesLeft === 0 && whitePiecesLeft === 0) {
            placingPhase = false;
            updateMessage(currentPlayer.toUpperCase() + "'s turn to move.");
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
            removeMillHighlight(); // Remove previous mill highlight

            const formedMill = checkMill(targetIndex, currentPlayer);
            if (formedMill) {
                canRemovePiece = true;
                updateMessage("Mill formed! " + currentPlayer.toUpperCase() + ", remove an opponent's piece.");
                drawMillLine(formedMill);
                highlightMillPieces(formedMill); // Highlight the pieces forming the mill
            } else {
                switchTurn();
                if (!placingPhase) { // Only check win condition after placing phase
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
                return mill; // Return the indices of the mill
            }
        }
    }
    return null; // Return null if no mill is formed
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
    pointsContainer.appendChild(line); // Append to the points container

    if (Math.abs(centerY1 - centerY2) < 1 && Math.abs(centerY2 - centerY3) < 1) { // Horizontal
        line.style.width = `${Math.max(centerX1, centerX2, centerX3) - Math.min(centerX1, centerX2, centerX3)}px`;
        line.style.top = `${centerY1 - 3}px`; // Adjust for line thickness
        line.style.left = `${Math.min(centerX1, centerX2, centerX3)}px`;
    } else if (Math.abs(centerX1 - centerX2) < 1 && Math.abs(centerX2 - centerX3) < 1) { // Vertical
        line.style.height = `${Math.max(centerY1, centerY2, centerY3) - Math.min(centerY1, centerY2, centerY3)}px`;
        line.style.left = `${centerX1 - 3}px`; // Adjust for line thickness
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
    console.log("removeOpponentPiece - Before removal:", boardState); // ADD THIS LINE
    if (boardState[pointIndex] === opponent && !isPieceInMill(pointIndex, opponent)) {
        boardState[pointIndex] = null;
        updateBoardDisplay();
        canRemovePiece = false; // Reset the flag after removal
        removeMillLines(); // Remove mill line after removing a piece
        removeMillHighlight(); // Remove the mill highlight after removal
        switchTurn();
        if (!placingPhase) { // Only check win condition after placing phase
            checkWinCondition();
        }
    } else if (boardState[pointIndex] === opponent && canOnlyRemoveFromMill(opponent)) {
        boardState[pointIndex] = null;
        updateBoardDisplay();
        canRemovePiece = false; // Reset the flag after removal
        removeMillLines(); // Remove mill line after removing a piece
        removeMillHighlight(); // Remove the mill highlight after removal
        switchTurn();
        if (!placingPhase) { // Only check win condition after placing phase
            checkWinCondition();
        }
    } else {
        updateMessage("Invalid removal. Choose an opponent's piece not in a mill (unless all their pieces are in mills).");
    }
    console.log("removeOpponentPiece - After removal:", boardState); // ADD THIS LINE
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
    removeMillHighlight(); // Remove mill highlight when the turn changes without a mill
    updateTurnIndicator();
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

// Call updateTurnIndicator initially
updateTurnIndicator();

function updateMessage(message) {
    messageDiv.textContent = message;
}

function updateBoardDisplay() {
    document.querySelectorAll('.point').forEach((pointDiv, index) => {
        updatePointVisualState(pointDiv, boardState[index]);
        pointDiv.classList.remove('highlight', 'mill-highlight'); // Remove these here for clarity
    });
    console.log("Before checkWinCondition - Board State:", boardState); // ADD THIS LINE
    if (!placingPhase) { // Only check win condition after placing phase
        checkWinCondition();
    }
}

function hasLegalMoves(player) {
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === player) {
            // Check if this piece has any empty neighbors
            const neighborsOfPiece = neighbors[i];
            if (neighborsOfPiece) {
                for (const neighborIndex of neighborsOfPiece) {
                    if (boardState[neighborIndex] === null) {
                        return true; // Found a legal move
                    }
                }
            }
        }
    }
    return false; // No legal moves found for this player
}

function checkWinCondition() {
    const blackPieces = boardState.filter(piece => piece === 'black').length;
    const whitePieces = boardState.filter(piece => piece === 'white').length;

    if (whitePieces < 3) {
        updateMessage("Black wins!");
        return true; // Indicate game over
    }

    if (blackPieces < 3) {
        updateMessage("White wins!");
        return true; // Indicate game over
    }

    if (!placingPhase) {
        if (currentPlayer === 'black' && !hasLegalMoves('black')) {
            updateMessage("White wins! Black cannot move.");
            return true; // Indicate game over
        }
        if (currentPlayer === 'white' && !hasLegalMoves('white')) {
            updateMessage("Black wins! White cannot move.");
            return true; // Indicate game over
        }
    }
    return false; // No win condition met yet
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
    removeMillHighlight(); // Ensure mill highlight is removed on reset
}

// Event Listeners
resetButton.addEventListener('click', resetGame);

// Initial setup
createPoints();
updateMessage(currentPlayer.toUpperCase() + "'s turn to place piece.");