import { useTheme } from "../hooks/useTheme";

export const ThemeToggle = () => {
  const { dark, toggle } = useTheme();

  return (
    <label className="flex items-center gap-3 cursor-pointer text-sm text-muted hover:text-white transition-colors px-3 py-2.5 rounded-custom hover:bg-surfaceHover">
      <span>{dark ? "🌙 Тёмная" : "☀️ Светлая"}</span>
      <div className="relative">
        <input
          type="checkbox"
          checked={dark}
          onChange={toggle}
          className="sr-only peer"
        />
        <div className="w-9 h-5 bg-gray-600 rounded-full peer-checked:bg-accent transition-colors"></div>
        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform"></div>
      </div>
    </label>
  );
};
