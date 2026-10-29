"use client";

import { useState, useRef } from "react";
import { Send, Plus, Link2, FileText, Sparkles, Brain, CheckCircle, Lightbulb, Clock, Upload, Eye, Image as ImageIcon, AlertTriangle, FolderOpen, Globe, Search, ExternalLink } from "lucide-react";

export default function ConsoleView({ onQuery, onIngestText, onIngestUrl, onIngestFile, onIngestFolder, onDeepResearch }) {
  // Chat state
  const [queryText, setQueryText] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isResearching, setIsResearching] = useState(false);

  // Ingest state
  const [ingestType, setIngestType] = useState("vault"); // 'vault', 'file', 'note', 'url'
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteModality, setNoteModality] = useState("note");
  const [urlInput, setUrlInput] = useState("");
  const [folderPath, setFolderPath] = useState("/home/user/Private_View/Vinay/Nebius Nvidia Hackathon/backend/demo_vault");
  const [selectedFile, setSelectedFile] = useState(null);
  const [ingestStatus, setIngestStatus] = useState(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const fileInputRef = useRef(null);

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
        { role: "assistant", text: "Error connecting to AntiTheca backend. Please ensure server is running." }
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleTriggerDeepResearch = async () => {
    if (!queryText.trim() || isResearching) return;
    const userQ = queryText.trim();
    setQueryText("");
    setIsResearching(true);

    const userMessage = { role: "user", text: `[Deep Research] ${userQ}` };
    setChatHistory((prev) => [...prev, userMessage]);

    try {
      const res = await onDeepResearch(userQ);
      const researchMessage = {
        role: "assistant",
        text: res.synthesis || "Deep research complete.",
        isDeepResearch: true,
        topic: res.topic,
        subqueries: res.subqueries || [],
        sources: res.sources || [],
        confidence: res.confidence_score,
        model: "NVIDIA Nemotron + Tavily Multi-Query"
      };
      setChatHistory((prev) => [...prev, researchMessage]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", text: "Deep research failed: " + err.message }
      ]);
    } finally {
      setIsResearching(false);
    }
  };

  const handleLoadSampleSlide = async () => {
    try {
      setIsIngesting(true);
      setIngestStatus({ type: "info", msg: "Loading sample viral reel slide & analyzing with NVIDIA Nemotron 3.5 Super-VL..." });
      const resp = await fetch("/sample_reel_slide.png");
      const blob = await resp.blob();
      const file = new File([blob], "instagram_reel_20_microservices.png", { type: "image/png" });
      setSelectedFile(file);
      
      const res = await onIngestFile(file);
      setIngestStatus({
        type: "success",
        msg: `NVIDIA Nemotron 3.5 Super-VL extracted slide keyframes! Added "${res.title}" (${res.chunks_count} chunks indexed).`,
        challenge: res.adversarial_challenge
      });
    } catch (err) {
      setIngestStatus({ type: "error", msg: "Failed to analyze sample slide: " + err.message });
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIngestDemoVault = async () => {
    const demoPath = "demo_vault";
    setFolderPath(demoPath);
    setIsIngesting(true);
    setIngestStatus({ type: "info", msg: "Scanning and bulk-ingesting sample engineering vault..." });
    try {
      const res = await onIngestFolder(demoPath);
      setIngestStatus({
        type: "success",
        msg: `Obsidian Vault Ingested! Scanned ${res.scanned_count} files, indexed ${res.ingested_count} notes & ADRs into knowledge graph.`
      });
    } catch (err) {
      setIngestStatus({ type: "error", msg: "Failed to ingest vault: " + err.message });
    } finally {
      setIsIngesting(false);
    }
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    setIsIngesting(true);
    setIngestStatus(null);

    try {
      if (ingestType === "vault") {
        if (!folderPath) return;
        const res = await onIngestFolder(folderPath);
        setIngestStatus({
          type: "success",
          msg: `Bulk Vault Ingested! ${res.ingested_count} files indexed from ${res.folder}.`
        });
      } else if (ingestType === "note") {
        if (!noteTitle || !noteContent) return;
        const res = await onIngestText(noteTitle, noteContent, noteModality);
        setIngestStatus({
          type: "success",
          msg: `Ingested "${res.title}" into personal memory ladder (${res.chunks_count} chunks indexed).`,
          challenge: res.adversarial_challenge
        });
        setNoteTitle("");
        setNoteContent("");
      } else if (ingestType === "url") {
        if (!urlInput) return;
        const res = await onIngestUrl(urlInput);
        setIngestStatus({
          type: "success",
          msg: `Extracted & indexed "${res.title}" from media stream.`,
          challenge: res.adversarial_challenge
        });
        setUrlInput("");
      } else if (ingestType === "file") {
        if (!selectedFile) return;
        const res = await onIngestFile(selectedFile);
        setIngestStatus({
          type: "success",
          msg: `NVIDIA Nemotron 3.5 Super-VL analyzed visual media! Indexed "${res.title}" (${res.chunks_count} chunks).`,
          challenge: res.adversarial_challenge
        });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
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
      padding: "32px 28px",
      display: "grid",
      gridTemplateColumns: "420px 1fr",
      gap: "24px",
      minHeight: "calc(100vh - 120px)"
    }}>
      {/* Left Column: Knowledge Ingest Station (Engram Workbench Panel) */}
      <div className="engram-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "var(--bg-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-primary)"
            }}>
              <Plus size={16} />
            </div>
            <h3 style={{ fontSize: "1.02rem", fontWeight: "600", color: "var(--text-primary)" }}>
              Ingest Knowledge Atom
            </h3>
          </div>

          <span className="engram-mono-badge" style={{ fontSize: "0.68rem" }}>
            MULTIMODAL
          </span>
        </div>

        {/* Tab Selector (4 Modalities) */}
        <div style={{
          display: "flex",
          gap: "4px",
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-hairline)",
          padding: "3px",
          borderRadius: "8px",
          marginBottom: "18px"
        }}>
          {[
            { id: "vault", label: "Vault Bulk", icon: FolderOpen },
            { id: "file", label: "Slide / VL", icon: Eye },
            { id: "note", label: "Note / ADR", icon: FileText },
            { id: "url", label: "URL / Reel", icon: Link2 }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = ingestType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (ingestType !== item.id) {
                    setIngestType(item.id);
                    setIngestStatus(null);
                  }
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  padding: "7px 2px",
                  borderRadius: "6px",
                  border: "1px solid transparent",
                  background: isActive ? "var(--bg-card)" : "transparent",
                  color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: isActive ? "var(--shadow-sm)" : "none",
                  borderColor: isActive ? "var(--border-hairline)" : "transparent",
                  fontWeight: isActive ? "600" : "500",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap"
                }}
              >
                <Icon size={12} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Ingest Form */}
        <form onSubmit={handleIngest} style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          {ingestType === "vault" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: "0.76rem", fontWeight: "600", color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono), monospace" }}>
                  LOCAL VAULT DIRECTORY PATH
                </label>
                <span style={{ fontSize: "0.68rem", color: "var(--emerald-wisdom)", fontWeight: "600" }}>
                  PARA Standard
                </span>
              </div>

              <div>
                <input
                  type="text"
                  required
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="/absolute/path/to/notes or ./demo_vault"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "7px",
                    border: "1px solid var(--border-hairline)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "0.82rem",
                    fontFamily: "var(--font-geist-mono), monospace",
                    outline: "none"
                  }}
                />
              </div>

              {/* Quick 1-Click Demo Vault Button */}
              <button
                type="button"
                onClick={handleIngestDemoVault}
                disabled={isIngesting}
                className="engram-btn-secondary"
                style={{ padding: "8px 12px", fontSize: "0.78rem" }}
              >
                <Sparkles size={13} />
                <span>Load Sample Engineering Vault (5 Notes & ADRs)</span>
              </button>

              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                Recursively scans and embeds Markdown files, architecture decision records, and PDFs into your sovereign personal brain in seconds.
              </div>
            </div>
          )}

          {ingestType === "file" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: "0.76rem", fontWeight: "600", color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono), monospace" }}>
                  REEL KEYFRAME / INFOGRAPHIC
                </label>
                <span className="engram-mono-badge" style={{ fontSize: "0.65rem", color: "var(--emerald-wisdom)" }}>
                  NVIDIA SUPER-VL 3.5
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "1.5px dashed var(--border-strong)",
                  borderRadius: "8px",
                  padding: "24px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: selectedFile ? "var(--bg-subtle)" : "var(--bg-input)",
                  transition: "all 0.15s ease"
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
                <Upload size={22} style={{ margin: "0 auto 8px", color: "var(--text-primary)" }} />
                <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-primary)" }}>
                  {selectedFile ? selectedFile.name : "Click to select slide or screenshot"}
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  PNG, JPG, WEBP, or PDF (Carousels & infographics)
                </div>
              </div>

              {/* Quick Sample Demo Button */}
              <button
                type="button"
                onClick={handleLoadSampleSlide}
                disabled={isIngesting}
                className="engram-btn-secondary"
                style={{ padding: "8px 12px", fontSize: "0.78rem" }}
              >
                <Sparkles size={13} />
                <span>Test Live Sample Slide: "20 Microservices Meme"</span>
              </button>

              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                Super-VL automatically OCRs diagrams, extracts architectural advice, and checks for contradictions with your saved ADRs.
              </div>
            </div>
          )}

          {ingestType === "note" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", marginBottom: "5px", color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono), monospace" }}>
                  TITLE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ADR 042: Database Selection Strategy"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "7px",
                    border: "1px solid var(--border-hairline)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "0.86rem",
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", marginBottom: "5px", color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono), monospace" }}>
                  MODALITY
                </label>
                <select
                  value={noteModality}
                  onChange={(e) => setNoteModality(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "7px",
                    border: "1px solid var(--border-hairline)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "0.86rem",
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
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", marginBottom: "5px", color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono), monospace" }}>
                  CONTENT (MARKDOWN & [[WIKILINKS]])
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
                    borderRadius: "7px",
                    border: "1px solid var(--border-hairline)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "0.86rem",
                    lineHeight: "1.5",
                    resize: "none",
                    outline: "none"
                  }}
                />
              </div>
            </>
          )}

          {ingestType === "url" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "600", marginBottom: "5px", color: "var(--text-secondary)", fontFamily: "var(--font-geist-mono), monospace" }}>
                  INSTAGRAM REEL OR WEB URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.instagram.com/reel/... or https://..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "7px",
                    border: "1px solid var(--border-hairline)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "0.86rem",
                    outline: "none"
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setUrlInput("https://www.instagram.com/reel/demo")}
                disabled={isIngesting}
                className="engram-btn-secondary"
                style={{ padding: "6px 10px", fontSize: "0.75rem", width: "fit-content" }}
              >
                <Sparkles size={12} />
                <span>Use Verified Demo Reel ("20 Microservices")</span>
              </button>
              <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                Parses OpenGraph captions and keyframes. Extracts architectural claims and checks for contradictions with your saved ADRs.
              </div>
            </div>
          )}

          {/* Status Alert */}
          {ingestStatus && (
            <div style={{
              padding: "10px 12px",
              borderRadius: "7px",
              fontSize: "0.82rem",
              background: ingestStatus.type === "success" ? "var(--emerald-bg)" : ingestStatus.type === "info" ? "var(--cyan-bg)" : "var(--crimson-bg)",
              color: ingestStatus.type === "success" ? "var(--emerald-wisdom)" : ingestStatus.type === "info" ? "var(--cyan-tavily)" : "var(--crimson-challenge)",
              border: `1px solid ${ingestStatus.type === "success" ? "var(--emerald-border)" : "var(--crimson-border)"}`
            }}>
              <div>{ingestStatus.msg}</div>
              {ingestStatus.challenge && (
                <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid rgba(239, 68, 68, 0.2)", display: "flex", alignItems: "center", gap: "5px", color: "var(--crimson-challenge)", fontWeight: "600" }}>
                  <AlertTriangle size={13} />
                  <span>Adversarial Tension Flagged! Check Adversarial Radar tab.</span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isIngesting || (ingestType === "file" && !selectedFile)}
            className="engram-btn-primary"
            style={{ padding: "10px 16px", marginTop: "auto" }}
          >
            {isIngesting ? "Analyzing & Ingesting..." : ingestType === "file" ? "Analyze Slide with Super-VL" : "Ingest into Brain"}
          </button>
        </form>
      </div>

      {/* Right Column: Epistemic Query & Arbitrage Console */}
      <div className="engram-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: "var(--bg-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-primary)"
            }}>
              <Brain size={16} />
            </div>
            <h3 style={{ fontSize: "1.02rem", fontWeight: "600", color: "var(--text-primary)" }}>
              Epistemic Cognitive Console
            </h3>
          </div>
          <span className="engram-mono-badge" style={{ fontSize: "0.68rem" }}>
            GROUND TRUTH RAG + ARBITRAGE
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
              color: "var(--text-muted)",
              padding: "48px 20px"
            }}>
              <Sparkles size={32} style={{ color: "var(--text-primary)", marginBottom: "12px", opacity: 0.8 }} />
              <h4 style={{ fontSize: "1.05rem", fontWeight: "600", color: "var(--text-primary)" }}>
                AntiTheca Cognitive Console
              </h4>
              <p style={{ fontSize: "0.86rem", maxWidth: "440px", marginTop: "6px", lineHeight: "1.55" }}>
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
                  maxWidth: msg.role === "user" ? "75%" : "92%"
                }}
              >
                <div style={{
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: msg.role === "user" ? "var(--btn-primary-bg)" : "var(--bg-subtle)",
                  color: msg.role === "user" ? "var(--btn-primary-text)" : "var(--text-primary)",
                  border: msg.role === "user" ? "none" : "1px solid var(--border-hairline)",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap"
                }}>
                  {msg.text}
                </div>

                {/* Deep Research Multi-Source Card (Assistant only) */}
                {Boolean(msg.isDeepResearch) && (
                  <div style={{
                    marginTop: "10px",
                    padding: "14px 16px",
                    borderRadius: "8px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-hairline)",
                    boxShadow: "var(--shadow-sm)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--cyan-tavily)", fontWeight: "600", fontSize: "0.82rem" }}>
                        <Globe size={14} />
                        <span>Tavily Iterative Research Verification</span>
                      </div>
                      <span className="engram-mono-badge" style={{ color: "var(--emerald-wisdom)" }}>
                        {msg.confidence ?? 85}% Confidence
                      </span>
                    </div>

                    {/* Subqueries Pills */}
                    {Boolean(msg.subqueries && msg.subqueries.length > 0) && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
                        {msg.subqueries.map((sq, sqIdx) => (
                          <span key={sqIdx} className="engram-mono-badge" style={{ fontSize: "0.68rem" }}>
                            🔍 {sq}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Verified Sources */}
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "6px", fontFamily: "var(--font-geist-mono), monospace" }}>
                      Cross-Referenced Live Web Evidence ({msg.sources?.length || 0} sources):
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {msg.sources?.slice(0, 3).map((s, sIdx) => (
                        <a
                          key={sIdx}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: "var(--bg-subtle)",
                            border: "1px solid var(--border-hairline)",
                            fontSize: "0.76rem",
                            color: "var(--text-primary)",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px"
                          }}
                        >
                          <span style={{ fontWeight: "500", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {s.title}
                          </span>
                          <ExternalLink size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proactive Knowledge Arbitrage Card (Assistant only) */}
                {Boolean(msg.arbitrage && msg.arbitrage.length > 0) && (
                  <div style={{
                    marginTop: "8px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "var(--amber-bg)",
                    border: "1px solid var(--amber-border)",
                    fontSize: "0.82rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--amber-fact)", fontWeight: "600", marginBottom: "4px" }}>
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
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "4px",
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-geist-mono), monospace"
                  }}>
                    <Clock size={11} />
                    <span>{msg.latency ? `${msg.latency}ms • ` : ""}{msg.model}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendQuery} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Ask AntiTheca, challenge an assumption, or research web consensus..."
            disabled={isQuerying || isResearching}
            style={{
              flex: 1,
              padding: "11px 16px",
              borderRadius: "8px",
              border: "1px solid var(--border-hairline)",
              background: "var(--bg-input)",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              outline: "none"
            }}
          />

          {/* Deep Research Button */}
          <button
            type="button"
            onClick={handleTriggerDeepResearch}
            disabled={isResearching || isQuerying || !queryText.trim()}
            title="Perform Iterative Multi-Query Deep Research with Tavily"
            className="engram-btn-secondary"
            style={{ padding: "0 14px", fontSize: "0.82rem" }}
          >
            <Globe size={14} style={{ color: "var(--cyan-tavily)" }} />
            <span>{isResearching ? "Researching..." : "Deep Research"}</span>
          </button>

          <button
            type="submit"
            disabled={isQuerying || isResearching || !queryText.trim()}
            className="engram-btn-primary"
            style={{ padding: "0 18px" }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
