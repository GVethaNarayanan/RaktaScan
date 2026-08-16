# 📦 Data

**RaktaScan — Dataset**

> **Status:** Planning stage. Dataset sourcing and curation is upcoming.

---

## Overview

This directory will contain dataset-related files, preprocessing scripts, and documentation once data preparation begins. **No dataset has been committed to this repository at this stage.**

---

## Planned Requirements

- **Relevant conjunctiva images** — Images of the palpebral conjunctiva suitable for anemia risk assessment
- **Appropriate labels** — Risk-level or hemoglobin-correlated labels for supervised learning
- **Train / Validation / Test separation** — Proper data splits to ensure unbiased evaluation
- **Preprocessing** — Standardized image dimensions, color normalization, and format consistency
- **Augmentation** — Appropriate augmentation strategies to improve model robustness
- **Documentation of dataset source and licensing** — Clear provenance and license information for all data used

---

## Planned Structure

```
data/
├── raw/                       ← Original unprocessed data (gitignored)
├── processed/                 ← Preprocessed and augmented data (gitignored)
├── splits/                    ← Train/validation/test split definitions
└── README.md                  ← This file
```

---

## Important Notes

- **No dataset has been downloaded or committed** to this repository
- **No fake CSV files or synthetic data** have been generated
- **No medical images** are present in this repository at this stage
- All dataset sourcing will be documented with proper attribution and licensing
- Raw and processed data directories will be gitignored to prevent accidental commits of large or sensitive files

> For the full project overview, see the [root README](../README.md).
