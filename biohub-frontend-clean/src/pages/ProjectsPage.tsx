import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { trpc } from '../lib/trpc'
import { Sidebar } from '../components/Sidebar'
import { Header } from '../components/Header'

export const ProjectsPage = () => {
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const { data, isLoading, error, refetch } = trpc.project.list.useQuery()
  const deleteProject = trpc.project.delete.useMutation({ onSuccess: () => refetch() })
  const projects = data?.projects || []

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) setSelectedProject(projects[0])
  }, [projects])

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Удалить проект "${name}"? Все файлы будут удалены безвозвратно.`)) {
      deleteProject.mutate({ id })
    }
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center text-white">Загрузка...</div>
  if (error) return <div className="p-8 text-red-500">Ошибка: {error.message}</div>

  const totalFilesCount = selectedProject ? Object.values(selectedProject.files || {}).flat().length : 0
  const totalSize = selectedProject
    ? Object.values(selectedProject.files || {}).flat().reduce((acc: number, f: any) => acc + (f.fileSize || f.size || 0), 0)
    : 0
  const totalSizeGB = (totalSize / 1e9).toFixed(2)

  const getStatusText = (status: string) => {
    switch(status) {
      case 'active': return 'Активен';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Завершён';
      default: return status;
    }
  }

  const getQcStatusText = (qc: string) => {
    switch(qc) {
      case 'passed': return '✅ Пройден';
      case 'failed': return '❌ Не пройден';
      default: return '⏳ Ожидание';
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-base">
          <div className="flex items-end justify-between mb-2">
            <div>
              <h1 className="text-2xl font-semibold text-white">{selectedProject?.name || 'Название проекта'}</h1>
              <p className="text-sm text-muted mt-1">{selectedProject?.description || 'Описание проекта.'}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-muted"><div className="w-2 h-2 rounded-full bg-accent"></div> Синхронизация</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-surface border border-borderLine rounded-custom p-5">
              <div><div className="text-3xl font-semibold text-white">{selectedProject?.type?.toUpperCase() || '—'}</div><div className="text-xs text-accent mt-1">Тип эксперимента</div></div>
            </div>
            <div className="bg-surface border border-borderLine rounded-custom p-5">
              <div><div className="text-3xl font-semibold text-white">{selectedProject?.platform || '—'}</div><div className="text-xs text-muted mt-1">Платформа</div></div>
            </div>
            <div className="bg-surface border border-borderLine rounded-custom p-5">
              <div><div className="text-3xl font-semibold text-white">{getStatusText(selectedProject?.status)}</div><div className="text-xs text-muted mt-1">Статус</div></div>
            </div>
            <div className="bg-surface border border-borderLine rounded-custom p-5">
              <div><div className="text-3xl font-semibold text-white">{totalFilesCount}</div><div className="text-xs text-muted mt-1">Файлов ({totalSizeGB} ГБ)</div></div>
            </div>
          </div>
          <div className="bg-surface border border-borderLine rounded-custom">
            <div className="p-4 border-b border-borderLine flex justify-between"><h2 className="text-base font-semibold text-white">Проекты и анализы</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.02] border-b border-borderLine text-xs uppercase text-muted">
                  <tr>
                    <th className="px-6 py-3">Название</th>
                    <th className="px-6 py-3">Тип</th>
                    <th className="px-6 py-3">Платформа</th>
                    <th className="px-6 py-3">Статус</th>
                    <th className="px-6 py-3">Статус QC</th>
                    <th className="px-6 py-3">Файлов</th>
                    <th className="px-6 py-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => {
                    const fcnt = Object.values(p.files || {}).flat().length
                    return (
                      <tr key={p.id} className="hover:bg-surfaceHover cursor-pointer" onDoubleClick={() => window.location.href=`/projects/${p.id}`} onClick={() => setSelectedProject(p)}>
                        <td className="px-6 py-3 font-medium text-white">{p.name}</td>
                        <td className="px-6 py-3">{p.type.toUpperCase()}</td>
                        <td className="px-6 py-3">{p.platform || '—'}</td>
                        <td className="px-6 py-3">{getStatusText(p.status)}</td>
                        <td className="px-6 py-3">{getQcStatusText(p.qcStatus)}</td>
                        <td className="px-6 py-3">{fcnt}</td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name); }} className="text-red-500 hover:text-white"><i className="ph ph-trash text-lg"></i></button>
                          <Link to={`/projects/${p.id}`} onClick={(e) => e.stopPropagation()} className="text-muted hover:text-accent"><i className="ph ph-eye text-lg"></i></Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
