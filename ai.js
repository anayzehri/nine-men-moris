// ai.js

// --- Helper Functions (may be shared with the main game) ---

function getOpponent(player) {
    return player === 'black' ? 'white' : 'black';
}

function isPointEmpty(board, index) {
    return board[index] === null;
}

function getPlayerPieces(board, player) {
    return board.reduce((acc, piece, index) => {
        if (piece === player) {
            acc.push(index);
        }
        return acc;
    }, []);
}

function getEmptyPoints(board) {
    return board.reduce((acc, piece, index) => {
        if (piece === null) {
            acc.push(index);
        }
        return acc;
    }, []);
}

function checkMill(board, pointIndex, player, mills) {
    for (const mill of mills) {
        if (mill.includes(pointIndex)) {
            const [a, b, c] = mill;
            if (board[a] === player && board[b] === player && board[c] === player) {
                return mill;
            }
        }
    }
    return null;
}

function getAllFormedMills(board, player, mills) {
    const formedMills = [];
    for (let i = 0; i < board.length; i++) {
        if (board[i] === player) {
            const mill = checkMill(board, i, player, mills);
            if (mill && !formedMills.some(m => arraysAreEqual(m, mill))) {
                formedMills.push(mill);
            }
        }
    }
    return formedMills;
}

function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

function getPossibleMoves(board, player, neighbors) {
    const moves = [];
    const playerPieces = getPlayerPieces(board, player);

    for (const pieceIndex of playerPieces) {
        const possibleMovesFromPiece = neighbors[pieceIndex]
            .filter(neighborIndex => isPointEmpty(board, neighborIndex))
            .map(targetIndex => ({ from: pieceIndex, to: targetIndex }));
        moves.push(...possibleMovesFromPiece);
    }
    return moves;
}

// --- AI Logic ---

