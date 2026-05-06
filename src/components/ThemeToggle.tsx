"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    // Check initial state from local storage or match media
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      setIsLight(true);
      document.documentElement.classList.add("light");
    }
  }, []);

  const toggleTheme = () => {
    if (isLight) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
      setIsLight(false);
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
      setIsLight(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 group ml-6 border-l border-nd-border-visible pl-6"
      title="Alternar tema"
    >
      <div className="relative w-10 h-5 rounded-full border border-nd-border-visible transition-colors duration-300">
        <div 
          className={`absolute top-[2px] left-[2px] w-3.5 h-3.5 rounded-full transition-all duration-300 ${
            isLight 
              ? "translate-x-5 bg-text-display" 
              : "bg-text-disabled"
          }`}
        />
      </div>
      <span className="font-mono text-label uppercase tracking-widest text-text-secondary group-hover:text-text-primary transition-colors hidden sm:block">
        {isLight ? "[ BLANCO ]" : "[ NEGRO ]"}
      </span>
    </button>
  );
}
