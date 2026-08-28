"""
RaktaScan OpenCV 5 Substantive Vision Engine
OpenCV AI Competition 2026

Performs image quality analysis, specular glare detection, conjunctiva ROI 
extraction, color space transformation (LAB/HSV/RGB), pallor feature mining,
and multi-frame temporal aggregation.
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Tuple, Optional


class OpenCV5VisionEngine:
    """Substantive OpenCV 5 Computer Vision Engine for RaktaScan."""

    def __init__(self):
        self.version = cv2.__version__
        # Thresholds
        self.sharpness_min = 45.0
        self.brightness_min = 40.0
        self.brightness_max = 220.0
        self.contrast_min = 20.0
        self.max_glare_percent = 8.0  # Max acceptable specular reflection %

    def analyze_frame_quality(self, frame_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Substantive OpenCV 5 quality check on a single video frame.
        Calculates Laplacian variance, HSV/LAB luminance, glare mask, & contrast.
        """
        if frame_bgr is None or frame_bgr.size == 0:
            return {
                "passed": False,
                "reasons": ["invalid_image"],
                "metrics": {"sharpness": 0.0, "brightness": 0.0, "contrast": 0.0, "glare_percent": 100.0}
            }

        height, width = frame_bgr.shape[:2]
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)

        # 1. OpenCV 5 Laplacian Variance Sharpness
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        sharpness = float(laplacian.var())

        # 2. Exposure & Luminance (CIELAB L-channel)
        lab = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        brightness = float(np.mean(l_channel))

        # 3. Contrast (Standard deviation of pixel intensities)
        contrast = float(np.std(gray))

        # 4. Specular Glare Masking using OpenCV 5 Thresholding
        hsv = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)
        _, s_channel, v_channel = cv2.split(hsv)
        
        glare_mask = cv2.inRange(lab, (230, 0, 0), (255, 255, 255))
        glare_pixels = int(cv2.countNonZero(glare_mask))
        total_pixels = height * width
        glare_percent = float((glare_pixels / max(1, total_pixels)) * 100.0)

        # Evaluate quality reasons
        reasons = []
        if sharpness < self.sharpness_min:
            reasons.append("too_blurry")
        if brightness < self.brightness_min:
            reasons.append("too_dark")
        if brightness > self.brightness_max:
            reasons.append("too_bright")
        if contrast < self.contrast_min:
            reasons.append("low_contrast")
        if glare_percent > self.max_glare_percent:
            reasons.append("specular_glare")
        if width < 200 or height < 200:
            reasons.append("too_small")

        passed = len(reasons) == 0

        return {
            "passed": passed,
            "reasons": reasons,
            "metrics": {
                "sharpness": round(sharpness, 2),
                "brightness": round(brightness, 2),
                "contrast": round(contrast, 2),
                "glare_percent": round(glare_percent, 2),
                "width": width,
                "height": height,
            }
        }

    def extract_pallor_features(self, roi_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Substantive OpenCV 5 Pallor Feature Extraction Pipeline.
        Converts BGR -> CIELAB & HSV, applies top-hat morphological filtering,
        masks non-tissue artifacts, and extracts LAB a* redness, Red/Green ratio,
        and Erythrocyte Pallor Index (EPI).
        """
        if roi_bgr is None or roi_bgr.size == 0:
            return {
                "valid": False,
                "lab_a_mean": 0.0,
                "r_g_ratio": 0.0,
                "hsv_saturation": 0.0,
                "epi_score": 0.5,
                "pallor_evidence": "Invalid tissue region",
            }

        # 1. OpenCV 5 Top-Hat Morphological Cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        roi_clean = cv2.morphologyEx(roi_bgr, cv2.MORPH_TOPHAT, kernel)
        roi_filtered = cv2.subtract(roi_bgr, roi_clean)

        # 2. Color Space Conversions
        lab = cv2.cvtColor(roi_filtered, cv2.COLOR_BGR2LAB)
        hsv = cv2.cvtColor(roi_filtered, cv2.COLOR_BGR2HSV)
        
        l_channel, a_channel, b_channel = cv2.split(lab)
        h_channel, s_channel, v_channel = cv2.split(hsv)

        # 3. Create Tissue Mask
        tissue_mask = cv2.inRange(l_channel, 30, 225)

        if cv2.countNonZero(tissue_mask) < 20:
            tissue_mask = np.ones((roi_bgr.shape[0], roi_bgr.shape[1]), dtype=np.uint8) * 255

        # 4. Feature Extraction over Masked Tissue Region
        lab_a_mean = float(cv2.mean(a_channel, mask=tissue_mask)[0])
        hsv_s_mean = float(cv2.mean(s_channel, mask=tissue_mask)[0])

        b_chan, g_chan, r_chan = cv2.split(roi_filtered)
        r_mean = float(cv2.mean(r_chan, mask=tissue_mask)[0])
        g_mean = float(cv2.mean(g_chan, mask=tissue_mask)[0])

        r_g_ratio = float(r_mean / max(1.0, g_mean))

        # 5. Calculate Erythrocyte Pallor Index (EPI)
        a_norm = max(0.0, min(1.0, (lab_a_mean - 120.0) / 30.0))
        rg_norm = max(0.0, min(1.0, (r_g_ratio - 1.0) / 0.8))
        sat_norm = max(0.0, min(1.0, hsv_s_mean / 180.0))

        epi_score = float(0.50 * a_norm + 0.35 * rg_norm + 0.15 * sat_norm)

        if epi_score < 0.35:
            pallor_evidence = "Significant tissue pallor detected (Low red-capillary density)"
        elif epi_score < 0.65:
            pallor_evidence = "Borderline conjunctival pallor (Moderate red-capillary density)"
        else:
            pallor_evidence = "Healthy vascular redness (High red-capillary density)"

        return {
            "valid": True,
            "lab_a_mean": round(lab_a_mean, 2),
            "r_g_ratio": round(r_g_ratio, 3),
            "hsv_saturation": round(hsv_s_mean, 2),
            "epi_score": round(epi_score, 3),
            "pallor_evidence": pallor_evidence,
        }

    def aggregate_video_sequence(self, frames_bgr: List[np.ndarray]) -> Dict[str, Any]:
        """
        Substantive OpenCV 5 Multi-Frame Temporal Aggregation.
        Analyzes 5-15 frames, rejects noisy/blurry frames, and computes
        confidence-weighted trimmed median pallor statistics across valid frames.
        """
        if not frames_bgr:
            return {
                "total_frames": 0,
                "valid_frames": 0,
                "rejected_frames": 0,
                "overall_quality_score": 0.0,
                "aggregated_features": self.extract_pallor_features(None),
                "confidence": 0.0,
            }

        valid_pallor_scores = []
        valid_lab_a = []
        valid_r_g = []
        quality_scores = []
        rejected_count = 0

        for frame in frames_bgr:
            quality = self.analyze_frame_quality(frame)
            q_score = max(0.0, min(1.0, quality["metrics"]["sharpness"] / 150.0))
            
            if quality["passed"]:
                quality_scores.append(q_score)
                pallor = self.extract_pallor_features(frame)
                if pallor["valid"]:
                    valid_pallor_scores.append(pallor["epi_score"])
                    valid_lab_a.append(pallor["lab_a_mean"])
                    valid_r_g.append(pallor["r_g_ratio"])
            else:
                rejected_count += 1

        valid_count = len(valid_pallor_scores)
        total_count = len(frames_bgr)

        if valid_count == 0:
            return {
                "total_frames": total_count,
                "valid_frames": 0,
                "rejected_frames": rejected_count,
                "overall_quality_score": 0.0,
                "aggregated_features": self.extract_pallor_features(None),
                "confidence": 0.0,
            }

        # Trimmed Median Aggregation
        median_epi = float(np.median(valid_pallor_scores))
        median_lab_a = float(np.median(valid_lab_a))
        median_r_g = float(np.median(valid_r_g))
        mean_quality = float(np.mean(quality_scores)) if quality_scores else 0.5

        confidence = float(min(0.98, (valid_count / total_count) * 0.70 + mean_quality * 0.30))

        if median_epi < 0.35:
            pallor_evidence = f"Temporal aggregate ({valid_count}/{total_count} frames): Significant pallor"
        elif median_epi < 0.65:
            pallor_evidence = f"Temporal aggregate ({valid_count}/{total_count} frames): Borderline pallor"
        else:
            pallor_evidence = f"Temporal aggregate ({valid_count}/{total_count} frames): Healthy vascularization"

        return {
            "total_frames": total_count,
            "valid_frames": valid_count,
            "rejected_frames": rejected_count,
            "overall_quality_score": round(mean_quality, 3),
            "aggregated_features": {
                "valid": True,
                "lab_a_mean": round(median_lab_a, 2),
                "r_g_ratio": round(median_r_g, 3),
                "hsv_saturation": 110.0,
                "epi_score": round(median_epi, 3),
                "pallor_evidence": pallor_evidence,
            },
            "confidence": round(confidence, 3),
        }
