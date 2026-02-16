# 五子棋 - Web 人机对战

基于纯前端实现的五子棋游戏，支持人机对战，15×15 标准棋盘。

![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange)
![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-yellow)
![AI](https://img.shields.io/badge/AI-Alpha--Beta%20剪枝-blue)

## 功能

- 人机对战，玩家执黑先行
- AI 使用 Negamax + Alpha-Beta 剪枝算法，难度适中
- 鼠标悬停预览落子位置
- 最后一手红点标记，获胜五子红圈高亮
- 支持悔棋和重新开始
- 深色主题，响应式布局

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/hjsybyq/gomoku.git
cd gomoku

# 启动本地服务器（需要 Python 3）
python -m http.server 8080
```

浏览器打开 http://localhost:8080 即可游戏。

> ES Modules 需要通过 HTTP 服务器访问，直接打开 HTML 文件会报跨域错误。

## 项目结构

```
├── index.html         # 主页面
├── css/
│   └── style.css      # 样式（深色主题）
└── js/
    ├── main.js        # 入口，模块串联与事件绑定
    ├── game.js        # 游戏逻辑（落子、胜负判断、悔棋）
    ├── board.js       # Canvas 棋盘渲染与交互
    └── ai.js          # AI 算法
```

## AI 算法

- **搜索算法**：Negamax + Alpha-Beta 剪枝，默认 4 层搜索深度
- **评估函数**：扫描四方向识别棋型（连五、活四、冲四、活三、眠三、活二等），按分值表累加
- **性能优化**：候选点限制为已有棋子周围 2 格范围、启发式排序、必杀/必防快速检测
