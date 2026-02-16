// 五子棋游戏核心逻辑

export const EMPTY = 0;
export const BLACK = 1; // 玩家（黑棋先行）
export const WHITE = 2; // AI（白棋）
export const BOARD_SIZE = 15;

export class Game {
  constructor() {
    this.board = [];
    this.history = [];       // 落子历史，用于悔棋
    this.currentPlayer = BLACK;
    this.gameOver = false;
    this.winner = null;
    this.winPositions = [];  // 获胜的五子坐标

    // 回调
    this.onGameOver = null;

    this.reset();
  }

  // 重置游戏状态
  reset() {
    this.board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
    this.history = [];
    this.currentPlayer = BLACK;
    this.gameOver = false;
    this.winner = null;
    this.winPositions = [];
  }

  // 落子，返回是否成功
  placePiece(x, y, color) {
    if (this.gameOver) return false;
    if (!this._inBounds(x, y)) return false;
    if (this.board[x][y] !== EMPTY) return false;
    if (color !== this.currentPlayer) return false;

    this.board[x][y] = color;
    this.history.push({ x, y, color });

    // 检查胜负
    const winResult = this.checkWin(x, y, color);
    if (winResult) {
      this.gameOver = true;
      this.winner = color;
      this.winPositions = winResult;
      this.onGameOver?.(color, winResult);
      return true;
    }

    // 检查平局（棋盘下满）
    if (this.history.length === BOARD_SIZE * BOARD_SIZE) {
      this.gameOver = true;
      this.winner = null;
      this.onGameOver?.(null, null);
      return true;
    }

    // 切换玩家
    this.currentPlayer = color === BLACK ? WHITE : BLACK;
    return true;
  }

  // 悔棋：撤销玩家和 AI 各一步
  undo() {
    if (this.history.length < 2) return false;

    if (this.gameOver) {
      this.gameOver = false;
      this.winner = null;
      this.winPositions = [];
    }

    // 撤销 AI 的一步
    const aiMove = this.history.pop();
    this.board[aiMove.x][aiMove.y] = EMPTY;

    // 撤销玩家的一步
    const playerMove = this.history.pop();
    this.board[playerMove.x][playerMove.y] = EMPTY;

    this.currentPlayer = BLACK;
    return true;
  }

  // 获取最后一手的坐标，无则返回 null
  getLastMove() {
    if (this.history.length === 0) return null;
    return this.history[this.history.length - 1];
  }

  // 胜负判断：从 (x, y) 出发检查四个方向是否有五连
  checkWin(x, y, color) {
    const directions = [
      [1, 0],  // 水平
      [0, 1],  // 垂直
      [1, 1],  // 主对角线
      [1, -1], // 副对角线
    ];

    for (const [dx, dy] of directions) {
      const positions = [{ x, y }];

      // 正方向延伸
      for (let i = 1; i < 5; i++) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (this._inBounds(nx, ny) && this.board[nx][ny] === color) {
          positions.push({ x: nx, y: ny });
        } else {
          break;
        }
      }

      // 反方向延伸
      for (let i = 1; i < 5; i++) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (this._inBounds(nx, ny) && this.board[nx][ny] === color) {
          positions.push({ x: nx, y: ny });
        } else {
          break;
        }
      }

      if (positions.length >= 5) return positions;
    }

    return null;
  }

  _inBounds(x, y) {
    return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
  }
}
