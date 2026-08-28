"""
RaktaScan FastAPI Backend
OpenCV AI Competition 2026

Exposes OpenCV 5 vision endpoints, Active Perception Agent decision policy,
MCP Tool execution API, and AWS Cloud status.
"""

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import base64
import cv2
import numpy as np

from backend.app.cv_engine import OpenCV5VisionEngine
from backend.app.agent_policy import AgenticVisionEngine
from backend.app.mcp_server import MCPToolExecutor, MCP_TOOL_MANIFEST
from backend.app.aws_bedrock import AWSBedrockOrchestrator

app = FastAPI(
    title="RaktaScan OpenCV 5 & AWS Agentic Vision API",
    version="2.0.0-opencv5",
    description="Agentic Vision Non-Invasive Anemia Risk Pre-Screening API for OpenCV AI Competition 2026"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cv_engine = OpenCV5VisionEngine()
agent_policy = AgenticVisionEngine()
mcp_executor = MCPToolExecutor()
aws_orchestration = AWSBedrockOrchestrator()


class FrameAnalysisRequest(BaseModel):
    image_base64: str
    capture_count: Optional[int] = 1


class MCPToolCallRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = {}


@app.get("/")
def read_root():
    return {
        "project": "RaktaScan",
        "competition": "OpenCV AI Competition 2026, powered by AWS",
        "status": "ONLINE",
        "opencv_version": cv2.__version__,
        "runtime_status": aws_orchestration.get_runtime_status()
    }


@app.get("/api/aws/status")
def get_aws_status():
    """Returns AWS Cloud connection & Bedrock status."""
    return aws_orchestration.get_runtime_status()


@app.get("/api/mcp/manifest")
def get_mcp_manifest():
    """Returns MCP Tool manifest."""
    return {"tools": MCP_TOOL_MANIFEST}


@app.post("/api/vision/analyze-frame")
def analyze_frame(request: FrameAnalysisRequest):
    """
    Substantive OpenCV 5 frame analysis:
    Runs Laplacian sharpness, specular glare detection, LAB a* redness extraction,
    and returns Agent Perception + Action decision.
    """
    try:
        # Decode base64 image
        image_data = request.image_base64
        if "," in image_data:
            image_data = image_data.split(",")[1]
            
        img_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame_bgr is None:
            raise HTTPException(status_code=400, detail="Invalid image payload")

        # 1. OpenCV 5 Quality Analysis
        quality = cv_engine.analyze_frame_quality(frame_bgr)

        # 2. OpenCV 5 Pallor Feature Extraction
        pallor = cv_engine.extract_pallor_features(frame_bgr)

        # Mock model score for evaluation (in production: MobileNetV3 ONNX)
        model_score = 1.0 - pallor["epi_score"]

        # 3. Agent Decision Engine
        agent_result = agent_policy.evaluate_perception_step(
            quality_metrics=quality,
            pallor_features=pallor,
            model_score=model_score,
            capture_count=request.capture_count
        )

        # 4. AWS Bedrock Explanation (if connected)
        bedrock_exp = aws_orchestration.generate_agent_explanation(
            risk_tier=agent_result["risk_tier"],
            confidence=agent_result["confidence"],
            opencv_metrics=quality["metrics"],
            agent_trace=agent_result["agent_trace"]
        )

        return {
            "status": "success",
            "opencv_version": cv2.__version__,
            "quality": quality,
            "pallor_features": pallor,
            "agent_decision": agent_result,
            "aws_bedrock": bedrock_exp,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/mcp/tool")
def execute_mcp_tool(request: MCPToolCallRequest):
    """Executes an MCP Tool and returns structured JSON output."""
    result = mcp_executor.execute_tool(request.tool_name, request.arguments)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
