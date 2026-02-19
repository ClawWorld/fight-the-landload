extends Control
class_name GameManager

# Game state
enum Phase { BIDDING, PLAYING, FINISHED }
var current_phase: Phase = Phase.BIDDING

# Players
var players: Array[String] = ["Player", "AI_Left", "AI_Right"]
var current_player_idx: int = 0
var landlord: String = ""

# Hands
var hands: Dictionary = {}  # player_id -> array of card strings
var kitty: Array[String] = []  # 3 cards

# Bidding
var bids: Dictionary = {}  # player_id -> bid value (0=pass, 1,2,3)
var highest_bid: int = 0
var highest_bidder: String = ""

# Play state
var last_play: Dictionary = {}  # {player_id, cards, combo}
var trick_leader: String = ""
var pass_count: int = 0

# Score
var base_stake: int = 1
var multiplier: int = 1
var scores: Dictionary = {"Player": 0, "AI_Left": 0, "AI_Right": 0}

# UI References
@onready var player_hand_container: HBoxContainer = $PlayerArea/HandContainer
@onready var left_hand_label: Label = $LeftArea/HandCount
@onready var right_hand_label: Label = $RightArea/HandCount
@onready var kitty_label: Label = $KittyArea/KittyCards
@onready var status_label: Label = $StatusArea/StatusLabel
@onready var phase_label: Label = $StatusArea/PhaseLabel
@onready var bid_buttons: VBoxContainer = $BidArea
@onready var play_button: Button = $ActionArea/PlayButton
@onready var pass_button: Button = $ActionArea/PassButton
@onready var no_double_button: Button = $ActionArea/NoDoubleButton
@onready var bid_1_button: Button = $BidArea/Bid1
@onready var bid_2_button: Button = $BidArea/Bid2
@onready var bid_3_button: Button = $BidArea/Bid3
@onready var pass_bid_button: Button = $BidArea/PassBid
@onready var last_play_label: Label = $LastPlayArea/LastPlayCards

var adapter = preload("res://scripts/RuleAdapter.gd").new()

# Selection state
var selected_indices: Dictionary = {}

func _ready() -> void:
	# Connect bid buttons manually
	var bid_1 = $BidArea/Bid1
	var bid_2 = $BidArea/Bid2
	var bid_3 = $BidArea/Bid3
	var pass_bid = $BidArea/PassBid
	
	bid_1.pressed.connect(_on_bid_1_pressed)
	bid_2.pressed.connect(_on_bid_2_pressed)
	bid_3.pressed.connect(_on_bid_3_pressed)
	pass_bid.pressed.connect(_on_pass_bid_pressed)
	
	play_button.pressed.connect(_on_play_pressed)
	pass_button.pressed.connect(_on_pass_pressed)
	no_double_button.pressed.connect(_on_no_double_pressed)
	
	_start_new_game()

func _on_bid_1_pressed() -> void:
	make_bid("Player", 1)

func _on_bid_2_pressed() -> void:
	make_bid("Player", 2)

func _on_bid_3_pressed() -> void:
	make_bid("Player", 3)

func _on_pass_bid_pressed() -> void:
	make_bid("Player", 0)

func _start_new_game() -> void:
	# Reset state
	current_phase = Phase.BIDDING
	current_player_idx = 0
	landlord = ""
	bids = {}
	highest_bid = 0
	highest_bidder = ""
	last_play = {}
	trick_leader = ""
	pass_count = 0
	multiplier = 1
	
	# Generate deck
	var deck = _build_deck()
	_shuffle_deck(deck)
	_deal_cards(deck)
	
	_update_ui()
	_update_phase_label()
	_status("Game started! Player's turn to bid.")

func _build_deck() -> Array[String]:
	var suits = ["S", "H", "D", "C"]
	var ranks = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"]
	var deck: Array[String] = []
	
	for suit in suits:
		for rank in ranks:
			deck.append(rank + suit)
	deck.append("BJ")  # Black Joker
	deck.append("RJ")  # Red Joker
	
	return deck

func _shuffle_deck(deck: Array[String]) -> void:
	deck.shuffle()

func _deal_cards(deck: Array[String]) -> void:
	# Deal 17 cards to each player, 3 to kitty
	hands["Player"] = deck.slice(0, 17)
	hands["AI_Left"] = deck.slice(17, 34)
	hands["AI_Right"] = deck.slice(34, 51)
	kitty = deck.slice(51, 54)
	
	# Sort each hand
	for key in hands:
		hands[key].sort_custom(func(a, b): return adapter.ORDER[a] < adapter.ORDER[b])

func _update_ui() -> void:
	# Update player hand
	_update_player_hand_display()
	
	# Update opponent hand counts
	left_hand_label.text = "AI Left\n" + str(hands["AI_Left"].size()) + " cards"
	right_hand_label.text = "AI Right\n" + str(hands["AI_Right"].size()) + " cards"
	
	# Update kitty
	kitty_label.text = "Kitty: " + ", ".join(kitty)
	
	# Update buttons visibility
	bid_buttons.visible = current_phase == Phase.BIDDING and current_player() == "Player"
	play_button.visible = current_phase == Phase.PLAYING and current_player() == "Player"
	pass_button.visible = current_phase == Phase.PLAYING and current_player() == "Player" and last_play.has("player_id")
	no_double_button.visible = current_phase == Phase.PLAYING
	
	# Update last play display
	if last_play.has("cards"):
		var cards = last_play["cards"]
		var formatted = []
		for c in cards:
			formatted.append(_format_card(c))
		last_play_label.text = ", ".join(formatted) + "\n(" + str(last_play["player_id"]) + ")"
	else:
		last_play_label.text = "(none)"

