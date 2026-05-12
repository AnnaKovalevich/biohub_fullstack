import { useState } from "react";
import { trpc } from "../lib/trpc";

export const FileUpload = ({
  projectId,
  stage,
  onSuccess,
}: {
  projectId: string;
  stage: string;
  onSuccess?: () => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = trpc.file.getUploadUrl.useMutation();

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadMutation.mutateAsync({
        projectId,
        stage,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
      });

      const uploadResponse = await fetch(res.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      alert("Файл успешно загружен");
      setFile(null);
      onSuccess?.();
    } catch (err) {
      console.error("Upload error:", err);
      alert(`Ошибка загрузки файла: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-surface p-4 rounded-lg border border-borderLine">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-2 text-white"
        disabled={uploading}
      />
      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-accent px-4 py-2 rounded text-white disabled:opacity-50"
      >
        {uploading ? "Загрузка..." : "Загрузить"}
      </button>
    </div>
  );
};