const AI = {
    makePlacementMove: function (board) {
        const emptyPoints = getEmptyPoints(board);
        // Simple strategy: Place on any empty point
        // A more advanced AI would evaluate the strategic value of each point
        return emptyPoints[Math.floor(Math.random() * emptyPoints.length)];
    },

    makeMovementMove: function (board, player, neighbors) {
        const possibleMoves = getPossibleMoves(board, player, neighbors);
        if (possibleMoves.length === 0) {
            return null; // No legal moves
        }

        // Simple strategy: Choose a random legal move
        // A more advanced AI would evaluate the outcome of each move
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    },

    makeRemovalMove: function (board, opponent, mills) {
        const opponentPieces = getPlayerPieces(board, opponent);
        const opponentPiecesNotInMill = opponentPieces.filter(pieceIndex => {
            return !checkMill(board, pieceIndex, opponent, mills);
        });

        if (opponentPiecesNotInMill.length > 0) {
            // Try to remove a piece not in a mill
            return opponentPiecesNotInMill[Math.floor(Math.random() * opponentPiecesNotInMill.length)];
        } else if (opponentPieces.length > 0) {
            // If all opponent pieces are in mills, remove a random one
            return opponentPieces[Math.floor(Math.random() * opponentPieces.length)];
        }
        return null; // Should not happen if a mill was just formed
    },

    // More advanced AI using minimax (basic implementation)
    findBestMove: function (board, player, placingPhase, neighbors, mills) {
        const opponent = getOpponent(player);
        let bestMove = null;
        let bestScore = -Infinity; // For maximizing player

        if (placingPhase) {
            const emptyPoints = getEmptyPoints(board);
            for (const pointIndex of emptyPoints) {
                const newBoard = [...board];
                newBoard[pointIndex] = player;
                const score = this.minimax(newBoard, 2, false, opponent, placingPhase, neighbors, mills); // Basic depth of 2
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = pointIndex;
                }
            }
            return bestMove;
        } else {
            const possibleMoves = getPossibleMoves(board, player, neighbors);
            for (const move of possibleMoves) {
                const newBoard = [...board];
                newBoard[move.to] = player;
                newBoard[move.from] = null;
                const score = this.minimax(newBoard, 2, false, opponent, placingPhase, neighbors, mills); // Basic depth of 2
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
            return bestMove;
        }
    },

    minimax: function (board, depth, isMaximizing, player, placingPhase, neighbors, mills) {
        const opponent = getOpponent(player);
        if (depth === 0 || this.isGameOver(board, player, placingPhase, neighbors)) {
            return this.evaluateBoard(board, player);
        }

        if (isMaximizing) {
            let bestScore = -Infinity;
            if (placingPhase) {
                const emptyPoints = getEmptyPoints(board);
                for (const pointIndex of emptyPoints) {
                    const newBoard = [...board];
                    newBoard[pointIndex] = player;
                    bestScore = Math.max(bestScore, this.minimax(newBoard, depth - 1, false, opponent, placingPhase, neighbors, mills));
                }
            } else {
                const possibleMoves = getPossibleMoves(board, player, neighbors);
                for (const move of possibleMoves) {
                    const newBoard = [...board];
                    newBoard[move.to] = player;
                    newBoard[move.from] = null;
                    bestScore = Math.max(bestScore, this.minimax(newBoard, depth - 1, false, opponent, placingPhase, neighbors, mills));
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            if (placingPhase) {
                const emptyPoints = getEmptyPoints(board);
                for (const pointIndex of emptyPoints) {
                    const newBoard = [...board];
                    newBoard[pointIndex] = opponent;
                    bestScore = Math.min(bestScore, this.minimax(newBoard, depth - 1, true, player, placingPhase, neighbors, mills));
                }
            } else {
                const possibleMoves = getPossibleMoves(board, opponent, neighbors);
                for (const move of possibleMoves) {
                    const newBoard = [...board];
                    newBoard[move.to] = opponent;
                    newBoard[move.from] = null;
                    bestScore = Math.min(bestScore, this.minimax(newBoard, depth - 1, true, player, placingPhase, neighbors, mills));
                }
            }
            return bestScore;
        }
    },

    evaluateBoard: function (board, aiPlayer) {
        const humanPlayer = getOpponent(aiPlayer);
        const aiPieces = getPlayerPieces(board, aiPlayer).length;
        const humanPieces = getPlayerPieces(board, humanPlayer).length;

        // Simple evaluation: prioritize having more pieces
        let score = aiPieces - humanPieces;

        // Bonus for forming mills
        const aiMills = getAllFormedMills(board, aiPlayer, mills).length;
        const humanMills = getAllFormedMills(board, humanPlayer, mills).length;
        score += aiMills * 5 - humanMills * 5;

        return score;
    },

    isGameOver: function (board, currentPlayer, placingPhase, neighbors) {
        const opponent = getOpponent(currentPlayer);
        const opponentPieces = getPlayerPieces(board, opponent).length;

        if (opponentPieces < 3) {
            return true;
        }

        if (!placingPhase) {
            const canOpponentMove = getPossibleMoves(board, opponent, neighbors).length > 0;
            if (!canOpponentMove) {
                return true;
            }
        }

        return false;
    },

    findBestRemovalMinimax: function (board, aiPlayer, mills) {
        const opponent = getOpponent(aiPlayer);
        const opponentPieces = getPlayerPieces(board, opponent);
        let bestRemovalIndex = null;
        let bestScore = -Infinity;

        for (const pieceIndexToRemove of opponentPieces) {
            const newBoard = [...board];
            newBoard[pieceIndexToRemove] = null;
            // Evaluate the board after removal (can use a simple evaluation or look ahead)
            const score = this.evaluateBoard(newBoard, aiPlayer); // Simple evaluation for now
            if (score > bestScore) {
                bestScore = score;
                bestRemovalIndex = pieceIndexToRemove;
            }
        }
        return bestRemovalIndex;
    },
};
