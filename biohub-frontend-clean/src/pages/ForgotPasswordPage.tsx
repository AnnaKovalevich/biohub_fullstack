import { useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const forgotPassword = trpc.auth.forgotPassword.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="bg-surface border border-borderLine rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-white">
          Восстановление пароля
        </h1>
        <p className="text-muted text-sm mb-6">
          Введите ваш email, и мы отправим инструкцию по сбросу пароля
        </p>

        {!forgotPassword.isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              required
            />
            <button
              type="submit"
              className="w-full bg-accent text-base font-semibold py-2 rounded-lg"
            >
              Отправить
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-accent mb-4">{forgotPassword.data.message}</p>
            <Link to="/login" className="text-accent">
              Вернуться ко входу
            </Link>
          </div>
        )}

        {forgotPassword.isError && (
          <p className="text-red-500 text-sm mt-4">
            {forgotPassword.error.message}
          </p>
        )}
      </div>
    </div>
  );
};
