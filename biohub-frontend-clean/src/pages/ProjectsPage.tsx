import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { FileList } from "../components/FileList";
import { FileUpload } from "../components/FileUpload";

export const ProjectsPage = () => {
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const { data, isLoading, error, refetch } = trpc.project.list.useQuery();

  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const projects = data?.projects || [];

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects]);

  if (isLoading) {
    return <div className="text-white p-8">Загрузка...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-8">{error.message}</div>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <Header />

        <h1 className="text-xl text-white mb-4">Проекты</h1>

        {/* список проектов */}
        {projects.map((p: any) => (
          <div
            key={p.id}
            className="p-3 border mb-2 cursor-pointer text-white"
            onClick={() => setSelectedProject(p)}
          >
            {p.name}
          </div>
        ))}

        {/* выбранный проект */}
        {selectedProject && (
          <>
            <h2 className="text-lg text-white mt-6">{selectedProject.name}</h2>

            {/* загрузка */}
            <div className="mt-4">
              <FileUpload projectId={selectedProject.id} />
            </div>

            {/* список файлов */}
            <div className="mt-4">
              <FileList projectId={selectedProject.id} />
            </div>
          </>
        )}
      </main>
    </div>
  );
};
