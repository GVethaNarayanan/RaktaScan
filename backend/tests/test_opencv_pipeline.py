import unittest
import numpy as np
from backend.app.cv_engine import OpenCV5VisionEngine
from backend.app.agent_policy import AgenticVisionEngine
from backend.app.mcp_server import MCPToolExecutor


class TestOpenCVPipeline(unittest.TestCase):

    def setUp(self):
        self.engine = OpenCV5VisionEngine()
        self.agent = AgenticVisionEngine()
        self.mcp = MCPToolExecutor()

    def test_opencv5_quality_analysis(self):
        # Create synthetic textured BGR frame
        frame = np.random.randint(50, 200, (300, 300, 3), dtype=np.uint8)
        res = self.engine.analyze_frame_quality(frame)
        self.assertIn("passed", res)
        self.assertIn("sharpness", res["metrics"])
        self.assertIn("glare_percent", res["metrics"])

    def test_opencv5_pallor_extraction(self):
        frame = np.random.randint(60, 180, (200, 200, 3), dtype=np.uint8)
        pallor = self.engine.extract_pallor_features(frame)
        self.assertTrue(pallor["valid"])
        self.assertIn("epi_score", pallor)
        self.assertIn("lab_a_mean", pallor)

    def test_agent_decision_recapture(self):
        quality_fail = {"passed": False, "reasons": ["too_blurry"]}
        pallor_dummy = {"epi_score": 0.5, "lab_a_mean": 125.0}
        dec = self.agent.evaluate_perception_step(quality_fail, pallor_dummy, 0.5, capture_count=1)
        self.assertEqual(dec["action"], "REQUEST_RECAPTURE")

    def test_agent_decision_second_view(self):
        quality_pass = {"passed": True, "reasons": []}
        pallor_borderline = {"epi_score": 0.52, "lab_a_mean": 126.0}
        dec = self.agent.evaluate_perception_step(quality_pass, pallor_borderline, 0.48, capture_count=1)
        self.assertEqual(dec["action"], "REQUEST_SECOND_VIEW")

    def test_mcp_tool_execution(self):
        res = self.mcp.execute_tool("analyze_capture_quality", {})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["tool"], "analyze_capture_quality")


if __name__ == '__main__':
    unittest.main()
