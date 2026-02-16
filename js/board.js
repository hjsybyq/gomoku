// 五子棋 Canvas 棋盘渲染器

import { EMPTY, BLACK, WHITE, BOARD_SIZE } from './game.js';

export class BoardRenderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.cellSize = 40;   // 每格像素
    this.padding = 30;    // 棋盘边距
    this.hoverPos = null; // 鼠标悬停的棋盘坐标

    // 点击回调，由 main.js 设置
    this.onClick = null;
    this._renderScheduled = false; // requestAnimationFrame 节流标记

    this._initCanvas();
    this._bindEvents();
  }

  // 初始化 Canvas 尺寸，处理高 DPI
  _initCanvas() {
    const logicalSize = (BOARD_SIZE - 1) * this.cellSize + 2 * this.padding;
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = logicalSize * dpr;
    this.canvas.height = logicalSize * dpr;
    this.canvas.style.width = logicalSize + 'px';
    this.canvas.style.height = logicalSize + 'px';

    this.ctx.scale(dpr, dpr);
    this.logicalSize = logicalSize;
  }

  // 请求重绘（通过 requestAnimationFrame 节流）
  _scheduleRender() {
    if (this._renderScheduled) return;
    this._renderScheduled = true;
    requestAnimationFrame(() => {
      this._renderScheduled = false;
      this.render();
    });
  }

  // 绑定鼠标事件
  _bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const pos = this._pixelToBoard(e.offsetX, e.offsetY);
      const newHover = (pos && this.game.board[pos.x][pos.y] === EMPTY) ? pos : null;

      // 仅在悬停位置变化时才重绘
      const oldX = this.hoverPos?.x ?? -1;
      const oldY = this.hoverPos?.y ?? -1;
      const newX = newHover?.x ?? -1;
      const newY = newHover?.y ?? -1;
      if (oldX === newX && oldY === newY) return;

      this.hoverPos = newHover;
      this._scheduleRender();
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (!this.hoverPos) return;
      this.hoverPos = null;
      this._scheduleRender();
    });

    this.canvas.addEventListener('click', (e) => {
      const pos = this._pixelToBoard(e.offsetX, e.offsetY);
      if (pos) {
        this.onClick?.(pos.x, pos.y);
      }
    });
  }

  // 绘制完整棋盘
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.logicalSize, this.logicalSize);

    this._drawBoardBackground();
    this._drawGrid();
    this._drawStarPoints();
    this._drawPieces();
    this._drawLastMove();
    this._drawHover();

    if (this.game.gameOver && this.game.winPositions.length > 0) {
      this._drawWinLine(this.game.winPositions);
    }
  }

  // 棋盘木色背景
  _drawBoardBackground() {
    const ctx = this.ctx;
    ctx.fillStyle = '#dcb35c';
    ctx.fillRect(0, 0, this.logicalSize, this.logicalSize);
  }

  // 绘制网格线和坐标
  _drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 1;

    for (let i = 0; i < BOARD_SIZE; i++) {
      const pos = this.padding + i * this.cellSize;

      // 水平线
      ctx.beginPath();
      ctx.moveTo(this.padding, pos);
      ctx.lineTo(this.padding + (BOARD_SIZE - 1) * this.cellSize, pos);
      ctx.stroke();

      // 垂直线
      ctx.beginPath();
      ctx.moveTo(pos, this.padding);
      ctx.lineTo(pos, this.padding + (BOARD_SIZE - 1) * this.cellSize);
      ctx.stroke();
    }
  }

  // 绘制星位（天元 + 四个角星）
  _drawStarPoints() {
    const ctx = this.ctx;
    const starPoints = [
      { x: 3, y: 3 }, { x: 3, y: 11 },
      { x: 7, y: 7 },  // 天元
      { x: 11, y: 3 }, { x: 11, y: 11 },
    ];

    ctx.fillStyle = '#8b6914';
    for (const p of starPoints) {
      const [px, py] = this._boardToPixel(p.x, p.y);
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 绘制所有棋子
  _drawPieces() {
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        if (this.game.board[x][y] !== EMPTY) {
          this._drawPiece(x, y, this.game.board[x][y]);
        }
      }
    }
  }

  // 绘制单个棋子（径向渐变 + 阴影）
  _drawPiece(x, y, color) {
    const [px, py] = this._boardToPixel(x, y);
    const radius = this.cellSize * 0.43;
    const ctx = this.ctx;

    ctx.save();

    // 阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // 径向渐变实现立体感
    const gradient = ctx.createRadialGradient(
      px - radius * 0.3, py - radius * 0.3, radius * 0.1,
      px, py, radius
    );

    if (color === BLACK) {
      gradient.addColorStop(0, '#636363');
      gradient.addColorStop(1, '#0a0a0a');
    } else {
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(1, '#d0d0d0');
    }

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
  }

  // 绘制最后一手标记（小红点）
  _drawLastMove() {
    const last = this.game.getLastMove();
    if (!last) return;

    const [px, py] = this._boardToPixel(last.x, last.y);
    const ctx = this.ctx;

    ctx.fillStyle = '#e94560';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 绘制鼠标悬停预览（半透明棋子）
  _drawHover() {
    if (!this.hoverPos || this.game.gameOver) return;
    if (this.game.currentPlayer !== BLACK) return;

    const { x, y } = this.hoverPos;
    const [px, py] = this._boardToPixel(x, y);
    const radius = this.cellSize * 0.43;
    const ctx = this.ctx;

    ctx.save();
    ctx.globalAlpha = 0.4;

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#333';
    ctx.fill();

    ctx.restore();
  }

  // 高亮获胜的五子
  _drawWinLine(positions) {
    const ctx = this.ctx;

    for (const p of positions) {
      const [px, py] = this._boardToPixel(p.x, p.y);
      const radius = this.cellSize * 0.46;

      ctx.save();
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 像素坐标 → 棋盘坐标（就近吸附到交叉点）
  _pixelToBoard(px, py) {
    const x = Math.round((px - this.padding) / this.cellSize);
    const y = Math.round((py - this.padding) / this.cellSize);

    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return null;

    // 距离交叉点超过半格则忽略
    const [cx, cy] = this._boardToPixel(x, y);
    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    if (dist > this.cellSize * 0.45) return null;

    return { x, y };
  }

  // 棋盘坐标 → 像素坐标
  _boardToPixel(bx, by) {
    return [
      this.padding + bx * this.cellSize,
      this.padding + by * this.cellSize,
    ];
  }
}
