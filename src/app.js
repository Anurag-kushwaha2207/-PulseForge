import { EXPECTED_PATIENTS, loadDemoPatients } from "./demo-data.js";
import { forecastElevatedBp } from "./risk-model.js";

const patientList = document.querySelector("#patient-list");
const form = document.querySelector("#inputs-form");
const searchInput = document.querySelector("#patient-search");
const statusNote = document.querySelector("#cohort-status");
let demoPatients = [];
let selectedId = "";
let chartRangeDays = 7;
let currentInputs = {};

const byId = (id) => document.getElementById(id);
const selectedPatient = () => demoPatients.find((patient) => patient.id === selectedId);

function renderPatientList() {
  const query = searchInput.value.trim().toLowerCase();
  const matches = demoPatients.filter((patient) =>
    patient.id.toLowerCase().includes(query)
    || patient.name.toLowerCase().includes(query)
    || String(patient.age).includes(query),
  );
  patientList.replaceChildren(...matches.map((patient) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `patient-option${patient.id === selectedId ? " patient-option-active" : ""}`;
    button.setAttribute("aria-current", patient.id === selectedId ? "true" : "false");
    const avatar = document.createElement("span");
    avatar.className = "avatar avatar-list";
    avatar.textContent = patient.name.split(" ").map((part) => part[0]).join("");
    const text = document.createElement("span");
    text.className = "patient-option-text";
    const name = document.createElement("strong");
    name.textContent = patient.name;
    const details = document.createElement("small");
    details.textContent = `${patient.id} · age ${patient.age}`;
    text.append(name, details);
    const arrow = document.createElement("span");
    arrow.className = "patient-arrow";
    arrow.textContent = "›";
    button.append(avatar, text, arrow);
    button.addEventListener("click", () => selectPatient(patient.id));
    return button;
  }));
  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted small search-empty";
    empty.textContent = "No synthetic profile matches that search.";
    patientList.append(empty);
  }
}

function setInputs(patient) {
  const currentReading = patient.bpTrend.at(-1);
  const earlierReading = patient.bpTrend.at(-2);
  const latestWearable = patient.wearableTrend.at(-1);
  currentInputs = {
    age: patient.age,
    bmi: patient.bmi,
    historicalSystolic: patient.historicalSystolic,
    systolicTwoHoursAgo: earlierReading.systolic,
    systolic: currentReading.systolic,
    diastolic: currentReading.diastolic,
    restingHr: latestWearable.restingHr,
    activityMinWeekly: patient.activityMinWeekly,
    sleepHours: patient.sleepHours,
    familyHistory: patient.familyHistory,
    tobacco: patient.tobacco,
  };
  for (const [name, value] of Object.entries(currentInputs)) {
    const field = form.elements.namedItem(name);
    if (!field) continue;
    field.value = typeof value === "boolean" ? "" : value;
    if (typeof value === "boolean") form.elements.namedItem(name).checked = value;
  }
}

function selectPatient(id) {
  selectedId = id;
  const patient = selectedPatient();
  setInputs(patient);
  renderPatientList();
  renderDashboard(patient);
}

function renderPatientHeader(patient) {
  byId("patient-id").textContent = patient.id;
  byId("patient-name").textContent = patient.name;
  byId("patient-meta").textContent =
    `${currentInputs.age} years · BMI ${currentInputs.bmi} · Historical mean SBP ${currentInputs.historicalSystolic} mmHg`;
  byId("patient-avatar").textContent = patient.name.split(" ").map((part) => part[0]).join("");
}

function renderMetrics(patient) {
  const lastBp = patient.bpTrend[patient.bpTrend.length - 1];
  const diastolicOffset = lastBp.diastolic - lastBp.systolic;
  byId("latest-bp").textContent = `${currentInputs.systolic} / ${currentInputs.systolic + diastolicOffset}`;
  byId("weekly-activity").textContent = currentInputs.activityMinWeekly;
  byId("average-sleep").textContent = currentInputs.sleepHours.toFixed(1);
}

