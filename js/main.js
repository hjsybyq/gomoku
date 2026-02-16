// 五子棋入口：串联游戏逻辑、棋盘渲染、AI 模块

import { Game, BLACK, WHITE } from './game.js';
import { BoardRenderer } from './board.js';
import { AIPlayer } from './ai.js';

// 获取 DOM 元素
const canvas = document.getElementById('board');
const statusText = document.getElementById('status-text');
const thinkingIndicator = document.getElementById('thinking-indicator');
const moveCount = document.getElementById('move-count');
const btnUndo = document.getElementById('btn-undo');
const btnRestart = document.getElementById('btn-restart');
const resultModal = document.getElementById('result-modal');
const resultText = document.getElementById('result-text');
const btnPlayAgain = document.getElementById('btn-play-again');

// 创建游戏实例
const game = new Game();
const board = new BoardRenderer(canvas, game);
const ai = new AIPlayer();

// AI 是否正在思考（防止此时玩家操作）
let aiThinking = false;

// 棋盘点击事件
board.onClick = async (x, y) => {
  if (aiThinking || game.gameOver) return;
  if (game.currentPlayer !== BLACK) return;

  // 玩家落子
  if (!game.placePiece(x, y, BLACK)) return;
  board.render();
  updateStatus();

  if (game.gameOver) return;

  // AI 回合
  aiThinking = true;
  thinkingIndicator.classList.remove('hidden');
  statusText.textContent = 'AI 思考中...';

  const move = await ai.think(game.board, game.history);

  game.placePiece(move.x, move.y, WHITE);
  board.render();
  aiThinking = false;
  thinkingIndicator.classList.add('hidden');
  updateStatus();
};

// 悔棋
btnUndo.addEventListener('click', () => {
  if (aiThinking) return;
  if (game.undo()) {
    board.render();
    updateStatus();
  }
});

// 重新开始
btnRestart.addEventListener('click', () => startNewGame());
btnPlayAgain.addEventListener('click', () => {
  resultModal.classList.add('hidden');
  startNewGame();
});

// 游戏结束回调
game.onGameOver = (winner, positions) => {
  board.render();
  if (winner === BLACK) {
    resultText.textContent = '恭喜你赢了！';
  } else if (winner === WHITE) {
    resultText.textContent = 'AI 获胜，再接再厉！';
  } else {
    resultText.textContent = '平局！';
  }
  // 延迟弹窗，让玩家先看到最终局面
  setTimeout(() => resultModal.classList.remove('hidden'), 600);
};

// 更新状态信息
function updateStatus() {
  moveCount.textContent = game.history.length;
  if (!game.gameOver) {
    statusText.textContent = game.currentPlayer === BLACK
      ? '你的回合（黑棋）'
      : 'AI 的回合（白棋）';
  } else {
    if (game.winner === BLACK) {
      statusText.textContent = '你赢了！';
    } else if (game.winner === WHITE) {
      statusText.textContent = 'AI 获胜';
    } else {
      statusText.textContent = '平局';
    }
  }
}

// 开始新游戏
function startNewGame() {
  game.reset();
  board.render();
  aiThinking = false;
  thinkingIndicator.classList.add('hidden');
  updateStatus();
}

// 初始化
board.render();
updateStatus();
