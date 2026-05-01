import { NavLink } from 'react-router-dom'
import { trpc } from '../lib/trpc'

export const Sidebar = () => {
  const { data: user } = trpc.user.getProfile.useQuery()
  const fullName = user?.fullName || 'Пользователь'
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
  return (
    <aside className="w-64 flex-shrink-0 border-r border-borderLine bg-base flex flex-col h-full">
      <div className="h-20 flex items-center px-6 border-b border-borderLine gap-3">
        <div className="w-8 h-8 text-accent"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4c0 4 16 12 16 16" stroke="rgba(0,255,170,0.5)"/><path d="M20 4c0 4-16 12-16 16" stroke="#00FFAA"/><line x1="8" y1="9" x2="16" y2="9" stroke="rgba(255,255,255,0.2)"/><line x1="6" y1="15" x2="18" y2="15" stroke="rgba(255,255,255,0.2)"/></svg></div>
        <span className="font-semibold text-lg text-white">biohub</span>
      </div>
      <nav className="flex-1 py-6 px-3 space-y-1">
        <NavLink to="/" className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-custom ${isActive ? 'bg-accent-dim text-accent border border-accent/20' : 'text-muted hover:text-white hover:bg-surfaceHover'}`}><i className="ph ph-folder-notch text-xl"></i><span className="text-sm">Проекты</span></NavLink>
        <NavLink to="/projects/new" className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-custom ${isActive ? 'bg-accent-dim text-accent border border-accent/20' : 'text-muted hover:text-white hover:bg-surfaceHover'}`}><i className="ph ph-plus-circle text-xl"></i><span className="text-sm">Новый анализ</span></NavLink>
        <NavLink to="/account" className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-custom ${isActive ? 'bg-accent-dim text-accent border border-accent/20' : 'text-muted hover:text-white hover:bg-surfaceHover'}`}><i className="ph ph-user-circle text-xl"></i><span className="text-sm">Аккаунт</span></NavLink>
      </nav>
      <div className="p-4 border-t border-borderLine"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-surface border border-borderLine flex items-center justify-center text-xs font-mono text-accent">{initials}</div><div><p className="text-sm font-medium text-white truncate">{fullName}</p><p className="text-xs text-muted">{user?.position || 'Пользователь'}</p></div></div></div>
    </aside>
  )
}
