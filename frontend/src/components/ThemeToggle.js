"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
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
      title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "20px",
        border: "1px solid var(--border-strong)",
        background: "var(--bg-elevated)",
        color: "var(--text-primary)",
        fontSize: "0.82rem",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s ease"
      }}
    >
      {theme === "light" ? (
        <>
          <Moon size={15} style={{ color: "var(--accent-primary)" }} />
          <span>Dark</span>
        </>
      ) : (
        <>
          <Sun size={15} style={{ color: "var(--amber-fact)" }} />
          <span>Light</span>
        </>
      )}
    </button>
  );
}
