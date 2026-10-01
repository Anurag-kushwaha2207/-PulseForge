import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_SYSTOLIC_THRESHOLD, forecastElevatedBp } from "../src/risk-model.js";

test("projects two hours ahead from the current and two-hour-prior readings", () => {
  const result = forecastElevatedBp({ systolicTwoHoursAgo: 132, currentSystolic: 138 });
  assert.equal(result.forecastSystolic, 144);
  assert.equal(result.twoHourChange, 6);
  assert.equal(result.episodeSignal, true);
});

test("compares the forecast with the illustrative systolic threshold", () => {
  assert.equal(DEMO_SYSTOLIC_THRESHOLD, 140);
  assert.equal(
    forecastElevatedBp({ systolicTwoHoursAgo: 134, currentSystolic: 137 }).episodeSignal,
    true,
  );
  assert.equal(
    forecastElevatedBp({ systolicTwoHoursAgo: 120, currentSystolic: 125 }).episodeSignal,
    false,
  );
});

test("rejects missing or non-finite pressure readings", () => {
  assert.throws(() => forecastElevatedBp({ currentSystolic: 120 }), TypeError);
  assert.throws(
    () => forecastElevatedBp({ systolicTwoHoursAgo: Number.NaN, currentSystolic: 120 }),
    TypeError,
  );
});
