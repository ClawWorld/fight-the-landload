# Godot Manual Tests (RuleAdapter parity pass)

Run:
```bash
godot --path ~/.openclaw/workspace/landlord/godot > ~/.openclaw/workspace/tmp/landlord-godot.log 2>&1
```

## Basic expected behavior
- Select cards -> `Selected:` updates
- `Play` with invalid combo -> `Status: illegal -> ...`
- `Play` with valid combo -> `Status: Play OK ...`
- `Pass` -> clears last combo lock
- `Clear` -> clears current card selection only

## Combo smoke tests
- Single: `7`
- Pair: `4,4`
- Triple: `9,9,9`
- Bomb: `A,A,A,A`
- Rocket: `BJ,RJ`
- Straight: `7,8,9,10,J`
- Consecutive pairs: `4,4,5,5,6,6`
- Airplane(no wings): `4,4,4,5,5,5`
- Triple+single: `4,4,4,9`
- Triple+pair: `4,4,4,9,9`
- Four+two singles: `A,A,A,A,3,7`
- Four+two pairs: `A,A,A,A,5,5,7,7`

## Note
Current prototype hand is small/fixed, so not every combo can be tested in one run. This checklist is for iterative hand presets.
