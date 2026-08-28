"""
RaktaScan MobileNetV3 PyTorch Fine-Tuning & ONNX Export Pipeline
OpenCV AI Competition 2026

Trains/Fine-tunes MobileNetV3-Small on conjunctiva dataset images (data/dataset)
and exports the optimized model to frontend/public/models/raktascan_mobilenetv3.onnx.
"""

import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from torchvision.datasets import ImageFolder
from torch.utils.data import DataLoader
import cv2

DATASET_DIR = "data/dataset"
MODEL_OUTPUT_DIR = "frontend/public/models"
ONNX_OUTPUT_PATH = os.path.join(MODEL_OUTPUT_DIR, "raktascan_mobilenetv3.onnx")

os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)


class RaktaScanMobileNetV3(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        weights = models.MobileNet_V3_Small_Weights.DEFAULT
        self.backbone = models.mobilenet_v3_small(weights=weights)
        in_features = self.backbone.classifier[3].in_features
        self.backbone.classifier[3] = nn.Linear(in_features, num_classes)

    def forward(self, x):
        return self.backbone(x)


def train_on_dataset(model, dataset_dir, epochs=3):
    if not os.path.exists(dataset_dir) or len(os.listdir(dataset_dir)) < 2:
        print("No dataset folder found. Exporting baseline MobileNetV3 model...")
        return model

    print(f"Fine-tuning MobileNetV3 on dataset in '{dataset_dir}' for {epochs} epochs...")
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    dataset = ImageFolder(dataset_dir, transform=transform)
    dataloader = DataLoader(dataset, batch_size=8, shuffle=True)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    model.train()
    for epoch in range(epochs):
        running_loss = 0.0
        for images, labels in dataloader:
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()
        print(f"Epoch [{epoch+1}/{epochs}] - Loss: {running_loss/max(1, len(dataloader)):.4f}")

    print("Model fine-tuning complete!")
    return model


def main():
    print("=" * 60)
    print("RaktaScan — MobileNetV3 PyTorch Training & ONNX Export")
    print("=" * 60)

    model = RaktaScanMobileNetV3()
    model = train_on_dataset(model, DATASET_DIR, epochs=3)
    model.eval()

    dummy_input = torch.randn(1, 3, 224, 224)

    print(f"Exporting model to ONNX: '{ONNX_OUTPUT_PATH}'...")
    torch.onnx.export(
        model,
        dummy_input,
        ONNX_OUTPUT_PATH,
        export_params=True,
        opset_version=13,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )

    size_mb = os.path.getsize(ONNX_OUTPUT_PATH) / (1024 * 1024)
    print(f"✓ Successfully exported ONNX model! File size: {size_mb:.2f} MB")
    print("=" * 60)


if __name__ == "__main__":
    main()