function renderForecast() {
  const result = forecastElevatedBp({
    systolicTwoHoursAgo: currentInputs.systolicTwoHoursAgo,
    currentSystolic: currentInputs.systolic,
  });
  byId("forecast-systolic").textContent = result.forecastSystolic;
  byId("risk-band").textContent = result.episodeSignal
    ? "Demo threshold crossed"
    : "Below demo threshold";
  byId("risk-band").className = `risk-band ${result.episodeSignal ? "band-high" : "band-low"}`;
  byId("risk-summary").textContent = result.episodeSignal
    ? "Elevated-BP episode signal at +2h"
    : "No elevated-BP episode signal at +2h";
  byId("risk-description").textContent =
    `Linear two-hour extrapolation from synthetic systolic readings (${result.twoHourChange >= 0 ? "+" : ""}${result.twoHourChange} mmHg over the past 2h). Not a probability.`;

  const signalList = byId("signal-list");
  const details = [
    ["SBP 2 hours ago", `${currentInputs.systolicTwoHoursAgo} mmHg · simulated`],
    ["Current systolic BP", `${currentInputs.systolic} mmHg · simulated`],
    ["Historical mean SBP", `${currentInputs.historicalSystolic} mmHg · EHR-like context`],
    ["Patient context", `${currentInputs.age} years · BMI ${currentInputs.bmi}`],
    ["Wearable context", `${currentInputs.restingHr} bpm · ${currentInputs.activityMinWeekly} active min/week`],
    ["Family history", currentInputs.familyHistory ? "Present in demo profile" : "Not present in demo profile"],
  ];
  signalList.replaceChildren(...details.map(([labelText, valueText]) => {
    const item = document.createElement("div");
    item.className = "signal-item";
    const label = document.createElement("span");
    label.textContent = labelText;
    const value = document.createElement("span");
    value.className = "signal-neutral";
    value.textContent = valueText;
    item.append(label, value);
    return item;
  }));
}

function renderTrends(patient) {
  const chart = byId("trend-chart");
  const byDate = new Map();
  for (const reading of patient.bpTrend) {
    const date = reading.timestamp.slice(0, 10);
    const values = byDate.get(date) ?? [];
    values.push(reading.systolic);
    byDate.set(date, values);
  }
  const daily = [...byDate.entries()]
    .slice(-chartRangeDays)
    .map(([date, values]) => ({
      date,
      systolic: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
    }));
  chart.style.gridTemplateColumns = `repeat(${daily.length}, minmax(0, 1fr))`;
  chart.replaceChildren(...daily.map((reading, index) => {
    const wearable = patient.wearableTrend.at(-daily.length + index);
    const column = document.createElement("div");
    column.className = "trend-day";
    const values = document.createElement("div");
    values.className = "trend-values";
    const pressure = document.createElement("strong");
    const systolic = reading.date === patient.bpTrend.at(-1).timestamp.slice(0, 10)
      ? currentInputs.systolic
      : reading.systolic;
    pressure.textContent = String(systolic);
    pressure.title = `Synthetic systolic BP: ${systolic} mmHg`;
    const active = document.createElement("span");
    active.textContent = `${wearable?.activeMinutes ?? 0}m`;
    active.title = `Simulated active minutes: ${wearable?.activeMinutes ?? 0}`;
    values.append(pressure, active);
    const bars = document.createElement("div");
    bars.className = "trend-bars";
    const bpBar = document.createElement("span");
    bpBar.className = "bar-bp";
    bpBar.style.height = `${Math.max(18, Math.min(100, (systolic - 90) * 1.3))}%`;
    const activityBar = document.createElement("span");
    activityBar.className = "bar-activity";
    activityBar.style.height = `${Math.max(10, Math.min(100, (wearable?.activeMinutes ?? 0) * 2.4))}%`;
    bars.append(bpBar, activityBar);
    const day = document.createElement("small");
    day.textContent = reading.date.slice(5);
    column.append(values, bars, day);
    return column;
  }));
}

function renderReadingTable(patient) {
  const readings = patient.bpTrend.slice(-12);
  const body = byId("readings-body");
  body.replaceChildren(...readings.map((reading, index) => {
    const row = document.createElement("tr");
    const current = index === readings.length - 1;
    const twoHoursAgo = index === readings.length - 2;
    const systolic = current
      ? currentInputs.systolic
      : twoHoursAgo
        ? currentInputs.systolicTwoHoursAgo
        : reading.systolic;
    const diastolic = current
      ? currentInputs.diastolic
      : reading.diastolic;
    const wearable = patient.wearableTrend.at(-1);
    const date = reading.timestamp.replace("T", " ").replace("Z", "");
    const cells = [
      date,
      `${systolic} mmHg`,
      `${diastolic} mmHg`,
      `${reading.heartRate} bpm`,
      `${wearable.activeMinutes} min`,
      `${wearable.sleepHours.toFixed(1)} hrs`,
    ];
    for (const [column, value] of cells.entries()) {
      const cell = document.createElement(column === 0 ? "th" : "td");
      if (column === 0) cell.scope = "row";
      cell.textContent = value;
      row.append(cell);
    }
    return row;
  }));
}

