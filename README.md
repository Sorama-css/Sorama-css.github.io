# 素记 · Plain Blog

一个极简素雅的静态博客，基于 Astro 构建。

## 功能特性

- ✍️ Markdown 文章渲染（支持代码高亮）
- 🏷️ 标签/分类系统
- 🔍 全文搜索（实时匹配 + 关键词高亮）
- 📡 RSS 订阅
- 🌙 明暗主题切换
- 📱 响应式设计
- ✨ CSS/JS 动画效果

## 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:4321

## 构建发布

```bash
npm run build
```

## 目录结构

```
src/
├── content/blog/    # Markdown 文章
├── layouts/         # 页面布局
├── components/      # 组件
└── pages/           # 页面路由
public/
├── styles/          # 全局样式
└── scripts/         # 前端脚本
```