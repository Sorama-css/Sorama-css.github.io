---
title: TypeScript 类型体操入门
description: 从实际案例出发，介绍 TypeScript 高级类型的常用技巧，让你的类型系统更强大。
pubDate: 2024-05-18
tags: [技术, TypeScript, 前端]
---

## 为什么要学类型体操

TypeScript 的类型系统是图灵完备的。这意味着理论上，你可以在类型层面做任何计算。

但在实际开发中，我们只需要掌握一些常用的模式，就能极大提升代码的类型安全性。

## 基础：条件类型

条件类型是所有高级类型的基础：

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>;  // true
type B = IsString<123>;      // false
```

## 常用工具类型

TypeScript 内置了很多工具类型，了解它们的实现能帮助我们更好地理解类型系统：

### 1. Partial — 所有属性变为可选

```typescript
type Partial<T> = {
  [P in keyof T]?: T[P];
};

interface User { name: string; age: number; }
type PartialUser = Partial<User>;  // { name?: string; age?: number }
```

### 2. Pick — 选取部分属性

```typescript
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type UserName = Pick<User, 'name'>;  // { name: string }
```

### 3. Exclude — 排除某些类型

```typescript
type Exclude<T, U> = T extends U ? never : T;

type A = Exclude<'a' | 'b' | 'c', 'a'>;  // 'b' | 'c'
```

## 实战：函数参数类型推断

假设我们有一个函数，想获取它的参数类型：

```typescript
function greet(name: string, age: number): string {
  return `Hello ${name}, you are ${age} years old.`;
}

type Parameters<T> = T extends (...args: infer P) => any ? P : never;

type GreetParams = Parameters<typeof greet>;
// type GreetParams = [name: string, age: number]
```

这里的 `infer` 是关键——它让 TypeScript 自动推断类型。

## 实战：深度只读

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepReadonly<T[P]>
    : T[P];
};

interface Config {
  api: {
    baseUrl: string;
    timeout: number;
  };
  debug: boolean;
}

type ReadonlyConfig = DeepReadonly<Config>;
// 所有属性（包括嵌套）都变为 readonly
```

## 学习路径建议

1. **先理解基础**：条件类型、映射类型、`infer` 关键字
2. **阅读源码**：看看 TypeScript 内置工具类型的实现
3. **多做练习**：[type-challenges](https://github.com/type-challenges/type-challenges) 是个好地方
4. **在项目中应用**：试着把 `any` 替换成更精确的类型

类型体操不是目的，写出更安全、更易维护的代码才是。
