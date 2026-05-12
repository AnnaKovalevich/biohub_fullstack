import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { trpc } from "../lib/trpc";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      navigate("/");
    },
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };
  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="bg-surface border border-borderLine rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-white">Вход</h1>
        <p className="text-muted text-sm mb-6">Войдите в платформу biohub</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              required
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pr-10"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-accent transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i
                className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"} text-lg`}
              ></i>
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-accent text-base font-semibold py-2 rounded-lg"
          >
            Войти
          </button>

          <div className="text-right text-sm">
            <Link
              to="/forgot-password"
              className="text-muted hover:text-accent transition-colors"
            >
              Забыли пароль?
            </Link>
          </div>
        </form>
        {login.isError && (
          <p className="text-red-500 text-sm mt-4">{login.error.message}</p>
        )}
        <p className="text-center text-muted text-sm mt-6">
          Нет аккаунта?{" "}
          <Link to="/register" className="text-accent">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
};
