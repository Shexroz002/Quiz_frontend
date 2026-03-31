import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Circle,
  Image as ImageIcon,
  Upload,
  Trash2,
  Pencil,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface QuestionDetailImage {
  id: number;
  image_url: string;
}

interface QuestionOption {
  id: number;
  text: string;
  is_correct: boolean;
  label: string;
}

interface QuestionDetailData {
  id: number;
  subject: string | null;
  question_text: string;
  table_markdown: string | null;
  difficulty: string | null;
  topic: string | null;
  images: QuestionDetailImage[];
  options: QuestionOption[];
}

interface UploadImageResponse {
  id: number;
  image_url: string;
}

interface ParsedMarkdownTable {
  headers: string[];
  rows: string[][];
}

const QUESTION_DETAIL_BASE_URL = 'http://127.0.0.1:8000/api/v1/question/detail';
const QUESTION_UPLOAD_IMAGE_BASE_URL = 'http://127.0.0.1:8000/api/v1/question/upload-image';
const QUESTION_DELETE_IMAGE_BASE_URL = 'http://127.0.0.1:8000/api/v1/question/delete-image';
const QUESTION_UPDATE_CORRECT_OPTION_BASE_URL = 'http://127.0.0.1:8000/api/v1/question/update-correct-option';
const API_BASE_URL = 'http://127.0.0.1:8000';

declare global {
  interface Window {
    MathJax?: {
      startup?: {
        promise?: Promise<unknown>;
      };
      typesetPromise?: (elements?: Element[]) => Promise<unknown>;
    };
  }
}

const getAccessToken = () => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

const parseQuestionId = (value: unknown): number | null => {
  const parsed = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
};

const normalizeImageUrl = (value: string) => {
  if (!value) {
    return value;
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

const parseMarkdownTable = (markdown: string): ParsedMarkdownTable | null => {
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'));

  if (lines.length < 2) {
    return null;
  }

  const parseRow = (line: string) =>
    line
      .slice(1, -1)
      .split('|')
      .map((cell) => cell.trim());

  const headers = parseRow(lines[0]);
  const separator = parseRow(lines[1]);
  const isSeparatorValid = separator.every((cell) => /^:?-{3,}:?$/.test(cell));

  if (!headers.length || !isSeparatorValid) {
    return null;
  }

  const rows = lines.slice(2).map(parseRow).filter((row) => row.length > 0);
  return { headers, rows };
};

let mathJaxLoader: Promise<void> | null = null;

const loadMathJax = async () => {
  if (window.MathJax?.typesetPromise) {
    return;
  }

  if (!mathJaxLoader) {
    mathJaxLoader = new Promise<void>((resolve, reject) => {
      const existingScript = document.getElementById('mathjax-script') as HTMLScriptElement | null;

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('MathJax load failed')), { once: true });
        return;
      }

      window.MathJax = {
        tex: {
          inlineMath: [['$', '$'], ['\\(', '\\)']],
          displayMath: [['$$', '$$'], ['\\[', '\\]']],
        },
        startup: {
          typeset: false,
        },
      } as Window['MathJax'];

      const script = document.createElement('script');
      script.id = 'mathjax-script';
      script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('MathJax load failed'));
      document.head.appendChild(script);
    });
  }

  await mathJaxLoader;

  if (window.MathJax?.startup?.promise) {
    await window.MathJax.startup.promise;
  }
};

function MathContent({ content, className }: { content: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const renderMath = async () => {
      if (!containerRef.current) {
        return;
      }

      try {
        await loadMathJax();
        await window.MathJax?.typesetPromise?.([containerRef.current]);
      } catch {
      }
    };

    void renderMath();
  }, [content]);

  return (
    <div ref={containerRef} className={className}>
      {content}
    </div>
  );
}