func _update_player_hand_display() -> void:
	for child in player_hand_container.get_children():
		child.queue_free()
	
	var player_hand = hands["Player"]
	for i in range(player_hand.size()):
		var btn = Button.new()
		btn.toggle_mode = true
		btn.text = _format_card(player_hand[i])
		btn.custom_minimum_size = Vector2(50, 60)
		btn.pressed.connect(_on_card_toggled.bind(i, btn))
		player_hand_container.add_child(btn)

func _format_card(card: String) -> String:
	# Handle jokers properly
	if card == "BJ":
		return "小王"
	if card == "RJ":
		return "大王"
	# Regular cards: rank without suit
	var rank = card.substr(0, card.length() - 1)
	return rank

func _on_card_toggled(index: int, btn: Button) -> void:
	if btn.button_pressed:
		selected_indices[index] = true
	else:
		selected_indices.erase(index)
	_update_selection_label()

func _update_selection_label() -> void:
	var selected = _get_selected_cards()
	if selected.is_empty():
		status_label.text = "Selected: (none)"
	else:
		var formatted = []
		for c in selected:
			formatted.append(_format_card(c))
		status_label.text = "Selected: " + ", ".join(formatted)

func _get_selected_cards() -> Array[String]:
	var result: Array[String] = []
	for i in selected_indices.keys():
		result.append(hands["Player"][i])
	result.sort_custom(func(a, b): return adapter.ORDER[a] < adapter.ORDER[b])
	return result

func current_player() -> String:
	return players[current_player_idx]

func next_player() -> void:
	current_player_idx = (current_player_idx + 1) % 3

# ==================== BIDDING PHASE ====================

func _on_bid_pressed() -> void:
	# Override in bid buttons
	pass

func make_bid(player_id: String, bid_value: int) -> void:
	bids[player_id] = bid_value
	
	if bid_value > highest_bid:
		highest_bid = bid_value
		highest_bidder = player_id
	
	_status("%s bids %s" % [player_id, _bid_name(bid_value)])
	
	# Check if bidding is over
	if bids.size() == 3:
		_finish_bidding()

func _bid_name(bid: int) -> String:
	if bid == 0:
		return "Pass"
	if bid == 1 and not _has_higher_bid():
		return "1"
	return str(bid)

func _has_higher_bid() -> bool:
	return highest_bid >= 3 or (bids.values().count(0) >= 2 and highest_bid > 0)

func _finish_bidding() -> void:
	if highest_bid == 0:
		# All passed, restart
		_status("All passed! Starting new game...")
		await get_tree().create_timer(2.0).timeout
		_start_new_game()
		return
	
	landlord = highest_bidder
	hands[landlord].append_array(kitty)
	hands[landlord].sort_custom(func(a, b): return adapter.ORDER[a] < adapter.ORDER[b])
	
	current_phase = Phase.PLAYING
	current_player_idx = players.find(landlord)
	trick_leader = landlord
	last_play = {}
	
	multiplier = 1  # Reset multiplier
	base_stake = highest_bid
	
	_update_phase_label()
	_update_ui()
	_status("%s is landlord! Stake: %sx" % [landlord, base_stake])
	
	# Start playing
	_play_turn()

# ==================== PLAYING PHASE ====================

func _play_turn() -> void:
	var player = current_player()
	
	if player == "Player":
		_status("Your turn!")
		_update_ui()
	else:
		# AI plays
		_status("%s is thinking..." % player)
		await get_tree().create_timer(1.0 + randf()).timeout
		_ai_play(player)

func _ai_play(ai_id: String) -> void:
	var hand = hands[ai_id]
	var last_cards = []
	if last_play.has("cards"):
		last_cards = last_play["cards"]
	
	var play = _ai_choose_play(hand, last_cards)
	
	if play.is_empty():
		# Pass
		_ai_pass(ai_id)
	else:
		_ai_play_cards(ai_id, play)

