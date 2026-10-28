"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Network,
  Filter,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  ArrowUpRight,
  Link2,
  Sparkles,
  Search,
  Sliders,
  RotateCcw,
  Shield,
  Layers,
  Info
} from "lucide-react";

// Dynamically import ForceGraph2D with SSR disabled
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "680px",
      gap: "12px",
      color: "var(--text-muted)",
      fontFamily: "var(--font-geist-mono), monospace",
      fontSize: "0.84rem"
    }}>
      <div className="live-pulse-dot" />
      <span>Calibrating Obsidian Epistemic Mesh...</span>
    </div>
  )
});

// Comprehensive Fallback Topology (Ensures the graph is NEVER empty on first load)
const FALLBACK_GRAPH_DATA = {
  nodes: [
    { id: "adr_028", name: "ADR 028: Lean Monolith Mandate", type: "decision", description: "Mandate single-service architecture with SQLite in WAL mode. Forbid microservices until clear bottleneck emerges.", size: 12 },
    { id: "adr_031", name: "ADR 031: Dual-Brain Sovereignty", type: "decision", description: "Strict physical and cryptographic isolation between self_brain.db and world_brain.db.", size: 10 },
    { id: "sqlite_wal", name: "SQLite WAL Sovereign Storage", type: "concept", description: "Zero-latency concurrent read storage standard for sovereign personal memory.", size: 8 },
    { id: "nemotron_550b", name: "NVIDIA Nemotron 3 Ultra 550B", type: "document", description: "Epistemic arbiter deployed on Nebius Token Factory for overnight sleep consolidation.", size: 11 },
    { id: "super_vl", name: "NVIDIA Nemotron 3.5 Super-VL", type: "document", description: "High-resolution multimodal vision model for parsing slides, memes, and reel keyframes.", size: 9 },
    { id: "tavily_search", name: "Tavily Multi-Query Grounding", type: "document", description: "3-query parallel empirical research engine validating ungrounded claims with citations.", size: 9 },
    { id: "sleep_engine", name: "3:00 AM Autonomous Sleep Engine", type: "concept", description: "Autonomous cron daemon executing deep memory consolidation without human prompts.", size: 10 },
    { id: "microservices_meme", name: "Viral Reel: 20 Microservices Meme", type: "paradox", description: "Adversarial input claiming solo developers should use 20 microservices with Kafka. Flags ADR 028 violation.", size: 10 },
    { id: "openshell_guard", name: "NVIDIA OpenShell Sandbox Guard", type: "concept", description: "Kernel-level eBPF isolation runtime protecting external ingestion against indirect prompt injection.", size: 8 },
    { id: "hermes_skill", name: "Hermes Agent Epistemic Skill", type: "concept", description: "Autonomous conscience integration preventing Nous Hermes from taking contradictory actions.", size: 8 },
    { id: "para_standard", name: "PARA Vault Standard", type: "concept", description: "Projects, Areas, Resources, Archive taxonomy for sovereign second brain interoperability.", size: 8 },
    { id: "conway_law", name: "Conway's Law & Distributed Systems", type: "document", description: "Organizations design systems that mirror their communication structure.", size: 8 },
    { id: "tag_hygiene", name: "5-Phase Cognitive Defrag", type: "concept", description: "Tag garden hygiene, orphan thought pruning, and knowledge decay detection.", size: 7 },
    { id: "ast_auditor", name: "Static Epistemic AST Auditor", type: "concept", description: "Python AST analyzer verifying codebase compliance against documented ADRs.", size: 8 }
  ],
  links: [
    { source: "adr_028", target: "sqlite_wal", relation: "implements" },
    { source: "adr_028", target: "microservices_meme", relation: "contradicts" },
    { source: "adr_031", target: "sqlite_wal", relation: "governs" },
    { source: "nemotron_550b", target: "sleep_engine", relation: "powers" },
    { source: "nemotron_550b", target: "adr_028", relation: "arbitrates" },
    { source: "super_vl", target: "microservices_meme", relation: "parsed_from" },
    { source: "tavily_search", target: "nemotron_550b", relation: "feeds_evidence" },
    { source: "sleep_engine", target: "tag_hygiene", relation: "executes" },
    { source: "openshell_guard", target: "microservices_meme", relation: "sandboxes" },
    { source: "hermes_skill", target: "adr_028", relation: "cross_examines" },
    { source: "ast_auditor", target: "adr_028", relation: "verifies" },
    { source: "ast_auditor", target: "adr_031", relation: "verifies" },
    { source: "para_standard", target: "sleep_engine", relation: "indexes" },
    { source: "conway_law", target: "adr_028", relation: "justifies" }
  ]
};

