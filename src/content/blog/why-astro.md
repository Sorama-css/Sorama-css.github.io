---
title: 为什么选择 Astro 构建静态博客
description: 对比主流静态站点生成器，分享选择 Astro 的核心理由与实际体验。
pubDate: 2024-02-20
tags: [技术, Astro, 前端]
cover: https://picsum.photos/seed/why-astro/600/400
coverAlt: Astro 构建博客封面
category: 技术
featured: true
---

## 静态站点生成器的选择

在搭建这个博客之前，我调研了市面上主流的 SSG 方案：

| 方案 | 语言 | 优势 | 劣势 |
|------|------|------|------|
| Hugo | Go | 构建极快，主题丰富 | Go 模板学习成本 |
| Next.js | React | 生态强大，功能全面 | 过于重量级 |
| VitePress | Vue | 简洁优雅，文档友好 | 更偏向文档站 |
| **Astro** | **多框架** | **岛屿架构，零 JS 默认** | **生态较新** |

## Astro 吸引我的地方

### 1. 岛屿架构（Islands Architecture）

Astro 最核心的创新就是**默认零 JavaScript**。页面只在需要交互的地方（"岛屿"）加载 JS，其余部分都是纯静态 HTML。这意味着：

- 更快的首屏加载
- 更好的 SEO
- 更低的资源消耗

```astro
---
// 这部分是静态的，不产生 JS
---

<!-- 这个组件只有在需要时才会水合 -->
<Search client:load />
```

### 2. 框架无关

你可以在同一个项目中使用 React、Vue、Svelte 等任意框架的组件。对于博客这种内容为主的站点，这种灵活性非常宝贵。

### 3. 内置内容集合

Astro 的 Content Collections 让管理 Markdown 内容变得异常简单：

```typescript
const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()),
  }),
});
```

类型安全的 frontmatter，告别手写出错。

## 总结

如果你也在寻找一个**简洁、快速、灵活**的博客方案，Astro 绝对值得一试。它不追求功能的大而全，而是把内容展示这件事做到极致。
