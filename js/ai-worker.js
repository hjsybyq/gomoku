// AI Web Worker：在独立线程中运行 AI 计算，避免阻塞主线程

import { AIPlayer } from './ai.js';

const ai = new AIPlayer();

// 接收主线程消息，执行 AI 计算并返回结果
self.onmessage = (e) => {
  const { board, history } = e.data;
  const move = ai.findBestMove(board, history);
  self.postMessage(move);
};
