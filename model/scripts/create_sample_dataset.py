"""
RaktaScan Dataset Generator & Trainer
OpenCV AI Competition 2026

Creates sample conjunctiva dataset splits (anemic vs non_anemic)
and prepares data for PyTorch model fine-tuning & ONNX export.
"""

import os
import cv2
import numpy as np

DATASET_DIR = "data/dataset"
ANEMIC_DIR = os.path.join(DATASET_DIR, "anemic")
NON_ANEMIC_DIR = os.path.join(DATASET_DIR, "non_anemic")

os.makedirs(ANEMIC_DIR, exist_ok=True)
os.makedirs(NON_ANEMIC_DIR, exist_ok=True)

print("Generating synthetic conjunctiva dataset samples...")

# Generate 20 synthetic anemic images (low redness / pale)
for i in range(20):
    img = np.zeros((224, 224, 3), dtype=np.uint8)
    # Pale conjunctiva: lower red, higher green/blue (whitish/pale)
    img[:, :] = (140 + np.random.randint(-10, 10), 130 + np.random.randint(-10, 10), 155 + np.random.randint(-10, 10))
    cv2.imwrite(os.path.join(ANEMIC_DIR, f"anemic_{i+1:03d}.png"), img)

# Generate 20 synthetic non-anemic images (rich red / healthy)
for i in range(20):
    img = np.zeros((224, 224, 3), dtype=np.uint8)
    # Healthy conjunctiva: rich red channel, lower green/blue
    img[:, :] = (70 + np.random.randint(-10, 10), 80 + np.random.randint(-10, 10), 190 + np.random.randint(-10, 10))
    cv2.imwrite(os.path.join(NON_ANEMIC_DIR, f"non_anemic_{i+1:03d}.png"), img)

print(f"Created {len(os.listdir(ANEMIC_DIR))} anemic and {len(os.listdir(NON_ANEMIC_DIR))} non-anemic dataset samples in '{DATASET_DIR}'!")
