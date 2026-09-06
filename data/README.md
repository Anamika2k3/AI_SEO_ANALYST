# Data Directories

This repository uses `data/` for deterministic demo, processed, and evaluation assets.

## `data/mock/`
Deterministic demo data used when no external credentials are available.

Expected formats:
- JSON for structured demo records
- Markdown for notes or schema documentation

Purpose:
- Local development
- Demo mode
- UI prototyping
- Provider fallbacks

## `data/processed/`
Derived and normalized data created from raw or mock inputs.

Expected formats:
- JSON
- CSV
- Parquet later, if needed

Purpose:
- Normalized trend snapshots
- Scoring-ready records
- Cleaned evaluation inputs

## `data/evaluation/`
Structured examples for evaluating scoring, classification, and recommendation quality.

Expected formats:
- JSON
- CSV
- Markdown schema notes

Purpose:
- Regression checks
- Prompt evaluation
- Future model benchmarking

## Notes
- Do not store secrets here.
- Do not treat demo data as verified real-world data.
- External datasets should only be added after checking source, purpose, date, and license.
