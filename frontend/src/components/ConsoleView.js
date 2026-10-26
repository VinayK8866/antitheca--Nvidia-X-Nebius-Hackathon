"use client";

import { useState } from "react";
import { Send, Plus, Link2, FileText, Sparkles, Brain, CheckCircle, Lightbulb, Clock } from "lucide-react";

export default function ConsoleView({ onQuery, onIngestText, onIngestUrl }) {
  // Chat state
  const [queryText, setQueryText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isQuerying, setIsQuerying] = useState(false);

  // Ingest state
  const [ingestType, setIngestType] = useState("note"); // 'note' or 'url'
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteModality, setNoteModality] = useState("note");
  const [urlInput, setUrlInput] = useState("");
  const [ingestStatus, setIngestStatus] = useState(null);
  const [isIngesting, setIsIngesting] = useState(false);

  const handleSendQuery = async (e) => {
    e?.preventDefault();
    if (!queryText.trim() || isQuerying) return;

    const userQ = queryText.trim();
    setQueryText("");
    setIsQuerying(true);

    const userMessage = { role: "user", text: userQ };
    setChatHistory((prev) => [...prev, userMessage]);

    try {
      const res = await onQuery(userQ);
      const assistantMessage = {
        role: "assistant",
        text: res.response,
        model: res.model_used,
        latency: res.latency_ms,
        arbitrage: res.arbitrage_nuggets || [],
        sources: res.sources || []
      };
      setChatHistory((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", text: "Error connecting to Engram backend. Please ensure server is running." }
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    setIsIngesting(true);
    setIngestStatus(null);

    try {
      if (ingestType === "note") {
        if (!noteTitle || !noteContent) return;
        const res = await onIngestText(noteTitle, noteContent, noteModality);
        setIngestStatus({
          type: "success",
          msg: `Ingested "${res.title}" into personal memory ladder (${res.chunks_count} chunks indexed).`
        });
        setNoteTitle("");
        setNoteContent("");
      } else {
        if (!urlInput) return;
        const res = await onIngestUrl(urlInput);
        setIngestStatus({
          type: "success",
          msg: `Extracted & indexed "${res.title}" from media stream.`
        });
        setUrlInput("");
      }
    } catch (err) {
      setIngestStatus({ type: "error", msg: "Failed to ingest content: " + err.message });
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div style={{
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "24px",
      display: "grid",
      gridTemplateColumns: "400px 1fr",
      gap: "24px",
      minHeight: "calc(100vh - 120px)"
    }}>
      {/* Left Column: Knowledge Ingest Station */}
      <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Plus size={18} style={{ color: "var(--accent-primary)" }} />
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Ingest Knowledge Atom</h2>
        </div>

        {/* Tab Selector */}
        <div style={{ display: "flex", gap: "6px", background: "var(--bg-elevated)", padding: "4px", borderRadius: "8px", marginBottom: "18px" }}>
          <button
            onClick={() => setIngestType("note")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "7px",
              borderRadius: "6px",
              border: "none",
              background: ingestType === "note" ? "var(--bg-secondary)" : "transparent",
              color: ingestType === "note" ? "var(--accent-primary)" : "var(--text-secondary)",
              fontWeight: "600",
              fontSize: "0.82rem",
              cursor: "pointer"
            }}
          >
            <FileText size={15} />
            <span>Note / Decision</span>
          </button>
          <button
            onClick={() => setIngestType("url")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "7px",
              borderRadius: "6px",
              border: "none",
              background: ingestType === "url" ? "var(--bg-secondary)" : "transparent",
              color: ingestType === "url" ? "var(--accent-primary)" : "var(--text-secondary)",
              fontWeight: "600",
              fontSize: "0.82rem",
              cursor: "pointer"
            }}
          >
            <Link2 size={15} />
            <span>Instagram / URL</span>
          </button>
        </div>

        {/* Ingest Form */}
        <form onSubmit={handleIngest} style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          {ingestType === "note" ? (
            <>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", marginBottom: "5px", color: "var(--text-secondary)" }}>
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ADR 042: Database Selection Strategy"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-strong)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "0.88rem",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", marginBottom: "5px", color: "var(--text-secondary)" }}>
                  Modality
                </label>
                <select
                  value={noteModality}
                  onChange={(e) => setNoteModality(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-strong)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "0.88rem",
                    outline: "none"
                  }}
                >
                  <option value="note">Personal Note</option>
                  <option value="decision">Architecture Decision (Precedent)</option>
                  <option value="essay">Deep Reflection / Essay</option>
                  <option value="code">Code Snippet / Spec</option>
                </select>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", marginBottom: "5px", color: "var(--text-secondary)" }}>
                  Content (Markdown & [[wikilinks]])
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Draft your thoughts or decisions. Use [[Concept]] to auto-link into your personal ontology..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  style={{
                    width: "100%",
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-strong)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "0.86rem",
                    lineHeight: "1.45",
                    resize: "none",
                    outline: "none"
                  }}
                />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: "600", marginBottom: "5px", color: "var(--text-secondary)" }}>
                  Instagram Reel or Web URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.instagram.com/reel/... or https://..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-strong)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "0.88rem",
                    outline: "none"
                  }}
                />
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", lineHeight: "1.4" }}>
                Engram parses OpenGraph captions, OCRs slide keyframes, strips tracking metadata, and embeds the knowledge for overnight consolidation.
              </div>
            </div>
          )}

          {ingestStatus && (
            <div style={{
              padding: "10px",
              borderRadius: "8px",
              fontSize: "0.8rem",
              background: ingestStatus.type === "success" ? "var(--emerald-bg)" : "var(--crimson-bg)",
              color: ingestStatus.type === "success" ? "var(--emerald-wisdom)" : "var(--crimson-challenge)"
            }}>
              {ingestStatus.msg}
            </div>
          )}

          <button
            type="submit"
            disabled={isIngesting}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent-primary)",
              color: "#ffffff",
              fontSize: "0.88rem",
              fontWeight: "600",
              cursor: isIngesting ? "not-allowed" : "pointer",
              opacity: isIngesting ? 0.7 : 1
            }}
          >
            {isIngesting ? "Ingesting & Analyzing..." : "Ingest into Brain"}
          </button>
        </form>
      </div>

      {/* Right Column: Epistemic Query & Arbitrage Console */}
      <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Brain size={18} style={{ color: "var(--accent-primary)" }} />
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Epistemic Cognitive Console</h2>
          </div>
          <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
            Ground Truth RAG + Proactive Arbitrage
          </span>
        </div>

        {/* Messages Stream */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          paddingRight: "8px",
          marginBottom: "16px"
        }}>
          {chatHistory.length === 0 ? (
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "var(--text-tertiary)",
              padding: "40px 20px"
            }}>
              <Sparkles size={32} style={{ color: "var(--accent-primary)", marginBottom: "12px" }} />
              <h3 style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--text-primary)" }}>Engram is Ready</h3>
              <p style={{ fontSize: "0.86rem", maxWidth: "420px", marginTop: "6px" }}>
                Ask a question to cross-reference your memories and past decisions, or stress-test a new project idea against established precedent.
              </p>
            </div>
          ) : (
            chatHistory.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: msg.role === "user" ? "75%" : "90%"
                }}
              >
                <div style={{
                  padding: "12px 16px",
                  borderRadius: "12px",
                  background: msg.role === "user" ? "var(--accent-primary)" : "var(--bg-elevated)",
                  color: msg.role === "user" ? "#ffffff" : "var(--text-primary)",
                  fontSize: "0.9rem",
                  lineHeight: "1.55",
                  whiteSpace: "pre-wrap"
                }}>
                  {msg.text}
                </div>

                {/* Proactive Knowledge Arbitrage Card (Assistant only) */}
                {Boolean(msg.arbitrage && msg.arbitrage.length > 0) && (
                  <div style={{
                    marginTop: "8px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "var(--amber-bg)",
                    border: "1px solid rgba(217, 119, 6, 0.25)",
                    fontSize: "0.82rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--amber-fact)", fontWeight: "700", marginBottom: "4px" }}>
                      <Lightbulb size={14} />
                      <span>Proactive Knowledge Arbitrage:</span>
                    </div>
                    {msg.arbitrage.map((a, aIdx) => (
                      <div key={aIdx} style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                        • <strong>{a.title}</strong>: {a.reason}
                      </div>
                    ))}
                  </div>
                )}

                {/* Metadata Footer */}
                {msg.role === "assistant" && msg.model && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                    <Clock size={11} />
                    <span>{msg.latency}ms</span>
                    <span>•</span>
                    <span>{msg.model}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendQuery} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Ask Engram, challenge an assumption, or query your second brain..."
            disabled={isQuerying}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1px solid var(--border-strong)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontSize: "0.92rem",
              outline: "none"
            }}
          />
          <button
            type="submit"
            disabled={isQuerying || !queryText.trim()}
            style={{
              padding: "0 20px",
              borderRadius: "10px",
              border: "none",
              background: "var(--accent-primary)",
              color: "#ffffff",
              cursor: isQuerying || !queryText.trim() ? "not-allowed" : "pointer",
              opacity: isQuerying || !queryText.trim() ? 0.6 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
