<div align="center">

<span style="font-size: 28px;"><strong>《汉末江湖录》设计索引</strong></span>

</div>

---

本项目界面风格与规范以以下文件为准：

1. `docs/UI_DESIGN_SPEC.md` —— UI 设计规范，后续所有界面设计与实现的主依据。
2. `docs/mobile-ui-concept.html` —— 当前移动端游戏主界面概念，可交互体验场景、选择、成长与信息抽屉。
3. `docs/mobile-ui-concept-desktop.png` / `docs/mobile-ui-concept-mobile.png` —— 概念图静态预览。
4. `docs/ui-style-guide.html` —— 活样式指南，可直接在浏览器中查看组件、颜色、字体、间距与布局示例。
5. `docs/game-concept.html` —— 早期项目气质概念图，仅作视觉氛围参考，不再代表当前交互。

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
