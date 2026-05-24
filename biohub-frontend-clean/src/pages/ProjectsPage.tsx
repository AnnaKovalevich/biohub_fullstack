import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { ThemeToggle } from "../components/ThemeToggle";

export const ProjectsPage = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = trpc.user.getProfile.useQuery();

  const { data, isLoading, error, refetch } = trpc.project.list.useQuery();
  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const projects = data?.projects || [];

  const filteredProjects = searchQuery.trim()
    ? projects.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : projects;

  useEffect(() => {
    if (filteredProjects.length === 0) {
      setSelectedProject(null);
      return;
    }
    if (
      selectedProject &&
      filteredProjects.some((p) => p.id === selectedProject.id)
    ) {
      return;
    }
    setSelectedProject(filteredProjects[0]);
  }, [filteredProjects, selectedProject]);

  const handleDelete = async (
    id: string,
    name: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (
      confirm(`Удалить проект "${name}"? Все файлы будут удалены безвозвратно.`)
    ) {
      await deleteProject.mutateAsync({ id });
      if (selectedProject?.id === id) {
        const remaining = filteredProjects.filter((p) => p.id !== id);
        setSelectedProject(remaining[0] || null);
      }
    }
  };

  const handleRowClick = (project: any) => {
    setSelectedProject(project);
  };

  const handleRowDoubleClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Загрузка...
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500 p-8">Ошибка: {error.message}</div>;
  }

  const totalFiles = selectedProject?.files?.length || 0;
  const totalSize =
    selectedProject?.files?.reduce(
      (acc: number, f: any) => acc + Number(f.fileSize || 0),
      0,
    ) || 0;
  const totalSizeGB = (totalSize / 1e9).toFixed(2);

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Активен";
      case "in_progress":
        return "В работе";
      case "completed":
        return "Завершён";
      default:
        return status;
    }
  };

  const getQcStatus = (qc: string) => {
    if (qc === "passed") return { text: "ПРОЙДЕН", color: "text-accent" };
    if (qc === "failed") return { text: "НЕ ПРОЙДЕН", color: "text-red-500" };
    return { text: "ОЖИДАНИЕ", color: "text-yellow-500" };
  };

  const tableRows = filteredProjects.map((p: any) => {
    const qc = getQcStatus(p.qcStatus);
    const totalSizeProj =
      p.files?.reduce((a: number, f: any) => a + Number(f.fileSize || 0), 0) ||
      0;
    const sizeGB = (totalSizeProj / 1e9).toFixed(1);
    return (
      <tr
        key={p.id}
        className={`hover:bg-surface-hover transition-colors group cursor-pointer ${selectedProject?.id === p.id ? "bg-accent-dim" : ""}`}
        onClick={() => handleRowClick(p)}
        onDoubleClick={() => handleRowDoubleClick(p.id)}
      >
        <td className="px-6 py-3">
          <div className="flex items-center gap-2">
            <i className="ph ph-file-text text-muted"></i>
            <span className="font-medium text-white">{p.name}</span>
          </div>
        </td>
        <td className="px-6 py-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {p.type}
          </span>
        </td>
        <td className="px-6 py-3">
          <span className="font-mono text-xs text-muted group-hover:text-gray-300 transition-colors">
            {p.files?.[0]?.stage || "—"}
          </span>
        </td>
        <td className="px-6 py-3 text-muted text-xs">{sizeGB} ГБ</td>
        <td className="px-6 py-3">
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${qc.color}`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${qc.color === "text-accent" ? "bg-accent" : qc.color === "text-red-500" ? "bg-red-500" : "bg-yellow-500"}`}
            ></div>
            {qc.text}
          </div>
        </td>
        <td className="px-6 py-3 text-right">
          <button
            onClick={(e) => handleDelete(p.id, p.name, e)}
            className="p-1.5 text-muted hover:text-red-500 rounded-custom transition-all"
            title="Удалить"
          >
            <i className="ph ph-trash text-lg"></i>
          </button>
        </td>
      </tr>
    );
  });

  const fullName = user?.fullName || "Пользователь";
  const position = user?.position || "Биоинформатик";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-base text-gray-200 font-sans h-screen w-screen overflow-hidden flex selection:bg-accent selection:text-base">
      <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-white/[0.01] backdrop-blur-xl flex flex-col h-full z-10">
        <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
          <div className="relative w-8 h-8 text-accent flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute w-6 h-6"
            >
              <path d="M4 4c0 4 16 12 16 16" stroke="rgba(0,255,170,0.5)" />
              <path d="M20 4c0 4-16 12-16 16" stroke="#00FFAA" />
              <line
                x1="8"
                y1="9"
                x2="16"
                y2="9"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
              />
              <line
                x1="6"
                y1="15"
                x2="18"
                y2="15"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
              />
              <line
                x1="12"
                y1="4"
                x2="12"
                y2="6"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
              />
              <line
                x1="12"
                y1="18"
                x2="12"
                y2="20"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-wide text-white">
            biohub
          </span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-custom bg-accent-dim text-accent border border-accent/20 transition-colors"
          >
            <i className="ph ph-folder-notch text-xl"></i>
            <span className="font-medium text-sm">Проекты</span>
          </Link>
          <Link
            to="/projects/new"
            className="flex items-center gap-3 px-3 py-2.5 rounded-custom text-muted hover:text-white hover:bg-surface-hover transition-colors"
          >
            <i className="ph ph-plus-circle text-xl"></i>
            <span className="font-medium text-sm">Новый проект</span>
          </Link>
          <Link
            to="/account"
            className="flex items-center gap-3 px-3 py-2.5 rounded-custom text-muted hover:text-white hover:bg-surface-hover transition-colors"
          >
            <i className="ph ph-user-circle text-xl"></i>
            <span className="font-medium text-sm">Личный кабинет</span>
          </Link>
        </nav>

        <ThemeToggle />

        <div className="p-4 border-t border-white/5">
          <button className="flex items-center gap-3 w-full p-2 rounded-custom hover:bg-surface-hover transition-colors text-left">
            <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center text-xs font-mono text-accent">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {fullName}
              </p>
              <p className="text-xs text-muted truncate">{position}</p>
            </div>
            <i className="ph ph-caret-up text-muted"></i>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-base">
        <header className="h-20 px-8 flex items-center justify-between border-b border-white/5 z-10 backdrop-blur-sm">
          <div className="flex-1 max-w-2xl">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ph ph-magnifying-glass text-muted group-focus-within:text-accent transition-colors"></i>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 bg-surface border border-white/10 rounded-custom text-sm text-white placeholder-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all backdrop-blur-md"
                placeholder="Поиск проектов..."
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-6">
            <Link
              to="/projects/new"
              className="px-4 py-2 bg-accent text-base font-semibold text-sm rounded-custom hover:bg-[#00e699] transition-colors shadow-[0_0_15px_rgba(0,255,170,0.2)]"
            >
              Новый анализ
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                {selectedProject?.name || "Выберите проект"}
              </h1>
              <p className="text-sm text-muted mt-1">
                {selectedProject?.description || "Описание отсутствует"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-muted">
                <div className="w-2 h-2 rounded-full bg-accent"></div>{" "}
                Синхронизация
              </span>
              <span className="text-white/10 mx-2">|</span>
              <span className="font-mono text-xs text-muted">
                ID: {selectedProject?.sampleId || "—"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-surface border border-white/10 rounded-custom p-5 backdrop-blur-md flex flex-col justify-between hover:border-white/20 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-muted">
                  Всего файлов
                </span>
                <i className="ph ph-vials text-muted text-lg"></i>
              </div>
              <div>
                <div className="text-3xl font-semibold text-white">
                  {totalFiles}
                </div>
                <div className="text-xs text-accent mt-1 flex items-center gap-1">
                  <i className="ph ph-trend-up"></i>
                  <span>{totalSizeGB} ГБ</span>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-white/10 rounded-custom p-5 backdrop-blur-md flex flex-col justify-between hover:border-white/20 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-muted">
                  Тип эксперимента
                </span>
                <i className="ph ph-waves text-muted text-lg"></i>
              </div>
              <div>
                <div className="text-3xl font-semibold text-white">
                  {selectedProject?.type?.toUpperCase() || "—"}
                </div>
                <div className="text-xs text-muted mt-1 flex items-center gap-1">
                  <i className="ph ph-check-circle text-accent"></i>
                  <span>QC {selectedProject?.qcStatus || "—"}</span>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-white/10 rounded-custom p-5 backdrop-blur-md flex flex-col justify-between hover:border-white/20 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-muted">
                  Платформа
                </span>
                <i className="ph ph-hard-drives text-muted text-lg"></i>
              </div>
              <div>
                <div className="text-3xl font-semibold text-white">
                  {selectedProject?.platform || "—"}
                </div>
                <div className="text-xs text-muted mt-1 font-mono">
                  s3://{selectedProject?.id || "проект"}
                </div>
              </div>
            </div>

            <div className="bg-surface border border-white/10 rounded-custom p-5 backdrop-blur-md flex flex-col justify-between hover:border-white/20 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-muted">Статус</span>
                <i className="ph ph-cpu text-muted text-lg"></i>
              </div>
              <div>
                <div className="text-3xl font-semibold text-white">
                  {getStatusText(selectedProject?.status)}
                </div>
                <div className="text-xs text-yellow-500 mt-1 flex items-center gap-1">
                  <i className="ph ph-spinner animate-spin"></i>
                  <span>Эксперимент в progress</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-white/10 rounded-custom backdrop-blur-md flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/[0.01] rounded-t-custom">
              <h2 className="text-base font-semibold text-white">
                Список проектов
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/[0.02] border-b border-white/10 text-xs uppercase tracking-wider text-muted font-medium">
                  <tr>
                    <th className="px-6 py-3">Название проекта</th>
                    <th className="px-6 py-3">Тип секвенирования</th>
                    <th className="px-6 py-3">Формат данных</th>
                    <th className="px-6 py-3">Размер</th>
                    <th className="px-6 py-3">Статус QC</th>
                    <th className="px-6 py-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-gray-300">
                  {tableRows.length > 0 ? (
                    tableRows
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted">
                        {searchQuery ? "Проекты не найдены" : "Нет проектов"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-white/[0.01] rounded-b-custom">
              <span className="text-xs text-muted">
                Показано {filteredProjects.length} записей
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
