import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Resolve paths
BACKEND_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = BACKEND_DIR.parent
DEFAULT_DATA_DIR = BACKEND_DIR / "data"

class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "AntiTheca"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Nebius Token Factory (OpenAI-compatible)
    NEBIUS_API_KEY: str = ""
    NEBIUS_BASE_URL: str = "https://api.tokenfactory.nebius.com/v1/"
    
    # NVIDIA Nemotron models hosted on Nebius
    # Large reasoning model for Replay & Adversarial Challenger (550B MoE)
    NVIDIA_REASONING_MODEL: str = "nvidia/Nemotron-3-Ultra-550b-a55b"
    # Fast lightweight model for categorization, tagging, routing (30B MoE)
    NVIDIA_FAST_MODEL: str = "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B"
    # Multimodal VL model for reels and image understanding
    NVIDIA_VL_MODEL: str = "nvidia/Nemotron-3.5-Super-VL"
    # High throughput lightning model
    NVIDIA_LIGHTNING_MODEL: str = "nvidia/Nemotron-3_5-Lightning"

    # Tavily API for autonomous web research
    TAVILY_API_KEY: str = ""

    # Epistemic Storage
    DATA_DIR: Path = DEFAULT_DATA_DIR
    SELF_DB_PATH: Path = DEFAULT_DATA_DIR / "self_brain.db"
    WORLD_DB_PATH: Path = DEFAULT_DATA_DIR / "world_brain.db"

    # Media / Instagram scraping
    INSTAGRAM_SESSION_ID: str = ""

    class Config:
        env_file = [
            str(BACKEND_DIR / ".env"),
            str(WORKSPACE_DIR / ".env")
        ]
        extra = "ignore"

settings = Settings()

# Ensure data directory exists
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
