# Godot Client Skeleton (Planned)

This directory will host the Godot 4 desktop client.

## Structure
- `scenes/` Main menu, table, result scene
- `scripts/` UI and adapter scripts
- `assets/` cards, SFX, fonts
- `addons/` Steamworks integration plugin

## Integration Plan
1. Keep `src/core` as authoritative rules layer.
2. Port or mirror rules in GDScript/C# adapter.
3. Start with single-player local match UI.
4. Add Steam overlay + achievements + cloud save.

## First Godot Tasks
- Create `Main.tscn` + `Table.tscn`
- Implement hand rendering and card selection
- Bind "Play"/"Pass" buttons to state transitions
- Display legal/illegal feedback from rules engine
