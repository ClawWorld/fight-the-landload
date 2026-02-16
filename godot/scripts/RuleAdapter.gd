extends RefCounted
class_name RuleAdapter

const ORDER := {
	"3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
	"10": 10, "J": 11, "Q": 12, "K": 13, "A": 14, "2": 15,
	"BJ": 16, "RJ": 17
}

const BLOCKED_SEQ := {"2": true, "BJ": true, "RJ": true}

func _rank_sort(a: String, b: String) -> bool:
	return int(ORDER[a]) < int(ORDER[b])

func _sorted_keys(d: Dictionary) -> Array:
	var ks: Array = d.keys()
	ks.sort_custom(func(a, b): return _rank_sort(String(a), String(b)))
	return ks

func _is_consecutive(ranks: Array) -> bool:
	if ranks.is_empty():
		return false
	for i in range(1, ranks.size()):
		if int(ORDER[String(ranks[i])]) != int(ORDER[String(ranks[i - 1])]) + 1:
			return false
	return true

func _main_by_count(counts: Dictionary, target: int) -> Array:
	var r: Array = []
	for k in counts.keys():
		if int(counts[k]) == target:
			r.append(String(k))
	r.sort_custom(func(a, b): return _rank_sort(String(a), String(b)))
	return r

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
		for k in unique:
			if counts[k] == 3:
				return {"ok": true, "type": "TRIPLE_SINGLE", "main": String(k), "len": 4}

	if n == 5:
		var triple := ""
		var pair := ""
		for k in unique:
			if counts[k] == 3: triple = String(k)
			if counts[k] == 2: pair = String(k)
		if triple != "" and pair != "":
			return {"ok": true, "type": "TRIPLE_PAIR", "main": triple, "len": 5}

	# straight
	if unique.size() == n and n >= 5:
		var sorted = _sorted_keys(counts)
		var blocked = false
		for k in sorted:
			if BLOCKED_SEQ.has(String(k)):
				blocked = true
				break
		if not blocked and _is_consecutive(sorted):
			return {"ok": true, "type": "STRAIGHT", "main": String(sorted[-1]), "len": n}

	# consecutive pairs
	if n >= 6 and n % 2 == 0:
		var pairs = _main_by_count(counts, 2)
		if pairs.size() == n / 2:
			var blocked_pair = false
			for k in pairs:
				if BLOCKED_SEQ.has(String(k)):
					blocked_pair = true
					break
			if not blocked_pair and _is_consecutive(pairs):
				return {"ok": true, "type": "CONSECUTIVE_PAIRS", "main": String(pairs[-1]), "len": n}

	# airplane (no wings)
	if n >= 6 and n % 3 == 0:
		var triples = _main_by_count(counts, 3)
		if triples.size() == n / 3:
			var blocked_trip = false
			for k in triples:
				if BLOCKED_SEQ.has(String(k)):
					blocked_trip = true
					break
			if not blocked_trip and _is_consecutive(triples):
				return {"ok": true, "type": "AIRPLANE", "main": String(triples[-1]), "len": n, "chain": triples.size()}

	# four + two singles
	if n == 6:
		for k in unique:
			if counts[k] == 4:
				return {"ok": true, "type": "FOUR_TWO_SINGLES", "main": String(k), "len": 6}

	# four + two pairs
	if n == 8:
		var main4 := ""
		var pair_count := 0
		for k in unique:
			if counts[k] == 4: main4 = String(k)
			elif counts[k] == 2: pair_count += 1
		if main4 != "" and pair_count == 2:
			return {"ok": true, "type": "FOUR_TWO_PAIRS", "main": main4, "len": 8}

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
