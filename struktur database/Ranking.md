Untuk **YakinLulus.id**, **Ranking** bukan hanya leaderboard nilai, tetapi merupakan sistem pemeringkatan akademik yang menghitung performa siswa berdasarkan berbagai dimensi, seperti hasil CBT, latihan, kecepatan pengerjaan, tingkat kesulitan soal, konsistensi belajar, dan pencapaian (achievement). Domain ini juga harus mendukung ranking **harian, mingguan, bulanan, semester, tahunan**, serta ranking berdasarkan sekolah, kelas, provinsi, nasional, mata pelajaran, dan paket ujian.

Karena ranking sering diakses namun relatif jarang diperbarui, gunakan kombinasi **materialized leaderboard** (snapshot) dan **event-driven recalculation** melalui background worker.

---

# Database Ranking

```text
Schema

ranking
```

---

# 1. ranking_categories

Master kategori ranking.

```text
ranking_categories
------------------

id (uuid)

category_code
category_name

description

ranking_type

OVERALL
ACADEMIC
EXAM
PRACTICE
SUBJECT
SPEED
CONSISTENCY
ACHIEVEMENT
STREAK
CUSTOM

scope

GLOBAL
PROVINCE
CITY
SCHOOL
CLASS
GROUP

is_active

created_at

updated_at
```

Unique

```text
category_code
```

---

# 2. ranking_periods

Periode ranking.

```text
ranking_periods
---------------

id

period_name

period_type

DAILY
WEEKLY
MONTHLY
QUARTERLY
SEMESTER
YEARLY
CUSTOM

start_date

end_date

is_closed

created_at
```

---

# 3. leaderboards

Master leaderboard.

```text
leaderboards
------------

id

leaderboard_code

leaderboard_name

category_id

period_id

scope

GLOBAL
PROVINCE
CITY
SCHOOL
CLASS

province_id

city_id

school_id

class_id

subject_id

exam_id

is_active

created_at
```

---

# 4. leaderboard_entries

Snapshot hasil ranking.

```text
leaderboard_entries
-------------------

id

leaderboard_id

user_id

rank_position

score

weighted_score

correct_answer

wrong_answer

unanswered

accuracy

average_score

average_duration

total_exam

total_practice

total_study_minutes

consistency_score

speed_score

achievement_score

streak_score

bonus_score

penalty_score

percentile

previous_rank

rank_change

created_at
```

Index

```text
leaderboard_id

rank_position

user_id
```

---

# 5. ranking_scores

Nilai mentah yang digunakan untuk perhitungan ranking.

```text
ranking_scores
--------------

id

user_id

category_id

subject_id

exam_session_id

score_type

EXAM
PRACTICE
HOMEWORK
TRYOUT
DAILY

raw_score

normalized_score

weighted_score

difficulty_factor

speed_factor

accuracy_factor

bonus_factor

penalty_factor

final_score

calculated_at
```

---

# 6. ranking_formula

Formula ranking.

```text
ranking_formula
---------------

id

formula_name

category_id

description

accuracy_weight

speed_weight

difficulty_weight

consistency_weight

streak_weight

achievement_weight

bonus_weight

penalty_weight

formula_expression

version

is_active

created_at
```

---

# 7. ranking_calculation_jobs

Job perhitungan ranking.

```text
ranking_calculation_jobs
------------------------

id

job_name

leaderboard_id

period_id

status

PENDING
RUNNING
SUCCESS
FAILED

total_user

processed_user

duration_ms

started_at

finished_at

created_at
```

---

# 8. ranking_history

Riwayat perubahan ranking.

```text
ranking_history
---------------

id

user_id

leaderboard_id

old_rank

new_rank

rank_difference

old_score

new_score

changed_reason

created_at
```

---

# 9. user_rank_summary

Ringkasan ranking setiap user.

```text
user_rank_summary
-----------------

id

user_id

global_rank

province_rank

city_rank

school_rank

class_rank

average_rank

best_rank

highest_score

total_leaderboard

last_updated
```

---

# 10. subject_rankings

Ranking per mata pelajaran.

```text
subject_rankings
----------------

id

user_id

subject_id

leaderboard_id

rank

score

accuracy

speed

exam_count

practice_count

created_at
```

---

# 11. exam_rankings

Ranking per ujian.

```text
exam_rankings
-------------

id

exam_id

exam_session_id

user_id

rank

score

correct_answer

wrong_answer

duration

percentile

created_at
```

---

# 12. school_rankings

Ranking sekolah.

```text
school_rankings
---------------

id

school_id

leaderboard_id

rank

average_score

highest_score

participant_count

exam_count

created_at
```

---

# 13. class_rankings

Ranking kelas.

```text
class_rankings
--------------

id

class_id

leaderboard_id

rank

average_score

highest_score

participant_count

created_at
```

---

# 14. province_rankings

Ranking provinsi.

```text
province_rankings
-----------------

id

province_id

leaderboard_id

rank

average_score

participant_count

created_at
```

---

# 15. city_rankings

Ranking kabupaten/kota.

```text
city_rankings
-------------

id

city_id

leaderboard_id

rank

average_score

participant_count

created_at
```

---

# 16. ranking_rewards

Reward ranking.

