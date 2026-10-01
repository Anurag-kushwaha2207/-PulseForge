import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateDemoCohort } from "../src/demo-data.js";
import { DEMO_SYSTOLIC_THRESHOLD, forecastElevatedBp } from "../src/risk-model.js";

const cohortUrl = new URL("../data/demo-cohort.json", import.meta.url);
const cohort = JSON.parse(await readFile(cohortUrl, "utf8"));

test("ships the documented, explicitly synthetic cohort size", () => {
  assert.equal(validateDemoCohort(cohort), true);
  assert.equal(cohort.patients.length, 120);
  assert.equal(cohort.thresholdMmHg, DEMO_SYSTOLIC_THRESHOLD);
  assert.equal(cohort.patients.reduce((sum, patient) => sum + patient.bpTrend.length, 0), 43_200);
  assert.equal(
    cohort.patients.reduce((sum, patient) => sum + patient.wearableTrend.length, 0),
    3_600,
  );
  assert.match(cohort.disclaimer, /computer-generated/);
});

test("every profile has ordered two-hour BP readings and 30 wearable days", () => {
  for (const patient of cohort.patients) {
    assert.equal(patient.bpTrend.length, 360);
    assert.equal(patient.wearableTrend.length, 30);
    for (let index = 1; index < patient.bpTrend.length; index += 1) {
      const earlier = Date.parse(patient.bpTrend[index - 1].timestamp);
      const current = Date.parse(patient.bpTrend[index].timestamp);
      assert.equal(current - earlier, 2 * 60 * 60 * 1000);
    }

    const result = forecastElevatedBp({
      systolicTwoHoursAgo: patient.bpTrend.at(-2).systolic,
      currentSystolic: patient.bpTrend.at(-1).systolic,
    });
    assert.ok(Number.isFinite(result.forecastSystolic));
  }
});

test("refuses a data file not explicitly marked synthetic", () => {
  assert.throws(
    () => validateDemoCohort({ ...cohort, synthetic: false }),
    /explicitly synthetic/,
  );
});
