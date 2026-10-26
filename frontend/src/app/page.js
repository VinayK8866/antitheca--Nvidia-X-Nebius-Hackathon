"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import DailyBriefingView from "../components/DailyBriefingView";
import KnowledgeGraphView from "../components/KnowledgeGraphView";
import AdversarialView from "../components/AdversarialView";
import ConsoleView from "../components/ConsoleView";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export default function Home() {
  const [activeTab, setActiveTab] = useState("replay");
  const [systemStatus, setSystemStatus] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [challenges, setChallenges] = useState([]);
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [codeAudit, setCodeAudit] = useState(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  // Fetch initial telemetry
  const refreshAll = async () => {
    try {
      const [resStatus, resBriefing, resGraph, resChallenges, resScheduler, resAudit] = await Promise.all([
        fetch(`${BACKEND_URL}/api/status`).then((r) => r.ok ? r.json() : null),
        fetch(`${BACKEND_URL}/api/replay/latest`).then((r) => r.ok ? r.json() : null),
        fetch(`${BACKEND_URL}/api/graph`).then((r) => r.ok ? r.json() : null),
        fetch(`${BACKEND_URL}/api/challenges`).then((r) => r.ok ? r.json() : []),
        fetch(`${BACKEND_URL}/api/replay/schedule`).then((r) => r.ok ? r.json() : null),
        fetch(`${BACKEND_URL}/api/audit/code`).then((r) => r.ok ? r.json() : null)
      ]);

      if (resStatus) setSystemStatus(resStatus);
      if (resBriefing) {
        setBriefing(resBriefing.headline ? resBriefing : (resBriefing.briefing || null));
      }
      if (resGraph) setGraphData(resGraph);
      if (resChallenges) setChallenges(resChallenges);
      if (resScheduler) setSchedulerStatus(resScheduler);
      if (resAudit) setCodeAudit(resAudit);
    } catch (e) {
      console.warn("Could not connect to backend:", e);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["replay", "graph", "challenges", "console"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
    refreshAll();
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location);
      url.searchParams.set("tab", tabId);
      window.history.replaceState({}, "", url);
    }
  };

  const handleTriggerReplay = async () => {
    setIsReplaying(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/replay/trigger?force_all=true`, {
        method: "POST"
      });
      if (resp.ok) {
        await refreshAll();
      }
    } catch (e) {
      console.error("Replay trigger failed:", e);
    } finally {
      setIsReplaying(false);
    }
  };

  const handleTriggerScheduleSimulation = async () => {
    setIsReplaying(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/replay/schedule/trigger`, {
        method: "POST"
      });
      if (resp.ok) {
        await refreshAll();
      }
    } catch (e) {
      console.error("Schedule simulation failed:", e);
    } finally {
      setIsReplaying(false);
    }
  };

  const handleRunCodeAudit = async () => {
    setIsAuditing(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/audit/code`);
      if (resp.ok) {
        const audit = await resp.json();
        setCodeAudit(audit);
      }
    } catch (e) {
      console.error("Code audit failed:", e);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleQuery = async (query) => {
    const resp = await fetch(`${BACKEND_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, session_id: "user_session" })
    });
    if (!resp.ok) throw new Error("Query failed");
    return await resp.json();
  };

  const handleIngestText = async (title, content, modality) => {
    const resp = await fetch(`${BACKEND_URL}/api/ingest/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, modality })
    });
    if (!resp.ok) throw new Error("Ingest failed");
    const result = await resp.json();
    await refreshAll();
    return result;
  };

  const handleIngestUrl = async (url) => {
    const resp = await fetch(`${BACKEND_URL}/api/ingest/url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    if (!resp.ok) throw new Error("URL ingest failed");
    const result = await resp.json();
    await refreshAll();
    return result;
  };

  const handleIngestFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const resp = await fetch(`${BACKEND_URL}/api/ingest/file`, {
      method: "POST",
      body: formData
    });
    if (!resp.ok) throw new Error("File upload failed");
    const result = await resp.json();
    await refreshAll();
    return result;
  };

  const handleRespondToChallenge = async (challengeId, userResponse, action) => {
    try {
      await fetch(`${BACKEND_URL}/api/challenges/${challengeId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_response: userResponse, action })
      });
      await refreshAll();
    } catch (e) {
      console.error("Failed to respond to challenge:", e);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        systemStatus={systemStatus}
        schedulerStatus={schedulerStatus}
      />

      <main style={{ flex: 1 }}>
        {activeTab === "replay" && (
          <DailyBriefingView
            briefing={briefing}
            onTriggerReplay={handleTriggerReplay}
            isReplaying={isReplaying}
            schedulerStatus={schedulerStatus}
            onSimulateSchedule={handleTriggerScheduleSimulation}
          />
        )}
        {activeTab === "graph" && (
          <KnowledgeGraphView
            graphData={graphData}
          />
        )}
        {activeTab === "challenges" && (
          <AdversarialView
            challenges={challenges}
            onRespondToChallenge={handleRespondToChallenge}
            codeAudit={codeAudit}
            onRunCodeAudit={handleRunCodeAudit}
            isAuditing={isAuditing}
          />
        )}
        {activeTab === "console" && (
          <ConsoleView
            onQuery={handleQuery}
            onIngestText={handleIngestText}
            onIngestUrl={handleIngestUrl}
            onIngestFile={handleIngestFile}
          />
        )}
      </main>
    </div>
  );
}
