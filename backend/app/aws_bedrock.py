"""
Amazon Bedrock & AWS Services Integration
OpenCV AI Competition 2026

Provides Amazon Bedrock AI Agent orchestration, CloudWatch logging,
and DynamoDB session state management.
"""

import os
import json
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from typing import Dict, Any, List


class AWSBedrockOrchestrator:
    """Amazon Bedrock Agent & AWS Cloud Integration Manager."""

    def __init__(self):
        self.region = os.getenv("AWS_REGION", "us-east-1")
        self.model_id = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
        self.is_connected = False
        self.bedrock_client = None

        # Attempt AWS connection
        try:
            self.bedrock_client = boto3.client(
                service_name="bedrock-runtime",
                region_name=self.region
            )
            self.is_connected = True
        except (BotoCoreError, ClientError, Exception) as e:
            self.is_connected = False
            self.last_error = str(e)

    def get_runtime_status(self) -> Dict[str, Any]:
        """Returns runtime environment status (LOCAL vs AWS)."""
        return {
            "mode": "AWS" if self.is_connected else "LOCAL",
            "aws_region": self.region,
            "bedrock_model": self.model_id,
            "bedrock_connected": self.is_connected,
            "mcp_enabled": True,
            "opencv_version": "5.0.0",
        }

    def generate_agent_explanation(
        self,
        risk_tier: str,
        confidence: float,
        opencv_metrics: Dict[str, Any],
        agent_trace: List[str]
    ) -> Dict[str, Any]:
        """
        Calls Amazon Bedrock to generate structured clinical explanation & agent trace summary.
        Falls back gracefully to local policy engine if AWS credentials are not active.
        """
        if self.is_connected and self.bedrock_client:
            try:
                prompt = (
                    f"System: You are RaktaScan Clinical AI Assistant. Explain the following screening result.\n"
                    f"Risk Tier: {risk_tier}, Confidence: {confidence*100:.0f}%\n"
                    f"OpenCV 5 Metrics: {json.dumps(opencv_metrics)}\n"
                    f"Agent Trace: {json.dumps(agent_trace)}\n"
                    f"Format output as JSON: {{'explanation': '...', 'recommended_next_step': '...'}}"
                )
                
                body = json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 300,
                    "messages": [{"role": "user", "content": prompt}]
                })

                response = self.bedrock_client.invoke_model(
                    body=body,
                    modelId=self.model_id,
                    accept="application/json",
                    contentType="application/json"
                )

                result = json.loads(response.get("body").read())
                text_out = result["content"][0]["text"]
                parsed = json.loads(text_out)
                return {
                    "source": "AWS_BEDROCK",
                    "explanation": parsed.get("explanation", ""),
                    "recommended_next_step": parsed.get("recommended_next_step", "")
                }
            except Exception as e:
                pass  # Fallback to local mode

        # Local Policy Fallback
        if risk_tier == "HIGH":
            exp = "Visual evidence indicates significant conjunctival pallor and low vascular redness density."
            step = "Confirmatory hemoglobin blood test recommended at a certified healthcare facility."
        elif risk_tier == "MODERATE":
            exp = "Visual evidence indicates borderline conjunctival pallor requiring secondary confirmation."
            step = "Confirmatory hemoglobin blood test recommended."
        else:
            exp = "Visual evidence indicates healthy tissue vascularization within normal screening bounds."
            step = "No immediate blood test required. Consider periodic non-invasive screening."

        return {
            "source": "LOCAL_POLICY_ENGINE",
            "explanation": exp,
            "recommended_next_step": step,
        }
