"""
Nebius Serverless Job Batch Execution Script
--------------------------------------------
Standalone wrapper script for invoking AntiTheca's 3:00 AM Sleep Engine inside
a Nebius Serverless Job container with structured cloud telemetry output.
"""

import os
import sys
import time
import json
import logging
import asyncio

# Setup path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from app.scheduler import scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [Nebius-Serverless] %(levelname)s: %(message)s")
logger = logging.getLogger("nebius.serverless")

async def run_batch():
    t_start = time.perf_counter()
    logger.info("Starting Nebius Serverless Batch Job: AntiTheca 3:00 AM Epistemic Replay...")
    
    # Check credentials
    if not os.getenv("NEBIUS_API_KEY"):
        logger.error("FATAL: NEBIUS_API_KEY environment variable is missing.")
        sys.exit(1)
        
    try:
        # Trigger single cycle
        result = await scheduler.execute_cycle(trigger_source="nebius_serverless_cron")
        t_duration = time.perf_counter() - t_start
        
        telemetry = {
            "platform": "Nebius Serverless AI Jobs",
            "execution_status": result.get("status", "unknown"),
            "atoms_consolidated": result.get("replayed_atoms", 0),
            "headline": result.get("headline", ""),
            "duration_seconds": round(t_duration, 2),
            "exit_code": 0
        }
        
        logger.info(f"Nebius Serverless Job completed successfully in {t_duration:.2f}s.")
        print(json.dumps(telemetry, indent=2))
        sys.exit(0)
    except Exception as e:
        logger.error(f"Nebius Serverless Job encountered unhandled exception: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_batch())

