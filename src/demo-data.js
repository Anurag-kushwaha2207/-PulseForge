export const EXPECTED_PATIENTS = 120;
export const BP_READINGS_PER_PATIENT = 360;
export const WEARABLE_DAYS_PER_PATIENT = 30;

export async function loadDemoPatients() {
  const url = new URL("../data/demo-cohort.json", import.meta.url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Synthetic demo data could not be loaded (HTTP ${response.status}).`);
  }
  const cohort = await response.json();
  validateDemoCohort(cohort);
  return cohort.patients;
}

export function validateDemoCohort(cohort) {
  if (
    cohort?.synthetic !== true
    || !Array.isArray(cohort.patients)
    || cohort.patients.length !== EXPECTED_PATIENTS
  ) {
    throw new TypeError("The demo cohort must contain 120 explicitly synthetic profiles.");
  }

  for (const patient of cohort.patients) {
    if (
      !Array.isArray(patient.bpTrend)
      || patient.bpTrend.length !== BP_READINGS_PER_PATIENT
      || !Array.isArray(patient.wearableTrend)
      || patient.wearableTrend.length !== WEARABLE_DAYS_PER_PATIENT
    ) {
      throw new TypeError(`${patient.id ?? "A demo profile"} has an incomplete history.`);
    }
  }
  return true;
}
