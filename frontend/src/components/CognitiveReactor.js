"use client";

import { useEffect, useRef, useState } from "react";
import { Network, Zap } from "lucide-react";

export default function CognitiveReactor({ setActiveTab }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredHub, setHoveredHub] = useState(null);
  const hoveredHubRef = useRef(null);
  const [activeEdgesCount, setActiveEdgesCount] = useState(1150);
  const [frequency, setFrequency] = useState(19.2);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    // Mouse state & physics
    const mouse = {
      x: -2000,
      y: -2000,
      active: false,
      clickBursts: []
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -2000;
      mouse.y = -2000;
    };

    // Helper: detect dark mode
    const isDarkTheme = () => {
      if (typeof document === "undefined") return true;
      return document.documentElement.getAttribute("data-theme") !== "light";
    };

    // =========================================================================
    // 5 PRIMARY COGNITIVE LANDMARK HUBS
    // Normal spherical node dots with 5 signature colors & clean monospace labels
    // =========================================================================
    const hubConfigs = [
      {
        id: "nemotron",
        name: "Nemotron 550B",
        subtitle: "Dialectical Synthesis",
        targetTab: "replay",
        angle: -0.28 * Math.PI,
        distRel: 0.38,
        colorDark: "#38bdf8",
        colorLight: "#0284c7"
      },
      {
        id: "supervl",
        name: "Super-VL 3.5",
        subtitle: "Multimodal Ingest",
        targetTab: "console",
        angle: -0.80 * Math.PI,
        distRel: 0.36,
        colorDark: "#a855f7",
        colorLight: "#7c3aed"
      },
      {
        id: "tavily",
        name: "Tavily Grounding",
        subtitle: "Epistemic Truth",
        targetTab: "console",
        angle: 0.78 * Math.PI,
        distRel: 0.38,
        colorDark: "#10b981",
        colorLight: "#059669"
      },
      {
        id: "paradox",
        name: "Paradox Radar",
        subtitle: "Antithesis Detector",
        targetTab: "challenges",
        angle: 0.30 * Math.PI,
        distRel: 0.40,
        colorDark: "#f43f5e",
        colorLight: "#e11d48"
      },
      {
        id: "nucleus",
        name: "Epistemic Core",
        subtitle: "Hippocampal Memory",
        targetTab: "graph",
        angle: 0,
        distRel: 0.0,
        colorDark: "#f59e0b",
        colorLight: "#d97706"
      }
    ];

    const hubs = [];
    const roamingNodes = [];
    const vesicleSpikes = [];

    // TOTAL ULTRA-DENSE ROAMING NODES: 310 interneurons + 5 hubs = 315 nodes
    const TOTAL_INTERNEURONS = 310;
    const MAX_EDGE_DIST = 76;
    const MAX_EDGE_DIST_SQ = MAX_EDGE_DIST * MAX_EDGE_DIST;

    // Initialize 5 Main Landmark Nodes
    const initHubs = () => {
      const cx = width * 0.46;
      const cy = height * 0.48;
      const minDim = Math.min(width, height);

      hubs.length = 0;
      hubConfigs.forEach((cfg) => {
        const hx = cx + Math.cos(cfg.angle) * (minDim * cfg.distRel);
        const hy = cy + Math.sin(cfg.angle) * (minDim * cfg.distRel * 0.85);

        hubs.push({
          ...cfg,
          x: hx,
          y: hy,
          baseX: hx,
          baseY: hy,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          z: 1.45,
          radius: 4.8, // Normal spherical node dot
          isHub: true,
          firingHalo: 0
        });
      });
    };

    // Initialize 310 Roaming Interneurons freely across the full canvas
    const initRoamingNodes = () => {
      roamingNodes.length = 0;

      for (let i = 0; i < TOTAL_INTERNEURONS; i++) {
        // Distribute freely across the entire canvas area, with generous spread on the left flank
        let rx, ry;
        if (i < 95) {
          // 30% dedicated to left flank to fill the space beside the hero text
          rx = 25 + Math.random() * (width * 0.44 - 30);
          ry = 25 + Math.random() * (height - 50);
        } else {
          // 70% across the central and right cortex
          rx = 25 + Math.random() * (width - 50);
          ry = 25 + Math.random() * (height - 50);
        }

        const z = 0.4 + Math.random() * 1.2;
        const speed = (0.16 + Math.random() * 0.28) * (z * 0.8);
        const moveAngle = Math.random() * Math.PI * 2;

        roamingNodes.push({
          id: `node-${i}`,
          x: rx,
          y: ry,
          vx: Math.cos(moveAngle) * speed,
          vy: Math.sin(moveAngle) * speed,
          z,
          radius: Math.max(1.7, (1.8 + Math.random() * 1.6) * (z * 0.7)),
          firingHalo: 0,
          membranePotential: Math.random(),
          fireRate: 0.002 + Math.random() * 0.003
        });
      }
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Check if user clicked on any main landmark hub
      const clickedHub = hubs.find((h) => Math.hypot(h.x - clickX, h.y - clickY) < 36);
      if (clickedHub && setActiveTab) {
        setActiveTab(clickedHub.targetTab);
        return;
      }

      // Trigger cortical depolarization wave
      mouse.clickBursts.push({
        x: clickX,
        y: clickY,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.85,
        speed: 7,
        alpha: 1.0
      });
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", handleClick);

    // Initial setup
    initHubs();
    initRoamingNodes();

    let tick = 0;

    // =========================================================================
    // MAIN RENDER LOOP: ULTRA-DENSE ABSTRACT NEURAL WEB (ROAMING FREE)
    // =========================================================================
    const render = () => {
      tick++;

      if (width === 0 || height === 0) {
        resize();
        initHubs();
        initRoamingNodes();
      }

      ctx.clearRect(0, 0, width, height);

      const isDark = isDarkTheme();
      const allNodes = [...hubs, ...roamingNodes];
      const totalCount = allNodes.length;

      // 3D Parallax tilt from mouse
      const centerDistX = mouse.active ? (mouse.x - width * 0.5) / (width * 0.5) : 0;
      const centerDistY = mouse.active ? (mouse.y - height * 0.5) / (height * 0.5) : 0;
      const parallaxFactorX = centerDistX * 14;
      const parallaxFactorY = centerDistY * 10;

      // -----------------------------------------------------------------------
      // 0. CORTICAL WAVE RIPPLES (ON CLICK)
      // -----------------------------------------------------------------------
      for (let b = mouse.clickBursts.length - 1; b >= 0; b--) {
        const burst = mouse.clickBursts[b];
        burst.radius += burst.speed;
        burst.alpha = Math.max(0, 1 - burst.radius / burst.maxRadius);

        ctx.save();
        ctx.strokeStyle = isDark
          ? `rgba(255, 255, 255, ${burst.alpha * 0.28})`
          : `rgba(17, 17, 17, ${burst.alpha * 0.22})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Depolarize nodes crossed by wavefront
        allNodes.forEach((node) => {
          const d = Math.hypot(node.x - burst.x, node.y - burst.y);
          if (Math.abs(d - burst.radius) < burst.speed * 1.5) {
            node.firingHalo = 0.85;
          }
        });

        if (burst.radius >= burst.maxRadius || burst.alpha <= 0) {
          mouse.clickBursts.splice(b, 1);
        }
      }

      // -----------------------------------------------------------------------
      // 1. UPDATE NODE PHYSICS (ROAMING FREE ACROSS THE ENTIRE PAGE)
      // -----------------------------------------------------------------------
      let foundHover = null;

      // Update 5 Main Landmark Hubs (anchored with subtle biological breathing)
      hubs.forEach((hub, idx) => {
        const breathe = Math.sin(tick * 0.012 + idx * 0.8) * 0.24;
        const driftX = Math.cos(tick * 0.009 + idx) * 0.22;
        const driftY = Math.sin(tick * 0.011 + idx) * 0.22;

        const targetX = hub.baseX + driftX + parallaxFactorX * (hub.z - 1.0);
        const targetY = hub.baseY + driftY + parallaxFactorY * (hub.z - 1.0) + breathe;

        hub.x += (targetX - hub.x) * 0.05;
        hub.y += (targetY - hub.y) * 0.05;

        // Hub click/hover detection (generous 36px radius for smooth hover response)
        const isHovered = mouse.active && Math.hypot(hub.x - mouse.x, hub.y - mouse.y) < 36;
        if (isHovered) foundHover = hub;
      });
      if (foundHover?.id !== hoveredHubRef.current?.id) {
        hoveredHubRef.current = foundHover;
        setHoveredHub(foundHover);
      }

      // Update 310 Roaming Interneurons (smooth boundary bouncing, free roaming)
      roamingNodes.forEach((node) => {
        // Continuous organic roaming
        node.x += node.vx;
        node.y += node.vy;

        // Soft elastic reflection at canvas boundaries so nodes continuously roam freely
        const pad = 20;
        if (node.x < pad) {
          node.x = pad;
          node.vx = Math.abs(node.vx);
        } else if (node.x > width - pad) {
          node.x = width - pad;
          node.vx = -Math.abs(node.vx);
        }

        if (node.y < pad) {
          node.y = pad;
          node.vy = Math.abs(node.vy);
        } else if (node.y > height - pad) {
          node.y = height - pad;
          node.vy = -Math.abs(node.vy);
        }

        // Mouse Gravitational Elasticity (Subtle, gentle deflection)
        if (mouse.active) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          const probeDist = 125;

          if (dist < probeDist && dist > 1) {
            const force = (1 - dist / probeDist) * 7.5 * (node.z * 0.6);
            const angle = Math.atan2(dy, dx);
            node.x += Math.cos(angle) * force * 0.035;
            node.y += Math.sin(angle) * force * 0.035;
          }
        }

        // Spontaneous slow biological membrane firing
        node.membranePotential += node.fireRate;
        if (node.membranePotential >= 1.0) {
          node.membranePotential = 0;
          node.firingHalo = 0.8;
        }

        if (node.firingHalo > 0) {
          node.firingHalo -= 0.02;
        }
      });

      // -----------------------------------------------------------------------
      // 2. ULTRA-DENSE WOVEN SYNAPTIC INTERCONNECTS (HAIRLINE MESH)
      // High-performance spatial bounding box calculation (runs in <1ms)
      // -----------------------------------------------------------------------
      const filamentColorPrefix = isDark ? "rgba(224, 242, 254," : "rgba(15, 23, 42,";
      let renderedEdges = 0;

      ctx.save();

      for (let i = 0; i < totalCount; i++) {
        const n1 = allNodes[i];
        const n1IsHub = n1.isHub;
        const maxDist = n1IsHub ? 110 : MAX_EDGE_DIST;
        const maxDistSq = maxDist * maxDist;

        for (let j = i + 1; j < totalCount; j++) {
          const n2 = allNodes[j];
          const dx = n1.x - n2.x;
          if (dx > maxDist || dx < -maxDist) continue;

          const dy = n1.y - n2.y;
          if (dy > maxDist || dy < -maxDist) continue;

          const distSq = dx * dx + dy * dy;
          if (distSq < maxDistSq) {
            renderedEdges++;
            const dist = Math.sqrt(distSq);

            // Proximity & depth-weighted alpha
            const proximityAlpha = 1 - dist / maxDist;
            const depthFactor = (n1.z + n2.z) * 0.5;
            const alpha = proximityAlpha * depthFactor * (n1IsHub || n2.isHub ? 0.32 : 0.22);

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `${filamentColorPrefix} ${alpha})`;
            ctx.lineWidth = Math.min(n1.z, n2.z) * (n1IsHub || n2.isHub ? 0.85 : 0.65);
            ctx.stroke();

            // Constantly maintain active action potentials across connecting filaments
            if (vesicleSpikes.length < 32 && Math.random() < 0.0018) {
              vesicleSpikes.push({
                fromNode: n1,
                toNode: n2,
                progress: 0,
                speed: 0.004 + Math.random() * 0.003, // Steady biological crawl
                size: 2.2
              });
            }
          }
        }
      }
      ctx.restore();

      // -----------------------------------------------------------------------
      // 2.5 MOUSE SYNAPTIC PROBE & HOVER ELECTRICAL IMPULSES (LIGHTNING ARCS)
      // Crackling high-voltage arcs shooting to cursor and from hovered hubs
      // -----------------------------------------------------------------------
      if (mouse.active) {
        // A. Dynamic electrical lightning arcs from nearest 5 nodes directly to cursor
        const sortedNearest = allNodes
          .map((n) => ({ node: n, dist: Math.hypot(n.x - mouse.x, n.y - mouse.y) }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 5);

        sortedNearest.forEach(({ node, dist }) => {
          if (dist < 180) {
            const arcIntensity = 1 - dist / 180;
            ctx.save();
            ctx.strokeStyle = isDark
              ? (node.isHub ? node.colorDark : `rgba(255, 255, 255, ${arcIntensity * 0.85})`)
              : (node.isHub ? node.colorLight : `rgba(17, 17, 17, ${arcIntensity * 0.75})`);
            ctx.lineWidth = node.isHub ? 1.8 : 1.1;

            // Perpendicular normal jitter for genuine electrical lightning branching
            const dx = mouse.x - node.x;
            const dy = mouse.y - node.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            const j1 = (Math.random() - 0.5) * 16;
            const j2 = (Math.random() - 0.5) * 16;

            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(node.x + dx * 0.33 + nx * j1, node.y + dy * 0.33 + ny * j1);
            ctx.lineTo(node.x + dx * 0.66 + nx * j2, node.y + dy * 0.66 + ny * j2);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();

            // Contact spark bead & electric corona ring at cursor
            ctx.fillStyle = isDark ? "#ffffff" : "#111111";
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(17, 17, 17, 0.3)";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 5.0, 0, Math.PI * 2);
            ctx.stroke();

            // Stimulate node depolarization and launch outgoing impulse
            node.firingHalo = Math.max(node.firingHalo, 0.8);
            if (vesicleSpikes.length < 35 && Math.random() < 0.15) {
              const targetNeighbor = roamingNodes[Math.floor(Math.random() * roamingNodes.length)];
              if (Math.hypot(targetNeighbor.x - node.x, targetNeighbor.y - node.y) < 100) {
                vesicleSpikes.push({
                  fromNode: node,
                  toNode: targetNeighbor,
                  progress: 0,
                  speed: 0.006 + Math.random() * 0.003,
                  size: 2.4
                });
              }
            }

            ctx.restore();
          }
        });

        // B. Intense electrical discharge burst when hovering any of the 5 main hubs
        if (foundHover) {
          const hub = foundHover;
          const hubColor = isDark ? hub.colorDark : hub.colorLight;

          const hubNeighbors = roamingNodes
            .map((n) => ({ node: n, dist: Math.hypot(n.x - hub.x, n.y - hub.y) }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 10);

          hubNeighbors.forEach(({ node, dist }) => {
            if (dist < 190) {
              ctx.save();
              ctx.strokeStyle = hubColor;
              ctx.lineWidth = 1.6;

              const dx = node.x - hub.x;
              const dy = node.y - hub.y;
              const len = Math.hypot(dx, dy) || 1;
              const nx = -dy / len;
              const ny = dx / len;

              const j1 = (Math.random() - 0.5) * 18;
              const j2 = (Math.random() - 0.5) * 18;

              // Vivid jagged lightning discharge fork from hub to neighbor
              ctx.beginPath();
              ctx.moveTo(hub.x, hub.y);
              ctx.lineTo(hub.x + dx * 0.33 + nx * j1, hub.y + dy * 0.33 + ny * j1);
              ctx.lineTo(hub.x + dx * 0.66 + nx * j2, hub.y + dy * 0.66 + ny * j2);
              ctx.lineTo(node.x, node.y);
              ctx.stroke();

              // Energize the neighbor node with depolarization glow
              node.firingHalo = 1.0;

              // Discharge rapid vesicle spikes racing outward
              if (vesicleSpikes.length < 35 && Math.random() < 0.4) {
                vesicleSpikes.push({
                  fromNode: hub,
                  toNode: node,
                  progress: 0,
                  speed: 0.009 + Math.random() * 0.004,
                  size: 2.6
                });
              }

              ctx.restore();
            }
          });
        }

        // C. Hovering directly near any normal roaming interneuron
        const hoveredInterneuron = roamingNodes.find((n) => Math.hypot(n.x - mouse.x, n.y - mouse.y) < 24);
        if (hoveredInterneuron) {
          hoveredInterneuron.firingHalo = 1.0;
          if (vesicleSpikes.length < 35 && Math.random() < 0.25) {
            const nearestNeighbor = roamingNodes
              .filter((n) => n !== hoveredInterneuron)
              .map((n) => ({ node: n, dist: Math.hypot(n.x - hoveredInterneuron.x, n.y - hoveredInterneuron.y) }))
              .sort((a, b) => a.dist - b.dist)[0];
            if (nearestNeighbor && nearestNeighbor.dist < 110) {
              vesicleSpikes.push({
                fromNode: hoveredInterneuron,
                toNode: nearestNeighbor.node,
                progress: 0,
                speed: 0.008 + Math.random() * 0.003,
                size: 2.4
              });
            }
          }
        }
      }

      // -----------------------------------------------------------------------
      // 3. ACTION POTENTIAL PARTICLES (SLOW, STEADY, SPHERICAL ONLY, NO TRAILS)
      // Pure White on Dark Mode, Pure Black on Light Mode
      // -----------------------------------------------------------------------
      for (let s = vesicleSpikes.length - 1; s >= 0; s--) {
        const sp = vesicleSpikes[s];
        sp.progress += sp.speed;

        const p1 = sp.fromNode;
        const p2 = sp.toNode;
        const curX = p1.x + (p2.x - p1.x) * sp.progress;
        const curY = p1.y + (p2.y - p1.y) * sp.progress;

        ctx.save();
        ctx.fillStyle = isDark ? "#ffffff" : "#111111"; // Pure white on dark, pure black on light
        ctx.beginPath();
        ctx.arc(curX, curY, sp.size, 0, Math.PI * 2); // Spherical bead only — NO fish tails
        ctx.fill();
        ctx.restore();

        if (sp.progress >= 1.0) {
          sp.toNode.firingHalo = 0.7;
          vesicleSpikes.splice(s, 1);
        }
      }

      // -----------------------------------------------------------------------
      // 4. CORTICAL ROAMING INTERNEURONS (CLINICAL MONOCHROME NODES)
      // Pure White/translucent on Dark Mode, Pure Obsidian/charcoal on Light Mode
      // -----------------------------------------------------------------------
      roamingNodes.forEach((node) => {
        ctx.save();

        // Depolarization halo
        if (node.firingHalo > 0) {
          ctx.strokeStyle = isDark
            ? `rgba(255, 255, 255, ${node.firingHalo * 0.35})`
            : `rgba(17, 17, 17, ${node.firingHalo * 0.25})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + (1 - node.firingHalo) * 12, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Normal spherical node dot
        const nodeAlpha = 0.35 + node.z * 0.45;
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${nodeAlpha})`
          : `rgba(17, 17, 17, ${nodeAlpha * 0.88})`;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // -----------------------------------------------------------------------
      // 5. THE 5 MAIN NODES: NORMAL SPHERICAL NODES (5 DISTINCT COLORS)
      // Differentiated solely by signature color with clean monospace label.
      // Zero concentric circles, soma rings, or triangular spikes.
      // -----------------------------------------------------------------------
      hubs.forEach((hub) => {
        const hubColor = isDark ? hub.colorDark : hub.colorLight;
        const isHovered = mouse.active && Math.hypot(hub.x - mouse.x, hub.y - mouse.y) < 36;

        ctx.save();

        // Soft aura only on hover or depolarization
        if (isHovered || hub.firingHalo > 0) {
          ctx.strokeStyle = hubColor + (isDark ? "77" : "55");
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(hub.x, hub.y, hub.radius + (isHovered ? 4.5 : (1 - hub.firingHalo) * 12), 0, Math.PI * 2);
          ctx.stroke();
        }

        // Normal spherical node dot (exact same format as ecosystem nodes)
        ctx.fillStyle = hubColor;
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, isHovered ? hub.radius + 1.2 : hub.radius, 0, Math.PI * 2);
        ctx.fill();

        // Clean, Monospace Technical Micro-Label
        ctx.font = "600 9.5px var(--font-geist-mono), 'JetBrains Mono', monospace";
        ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.9)" : "#0f172a";
        ctx.textAlign = "center";
        ctx.fillText(hub.name.toUpperCase(), hub.x, hub.y + 16);

        ctx.font = "500 8px var(--font-geist-mono), 'JetBrains Mono', monospace";
        ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.5)" : "#64748b";
        ctx.fillText(hub.subtitle, hub.x, hub.y + 26);

        ctx.restore();
      });

      // Update telemetry
      if (tick % 60 === 0) {
        setActiveEdgesCount(renderedEdges);
        setFrequency((18.8 + Math.random() * 0.8).toFixed(1));
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("click", handleClick);
    };
  }, [setActiveTab]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: "380px",
        position: "relative",
        background: "transparent",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible"
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          background: "transparent",
          cursor: hoveredHub ? "pointer" : "default"
        }}
      />

      {/* Floating Scientific HUD Tag 1: Ultra-Dense Synaptic Cortex */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          padding: "5px 11px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          pointerEvents: "none",
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-hairline)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
        }}
      >
        <div className="live-pulse-dot" />
        <div>
          <div style={{
            fontSize: "0.68rem",
            fontFamily: "var(--font-geist-mono), monospace",
            fontWeight: "700",
            color: "var(--text-primary)",
            letterSpacing: "0.08em"
          }}>
            ULTRA-DENSE SYNAPTIC CORTEX • ACTIVE
          </div>
          <div style={{
            fontSize: "0.6rem",
            color: "var(--text-muted)",
            fontFamily: "var(--font-geist-mono), monospace"
          }}>
            315 Roaming Nodes • {activeEdgesCount} Hairline Synapses • {frequency} Hz Rhythm
          </div>
        </div>
      </div>

      {/* Floating Scientific HUD Tag 2: Interactive Hint */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          padding: "5px 11px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          gap: "7px",
          pointerEvents: "none",
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-hairline)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
        }}
      >
        <Network size={12} style={{ color: "var(--text-muted)" }} />
        <div style={{
          fontSize: "0.64rem",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-geist-mono), monospace",
          letterSpacing: "0.04em"
        }}>
          Nodes roaming freely across entire cortex • Hover hubs to navigate
        </div>
      </div>
    </div>
  );
}
