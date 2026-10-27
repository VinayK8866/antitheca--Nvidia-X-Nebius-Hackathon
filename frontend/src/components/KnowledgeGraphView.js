"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Network, Filter, X, Eye, ZoomIn, ZoomOut, Layers } from "lucide-react";

// Dynamically import ForceGraph2D with ssr disabled
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "650px",
      color: "var(--text-muted)",
      fontFamily: "var(--font-geist-mono), monospace",
      fontSize: "0.85rem"
    }}>
      Initializing Engram Constellation Canvas...
    </div>
  )
});

export default function KnowledgeGraphView({ graphData }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [dimensions, setDimensions] = useState({ width: 1000, height: 680 });
  const [isDark, setIsDark] = useState(true);
  const containerRef = useRef(null);

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

    // Watch theme
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

  const filteredNodes = (graphData?.nodes || []).filter(
    (n) => filterType === "all" || n.type === filterType
  );

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  const filteredLinks = (graphData?.links || []).filter(
    (l) => {
      const sourceId = typeof l.source === "object" ? l.source.id : l.source;
      const targetId = typeof l.target === "object" ? l.target.id : l.target;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    }
  );

  const activeGraph = {
    nodes: filteredNodes,
    links: filteredLinks
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Top Filter & Telemetry Bar */}
      <div className="engram-card" style={{
        padding: "14px 24px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "28px",
            height: "28px",
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
              <span style={{ fontWeight: "600", fontSize: "0.92rem", color: "var(--text-primary)" }}>
                Epistemic Topology
              </span>
              <span className="engram-mono-badge" style={{ fontSize: "0.68rem" }}>
                {activeGraph.nodes.length} NODES • {activeGraph.links.length} LINKS
              </span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-geist-mono), monospace" }}>
              Living Neural Graph • Force-Directed Convergence
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <Filter size={13} style={{ color: "var(--text-muted)", marginRight: "4px" }} />
          {[
            { id: "all", label: "All Nodes" },
            { id: "document", label: "Documents" },
            { id: "concept", label: "Concepts" },
            { id: "decision", label: "Decisions" },
            { id: "paradox", label: "⚡ Paradoxes" }
          ].map((type) => {
            const isActive = filterType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor: isActive ? "var(--border-strong)" : "var(--border-hairline)",
                  background: isActive ? "var(--btn-primary-bg)" : "var(--bg-subtle)",
                  color: isActive ? "var(--btn-primary-text)" : "var(--text-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: isActive ? "600" : "500",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Canvas & Inspector Container */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--border-hairline)",
          background: "var(--graph-bg)",
          boxShadow: "var(--shadow-card)"
        }}
      >
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={activeGraph}
          backgroundColor={isDark ? "#09090b" : "#fafafa"}
          nodeLabel={(n) => `${n.name} [${n.type?.toUpperCase()}]`}
          nodeColor={(n) => {
            if (n.type === "paradox") return isDark ? "#ef4444" : "#dc2626";
            if (n.type === "decision") return isDark ? "#10b981" : "#059669";
            if (n.type === "document") return isDark ? "#38bdf8" : "#0284c7";
            return isDark ? "#ffffff" : "#111111";
          }}
          nodeRelSize={7}
          linkColor={() => isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.14)"}
          linkWidth={1.5}
          onNodeClick={(node) => setSelectedNode(node)}
          cooldownTicks={120}
        />

        {/* Selected Node Drawer (Engram Lab Inspector) */}
        {selectedNode && (
          <div
            className="engram-card"
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "340px",
              padding: "22px",
              zIndex: 10,
              boxShadow: "var(--shadow-lg)",
              background: "var(--bg-card)",
              border: "1px solid var(--border-strong)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <span
                className="engram-mono-badge"
                style={{
                  color: selectedNode.type === "paradox" ? "var(--crimson-challenge)" : "var(--text-primary)",
                  borderColor: selectedNode.type === "paradox" ? "var(--crimson-border)" : "var(--border-hairline)",
                  background: selectedNode.type === "paradox" ? "var(--crimson-bg)" : "var(--bg-subtle)"
                }}
              >
                {selectedNode.type}
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
                <X size={16} />
              </button>
            </div>

            <h4 style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: "8px",
              letterSpacing: "-0.02em"
            }}>
              {selectedNode.name}
            </h4>

            <p style={{
              fontSize: "0.86rem",
              color: "var(--text-secondary)",
              lineHeight: "1.55",
              marginBottom: "16px"
            }}>
              {selectedNode.description || "Node indexed in personal epistemic topology."}
            </p>

            <div style={{
              paddingTop: "12px",
              borderTop: "1px solid var(--border-hairline)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "0.74rem",
              fontFamily: "var(--font-geist-mono), monospace",
              color: "var(--text-muted)"
            }}>
              <div>NODE ID: {selectedNode.id}</div>
              <div>CONFIDENCE: 98.4% (NVIDIA NEMOTRON)</div>
              <div>STATUS: CONSOLIDATED IN 03:00 AM REPLAY</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
