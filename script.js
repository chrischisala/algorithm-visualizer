class SoundManager {
    constructor() {
        this.context = null;
        this.isMuted = false;
    }

    init() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(frequency, type, duration) {
        if (this.isMuted || !this.context) return;
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
        gainNode.gain.setValueAtTime(0.05, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        oscillator.start();
        oscillator.stop(this.context.currentTime + duration);
    }

    playVisit() { this.playTone(400 + Math.random() * 200, 'sine', 0.1); }
    playWall() { this.playTone(100, 'square', 0.1); }
    playPath() { this.playTone(800, 'sine', 0.15); }
    playSuccess() {
        this.playTone(600, 'triangle', 0.2);
        setTimeout(() => this.playTone(800, 'triangle', 0.2), 100);
        setTimeout(() => this.playTone(1200, 'triangle', 0.4), 200);
    }
}

class Node {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.isStart = false;
        this.isTarget = false;
        this.isWall = false;
        this.distance = Infinity;
        this.isVisited = false;
        this.previousNode = null;
        this.fScore = Infinity;
        this.gScore = Infinity;
    }
}

class PathfindingVisualizer {
    constructor() {
        this.gridContainer = document.getElementById('grid-container');
        this.grid = [];
        this.rows = 25;
        this.cols = 50;
        this.startNode = null;
        this.targetNode = null;
        this.isMousePressed = false;
        this.isAlgRunning = false;
        this.currentAlgorithm = 'dijkstra';
        this.animationSpeed = 10;
        this.soundManager = new SoundManager();
        this.isDevMode = false; // Secret functionality

        this.updateGridDimensions(); // Sets rows/cols
        this.initializeHelp();
        this.initializeGrid();
        this.addEventListeners();

        window.addEventListener('resize', () => {
            // Optional: Debounce and resize grid dynamically
        });
    }

    updateGridDimensions() {
        const headerHeight = 150;
        const cellCanvasWidth = window.innerWidth - 60;
        const cellCanvasHeight = window.innerHeight - headerHeight;
        const cellSize = 25;
        this.cols = Math.floor(cellCanvasWidth / cellSize);
        this.rows = Math.floor(cellCanvasHeight / cellSize);

        this.startNode = { row: Math.floor(this.rows / 2), col: Math.floor(this.cols * 0.15) };
        this.targetNode = { row: Math.floor(this.rows / 2), col: Math.floor(this.cols * 0.85) };
    }

    initializeHelp() {
        console.log("%c NEURAL PATHFINDER LOG ", "background: #000; color: #00f3ff; font-size: 14px;");
    }

