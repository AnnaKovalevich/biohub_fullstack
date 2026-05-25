import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { trpc, trpcClient } from "../lib/trpc";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { AccessManager } from "../components/AccessManager";

export const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    content: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "",
    platform: "",
    qcStatus: "",
    experimentDate: "",
  });

  const [fastqMetadata, setFastqMetadata] = useState({
    platform: "Illumina MiSeq",
    insertSize: 450,
    phredScore: "Phred33",
  });
  const [bamMetadata, setBamMetadata] = useState({
    reference: "",
    aligner: "",
  });
  const [vcfMetadata, setVcfMetadata] = useState({
    variantCaller: "",
    minVarFreq: 0.5,
    mutationType: "SNP + Indels",
  });
  const [annotationMetadata, setAnnotationMetadata] = useState({
    annotationDb: "ResFinder",
    dbVersion: "",
  });

  const [uploadingFiles, setUploadingFiles] = useState(false);

  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = trpc.project.getById.useQuery({ id: id! });
  const { data: filesData, refetch: refetchFiles } = trpc.file.list.useQuery(
    { projectId: id! },
    { enabled: !!id },
  );
  const { data: accessData } = trpc.project.listAccess.useQuery(
    { projectId: id! },
    { enabled: !!id },
  );
  const updateProject = trpc.project.update.useMutation({
    onSuccess: () => {
      refetch();
      refetchFiles();
      setIsEditing(false);
    },
    onError: (err: any) => {
      alert("Ошибка сохранения: " + err.message);
    },
  });
  const getUploadUrl = trpc.file.getUploadUrl.useMutation();

  const files = filesData?.files || [];

  useEffect(() => {
    if (project) {
      setEditForm({
        name: project.name || "",
        description: project.description || "",
        status: project.status || "active",
        platform: project.platform || "",
        qcStatus: project.qcStatus || "pending",
        experimentDate: project.experimentDate
          ? project.experimentDate.slice(0, 10)
          : "",
      });

      const params = project.pipelineParams || {};
      if (params.fastq) setFastqMetadata(params.fastq);
      if (params.bam) setBamMetadata(params.bam);
      if (params.vcf) setVcfMetadata(params.vcf);
      if (params.annotation) setAnnotationMetadata(params.annotation);
    }
  }, [project]);

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const result = await trpcClient.file.getDownloadUrl.query({ fileId });
      window.open(result.downloadUrl, "_blank");
    } catch (err) {
      alert("Ошибка при скачивании файла");
    }
  };

  const handlePreview = async (
    fileId: string,
    fileName: string,
    mimeType?: string,
  ) => {
    const textExtensions = [
      ".txt",
      ".fastq",
      ".fq",
      ".fasta",
      ".fa",
      ".fna",
      ".faa",
      ".ffn",
      ".frn",
      ".vcf",
      ".bed",
      ".gtf",
      ".gff",
      ".gff3",
      ".csv",
      ".tsv",
      ".json",
      ".xml",
      ".md",
      ".log",
    ];
    const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    const isText =
      textExtensions.includes(ext) ||
      (mimeType && mimeType.startsWith("text/"));

    if (!isText) {
      alert(
        'Этот файл имеет бинарный формат и не может быть отображён. Используйте кнопку "Скачать".',
      );
      return;
    }

    try {
      const result = await trpcClient.file.getDownloadUrl.query({ fileId });
      const response = await fetch(result.downloadUrl);
      if (!response.ok) throw new Error("Не удалось загрузить файл");
      const text = await response.text();
      setPreviewFile({ name: fileName, content: text });
    } catch (err) {
      alert("Невозможно отобразить файл. Попробуйте скачать его.");
    }
  };

  const handleSaveEdit = () => {
    const pipelineParams = {
      fastq: fastqMetadata,
      bam: bamMetadata,
      vcf: vcfMetadata,
      annotation: annotationMetadata,
    };

    let experimentDate = editForm.experimentDate;
    if (experimentDate) {
      experimentDate = new Date(experimentDate).toISOString();
    } else {
      experimentDate = null;
    }

    updateProject.mutate({
      id: id!,
      name: editForm.name,
      description: editForm.description,
      status: editForm.status,
      platform: editForm.platform || null,
      qcStatus: editForm.qcStatus,
      experimentDate,
      pipelineParams,
    });
  };

  const uploadFileToServer = async (file: File, stage: string) => {
    const { uploadUrl } = await getUploadUrl.mutateAsync({
      projectId: id!,
      stage,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": "application/octet-stream" },
    });
  };

  const handleFileUpload = async (stage: string, acceptedFiles: File[]) => {
    setUploadingFiles(true);
    try {
      for (const file of acceptedFiles) {
        await uploadFileToServer(file, stage);
      }
      await refetchFiles();
      alert("Файлы успешно загружены");
    } catch (err) {
      console.error(err);
      alert("Ошибка при загрузке файлов");
    } finally {
      setUploadingFiles(false);
    }
  };

  const FileDropZone = ({ stage, label }: { stage: string; label: string }) => {
    const onDrop = useCallback(
      (accepted: File[]) => {
        handleFileUpload(stage, accepted);
      },
      [stage],
    );
    const { getRootProps, getInputProps } = useDropzone({ onDrop });
    return (
      <div
        {...getRootProps()}
        className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-custom p-4 text-center cursor-pointer
                   hover:border-accent dark:hover:border-accent bg-white dark:bg-gray-800/30 transition-colors"
      >
        <input {...getInputProps()} />
        <i className="fas fa-upload text-2xl text-gray-400 dark:text-gray-500 mb-2"></i>
        <p className="text-sm text-muted">{label}</p>
      </div>
    );
  };

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Загрузка...
      </div>
    );
  if (error)
    return <div className="p-8 text-red-500">Ошибка: {error.message}</div>;

  const p = project;

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Активен";
      case "in_progress":
        return "В работе";
      case "completed":
        return "Завершён";
      default:
        return status;
    }
  };

  const getQcStatusText = (qc: string) => {
    switch (qc) {
      case "passed":
        return "✅ Пройден";
      case "failed":
        return "❌ Не пройден";
      default:
        return "⏳ Ожидание";
    }
  };

  const filesByStage = files.reduce(
    (acc, f) => {
      if (!acc[f.stage]) acc[f.stage] = [];
      acc[f.stage].push(f);
      return acc;
    },
    {} as Record<string, typeof files>,
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full bg-base">
          <Link to="/" className="text-accent mb-4 inline-block">
            ← Назад к проектам
          </Link>

          {!isEditing ? (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-semibold text-white">
                    {p.name}
                  </h1>
                  <p className="text-muted mt-2">
                    {p.description || "Нет описания"}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    ID образца: {p.sampleId || "—"} | Тип: {p.type}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-accent border border-accent/30 px-3 py-1 rounded"
                >
                  Редактировать
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-surface border border-borderLine rounded-custom p-4">
                  <div className="text-muted text-sm">Платформа</div>
                  <div className="text-lg font-semibold">
                    {p.platform || "—"}
                  </div>
                </div>
                <div className="bg-surface border border-borderLine rounded-custom p-4">
                  <div className="text-muted text-sm">Статус</div>
                  <div className="text-lg font-semibold">
                    {getStatusText(p.status)}
                  </div>
                </div>
                <div className="bg-surface border border-borderLine rounded-custom p-4">
                  <div className="text-muted text-sm">Статус QC</div>
                  <div className="text-lg font-semibold">
                    {getQcStatusText(p.qcStatus)}
                  </div>
                </div>
                <div className="bg-surface border border-borderLine rounded-custom p-4">
                  <div className="text-muted text-sm">Дата эксперимента</div>
                  <div className="text-lg font-semibold">
                    {p.experimentDate
                      ? new Date(p.experimentDate).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </div>

              {p.pipelineParams && (
                <div className="mt-8 space-y-4">
                  <h2 className="text-xl font-semibold text-white border-b border-gray-800 pb-2">
                    Технические параметры
                  </h2>
                  {p.pipelineParams.fastq && (
                    <div className="bg-surface border border-borderLine rounded-custom p-4">
                      <h3 className="text-lg font-medium text-white mb-2">
                        1. FASTQ
                      </h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted">Платформа:</span>{" "}
                          {p.pipelineParams.fastq.platform}
                        </div>
                        <div>
                          <span className="text-muted">Insert Size:</span>{" "}
                          {p.pipelineParams.fastq.insertSize}
                        </div>
                        <div>
                          <span className="text-muted">Phred Score:</span>{" "}
                          {p.pipelineParams.fastq.phredScore}
                        </div>
                      </div>
                    </div>
                  )}
                  {p.pipelineParams.bam?.reference && (
                    <div className="bg-surface border border-borderLine rounded-custom p-4">
                      <h3 className="text-lg font-medium text-white mb-2">
                        2. BAM/CRAM
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted">Reference:</span>{" "}
                          {p.pipelineParams.bam.reference}
                        </div>
                        <div>
                          <span className="text-muted">Aligner:</span>{" "}
                          {p.pipelineParams.bam.aligner}
                        </div>
                      </div>
                    </div>
                  )}
                  {p.pipelineParams.vcf?.variantCaller && (
                    <div className="bg-surface border border-borderLine rounded-custom p-4">
                      <h3 className="text-lg font-medium text-white mb-2">
                        3. VCF
                      </h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted">Caller:</span>{" "}
                          {p.pipelineParams.vcf.variantCaller}
                        </div>
                        <div>
                          <span className="text-muted">Min Var Freq:</span>{" "}
                          {p.pipelineParams.vcf.minVarFreq}
                        </div>
                        <div>
                          <span className="text-muted">Mutation Type:</span>{" "}
                          {p.pipelineParams.vcf.mutationType}
                        </div>
                      </div>
                    </div>
                  )}
                  {p.pipelineParams.annotation?.annotationDb && (
                    <div className="bg-surface border border-borderLine rounded-custom p-4">
                      <h3 className="text-lg font-medium text-white mb-2">
                        4. Аннотации
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted">База данных:</span>{" "}
                          {p.pipelineParams.annotation.annotationDb}
                        </div>
                        <div>
                          <span className="text-muted">Версия:</span>{" "}
                          {p.pipelineParams.annotation.dbVersion}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Участники проекта (просмотр) */}
              {accessData && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-white border-b border-gray-800 pb-2">
                    Участники проекта
                  </h2>
                  {accessData.accesses.length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {accessData.accesses.map((access: any) => (
                        <div
                          key={access.id}
                          className="bg-surface border border-borderLine rounded-custom p-4 flex flex-col"
                        >
                          <p className="text-white font-medium text-sm">
                            {access.user.fullName}
                          </p>
                          <p className="text-muted text-xs">
                            {access.user.email}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-accent-dim text-accent w-fit">
                            {access.permission === "admin"
                              ? "Администратор"
                              : access.permission === "write"
                                ? "Редактирование"
                                : "Просмотр"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted text-sm mt-4">
                      Нет добавленных участников
                    </p>
                  )}
                </div>
              )}

              {/* Файлы проекта */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-white border-b border-gray-800 pb-2">
                  Файлы проекта
                </h2>
                {Object.entries(filesByStage).map(([stage, stageFiles]) => (
                  <div
                    key={stage}
                    className="mt-4 bg-surface border border-borderLine rounded-custom p-4"
                  >
                    <h3 className="text-md font-medium text-accent mb-2">
                      {stage}
                    </h3>
                    <ul className="space-y-2">
                      {stageFiles.map((f: any) => (
                        <li
                          key={f.id}
                          className="flex justify-between items-center"
                        >
                          <span>
                            {f.fileName} (
                            {(Number(f.fileSize) / 1e6).toFixed(1)} МБ)
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handlePreview(f.id, f.fileName, f.mimeType)
                              }
                              className="text-accent text-sm border border-accent/30 px-2 py-0.5 rounded"
                            >
                              Просмотр
                            </button>
                            <button
                              onClick={() => handleDownload(f.id, f.fileName)}
                              className="text-accent text-sm border border-accent/30 px-2 py-0.5 rounded"
                            >
                              Скачать
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {files.length === 0 && (
                  <p className="text-muted italic mt-4">Файлы не загружены</p>
                )}
              </div>
            </>
          ) : (
            /* Режим редактирования */
            <div className="bg-surface border border-borderLine rounded-custom p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Редактирование проекта
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted text-sm">Название</label>
                  <input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-muted text-sm">Описание</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-muted text-sm">Статус</label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full"
                  >
                    <option value="active">Активен</option>
                    <option value="in_progress">В работе</option>
                    <option value="completed">Завершён</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted text-sm">Платформа</label>
                  <select
                    value={editForm.platform}
                    onChange={(e) =>
                      setEditForm({ ...editForm, platform: e.target.value })
                    }
                    className="w-full"
                  >
                    <option value="">Не выбрано</option>
                    <option value="Illumina">Illumina</option>
                    <option value="MinION">MinION</option>
                    <option value="PacBio">PacBio</option>
                    <option value="Oxford Nanopore">Oxford Nanopore</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted text-sm">Статус QC</label>
                  <select
                    value={editForm.qcStatus}
                    onChange={(e) =>
                      setEditForm({ ...editForm, qcStatus: e.target.value })
                    }
                    className="w-full"
                  >
                    <option value="pending">Ожидание</option>
                    <option value="passed">Пройден</option>
                    <option value="failed">Не пройден</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted text-sm">
                    Дата эксперимента
                  </label>
                  <input
                    type="date"
                    value={editForm.experimentDate}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        experimentDate: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-borderLine pt-4">
                <h3 className="text-md font-semibold text-white mb-3">
                  Технические параметры (pipeline)
                </h3>
                {/* FASTQ */}
                <div className="bg-black/20 p-3 rounded mb-3">
                  <h4 className="text-accent text-sm mb-2">1. FASTQ</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-muted">
                        Платформа
                      </label>
                      <input
                        type="text"
                        value={fastqMetadata.platform}
                        onChange={(e) =>
                          setFastqMetadata({
                            ...fastqMetadata,
                            platform: e.target.value,
                          })
                        }
                        className="w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted">
                        Insert Size
                      </label>
                      <input
                        type="number"
                        value={fastqMetadata.insertSize}
                        onChange={(e) =>
                          setFastqMetadata({
                            ...fastqMetadata,
                            insertSize: Number(e.target.value),
                          })
                        }
                        className="w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted">
                        Phred Score
                      </label>
                      <select
                        value={fastqMetadata.phredScore}
                        onChange={(e) =>
                          setFastqMetadata({
                            ...fastqMetadata,
                            phredScore: e.target.value,
                          })
                        }
                        className="w-full text-sm"
                      >
                        <option>Phred33</option>
                        <option>Phred64</option>
                      </select>
                    </div>
                  </div>
                </div>
                {/* BAM */}
                <div className="bg-black/20 p-3 rounded mb-3">
                  <h4 className="text-accent text-sm mb-2">2. BAM/CRAM</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-muted">
                        Reference ID
                      </label>
                      <input
                        type="text"
                        value={bamMetadata.reference}
                        onChange={(e) =>
                          setBamMetadata({
                            ...bamMetadata,
                            reference: e.target.value,
                          })
                        }
                        className="w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted">
                        Aligner
                      </label>
                      <input
                        type="text"
                        value={bamMetadata.aligner}
                        onChange={(e) =>
                          setBamMetadata({
                            ...bamMetadata,
                            aligner: e.target.value,
                          })
                        }
                        className="w-full text-sm"
                      />
                    </div>
                  </div>
                </div>
                {/* VCF */}
                <div className="bg-black/20 p-3 rounded mb-3">
                  <h4 className="text-accent text-sm mb-2">3. VCF</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-muted">
                        Variant Caller
                      </label>
                      <input
                        type="text"
                        value={vcfMetadata.variantCaller}
                        onChange={(e) =>
                          setVcfMetadata({
                            ...vcfMetadata,
                            variantCaller: e.target.value,
                          })
                        }
                        className="w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted">
                        Min Var Freq
                      </label>
                      <input
                        type="text"
                        value={vcfMetadata.minVarFreq}
                        onChange={(e) =>
                          setVcfMetadata({
                            ...vcfMetadata,
                            minVarFreq: e.target.value,
                          })
                        }
                        className="w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted">
                        Mutation Type
                      </label>
                      <select
                        value={vcfMetadata.mutationType}
                        onChange={(e) =>
                          setVcfMetadata({
                            ...vcfMetadata,
                            mutationType: e.target.value,
                          })
                        }
                        className="w-full text-sm"
                      >
                        <option>SNP + Indels</option>
                        <option>SNP only</option>
                        <option>Structural Variants</option>
                      </select>
                    </div>
                  </div>
                </div>
                {/* Аннотации */}
                <div className="bg-black/20 p-3 rounded mb-3">
                  <h4 className="text-accent text-sm mb-2">4. Аннотации</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-muted">
                        База данных
                      </label>
                      <select
                        value={annotationMetadata.annotationDb}
                        onChange={(e) =>
                          setAnnotationMetadata({
                            ...annotationMetadata,
                            annotationDb: e.target.value,
                          })
                        }
                        className="w-full text-sm"
                      >
                        <option>ResFinder</option>
                        <option>VFDB</option>
                        <option>CARD</option>
                        <option>NCBI RefSeq</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-muted">
                        Версия базы
                      </label>
                      <input
                        type="text"
                        value={annotationMetadata.dbVersion}
                        onChange={(e) =>
                          setAnnotationMetadata({
                            ...annotationMetadata,
                            dbVersion: e.target.value,
                          })
                        }
                        className="w-full text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-borderLine pt-4">
                <h3 className="text-md font-semibold text-white mb-3">
                  Добавить файлы
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <FileDropZone stage="fastq_r1" label="FASTQ R1" />
                  <FileDropZone stage="fastq_r2" label="FASTQ R2" />
                  <FileDropZone stage="bam" label="BAM/CRAM" />
                  <FileDropZone stage="vcf" label="VCF/gVCF" />
                  <FileDropZone
                    stage="annotation"
                    label="Аннотации (BED/GTF/GFF)"
                  />
                </div>
                {uploadingFiles && (
                  <p className="text-sm text-accent mt-2">Загрузка файлов...</p>
                )}
              </div>

              {/* Управление участниками (редактирование) */}
              <div className="mt-6 border-t border-borderLine pt-4">
                <AccessManager projectId={id!} />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-borderLine rounded"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-accent rounded"
                >
                  Сохранить изменения
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {previewFile && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-surface border border-borderLine rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-borderLine">
              <h3 className="text-white font-semibold">
                Просмотр: {previewFile.name}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-muted hover:text-white text-xl"
              >
                &times;
              </button>
            </div>
            <div className="overflow-auto p-4">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words font-mono">
                {previewFile.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