export function QuestionDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [questionDetail, setQuestionDetail] = useState<QuestionDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [updatingOptionId, setUpdatingOptionId] = useState<number | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  const questionId = useMemo(() => {
    const queryId = parseQuestionId(searchParams.get('id'));

    if (queryId) {
      return queryId;
    }

    const state = location.state as { questionId?: unknown } | null;
    return parseQuestionId(state?.questionId);
  }, [location.state, searchParams]);

  const parsedQuestionTable = useMemo(() => {
    if (!questionDetail?.table_markdown) {
      return null;
    }

    return parseMarkdownTable(questionDetail.table_markdown);
  }, [questionDetail?.table_markdown]);

  const loadQuestionDetail = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    if (!questionId) {
      setErrorMessage("Savol ID topilmadi. Savollar ro'yxatidan qayta kiring.");
      setQuestionDetail(null);
      setIsLoading(false);
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      setErrorMessage("Token topilmadi. Avval tizimga kirib ko'ring.");
      setQuestionDetail(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${QUESTION_DETAIL_BASE_URL}/${questionId}`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Savol tafsilotlari yuklab bo\'lmadi.');
      }

      const data = (await response.json()) as QuestionDetailData;
      setQuestionDetail({
        ...data,
        images: data.images.map((image) => ({
          ...image,
          image_url: normalizeImageUrl(image.image_url),
        })),
      });
    } catch {
      setErrorMessage("Savol tafsilotlarini yuklab bo'lmadi. Qaytadan urinib ko'ring.");
      setQuestionDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    void loadQuestionDetail();
  }, [loadQuestionDetail]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'oson':
        return 'from-green-400 to-emerald-400';
      case "o'rtacha":
      case "o‘rta":
      case "o'rta":
        return 'from-amber-400 to-orange-400';
      case 'qiyin':
        return 'from-red-400 to-rose-400';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const difficultyKey = useMemo(() => {
    const value = questionDetail?.difficulty?.toLowerCase() ?? '';

    if (value.includes('oson')) {
      return 'easy';
    }

    if (value.includes('qiyin')) {
      return 'hard';
    }

    if (value.includes("o'rta") || value.includes("o‘rta") || value.includes("o'rtacha")) {
      return 'medium';
    }

    return 'unknown';
  }, [questionDetail?.difficulty]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleImageUpload = async () => {
    if (!questionId || !selectedFile) {
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      toast.error("Token topilmadi. Avval tizimga kirib ko'ring.");
      return;
    }

    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch(`${QUESTION_UPLOAD_IMAGE_BASE_URL}/${questionId}`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Rasm yuklab bo\'lmadi.');
      }

      const data = (await response.json()) as UploadImageResponse;

      setQuestionDetail((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          images: [
            ...current.images,
            {
              id: data.id,
              image_url: normalizeImageUrl(data.image_url),
            },
          ],
        };
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Rasm muvaffaqiyatli yuklandi.');
    } catch {
      toast.error("Rasmni yuklab bo'lmadi. Qaytadan urinib ko'ring.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!questionId) {
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      toast.error("Token topilmadi. Avval tizimga kirib ko'ring.");
      return;
    }

    setDeletingImageId(imageId);

    try {
      const response = await fetch(`${QUESTION_DELETE_IMAGE_BASE_URL}/${questionId}/${imageId}`, {
        method: 'DELETE',
        headers: {
          accept: '*/*',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Rasmni o\'chirishda xatolik.');
      }

      setQuestionDetail((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          images: current.images.filter((image) => image.id !== imageId),
        };
      });

      toast.success("Rasm o'chirildi.");
    } catch {
      toast.error("Rasmni o'chirib bo'lmadi. Qaytadan urinib ko'ring.");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleUpdateCorrectOption = async (optionId: number) => {
    if (!questionId || !questionDetail) {
      return;
    }

    const currentCorrectOption = questionDetail.options.find((option) => option.is_correct);

    if (currentCorrectOption?.id === optionId) {
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      toast.error("Token topilmadi. Avval tizimga kirib ko'ring.");
      return;
    }

    setUpdatingOptionId(optionId);

    try {
      const response = await fetch(`${QUESTION_UPDATE_CORRECT_OPTION_BASE_URL}/${questionId}/${optionId}`, {
        method: 'PUT',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("To'g'ri javobni yangilab bo'lmadi.");
      }

      setQuestionDetail((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          options: current.options.map((option) => ({
            ...option,
            is_correct: option.id === optionId,
          })),
        };
      });

      toast.success("To'g'ri javob yangilandi.");
    } catch {
      toast.error("To'g'ri javobni yangilab bo'lmadi. Qaytadan urinib ko'ring.");
    } finally {
      setUpdatingOptionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-violet-100">
      <div className="sticky top-0 z-10 border-b border-white/20 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 shadow-lg shadow-indigo-500/20">
        <div className="px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
                {questionDetail?.subject || 'Savol'}
              </p>
              <h1 className="text-lg font-bold text-white">Savolni ko'rish</h1>
            </div>
            {questionDetail && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditMode((current) => !current)}
                className={isEditMode
                  ? 'flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 shadow-md sm:w-auto'
                  : 'flex w-full items-center justify-center gap-2 rounded-2xl border border-white/35 bg-white/20 px-4 py-3 text-sm font-semibold text-white shadow-md backdrop-blur-sm sm:w-auto'}
              >
                {isEditMode && <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />}
                <Pencil className="w-4 h-4" />
                Taxrirlash
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-5 pb-8">
        {isLoading && (
          <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-lg shadow-indigo-100/60">
            <p className="text-sm text-gray-500">Savol tafsilotlari yuklanmoqda...</p>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm">{errorMessage}</span>
            <button
              onClick={() => void loadQuestionDetail()}
              className="text-sm font-semibold text-red-700 hover:text-red-800"
            >
              Qayta yuklash
            </button>
          </div>
        )}

        {questionDetail && (
          <>
            {isEditMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-violet-200 bg-white/90 p-4 shadow-lg shadow-violet-100/60"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md">
                    <Pencil className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Taxrirlash rejimi yoqildi</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Endi rasm yuklash, rasmni o&apos;chirish va to&apos;g&apos;ri javobni almashtirish mumkin.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-lg shadow-indigo-100/60"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-md">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Savol matni</p>
                  <p className="text-sm font-bold text-indigo-600">Asosiy savol</p>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
                <MathContent
                  content={questionDetail.question_text}
                  className="whitespace-pre-line text-[16px] leading-8 text-slate-800"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-lg shadow-indigo-100/60"
            >
              <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Mavzu
              </label>
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-4">
                <p className="text-sm font-semibold leading-6 text-slate-800">
                  {questionDetail.subject || 'Fan ko‘rsatilmagan'} - {questionDetail.topic || 'Mavzu ko‘rsatilmagan'}
                </p>
              </div>
            </motion.div>

            {questionDetail.difficulty && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-lg shadow-indigo-100/60"
              >
                <label className="mb-4 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Qiyinchilik darajasi
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Oson', key: 'easy' },
                    { label: "O'rta", key: 'medium' },
                    { label: 'Qiyin', key: 'hard' },
                  ].map((level) => (
                    <div
                      key={level.key}
                      className={`flex-1 rounded-xl py-3 text-center font-bold text-sm transition-all ${difficultyKey === level.key
                          ? `bg-gradient-to-r ${getDifficultyColor(level.label)} text-white shadow-md shadow-orange-100/70`
                          : 'border border-slate-100 bg-slate-50 text-slate-400'
                        }`}
                    >
                      {level.label}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {questionDetail.table_markdown && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-lg shadow-indigo-100/60"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Jadval
                  </h2>
                </div>

                {parsedQuestionTable ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-[#1E293B] border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          {parsedQuestionTable.headers.map((header, index) => (
                            <th
                              key={`${header}-${index}`}
                              className="border-b border-gray-200 px-3 py-2 text-left font-semibold"
                            >
                              <MathContent content={header} />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedQuestionTable.rows.map((row, rowIndex) => (
                          <tr key={`row-${rowIndex}`} className="odd:bg-white even:bg-gray-50/40">
                            {parsedQuestionTable.headers.map((_, cellIndex) => (
                              <td
                                key={`cell-${rowIndex}-${cellIndex}`}
                                className="border-t border-gray-200 px-3 py-2 align-top"
                              >
                                <MathContent content={row[cellIndex] ?? ''} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <MathContent
                    content={questionDetail.table_markdown}
                    className="text-sm text-[#1E293B] whitespace-pre-wrap font-sans leading-relaxed"
                  />
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-lg shadow-indigo-100/60"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500"></div>
                  <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Rasmlar
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {questionDetail.images.length} ta
                </span>
              </div>

              {questionDetail.images.length > 0 ? (
                <div className="grid gap-4">
                  {questionDetail.images.map((image, index) => (
                    <div key={image.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 shadow-sm">
                      <div className="border-b border-slate-200 bg-white px-4 py-3">
                        <p className="text-sm font-semibold text-slate-700">Rasm {index + 1}</p>
                      </div>
                      <img
                        src={image.image_url}
                        alt={`Savol rasmi ${index + 1}`}
                        className="aspect-[4/3] w-full object-cover"
                      />
                      {isEditMode && (
                        <div className="flex justify-end border-t border-slate-200 bg-white px-4 py-3">
                          <button
                            onClick={() => void handleDeleteImage(image.id)}
                            disabled={deletingImageId === image.id}
                            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-60"
                          >
                            {deletingImageId === image.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            O'chirish
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <ImageIcon className="h-7 w-7 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Hozircha rasm mavjud emas.</p>
                  <p className="mt-1 text-xs text-slate-400">Agar kerak bo&apos;lsa, taxrirlash rejimida yangi rasm qo&apos;shing.</p>
                </div>
              )}

              {isEditMode && (
                <div className="mt-4 rounded-[24px] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 shadow-inner">
                  <label className="flex cursor-pointer flex-col items-start gap-3 rounded-[20px] border border-violet-200 bg-white px-4 py-4 sm:flex-row sm:items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900">Rasm yuklash</p>
                      <p className="text-sm text-slate-500">
                        {selectedFile ? selectedFile.name : 'PNG yoki JPG fayl tanlang'}
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => void handleImageUpload()}
                    disabled={!selectedFile || isUploadingImage}
                    className="mt-4 min-h-12 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-white shadow-md shadow-violet-200/70 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploadingImage ? 'Rasm yuklanmoqda...' : 'Rasmni yuklash'}
                  </button>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-lg shadow-indigo-100/60"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Javob variantlari
                </h2>
              </div>

              <div className="space-y-4">
                {questionDetail.options.map((option) => (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={option.is_correct
                      ? 'rounded-[24px] border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-sm'
                      : 'rounded-[24px] border border-slate-200 bg-slate-50 p-4 shadow-sm'}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex shrink-0 items-center justify-center">
                        {option.is_correct ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className={option.is_correct ? 'text-xs font-bold uppercase tracking-wide text-green-700' : 'text-xs font-bold uppercase tracking-wide text-slate-500'}>
                              Variant {option.label}
                            </p>
                            {option.is_correct && (
                              <p className="mt-1 text-xs font-semibold text-green-600">(To&apos;g&apos;ri javob)</p>
                            )}
                          </div>

                          {isEditMode && (
                            <button
                              onClick={() => void handleUpdateCorrectOption(option.id)}
                              disabled={option.is_correct || updatingOptionId === option.id}
                              className={option.is_correct
                                ? 'self-start rounded-2xl bg-green-100 px-4 py-2.5 text-xs font-semibold text-green-700'
                                : 'self-start rounded-2xl bg-indigo-100 px-4 py-2.5 text-xs font-semibold text-indigo-700 disabled:opacity-60'}
                            >
                              {updatingOptionId === option.id ? 'Yangilanmoqda...' : option.is_correct ? 'Tanlangan' : "To'g'ri javob qilish"}
                            </button>
                          )}
                        </div>

                        <MathContent
                          content={option.text}
                          className={option.is_correct ? 'mt-3 whitespace-pre-wrap text-base font-semibold leading-7 text-slate-900' : 'mt-3 whitespace-pre-wrap text-base font-medium leading-7 text-slate-700'}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </>
        )}
      </div>
    </div>
  );
}
