"use client";

import { MoonStar } from "lucide-react";
import { useEffect } from "react";

export default function ThemeSwitcher() {
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
    <button
      onClick={toggleTheme}
      className="btn-small-2 center-col font-bold h-9 md:h-10 px-2 w-10"
    >
      <MoonStar className="size-4" />
    </button>
  );
}
