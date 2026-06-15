import { useState, useEffect } from "react";

export const useTheme = () => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved !== "light"; // по умолчанию тёмная
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
};
