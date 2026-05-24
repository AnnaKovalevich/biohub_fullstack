import { trpc, trpcClient } from "../lib/trpc";

export const FileList = ({ projectId }: { projectId: string }) => {
  const { data, refetch } = trpc.file.list.useQuery({ projectId });

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const result = await trpcClient.file.getDownloadUrl.query({ fileId });
      const link = document.createElement("a");
      link.href = result.downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Ошибка скачивания");
    }
  };

  if (!data) return <div className="text-white">Нет файлов</div>;

  return (
    <div className="bg-surface p-4 rounded-lg border border-borderLine">
      <h3 className="text-white mb-3">Файлы</h3>

      {data.files.map((f: any) => (
        <div
          key={f.id}
          className="flex justify-between items-center mb-2 text-sm text-white"
        >
          <span>{f.fileName}</span>

          <button
            onClick={() => handleDownload(f.id, f.fileName)}
            className="text-accent"
          >
            Скачать
          </button>
        </div>
      ))}
    </div>
  );
};
