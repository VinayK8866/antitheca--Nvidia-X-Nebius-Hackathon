"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(current);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    document.body.setAttribute("data-theme", nextTheme);
    try {
      localStorage.setItem("antitheca_theme", nextTheme);
    } catch (e) {}
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
      title={`Switch to ${theme === "light" ? "Dark (Engram)" : "Light (ReStructure)"} Mode`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        border: "1px solid var(--border-hairline)",
        background: "var(--bg-subtle)",
        color: "var(--text-primary)",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-strong)";
        e.currentTarget.style.background = "var(--bg-active)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hairline)";
        e.currentTarget.style.background = "var(--bg-subtle)";
      }}
    >
      {theme === "light" ? (
        <Sun size={17} style={{ color: "#111111", transition: "transform 0.25s ease" }} />
      ) : (
        <Moon size={17} style={{ color: "#ffffff", transition: "transform 0.25s ease" }} />
      )}
    </button>
  );
}
