"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Network, Filter, Info, X } from "lucide-react";

// Dynamically import ForceGraph2D with ssr disabled
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "600px", color: "var(--text-tertiary)" }}>
      Loading Knowledge Graph Canvas...
    </div>
  )
});

export default function KnowledgeGraphView({ graphData }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [dimensions, setDimensions] = useState({ width: 900, height: 650 });
  const containerRef = useRef(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 900,
          height: Math.max(550, window.innerHeight - 220)
        });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
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
    <div style={{ padding: "20px 24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Top Filter Bar */}
      <div className="glass-panel" style={{
        padding: "12px 20px",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Network size={18} style={{ color: "var(--accent-primary)" }} />
          <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>Knowledge Topology</span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
            ({activeGraph.nodes.length} nodes, {activeGraph.links.length} connections)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Filter size={14} style={{ color: "var(--text-tertiary)" }} />
          {["all", "document", "concept", "decision", "paradox"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: "none",
                fontSize: "0.76rem",
                fontWeight: "600",
                textTransform: "capitalize",
                cursor: "pointer",
                background: filterType === type ? "var(--accent-primary)" : "var(--bg-elevated)",
                color: filterType === type ? "#ffffff" : "var(--text-secondary)"
              }}
            >
              {type === "paradox" ? "⚡ Paradoxes" : type}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas & Inspector Container */}
      <div ref={containerRef} style={{ position: "relative", width: "100%", borderRadius: "14px", overflow: "hidden", border: "1px solid var(--border-subtle)", background: "var(--graph-bg)" }}>
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={activeGraph}
          nodeLabel={(n) => `${n.name} (${n.type})`}
          nodeColor={(n) => {
            if (n.type === "paradox") return "#ef4444";
            if (n.type === "decision") return "#10b981";
            if (n.type === "document") return "#0284c7";
            return "#6366f1";
          }}
          nodeRelSize={6}
          linkColor={() => "rgba(100, 116, 139, 0.35)"}
          linkWidth={1.5}
          onNodeClick={(node) => setSelectedNode(node)}
          cooldownTicks={100}
        />

        {/* Selected Node Drawer */}
        {selectedNode && (
          <div className="glass-panel" style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "320px",
            padding: "20px",
            zIndex: 10,
            boxShadow: "var(--shadow-lg)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                fontWeight: "700",
                color: selectedNode.type === "paradox" ? "var(--crimson-challenge)" : "var(--accent-primary)"
              }}>
                {selectedNode.type}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-tertiary)" }}
              >
                <X size={16} />
              </button>
            </div>
            <h4 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "6px" }}>{selectedNode.name}</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              {selectedNode.description || "Node indexed in personal epistemic topology."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