    initializeGrid() {
        this.gridContainer.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        this.grid = [];
        this.gridContainer.innerHTML = '';

        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            for (let col = 0; col < this.cols; col++) {
                const node = new Node(row, col);
                const nodeElement = document.createElement('div');
                nodeElement.className = 'grid-cell';
                nodeElement.id = `node-${row}-${col}`;

                if (row === this.startNode.row && col === this.startNode.col) {
                    node.isStart = true;
                    nodeElement.classList.add('node', 'start');
                } else if (row === this.targetNode.row && col === this.targetNode.col) {
                    node.isTarget = true;
                    nodeElement.classList.add('node', 'target');
                } else {
                    nodeElement.classList.add('node', 'unvisited');
                }

                // Mouse Events
                nodeElement.addEventListener('mousedown', () => this.handleMouseDown(row, col));
                nodeElement.addEventListener('mouseenter', () => this.handleMouseEnter(row, col));
                nodeElement.addEventListener('mouseup', () => this.handleMouseUp());

                // Touch Events (Mobile)
                nodeElement.addEventListener('touchstart', (e) => this.handleTouchStart(e, row, col), { passive: false });
                nodeElement.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
                nodeElement.addEventListener('touchend', () => this.handleMouseUp()); // Reuse mouseup

                currentRow.push(node);
                this.gridContainer.appendChild(nodeElement);
            }
            this.grid.push(currentRow);
        }
    }

    // ... (listeners remain the same) ...

    // --- Touch Logic ---
    handleTouchStart(e, row, col) {
        if (this.isAlgRunning) return;
        e.preventDefault(); // Stop scroll
        this.soundManager.init(); // Audio unlock on touch
        this.isMousePressed = true;
        this.toggleWall(row, col);
    }

    handleTouchMove(e) {
        if (!this.isMousePressed || this.isAlgRunning) return;
        e.preventDefault();

        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);

        if (target && target.classList.contains('grid-cell')) {
            const idParts = target.id.split('-');
            const r = parseInt(idParts[1]);
            const c = parseInt(idParts[2]);
            this.toggleWall(r, c);
        }
    }

    addEventListeners() {
        document.getElementById('visualize-btn').addEventListener('click', () => {
            if (!this.soundManager.context) this.soundManager.init();
            this.visualize();
        });
        document.getElementById('clear-btn').addEventListener('click', () => this.clearGrid());
        document.getElementById('algorithm-select').addEventListener('change', (e) => {
            this.currentAlgorithm = e.target.value;
        });

        const speedSelect = document.getElementById('speed-select');
        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                this.animationSpeed = parseInt(e.target.value);
            });
        }

        const mazeBtn = document.getElementById('maze-btn');
        if (mazeBtn) {
            mazeBtn.addEventListener('click', () => {
                if (!this.soundManager.context) this.soundManager.init();
                this.generateMaze();
            });
        }

        // SECRET DEV MODE ACTIVATOR
        const logo = document.querySelector('.logo');
        logo.addEventListener('dblclick', () => {
            if (!this.isDevMode) {
                this.isDevMode = true;
                alert("ACCESS GRANTED: DEV MODE [Bi-Directional Swarm Unlocked]");
                // Add secret option
                const select = document.getElementById('algorithm-select');
                const option = document.createElement("option");
                option.text = "⚡ Bi-Directional Swarm (DEV)";
                option.value = "swarm";
                select.add(option);
                select.value = "swarm";
                this.currentAlgorithm = "swarm";

                logo.querySelector('.logo-icon').style.color = '#ff0055'; // Change logo color
            }
        });
    }

    handleMouseDown(row, col) {
        if (this.isAlgRunning) return;
        this.soundManager.init();
        this.isMousePressed = true;
        this.toggleWall(row, col);
    }

    handleMouseEnter(row, col) {
        if (!this.isMousePressed || this.isAlgRunning) return;
        this.toggleWall(row, col);
    }

    handleMouseUp() {
        this.isMousePressed = false;
    }

    toggleWall(row, col) {
        const node = this.grid[row][col];
        if (node.isStart || node.isTarget) return;

        node.isWall = !node.isWall;
        const info = document.getElementById(`node-${row}-${col}`);
        if (node.isWall) {
            info.className = 'grid-cell node wall';
            this.soundManager.playWall();
        } else {
            info.className = 'grid-cell node unvisited';
        }
    }

    clearGrid() {
        if (this.isAlgRunning) return;
        this.grid.forEach(row => row.forEach(node => {
            node.isWall = false;
            node.isVisited = false;
            node.distance = Infinity;
            node.previousNode = null;
            if (!node.isStart && !node.isTarget) {
                const el = document.getElementById(`node-${node.row}-${node.col}`);
                el.className = 'grid-cell node unvisited';
            }
        }));
        this.updateHUD('CLEARED', 'IDLE', 0, 0);
    }

    // --- HUD Updates ---
    updateHUD(algo, status, nodes, time) {
        document.getElementById('hud-algo').textContent = algo.toUpperCase();
        const statEl = document.getElementById('hud-status');
        statEl.textContent = status;
        statEl.className = `hud-value status-${status.toLowerCase()}`;
        document.getElementById('hud-nodes').textContent = nodes;
        document.getElementById('hud-time').textContent = time;
    }

    // --- Maze Generation ---
    async generateMaze() {
        if (this.isAlgRunning) return;
        this.clearGrid();
        this.isAlgRunning = true;
        this.updateHUD('GENERATOR', 'RUNNING', 0, 0);

        // Borders
        for (let r = 0; r < this.rows; r++) {
            this.grid[r][0].isWall = true; this.grid[r][this.cols - 1].isWall = true;
            document.getElementById(`node-${r}-0`).className = 'grid-cell node wall';
            document.getElementById(`node-${r}-${this.cols - 1}`).className = 'grid-cell node wall';
        }
        for (let c = 0; c < this.cols; c++) {
            this.grid[0][c].isWall = true; this.grid[this.rows - 1][c].isWall = true;
            document.getElementById(`node-${0}-${c}`).className = 'grid-cell node wall';
            document.getElementById(`node-${this.rows - 1}-${c}`).className = 'grid-cell node wall';
        }
        await this.divide(2, this.cols - 3, 2, this.rows - 3);
        this.isAlgRunning = false;
        this.updateHUD('GENERATOR', 'DONE', this.rows * this.cols, 0);
    }

    async divide(colStart, colEnd, rowStart, rowEnd) {
        if (colEnd - colStart <= 0 || rowEnd - rowStart <= 0) return;
        const horizontal = (colEnd - colStart) < (rowEnd - rowStart);

        if (horizontal) {
            const possibleRows = [];
            for (let i = rowStart; i <= rowEnd; i += 2) possibleRows.push(i);
            const midRow = possibleRows[Math.floor(Math.random() * possibleRows.length)];

            for (let c = colStart - 1; c <= colEnd + 1; c++) {
                const node = this.grid[midRow][c];
                if (!node.isStart && !node.isTarget) {
                    node.isWall = true;
                    document.getElementById(`node-${midRow}-${c}`).className = 'grid-cell node wall';
                    if (Math.random() > 0.9) this.soundManager.playWall();
                    await this.sleep(2);
                }
            }
            const possibleGaps = [];
            for (let i = colStart; i <= colEnd; i += 2) possibleGaps.push(i);
            const gapCol = possibleGaps[Math.floor(Math.random() * possibleGaps.length)];
            this.grid[midRow][gapCol].isWall = false;
            document.getElementById(`node-${midRow}-${gapCol}`).className = 'grid-cell node unvisited';

            await this.divide(colStart, colEnd, rowStart, midRow - 2);
            await this.divide(colStart, colEnd, midRow + 2, rowEnd);
        } else {
            const possibleCols = [];
            for (let i = colStart; i <= colEnd; i += 2) possibleCols.push(i);
            const midCol = possibleCols[Math.floor(Math.random() * possibleCols.length)];

            for (let r = rowStart - 1; r <= rowEnd + 1; r++) {
                const node = this.grid[r][midCol];
                if (!node.isStart && !node.isTarget) {
                    node.isWall = true;
                    document.getElementById(`node-${r}-${midCol}`).className = 'grid-cell node wall';
                    if (Math.random() > 0.9) this.soundManager.playWall();
                    await this.sleep(2);
                }
            }
            const possibleGaps = [];
            for (let i = rowStart; i <= rowEnd; i += 2) possibleGaps.push(i);
            const gapRow = possibleGaps[Math.floor(Math.random() * possibleGaps.length)];
            this.grid[gapRow][midCol].isWall = false;
            document.getElementById(`node-${gapRow}-${midCol}`).className = 'grid-cell node unvisited';

            await this.divide(colStart, midCol - 2, rowStart, rowEnd);
            await this.divide(midCol + 2, colEnd, rowStart, rowEnd);
        }
    }

    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    async visualize() {
        if (this.isAlgRunning) return;
        this.isAlgRunning = true;
        this.resetPathData();

        const startTime = performance.now();
        this.updateHUD(this.currentAlgorithm, 'RUNNING', 0, 0);

        let visitedNodesInOrder = [];

        if (this.currentAlgorithm === 'dijkstra' || this.currentAlgorithm === 'bfs') {
            visitedNodesInOrder = this.dijkstra();
        } else if (this.currentAlgorithm === 'astar') {
            visitedNodesInOrder = this.astar();
        } else if (this.currentAlgorithm === 'swarm') {
            visitedNodesInOrder = this.swarm(); // Secret algo
        }

        await this.animateVisitedNodes(visitedNodesInOrder, startTime);

        const target = this.grid[this.targetNode.row][this.targetNode.col];
        if (target.isVisited) {
            this.soundManager.playSuccess();
            const nodesInShortestPathOrder = this.getNodesInShortestPathOrder(target);
            await this.animatePath(nodesInShortestPathOrder);
            this.updateHUD(this.currentAlgorithm, 'DONE', visitedNodesInOrder.length, Math.floor(performance.now() - startTime));
        } else {
            this.updateHUD(this.currentAlgorithm, 'FAIL', visitedNodesInOrder.length, Math.floor(performance.now() - startTime));
        }

        this.isAlgRunning = false;
    }

    resetPathData() {
        for (let row of this.grid) {
            for (let node of row) {
                node.distance = Infinity;
                node.isVisited = false;
                node.previousNode = null;
                node.fScore = Infinity;
                node.gScore = Infinity;

                const el = document.getElementById(`node-${node.row}-${node.col}`);
                if (!node.isStart && !node.isTarget && !node.isWall) {
                    el.className = 'grid-cell node unvisited';
                }
                if (node.isTarget) el.classList.remove('visited');
            }
        }
    }

    dijkstra() {
        const startNode = this.grid[this.startNode.row][this.startNode.col];
        const targetNode = this.grid[this.targetNode.row][this.targetNode.col];
        startNode.distance = 0;
        const unvisitedNodes = this.getAllNodes();
        const visitedNodesInOrder = [];

        while (unvisitedNodes.length > 0) {
            this.sortNodesByDistance(unvisitedNodes);
            const closestNode = unvisitedNodes.shift();
            if (closestNode.isWall) continue;
            if (closestNode.distance === Infinity) return visitedNodesInOrder;
            closestNode.isVisited = true;
            visitedNodesInOrder.push(closestNode);
            if (closestNode === targetNode) return visitedNodesInOrder;
            this.updateUnvisitedNeighbors(closestNode);
        }
        return visitedNodesInOrder;
    }

    astar() {
        const startNode = this.grid[this.startNode.row][this.startNode.col];
        const targetNode = this.grid[this.targetNode.row][this.targetNode.col];
        startNode.gScore = 0;
        startNode.fScore = this.heuristic(startNode, targetNode);
        let openSet = [startNode];
        const visitedNodesInOrder = [];

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.fScore - b.fScore);
            const current = openSet.shift();
            if (current.isWall) continue;
            current.isVisited = true;
            visitedNodesInOrder.push(current);
            if (current === targetNode) return visitedNodesInOrder;

            const neighbors = this.getNeighbors(current);
            for (let neighbor of neighbors) {
                if (neighbor.isWall || neighbor.isVisited) continue;
                const tentativeGScore = current.gScore + 1;
                if (tentativeGScore < neighbor.gScore) {
                    neighbor.previousNode = current;
                    neighbor.gScore = tentativeGScore;
                    neighbor.fScore = neighbor.gScore + this.heuristic(neighbor, targetNode);
                    if (!openSet.includes(neighbor)) openSet.push(neighbor);
                }
            }
        }
        return visitedNodesInOrder;
    }

    swarm() { // Secret Bidirectional-ish Swarm
        const startNode = this.grid[this.startNode.row][this.startNode.col];
        const targetNode = this.grid[this.targetNode.row][this.targetNode.col];
        let openSet = [startNode, targetNode]; // Start effectively from both ends!
        startNode.distance = 0;
        targetNode.distance = 0;
        const visitedNodesInOrder = [];

        // This is a "fake" swarm for visual effect, simpler than true bidirectional
        while (openSet.length > 0) {
            // Randomly pick to simulate swarm behavior
            const idx = Math.floor(Math.random() * openSet.length);
            const current = openSet.splice(idx, 1)[0];

            if (current.isWall || current.isVisited) continue;
            current.isVisited = true;
            visitedNodesInOrder.push(current);

            // Allow meeting in middle (rough check)
            const neighbors = this.getNeighbors(current);
            for (let neighbor of neighbors) {
                if (!neighbor.isVisited && !neighbor.isWall) {
                    neighbor.previousNode = current; // Not accurate for path reconstruction but looks cool
                    openSet.push(neighbor);
                }
            }
            if (visitedNodesInOrder.length > 1500) break; // Safety break
        }
        return visitedNodesInOrder;
    }

    heuristic(nodeA, nodeB) {
        return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
    }

    getAllNodes() {
        const nodes = [];
        for (const row of this.grid) {
            for (const node of row) {
                nodes.push(node);
            }
        }
        return nodes;
    }

    sortNodesByDistance(unvisitedNodes) {
        unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
    }

    updateUnvisitedNeighbors(node) {
        const neighbors = this.getNeighbors(node);
        for (const neighbor of neighbors) {
            if (!neighbor.isVisited) {
                neighbor.distance = node.distance + 1;
                neighbor.previousNode = node;
            }
        }
    }

    getNeighbors(node) {
        const neighbors = [];
        const { col, row } = node;
        if (row > 0) neighbors.push(this.grid[row - 1][col]);
        if (row < this.rows - 1) neighbors.push(this.grid[row + 1][col]);
        if (col > 0) neighbors.push(this.grid[row][col - 1]);
        if (col < this.cols - 1) neighbors.push(this.grid[row][col + 1]);
        return neighbors.filter(neighbor => !neighbor.isVisited);
    }

    getNodesInShortestPathOrder(targetNode) {
        const nodesInShortestPathOrder = [];
        let currentNode = targetNode;
        // In swarm mode this might break, so we wrap in try/catch or simple check
        let safety = 0;
        while (currentNode !== null && safety < 5000) {
            nodesInShortestPathOrder.unshift(currentNode);
            currentNode = currentNode.previousNode;
            safety++;
        }
        return nodesInShortestPathOrder;
    }

    animateVisitedNodes(visitedNodesInOrder, startTime) {
        return new Promise(resolve => {
            const delay = this.animationSpeed;
            for (let i = 0; i <= visitedNodesInOrder.length; i++) {
                if (i === visitedNodesInOrder.length) {
                    setTimeout(() => resolve(), delay * i);
                    return;
                }
                setTimeout(() => {
                    const node = visitedNodesInOrder[i];

                    // Update HUD live
                    if (i % 10 === 0) {
                        this.updateHUD(this.currentAlgorithm, 'RUNNING', i, Math.floor(performance.now() - startTime));
                    }

                    if (!node.isStart && !node.isTarget) {
                        document.getElementById(`node-${node.row}-${node.col}`).className = 'grid-cell node visited';
                        if (i % 5 === 0) this.soundManager.playVisit();
                    }
                }, delay * i);
            }
        });
    }

    animatePath(nodesInShortestPathOrder) {
        return new Promise(resolve => {
            for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
                setTimeout(() => {
                    const node = nodesInShortestPathOrder[i];
                    document.getElementById(`node-${node.row}-${node.col}`).className = 'grid-cell node path';
                    this.soundManager.playPath();

                    if (node.isStart) document.getElementById(`node-${node.row}-${node.col}`).classList.add('start');
                    if (node.isTarget) document.getElementById(`node-${node.row}-${node.col}`).classList.add('target');

                    if (i === nodesInShortestPathOrder.length - 1) resolve();
                }, 50 * i);
            }
        });
    }
}

window.onload = () => {
    new PathfindingVisualizer();
};
