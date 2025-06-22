class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        this.BOARD_WIDTH = 10;
        this.BOARD_HEIGHT = 20;
        this.BLOCK_SIZE = 30;
        
        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        
        this.dropTime = 0;
        this.dropInterval = 1000;
        
        this.colors = {
            I: '#00FFFF', // Cyan
            O: '#FFFF00', // Yellow
            T: '#800080', // Purple
            S: '#00FF00', // Green
            Z: '#FF0000', // Red
            J: '#0000FF', // Blue
            L: '#FFA500'  // Orange
        };
        
        this.pieces = {
            I: [
                [[1,1,1,1]]
            ],
            O: [
                [[1,1],
                 [1,1]]
            ],
            T: [
                [[0,1,0],
                 [1,1,1]],
                [[1,0],
                 [1,1],
                 [1,0]],
                [[1,1,1],
                 [0,1,0]],
                [[0,1],
                 [1,1],
                 [0,1]]
            ],
            S: [
                [[0,1,1],
                 [1,1,0]],
                [[1,0],
                 [1,1],
                 [0,1]]
            ],
            Z: [
                [[1,1,0],
                 [0,1,1]],
                [[0,1],
                 [1,1],
                 [1,0]]
            ],
            J: [
                [[1,0,0],
                 [1,1,1]],
                [[1,1],
                 [1,0],
                 [1,0]],
                [[1,1,1],
                 [0,0,1]],
                [[0,1],
                 [0,1],
                 [1,1]]
            ],
            L: [
                [[0,0,1],
                 [1,1,1]],
                [[1,0],
                 [1,0],
                 [1,1]],
                [[1,1,1],
                 [1,0,0]],
                [[1,1],
                 [0,1],
                 [0,1]]
            ]
        };
        
        this.initializeBoard();
        this.setupEventListeners();
        this.generateNextPiece();
        this.spawnPiece();
        this.updateDisplay();
    }
    
    initializeBoard() {
        this.board = Array(this.BOARD_HEIGHT).fill().map(() => Array(this.BOARD_WIDTH).fill(0));
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) return;
        
        switch(e.code) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case 'Space':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'KeyC':
                e.preventDefault();
                this.holdCurrentPiece();
                break;
        }
    }
    
    generateNextPiece() {
        const pieceTypes = Object.keys(this.pieces);
        const randomType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        this.nextPiece = {
            type: randomType,
            shape: this.pieces[randomType][0],
            rotation: 0,
            x: 0,
            y: 0
        };
    }
    
    spawnPiece() {
        if (this.nextPiece) {
            this.currentPiece = {
                ...this.nextPiece,
                x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.nextPiece.shape[0].length / 2),
                y: 0
            };
            this.generateNextPiece();
            this.canHold = true;
            
            if (this.isCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
                this.gameOver();
            }
        }
    }
    
    movePiece(dx, dy) {
        if (this.isValidMove(this.currentPiece.x + dx, this.currentPiece.y + dy, this.currentPiece.shape)) {
            this.currentPiece.x += dx;
            this.currentPiece.y += dy;
            this.draw();
        } else if (dy > 0) {
            this.placePiece();
        }
    }
    
    rotatePiece() {
        const rotations = this.pieces[this.currentPiece.type];
        const newRotation = (this.currentPiece.rotation + 1) % rotations.length;
        const newShape = rotations[newRotation];
        
        if (this.isValidMove(this.currentPiece.x, this.currentPiece.y, newShape)) {
            this.currentPiece.rotation = newRotation;
            this.currentPiece.shape = newShape;
            this.draw();
        }
    }
    
    hardDrop() {
        while (this.isValidMove(this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
            this.currentPiece.y++;
        }
        this.placePiece();
    }
    
    holdCurrentPiece() {
        if (!this.canHold) return;
        
        if (this.holdPiece) {
            const temp = this.holdPiece;
            this.holdPiece = {
                type: this.currentPiece.type,
                shape: this.pieces[this.currentPiece.type][0],
                rotation: 0,
                x: 0,
                y: 0
            };
            this.currentPiece = {
                ...temp,
                x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(temp.shape[0].length / 2),
                y: 0
            };
        } else {
            this.holdPiece = {
                type: this.currentPiece.type,
                shape: this.pieces[this.currentPiece.type][0],
                rotation: 0,
                x: 0,
                y: 0
            };
            this.spawnPiece();
        }
        
        this.canHold = false;
        this.draw();
        this.drawHoldPiece();
    }
    
    isValidMove(x, y, shape) {
        return !this.isCollision(x, y, shape);
    }
    
    isCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.BOARD_WIDTH || 
                        newY >= this.BOARD_HEIGHT || 
                        (newY >= 0 && this.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const x = this.currentPiece.x + col;
                    const y = this.currentPiece.y + row;
                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.type;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
        this.draw();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.BOARD_HEIGHT - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
                linesCleared++;
                row++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
            this.updateDisplay();
        }
    }
    
    calculateScore(linesCleared) {
        const baseScore = [0, 100, 300, 500, 800];
        return baseScore[linesCleared] * this.level;
    }
    
    update(currentTime) {
        if (!this.gameRunning || this.gamePaused) return;
        
        if (currentTime - this.dropTime > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropTime = currentTime;
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBoard();
        this.drawCurrentPiece();
        this.drawGhost();
        this.drawGrid();
        this.drawNextPiece();
        this.drawHoldPiece();
    }
    
    drawBoard() {
        for (let row = 0; row < this.BOARD_HEIGHT; row++) {
            for (let col = 0; col < this.BOARD_WIDTH; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(col, row, this.colors[this.board[row][col]]);
                }
            }
        }
    }
    
    drawCurrentPiece() {
        if (!this.currentPiece) return;
        
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    this.drawBlock(
                        this.currentPiece.x + col,
                        this.currentPiece.y + row,
                        this.colors[this.currentPiece.type]
                    );
                }
            }
        }
    }
    
    drawGhost() {
        if (!this.currentPiece) return;
        
        let ghostY = this.currentPiece.y;
        while (this.isValidMove(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) {
            ghostY++;
        }
        
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    this.drawGhostBlock(this.currentPiece.x + col, ghostY + row);
                }
            }
        }
    }
    
    drawBlock(x, y, color) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        const gradient = this.ctx.createLinearGradient(pixelX, pixelY, pixelX + this.BLOCK_SIZE, pixelY + this.BLOCK_SIZE);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(pixelX, pixelY, this.BLOCK_SIZE, this.BLOCK_SIZE);
    }
    
    drawGhostBlock(x, y) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(pixelX + 2, pixelY + 2, this.BLOCK_SIZE - 4, this.BLOCK_SIZE - 4);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.BOARD_WIDTH; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(i * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let i = 0; i <= this.BOARD_HEIGHT; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, i * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const blockSize = 20;
        const shape = this.nextPiece.shape;
        const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;
                    
                    this.nextCtx.fillStyle = this.colors[this.nextPiece.type];
                    this.nextCtx.fillRect(x, y, blockSize, blockSize);
                    
                    this.nextCtx.strokeStyle = '#000';
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(x, y, blockSize, blockSize);
                }
            }
        }
    }
    
    drawHoldPiece() {
        this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (!this.holdPiece) return;
        
        const blockSize = 20;
        const shape = this.holdPiece.shape;
        const offsetX = (this.holdCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.holdCanvas.height - shape.length * blockSize) / 2;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;
                    
                    this.holdCtx.fillStyle = this.canHold ? this.colors[this.holdPiece.type] : '#666';
                    this.holdCtx.fillRect(x, y, blockSize, blockSize);
                    
                    this.holdCtx.strokeStyle = '#000';
                    this.holdCtx.lineWidth = 1;
                    this.holdCtx.strokeRect(x, y, blockSize, blockSize);
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        document.getElementById('game-overlay').classList.add('hidden');
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        this.gameLoop();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        
        if (this.gamePaused) {
            document.getElementById('game-overlay').classList.remove('hidden');
            document.getElementById('game-message').innerHTML = '<h2>PAUSED</h2><p>Press SPACE or click Resume to continue</p>';
            document.getElementById('pause-btn').textContent = 'Resume';
        } else {
            document.getElementById('game-overlay').classList.add('hidden');
            document.getElementById('pause-btn').textContent = 'Pause';
            this.gameLoop();
        }
    }
    
    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        this.canHold = true;
        this.holdPiece = null;
        
        this.initializeBoard();
        this.generateNextPiece();
        this.spawnPiece();
        this.updateDisplay();
        this.draw();
        
        document.getElementById('game-overlay').classList.remove('hidden');
        document.getElementById('game-message').innerHTML = '<h2>TETRIS</h2><p>Press SPACE to start</p><div class="controls"><p>Controls:</p><p>← → Move</p><p>↓ Soft Drop</p><p>↑ Rotate</p><p>SPACE Hard Drop</p><p>C Hold</p></div>';
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('pause-btn').textContent = 'Pause';
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('game-overlay').classList.remove('hidden');
        document.getElementById('game-message').innerHTML = `<h2>GAME OVER</h2><p>Final Score: ${this.score}</p><p>Lines: ${this.lines}</p><p>Level: ${this.level}</p><p>Press Reset to play again</p>`;
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = true;
    }
    
    gameLoop() {
        if (!this.gameRunning || this.gamePaused) return;
        
        const currentTime = Date.now();
        this.update(currentTime);
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new TetrisGame();
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !game.gameRunning) {
            e.preventDefault();
            game.startGame();
        } else if (e.code === 'Space' && game.gamePaused) {
            e.preventDefault();
            game.togglePause();
        }
    });
});