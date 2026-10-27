import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.database import get_self_db_connection
from app.replay_engine import replay_engine

logger = logging.getLogger(__name__)

class AutonomousReplayScheduler:
    """
    Manages the 3:00 AM Autonomous Cognitive Sleep Cycle with persistent audit history
    and distributed concurrency locks across multi-worker ASGI processes.
    """

    def __init__(self, target_hour: int = 3, target_minute: int = 0):
        self.target_hour = target_hour
        self.target_minute = target_minute
        self.is_enabled = True
        self.last_run: Optional[datetime] = None
        self.total_runs = 0
        self.history: List[Dict[str, Any]] = []
        self._task = None
        self._load_persistent_state()

    def _load_persistent_state(self):
        """Loads historical runs and execution counts from persistent SQLite storage."""
        try:
            conn = get_self_db_connection()
            cur = conn.cursor()
            
            # 1. Total runs count
            cur.execute("SELECT COUNT(*) FROM scheduler_runs")
            row = cur.fetchone()
            self.total_runs = row[0] if row else 0

            # 2. Recent run records
            cur.execute("""
            SELECT id, trigger_source, status, headline, replayed_atoms, duration_sec, dispatch_json, created_at
            FROM scheduler_runs
            ORDER BY id DESC
            LIMIT 20
            """)
            rows = cur.fetchall()
            conn.close()

            history = []
            for r in rows:
                dispatch = None
                if r["dispatch_json"]:
                    try:
                        dispatch = json.loads(r["dispatch_json"])
                    except Exception:
                        dispatch = r["dispatch_json"]
                history.append({
                    "id": r["id"],
                    "timestamp": r["created_at"],
                    "trigger": r["trigger_source"],
                    "status": r["status"],
                    "headline": r["headline"],
                    "replayed_atoms": r["replayed_atoms"],
                    "duration_sec": r["duration_sec"],
                    "dispatch": dispatch
                })
            self.history = list(reversed(history))
            if self.history:
                try:
                    self.last_run = datetime.fromisoformat(self.history[-1]["timestamp"])
                except Exception:
                    self.last_run = None
            else:
                self.last_run = None
        except Exception as e:
            logger.warning(f"Could not load scheduler history from database: {e}")

    def get_status(self) -> Dict[str, Any]:
        """Returns scheduler telemetry, next run timestamp, and persistent history."""
        # Refresh history from persistent DB
        self._load_persistent_state()

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

    def _acquire_scheduled_cycle_lock(self, target_date_str: str) -> bool:
        """
        Advisory concurrency lock ensuring only ONE worker executes the cycle
        across multi-worker ASGI deployments or container restarts.
        """
        try:
            conn = get_self_db_connection()
            cur = conn.cursor()

            # Check if today's cycle already executed
            cur.execute("SELECT value FROM scheduler_state WHERE key = 'last_completed_sleep_date'")
            row = cur.fetchone()
            if row and row["value"] == target_date_str:
                conn.close()
                return False

            # Check if active lock held by another worker within last 15 minutes
            cur.execute("SELECT value FROM scheduler_state WHERE key = 'cycle_running_lock'")
            lock_row = cur.fetchone()
            if lock_row and lock_row["value"]:
                try:
                    lock_time = datetime.fromisoformat(lock_row["value"])
                    if datetime.now() - lock_time < timedelta(minutes=15):
                        conn.close()
                        return False
                except Exception:
                    pass

            # Acquire lock atomically
            now_iso = datetime.now().isoformat()
            cur.execute("""
            INSERT INTO scheduler_state (key, value, updated_at)
            VALUES ('cycle_running_lock', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
            """, (now_iso,))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error acquiring scheduler lock: {e}")
            return True

    def _mark_cycle_completed(self, target_date_str: str):
        """Marks the cycle as completed for the date and releases lock."""
        try:
            conn = get_self_db_connection()
            cur = conn.cursor()
            cur.execute("""
            INSERT INTO scheduler_state (key, value, updated_at)
            VALUES ('last_completed_sleep_date', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
            """, (target_date_str,))
            cur.execute("DELETE FROM scheduler_state WHERE key = 'cycle_running_lock'")
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Error marking cycle completed: {e}")

    def _release_cycle_lock(self):
        """Releases active cycle running lock."""
        try:
            conn = get_self_db_connection()
            cur = conn.cursor()
            cur.execute("DELETE FROM scheduler_state WHERE key = 'cycle_running_lock'")
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Error releasing cycle lock: {e}")

    async def execute_cycle(self, trigger_source: str = "scheduled_sleep") -> Dict[str, Any]:
        """Executes replay cycle and persists audit run record to SQLite."""
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
            "status": result.get("status", "unknown"),
            "headline": result.get("headline", ""),
            "replayed_atoms": result.get("replayed_atoms", 0),
            "duration_sec": duration_sec,
            "dispatch": dispatch_res
        }

        # Persist audit log to SQLite
        try:
            conn = get_self_db_connection()
            cur = conn.cursor()
            cur.execute("""
            INSERT INTO scheduler_runs (trigger_source, status, headline, replayed_atoms, duration_sec, dispatch_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                trigger_source,
                run_record["status"],
                run_record["headline"],
                run_record["replayed_atoms"],
                duration_sec,
                json.dumps(dispatch_res) if dispatch_res else None,
                run_record["timestamp"]
            ))
            run_record["id"] = cur.lastrowid
            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Failed to persist scheduler run record to database: {e}")

        self.history.append(run_record)
        return run_record

    async def start_loop(self):
        """
        Background loop checking for 3:00 AM sleep cycle with inter-worker deduplication.
        """
        logger.info(f"Starting Autonomous 3:00 AM Sleep Scheduler background worker...")
        while True:
            try:
                if self.is_enabled:
                    now = datetime.now()
                    if now.hour == self.target_hour and now.minute == self.target_minute:
                        today_str = now.strftime("%Y-%m-%d")
                        if self._acquire_scheduled_cycle_lock(today_str):
                            logger.info(f"3:00 AM Sleep Cycle reached for {today_str}. Running Cognitive Consolidation...")
                            try:
                                await self.execute_cycle(trigger_source="cron_0300_sleep")
                                self._mark_cycle_completed(today_str)
                            except Exception as e_cycle:
                                logger.error(f"Error executing scheduled replay cycle: {e_cycle}")
                                self._release_cycle_lock()
                            # Sleep 65 seconds so it doesn't trigger multiple times in the same minute
                            await asyncio.sleep(65)
                        else:
                            logger.debug(f"3:00 AM cycle for {today_str} skipped (already executed or locked by another worker).")
                            await asyncio.sleep(65)
                await asyncio.sleep(20)
            except asyncio.CancelledError:
                logger.info("Autonomous Replay Scheduler background worker cancelled.")
                break
            except Exception as e:
                logger.error(f"Scheduler loop error: {e}")
                await asyncio.sleep(30)

scheduler = AutonomousReplayScheduler(target_hour=3, target_minute=0)

if __name__ == "__main__":
    import sys
    import argparse
    parser = argparse.ArgumentParser(description="Decoupled Autonomous Cognitive Sleep Worker")
    parser.add_argument("--once", action="store_true", help="Execute single sleep consolidation cycle and exit (ideal for external crons, systemd timers, or cloud functions).")
    parser.add_argument("--daemon", action="store_true", help="Run as standalone worker daemon process decoupled from FastAPI web server.")
    parser.add_argument("--status", action="store_true", help="Print scheduler status telemetry.")
    args = parser.parse_args()

    if args.status:
        import pprint
        pprint.pprint(scheduler.get_status())
    elif args.once:
        print("Executing single standalone Cognitive Replay consolidation cycle...")
        result = asyncio.run(scheduler.execute_cycle(trigger_source="external_cron_worker"))
        print(f"Cycle completed. Status: {result.get('status')}, Replayed Atoms: {result.get('replayed_atoms')}")
    else:
        print("Starting decoupled background Cognitive Replay worker daemon...")
        try:
            asyncio.run(scheduler.start_loop())
        except KeyboardInterrupt:
            print("Scheduler worker stopped.")
