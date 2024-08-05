
let gameHasStarted = false
var board = null
// r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b - - 0 19
var game = new Chess()
var $status = $('#status')
var $pgn = $('#pgn')
let gameOver = false

let $board = $('#myBoard')
let squareClass = 'square-55d63'
let squareToHighlight = null
let colorToHighlight = null
var whiteSquareGrey = '#a9a9a9'
var blackSquareGrey = '#696969'

function removeGreySquares() {
    $('#myBoard .square-55d63').css('background', '')
}

function greySquare(square) {
    var $square = $('#myBoard .square-' + square)

    var background = whiteSquareGrey
    if ($square.hasClass('black-3c85d')) {
        background = blackSquareGrey
    }

    $square.css('background', background)
}

function onDragStart(source, piece, position, orientation) {

    // do not pick up pieces if the game is over
    if (game.game_over()) {
        console.log('// game.game_over')
        return false
    }
    if (!gameHasStarted) {
        console.log('//!gameHasStarted')
        return false
    }
    if (gameOver) {
        console.log('//gameOver')
        return false
    }

    if ((playerColor === 'black' && piece.search(/^w/) !== -1) || (playerColor === 'white' && piece.search(/^b/) !== -1)) {
        console.log('// black only pick up pieces for the side to move')
        return false
    }

    // only pick up pieces for the side to move
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) || (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        console.log('// wight only pick up pieces for the side to move')
        return false
    }
}

function onDrop(source, target) {
    let theMove = {
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for simplicity
    }
    // see if the move is legal
    var move = game.move(theMove)


    // illegal move
    if (move === null) return 'snapback'

    if (move.color === 'w') {
        $board.find('.' + squareClass).removeClass('highlight-white')
        console.log('move.from', move.from)
        $board.find('.square-' + move.from).addClass('highlight-white')
        squareToHighlight = move.to
        colorToHighlight = 'white'
    } else {
        $board.find('.' + squareClass).removeClass('highlight-black')
        $board.find('.square-' + move.from).addClass('highlight-black')
        squareToHighlight = move.to
        colorToHighlight = 'black'
    }


    socket.emit('move', theMove)

    updateStatus()

    onMoveEnd()
}

socket.on('newMove', function (move) {
    game.move(move)
    board.position(game.fen())
    console.log('newMove', game.fen())
    updateStatus()
})

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd() {
    board.position(game.fen())
    console.log('onSnapEnd', game.fen())
}

function onMoveEnd() {
    $board.find('.square-' + squareToHighlight)
        .addClass('highlight-' + colorToHighlight)
}

function updateStatus() {
    var status = ''

    var moveColor = 'White'
    if (game.turn() === 'b') {
        moveColor = 'Black'
    }

    // checkmate?
    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.'
    }

    // draw?
    else if (game.in_draw()) {
        status = 'Game over, drawn position'
    }

    else if (gameOver) {
        status = 'Opponent disconnected, you win!'
    }

    else if (!gameHasStarted) {
        status = 'Waiting for black to join'
    }

    // game still on
    else {
        status = moveColor + ' to move'

        // check?
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check'
        }

    }

    $status.html(status)
    $pgn.html(game.pgn())
}
// r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R
var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: '/public/img/chesspieces/wikipedia/{piece}.png'
}
board = Chessboard('myBoard', config)
if (playerColor == 'black') {
    board.flip()
}

updateStatus()

var urlParams = new URLSearchParams(window.location.search)
if (urlParams.get('code')) {
    socket.emit('joinGame', {
        code: urlParams.get('code')
    })
}

socket.on('startGame', function () {
    gameHasStarted = true
    updateStatus()
})

socket.on('gameOverDisconnect', function () {
    gameOver = true
    updateStatus()
})