---
name: responsive-text-game-ui-designer
description: Designs mobile-first UI/UX for the choice-driven Three Kingdoms wuxia text RPG, with desktop expansion. Use whenever planning scene text, 2–5 contextual action choices, risk and condition labels, sticky action areas, character/evidence drawers, result feedback, run summaries, touch interaction, responsive behavior, accessibility, or the ink-paper visual system.
---

# Responsive Text Game UI Designer

## Purpose

Make a text-heavy, decision-dense game comfortable and atmospheric on phones without turning mobile into a reduced desktop terminal.

## Design principles

- Text is the primary visual asset; prioritize readability, rhythm, contrast and line length.
- The complete core flow must work without opening the software keyboard.
- Present only 2–5 contextual actions and make their differences legible.
- Keep scene, risk and immediate action within one continuous attention flow.
- Preserve atmosphere through typography, spacing, restrained ornament and narrative feedback.
- Show critical information directly; place secondary detail no deeper than one drawer.
- Use large touch targets and one-handed reach where practical.

## Default mobile layout

- Top: scenario, time pressure and compact critical state.
- Main: current scene, dialogue or combat prose.
- Inline: immediate state changes and new evidence.
- Sticky bottom: contextual action cards or buttons.
- Single-level drawers: character, specialties, inventory, relationships, known claims and jianghu chronicle.

Avoid a permanently visible command field. Natural-language help or optional conversation belongs in a secondary entry.

## Default desktop layout

- Center: scene text, result log and actions.
- Side area: character state, current objective, relationships and evidence summary.
- Optional secondary area: route or location context when it affects the decision.
- Keep the same choice hierarchy as mobile rather than inventing desktop-only core actions.

## Action component requirements

An action may show:

- a concise verb-led title;
- intent or likely gain;
- required identity, ability, item or relationship;
- primary cost or risk category;
- locked state when showing future build possibilities.

Do not imply one choice is correct merely because it uses the strongest button color. Use danger styling to communicate risk, not morality.

## Text and feedback

- Keep scene passages short enough for phone reading, but do not split prose into meaningless taps.
- After selection, show narrative result first and compact mechanical changes second.
- Make combat space, distance, injury and incoming threats understandable without graphics.
- Distinguish confirmed facts, claims, rumors and contradictions in the evidence UI.

## Accessibility

- Minimum touch target about 44 CSS px.
- Do not rely on color alone for danger, lock or success.
- Respect system text scaling and reduced-motion settings.
- Maintain readable contrast on paper-textured backgrounds.
- Avoid decorative fonts for long prose.

## Required output

When designing UI, include:

1. User scenario and decision context.
2. Mobile layout first.
3. Desktop adaptation.
4. Action hierarchy and visible information.
5. State/result feedback.
6. Accessibility and readability checks.
7. Edge cases: long options, locked choices, no valid action, interruption and resume.
8. MVP versus later enhancements.

## Avoid

- Tiny terminal layouts on phones.
- Command input as the main interaction.
- More than five simultaneous core actions.
- Hiding risk or conditions in a tooltip unavailable on touch.
- Decorative ancient-China elements that reduce readability.
- Multi-level menus for information needed to decide.
