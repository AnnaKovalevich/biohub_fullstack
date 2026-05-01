import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { trpc } from '../lib/trpc'
import { Sidebar } from '../components/Sidebar'
import { Header } from '../components/Header'

export const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const [previewFile, setPreviewFile] = useState<{ name: string; content: string } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    status: '',
    platform: '',
    qcStatus: '',
    experimentDate: ''
  })

  const { data: project, isLoading, error, refetch } = trpc.project.getById.useQuery({ id: id! })
  const { data: filesData } = trpc.file.list.useQuery({ projectId: id! }, { enabled: !!id })
  const getDownloadUrl = trpc.file.getDownloadUrl.useMutation()
  const updateProject = trpc.project.update.useMutation({
    onSuccess: () => {
      refetch()
      setIsEditing(false)
    }
  })
  const files = filesData?.files || []

  useEffect(() => {
    if (project) {
      setEditForm({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'active',
        platform: project.platform || '',
        qcStatus: project.qcStatus || 'pending',
        experimentDate: project.experimentDate ? project.experimentDate.slice(0,10) : ''
      })
    }
  }, [project])

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const { downloadUrl } = await getDownloadUrl.mutateAsync({ fileId })
      window.open(downloadUrl, '_blank')
    } catch (err) {
      alert('Ошибка при скачивании файла')
    }
  }

  const handlePreview = async (fileId: string, fileName: string) => {
    try {
      const { downloadUrl } = await getDownloadUrl.mutateAsync({ fileId })
      const response = await fetch(downloadUrl)
      if (!response.ok) throw new Error('Не удалось загрузить файл')
      const text = await response.text()
      const preview = text.slice(0, 5000) + (text.length > 5000 ? '\n... (обрезано)\n' : '')
      setPreviewFile({ name: fileName, content: preview })
    } catch (err) {
      alert('Невозможно отобразить файл (возможно, бинарный)')
    }
  }

  const handleSaveEdit = () => {
    updateProject.mutate({
      id: id!,
      name: editForm.name,
      description: editForm.description,
      status: editForm.status,
      platform: editForm.platform || null,
      qcStatus: editForm.qcStatus,
      experimentDate: editForm.experimentDate || null
    })
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center text-white">Загрузка...</div>
  if (error) return <div className="p-8 text-red-500">Ошибка: {error.message}</div>
  const p = project

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
        <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
          <Link to="/" className="text-accent mb-4 inline-block">← Назад к проектам</Link>
          
          {!isEditing ? (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-semibold text-white">{p.name}</h1>
                  <p className="text-muted mt-2">{p.description || 'Нет описания'}</p>
                  <p className="text-xs text-muted mt-1">ID образца: {p.sampleId || '—'} | Тип: {p.type}</p>
                </div>
                <button onClick={() => setIsEditing(true)} className="text-accent border border-accent/30 px-3 py-1 rounded">Редактировать</button>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-surface border border-borderLine rounded-custom p-4">
                  <div className="text-muted text-sm">Платформа</div>
                  <div className="text-lg font-semibold">{p.platform || '—'}</div>
                </div>
                <div className="bg-surface border border-borderLine rounded-custom p-4">
                  <div className="text-muted text-sm">Статус</div>
                  <div className="text-lg font-semibold">{getStatusText(p.status)}</div>
                </div>
                <div className="bg-surface border border-borderLine rounded-custom p-4">
                  <div className="text-muted text-sm">Статус QC</div>
                  <div className="text-lg font-semibold">{getQcStatusText(p.qcStatus)}</div>
                </div>
                <div className="bg-surface border border-borderLine rounded-custom p-4">
                  <div className="text-muted text-sm">Дата эксперимента</div>
                  <div className="text-lg font-semibold">{p.experimentDate ? new Date(p.experimentDate).toLocaleDateString() : '—'}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-surface border border-borderLine rounded-custom p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Редактирование проекта</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-muted text-sm">Название</label><input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full" /></div>
                <div className="md:col-span-2"><label className="block text-muted text-sm">Описание</label><textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full" rows={2} /></div>
                <div><label className="block text-muted text-sm">Статус</label><select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full"><option value="active">Активен</option><option value="in_progress">В работе</option><option value="completed">Завершён</option></select></div>
                <div><label className="block text-muted text-sm">Платформа</label><select value={editForm.platform} onChange={e => setEditForm({...editForm, platform: e.target.value})} className="w-full"><option value="">Не выбрано</option><option value="Illumina">Illumina</option><option value="MinION">MinION</option><option value="PacBio">PacBio</option><option value="Oxford Nanopore">Oxford Nanopore</option></select></div>
                <div><label className="block text-muted text-sm">Статус QC</label><select value={editForm.qcStatus} onChange={e => setEditForm({...editForm, qcStatus: e.target.value})} className="w-full"><option value="pending">Ожидание</option><option value="passed">Пройден</option><option value="failed">Не пройден</option></select></div>
                <div><label className="block text-muted text-sm">Дата эксперимента</label><input type="date" value={editForm.experimentDate} onChange={e => setEditForm({...editForm, experimentDate: e.target.value})} className="w-full" /></div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-borderLine rounded">Отмена</button>
                <button onClick={handleSaveEdit} className="px-4 py-2 bg-accent rounded">Сохранить</button>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-6">
            <div><h2 className="text-lg font-medium border-b border-borderLine pb-2">Загруженные файлы</h2>
              {files.length === 0 && <p className="text-muted italic mt-2">Файлы не загружены</p>}
              <ul className="mt-2 space-y-1">
                {files.map(f => (
                  <li key={f.id} className="flex justify-between items-center p-2 bg-surface rounded">
                    <span><span className="text-accent font-mono text-xs">{f.stage}</span> – {f.fileName} ({(f.fileSize || 0) / 1e6} МБ)</span>
                    <div className="flex gap-2">
                      <button onClick={() => handlePreview(f.id, f.fileName)} className="text-accent text-sm border border-accent/30 px-2 py-0.5 rounded">Просмотр</button>
                      <button onClick={() => handleDownload(f.id, f.fileName)} className="text-accent text-sm border border-accent/30 px-2 py-0.5 rounded">Скачать</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div><h2 className="text-lg font-medium border-b border-borderLine pb-2">Параметры конвейера</h2><pre className="bg-base p-3 rounded text-xs mt-2">{JSON.stringify(p.pipelineParams, null, 2)}</pre></div>
            <div><h2 className="text-lg font-medium border-b border-borderLine pb-2">Вычислительная среда</h2><div className="grid grid-cols-2 gap-2 text-sm mt-2"><span>Кластер:</span><span>{p.computeEnv?.cluster || '—'}</span><span>CPU:</span><span>{p.computeEnv?.cpu || '—'}</span><span>Память:</span><span>{p.computeEnv?.memory || '—'} ГБ</span></div></div>
          </div>
        </div>
      </main>
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewFile(null)}>
          <div className="bg-surface border border-borderLine rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-borderLine">
              <h3 className="text-white font-semibold">Просмотр: {previewFile.name}</h3>
              <button onClick={() => setPreviewFile(null)} className="text-muted hover:text-white text-xl">&times;</button>
            </div>
            <div className="overflow-auto p-4">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words font-mono">{previewFile.content}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
