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
const aiLevelSelect = document.getElementById('ai-level');

let boardState = Array(24).fill(null);
let currentPlayer = 'black';
let blackPiecesLeft = 9;
let whitePiecesLeft = 9;
let placingPhase = true;
let selectedPieceIndex = null;
let canRemovePiece = false;
let aiEnabled = false;

function createPoints() {
    pointsData.forEach((point, index) => {
        const pointDiv = document.createElement('div');
        pointDiv.classList.add('point', 'empty');
        pointDiv.style.left = `${point.x}%`;
        pointDiv.style.top = `${point.y}%`;
        pointDiv.dataset.index = index;
        pointDiv.addEventListener('click', handlePointClick);
        pointsContainer.appendChild(pointDiv);
    });
}

function updatePointVisualState(pointIndex, player) {
    const pointDiv = document.querySelector(`.point[data-index="${pointIndex}"]`);
    if (pointDiv) {
        pointDiv.classList.remove('empty', 'black', 'white');
        if (player === 'black') {
            pointDiv.classList.add('black');
        } else if (player === 'white') {
            pointDiv.classList.add('white');
        } else {
            pointDiv.classList.add('empty');
        }
    }
}

function handlePointClick(event) {
    if (aiEnabled && currentPlayer === 'white') return; // Disable human input during AI turn

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
        updatePointVisualState(pointIndex, currentPlayer);

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
    if (boardState[pointIndex] === opponent && (!isPieceInMill(pointIndex, opponent) || canOnlyRemoveFromMill(opponent))) {
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

    if (aiEnabled && currentPlayer === 'white') {
        setTimeout(makeAiMove, 500); // Add a delay for AI move
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
        updatePointVisualState(index, boardState[index]);
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
            if (blackPiecesLeft + whitePiecesLeft === 0) return true; // If flying is allowed
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
        if (currentPlayer === 'black' && !canMove('black')) {
            updateMessage("White wins! Black cannot move.");
            return true;
        }
        if (currentPlayer === 'white' && !canMove('white')) {
            updateMessage("Black wins! White cannot move.");
            return true;
        }
    }
    return false;
}

function canMove(player) {
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === player) {
            if (blackPiecesLeft + whitePiecesLeft === 0) { // Flying phase
                for (let j = 0; j < boardState.length; j++) {
                    if (boardState[j] === null) return true;
                }
            } else {
                const legalMoves = neighbors[i];
                if (legalMoves) {
                    for (const move of legalMoves) {
                        if (boardState[move] === null) return true;
                    }
                }
            }
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
    aiEnabled = aiLevelSelect.value !== 'off';

    updateBoardDisplay();
    updateMessage(currentPlayer.toUpperCase() + "'s turn to place piece.");
    blackScoreSpan.textContent = blackPiecesLeft;
    whiteScoreSpan.textContent = whitePiecesLeft;
    removeHighlights();
    removeMillLines();
    removeMillHighlight();
    updateTurnIndicator();

    if (aiEnabled && currentPlayer === 'white') {
        setTimeout(makeAiMove, 500);
    }
}

// AI Logic
function makeAiMove() {
    const level = aiLevelSelect.value;
    switch (level) {
        case 'easy':
            makeEasyAiMove();
            break;
        case 'medium':
            makeMediumAiMove();
            break;
        case 'hard':
            makeHardAiMove();
            break;
    }
}

function makeEasyAiMove() {
    if (canRemovePiece) {
        const opponentPieces = boardState.reduce((acc, piece, index) => {
            if (piece === 'black') acc.push(index);
            return acc;
        }, []);
        if (opponentPieces.length > 0) {
            const randomIndex = Math.floor(Math.random() * opponentPieces.length);
            removeOpponentPiece(opponentPieces[randomIndex]);
        }
        return;
    }

    if (placingPhase) {
        const emptySpots = boardState.reduce((acc, piece, index) => {
            if (piece === null) acc.push(index);
            return acc;
        }, []);
        if (emptySpots.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptySpots.length);
            handlePlacement(emptySpots[randomIndex]);
        }
    } else {
        const aiPieces = boardState.reduce((acc, piece, index) => {
            if (piece === 'white') acc.push(index);
            return acc;
        }, []);
        if (aiPieces.length > 0) {
            const randomPieceIndex = aiPieces[Math.floor(Math.random() * aiPieces.length)];
            const possibleMoves = neighbors[randomPieceIndex].filter(index => boardState[index] === null);
            if (possibleMoves.length > 0) {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                selectedPieceIndex = randomPieceIndex;
                handleMovement(randomMove);
            }
        }
    }
}