```text
ranking_rewards
---------------

id

leaderboard_id

minimum_rank

maximum_rank

reward_type

BADGE
POINT
COIN
CERTIFICATE
MEMBERSHIP
TROPHY

reward_value

description

created_at
```

---

# 17. user_ranking_rewards

Reward yang diterima user.

```text
user_ranking_rewards
--------------------

id

user_id

reward_id

leaderboard_id

received_at

claimed_at

status

PENDING
CLAIMED
EXPIRED
```

---

# 18. ranking_badges

Master badge.

```text
ranking_badges
--------------

id

badge_code

badge_name

icon

color

description

level

BRONZE
SILVER
GOLD
PLATINUM
DIAMOND

created_at
```

---

# 19. user_ranking_badges

Badge user.

```text
user_ranking_badges
-------------------

id

user_id

badge_id

leaderboard_id

earned_at
```

---

# 20. ranking_achievements

Achievement yang mempengaruhi ranking.

```text
ranking_achievements
--------------------

id

achievement_code

achievement_name

score_bonus

description

created_at
```

---

# 21. user_ranking_achievements

```text
user_ranking_achievements
-------------------------

id

user_id

achievement_id

earned_at
```

---

# 22. ranking_streaks

Streak belajar.

```text
ranking_streaks
---------------

id

user_id

current_streak

longest_streak

total_day

last_activity

streak_score

updated_at
```

---

# 23. ranking_notifications

Notifikasi perubahan ranking.

```text
ranking_notifications
---------------------

id

user_id

leaderboard_id

notification_type

RANK_UP
RANK_DOWN
NEW_BADGE
NEW_REWARD

title

message

is_read

created_at
```

---

# 24. ranking_statistics

Statistik leaderboard.

```text
ranking_statistics
------------------

id

leaderboard_id

participant_count

average_score

median_score

highest_score

lowest_score

standard_deviation

generated_at
```

---

# 25. ranking_settings

Konfigurasi sistem ranking.

```text
ranking_settings
----------------

id

key

value

description

updated_at
```

Contoh konfigurasi:

```text
AUTO_CALCULATE=true
CACHE_DURATION=300
MAX_LEADERBOARD=1000
ENABLE_PERCENTILE=true
ENABLE_SPEED_SCORE=true
ENABLE_STREAK=true
ENABLE_REWARD=true
```

---

# Relasi Antar Tabel

```text
ranking_categories
        │
        ├──────── leaderboards
        ├──────── ranking_formula
        └──────── ranking_scores

ranking_periods
        │
        └──────── leaderboards

leaderboards
        │
        ├──────── leaderboard_entries
        ├──────── ranking_history
        ├──────── ranking_rewards
        ├──────── ranking_statistics
        ├──────── school_rankings
        ├──────── class_rankings
        ├──────── province_rankings
        ├──────── city_rankings
        ├──────── subject_rankings
        ├──────── exam_rankings
        └──────── ranking_calculation_jobs

ranking_rewards
        │
        └──────── user_ranking_rewards

ranking_badges
        │
        └──────── user_ranking_badges

ranking_achievements
        │
        └──────── user_ranking_achievements
```

# Strategi Perhitungan Ranking

Agar performa tetap optimal pada skala **100.000+ pengguna** dan **10.000+ concurrent users**, gunakan pendekatan berikut:

1. **Raw Score Layer**

   * Menyimpan seluruh skor hasil ujian dan latihan pada `ranking_scores`.
   * Tidak langsung digunakan oleh UI.

2. **Calculation Layer**

   * Background worker menghitung skor berdasarkan `ranking_formula`.
   * Mendukung versioning formula tanpa mengubah data historis.

3. **Snapshot Layer**

   * Hasil akhir disimpan di `leaderboard_entries`.
   * UI hanya membaca snapshot sehingga respons sangat cepat.

4. **Cache Layer**

   * Simpan Top-N leaderboard (misalnya Top 100, Top 1.000) di Redis.
   * Invalidasi cache dilakukan setelah proses recalculation selesai.

5. **Event-Driven Update**

   * Event seperti selesai CBT, latihan, atau perubahan achievement mengirim pesan ke queue.
   * Worker memperbarui `ranking_scores` dan menjadwalkan pembaruan leaderboard secara asinkron.

6. **Materialized View (Opsional)**

   * Untuk analitik dan pelaporan, gunakan materialized view yang direfresh secara berkala tanpa membebani tabel operasional.

## Integrasi dengan Domain Lain

Domain Ranking berelasi dengan:

* **User Management** → `user_id`, profil, sekolah, kelas.
* **Academic** → mata pelajaran, kelas, semester.
* **CBT Engine** → hasil ujian, durasi, jawaban benar/salah.
* **Analytics** → statistik performa dan tren.
* **Achievement & Gamification** → badge, streak, reward.
* **Notification** → pemberitahuan kenaikan atau penurunan peringkat.
* **Scheduler & Queue** → proses perhitungan leaderboard terjadwal.
* **Logging & Audit** → audit perubahan formula dan proses perhitungan ranking.

Dengan desain ini, sistem Ranking mendukung leaderboard nasional maupun lokal, historis peringkat, formula yang dapat dikonfigurasi, pemberian reward, dan performa tinggi untuk lingkungan produksi YakinLulus.id.
