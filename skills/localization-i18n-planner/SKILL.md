---
name: localization-i18n-planner
description: Plans internationalization and localization for the Chinese-first, choice-driven Three Kingdoms wuxia text RPG. Use whenever designing text keys, historical and martial terminology, action labels, risk hints, MUD-style prose, dynamic jianghu commentary, evidence records, translation workflows, fonts, or layouts for English and other language releases.
---

# Localization i18n Planner

## Purpose

Prepare the game for multiple languages without damaging Chinese historical-wuxia flavor, obscuring player decisions, or hardcoding prose into the UI.

## Principles

- Chinese source prose may be literary, but action labels, requirements and risks must remain immediately clear.
- Separate scene prose, dialogue, action text, state feedback, evidence, names and system UI.
- Create a historical and wuxia glossary before translation.
- Give translators context: speaker, date, faction, source reliability, tone and variable meaning.
- Avoid variable interpolation patterns that break grammar in other languages.
- Keep text keys stable even when source text changes.
- Design mobile layouts for translated action labels that may be substantially longer than Chinese.

## Text categories

- `ui`: navigation, drawers, settings and accessibility;
- `scenario`: titles, historical context and stage summaries;
- `scene`: narration and environmental descriptions;
- `dialogue`: speaker-specific lines;
- `action`: title, intent, requirement and risk hint;
- `state`: resource and relationship changes;
- `claim`: sourced statements, confidence and contradiction labels;
- `ending`: protagonist result, character fate and jianghu commentary;
- `glossary`: people, places, offices, factions, weapons and techniques.

## Naming strategy

For English translation, choose one strategy per category and apply it consistently:

- Historical names: usually Pinyin, with context supplied outside the name when needed.
- Locations: retain proper-name identity while translating generic geographic parts consistently.
- Offices and ranks: use a maintained glossary and add concise context when literal equivalence misleads.
- Martial arts: translate meaning when evocative; preserve Pinyin when culturally specific and support it through glossary text.
- Factions: prioritize readable, consistent names over word-for-word translation.

## Dynamic text guidance

Do not build literary ending prose by concatenating many fragments. Prefer authored templates at the sentence or paragraph level with controlled variants. Keep grammar-sensitive variables typed and documented.

## Required output

When planning localization, include:

1. Text categories and ownership.
2. Key naming convention.
3. Example source records with context metadata.
4. Glossary entries.
5. Translator and historical notes.
6. Variable and fallback rules.
7. Mobile length and font risks.
8. QA checks for missing, truncated and inconsistent text.

## Avoid

- Hardcoding Chinese text in components.
- Translating names inconsistently across scenes, evidence and endings.
- Treating rumors and confirmed facts identically in translation.
- UI layouts that only tolerate Chinese string length.
- Fragment-based procedural prose that produces broken grammar.
