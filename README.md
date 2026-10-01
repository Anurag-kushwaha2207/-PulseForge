# PulseForge

**PrivaTwin: Privacy-Preserving, Explainable Patient Digital Twin**

> **Team:** [Team name — to be added]<br>
> **College:** [College name — to be added]

## Problem and use case

PulseForge is a clinician-facing prototype for exploring a **simulated
two-hour-ahead elevated systolic blood-pressure episode signal**. It combines
synthetic recent blood-pressure readings, historical EHR-like context, and a
simulated wearable feed so a clinician can inspect the two-hour projection
and the context alongside recent trends.

This is a hackathon demonstration, **not a medical device or a clinically
validated prediction**. All patient profiles, measurements, trends, and
outputs are synthetic or illustrative. The demo threshold is systolic BP
**at or above 140 mmHg**, chosen solely as an illustrative prototype
threshold; it is not a clinical alert cutoff or care recommendation. The
forecast must not be used for screening, diagnosis, treatment, or patient-care
decisions. No real patient data is collected or included.

## Prototype and stack

- **UI:** Responsive, browser-based clinician dashboard built with HTML, CSS,
  and vanilla JavaScript (ES modules); no third-party runtime dependencies.
- **Inputs:** Synthetic EHR-like context (age, BMI, 30-day historical mean
  systolic BP, family history, tobacco use), systolic/diastolic/heart-rate
  readings every two hours for 30 days, and 30 daily simulated wearable
  summaries (activity, steps, sleep, and resting heart rate).
- **Demo predictor:** `src/risk-model.js` linearly extrapolates the observed
  two-hour systolic change: `forecast = current systolic + (current systolic -
  systolic two hours ago)`. It flags when this illustrative forecast meets the
  prototype threshold. This hand-authored heuristic is **not a trained model**,
  returns no probability, and has not been calibrated or validated against
  clinical data. Historical EHR-like and wearable features are visible context
  in the demo and are not used by this simple BP-trend rule.
- **Privacy:** Demo profiles are generated examples with synthetic IDs; the
  prototype has no patient-data upload or backend.

## Synthetic demo dataset

`data/demo-cohort.json` is a tracked, deterministic, wholly computer-generated
dataset: 120 profiles, 43,200 two-hour blood-pressure/heart-rate readings, and
3,600 wearable profile-days across 30 days. The values are not sampled from
people, patient records, connected devices, or a clinical dataset; they are
not labeled with observed outcomes and must not be treated as evidence about
model performance. The 140 mmHg field in the data is only the prototype's
illustrative threshold. A fixed random seed makes the cohort regenerable:

```bash
python scripts/generate_synthetic_cohort.py
```

Use the dashboard search to browse profiles, switch its BP/activity overview
between 7 and 30 days, inspect the latest 24-hour reading log, and export the
selected synthetic profile's two-hour records as CSV.

## Run locally

Requires Python 3 or another static-file server, and Node.js to run the tests.
From the repository root:

```bash
python -m http.server 8000
```

Open <http://localhost:8000> in a browser. In another terminal, run:

```bash
node --test
```

Select a synthetic patient or change either recent systolic reading to see the
two-hour projection and threshold signal update. Historical patient context
and wearable trends are shown alongside the blood-pressure readings. The
persistent synthetic-data and no-clinical-validation warnings are part of the
prototype and should remain visible in screenshots and recordings.

## Submission artifacts

These are deliverables to create and review before submission; none are
represented as completed or included yet:

- [ ] Architecture diagram — PDF or PPT
- [ ] Presentation deck — PDF or PPT
- [ ] 20-minute demo video

## References

These references inform the prototype's broad cardiovascular-health and
physical-activity context. They do **not** validate its two-hour heuristic or
the illustrative prototype threshold.

- Lloyd-Jones, D. M., et al. (2022). Life's Essential 8: Updating and
  Enhancing the American Heart Association's Construct of Cardiovascular
  Health. *Circulation*, 146(5), e18–e43.
  [doi:10.1161/CIR.0000000000001078](https://doi.org/10.1161/CIR.0000000000001078)
- World Health Organization. (2020). *WHO Guidelines on Physical Activity and
  Sedentary Behaviour*.
  [who.int/publications/i/item/9789240015128](https://www.who.int/publications/i/item/9789240015128)

## License

No repository license has been specified yet. Confirm the project team's
intended license before distributing or reusing the prototype.
