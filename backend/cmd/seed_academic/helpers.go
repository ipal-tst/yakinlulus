package main

// b builds a bab with the given title and subbabs.
func b(title string, sub ...subbab) bab {
	return bab{Title: title, Subbab: sub}
}

// s builds a subbab with tujuan (competency/achievement goal) and topik.
func s(title string, tujuan []string, topik ...string) subbab {
	return subbab{Title: title, Tujuan: tujuan, Topik: topik}
}