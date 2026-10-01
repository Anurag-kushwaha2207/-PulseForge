export const DEMO_SYSTOLIC_THRESHOLD = 140;

function finiteNumber(value, name) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return parsed;
}

export function forecastElevatedBp({ systolicTwoHoursAgo, currentSystolic }) {
  const earlier = finiteNumber(systolicTwoHoursAgo, "systolicTwoHoursAgo");
  const current = finiteNumber(currentSystolic, "currentSystolic");
  const twoHourChange = current - earlier;
  const forecastSystolic = Math.round(current + twoHourChange);

  return {
    forecastSystolic,
    threshold: DEMO_SYSTOLIC_THRESHOLD,
    episodeSignal: forecastSystolic >= DEMO_SYSTOLIC_THRESHOLD,
    twoHourChange,
  };
}
