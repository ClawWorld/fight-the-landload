extends Control

@onready var hand_container: HBoxContainer = $HandContainer
@onready var selected_info: Label = $SelectedInfo
@onready var play_button: Button = $PlayButton
@onready var pass_button: Button = $PassButton
@onready var status_label: Label = $Status

var hand_cards: Array[String] = ["3", "4", "4", "7", "9", "10", "J", "A", "2", "BJ"]
var selected_indices := {}

func _ready() -> void:
	play_button.pressed.connect(_on_play_pressed)
	pass_button.pressed.connect(_on_pass_pressed)
	_render_hand()
	_update_selected_label()
	status_label.text = "Status: prototype running"

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

func _selected_cards() -> Array[String]:
	var result: Array[String] = []
	for i in selected_indices.keys():
		result.append(hand_cards[i])
	result.sort()
	return result

func _update_selected_label() -> void:
	var selected := _selected_cards()
	if selected.is_empty():
		selected_info.text = "Selected: (none)"
	else:
		selected_info.text = "Selected: " + ", ".join(selected)

func _on_play_pressed() -> void:
	var selected := _selected_cards()
	if selected.is_empty():
		status_label.text = "Status: choose cards first"
		return

	status_label.text = "Status: Play -> [" + ", ".join(selected) + "] (rule adapter pending)"

func _on_pass_pressed() -> void:
	status_label.text = "Status: Pass"
