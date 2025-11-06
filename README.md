# Welight Markdown Editor

> 基于微信 Markdown 编辑器的二次开发版本

## 项目介绍

Welight 是一款高度简洁的 Markdown 编辑器，支持 Markdown 语法、自定义主题样式、内容管理、多图床、AI 助手等特性。

## 技术栈

- Vue 3
- Vite 7
- TypeScript
- Pinia
- TailwindCSS
- CodeMirror 6

## 项目结构

```
welight/
├── apps/
│   └── web/              # Web 应用
├── packages/
│   ├── config/           # 配置包
│   ├── core/             # 核心功能包
│   └── shared/           # 共享工具包
├── public/               # 静态资源
└── package.json
```

## 开发指南

### 环境要求

- Node.js >= 22.16.0
- pnpm >= 10

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm start
```

访问 http://localhost:5173/md/

### 构建生产版本

```bash
pnpm web build
```

## 许可证

本项目基于原开源项目进行二次开发，仅供学习和商业使用。

