import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, X, Check, Grid3x3 } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

interface ErrorOption {
  id: number;
  label: string;
  text: string;
  is_correct: boolean;
}

interface ErrorImage {
  image_url: string;
}

interface ErrorQuestion {
  id: number;
  question_id: number;
  difficulty: string | null;
  question_text: string;
  subject: string | null;
  table_markdown: string | null;
  images: ErrorImage[];
  topic: string | null;
  options: ErrorOption[];
  user_select_option: string | null;
  user_select_option_is_correct: boolean | null;
}

interface ParsedMarkdownTable {
  headers: string[];
  rows: string[][];
}

const QUIZ_SESSION_BASE_URL = 'http://127.0.0.1:8000/api/v1/student/sessions';

const getAccessToken = () => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

const getDifficultyBadgeClass = (difficulty: string | null) => {
  const normalized = (difficulty || '').toLowerCase();
  if (normalized === 'easy' || normalized === 'oson') {
    return 'bg-green-50 text-green-700';
  }
  if (normalized === 'hard' || normalized === 'qiyin') {
    return 'bg-red-50 text-red-700';
  }
  return 'bg-amber-50 text-amber-700';
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

export function ErrorAnalysisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [errorQuestions, setErrorQuestions] = useState<ErrorQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const state = location.state as { sessionId?: number } | null;
  const sessionId = useMemo(() => {
    const querySessionId = Number(searchParams.get('sessionId'));
    if (Number.isFinite(querySessionId) && querySessionId > 0) {
      return Math.floor(querySessionId);
    }

    if (state?.sessionId && Number.isFinite(state.sessionId) && state.sessionId > 0) {
      return Math.floor(state.sessionId);
    }

    return null;
  }, [searchParams, state?.sessionId]);

  const loadErrorAnalysis = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    if (!sessionId) {
      setErrorMessage('Session ID topilmadi. Natijalar sahifasidan qayta kiring.');
      setErrorQuestions([]);
      setIsLoading(false);
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setErrorMessage("Token topilmadi. Avval tizimga kirib ko'ring.");
      setErrorQuestions([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${QUIZ_SESSION_BASE_URL}/${sessionId}/single-player-error-analysis/`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Xatolar tahlilini yuklab bo\'lmadi.');
      }

      const payload = (await response.json()) as ErrorQuestion[];
      setErrorQuestions(Array.isArray(payload) ? payload : []);
      setCurrentQuestion(0);
    } catch {
      setErrorMessage("Xatolar tahlilini yuklab bo'lmadi. Qayta urinib ko'ring.");
      setErrorQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadErrorAnalysis();
  }, [loadErrorAnalysis]);

  const totalErrors = errorQuestions.length;
  const currentError = errorQuestions[currentQuestion];
  const parsedQuestionTable = useMemo(() => {
    if (!currentError?.table_markdown) {
      return null;
    }

    return parseMarkdownTable(currentError.table_markdown);
  }, [currentError?.table_markdown]);

  const userSelectedOption = currentError?.options.find((option) => option.label === currentError.user_select_option) ?? null;
  const correctOption = currentError?.options.find((option) => option.is_correct) ?? null;
  const isUserAnswerCorrect =
    currentError?.user_select_option_is_correct ?? Boolean(userSelectedOption && userSelectedOption.is_correct);

  const userAnswerTone = userSelectedOption
    ? isUserAnswerCorrect
      ? {
          container: 'bg-green-50 border-green-200',
          icon: 'bg-green-500',
          label: 'text-green-700',
          text: 'text-green-900',
          Icon: Check,
        }
      : {
          container: 'bg-red-50 border-red-200',
          icon: 'bg-red-500',
          label: 'text-red-700',
          text: 'text-red-900',
          Icon: X,
        }
    : {
        container: 'bg-gray-50 border-gray-200',
        icon: 'bg-gray-400',
        label: 'text-gray-700',
        text: 'text-gray-900',
        Icon: X,
      };

  const handleNext = () => {
    if (currentQuestion < errorQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Xatolar tahlili yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-sm border border-red-200">
          <p className="text-sm text-red-700 mb-4">{errorMessage}</p>
          <div className="flex gap-3">
            <button
              onClick={() => void loadErrorAnalysis()}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
            >
              Qayta yuklash
            </button>
            <button
              onClick={() => navigate('/test-results')}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium"
            >
              Natijalar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Xatolar topilmadi</h2>
          <p className="text-sm text-gray-600 mb-4">Ushbu sessiya uchun xato ishlangan savollar mavjud emas.</p>
          <button
            onClick={() => navigate('/test-results')}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
          >
            Natijalarga qaytish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Xatolar tahlili</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-indigo-600 font-medium">Tahlil progressi</span>
            <span className="text-sm text-gray-500">{currentQuestion + 1} / {totalErrors}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / totalErrors) * 100}%` }}
              className="h-full bg-indigo-600 rounded-full"
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <motion.div
          key={currentError.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
              {currentError.subject || "Fan ko'rsatilmagan"}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold">
              {currentError.topic || "Mavzu ko'rsatilmagan"}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getDifficultyBadgeClass(currentError.difficulty)}`}>
              {currentError.difficulty || "Qiyinchilik ko'rsatilmagan"}
            </span>
          </div>

          <MathContent content={currentError.question_text} className="text-gray-900 text-lg leading-relaxed mb-4" />

          {currentError.images.length > 0 && (
            <div className="grid grid-cols-1 gap-3 mb-4">
              {currentError.images.map((image, index) => (
                <div key={`${image.image_url}-${index}`} className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={image.image_url}
                    alt={`Savol rasmi ${index + 1}`}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {currentError.table_markdown && (
            <div className="bg-gray-50 rounded-xl p-4 mb-2 overflow-x-auto border border-gray-200">
              {parsedQuestionTable ? (
                <table className="min-w-full border-collapse text-left text-sm text-gray-700">
                  <thead>
                    <tr>
                      {parsedQuestionTable.headers.map((header, index) => (
                        <th
                          key={`${header}-${index}`}
                          className="border border-gray-300 bg-gray-100 px-3 py-2 font-semibold text-gray-800 align-top"
                        >
                          <MathContent content={header} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedQuestionTable.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {parsedQuestionTable.headers.map((_, cellIndex) => (
                          <td key={`${rowIndex}-${cellIndex}`} className="border border-gray-300 px-3 py-2 align-top">
                            <MathContent content={row[cellIndex] ?? ''} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <MathContent content={currentError.table_markdown} className="text-sm text-gray-700 whitespace-pre-wrap" />
              )}
            </div>
          )}
        </motion.div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Javoblar qiyoslovi</h3>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`border-2 rounded-2xl p-4 ${userAnswerTone.container}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${userAnswerTone.icon}`}>
                <userAnswerTone.Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className={`font-medium text-sm mb-1 ${userAnswerTone.label}`}>Sizning javobingiz</p>
                <p className={`text-lg font-semibold ${userAnswerTone.text}`}>
                  {userSelectedOption ? `${userSelectedOption.label}) ${userSelectedOption.text}` : 'Javob berilmagan'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-green-50 border-2 border-green-200 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-green-700 font-medium text-sm mb-1">To'g'ri javob</p>
                <p className="text-green-900 text-lg font-semibold">
                  {correctOption ? `${correctOption.label}) ${correctOption.text}` : "To'g'ri javob topilmadi"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Grid3x3 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">Savollar xaritasi</h3>
            </div>
            <span className="text-xs text-gray-500">{totalErrors} ta savol</span>
          </div>

          <div className="max-h-36 overflow-y-auto pr-1">
            <div className="grid grid-cols-7 gap-2">
              {errorQuestions.map((questionItem, index) => {
                const mapSelectedOption = questionItem.options.find((option) => option.label === questionItem.user_select_option);
                const mapIsCorrect =
                  questionItem.user_select_option_is_correct ?? Boolean(mapSelectedOption && mapSelectedOption.is_correct);
                const isUnanswered = !questionItem.user_select_option;

                const toneClass = isUnanswered
                  ? 'bg-gray-100 text-gray-600 border-gray-200'
                  : mapIsCorrect
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-red-100 text-red-700 border-red-300';

                return (
                  <button
                    key={questionItem.id}
                    onClick={() => setCurrentQuestion(index)}
                    className={`h-9 rounded-lg border text-xs font-semibold transition-all ${toneClass} ${
                      currentQuestion === index ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-600 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span>To'g'ri</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Xato</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span>Javobsiz</span>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: currentQuestion > 0 ? 1.02 : 1 }}
            whileTap={{ scale: currentQuestion > 0 ? 0.98 : 1 }}
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`
              flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
              ${currentQuestion === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'}
            `}
          >
            <ArrowLeft className="w-5 h-5" />
            Oldingi
          </motion.button>

          <motion.button
            whileHover={{ scale: currentQuestion < totalErrors - 1 ? 1.02 : 1 }}
            whileTap={{ scale: currentQuestion < totalErrors - 1 ? 0.98 : 1 }}
            onClick={handleNext}
            disabled={currentQuestion === totalErrors - 1}
            className={`
              flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
              ${currentQuestion === totalErrors - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'}
            `}
          >
            Keyingi
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