function exportPatientCsv(patient) {
  const columns = [
    "synthetic_patient_id", "timestamp_utc", "systolic_mmhg", "diastolic_mmhg",
    "heart_rate_bpm", "age_years", "bmi", "historical_mean_systolic_mmhg",
    "family_history_demo", "tobacco_use_demo", "daily_active_minutes",
    "daily_steps", "sleep_hours", "resting_heart_rate_bpm",
  ];
  const rows = patient.bpTrend.map((reading) => {
    const wearable = patient.wearableTrend.find(
      (day) => day.date === reading.timestamp.slice(0, 10),
    );
    return [
      patient.id, reading.timestamp, reading.systolic, reading.diastolic,
      reading.heartRate, patient.age, patient.bmi, patient.historicalSystolic,
      patient.familyHistory, patient.tobacco, wearable?.activeMinutes ?? "",
      wearable?.steps ?? "", wearable?.sleepHours ?? "", wearable?.restingHr ?? "",
    ].join(",");
  });
  const blob = new Blob(
    [`${columns.join(",")}\n${rows.join("\n")}\n`],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${patient.id.toLowerCase()}-synthetic-demo.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function renderDashboard(patient) {
  renderPatientHeader(patient);
  renderMetrics(patient);
  renderForecast();
  renderTrends(patient);
  renderReadingTable(patient);
}

form.addEventListener("input", (event) => {
  const input = event.target;
  if (input.type === "checkbox") {
    currentInputs[input.name] = input.checked;
  } else if (input.value !== "") {
    currentInputs[input.name] = Number(input.value);
  }
  renderPatientHeader(selectedPatient());
  renderMetrics(selectedPatient());
  renderForecast();
  renderTrends(selectedPatient());
  renderReadingTable(selectedPatient());
});

searchInput.addEventListener("input", renderPatientList);

document.querySelectorAll(".range-button").forEach((button) => {
  button.addEventListener("click", () => {
    chartRangeDays = Number(button.dataset.days);
    document.querySelectorAll(".range-button").forEach((rangeButton) => {
      const active = rangeButton === button;
      rangeButton.classList.toggle("range-button-active", active);
      rangeButton.setAttribute("aria-pressed", String(active));
    });
    const patient = selectedPatient();
    if (patient) renderTrends(patient);
  });
});

byId("export-button").addEventListener("click", () => {
  const patient = selectedPatient();
  if (patient) exportPatientCsv(patient);
});
byId("reset-button").addEventListener("click", () => {
  if (selectedId) selectPatient(selectedId);
});

try {
  demoPatients = await loadDemoPatients();
  if (demoPatients.length !== EXPECTED_PATIENTS) {
    throw new Error(`Expected ${EXPECTED_PATIENTS} synthetic profiles.`);
  }
  selectedId = demoPatients[0].id;
  byId("count-pill").textContent = String(demoPatients.length);
  byId("patient-count").textContent = demoPatients.length.toLocaleString();
  byId("bp-reading-count").textContent =
    (demoPatients.length * demoPatients[0].bpTrend.length).toLocaleString();
  byId("wearable-day-count").textContent =
    (demoPatients.length * demoPatients[0].wearableTrend.length).toLocaleString();
  statusNote.textContent = `${(demoPatients.length * demoPatients[0].bpTrend.length).toLocaleString()} synthetic BP readings · ${(demoPatients.length * demoPatients[0].wearableTrend.length).toLocaleString()} wearable-days.`;
  renderPatientList();
  selectPatient(selectedId);
} catch (error) {
  console.error("Could not initialize the synthetic demo cohort.", error);
  statusNote.textContent = `${error.message} Serve the repository with python -m http.server 8000 and reload.`;
  statusNote.classList.add("cohort-error");
}