function makeMediumAiMove() {
    // Try to form a mill
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === null) {
            boardState[i] = 'white';
            if (checkMill(i, 'white')) {
                boardState[i] = null;
                handlePlacement(i);
                return;
            }
            boardState[i] = null;
        }
    }

    // Try to block opponent's mill
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] === null) {
            boardState[i] = 'black';
            if (checkMill(i, 'black')) {
                boardState[i] = null;
                handlePlacement(i);
                return;
            }
            boardState[i] = null;
        }
    }

    // Remove opponent piece if can form mill
    if (canRemovePiece) {
        const removablePieces = boardState.reduce((acc, piece, index) => {
            if (piece === 'black' && !isPieceInMill(index, 'black')) acc.push(index);
            return acc;
        }, []);
        if (removablePieces.length > 0) {
            const randomIndex = Math.floor(Math.random() * removablePieces.length);
            removeOpponentPiece(removablePieces[randomIndex]);
            return;
        } else {
            const opponentPieces = boardState.reduce((acc, piece, index) => {
                if (piece === 'black') acc.push(index);
                return acc;
            }, []);
            if (opponentPieces.length > 0) {
                const randomIndex = Math.floor(Math.random() * opponentPieces.length);
                removeOpponentPiece(opponentPieces[randomIndex]);
                return;
            }
        }
    }

    // If placing, place randomly
    if (placingPhase) {
        const emptySpots = boardState.reduce((acc, piece, index) => {
            if (piece === null) acc.push(index);
            return acc;
        }, []);
        if (emptySpots.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptySpots.length);
            handlePlacement(emptySpots[randomIndex]);
        }
    } else {
        // Move randomly
        const aiPieces = boardState.reduce((acc, piece, index) => {
            if (piece === 'white') acc.push(index);
            return acc;
        }, []);
        if (aiPieces.length > 0) {
            const randomPieceIndex = aiPieces[Math.floor(Math.random() * aiPieces.length)];
            const possibleMoves = neighbors[randomPieceIndex].filter(index => boardState[index] === null);
            if (possibleMoves.length > 0) {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                selectedPieceIndex = randomPieceIndex;
                handleMovement(randomMove);
            }
        }
    }
}

function makeHardAiMove() {
    if (canRemovePiece) {
        const bestRemoval = findBestRemovalMove(boardState);
        if (bestRemoval !== -1) {
            removeOpponentPiece(bestRemoval);
            return;
        }
    }

    if (placingPhase) {
        const bestPlacement = findBestPlacementMove(boardState);
        if (bestPlacement !== -1) {
            handlePlacement(bestPlacement);
        }
    } else {
        const bestMove = findBestMove(boardState);
        if (bestMove) {
            selectedPieceIndex = bestMove.from;
            handleMovement(bestMove.to);
        }
    }
}

// Minimax implementation for Hard AI
function findBestPlacementMove(currentBoard) {
    let bestScore = -Infinity;
    let bestMove = -1;
    const emptySpots = currentBoard.reduce((acc, piece, index) => {
        if (piece === null) acc.push(index);
        return acc;
    }, []);

    for (const spot of emptySpots) {
        const newBoardState = [...currentBoard];
        newBoardState[spot] = 'white';
        let score = evaluateBoard(newBoardState, 'white', false); // Simple evaluation for placement
        if (score > bestScore) {
            bestScore = score;
            bestMove = spot;
        }
    }
    return bestMove;
}

