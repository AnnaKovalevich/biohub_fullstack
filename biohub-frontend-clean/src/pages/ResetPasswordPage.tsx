import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { trpc } from "../lib/trpc";

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const resetPassword = trpc.auth.resetPassword.useMutation();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      resetPassword.mutate({ token, newPassword });
    }
  };

  if (resetPassword.isSuccess) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-4">
        <div className="bg-surface border border-borderLine rounded-lg p-8 w-full max-w-md text-center">
          <h2 className="text-xl font-semibold text-accent mb-4">
            Пароль изменён!
          </h2>
          <p className="text-white mb-6">{resetPassword.data.message}</p>
          <Link to="/login" className="text-accent">
            Войти
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="bg-surface border border-borderLine rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-white">
          Установите новый пароль
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <input
            type="password"
            placeholder="Новый пароль (минимум 6 символов)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full"
            required
            minLength={6}
          />
          <button
            type="submit"
            className="w-full bg-accent text-base font-semibold py-2 rounded-lg"
          >
            Сбросить пароль
          </button>
        </form>
        {resetPassword.isError && (
          <p className="text-red-500 text-sm mt-4">
            {resetPassword.error.message}
          </p>
        )}
      </div>
    </div>
  );
};
