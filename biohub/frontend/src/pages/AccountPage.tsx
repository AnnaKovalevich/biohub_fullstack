import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";

export const AccountPage = () => {
  const navigate = useNavigate();
  const { data: user, isLoading, refetch } = trpc.user.getProfile.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation({ onSuccess: () => refetch() });
  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      alert("Пароль успешно изменён");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    },
    onError: (err) => setPasswordError(err.message),
  });

  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [institution, setInstitution] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPosition(user.position || "");
      setInstitution(user.institution || "");
    }
  }, [user]);

  const handleSave = () => {
    updateProfile.mutate({ fullName, position, institution });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Новый пароль и подтверждение не совпадают");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Новый пароль должен содержать минимум 6 символов");
      return;
    }
    changePassword.mutate({ oldPassword, newPassword });
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center text-white">Загрузка...</div>;
  if (!user) return <div className="flex h-screen items-center justify-center text-red-500">Не удалось загрузить профиль</div>;

  const initials = (fullName || user.fullName || "U").split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
          <h1 className="text-2xl font-semibold text-white mb-6">Управление аккаунтом</h1>

          {/* Блок профиля */}
          <div className="bg-surface border border-borderLine rounded-custom p-8 mb-6">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#161b22] to-base border-2 border-accent flex items-center justify-center text-4xl font-bold text-accent">{initials}</div>
              <div><h2 className="text-3xl font-semibold">{fullName || user.fullName}</h2><p className="text-muted">{position || user.position || "Должность не указана"}</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm text-muted">Имя и фамилия</label><input className="w-full" value={fullName} onChange={e => setFullName(e.target.value)} /></div>
              <div><label className="block text-sm text-muted">Email</label><input className="w-full" value={user.email} disabled /></div>
              <div><label className="block text-sm text-muted">Должность</label><input className="w-full" value={position} onChange={e => setPosition(e.target.value)} /></div>
              <div><label className="block text-sm text-muted">Учреждение</label><input className="w-full" value={institution} onChange={e => setInstitution(e.target.value)} /></div>
            </div>
            <div className="mt-8 flex justify-end gap-4">
              <button onClick={handleSave} className="bg-accent px-6 py-2 rounded-lg">Сохранить</button>
              <button onClick={handleLogout} className="bg-danger/20 text-danger px-6 py-2 rounded-lg">Выйти</button>
            </div>
          </div>

          {/* Блок безопасности (смена пароля) */}
          <div className="bg-surface border border-borderLine rounded-custom p-8">
            <h2 className="text-xl font-medium border-b border-borderLine pb-2 mb-4">Настройки безопасности</h2>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm text-muted mb-1">Текущий пароль</label>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full" required />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Новый пароль</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full" required />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">Подтвердите новый пароль</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full" required />
              </div>
              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
              <button type="submit" disabled={changePassword.isLoading} className="bg-accent px-6 py-2 rounded-lg disabled:opacity-50">
                {changePassword.isLoading ? "Смена..." : "Сменить пароль"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
