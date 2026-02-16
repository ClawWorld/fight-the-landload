# Landlord (Dou Dizhu) - Steam Cross-Platform Project

English PC game targeting Steam on Windows/macOS/Linux.

## Current Direction
- Engine target for full game: **Godot 4** (desktop export + Steamworks integration)
- First implementation track: **rules engine in JavaScript** (headless, testable)
  - This lets us lock rules early and reuse logic in Godot/C# or GDScript.

## Project Goals
1. Full English gameplay experience
2. Accurate Dou Dizhu rules and card comparisons
3. Single-player (AI) first, online multiplayer second
4. Steam integration: achievements + cloud save + overlay

## Current Repository Layout
- `docs/` - product/tech notes, milestones, checklists
- `src/core/` - headless game logic (deck, dealing, combo validation, turn state)
- `test/` - automated rules tests
- `scripts/` - local run scripts

## Local Commands
```bash
node --test
node scripts/demo-round.js
```

## Next Milestones
- [x] Bootstrapped workspace and technical direction
- [ ] Complete combo parser/comparator coverage
- [ ] Round flow state machine
- [ ] AI v1 (heuristic)
- [ ] Godot front-end integration
- [ ] Steamworks integration and packaging
