extends Control

const RuleAdapter = preload("res://scripts/RuleAdapter.gd")

@onready var hand_container: HBoxContainer = $HandContainer
@onready var selected_info: Label = $SelectedInfo
@onready var play_button: Button = $PlayButton
@onready var pass_button: Button = $PassButton
@onready var clear_button: Button = $ClearButton
@onready var status_label: Label = $Status

var hand_cards: Array[String] = ["3", "4", "4", "7", "9", "10", "J", "A", "2", "BJ", "RJ"]
var selected_indices := {}
var adapter := RuleAdapter.new()
var last_combo: Dictionary = {}

func _ready() -> void:
	play_button.pressed.connect(_on_play_pressed)
	pass_button.pressed.connect(_on_pass_pressed)
	clear_button.pressed.connect(_on_clear_pressed)
	_render_hand()
	_update_selected_label()
	status_label.text = "Status: prototype running"
	print("[Landlord] UI ready")

func _render_hand() -> void:
	for child in hand_container.get_children():
		child.queue_free()

	for i in hand_cards.size():
		var btn := Button.new()
		btn.toggle_mode = true
		btn.text = hand_cards[i]
		btn.custom_minimum_size = Vector2(64, 72)
		btn.pressed.connect(_on_card_toggled.bind(i, btn))
		hand_container.add_child(btn)

func _on_card_toggled(index: int, btn: Button) -> void:
	if btn.button_pressed:
		selected_indices[index] = true
	else:
		selected_indices.erase(index)
	_update_selected_label()
	print("[Landlord] Selected => ", _selected_cards())

func _selected_cards() -> Array[String]:
	var result: Array[String] = []
	for i in selected_indices.keys():
		result.append(hand_cards[i])
	result.sort_custom(func(a: String, b: String): return adapter.ORDER[a] < adapter.ORDER[b])
	return result

func _selected_indices_sorted_desc() -> Array:
	var ids: Array = selected_indices.keys()
	ids.sort()
	ids.reverse()
	return ids

func _update_selected_label() -> void:
	var selected := _selected_cards()
	if selected.is_empty():
		selected_info.text = "Selected: (none)"
	else:
		selected_info.text = "Selected: " + ", ".join(selected)

func _clear_selection() -> void:
	selected_indices.clear()
	for child in hand_container.get_children():
		if child is Button:
			(child as Button).button_pressed = false
	_update_selected_label()

func _consume_selected_cards() -> void:
	for idx in _selected_indices_sorted_desc():
		hand_cards.remove_at(int(idx))
	selected_indices.clear()
	_render_hand()
	_update_selected_label()

func _on_play_pressed() -> void:
	var selected := _selected_cards()
	if selected.is_empty():
		status_label.text = "Status: choose cards first"
		print("[Landlord] Play blocked: empty selection")
		return

	var combo := adapter.identify_combo(selected)
	if not combo.get("ok", false):
		status_label.text = "Status: illegal -> " + String(combo.get("reason", "unknown"))
		print("[Landlord] Illegal combo => ", selected, " | reason=", combo.get("reason", "unknown"))
		return

	if not adapter.can_beat(last_combo, combo):
		status_label.text = "Status: does not beat last play"
		print("[Landlord] Cannot beat last combo => ", combo, " last=", last_combo)
		return

	last_combo = combo
	_consume_selected_cards()
	status_label.text = "Status: Play OK -> [" + ", ".join(selected) + "] type=" + String(combo["type"])
	print("[Landlord] Play OK => ", selected, " combo=", combo)

	if hand_cards.is_empty():
		status_label.text = "Status: You win (prototype)"
		print("[Landlord] WIN")

func _on_pass_pressed() -> void:
	last_combo = {}
	status_label.text = "Status: Pass (last combo cleared)"
	print("[Landlord] Pass; last combo cleared")

func _on_clear_pressed() -> void:
	_clear_selection()
	status_label.text = "Status: selection cleared"
	print("[Landlord] Selection cleared")