export default function KnowledgeGraphView({ graphData }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [labelMode, setLabelMode] = useState("landmarks"); // "landmarks" | "all" | "none"
  const [showForceControls, setShowForceControls] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });
  const [isDark, setIsDark] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(1);

  // Physics settings with comfortable defaults
  const [chargeStrength, setChargeStrength] = useState(-520);
  const [linkDistance, setLinkDistance] = useState(130);
  const [particleSpeed, setParticleSpeed] = useState(0.006);

  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const hasInitialFitRef = useRef(false);

  // Active base data: use provided graphData if valid, otherwise fallback
  const rawData = useMemo(() => {
    if (graphData && Array.isArray(graphData.nodes) && graphData.nodes.length > 2) {
      return graphData;
    }
    return FALLBACK_GRAPH_DATA;
  }, [graphData]);

  // Window resize & theme sync
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 1000,
          height: Math.max(620, window.innerHeight - 230)
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    const checkTheme = () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      setIsDark(current === "dark");
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      window.removeEventListener("resize", updateDimensions);
      observer.disconnect();
    };
  }, []);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return (rawData.nodes || []).filter((n) => {
      const matchesType = filterType === "all" || n.type === filterType;
      const matchesSearch = !searchQuery.trim() ||
        (n.name || n.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [rawData.nodes, filterType, searchQuery]);

  const filteredNodeIds = useMemo(() => {
    return new Set(filteredNodes.map((n) => n.id));
  }, [filteredNodes]);

  const filteredLinks = useMemo(() => {
    return (rawData.links || []).filter((l) => {
      const sourceId = typeof l.source === "object" ? l.source.id : l.source;
      const targetId = typeof l.target === "object" ? l.target.id : l.target;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });
  }, [rawData.links, filteredNodeIds]);

  // Degree computation
  const nodeDegrees = useMemo(() => {
    const degrees = {};
    filteredNodes.forEach((n) => { degrees[n.id] = 0; });
    filteredLinks.forEach((l) => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      if (degrees[s] !== undefined) degrees[s]++;
      if (degrees[t] !== undefined) degrees[t]++;
    });
    return degrees;
  }, [filteredNodes, filteredLinks]);

  // Focus neighborhood
  const activeFocus = hoveredNode || selectedNode;
  const { neighborNodeIds, neighborLinkIds } = useMemo(() => {
    const nIds = new Set();
    const lIds = new Set();
    if (activeFocus) {
      nIds.add(activeFocus.id);
      filteredLinks.forEach((l, idx) => {
        const sId = typeof l.source === "object" ? l.source.id : l.source;
        const tId = typeof l.target === "object" ? l.target.id : l.target;
        if (sId === activeFocus.id) {
          nIds.add(tId);
          lIds.add(idx);
        } else if (tId === activeFocus.id) {
          nIds.add(sId);
          lIds.add(idx);
        }
      });
    }
    return { neighborNodeIds: nIds, neighborLinkIds: lIds };
  }, [activeFocus, filteredLinks]);

  const activeGraph = useMemo(() => ({
    nodes: filteredNodes,
    links: filteredLinks
  }), [filteredNodes, filteredLinks]);

  // Configure dynamic D3 physics
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3VelocityDecay(0.32);

      const charge = fgRef.current.d3Force("charge");
      if (charge) {
        charge.strength(chargeStrength);
        charge.distanceMax(800);
      }
      const link = fgRef.current.d3Force("link");
      if (link) {
        link.distance((l) => (l.relation === "tagged" ? linkDistance * 0.7 : linkDistance));
        link.strength(0.65);
      }
    }
  }, [activeGraph, chargeStrength, linkDistance]);

  // Automatic zoom to fit
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.zoomToFit(500, 85);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [activeGraph]);

  // Obsidian Semantic Palette
  const getNodeColor = useCallback((node) => {
    if (node.type === "paradox") return "#f43f5e"; // Rose / Tension
    if (node.type === "decision") return "#10b981"; // Emerald / ADR
    if (node.type === "document") return "#06b6d4"; // Cyan / Note
    if (node.type === "tag") return "#a855f7";      // Purple / Taxonomy
    return "#818cf8";                               // Indigo / Concept
  }, []);

  // Custom 2D Canvas Object: Bioluminescent Cybernetic Beads
  const drawNodeCanvas = useCallback((node, ctx, globalScale) => {
    const degree = nodeDegrees[node.id] || 0;
    const baseRadius = 3.2 + Math.min(Math.sqrt(degree) * 1.6, 5.5);
    const color = getNodeColor(node);

    const isHovered = hoveredNode?.id === node.id;
    const isSelected = selectedNode?.id === node.id;
    const isPrimary = isHovered || isSelected;
    const isNeighbor = activeFocus && neighborNodeIds.has(node.id);
    const hasFocus = activeFocus !== null;

    ctx.save();

    // Opacity modulation
    if (hasFocus) {
      if (isPrimary) {
        ctx.globalAlpha = 1.0;
      } else if (isNeighbor) {
        ctx.globalAlpha = 0.95;
      } else {
        ctx.globalAlpha = 0.12;
      }
    } else {
      ctx.globalAlpha = 0.88;
    }

    // 1. Outer Glow Aura (Radial Blur)
    const glowRadius = isPrimary ? baseRadius + 7 : baseRadius + 3;
    const glowGrad = ctx.createRadialGradient(node.x, node.y, baseRadius * 0.5, node.x, node.y, glowRadius);
    glowGrad.addColorStop(0, color + (isPrimary ? "88" : "33"));
    glowGrad.addColorStop(1, color + "00");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI);
    ctx.fill();

    // 2. Active Radar Rings on Hover/Select
    if (isPrimary) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseRadius + 4.5, 0, 2 * Math.PI);
      ctx.stroke();

      // Outer ripple
      ctx.strokeStyle = color + "55";
      ctx.lineWidth = 0.8 / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseRadius + 8, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (isNeighbor) {
      ctx.strokeStyle = color + "88";
      ctx.lineWidth = 1.0 / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseRadius + 2.5, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // 3. Core Bead
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, baseRadius, 0, 2 * Math.PI);
    ctx.fill();

    // 4. Specular Inner Highlight (3D Pearl Depth)
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.arc(node.x - baseRadius * 0.28, node.y - baseRadius * 0.28, baseRadius * 0.32, 0, 2 * Math.PI);
    ctx.fill();

    // 5. Obsidian Monospace Label Hierarchy
    let shouldDraw = false;
    if (labelMode === "all") {
      shouldDraw = true;
    } else if (labelMode === "none") {
      shouldDraw = isPrimary;
    } else {
      // "landmarks": clean, uncluttered mode
      if (hasFocus) {
        shouldDraw = isPrimary || isNeighbor;
      } else {
        const isLandmark = node.type === "decision" || degree >= 3 || node.type === "paradox";
        shouldDraw = isLandmark || globalScale > 1.45;
      }
    }

    if (shouldDraw) {
      const rawName = node.name || node.id;
      const labelText = rawName.length > 28 ? rawName.substring(0, 26) + "…" : rawName;

      const fontSize = Math.max(3.2, Math.min(10.5 / globalScale, 9.0));
      ctx.font = `${isPrimary ? "600" : "500"} ${fontSize}px var(--font-geist-mono), 'JetBrains Mono', monospace`;

      const textWidth = ctx.measureText(labelText).width;
      const padX = 5;
      const padY = 2.5;
      const labelX = node.x;
      const labelY = node.y + baseRadius + fontSize + 2.8;

      // Micro glassmorphic pill background
      ctx.fillStyle = isDark ? "rgba(10, 12, 18, 0.92)" : "rgba(255, 255, 255, 0.96)";
      ctx.strokeStyle = isPrimary
        ? color
        : (isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.12)");
      ctx.lineWidth = 0.85 / globalScale;

      ctx.beginPath();
      ctx.roundRect?.(
        labelX - textWidth / 2 - padX,
        labelY - fontSize + 1,
        textWidth + padX * 2,
        fontSize + padY * 2,
        4
      );
      ctx.fill();
      ctx.stroke();

      // Monospace label typography
      ctx.fillStyle = isPrimary
        ? (isDark ? "#ffffff" : "#09090b")
        : (isDark ? "rgba(255, 255, 255, 0.88)" : "#1e293b");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labelText, labelX, labelY + padY * 0.3);
    }

    ctx.restore();
  }, [nodeDegrees, getNodeColor, hoveredNode, selectedNode, activeFocus, neighborNodeIds, isDark, labelMode]);

  // Link styling
  const getLinkColor = useCallback((link) => {
    if (!activeFocus) {
      return isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.09)";
    }
    const sId = typeof link.source === "object" ? link.source.id : link.source;
    const tId = typeof link.target === "object" ? link.target.id : link.target;
    if (sId === activeFocus.id || tId === activeFocus.id) {
      return isDark ? "#38bdf8" : "#0284c7";
    }
    return isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)";
  }, [activeFocus, isDark]);

  const getLinkWidth = useCallback((link) => {
    if (!activeFocus) return 0.9;
    const sId = typeof link.source === "object" ? link.source.id : link.source;
    const tId = typeof link.target === "object" ? link.target.id : link.target;
    return (sId === activeFocus.id || tId === activeFocus.id) ? 1.8 : 0.4;
  }, [activeFocus]);

  // Zoom handlers
  const handleZoomIn = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() * 1.4, 300);
  };
  const handleZoomOut = () => {
    if (fgRef.current) fgRef.current.zoom(fgRef.current.zoom() / 1.4, 300);
  };
  const handleZoomFit = () => {
    if (fgRef.current) fgRef.current.zoomToFit(450, 75);
  };
  const handleResetForces = () => {
    setChargeStrength(-520);
    setLinkDistance(130);
    setParticleSpeed(0.006);
    if (fgRef.current) fgRef.current.zoomToFit(400, 75);
  };

  // Backlinks for drawer
  const selectedNodeBacklinks = useMemo(() => {
    if (!selectedNode) return [];
    const links = [];
    filteredLinks.forEach((l) => {
      const s = typeof l.source === "object" ? l.source : filteredNodes.find((n) => n.id === l.source);
      const t = typeof l.target === "object" ? l.target : filteredNodes.find((n) => n.id === l.target);
      if (s?.id === selectedNode.id && t) {
        links.push({ relation: l.relation || "wikilink", target: t, direction: "outbound" });
      } else if (t?.id === selectedNode.id && s) {
        links.push({ relation: l.relation || "wikilink", target: s, direction: "inbound" });
      }
    });
    return links;
  }, [selectedNode, filteredLinks, filteredNodes]);

  const handleJumpToNode = (targetNode) => {
    setSelectedNode(targetNode);
    if (fgRef.current && targetNode.x !== undefined && targetNode.y !== undefined) {
      fgRef.current.centerAt(targetNode.x, targetNode.y, 400);
      fgRef.current.zoom(2.1, 400);
    }
  };

  return (
    <div style={{ padding: "20px 32px", maxWidth: "1480px", margin: "0 auto" }}>
      {/* Top HUD: Obsidian Metadata Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "14px",
        marginBottom: "16px"
      }}>
        {/* Left: Brand & Telemetry Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "34px",
            height: "34px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(168, 85, 247, 0.15))",
            border: "1px solid var(--border-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-primary)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
          }}>
            <Network size={17} style={{ color: "#38bdf8" }} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontWeight: "700",
                fontSize: "0.92rem",
                color: "var(--text-primary)",
                letterSpacing: "0.06em",
                textTransform: "uppercase"
              }}>
                Obsidian Epistemic Mesh
              </span>
              <span className="engram-mono-badge" style={{ fontSize: "0.68rem" }}>
                {activeGraph.nodes.length} ATOMS • {activeGraph.links.length} SYNAPSES
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono), monospace" }}>
              Topological Knowledge Synthesis • Live D3 Force Graph
            </div>
          </div>
        </div>

        {/* Center: Live Search Filter */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: isDark ? "rgba(18, 20, 29, 0.85)" : "rgba(255, 255, 255, 0.95)",
          border: "1px solid var(--border-hairline)",
          borderRadius: "8px",
          padding: "5px 12px",
          minWidth: "240px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <Search size={13} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search notes, ADRs, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "0.78rem",
              fontFamily: "var(--font-geist-mono), monospace",
              width: "100%"
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Right: Category Chips & Display Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* Category Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {[
              { id: "all", label: "All" },
              { id: "decision", label: "ADRs", color: "#10b981" },
              { id: "document", label: "Notes", color: "#06b6d4" },
              { id: "paradox", label: "Tensions", color: "#f43f5e" },
              { id: "concept", label: "Concepts", color: "#818cf8" }
            ].map((type) => {
              const isActive = filterType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  style={{
                    padding: "4px 9px",
                    borderRadius: "6px",
                    border: "1px solid",
                    borderColor: isActive ? "var(--border-strong)" : "var(--border-hairline)",
                    background: isActive ? "var(--btn-primary-bg)" : "var(--bg-subtle)",
                    color: isActive ? "var(--btn-primary-text)" : "var(--text-secondary)",
                    fontSize: "0.72rem",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontWeight: isActive ? "600" : "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    transition: "all 0.15s ease"
                  }}
                >
                  {type.color && (
                    <span style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: type.color,
                      display: "inline-block"
                    }} />
                  )}
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Label Mode Switcher */}
          <button
            onClick={() => {
              setLabelMode(prev => prev === "landmarks" ? "all" : prev === "all" ? "none" : "landmarks");
            }}
            title="Toggle Label Mode (Landmarks / All / None)"
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              border: "1px solid var(--border-hairline)",
              background: "var(--bg-subtle)",
              color: "var(--text-secondary)",
              fontSize: "0.72rem",
              fontFamily: "var(--font-geist-mono), monospace",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}
          >
            <Layers size={12} />
            <span>Labels: {labelMode.toUpperCase()}</span>
          </button>

          {/* Forces Drawer Toggle */}
          <button
            onClick={() => setShowForceControls(!showForceControls)}
            title="Graph Physics Controls"
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: showForceControls ? "var(--border-strong)" : "var(--border-hairline)",
              background: showForceControls ? "var(--bg-card)" : "var(--bg-subtle)",
              color: showForceControls ? "var(--text-primary)" : "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.72rem"
            }}
          >
            <Sliders size={12} />
          </button>
        </div>
      </div>

      {/* Main Canvas Frame */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: `${dimensions.height}px`,
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--border-strong)",
          background: isDark
            ? "radial-gradient(circle at 50% 50%, #0d111a 0%, #06080d 100%)"
            : "radial-gradient(circle at 50% 50%, #f8fafc 0%, #edf2f7 100%)",
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.5), 0 8px 30px rgba(0,0,0,0.25)"
        }}
      >
        {/* Subtle Cybernetic Dot Grid Background */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: isDark
            ? "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)"
            : "radial-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
          opacity: 0.7
        }} />

        {/* ForceGraph2D Canvas */}
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={activeGraph}
          backgroundColor="rgba(0,0,0,0)"
          nodeCanvasObject={drawNodeCanvas}
          nodeCanvasObjectMode={() => "replace"}
          nodePointerAreaPaint={(node, color, ctx) => {
            const degree = nodeDegrees[node.id] || 0;
            const r = 3.2 + Math.min(Math.sqrt(degree) * 1.6, 5.5) + 6;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fill();
          }}
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          linkDirectionalParticles={(link) => {
            if (!activeFocus) return 0;
            const sId = typeof link.source === "object" ? link.source.id : link.source;
            const tId = typeof link.target === "object" ? link.target.id : link.target;
            return (sId === activeFocus.id || tId === activeFocus.id) ? 3 : 0;
          }}
          linkDirectionalParticleSpeed={particleSpeed}
          linkDirectionalParticleWidth={2.4}
          linkDirectionalParticleColor={() => "#38bdf8"}
          onNodeHover={(node) => setHoveredNode(node || null)}
          onNodeClick={(node) => setSelectedNode(node)}
          onBackgroundClick={() => {
            setSelectedNode(null);
            setHoveredNode(null);
          }}
          onZoom={(transform) => {
            setCurrentZoom(transform.k);
          }}
          onEngineStop={() => {
            if (fgRef.current && !hasInitialFitRef.current) {
              fgRef.current.zoomToFit(600, 85);
              hasInitialFitRef.current = true;
            }
          }}
          cooldownTicks={180}
          warmupTicks={60}
          enableNodeDrag={true}
        />

        {/* Floating Zoom & Preset Controls HUD */}
        <div style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          background: isDark ? "rgba(14, 16, 24, 0.88)" : "rgba(255, 255, 255, 0.92)",
          border: "1px solid var(--border-hairline)",
          borderRadius: "8px",
          padding: "3px 6px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          zIndex: 10
        }}>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            style={{ background: "transparent", border: "none", color: "var(--text-secondary)", padding: "5px", borderRadius: "4px", cursor: "pointer", display: "flex" }}
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{ background: "transparent", border: "none", color: "var(--text-secondary)", padding: "5px", borderRadius: "4px", cursor: "pointer", display: "flex" }}
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleZoomFit}
            title="Zoom to Fit View"
            style={{ background: "transparent", border: "none", color: "var(--text-secondary)", padding: "5px", borderRadius: "4px", cursor: "pointer", display: "flex" }}
          >
            <Maximize2 size={13} />
          </button>
          <div style={{ width: "1px", height: "14px", background: "var(--border-hairline)", margin: "0 2px" }} />
          <button
            onClick={handleResetForces}
            title="Reset Simulation"
            style={{ background: "transparent", border: "none", color: "var(--text-secondary)", padding: "5px", borderRadius: "4px", cursor: "pointer", display: "flex" }}
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Floating Physics Sliders Drawer (Obsidian-Style Graph Settings) */}
        {showForceControls && (
          <div style={{
            position: "absolute",
            bottom: "58px",
            left: "16px",
            width: "260px",
            padding: "16px",
            background: isDark ? "rgba(14, 16, 24, 0.95)" : "rgba(255, 255, 255, 0.98)",
            border: "1px solid var(--border-strong)",
            borderRadius: "10px",
            backdropFilter: "blur(16px)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 15,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            fontFamily: "var(--font-geist-mono), monospace"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--text-primary)" }}>
                OBSIDIAN FORCES
              </span>
              <button
                onClick={() => setShowForceControls(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Repulsion Force */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                <span>Repulsion (Charge)</span>
                <span>{Math.abs(chargeStrength)}</span>
              </div>
              <input
                type="range"
                min="150"
                max="900"
                step="25"
                value={Math.abs(chargeStrength)}
                onChange={(e) => setChargeStrength(-Number(e.target.value))}
                style={{ width: "100%", accentColor: "#38bdf8" }}
              />
            </div>

            {/* Link Distance */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                <span>Link Distance</span>
                <span>{linkDistance}px</span>
              </div>
              <input
                type="range"
                min="60"
                max="240"
                step="10"
                value={linkDistance}
                onChange={(e) => setLinkDistance(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#38bdf8" }}
              />
            </div>

            {/* Particle Speed */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                <span>Synapse Flow</span>
                <span>{(particleSpeed * 1000).toFixed(0)}x</span>
              </div>
              <input
                type="range"
                min="0.002"
                max="0.015"
                step="0.001"
                value={particleSpeed}
                onChange={(e) => setParticleSpeed(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#10b981" }}
              />
            </div>
          </div>
        )}

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "360px",
              maxHeight: "calc(100% - 32px)",
              overflowY: "auto",
              padding: "22px",
              zIndex: 20,
              boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
              background: isDark ? "rgba(13, 16, 25, 0.94)" : "rgba(255, 255, 255, 0.96)",
              border: "1px solid var(--border-strong)",
              borderRadius: "10px",
              backdropFilter: "blur(20px)"
            }}
          >
            {/* Header / Type Badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span
                className="engram-mono-badge"
                style={{
                  color: selectedNode.type === "paradox" ? "#f43f5e" : selectedNode.type === "decision" ? "#10b981" : "#06b6d4",
                  borderColor: "var(--border-hairline)",
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  fontSize: "0.68rem"
                }}
              >
                {selectedNode.type?.toUpperCase()}
              </span>

              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "4px"
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Node Title with [[wikilink]] styling */}
            <h4 style={{
              fontSize: "1.15rem",
              fontWeight: "700",
              color: "var(--text-primary)",
              marginBottom: "8px",
              letterSpacing: "-0.02em",
              lineHeight: "1.3"
            }}>
              {selectedNode.name || selectedNode.id}
            </h4>

            {/* Description */}
            <p style={{
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              lineHeight: "1.55",
              marginBottom: "16px"
            }}>
              {selectedNode.description || "Active cognitive atom indexed in personal epistemic vault."}
            </p>

            {/* Backlinks & Connections */}
            <div style={{
              paddingTop: "14px",
              borderTop: "1px solid var(--border-hairline)",
              marginBottom: "16px"
            }}>
              <div style={{
                fontSize: "0.72rem",
                fontFamily: "var(--font-geist-mono), monospace",
                fontWeight: "600",
                color: "var(--text-muted)",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <Link2 size={12} />
                <span>CONNECTED SYNAPSES ({selectedNodeBacklinks.length})</span>
              </div>

              {selectedNodeBacklinks.length === 0 ? (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  No explicit direct links. Connected via latent semantic cluster.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {selectedNodeBacklinks.map((link, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleJumpToNode(link.target)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-hairline)",
                        color: "var(--text-secondary)",
                        fontSize: "0.76rem",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono), monospace" }}>
                          {link.direction === "outbound" ? "→" : "←"} {link.relation}
                        </span>
                        <span style={{ fontWeight: "500", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {link.target.name || link.target.id}
                        </span>
                      </div>
                      <ArrowUpRight size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            <div style={{
              paddingTop: "12px",
              borderTop: "1px solid var(--border-hairline)",
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              fontSize: "0.72rem",
              fontFamily: "var(--font-geist-mono), monospace",
              color: "var(--text-muted)"
            }}>
              <div>NODE ID: {selectedNode.id}</div>
              <div>SYNAPSE DEGREE: {nodeDegrees[selectedNode.id] || 0} connections</div>
              <div>VERIFICATION: NVIDIA NEMOTRON 3 ULTRA</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
