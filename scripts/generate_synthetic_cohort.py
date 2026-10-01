#!/usr/bin/env python3
"""Generate a reproducible, explicitly synthetic BP/wearable demo cohort."""

from __future__ import annotations

import argparse
import json
import math
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

PATIENT_COUNT = 120
READINGS_PER_PATIENT = 360
WEARABLE_DAYS = 30
END_TIME = datetime(2026, 10, 1, 0, 0, tzinfo=timezone.utc)
SEED = 20261001


def make_profile(index: int, rng: random.Random) -> dict:
    age = rng.randint(25, 82)
    bmi = round(rng.uniform(19.0, 39.0), 1)
    base_systolic = rng.randint(108, 154)
    family_history = rng.random() < 0.34
    tobacco = rng.random() < 0.16
    baseline_hr = rng.randint(54, 86)
    activity_base = rng.randint(5, 48)
    sleep_base = rng.uniform(5.3, 8.3)

    readings = []
    first_time = END_TIME - timedelta(hours=2 * (READINGS_PER_PATIENT - 1))
    personal_drift = rng.uniform(-3.0, 3.0)
    for sample in range(READINGS_PER_PATIENT):
        timestamp = first_time + timedelta(hours=2 * sample)
        hour = timestamp.hour
        day_index = sample // 12
        circadian = 4.0 * math.sin((2 * math.pi * (hour - 7)) / 24)
        slower_variation = 2.5 * math.sin((2 * math.pi * day_index) / 9)
        systolic = round(
            max(
                88,
                min(
                    198,
                    base_systolic
                    + personal_drift
                    + circadian
                    + slower_variation
                    + rng.gauss(0, 4.5),
                ),
            )
        )
        diastolic = round(
            max(48, min(118, 61 + (systolic - 110) * 0.42 + rng.gauss(0, 3.0)))
        )
        pulse = round(max(45, min(115, baseline_hr + rng.gauss(0, 6.0))))
        readings.append(
            {
                "timestamp": timestamp.isoformat(timespec="minutes").replace("+00:00", "Z"),
                "systolic": systolic,
                "diastolic": diastolic,
                "heartRate": pulse,
            }
        )

    wearable = []
    first_day = END_TIME.date() - timedelta(days=WEARABLE_DAYS - 1)
    for day in range(WEARABLE_DAYS):
        day_date = first_day + timedelta(days=day)
        activity = round(max(0, min(150, rng.gauss(activity_base, 12))))
        wearable.append(
            {
                "date": day_date.isoformat(),
                "activeMinutes": activity,
                "steps": round(max(500, min(24_000, rng.gauss(2_200 + activity * 105, 1_500)))),
                "sleepHours": round(max(3.5, min(10.5, rng.gauss(sleep_base, 0.65))), 1),
                "restingHr": round(max(45, min(105, rng.gauss(baseline_hr, 3.5)))),
            }
        )

    return {
        "id": f"PF-{index + 1:04d}",
        "name": f"Demo Profile {index + 1:03d}",
        "age": age,
        "bmi": bmi,
        "historicalSystolic": round(
            sum(reading["systolic"] for reading in readings) / len(readings)
        ),
        "familyHistory": family_history,
        "tobacco": tobacco,
        "activityMinWeekly": sum(day["activeMinutes"] for day in wearable[-7:]),
        "sleepHours": round(
            sum(day["sleepHours"] for day in wearable[-7:]) / 7, 1
        ),
        "restingHr": round(
            sum(day["restingHr"] for day in wearable[-7:]) / 7
        ),
        "bpTrend": readings,
        "wearableTrend": wearable,
    }


def generate_cohort() -> dict:
    rng = random.Random(SEED)
    patients = [make_profile(index, rng) for index in range(PATIENT_COUNT)]
    return {
        "synthetic": True,
        "disclaimer": (
            "Entirely computer-generated demo data; not sourced from people, "
            "medical records, devices, or a clinical dataset."
        ),
        "seed": SEED,
        "generatedAt": "2026-10-01T00:00:00Z",
        "cadenceHours": 2,
        "historyDays": 30,
        "thresholdMmHg": 140,
        "patients": patients,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data" / "demo-cohort.json",
        help="output path (default: data/demo-cohort.json)",
    )
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(generate_cohort(), separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {PATIENT_COUNT:,} synthetic profiles, "
        f"{PATIENT_COUNT * READINGS_PER_PATIENT:,} BP readings, and "
        f"{PATIENT_COUNT * WEARABLE_DAYS:,} wearable-days to {args.output}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
