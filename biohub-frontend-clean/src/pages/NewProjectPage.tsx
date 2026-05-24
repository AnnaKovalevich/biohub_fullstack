import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { trpc } from "../lib/trpc";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";

export const NewProjectPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState("alignment");
  const [description, setDescription] = useState("");
  const [sampleId, setSampleId] = useState("");
  const [status, setStatus] = useState("in_progress");

  const [fastqMetadata, setFastqMetadata] = useState({
    platform: "Illumina MiSeq",
    insertSize: 450,
    phredScore: "Phred33",
  });
  const [bamMetadata, setBamMetadata] = useState({
    reference: "NC_000913.3",
    aligner: "BWA-MEM v0.7.17",
  });
  const [vcfMetadata, setVcfMetadata] = useState({
    variantCaller: "GATK v4.2",
    minVarFreq: 0.5,
    mutationType: "SNP + Indels",
  });
  const [annotationMetadata, setAnnotationMetadata] = useState({
    annotationDb: "ResFinder",
    dbVersion: "2024-01-15",
  });

  const [openStages, setOpenStages] = useState({
    fastq: false,
    bam: false,
    vcf: false,
    ann: false,
  });

  const [files, setFiles] = useState({
    fastq_r1: [] as File[],
    fastq_r2: [] as File[],
    bam: [] as File[],
    vcf: [] as File[],
    annotation: [] as File[],
  });

  const [uploading, setUploading] = useState(false);
  const createProject = trpc.project.create.useMutation();
  const getUploadUrl = trpc.file.getUploadUrl.useMutation();

  const toggleStage = (stage: keyof typeof openStages) => {
    setOpenStages((prev) => ({ ...prev, [stage]: !prev[stage] }));
  };

  const onDrop = useCallback((acceptedFiles: File[], stage: string) => {
    setFiles((prev) => ({
      ...prev,
      [stage]: [...prev[stage], ...acceptedFiles],
    }));
  }, []);

  const allFiles = Object.values(files).flat();
  const totalSizeGB = (
    allFiles.reduce((sum, f) => sum + f.size, 0) / 1e9
  ).toFixed(2);

  const uploadFileToServer = async (
    file: File,
    stage: string,
    projectId: string,
  ) => {
    const { uploadUrl } = await getUploadUrl.mutateAsync({
      projectId,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert("Укажите название анализа");
      return;
    }
    setUploading(true);
    try {
      const pipelineParams = {
        fastq: fastqMetadata,
        bam: bamMetadata,
        vcf: vcfMetadata,
        annotation: annotationMetadata,
      };
      const project = await createProject.mutateAsync({
        name,
        type,
        description,
        sampleId,
        pipelineParams,
        computeEnv: {
          cluster: "aws-batch",
          cpu: 16,
          memory: 64,
          priority: "Средний",
        },
        advanced: {},
        status,
      });
      for (const [stage, fileList] of Object.entries(files)) {
        for (const file of fileList) {
          await uploadFileToServer(file, stage, project.id);
        }
      }
      alert("Проект создан и файлы загружены");
      navigate(`/projects/${project.id}`);
    } catch (err: any) {
      console.error(err);
      alert(
        "Ошибка при создании проекта: " + (err.message || JSON.stringify(err)),
      );
    } finally {
      setUploading(false);
    }
  };

  const FileDropZone = ({
    stage,
    label,
  }: {
    stage: keyof typeof files;
    label: string;
  }) => {
    const { getRootProps, getInputProps } = useDropzone({
      onDrop: (accepted) => onDrop(accepted, stage),
    });
    const fileList = files[stage];
    return (
      <div
        {...getRootProps()}
        className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-custom p-4 text-center cursor-pointer
                   hover:border-accent dark:hover:border-accent bg-white dark:bg-gray-800/30 transition-colors"
      >
        <input {...getInputProps()} />
        <i className="fas fa-upload text-2xl text-gray-400 dark:text-gray-500 mb-2"></i>
        <p className="text-sm text-muted">{label}</p>
        {fileList.length > 0 && (
          <div className="text-xs text-gray-500 mt-2">
            {fileList.map((f) => (
              <div key={f.name}>
                {f.name} ({(f.size / 1e6).toFixed(1)} МБ)
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-base">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-6 bg-base">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Создание нового исследования
                </h1>
                <p className="text-muted text-sm mt-1">
                  Интеллектуальная загрузка и структурирование метаданных
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Метаданные проекта */}
              <div className="bg-surface border border-borderLine rounded-custom p-5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase font-bold text-muted mb-1">
                      Название анализа
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-muted mb-1">
                      Тип эксперимента
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full"
                    >
                      <option value="alignment">WGS (Whole Genome)</option>
                      <option value="variant">Targeted Panels</option>
                      <option value="rna">RNA-Seq</option>
                      <option value="cnv">Metagenomics</option>
                      <option value="multiomics">Multi‑omics</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold text-muted mb-1">
                      Статус
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full text-amber-500"
                    >
                      <option value="in_progress">В процессе</option>
                      <option value="active">Завершено</option>
                      <option value="completed">Архив</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-borderLine">
                  <label className="block text-xs uppercase font-bold text-muted mb-1">
                    <i className="fas fa-file-alt mr-1"></i> Описание проекта и
                    научный контекст
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Укажите цель исследования, особенности пробоподготовки, использованные пайплайны..."
                    className="w-full h-32 text-sm"
                  ></textarea>
                  <p className="text-xs text-muted italic mt-1">
                    * Рекомендуется придерживаться стандартов MIAME/MINSEQE
                  </p>
                </div>
              </div>

              {/* Стадии загрузки */}
              <div className="bg-surface border border-borderLine rounded-custom p-5">
                <h3 className="text-sm font-bold text-muted mb-4">
                  Файлы и технические паспорта
                </h3>

                {/* FASTQ */}
                <div className="border border-borderLine rounded mb-3">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    onClick={() => toggleStage("fastq")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center rounded">
                        <i className="fas fa-dna"></i>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          1. Сырые чтения (FASTQ)
                        </p>
                        <p className="text-xs text-muted">
                          Platform, Phred, Insert Size, Paired-end files
                        </p>
                      </div>
                    </div>
                    <i
                      className={`fas fa-chevron-${openStages.fastq ? "up" : "down"} text-muted`}
                    ></i>
                  </div>
                  {openStages.fastq && (
                    <div className="p-4 border-t border-borderLine bg-gray-50/50 dark:bg-black/20">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                          <label className="block text-xs uppercase font-bold text-muted mb-1">
                            Платформа
                          </label>
                          <select
                            value={fastqMetadata.platform}
                            onChange={(e) =>
                              setFastqMetadata((prev) => ({
                                ...prev,
                                platform: e.target.value,
                              }))
                            }
                            className="w-full"
                          >
                            <option>Illumina MiSeq</option>
                            <option>Oxford Nanopore</option>
                            <option>PacBio</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs uppercase font-bold text-muted mb-1">
                            Insert Size
                          </label>
                          <input
                            type="number"
                            value={fastqMetadata.insertSize}
                            onChange={(e) =>
                              setFastqMetadata((prev) => ({
                                ...prev,
                                insertSize: Number(e.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase font-bold text-muted mb-1">
                            Phred Score
                          </label>
                          <select
                            value={fastqMetadata.phredScore}
                            onChange={(e) =>
                              setFastqMetadata((prev) => ({
                                ...prev,
                                phredScore: e.target.value,
                              }))
                            }
                            className="w-full"
                          >
                            <option>Phred33</option>
                            <option>Phred64</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FileDropZone
                          stage="fastq_r1"
                          label="Read 1 (Forward)"
                        />
                        <FileDropZone
                          stage="fastq_r2"
                          label="Read 2 (Reverse)"
                        />
                      </div>
                      <p className="text-xs text-muted mt-3 italic text-center">
                        * Для Single-end экспериментов оставьте Read 2 пустым.
                      </p>
                    </div>
                  )}
                </div>

                {/* BAM */}
                <div className="border border-borderLine rounded mb-3">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    onClick={() => toggleStage("bam")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center rounded">
                        <i className="fas fa-align-left"></i>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          2. Выравнивание (BAM/CRAM)
                        </p>
                        <p className="text-xs text-muted">
                          Reference Genome, Tool version
                        </p>
                      </div>
                    </div>
                    <i
                      className={`fas fa-chevron-${openStages.bam ? "up" : "down"} text-muted`}
                    ></i>
                  </div>
                  {openStages.bam && (
                    <div className="p-4 border-t border-borderLine bg-gray-50/50 dark:bg-black/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Reference ID (напр. NC_000913.3)"
                          value={bamMetadata.reference}
                          onChange={(e) =>
                            setBamMetadata((prev) => ({
                              ...prev,
                              reference: e.target.value,
                            }))
                          }
                          className="w-full"
                        />
                        <input
                          type="text"
                          placeholder="Aligner (напр. BWA-MEM v0.7.17)"
                          value={bamMetadata.aligner}
                          onChange={(e) =>
                            setBamMetadata((prev) => ({
                              ...prev,
                              aligner: e.target.value,
                            }))
                          }
                          className="w-full"
                        />
                      </div>
                      <FileDropZone stage="bam" label="Загрузить BAM/CRAM" />
                    </div>
                  )}
                </div>

                {/* VCF */}
                <div className="border border-borderLine rounded mb-3">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    onClick={() => toggleStage("vcf")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center rounded">
                        <i className="fas fa-vial"></i>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          3. Варианты (VCF/gVCF)
                        </p>
                        <p className="text-xs text-muted">
                          Caller, Filters, Mutation Types
                        </p>
                      </div>
                    </div>
                    <i
                      className={`fas fa-chevron-${openStages.vcf ? "up" : "down"} text-muted`}
                    ></i>
                  </div>
                  {openStages.vcf && (
                    <div className="p-4 border-t border-borderLine bg-gray-50/50 dark:bg-black/20">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-xs uppercase font-bold text-muted mb-1">
                            Variant Caller
                          </label>
                          <input
                            type="text"
                            placeholder="Напр: GATK v4.2"
                            value={vcfMetadata.variantCaller}
                            onChange={(e) =>
                              setVcfMetadata((prev) => ({
                                ...prev,
                                variantCaller: e.target.value,
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase font-bold text-muted mb-1">
                            Min Var Freq
                          </label>
                          <input
                            type="text"
                            placeholder="0.5"
                            value={vcfMetadata.minVarFreq}
                            onChange={(e) =>
                              setVcfMetadata((prev) => ({
                                ...prev,
                                minVarFreq: e.target.value,
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase font-bold text-muted mb-1">
                            Тип мутаций
                          </label>
                          <select
                            value={vcfMetadata.mutationType}
                            onChange={(e) =>
                              setVcfMetadata((prev) => ({
                                ...prev,
                                mutationType: e.target.value,
                              }))
                            }
                            className="w-full"
                          >
                            <option>SNP + Indels</option>
                            <option>SNP only</option>
                            <option>Structural Variants</option>
                          </select>
                        </div>
                      </div>
                      <FileDropZone stage="vcf" label="Загрузить VCF" />
                    </div>
                  )}
                </div>

                {/* Аннотации */}
                <div className="border border-borderLine rounded mb-3">
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    onClick={() => toggleStage("ann")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center rounded">
                        <i className="fas fa-tags"></i>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          4. Аннотации (BED/GTF/GFF)
                        </p>
                        <p className="text-xs text-muted">
                          DB Version, Tool, Predicted Impact
                        </p>
                      </div>
                    </div>
                    <i
                      className={`fas fa-chevron-${openStages.ann ? "up" : "down"} text-muted`}
                    ></i>
                  </div>
                  {openStages.ann && (
                    <div className="p-4 border-t border-borderLine bg-gray-50/50 dark:bg-black/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs uppercase font-bold text-muted mb-1">
                            База данных
                          </label>
                          <select
                            value={annotationMetadata.annotationDb}
                            onChange={(e) =>
                              setAnnotationMetadata((prev) => ({
                                ...prev,
                                annotationDb: e.target.value,
                              }))
                            }
                            className="w-full"
                          >
                            <option>ResFinder (Резистентность)</option>
                            <option>VFDB (Вирулентность)</option>
                            <option>CARD</option>
                            <option>NCBI RefSeq</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs uppercase font-bold text-muted mb-1">
                            Версия базы
                          </label>
                          <input
                            type="text"
                            placeholder="2024-01-15"
                            value={annotationMetadata.dbVersion}
                            onChange={(e) =>
                              setAnnotationMetadata((prev) => ({
                                ...prev,
                                dbVersion: e.target.value,
                              }))
                            }
                            className="w-full"
                          />
                        </div>
                      </div>
                      <FileDropZone
                        stage="annotation"
                        label="Загрузить аннотации"
                      />
                    </div>
                  )}
                </div>

                {/* Итого */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-black/20 rounded border border-borderLine">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Всего файлов:</span>
                    <span className="text-white font-semibold">
                      {allFiles.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted">Общий размер:</span>
                    <span className="text-white font-semibold">
                      {totalSizeGB} ГБ
                    </span>
                  </div>
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex justify-between items-center bg-surface border border-borderLine p-5 rounded-custom">
                <div className="text-xs text-muted font-mono">
                  Total size: {totalSizeGB} GB
                </div>
                <div className="space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="text-sm text-muted px-4 py-2 hover:text-white transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="bg-accent text-white px-8 py-2 rounded text-sm font-bold shadow disabled:opacity-50"
                  >
                    {uploading ? "Загрузка..." : "Сохранить исследование"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
