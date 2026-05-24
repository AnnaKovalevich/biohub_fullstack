import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";

export const Header = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get("search") || "");

  // Синхронизация: обновляем URL при изменении поля
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input) {
        setSearchParams({ search: input });
      } else {
        setSearchParams({});
      }
    }, 300); // лёгкая задержка для уменьшения количества обновлений
    return () => clearTimeout(timer);
  }, [input]);

  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-borderLine backdrop-blur-sm bg-base/80 sticky top-0 z-10">
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <i className="ph ph-magnifying-glass text-muted"></i>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-surface border border-borderLine rounded-custom text-sm placeholder-muted focus:outline-none focus:border-accent"
            placeholder="Поиск проектов..."
          />
        </div>
      </div>
      <div className="flex items-center gap-4 ml-6">
        <Link
          to="/projects/new"
          className="px-4 py-2 bg-accent text-base font-semibold text-sm rounded-custom hover:bg-[#00e699] transition shadow"
        >
          Новый анализ
        </Link>
      </div>
    </header>
  );
};

// import { Link } from 'react-router-dom'
// export const Header = () => {
//   return (
//     <header className="h-20 px-8 flex items-center justify-between border-b border-borderLine backdrop-blur-sm bg-base/80 sticky top-0 z-10">
//       <div className="flex-1 max-w-2xl"><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center"><i className="ph ph-magnifying-glass text-muted"></i></div><input type="text" className="block w-full pl-10 pr-4 py-2.5 bg-surface border border-borderLine rounded-custom text-sm placeholder-muted focus:outline-none focus:border-accent" placeholder="Поиск проектов..." /></div></div>
//       <div className="flex items-center gap-4 ml-6"><Link to="/projects/new" className="px-4 py-2 bg-accent text-base font-semibold text-sm rounded-custom hover:bg-[#00e699] transition shadow">Новый анализ</Link></div>
//     </header>
//   )
// }
