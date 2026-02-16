# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言与沟通

- 所有回复使用中文（中文）
- 代码注释使用中文

## 项目概述

Web 版五子棋游戏，纯前端实现，支持人机对战，15×15 标准棋盘。

## 开发命令

```bash
# 启动本地开发服务器（ES Modules 需要 HTTP 服务器）
uv run python -m http.server 8080
# 然后访问 http://localhost:8080
```

## 架构

纯前端项目，使用 ES Modules 组织，无框架依赖。

- `js/game.js` — Game 类：棋盘状态、落子、胜负判断、悔棋
- `js/board.js` — BoardRenderer 类：Canvas 棋盘渲染、鼠标交互
- `js/ai.js` — AIPlayer 类：Negamax + Alpha-Beta 剪枝 AI 算法
- `js/main.js` — 入口文件：模块串联、DOM 事件绑定、游戏流程控制

模块间通过回调函数通信：`main.js` 创建实例并设置回调串联 Board → Game → AI 的落子循环。

## AI 算法要点

- 搜索：Negamax + Alpha-Beta 剪枝，默认 4 层深度
- 评估：扫描四方向识别棋型（连五/活四/冲四/活三等），按分值表累加
- 优化：候选点限制为已有棋子周围 2 格、启发式排序、必杀/必防快速检测
