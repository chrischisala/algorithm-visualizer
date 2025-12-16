# algorithm-visualizer
# ⚡ Neural Pathfinding Visualizer

A high-performance, interactive visualization tool for graph theory algorithms. Built with **Vanilla JavaScript** (ES6+) to demonstrate core computer science concepts, memory management, and real-time DOM manipulation without the overhead of external frameworks.

## 🎮 How to Use

1.  **Draw Walls**: Click and drag your mouse (or finger on mobile) across the grid to create "Firewall" barriers.
2.  **Generate Maze**: Click the `GENERATE MAZE` button to let the system build a complex recursive maze for you.
3.  **Select Algorithm**: Choose between:
    *   **Dijkstra's Algorithm**: The father of pathfinding. Guarantees the absolute shortest path.
    *   **A* (A-Star) Search**: A smart heuristic algorithm that "aims" for the target. Much faster but more complex implementation.
    *   **Breadth-First Search (BFS)**: Explores equally in all directions (unweighted).
4.  **Control Speed**: Use the dropdown to toggle between fast, medium, or slow visualization to study the search pattern.
5.  **Visualize**: Hit `INITIALIZE RUN` and watch the Neural Network find the path.

### 🕵️‍♂️ Secret Developer Mode
*   **Unlock**: Double-click the **"NEURAL PATH"** logo in the top-left corner.
*   **Result**: Unlocks the **Bi-Directional Swarm** algorithm. A chaotic, multi-threaded simulation where the Start and Target nodes search for each other simultaneously.

## 🛠️ Technical Implementation

### Core Engine
*   **Grid System**: A custom generated 2D grid that calculates dimension based on the user's viewport (`window.innerWidth/Height`). It is fully responsive.
*   **No Frameworks**: 100% native DOM APIs. This ensures 60 FPS performance even on mobile devices.

### Audio System (Web Audio API)
*   The application features a procedural sound engine.
*   Instead of loading heavy MP3 files, it uses the browser's `AudioContext` to generate oscillators (Sine, Square, Triangle waves) in real-time.
*   **Feedback**: Pitch changes based on wall drawing vs. pathfinding success.

### Analytics HUD
*   A "Heads Up Display" floats on the UI, tracking:
    *   **Nodes Scanned**: Total computational steps taken.
    *   **Execution Time**: Measured in milliseconds using `performance.now()` for benchmarking precision.
    *   **Search State**: Live status of the algorithmic loop.

## 🧠 Algorithms Explained

### Dijkstra's Algorithm
Uses a weighted graph approach (though currently all weights are 1). It prioritizes the closest unvisited node. It is thorough but can be slow as it explores *every* direction.

### A* (A-Star) Search
Uses a heuristic function (Manhattan Distance) to estimate the distance to the target: `f(n) = g(n) + h(n)`.
*   `g(n)`: Cost from start to current node.
*   `h(n)`: Estimated cost from current node to end.
This makes it "smart"—it ignores directions that move away from the target.

### Recursive Division Maze
A recursive algorithm that splits the grid chamber-by-chamber, ensuring there is always a solvable path while creating complex, organic-looking corridors.

---

**Developed by Chris Chisala**
*Part of the "Interactive Engineering" Portfolio Series.*
