import logging
import requests
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class MorningDispatcher:
    """Dispatches autonomous morning briefings to Discord, Telegram, or webhooks."""

    def __init__(self):
        self.default_webhook_url = getattr(settings, "DISPATCH_WEBHOOK_URL", "")

    def is_configured(self, webhook_url: Optional[str] = None) -> bool:
        url = webhook_url or self.default_webhook_url
        return bool(url and url.strip().startswith("http"))

    def dispatch_briefing(self, briefing: Dict[str, Any], webhook_url: Optional[str] = None) -> Dict[str, Any]:
        """Dispatches rich cognitive synthesis to the configured webhook."""
        target_url = webhook_url or self.default_webhook_url
        if not target_url:
            logger.info("Morning Dispatch skipped: no webhook URL configured.")
            return {"status": "skipped", "message": "No webhook URL configured"}

        headline = briefing.get("headline", "Cognitive Replay Synthesis")
        summary = briefing.get("summary_markdown", "")
        # Take the first ~600 characters of the summary for the notification preview
        preview_text = summary[:600] + ("..." if len(summary) > 600 else "")
        date_str = briefing.get("briefing_date", "Today")
        atoms_count = briefing.get("new_connections", 0)
        contradictions = briefing.get("contradictions", 0)
        facts = briefing.get("gaps_researched", 0)

        # Discord webhook format
        if "discord.com" in target_url:
            payload = {
                "username": "Engram Epistemic Engine",
                "avatar_url": "https://assets.khoj.dev/khoj-logo-sideways-1200x540.png",
                "embeds": [
                    {
                        "title": f"🌅 Engram Morning Cognitive Briefing ({date_str})",
                        "description": f"**{headline}**\n\n{preview_text}",
                        "color": 65450, # Emerald teal
                        "fields": [
                            {"name": "🧠 Consolidated Atoms", "value": str(atoms_count), "inline": True},
                            {"name": "⚡ Contradictions Flagged", "value": str(contradictions), "inline": True},
                            {"name": "🌐 Verified Web Facts", "value": str(facts), "inline": True}
                        ],
                        "footer": {
                            "text": "Autonomous 3:00 AM Sleep Replay • NVIDIA Nemotron 3 Ultra 550B & Tavily"
                        }
                    }
                ]
            }
        else:
            # Generic JSON / Slack compatible webhook format
            payload = {
                "text": f"🌅 *Engram Morning Briefing ({date_str})*\n*{headline}*\n\n{preview_text}",
                "headline": headline,
                "summary": summary,
                "metrics": {
                    "atoms": atoms_count,
                    "contradictions": contradictions,
                    "web_facts": facts
                },
                "source": "Engram Autonomous Sleep Replay"
            }

        try:
            resp = requests.post(target_url, json=payload, timeout=10)
            if resp.status_code in [200, 204]:
                logger.info(f"Morning Dispatch successfully sent to {target_url[:25]}...")
                return {"status": "delivered", "http_status": resp.status_code}
            else:
                logger.warning(f"Webhook response status {resp.status_code}: {resp.text}")
                return {"status": "failed", "http_status": resp.status_code, "error": resp.text}
        except Exception as e:
            logger.error(f"Error dispatching morning webhook: {e}")
            return {"status": "error", "error": str(e)}

    def test_ping(self, webhook_url: Optional[str] = None) -> Dict[str, Any]:
        """Sends an immediate test ping to verify webhook connectivity."""
        sample_briefing = {
            "headline": "Epistemic Test Ping: Autonomous Sleep Replay Active",
            "summary_markdown": "This is a live test notification from Engram. When your 3:00 AM sleep replay finishes, your daily synthesis, contradiction radar, and Tavily fact-check results will arrive here automatically.",
            "briefing_date": "Test Dispatch",
            "new_connections": 12,
            "contradictions": 1,
            "gaps_researched": 3
        }
        return self.dispatch_briefing(sample_briefing, webhook_url=webhook_url)

dispatcher = MorningDispatcher()
