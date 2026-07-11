<div align="center">

<span style="font-size: 28px;"><strong>《汉末江湖录》设计索引</strong></span>

</div>

---

本项目界面风格与规范以以下文件为准：

1. `docs/UI_DESIGN_SPEC.md` —— UI 设计规范，后续所有界面设计与实现的主依据。
2. `docs/ui-style-guide.html` —— 活样式指南，可直接在浏览器中查看组件、颜色、字体、间距与布局示例。
3. `docs/game-concept.html` —— 游戏概念图，用于理解整体视觉气质和页面氛围。

# 当前视觉方向

**水墨宣纸 + 描金朱印 + 衬线古风**。

整体气质应当：

- 沉稳
- 雅致
- 有江湖气
- 文字为主角
- 古风但不牺牲现代可用性

# 使用规则

- 新 UI 设计与代码实现必须先阅读 `docs/UI_DESIGN_SPEC.md`。
- 颜色、字体、间距、圆角、阴影等 token 以 `docs/UI_DESIGN_SPEC.md` 和 `docs/ui-style-guide.html` 为准。
- 不再使用之前的复古终端 MUD 黑底绿字方向作为主视觉。
- 如需表现 MUD 感，应通过场景文本、战斗回显、持续状态、人物关系和规则反馈体现，而不是回到传统黑底终端视觉。
- 核心交互以移动端 2～5 个上下文行动选项为主，自然语言仅作为可选增强。
