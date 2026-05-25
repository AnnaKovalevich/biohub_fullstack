import { useState } from "react";
import { trpc } from "../lib/trpc";

export const AccessManager = ({ projectId }: { projectId: string }) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"read" | "write" | "admin">(
    "read",
  );

  const { data, isLoading, refetch } = trpc.project.listAccess.useQuery({
    projectId,
  });
  const addAccess = trpc.project.addAccess.useMutation({
    onSuccess: () => {
      setEmail("");
      refetch();
    },
    onError: (err) => alert(err.message),
  });
  const updateAccess = trpc.project.updateAccess.useMutation({
    onSuccess: () => refetch(),
  });
  const removeAccess = trpc.project.removeAccess.useMutation({
    onSuccess: () => refetch(),
  });

  const handleAdd = () => {
    if (!email.trim()) return;
    addAccess.mutate({ projectId, email, permission });
  };

  if (isLoading)
    return (
      <div className="text-muted text-sm py-2">Загрузка участников...</div>
    );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Участники проекта</h3>

      {/* Добавление нового участника */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-muted mb-1">
            Email пользователя
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Роль</label>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as any)}
            className="w-full"
          >
            <option value="read">Просмотр</option>
            <option value="write">Редактирование</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
        <button
          onClick={handleAdd}
          disabled={addAccess.isLoading}
          className="bg-accent text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Добавить
        </button>
      </div>

      {/* Список участников */}
      <div className="space-y-2">
        {data?.accesses.map((access: any) => (
          <div
            key={access.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface border border-borderLine rounded-custom p-3"
          >
            <div>
              <p className="text-white font-medium">{access.user.fullName}</p>
              <p className="text-muted text-xs">{access.user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={access.permission}
                onChange={(e) =>
                  updateAccess.mutate({
                    accessId: access.id,
                    permission: e.target.value as any,
                  })
                }
                className="text-sm"
              >
                <option value="read">Просмотр</option>
                <option value="write">Редактирование</option>
                <option value="admin">Администратор</option>
              </select>
              <button
                onClick={() => {
                  if (confirm("Удалить участника?"))
                    removeAccess.mutate({ accessId: access.id });
                }}
                className="text-red-500 hover:text-red-400 text-sm"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
        {data?.accesses.length === 0 && (
          <p className="text-muted text-sm">Нет добавленных участников</p>
        )}
      </div>
    </div>
  );
};
