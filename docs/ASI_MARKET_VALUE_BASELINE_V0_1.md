# ASI Market Value Baseline v0.1.0

This is a deterministic, explainable baseline—not a trained ML model. It requires at least three verified comparable transfer transactions, each with an HTTP(S) source URL, fee, event date, similarity score, and explicit verification flag. It suppresses the monetary estimate if minimum input requirements are not met.

The baseline takes age, position, minutes over the prior 12 months, an externally evidenced 0–100 performance index, optional verified contract years, and an optional league-level multiplier. It does not ingest injury/health data. It applies documented conservative multipliers to the median of comparable fees and reports an uncertainty interval and confidence score.

The coefficients are provisional product assumptions, not learned coefficients. Before production use, calibrate and evaluate with rights-cleared historical data using time-based holdout, leakage controls, segment metrics and interval calibration. Transfermarkt is excluded from ingestion, training and calibration unless a separate written license explicitly permits each use.

The API is stateless in this release. No new database table or migration is required; future persistence must use the existing prediction/model tables only after confirming the target metric/status constraints and RLS.