func _ai_choose_play(hand: Array[String], last_cards: Array[String]) -> Array[String]:
	# Simple AI: try to play something that beats last play, or lead with lowest
	var hand_ranks = hand.duplicate()
	hand_ranks.sort_custom(func(a, b): return adapter.ORDER[a] < adapter.ORDER[b])
	
	if last_cards.is_empty():
		# Lead with lowest single
		return [hand_ranks[0]]
	
	# Try to find a valid play
	var last_combo = adapter.identify_combo(last_cards)
	if not last_combo.get("ok", false):
		return [hand_ranks[0]]
	
	# Try to beat with same type
	for i in range(hand.size()):
		for length in [1, 2, 3, 4, 5, 6]:
			if i + length > hand.size():
				break
			var candidate = hand.slice(i, i + length)
			candidate.sort_custom(func(a, b): return adapter.ORDER[a] < adapter.ORDER[b])
			var combo = adapter.identify_combo(candidate)
			if combo.get("ok", false) and adapter.can_beat(last_combo, combo):
				return candidate
	
	# Try bomb/rocket
	for i in range(hand.size() - 3):
		var bomb = hand.slice(i, i + 4)
		var combo = adapter.identify_combo(bomb)
		if combo.get("ok", false) and adapter.can_beat(last_combo, combo):
			return bomb
	
	# Check for rocket
	var has_bj = "BJ" in hand
	var has_rj = "RJ" in hand
	if has_bj and has_rj:
		var rocket = ["BJ", "RJ"]
		var combo = adapter.identify_combo(rocket)
		if adapter.can_beat(last_combo, combo):
			return rocket
	
	return []  # Pass

func _ai_play_cards(player_id: String, cards: Array[String]) -> void:
	# Remove cards from hand
	for card in cards:
		hands[player_id].erase(card)
	
	last_play = {"player_id": player_id, "cards": cards}
	trick_leader = player_id
	pass_count = 0
	
	# Check for bomb/rocket multiplier
	var combo = adapter.identify_combo(cards)
	if combo.get("type", "") in ["BOMB", "ROCKET"]:
		multiplier *= 2
	
	_status("%s plays: %s" % [player_id, ", ".join(cards)])
	
	# Check if player wins
	if hands[player_id].is_empty():
		_finish_game(player_id)
		return
	
	# Next player in rotation (not trick leader!)
	current_player_idx = (current_player_idx + 1) % 3
	_play_turn()

func _ai_pass(player_id: String) -> void:
	_status("%s passes" % player_id)
	pass_count += 1
	
	if pass_count >= 2:
		# Two passes - trick complete, previous leader plays again
		last_play = {}
		current_player_idx = players.find(trick_leader)
		if current_player_idx < 0:
			current_player_idx = players.find(landlord)
		trick_leader = ""
		pass_count = 0
		_status("Trick complete! %s leads again" % players[current_player_idx])
	else:
		# Next player in rotation
		current_player_idx = (current_player_idx + 1) % 3
	
	_play_turn()

func _on_play_pressed() -> void:
	var selected = _get_selected_cards()
	if selected.is_empty():
		_status("Select cards first!")
		return
	
	var combo = adapter.identify_combo(selected)
	if not combo.get("ok", false):
		_status("Invalid combo: " + str(combo.get("reason", "")))
		return
	
	if not last_play.is_empty() and not adapter.can_beat(last_play.get("combo", {}), combo):
		_status("Cannot beat last play!")
		return
	
	# Play cards
	for card in selected:
		hands["Player"].erase(card)
	
	last_play = {"player_id": "Player", "cards": selected, "combo": combo}
	trick_leader = "Player"
	pass_count = 0
	
	# Check for bomb/rocket
	if combo.get("type", "") in ["BOMB", "ROCKET"]:
		multiplier *= 2
	
	selected_indices.clear()
	_update_ui()
	_status("You play: %s" % ", ".join(selected))
	
	# Check win
	if hands["Player"].is_empty():
		_finish_game("Player")
		return
	
	# Next player in rotation
	current_player_idx = (current_player_idx + 1) % 3
	_play_turn()

func _on_pass_pressed() -> void:
	_status("You pass")
	pass_count += 1
	
	if pass_count >= 2:
		# Two passes - trick complete, player who played last leads
		last_play = {}
		current_player_idx = players.find(trick_leader)
		if current_player_idx < 0:
			current_player_idx = players.find(landlord)
		trick_leader = ""
		pass_count = 0
		_status("Trick complete! You lead.")
	else:
		# Next player in rotation
		current_player_idx = (current_player_idx + 1) % 3
	
	_play_turn()

func _on_no_double_pressed() -> void:
	# Simplified: just pass for now
	_on_pass_pressed()

func _finish_game(winner: String) -> void:
	current_phase = Phase.FINISHED
	
	# Calculate scores
	var stake = base_stake * multiplier
	var landlord_won = (winner == landlord)
	
	var score_changes = {}
	if landlord_won:
		score_changes[landlord] = stake * 2
		for p in players:
			if p != landlord:
				score_changes[p] = -stake
	else:
		score_changes[landlord] = -stake * 2
		for p in players:
			if p != landlord:
				score_changes[p] = stake
	
	# Update total scores
	for p in score_changes:
		scores[p] += score_changes[p]
	
	_status("Game over! %s wins! Score changes: %s" % [winner, str(score_changes)])
	_update_ui()

func _status(msg: String) -> void:
	status_label.text = msg
	print("[Game] ", msg)

func _update_phase_label() -> void:
	var phase_name = "Unknown"
	match current_phase:
		Phase.BIDDING:
			phase_name = "Bidding Phase"
		Phase.PLAYING:
			phase_name = "Playing Phase"
		Phase.FINISHED:
			phase_name = "Game Over"
	phase_label.text = phase_name
