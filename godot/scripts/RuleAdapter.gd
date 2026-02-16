extends RefCounted
class_name RuleAdapter

const ORDER := {
	"3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
	"10": 10, "J": 11, "Q": 12, "K": 13, "A": 14, "2": 15,
	"BJ": 16, "RJ": 17
}

func identify_combo(ranks: Array[String]) -> Dictionary:
	if ranks.is_empty():
		return {"ok": false, "reason": "empty selection"}

	var counts := {}
	for r in ranks:
		counts[r] = int(counts.get(r, 0)) + 1

	var unique := counts.keys()
	var n := ranks.size()

	if n == 2 and counts.has("BJ") and counts.has("RJ"):
		return {"ok": true, "type": "ROCKET", "main": "RJ", "len": 2}

	if n == 1:
		return {"ok": true, "type": "SINGLE", "main": ranks[0], "len": 1}

	if n == 2 and unique.size() == 1 and counts[unique[0]] == 2:
		return {"ok": true, "type": "PAIR", "main": String(unique[0]), "len": 2}

	if n == 3 and unique.size() == 1 and counts[unique[0]] == 3:
		return {"ok": true, "type": "TRIPLE", "main": String(unique[0]), "len": 3}

	if n == 4:
		for k in unique:
			if counts[k] == 4:
				return {"ok": true, "type": "BOMB", "main": String(k), "len": 4}

	return {"ok": false, "reason": "unsupported combo in current prototype"}

func can_beat(last_combo: Dictionary, new_combo: Dictionary) -> bool:
	if not new_combo.get("ok", false):
		return false
	if last_combo.is_empty():
		return true

	var new_type := String(new_combo.get("type", ""))
	var last_type := String(last_combo.get("type", ""))

	if new_type == "ROCKET":
		return true
	if last_type == "ROCKET":
		return false

	if new_type == "BOMB" and last_type != "BOMB":
		return true
	if last_type == "BOMB" and new_type != "BOMB":
		return false

	if new_type != last_type:
		return false
	if int(new_combo.get("len", 0)) != int(last_combo.get("len", -1)):
		return false

	return int(ORDER[String(new_combo.get("main", "3"))]) > int(ORDER[String(last_combo.get("main", "RJ"))])
