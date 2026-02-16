# TECH_PLAN.md

## 1) Product Scope
### Release 1 (must-have)
- English UI
- 3-player Dou Dizhu (1 human + 2 AI)
- Correct hand validation and compare logic
- Call Landlord flow
- Turn timer and pass flow
- End-of-round scoring
- Desktop support: Windows/macOS/Linux

### Release 2 (post-launch)
- Online room-based multiplayer
- Ranked mode
- Replays
- Leaderboards

## 2) Suggested Stack
- Game engine: Godot 4.x
- Logic source of truth: deterministic rules engine
- Build: GitHub Actions for desktop exports
- Distribution: Steamworks

## 3) Core Domain Rules (high-level)
- Deck: 54 cards (3..A, 2, black joker, red joker)
- Deal: 17 cards/player + 3 landlord cards
- Bidding: score-call flow (implementation variant configurable)
- Winning condition: first player to empty hand

## 4) Combo Types (target full support)
- Rocket
- Bomb
- Single
- Pair
- Triple
- Triple + Single
- Triple + Pair
- Straight (>=5, excludes 2/jokers)
- Consecutive Pairs (>=3 pairs)
- Airplane (>=2 triples)
- Airplane + singles / pairs
- Four + two singles / two pairs

## 5) Architecture
- `deck.js`: card creation and shuffle/deal
- `combo.js`: identify combo type and metadata
- `compare.js`: legal response comparison
- `state.js`: game/round state transitions
- `ai.js`: playable set generation + heuristic pick

## 6) Immediate Build Order
1. Deterministic core rules + tests
2. CLI simulation runner
3. Godot adapter layer
4. UI and interactions
5. Steam integration

## 7) Risks
- Combo correctness complexity
- Multiplayer synchronization later
- macOS notarization pipeline

Mitigation: lock logic with high test coverage before full UI.
