import os
import json
import logging
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class NebiusNemotronClient:
    """Client for NVIDIA Nemotron models hosted on Nebius Token Factory."""

    def __init__(self):
        self.api_key = settings.NEBIUS_API_KEY
        self.base_url = settings.NEBIUS_BASE_URL
        self.reasoning_model = settings.NVIDIA_REASONING_MODEL
        self.fast_model = settings.NVIDIA_FAST_MODEL
        self._client = None

        if self.api_key and self.api_key != "your_nebius_api_key_here":
            try:
                from openai import OpenAI
                self._client = OpenAI(
                    base_url=self.base_url,
                    api_key=self.api_key
                )
                logger.info(f"Nebius Token Factory client initialized. Reasoning: {self.reasoning_model}, Fast: {self.fast_model}")
            except Exception as e:
                logger.warning(f"Could not initialize OpenAI client for Nebius: {e}")
                self._client = None
        else:
            logger.info("Nebius API key not set or placeholder. Running in fallback/mock mode.")

    @property
    def is_live(self) -> bool:
        return self._client is not None

    def query(
        self,
        prompt: str,
        system_prompt: str = "You are AntiTheca, an autonomous personal cognitive intelligence.",
        model_type: str = "reasoning",
        temperature: float = 0.2,
        max_tokens: int = 1500
    ) -> str:
        """Queries the chosen NVIDIA Nemotron model via Nebius Token Factory with fallback."""
        model = self.reasoning_model if model_type == "reasoning" else self.fast_model

        if self.is_live:
            try:
                resp = self._client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                content = resp.choices[0].message.content
                if content:
                    return content.strip()
            except Exception as e:
                logger.error(f"Nebius API call failed for model {model}: {e}. Falling back to internal engine.")

        return self._local_fallback_response(prompt, system_prompt, model_type)

    def predict_fast(
        self,
        prompt: str,
        system_prompt: str = "You are AntiTheca, an autonomous personal cognitive intelligence.",
        temperature: float = 0.2,
        max_tokens: int = 1500
    ) -> str:
        """High-speed query helper using NVIDIA fast Nemotron model hosted on Nebius."""
        return self.query(
            prompt=prompt,
            system_prompt=system_prompt,
            model_type="fast",
            temperature=temperature,
            max_tokens=max_tokens
        )

    def analyze_image(self, image_bytes: bytes, prompt: str = "Analyze this image and summarize its key insights, diagrams, and text.") -> str:
        """Processes an image using NVIDIA Nemotron 3.5 Super-VL hosted on Nebius."""
        if not self.is_live or not image_bytes:
            return "Visual description: [Image processed locally - visual media indexed]."

        try:
            import base64
            b64_image = base64.b64encode(image_bytes).decode("utf-8")
            resp = self._client.chat.completions.create(
                model=settings.NVIDIA_VL_MODEL,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_image}"}}
                    ]
                }],
                max_tokens=1500
            )
            msg = resp.choices[0].message
            content = msg.content or msg.reasoning_content or ""
            return content.strip()
        except Exception as e:
            logger.error(f"Nebius Nemotron Super-VL vision call failed: {e}")
            return f"Visual analysis fallback: {e}"

    def classify_intent(self, user_query: str) -> Dict[str, Any]:
        """Uses fast model to classify query intent and extract target concepts."""
        system_prompt = (
            "You are a strict JSON classifier for personal second brain queries. "
            "Output valid JSON ONLY with keys: 'intent' (one of: 'recall', 'challenge', 'decision', 'ingest', 'general'), "
            "'confidence' (0.0 to 1.0), 'entities' (list of extracted keywords/concepts), 'needs_external_research' (bool)."
        )
        prompt = f"Query: \"{user_query}\""

        if self.is_live:
            try:
                resp = self.query(prompt, system_prompt=system_prompt, model_type="fast", temperature=0.1, max_tokens=250)
                # Attempt to extract json block
                clean_json = resp.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json.split("```json")[1].split("```")[0].strip()
                elif clean_json.startswith("```"):
                    clean_json = clean_json.split("```")[1].split("```")[0].strip()
                return json.loads(clean_json)
            except Exception as e:
                logger.debug(f"JSON parsing fallback for intent: {e}")

        # Local heuristic fallback
        q_lower = user_query.lower()
        if any(w in q_lower for w in ["challenge", "contradict", "wrong", "flaw", "stress test", "debate"]):
            intent = "challenge"
        elif any(w in q_lower for w in ["decide", "decision", "tradeoff", "choose", "why did i"]):
            intent = "decision"
        elif any(w in q_lower for w in ["save", "remember", "bookmark", "note", "reel"]):
            intent = "ingest"
        elif any(w in q_lower for w in ["what", "when", "how", "find", "recall", "summarize", "show"]):
            intent = "recall"
        else:
            intent = "general"

        words = [w.strip("?,.!") for w in user_query.split() if len(w) > 3]
        return {
            "intent": intent,
            "confidence": 0.85,
            "entities": words[:4],
            "needs_external_research": "latest" in q_lower or "news" in q_lower or "verify" in q_lower
        }

    def _local_fallback_response(self, prompt: str, system_prompt: str, model_type: str) -> str:
        """Deterministic fallback synthesizer when cloud API is unconfigured."""
        return (
            "### [AntiTheca Local Synthesis]\n\n"
            f"Synthesizing cognitive context based on your internal memory and knowledge graph.\n\n"
            f"**Context Analysis**: Your query directly intersects with stored epistemic facts and decision precedents.\n\n"
            f"> Context: {prompt[:300]}..."
        )

# Global singleton
llm_client = NebiusNemotronClient()
