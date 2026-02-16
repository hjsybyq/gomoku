// 五子棋 AI：Negamax + Alpha-Beta 剪枝

import { EMPTY, BLACK, WHITE, BOARD_SIZE } from './game.js';

// 棋型分值表
const SCORE = {
  FIVE: 1000000,       // 连五
  LIVE_FOUR: 100000,   // 活四
  RUSH_FOUR: 10000,    // 冲四
  LIVE_THREE: 5000,    // 活三
  SLEEP_THREE: 500,    // 眠三
  LIVE_TWO: 200,       // 活二
  SLEEP_TWO: 50,       // 眠二
  LIVE_ONE: 10,        // 活一
};

export class AIPlayer {
  constructor() {
    this.aiColor = WHITE;
    this.humanColor = BLACK;
    this.maxDepth = 4;          // 默认搜索深度
    this.onThinking = null;     // 思考状态回调
  }

  // 异步接口，避免阻塞 UI
  async think(board, history) {
    this.onThinking?.(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        const move = this._findBestMove(board, history);
        this.onThinking?.(false);
        resolve(move);
      }, 50);
    });
  }

  // 寻找最佳落子点
  _findBestMove(board, history) {
    // 第一手：下在天元
    if (history.length <= 1) {
      const center = Math.floor(BOARD_SIZE / 2);
      if (board[center][center] === EMPTY) {
        return { x: center, y: center };
      }
      // 天元被占则下在旁边
      return { x: center + 1, y: center };
    }

    // 必杀/必防检测
    const urgentMove = this._checkUrgent(board);
    if (urgentMove) return urgentMove;

    // 根据棋子数调整搜索深度
    const pieceCount = history.length;
    const depth = pieceCount < 6 ? 2 : this.maxDepth;

    // 生成候选点并启发式排序
    const candidates = this._getCandidates(board);
    this._sortCandidates(candidates, board, this.aiColor);

    let bestScore = -Infinity;
    let bestMove = candidates[0]; // 兜底

    for (const { x, y } of candidates) {
      board[x][y] = this.aiColor;
      const score = -this._negamax(board, depth - 1, -Infinity, -bestScore, this.humanColor);
      board[x][y] = EMPTY;

      if (score > bestScore) {
        bestScore = score;
        bestMove = { x, y };
      }
    }

    return bestMove;
  }

  // Negamax + Alpha-Beta 剪枝
  _negamax(board, depth, alpha, beta, color) {
    // 终止条件
    if (depth === 0) {
      const score = this._evaluate(board);
      return color === this.aiColor ? score : -score;
    }

    const candidates = this._getCandidates(board);
    if (candidates.length === 0) return 0;

    this._sortCandidates(candidates, board, color);

    // 限制候选点数量，提升性能
    const maxCandidates = depth >= 3 ? 12 : 15;
    const limited = candidates.slice(0, maxCandidates);

    let bestScore = -Infinity;

    for (const { x, y } of limited) {
      board[x][y] = color;

      // 检查是否获胜
      if (this._hasWin(board, x, y, color)) {
        board[x][y] = EMPTY;
        return 1000000 - (this.maxDepth - depth); // 越快赢分越高
      }

      const nextColor = color === this.aiColor ? this.humanColor : this.aiColor;
      const score = -this._negamax(board, depth - 1, -beta, -alpha, nextColor);
      board[x][y] = EMPTY;

      if (score > bestScore) bestScore = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) break; // 剪枝
    }

    return bestScore;
  }

  // 必杀/必防检测
  _checkUrgent(board) {
    const candidates = this._getCandidates(board);

    // 检查 AI 是否能直接赢（活四/冲四）
    for (const { x, y } of candidates) {
      board[x][y] = this.aiColor;
      if (this._hasWin(board, x, y, this.aiColor)) {
        board[x][y] = EMPTY;
        return { x, y };
      }
      board[x][y] = EMPTY;
    }

    // 检查是否需要防守对手的活四/冲四
    for (const { x, y } of candidates) {
      board[x][y] = this.humanColor;
      if (this._hasWin(board, x, y, this.humanColor)) {
        board[x][y] = EMPTY;
        return { x, y };
      }
      board[x][y] = EMPTY;
    }

    return null;
  }

  // 快速检查 (x, y) 处落子后是否形成五连
  _hasWin(board, x, y, color) {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (const [dx, dy] of directions) {
      let count = 1;

      for (let i = 1; i < 5; i++) {
        const nx = x + dx * i, ny = y + dy * i;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === color) {
          count++;
        } else break;
      }

      for (let i = 1; i < 5; i++) {
        const nx = x - dx * i, ny = y - dy * i;
        if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === color) {
          count++;
        } else break;
      }

      if (count >= 5) return true;
    }

    return false;
  }

  // 生成候选落子点：已有棋子周围 2 格内的空位
  _getCandidates(board) {
    const candidateSet = new Set();

    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        if (board[x][y] !== EMPTY) {
          // 周围 2 格范围
          for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[nx][ny] === EMPTY) {
                candidateSet.add(nx * BOARD_SIZE + ny);
              }
            }
          }
        }
      }
    }

    return Array.from(candidateSet).map((key) => ({
      x: Math.floor(key / BOARD_SIZE),
      y: key % BOARD_SIZE,
    }));
  }

  // 对候选点按评估分数降序排序
  _sortCandidates(candidates, board, color) {
    const opponent = color === this.aiColor ? this.humanColor : this.aiColor;

    for (const c of candidates) {
      // 快速评估该位置的价值
      board[c.x][c.y] = color;
      const attackScore = this._evaluatePoint(board, c.x, c.y, color);
      board[c.x][c.y] = EMPTY;

      board[c.x][c.y] = opponent;
      const defendScore = this._evaluatePoint(board, c.x, c.y, opponent);
      board[c.x][c.y] = EMPTY;

      c.score = Math.max(attackScore, defendScore * 0.9);
    }

    candidates.sort((a, b) => b.score - a.score);
  }

  // 评估某点落子后该棋子参与的棋型分值
  _evaluatePoint(board, x, y, color) {
    let score = 0;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (const [dx, dy] of directions) {
      score += this._evaluateLine(board, x, y, dx, dy, color);
    }

    return score;
  }

  // 评估单条线上的棋型
  _evaluateLine(board, x, y, dx, dy, color) {
    const opponent = color === this.aiColor ? this.humanColor : this.aiColor;

    // 向两个方向扫描，收集连续同色棋子数和两端空位情况
    let count = 1;
    let openEnds = 0;
    let blocked = 0;

    // 正方向
    let consecutive = 0;
    for (let i = 1; i <= 4; i++) {
      const nx = x + dx * i, ny = y + dy * i;
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) {
        blocked++;
        break;
      }
      if (board[nx][ny] === color) {
        consecutive++;
      } else if (board[nx][ny] === EMPTY) {
        openEnds++;
        break;
      } else {
        blocked++;
        break;
      }
    }
    count += consecutive;

    // 反方向
    consecutive = 0;
    for (let i = 1; i <= 4; i++) {
      const nx = x - dx * i, ny = y - dy * i;
      if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) {
        blocked++;
        break;
      }
      if (board[nx][ny] === color) {
        consecutive++;
      } else if (board[nx][ny] === EMPTY) {
        openEnds++;
        break;
      } else {
        blocked++;
        break;
      }
    }
    count += consecutive;

    // 两端都被堵，无价值
    if (openEnds === 0 && count < 5) return 0;

    // 根据连子数和开放端评分
    if (count >= 5) return SCORE.FIVE;
    if (count === 4) {
      if (openEnds === 2) return SCORE.LIVE_FOUR;
      if (openEnds === 1) return SCORE.RUSH_FOUR;
    }
    if (count === 3) {
      if (openEnds === 2) return SCORE.LIVE_THREE;
      if (openEnds === 1) return SCORE.SLEEP_THREE;
    }
    if (count === 2) {
      if (openEnds === 2) return SCORE.LIVE_TWO;
      if (openEnds === 1) return SCORE.SLEEP_TWO;
    }
    if (count === 1) {
      if (openEnds === 2) return SCORE.LIVE_ONE;
    }

    return 0;
  }

  // 全局评估函数：AI 视角
  _evaluate(board) {
    let aiScore = 0;
    let humanScore = 0;

    // 扫描所有位置
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        if (board[x][y] === this.aiColor) {
          aiScore += this._evaluatePoint(board, x, y, this.aiColor);
        } else if (board[x][y] === this.humanColor) {
          humanScore += this._evaluatePoint(board, x, y, this.humanColor);
        }
      }
    }

    return aiScore - humanScore * 1.1; // 防守权重略高
  }
}
