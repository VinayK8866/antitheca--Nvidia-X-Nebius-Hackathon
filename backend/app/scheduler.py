import asyncio
import logging
from datetime import datetime, time, timedelta, timezone
from typing import Dict, Any, List, Optional
from app.replay_engine import replay_engine

logger = logging.getLogger(__name__)

class AutonomousReplayScheduler:
    """Manages the 3:00 AM Autonomous Cognitive Sleep Cycle."""

    def __init__(self, target_hour: int = 3, target_minute: int = 0):
        self.target_hour = target_hour
        self.target_minute = target_minute
        self.is_enabled = True
        self.last_run = None
        self.total_runs = 0
        self.history: List[Dict[str, Any]] = []
        self._task = None

    def get_status(self) -> Dict[str, Any]:
        """Returns scheduler telemetry, next run timestamp, and history."""
        now = datetime.now()
        next_run = now.replace(hour=self.target_hour, minute=self.target_minute, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)

        time_until = next_run - now
        hours_until = int(time_until.total_seconds() // 3600)
        minutes_until = int((time_until.total_seconds() % 3600) // 60)

        return {
            "is_enabled": self.is_enabled,
            "scheduled_time": f"{self.target_hour:02d}:{self.target_minute:02d} AM",
            "next_run_iso": next_run.isoformat(),
            "time_until_sleep_cycle": f"{hours_until}h {minutes_until}m",
            "last_run": self.last_run.isoformat() if self.last_run else "None (Pending first cycle)",
            "total_autonomous_runs": self.total_runs,
            "recent_runs": self.history[-5:]
        }

    def toggle(self) -> bool:
        self.is_enabled = not self.is_enabled
        logger.info(f"Autonomous Replay Scheduler toggled: {self.is_enabled}")
        return self.is_enabled

    async def execute_cycle(self, trigger_source: str = "scheduled_sleep") -> Dict[str, Any]:
        """Executes replay cycle and logs autonomous history."""
        start_ts = datetime.now()
        logger.info(f"Triggering Autonomous Cognitive Replay cycle ({trigger_source})...")
        
        # Run replay engine in thread pool to prevent blocking asyncio loop
        result = await asyncio.to_thread(replay_engine.run_replay_cycle, force_all=False)
        
        duration_sec = round((datetime.now() - start_ts).total_seconds(), 2)
        self.last_run = datetime.now()
        self.total_runs += 1

        # Dispatch morning briefing to webhook if configured
        dispatch_res = None
        if result.get("status") == "success" and result.get("briefing"):
            from app.dispatcher import dispatcher
            dispatch_res = await asyncio.to_thread(dispatcher.dispatch_briefing, result["briefing"])

        run_record = {
            "timestamp": self.last_run.isoformat(),
            "trigger": trigger_source,
            "status": result.get("status"),
            "headline": result.get("headline"),
            "replayed_atoms": result.get("replayed_atoms", 0),
            "duration_sec": duration_sec,
            "dispatch": dispatch_res
        }
        self.history.append(run_record)
        return run_record

    async def start_loop(self):
        """Infinite background loop checking for 3:00 AM sleep cycle."""
        logger.info(f"Starting Autonomous 3:00 AM Sleep Scheduler background worker...")
        while True:
            try:
                if self.is_enabled:
                    now = datetime.now()
                    if now.hour == self.target_hour and now.minute == self.target_minute:
                        logger.info("3:00 AM Sleep Cycle reached. Running Cognitive Consolidation...")
                        await self.execute_cycle(trigger_source="cron_0300_sleep")
                        # Sleep 65 seconds so it doesn't trigger multiple times in the same minute
                        await asyncio.sleep(65)
                await asyncio.sleep(20)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Scheduler loop error: {e}")
                await asyncio.sleep(30)

scheduler = AutonomousReplayScheduler(target_hour=3, target_minute=0)
