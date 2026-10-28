"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Network, Filter, X, ZoomIn, ZoomOut, Maximize2, Compass, ArrowUpRight, Link2, Sparkles } from "lucide-react";

// Dynamically import ForceGraph2D with ssr disabled
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "650px",
      gap: "10px",
      color: "var(--text-muted)",
      fontFamily: "var(--font-geist-mono), monospace",
      fontSize: "0.82rem"
    }}>
      <div className="live-pulse-dot" />
      <span>Calibrating Obsidian Knowledge Mesh...</span>
    </div>
  )
});

export default function KnowledgeGraphView({ graphData }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [dimensions, setDimensions] = useState({ width: 1000, height: 680 });
  const [isDark, setIsDark] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(1);

  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const hasInitialFitRef = useRef(false);

  // Resize and theme observation
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 1000,
          height: Math.max(580, window.innerHeight - 240)
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

  // Filter nodes and links
  const filteredNodes = useMemo(() => {
    return (graphData?.nodes || []).filter(
      (n) => filterType === "all" || n.type === filterType
    );
  }, [graphData?.nodes, filterType]);

  const filteredNodeIds = useMemo(() => {
    return new Set(filteredNodes.map((n) => n.id));
  }, [filteredNodes]);

  const filteredLinks = useMemo(() => {
    return (graphData?.links || []).filter((l) => {
      const sourceId = typeof l.source === "object" ? l.source.id : l.source;
      const targetId = typeof l.target === "object" ? l.target.id : l.target;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });
  }, [graphData?.links, filteredNodeIds]);

  // Compute node degree (number of connected links) for organic sizing
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

  // Compute active neighborhood (1-hop connected nodes) for focus spotlight
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

  // Graph Data
  const activeGraph = useMemo(() => ({
    nodes: filteredNodes,
    links: filteredLinks
  }), [filteredNodes, filteredLinks]);

  // Configure physics forces on graph instance
  useEffect(() => {
    if (fgRef.current) {
      // Calibrated Obsidian physics: strong charge repulsion + wide link distance
      fgRef.current.d3VelocityDecay(0.32);
      
      const chargeForce = fgRef.current.d3Force("charge");
      if (chargeForce) {
        chargeForce.strength(-480);
        chargeForce.distanceMax(600);
      }
      const linkForce = fgRef.current.d3Force("link");
      if (linkForce) {
        linkForce.distance((link) => (link.relation === "tagged" ? 90 : 135));
        linkForce.strength(0.65);
      }
    }
  }, [activeGraph]);

  // Auto zoom-to-fit after simulation settles into organic layout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.zoomToFit(500, 75);
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [activeGraph]);

  // Category palette (Obsidian minimalist scheme)
  const getNodeColor = useCallback((node) => {
    if (node.type === "paradox") return isDark ? "#f43f5e" : "#e11d48";
    if (node.type === "decision") return isDark ? "#10b981" : "#059669";
    if (node.type === "document") return isDark ? "#38bdf8" : "#0284c7";
    if (node.type === "tag") return isDark ? "#a855f7" : "#7c3aed";
    return isDark ? "#e2e8f0" : "#334155";
  }, [isDark]);

  // Custom 2D Node Canvas Object (Clean Obsidian Minimalist Rings)
  const drawNodeCanvas = useCallback((node, ctx, globalScale) => {
    const degree = nodeDegrees[node.id] || 0;
    // Base radius scaled organically by connectivity
    const baseRadius = 2.8 + Math.min(Math.sqrt(degree) * 1.5, 4.5);
    const color = getNodeColor(node);

    const isHovered = hoveredNode?.id === node.id;
    const isSelected = selectedNode?.id === node.id;
    const isPrimary = isHovered || isSelected;
    const isNeighbor = activeFocus && neighborNodeIds.has(node.id);
    const hasFocus = activeFocus !== null;

    ctx.save();

    // Opacity modulation: spotlight active neighborhood, dim distant nodes
    if (hasFocus) {
      if (isPrimary) {
        ctx.globalAlpha = 1.0;
      } else if (isNeighbor) {
        ctx.globalAlpha = 0.9;
      } else {
        ctx.globalAlpha = 0.12; // Ghosted background
      }
    } else {
      ctx.globalAlpha = 0.85;
    }

    // 1. Concentric Aura / Depolarization Ring
    if (isPrimary) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4 / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseRadius + 3.5, 0, 2 * Math.PI);
      ctx.stroke();

      // Soft glow aura
      ctx.fillStyle = color + "22";
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseRadius + 3.5, 0, 2 * Math.PI);
      ctx.fill();
    } else if (isNeighbor) {
      ctx.strokeStyle = color + "66";
      ctx.lineWidth = 1.0 / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, baseRadius + 2.0, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // 2. Core Bead (Obsidian Minimalist Dot)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, baseRadius, 0, 2 * Math.PI);
    ctx.fill();

    // 3. Subtle Inner Specular Core (Dark Mode Depth)
    if (isDark && baseRadius >= 4) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(node.x - baseRadius * 0.25, node.y - baseRadius * 0.25, baseRadius * 0.35, 0, 2 * Math.PI);
      ctx.fill();
    }

    // -------------------------------------------------------------------------
    // 4. LABELS: CLEAN OBSIDIAN HIERARCHY (NO OVERLAP CLUTTER)
    // - When a node is hovered/selected: Spotlights that node + its 1-hop connections
    // - In ambient view: Only show landmark hubs (ADRs, decisions, degree >= 3)
    // - When user zooms in close (globalScale > 1.5): More labels gracefully reveal
    // -------------------------------------------------------------------------
    const isLandmark = node.type === "decision" || degree >= 3 || node.type === "paradox";
    const shouldDrawLabel = activeFocus
      ? (isPrimary || isNeighbor)
      : (isLandmark || globalScale > 1.5);

    if (shouldDrawLabel) {
      const rawLabel = node.name || node.id;
      const labelText = rawLabel.length > 26 ? rawLabel.substring(0, 24) + "…" : rawLabel;

      const fontSize = Math.max(3.0, Math.min(10 / globalScale, 8.5));
      ctx.font = `${isPrimary ? "600" : "500"} ${fontSize}px var(--font-geist-mono), 'JetBrains Mono', monospace`;

      const textWidth = ctx.measureText(labelText).width;
      const padX = 4.5;
      const padY = 2.2;
      const labelX = node.x;
      const labelY = node.y + baseRadius + fontSize + 2.5;

      // Micro background pill for clinical legibility
      ctx.fillStyle = isDark ? "rgba(9, 9, 11, 0.88)" : "rgba(255, 255, 255, 0.94)";
      ctx.strokeStyle = isPrimary
        ? color
        : (isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)");
      ctx.lineWidth = 0.8 / globalScale;

      ctx.beginPath();
      ctx.roundRect?.(
        labelX - textWidth / 2 - padX,
        labelY - fontSize + 1,
        textWidth + padX * 2,
        fontSize + padY * 2,
        3
      );
      ctx.fill();
      ctx.stroke();

      // Clean Monospace Text
      ctx.fillStyle = isPrimary
        ? (isDark ? "#ffffff" : "#09090b")
        : (isDark ? "rgba(255, 255, 255, 0.85)" : "#1e293b");
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labelText, labelX, labelY + padY * 0.3);
    }

    ctx.restore();
  }, [hoveredNode, selectedNode, activeFocus, neighborNodeIds, nodeDegrees, getNodeColor, isDark]);

  // Dynamic Link Color & Width
  const getLinkColor = useCallback((link) => {
    if (!activeFocus) {
      return isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
    }

    const sId = typeof link.source === "object" ? link.source.id : link.source;
    const tId = typeof link.target === "object" ? link.target.id : link.target;
    const isDirect = sId === activeFocus.id || tId === activeFocus.id;

    if (isDirect) {
      return isDark ? "rgba(56, 189, 248, 0.75)" : "rgba(2, 132, 199, 0.75)";
    }
    return isDark ? "rgba(255, 255, 255, 0.015)" : "rgba(0, 0, 0, 0.015)";
  }, [activeFocus, isDark]);

  const getLinkWidth = useCallback((link) => {
    if (!activeFocus) return 0.8;
    const sId = typeof link.source === "object" ? link.source.id : link.source;
    const tId = typeof link.target === "object" ? link.target.id : link.target;
    return (sId === activeFocus.id || tId === activeFocus.id) ? 1.6 : 0.5;
  }, [activeFocus]);

  // Zoom handlers
  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.35, 300);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() / 1.35, 300);
    }
  };

  const handleZoomFit = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 48);
    }
  };

  // Find backlinks for selected node inspector
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
      fgRef.current.zoom(2.2, 400);
    }
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: "1440px", margin: "0 auto" }}>
      {/* Obsidian Header: Clean, Monospace Telemetry */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "30px",
            height: "30px",
            borderRadius: "6px",
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-primary)"
          }}>
            <Network size={16} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontWeight: "700",
                fontSize: "0.88rem",
                color: "var(--text-primary)",
                letterSpacing: "0.06em",
                textTransform: "uppercase"
              }}>
                Obsidian Epistemic Mesh
              </span>
              <span className="engram-mono-badge" style={{ fontSize: "0.66rem" }}>
                {activeGraph.nodes.length} NODES • {activeGraph.links.length} SYNAPSES
              </span>
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono), monospace" }}>
              Minimalist Knowledge Graph • Hover to Spotlight Connections
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <Filter size={12} style={{ color: "var(--text-muted)", marginRight: "4px" }} />
          {[
            { id: "all", label: "All Nodes" },
            { id: "document", label: "Documents", color: "#38bdf8" },
            { id: "concept", label: "Concepts", color: "#e2e8f0" },
            { id: "decision", label: "Decisions", color: "#10b981" },
            { id: "paradox", label: "Paradoxes", color: "#f43f5e" },
            { id: "tag", label: "Tags", color: "#a855f7" }
          ].map((type) => {
            const isActive = filterType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id)}
                style={{
                  padding: "4px 11px",
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
                  gap: "6px",
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
      </div>

      {/* Obsidian Canvas Container (Bordered, Dark, Minimalist) */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid var(--border-hairline)",
          background: isDark ? "#09090b" : "#f8f9fa",
          boxShadow: isDark ? "0 8px 32px rgba(0, 0, 0, 0.45)" : "0 4px 20px rgba(0, 0, 0, 0.05)"
        }}
      >
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={activeGraph}
          backgroundColor={isDark ? "#09090b" : "#f8f9fa"}
          nodeCanvasObject={drawNodeCanvas}
          nodeCanvasObjectMode={() => "replace"}
          nodePointerAreaPaint={(node, color, ctx) => {
            const degree = nodeDegrees[node.id] || 0;
            const r = 2.8 + Math.min(Math.sqrt(degree) * 1.5, 4.5) + 4;
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
            return (sId === activeFocus.id || tId === activeFocus.id) ? 2 : 0;
          }}
          linkDirectionalParticleSpeed={0.007}
          linkDirectionalParticleWidth={2.0}
          linkDirectionalParticleColor={() => isDark ? "#38bdf8" : "#0284c7"}
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
              fgRef.current.zoomToFit(600, 75);
              hasInitialFitRef.current = true;
            }
          }}
          cooldownTicks={160}
          warmupTicks={60}
          enableNodeDrag={true}
        />

        {/* Floating Zoom & Fit HUD Controls */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: isDark ? "rgba(18, 18, 22, 0.85)" : "rgba(255, 255, 255, 0.9)",
            border: "1px solid var(--border-hairline)",
            borderRadius: "6px",
            padding: "3px 6px",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.12)"
          }}
        >
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              padding: "5px",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              padding: "5px",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            <ZoomOut size={14} />
          </button>
          <div style={{ width: "1px", height: "14px", background: "var(--border-hairline)", margin: "0 2px" }} />
          <button
            onClick={handleZoomFit}
            title="Fit Entire Graph"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              padding: "5px",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            <Maximize2 size={13} />
          </button>
        </div>

        {/* Legend Overlay (Minimalist Bottom-Right) */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            padding: "6px 12px",
            borderRadius: "6px",
            background: isDark ? "rgba(18, 18, 22, 0.85)" : "rgba(255, 255, 255, 0.9)",
            border: "1px solid var(--border-hairline)",
            backdropFilter: "blur(10px)",
            fontSize: "0.64rem",
            fontFamily: "var(--font-geist-mono), monospace",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            pointerEvents: "none"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8" }} />
            <span>Doc</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
            <span>Decision</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f43f5e" }} />
            <span>Paradox</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isDark ? "#e2e8f0" : "#334155" }} />
            <span>Concept</span>
          </div>
        </div>

        {/* Selected Node Drawer (Obsidian-Style Backlinks Inspector) */}
        {selectedNode && (
          <div
            className="engram-card"
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "360px",
              maxHeight: "calc(100% - 32px)",
              overflowY: "auto",
              padding: "20px",
              zIndex: 10,
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.45)",
              background: isDark ? "rgba(16, 16, 20, 0.94)" : "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(16px)",
              border: "1px solid var(--border-strong)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: getNodeColor(selectedNode)
                  }}
                />
                <span
                  className="engram-mono-badge"
                  style={{
                    fontSize: "0.68rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em"
                  }}
                >
                  {selectedNode.type}
                </span>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "4px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <X size={15} />
              </button>
            </div>

            <h4 style={{
              fontSize: "1.02rem",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: "8px",
              lineHeight: "1.3",
              letterSpacing: "-0.015em"
            }}>
              {selectedNode.name}
            </h4>

            <p style={{
              fontSize: "0.82rem",
              color: "var(--text-secondary)",
              lineHeight: "1.5",
              marginBottom: "16px"
            }}>
              {selectedNode.description || "Node indexed in personal epistemic topology."}
            </p>

            {/* Backlinks & Forward Wikilinks Section */}
            <div style={{
              paddingTop: "12px",
              borderTop: "1px solid var(--border-hairline)",
              marginBottom: "14px"
            }}>
              <div style={{
                fontSize: "0.68rem",
                fontFamily: "var(--font-geist-mono), monospace",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <Link2 size={11} />
                <span>Connected Synapses ({selectedNodeBacklinks.length})</span>
              </div>

              {selectedNodeBacklinks.length === 0 ? (
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  No explicit wikilinks mapped yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "150px", overflowY: "auto" }}>
                  {selectedNodeBacklinks.map((link, i) => (
                    <button
                      key={i}
                      onClick={() => handleJumpToNode(link.target)}
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-hairline)",
                        borderRadius: "5px",
                        padding: "5px 8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <span style={{
                        fontSize: "0.75rem",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-geist-mono), monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "240px"
                      }}>
                        [[{link.target.name}]]
                      </span>
                      <ArrowUpRight size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            <div style={{
              paddingTop: "10px",
              borderTop: "1px solid var(--border-hairline)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              fontSize: "0.68rem",
              fontFamily: "var(--font-geist-mono), monospace",
              color: "var(--text-muted)"
            }}>
              <div>NODE ID: {selectedNode.id}</div>
              <div>DEGREE: {nodeDegrees[selectedNode.id] || 0} Synapses</div>
              <div>COGNITIVE STATUS: CONSOLIDATED</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

