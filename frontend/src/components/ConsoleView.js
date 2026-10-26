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
        { role: "assistant", text: "Error connecting to Engram backend. Please ensure server is running." }
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
    const demoPath = "/home/user/Private_View/Vinay/Nebius Nvidia Hackathon/backend/demo_vault";
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

        {/* Tab Selector (4 Modalities) */}
        <div style={{ display: "flex", gap: "4px", background: "var(--bg-elevated)", padding: "4px", borderRadius: "8px", marginBottom: "18px" }}>
          <button
            onClick={() => setIngestType("vault")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "7px 2px",
              borderRadius: "6px",
              border: "none",
              background: ingestType === "vault" ? "var(--bg-secondary)" : "transparent",
              color: ingestType === "vault" ? "var(--accent-primary)" : "var(--text-secondary)",
              fontWeight: "600",
              fontSize: "0.76rem",
              cursor: "pointer"
            }}
          >
            <FolderOpen size={13} />
            <span>Vault Bulk</span>
          </button>
          <button
            onClick={() => setIngestType("file")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "7px 2px",
              borderRadius: "6px",
              border: "none",
              background: ingestType === "file" ? "var(--bg-secondary)" : "transparent",
              color: ingestType === "file" ? "var(--accent-primary)" : "var(--text-secondary)",
              fontWeight: "600",
              fontSize: "0.76rem",
              cursor: "pointer"
            }}
          >
            <Eye size={13} />
            <span>Slide / VL</span>
          </button>
          <button
            onClick={() => setIngestType("note")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "7px 2px",
              borderRadius: "6px",
              border: "none",
              background: ingestType === "note" ? "var(--bg-secondary)" : "transparent",
              color: ingestType === "note" ? "var(--accent-primary)" : "var(--text-secondary)",
              fontWeight: "600",
              fontSize: "0.76rem",
              cursor: "pointer"
            }}
          >
            <FileText size={13} />
            <span>Note / ADR</span>
          </button>
          <button
            onClick={() => setIngestType("url")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              padding: "7px 2px",
              borderRadius: "6px",
              border: "none",
              background: ingestType === "url" ? "var(--bg-secondary)" : "transparent",
              color: ingestType === "url" ? "var(--accent-primary)" : "var(--text-secondary)",
              fontWeight: "600",
              fontSize: "0.76rem",
              cursor: "pointer"
            }}
          >
            <Link2 size={13} />
            <span>URL / Reel</span>
          </button>
        </div>

        {/* Ingest Form */}
        <form onSubmit={handleIngest} style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
          {ingestType === "vault" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                  Local Directory / Obsidian Vault Path
                </label>
                <span style={{ fontSize: "0.7rem", color: "var(--emerald-wisdom)", fontWeight: "600" }}>
                  Khoj-Style Bulk Sync
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
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-strong)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: "0.82rem",
                    outline: "none"
                  }}
                />
              </div>

              {/* Quick 1-Click Demo Vault Button */}
              <button
                type="button"
                onClick={handleIngestDemoVault}
                disabled={isIngesting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-elevated)",
                  color: "var(--accent-primary)",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  cursor: isIngesting ? "not-allowed" : "pointer"
                }}
              >
                <Sparkles size={13} />
                <span>Load Sample Engineering Vault (5 Notes & ADRs)</span>
              </button>

              <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", lineHeight: "1.4" }}>
                Recursively scans and embeds Markdown files, architecture decision records, and PDFs into your sovereign personal brain in seconds.
              </div>
            </div>
          )}

          {ingestType === "file" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                  Reel Keyframe / Infographic Slide
                </label>
                <span style={{ fontSize: "0.7rem", color: "var(--emerald-wisdom)", fontWeight: "600" }}>
                  NVIDIA Nemotron 3.5 Super-VL
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--border-strong)",
                  borderRadius: "10px",
                  padding: "20px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: selectedFile ? "var(--bg-secondary)" : "var(--bg-input)",
                  transition: "all 0.2s ease"
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
                <Upload size={24} style={{ margin: "0 auto 8px", color: "var(--accent-primary)" }} />
                <div style={{ fontSize: "0.86rem", fontWeight: "600", color: "var(--text-primary)" }}>
                  {selectedFile ? selectedFile.name : "Click to upload slide or screenshot"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "4px" }}>
                  PNG, JPG, WEBP, or PDF (Instagram carousels & reels)
                </div>
              </div>

              {/* Quick Sample Demo Button */}
              <button
                type="button"
                onClick={handleLoadSampleSlide}
                disabled={isIngesting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-elevated)",
                  color: "var(--accent-primary)",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  cursor: isIngesting ? "not-allowed" : "pointer"
                }}
              >
                <Sparkles size={13} />
                <span>Test Live Sample Slide: "20 Microservices Meme"</span>
              </button>

              <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", lineHeight: "1.4" }}>
                Super-VL automatically OCRs diagrams, extracts architectural advice, and checks for contradictions with your saved ADRs.
              </div>
            </div>
          )}

          {ingestType === "note" && (
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
          )}

          {ingestType === "url" && (
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

          {/* Status Alert */}
          {ingestStatus && (
            <div style={{
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              background: ingestStatus.type === "success" ? "var(--emerald-bg)" : ingestStatus.type === "info" ? "var(--accent-light)" : "var(--crimson-bg)",
              color: ingestStatus.type === "success" ? "var(--emerald-wisdom)" : ingestStatus.type === "info" ? "var(--accent-primary)" : "var(--crimson-challenge)",
              border: `1px solid ${ingestStatus.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
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
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent-primary)",
              color: "#ffffff",
              fontSize: "0.88rem",
              fontWeight: "600",
              cursor: isIngesting || (ingestType === "file" && !selectedFile) ? "not-allowed" : "pointer",
              opacity: isIngesting || (ingestType === "file" && !selectedFile) ? 0.65 : 1
            }}
          >
            {isIngesting ? "Analyzing & Ingesting..." : ingestType === "file" ? "Analyze Slide with Super-VL" : "Ingest into Brain"}
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

                {/* Deep Research Multi-Source Card (Assistant only) */}
                {Boolean(msg.isDeepResearch) && (
                  <div style={{
                    marginTop: "10px",
                    padding: "14px 16px",
                    borderRadius: "10px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-strong)",
                    boxShadow: "var(--shadow-sm)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--cyan-tavily)", fontWeight: "700", fontSize: "0.85rem" }}>
                        <Globe size={15} />
                        <span>Tavily Iterative Research Verification</span>
                      </div>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        background: "var(--emerald-bg)",
                        color: "var(--emerald-wisdom)"
                      }}>
                        {msg.confidence ?? 85}% Empirical Confidence
                      </span>
                    </div>

                    {/* Subqueries Pills */}
                    {Boolean(msg.subqueries && msg.subqueries.length > 0) && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
                        {msg.subqueries.map((sq, sqIdx) => (
                          <span key={sqIdx} style={{
                            padding: "2px 7px",
                            borderRadius: "4px",
                            fontSize: "0.7rem",
                            background: "var(--bg-elevated)",
                            color: "var(--text-secondary)"
                          }}>
                            🔍 {sq}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Verified Sources */}
                    <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginBottom: "6px", fontWeight: "600" }}>
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
                            background: "var(--bg-elevated)",
                            fontSize: "0.76rem",
                            color: "var(--text-primary)",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px"
                          }}
                        >
                          <span style={{ fontWeight: "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {s.title}
                          </span>
                          <ExternalLink size={12} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
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
            placeholder="Ask Engram, challenge an assumption, or research web consensus..."
            disabled={isQuerying || isResearching}
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

          {/* Deep Research Button */}
          <button
            type="button"
            onClick={handleTriggerDeepResearch}
            disabled={isResearching || isQuerying || !queryText.trim()}
            title="Perform Iterative Multi-Query Deep Research with Tavily"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0 14px",
              borderRadius: "10px",
              border: "1px solid rgba(6, 182, 212, 0.4)",
              background: "var(--bg-elevated)",
              color: "var(--cyan-tavily)",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: isResearching || isQuerying || !queryText.trim() ? "not-allowed" : "pointer",
              opacity: isResearching || isQuerying || !queryText.trim() ? 0.6 : 1
            }}
          >
            <Globe size={15} />
            <span>{isResearching ? "Researching..." : "Deep Research"}</span>
          </button>

          <button
            type="submit"
            disabled={isQuerying || isResearching || !queryText.trim()}
            style={{
              padding: "0 18px",
              borderRadius: "10px",
              border: "none",
              background: "var(--accent-primary)",
              color: "#ffffff",
              cursor: isQuerying || isResearching || !queryText.trim() ? "not-allowed" : "pointer",
              opacity: isQuerying || isResearching || !queryText.trim() ? 0.6 : 1,
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
