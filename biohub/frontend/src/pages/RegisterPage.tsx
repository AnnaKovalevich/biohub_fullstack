import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { trpc } from '../lib/trpc'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', fullName: '', position: '', institution: '' })
  const register = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      localStorage.setItem('token', data.token)
      navigate('/')
    },
  })
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    register.mutate(form)
  }
  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-4">
      <div className="bg-surface border border-borderLine rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-white">Регистрация</h1>
        <p className="text-muted text-sm mb-6">Создайте аккаунт</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Полное имя" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full" required />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full" required />
          <input type="text" placeholder="Должность" value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="w-full" />
          <input type="text" placeholder="Учреждение" value={form.institution} onChange={e => setForm({...form, institution: e.target.value})} className="w-full" />
          <input type="password" placeholder="Пароль" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full" required />
          <button type="submit" className="w-full bg-accent text-base font-semibold py-2 rounded-lg">Зарегистрироваться</button>
        </form>
        {register.isError && <p className="text-red-500 text-sm mt-4">{register.error.message}</p>}
        <p className="text-center text-muted text-sm mt-6">Уже есть аккаунт? <Link to="/login" className="text-accent">Войти</Link></p>
      </div>
    </div>
  )
}
