"use client";

import { MoonStar } from "lucide-react";
import { useEffect } from "react";

export default function ThemeSwitcherButton() {
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  return (
    <button onClick={toggleTheme} className="drawer-button h-9 md:h-10 w-full">
      <div className="center-col h-9 w-9">
        <MoonStar className="size-4" />
      </div>
      <span>Темная тема</span>
    </button>
  );
}
