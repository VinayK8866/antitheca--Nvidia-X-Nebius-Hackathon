import struct
import logging
from typing import List, Optional
import numpy as np

logger = logging.getLogger(__name__)

_MODEL = None
MODEL_NAME = "all-MiniLM-L6-v2"

def get_embedding_model():
    """Lazy-load the local sentence-transformer model to keep startup fast."""
    global _MODEL
    if _MODEL is None:
        logger.info(f"Loading local sentence transformer model: {MODEL_NAME}")
        try:
            from sentence_transformers import SentenceTransformer
            _MODEL = SentenceTransformer(MODEL_NAME)
        except Exception as e:
            logger.error(f"Failed to load sentence-transformers model: {e}")
            raise
    return _MODEL

def generate_embedding(text: str) -> List[float]:
    """Generates a normalized embedding vector for the given text."""
    if not text or not text.strip():
        return [0.0] * 384
    try:
        model = get_embedding_model()
        vec = model.encode(text.strip(), normalize_embeddings=True)
        return vec.tolist()
    except Exception as e:
        logger.warning(f"Error generating embedding: {e}")
        return [0.0] * 384

def float_list_to_blob(float_list: List[float]) -> bytes:
    """Converts a list of floats into a binary blob for SQLite storage."""
    return struct.pack(f"{len(float_list)}f", *float_list)

def blob_to_float_list(blob: Optional[bytes]) -> List[float]:
    """Converts a binary blob back into a list of floats."""
    if not blob:
        return []
    count = len(blob) // 4
    return list(struct.unpack(f"{count}f", blob))

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculates cosine similarity between two normalized vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    a = np.array(v1, dtype=np.float32)
    b = np.array(v2, dtype=np.float32)
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))
