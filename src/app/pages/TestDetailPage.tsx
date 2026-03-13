import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  FileText,
  X,
  CheckCircle2,
  Circle,
  Image as ImageIcon
} from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';

interface Question {
  id: number;
  question_text: string;
  topic: string | null;
}

interface TestData {
  id: number;
  title: string;
  description: string | null;
  subject: string | null;
  questions: Question[];
}

interface QuestionDetailImage {
  image_url: string;
}

interface QuestionOption {
  label: string;
  text: string;
  is_correct: boolean;
}

interface QuestionDetailData {
  subject: string | null;
  table_markdown: string | null;
  difficulty: string | null;
  topic: string | null;
  images: QuestionDetailImage[];
  options: QuestionOption[];
}

const QUIZ_DETAIL_BASE_URL = 'http://127.0.0.1:8000/api/v1/quiz';
const QUESTION_DETAIL_BASE_URL = 'http://127.0.0.1:8000/api/v1/quiz/question/detail';

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

const parseQuizId = (value: unknown): number | null => {
  const raw = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  if (!Number.isFinite(raw) || raw <= 0) {
    return null;
  }

  return Math.floor(raw);
};

interface ParsedMarkdownTable {
  headers: string[];
  rows: string[][];
}

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

export function TestDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [questionDetail, setQuestionDetail] = useState<QuestionDetailData | null>(null);
  const [isQuestionDetailLoading, setIsQuestionDetailLoading] = useState(false);
  const [questionDetailError, setQuestionDetailError] = useState('');
  const [testData, setTestData] = useState<TestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const parsedQuestionTable = useMemo(() => {
    if (!questionDetail?.table_markdown) {
      return null;
    }

    return parseMarkdownTable(questionDetail.table_markdown);
  }, [questionDetail?.table_markdown]);

  const quizId = useMemo(() => {
    const queryId = parseQuizId(searchParams.get('id'));

    if (queryId) {
      return queryId;
    }

    const state = location.state as { testId?: unknown } | null;
    const stateId = parseQuizId(state?.testId);

    return stateId;
  }, [location.state, searchParams]);

  const loadQuizDetail = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    if (!quizId) {
      setErrorMessage("Quiz ID topilmadi. Testlar ro'yxatidan qayta kiring.");
      setTestData(null);
      setIsLoading(false);
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      setErrorMessage("Token topilmadi. Avval tizimga kirib ko'ring.");
      setTestData(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${QUIZ_DETAIL_BASE_URL}/${quizId}/`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Test tafsilotlarini yuklab bo\'lmadi.');
      }

      const data = (await response.json()) as TestData;
      setTestData(data);
    } catch {
      setErrorMessage("Test tafsilotlarini yuklab bo'lmadi. Qaytadan urinib ko'ring.");
      setTestData(null);
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    void loadQuizDetail();
  }, [loadQuizDetail]);

  const loadQuestionDetail = useCallback(async (questionId: number) => {
    setIsQuestionDetailLoading(true);
    setQuestionDetailError('');

    const accessToken = getAccessToken();

    if (!accessToken) {
      setQuestionDetailError("Token topilmadi. Avval tizimga kirib ko'ring.");
      setQuestionDetail(null);
      setIsQuestionDetailLoading(false);
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
      setQuestionDetail(data);
    } catch {
      setQuestionDetailError("Savol tafsilotlarini yuklab bo'lmadi. Qaytadan urinib ko'ring.");
      setQuestionDetail(null);
    } finally {
      setIsQuestionDetailLoading(false);
    }
  }, []);

  const handleQuestionDetailOpen = (question: Question) => {
    navigate(`/question-detail?id=${question.id}`, {
      state: {
        questionId: question.id,
        fromTestId: quizId,
      },
    });
  };

  const handleQuestionDetailClose = () => {
    setSelectedQuestion(null);
    setQuestionDetail(null);
    setQuestionDetailError('');
    setIsQuestionDetailLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Orqaga</p>
                <h1 className="text-lg font-bold text-gray-900">Test tafsilotlari</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* General Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
              Umumiy ma'lumotlar
            </h2>
          </div>

          <div className="space-y-5">
            {/* Test Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Test nomi
              </label>
              <p className="text-lg font-bold text-[#1E293B] leading-relaxed">
                {testData?.title || 'Test nomi mavjud emas'}
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Fan
              </label>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-200 rounded-xl">
                <span className="text-sm font-bold text-indigo-700">
                  {testData?.subject || 'Fan ko\'rsatilmagan'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-3">
                Tavsif
              </label>
              <p className="text-[#64748B] leading-relaxed">
                {testData?.description || 'Tavsif kiritilmagan'}
              </p>
            </div>
          </div>
        </motion.div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm">{errorMessage}</span>
            <button
              onClick={() => void loadQuizDetail()}
              className="text-sm font-semibold text-red-700 hover:text-red-800"
            >
              Qayta yuklash
            </button>
          </div>
        )}

        {/* Questions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                Savollar ro'yxati
              </h2>
            </div>
            <div className="bg-indigo-100 px-3 py-1.5 rounded-full">
              <span className="text-sm font-bold text-indigo-600">
                {testData?.questions.length ?? 0} ta savol
              </span>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {isLoading && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border-2 border-indigo-100">
                <p className="text-sm text-gray-500">Test tafsilotlari yuklanmoqda...</p>
              </div>
            )}

            {!isLoading && (testData?.questions.length ?? 0) === 0 && !errorMessage && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border-2 border-indigo-100">
                <p className="text-sm text-gray-500">Savollar topilmadi.</p>
              </div>
            )}

            {(testData?.questions ?? []).map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border-2 border-indigo-100"
              >
                <div className="flex gap-4">
                  {/* Question Number */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                      {index + 1}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 min-w-0">
                    {/* Topic Badge */}
                    {question.topic && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold mb-3">
                        <FileText className="w-3 h-3" />
                        {question.topic}
                      </div>
                    )}

                    <MathContent
                      content={question.question_text}
                      className="text-[#1E293B] font-medium leading-relaxed mb-4 break-words whitespace-pre-line"
                    />

                    {/* View Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleQuestionDetailOpen(question)}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      Ko'rish
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl p-5 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Ma'lumot</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                Test savollarini batafsil ko'rish uchun "Ko'rish" tugmasini bosing.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Full Question Bottom Sheet */}
      <AnimatePresence>
        {selectedQuestion && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleQuestionDetailClose}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-3xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                      {(testData?.questions ?? []).findIndex((q) => q.id === selectedQuestion.id) + 1}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Savol</p>
                      <h3 className="font-bold text-gray-900">Batafsil ma'lumot</h3>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleQuestionDetailClose}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>
              </div>

              <div className="px-6 py-6 space-y-5">
                {/* Topic Badge */}
                {(questionDetail?.topic || selectedQuestion.topic) && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-200 rounded-xl">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold text-indigo-700">
                      {questionDetail?.topic || selectedQuestion.topic}
                    </span>
                  </div>
                )}

                {questionDetail?.difficulty && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 border-2 border-amber-200 rounded-xl">
                    <span className="text-sm font-bold text-amber-700">Qiyinchilik: {questionDetail.difficulty}</span>
                  </div>
                )}

                {questionDetail?.subject && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 border-2 border-cyan-200 rounded-xl">
                    <span className="text-sm font-bold text-cyan-700">Fan: {questionDetail.subject}</span>
                  </div>
                )}

                {/* Full Question Text */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-100">
                  <MathContent
                    content={selectedQuestion.question_text}
                    className="text-[#1E293B] text-[17px] leading-[1.6] font-normal whitespace-pre-line"
                  />
                </div>

                {isQuestionDetailLoading && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <p className="text-sm text-gray-500">Savol tafsilotlari yuklanmoqda...</p>
                  </div>
                )}

                {questionDetailError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <span className="text-sm">{questionDetailError}</span>
                    <button
                      onClick={() => void loadQuestionDetail(selectedQuestion.id)}
                      className="text-sm font-semibold text-red-700 hover:text-red-800"
                    >
                      Qayta yuklash
                    </button>
                  </div>
                )}

                {questionDetail?.table_markdown && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Jadval</p>
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
                  </div>
                )}

                {(questionDetail?.images.length ?? 0) > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="w-4 h-4 text-gray-600" />
                      <p className="text-xs font-semibold text-gray-500 uppercase">Rasmlar</p>
                    </div>
                    <div className="space-y-3">
                      {questionDetail?.images.map((image, index) => (
                        <img
                          key={`${image.image_url}-${index}`}
                          src={image.image_url}
                          alt={`Savol rasmi ${index + 1}`}
                          className="w-full rounded-xl border border-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {(questionDetail?.options.length ?? 0) > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Javob variantlari</p>
                    <div className="space-y-3">
                      {questionDetail?.options.map((option, index) => (
                        <div
                          key={`${option.label}-${index}`}
                          className={option.is_correct
                            ? 'rounded-xl p-3 border-2 border-green-200 bg-green-50'
                            : 'rounded-xl p-3 border border-gray-200 bg-gray-50'}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {option.is_correct ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={option.is_correct ? 'text-xs font-bold text-green-700 mb-1' : 'text-xs font-bold text-gray-600 mb-1'}>
                                {option.label} {option.is_correct ? '(To\'g\'ri)' : ''}
                              </p>
                              <MathContent
                                content={option.text}
                                className={option.is_correct ? 'text-sm text-green-900 whitespace-pre-wrap' : 'text-sm text-gray-700 whitespace-pre-wrap'}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleQuestionDetailClose}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
                >
                  Yopish
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