function findBestRemovalMove(currentBoard) {
    let bestScore = -Infinity;
    let bestMove = -1;
    const opponentPieces = currentBoard.reduce((acc, piece, index) => {
        if (piece === 'black' && !isPieceInMill(index, 'black')) acc.push(index);
        return acc;
    }, []);

    if (opponentPieces.length === 0) {
        const allOpponentPieces = currentBoard.reduce((acc, piece, index) => {
            if (piece === 'black') acc.push(index);
            return acc;
        }, []);
        if (allOpponentPieces.length > 0) return allOpponentPieces[0];
        return -1;
    }

    for (const pieceIndex of opponentPieces) {
        const newBoardState = [...currentBoard];
        newBoardState[pieceIndex] = null;
        let score = evaluateBoard(newBoardState, 'white', false); // Simple evaluation after removal
        if (score > bestScore) {
            bestScore = score;
            bestMove = pieceIndex;
        }
    }
    return bestMove;
}

function findBestMove(currentBoard) {
    let bestScore = -Infinity;
    let bestMove = null;
    const aiPieces = currentBoard.reduce((acc, piece, index) => {
        if (piece === 'white') acc.push(index);
        return acc;
    }, []);

    for (const pieceIndex of aiPieces) {
        const possibleMoves = neighbors[pieceIndex].filter(index => currentBoard[index] === null);
        for (const moveTo of possibleMoves) {
            const newBoardState = [...currentBoard];
            newBoardState[moveTo] = 'white';
            newBoardState[pieceIndex] = null;
            let score = minimax(newBoardState, 3, false); // Depth 3 search
            if (score > bestScore) {
                bestScore = score;
                bestMove = { from: pieceIndex, to: moveTo };
            }
        }
    }
    return bestMove;
}

function minimax(board, depth, isMaximizingPlayer) {
    if (depth === 0 || checkTerminal(board)) {
        return evaluateBoard(board, 'white', true);
    }

    if (isMaximizingPlayer) {
        let bestScore = -Infinity;
        const aiPieces = board.reduce((acc, piece, index) => {
            if (piece === 'white') acc.push(index);
            return acc;
        }, []);
        for (const pieceIndex of aiPieces) {
            const possibleMoves = neighbors[pieceIndex].filter(index => board[index] === null);
            for (const moveTo of possibleMoves) {
                const newBoardState = [...board];
                newBoardState[moveTo] = 'white';
                newBoardState[pieceIndex] = null;
                bestScore = Math.max(bestScore, minimax(newBoardState, depth - 1, false));
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        const humanPieces = board.reduce((acc, piece, index) => {
            if (piece === 'black') acc.push(index);
            return acc;
        }, []);
        for (const pieceIndex of humanPieces) {
            const possibleMoves = neighbors[pieceIndex].filter(index => board[index] === null);
            for (const moveTo of possibleMoves) {
                const newBoardState = [...board];
                newBoardState[moveTo] = 'black';
                newBoardState[pieceIndex] = null;
                bestScore = Math.min(bestScore, minimax(newBoardState, depth - 1, true));
            }
        }
        return bestScore;
    }
}

function evaluateBoard(board, player, includeGameState) {
    let score = 0;
    const aiPieces = board.filter(p => p === 'white').length;
    const humanPieces = board.filter(p => p === 'black').length;

    score += (aiPieces - humanPieces) * 10;

    for (const mill of mills) {
        const [a, b, c] = mill;
        if (board[a] === player && board[b] === player && board[c] === player) {
            score += 50; // Reward forming a mill
        } else if (board[a] !== 'black' && board[b] !== 'black' && board[c] !== 'black') {
            //Potentially reward open mills for future moves
        }
    }
    if (includeGameState) {
        if (aiPieces < 3) score = -Infinity;
        if (humanPieces < 3) score = Infinity;
        if (!canMove('white') && aiPieces > 3) score = -Infinity;
        if (!canMove('black') && humanPieces > 3) score = Infinity;
    }

    return score;
}

function checkTerminal(board) {
    const whitePieces = board.filter(piece => piece === 'white').length;
    const blackPieces = board.filter(piece => piece === 'black').length;

    if (whitePieces < 3 || blackPieces < 3) return true;
    if (!canMove('white') || !canMove('black')) return true;

    return false;
}

// Event Listeners
resetButton.addEventListener('click', resetGame);
aiLevelSelect.addEventListener('change', () => {
    aiEnabled = aiLevelSelect.value !== 'off';
    resetGame(); // Reset the game when AI level changes
});

// Initial setup
createPoints();
updateMessage(currentPlayer.toUpperCase() + "'s turn to place piece.");
