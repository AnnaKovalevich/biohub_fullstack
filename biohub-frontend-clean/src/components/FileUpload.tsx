import { useState } from "react";
import { trpc } from "../lib/trpc";

export const FileUpload = ({ projectId }: { projectId: string }) => {
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = trpc.file.getUploadUrl.useMutation();

  const handleUpload = async () => {
    if (!file) return;

    try {
      const res = await uploadMutation.mutateAsync({
        projectId,
        stage: "raw",
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      // загружаем файл напрямую в S3 (MinIO)
      await fetch(res.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      alert("Файл успешно загружен");
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Ошибка загрузки файла");
    }
  };

  return (
    <div className="bg-surface p-4 rounded-lg border border-borderLine">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-2"
      />
      <button
        onClick={handleUpload}
        className="bg-accent px-4 py-2 rounded text-white"
      >
        Загрузить
      </button>
    </div>
  );
};
