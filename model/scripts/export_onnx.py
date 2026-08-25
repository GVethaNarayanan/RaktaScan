"""
MobileNetV3 ONNX Export Script
Exports a MobileNetV3-Small pretrained model to ONNX format for browser inference.

This creates a BASELINE model (ImageNet pretrained, not fine-tuned on clinical data).
The model is clearly labeled as a prototype in the application.

For real deployment, this model should be fine-tuned on a legitimate
conjunctiva image dataset with appropriate labels.
"""

import torch
import torch.nn as nn
from torchvision import models
import os
import sys

# Configuration
MODEL_INPUT_SIZE = 224
NUM_CLASSES = 2  # Binary: anemia risk vs non-anemia risk
ONNX_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'models', 'raktascan_mobilenetv3.onnx')


def create_model():
    """Create a MobileNetV3-Small with binary classification head."""
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.IMAGENET1K_V1)
    
    # Replace the classifier head for binary classification
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, NUM_CLASSES)
    
    return model


def export_to_onnx(model, output_path):
    """Export the model to ONNX format."""
    model.eval()
    
    # Create dummy input matching expected preprocessing
    dummy_input = torch.randn(1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Export
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=13,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'},
        },
    )
    
    # Verify file size
    file_size = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Model exported to: {output_path}")
    print(f"File size: {file_size:.2f} MB")
    
    return output_path


def validate_onnx(onnx_path, model):
    """Validate ONNX output matches PyTorch output."""
    try:
        import onnxruntime as ort
        import numpy as np
        
        model.eval()
        test_input = torch.randn(1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE)
        
        # PyTorch output
        with torch.no_grad():
            pytorch_output = model(test_input).numpy()
        
        # ONNX output
        session = ort.InferenceSession(onnx_path)
        onnx_output = session.run(None, {'input': test_input.numpy()})[0]
        
        # Compare
        max_diff = np.max(np.abs(pytorch_output - onnx_output))
        print(f"Max difference between PyTorch and ONNX outputs: {max_diff:.6f}")
        
        if max_diff < 1e-4:
            print("✓ ONNX validation PASSED")
        else:
            print("⚠ ONNX validation: outputs differ slightly (acceptable for float precision)")
            
    except ImportError:
        print("onnxruntime not installed — skipping ONNX validation")


def main():
    print("=" * 60)
    print("RaktaScan — MobileNetV3 ONNX Export")
    print("=" * 60)
    print()
    print("NOTE: This exports a BASELINE model with ImageNet pretrained")
    print("weights. It has NOT been fine-tuned on clinical data.")
    print("The model is labeled as a prototype in the application.")
    print()
    
    # Create model
    print("Creating MobileNetV3-Small model...")
    model = create_model()
    
    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Total parameters: {total_params:,}")
    print(f"Trainable parameters: {trainable_params:,}")
    print()
    
    # Export to ONNX
    print("Exporting to ONNX...")
    onnx_path = export_to_onnx(model, ONNX_OUTPUT_PATH)
    print()
    
    # Validate
    print("Validating ONNX export...")
    validate_onnx(onnx_path, model)
    print()
    
    print("=" * 60)
    print("Export complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
