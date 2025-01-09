// ai.js

// Data structures and constants needed for AI logic
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

// AI Logic
export function evaluateBoard(board, maximizingPlayer) {
    let score = 0;
    const aiPlayer = maximizingPlayer ? 'red' : 'blue';
    const opponent = maximizingPlayer ? 'blue' : 'red';

    for (const mill of mills) {
        const [a, b, c] = mill;
        const pieces = [board[a], board[b], board[c]];
        const aiPieces = pieces.filter(p => p === aiPlayer).length;
        const opponentPieces = pieces.filter(p => p === opponent).length;

        if (aiPieces === 3) score += 10;
        else if (aiPieces === 2 && pieces.includes(null)) score += 7;

        if (opponentPieces === 3) score -= 10;
        else if (opponentPieces === 2 && pieces.includes(null)) score -= 7;
    }

    const aiMoves = getAllPossibleMoves(board, aiPlayer).length;
    const opponentMoves = getAllPossibleMoves(board, opponent).length;
    score += (aiMoves - opponentMoves) * 0.5;

    return maximizingPlayer ? score : -score;
}

export function getAllPossibleMoves(board, player) {
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

export function findBestPlaceMove(board) {
    let bestScore = -Infinity;
    let bestMove = -1;

    const emptyPoints = board.reduce((acc, piece, index) => {
        if (piece === null) acc.push(index);
        return acc;
    }, []);

    for (const point of emptyPoints) {
        board[point] = 'red';
        const score = minimaxPlace(board, 3, -Infinity, Infinity, false);
        board[point] = null;

        if (score > bestScore) {
            bestScore = score;
            bestMove = point;
        }
    }
    return bestMove;
}

function minimaxPlace(board, depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0 || checkWinConditionAI(board)) {
        return evaluateBoard(board, true);
    }

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        const emptyPoints = board.reduce((acc, piece, index) => {
            if (piece === null) acc.push(index);
            return acc;
        }, []);
        for (const point of emptyPoints) {
            board[point] = 'red';
            const eval = minimaxPlace(board, depth - 1, alpha, beta, false);
            board[point] = null;
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        const emptyPoints = board.reduce((acc, piece, index) => {
            if (piece === null) acc.push(index);
            return acc;
        }, []);
        for (const point of emptyPoints) {
            board[point] = 'blue';
            const eval = minimaxPlace(board, depth - 1, alpha, beta, true);
            board[point] = null;
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

export function minimax(board, depth, alpha, beta, isMaximizingPlayer) {
    if (depth === 0 || checkWinConditionAI(board)) {
        return evaluateBoard(board, true);
    }

    const aiPlayer = isMaximizingPlayer ? 'red' : 'blue';
    const opponent = isMaximizingPlayer ? 'blue' : 'red';
    const pieces = board.reduce((acc, piece, index) => {
        if (piece === aiPlayer) acc.push(index);
        return acc;
    }, []);
    const isFlying = pieces.length === 3;

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const pieceIndex of pieces) {
            const possibleMoves = isFlying
                ? board.reduce((acc, piece, index) => piece === null ? [...acc, index] : acc, [])
                : neighbors[pieceIndex];
            for (const targetIndex of possibleMoves) {
                if (board[targetIndex] === null) {
                    const originalPosition = board[targetIndex];
                    board[targetIndex] = aiPlayer;
                    board[pieceIndex] = null;
                    const eval = minimax(board, depth - 1, alpha, beta, false);
                    board[targetIndex] = originalPosition;
                    board[pieceIndex] = aiPlayer;
                    maxEval = Math.max(maxEval, eval);
                    alpha = Math.max(alpha, eval);
                    if (beta <= alpha) break;
                }
            }
             if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        const pieces = board.reduce((acc, piece, index) => {
            if (piece === opponent) acc.push(index);
            return acc;
        }, []);
        const isFlying = pieces.length === 3;

        for (const pieceIndex of pieces) {
            const possibleMoves = isFlying
                ? board.reduce((acc, piece, index) => piece === null ? [...acc, index] : acc, [])
                : neighbors[pieceIndex];
            for (const targetIndex of possibleMoves) {
                if (board[targetIndex] === null) {
                    const originalPosition = board[targetIndex];
                    board[targetIndex] = opponent;
                    board[pieceIndex] = null;
                    const eval = minimax(board, depth - 1, alpha, beta, true);
                    board[targetIndex] = originalPosition;
                    board[pieceIndex] = opponent;
                    minEval = Math.min(minEval, eval);
                    beta = Math.min(beta, eval);
                    if (beta <= alpha) break;
                }
            }
             if (beta <= alpha) break;
        }
        return minEval;
    }
}

export function checkWinConditionAI(board) {
    const bluePieces = board.filter(piece => piece === 'blue').length;
    const redPieces = board.filter(piece => piece === 'red').length;

    if (redPieces < 3) {
        return true;
    }

    if (bluePieces < 3) {
        return true;
    }

    if (!isPlacingPhaseAI(board)) {
        if (!hasLegalMovesAI(board, 'blue')) {
            return true;
        }
        if (!hasLegalMovesAI(board, 'red')) {
            return true;
        }
    }
    return false;
}

function isPlacingPhaseAI(board) {
    return board.filter(p => p !== null).length < 18;
}

function hasLegalMovesAI(board, player) {
    const playerPiecesIndices = board.reduce((acc, piece, index) => {
        if (piece === player) {
            acc.push(index);
        }
        return acc;
    }, []);

    for (const pieceIndex of playerPiecesIndices) {
        const canMoveAnywhere = playerPiecesIndices.length === 3;
        const moves = canMoveAnywhere ? board.reduce((acc, piece, index) => { if (piece === null) acc.push(index); return acc; }, []) : neighbors[pieceIndex];

        if (moves.some(neighborIndex => board[neighborIndex] === null)) {
            return true;
        }
    }
    return false;
}

export function isPieceInMillAI(pointIndex, board, player) {
    for (const mill of mills) {
        if (mill.includes(pointIndex)) {
            const [a, b, c] = mill;
            if (board[a] === player && board[b] === player && board[c] === player) {
                return true;
            }
        }
    }
    return false;
}

export function canOnlyRemoveFromMillAI(board, player) {
    const opponentPieces = board.reduce((count, piece) => count + (piece === player ? 1 : 0), 0);
    if (opponentPieces <= 3) return true;
    return board.every((piece, index) => piece !== player || isPieceInMillAI(index, board, player));
}
