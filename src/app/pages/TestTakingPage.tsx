import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useBlocker, useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
} from "lucide-react";

interface ApiQuestionOption {
  label: string;
  text: string;
}

interface ApiQuestion {
  id: number;
  subject: string | null;
  table_markdown: string | null;
  difficulty: string | null;
  topic: string | null;
  images: unknown[];
  options: ApiQuestionOption[];
  question_text?: string | null;
}

interface QuestionImage {
  url: string;
}

interface SessionInfoResponse {
  session_id: number;
  quiz_id: number;
  status: string;
  questions_count: number;
  started_at: string;
  finished_at: string;
  questions: ApiQuestion[];
}

interface FinishQuestionAnswer {
  question_id: number;
  selected_option: string;
}

interface TopicStatisticItem {
  topic_name: string;
  total_questions: number;
  correct_answers: number;
}

interface FinishSessionResponse {
  session_id: number;
  attempt_id: number;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  wrong_answers: number;
  spend_time: number;
  score: number;
  finished: boolean;
  topic_statistic: TopicStatisticItem[];
}

interface Question {
  id: number;
  subject: string | null;
  topic: string | null;
  text: string;
  images: QuestionImage[];
  tableMarkdown: string | null;
  options: {
    label: string;
    value: string;
  }[];
}

const QUIZ_SESSION_BASE_URL = "http://127.0.0.1:8000/api/v1/student/sessions";

const getAccessToken = () => {
  return localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
};

const sanitizeQuestionText = (question: ApiQuestion): string => {
  const rawText = question.question_text ?? question.topic ?? "Savol matni mavjud emas.";
  return rawText.trim();
};

const extractImageUrl = (item: unknown): string | null => {
  if (typeof item === "string") {
    return item.trim() || null;
  }

  if (item && typeof item === "object") {
    const candidate = item as { image_url?: unknown; url?: unknown };
    if (typeof candidate.image_url === "string" && candidate.image_url.trim()) {
      return candidate.image_url.trim();
    }
    if (typeof candidate.url === "string" && candidate.url.trim()) {
      return candidate.url.trim();
    }
  }

  return null;
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

interface ParsedMarkdownTable {
  headers: string[];
  rows: string[][];
}

const parseMarkdownTable = (markdown: string): ParsedMarkdownTable | null => {
  const lines = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"));

  if (lines.length < 2) {
    return null;
  }

  const parseRow = (line: string) =>
    line
      .slice(1, -1)
      .split("|")
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
      const existingScript = document.getElementById("mathjax-script") as HTMLScriptElement | null;

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("MathJax load failed")), { once: true });
        return;
      }

      window.MathJax = {
        tex: {
          inlineMath: [["$", "$"], ["\\(", "\\)"]],
          displayMath: [["$$", "$$"], ["\\[", "\\]"]],
        },
        startup: {
          typeset: false,
        },
      } as Window["MathJax"];

      const script = document.createElement("script");
      script.id = "mathjax-script";
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("MathJax load failed"));
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

export function TestTakingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string;
  }>({});
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
  const allowNavigationRef = useRef(false);
  const blocker = useBlocker(!allowNavigationRef.current);

  const sessionId = useMemo(() => {
    const raw = Number(searchParams.get("sessionId"));
    if (!Number.isFinite(raw) || raw <= 0) {
      return null;
    }

    return Math.floor(raw);
  }, [searchParams]);

  const loadSessionInfo = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    if (!sessionId) {
      setErrorMessage("Session ID topilmadi. Testlar ro'yxatidan qayta boshlang.");
      setQuestions([]);
      setIsLoading(false);
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setErrorMessage("Token topilmadi. Avval tizimga kirib ko'ring.");
      setQuestions([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${QUIZ_SESSION_BASE_URL}/multiplayer/${sessionId}/questions/`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Savollarni yuklab bo'lmadi.");
      }

      const payload = (await response.json()) as SessionInfoResponse | ApiQuestion[];
      const questionsPayload = Array.isArray(payload) ? payload : payload.questions ?? [];
      const mappedQuestions = questionsPayload.map((question) => ({
        id: question.id,
        subject: question.subject,
        topic: question.topic,
        text: sanitizeQuestionText(question),
        images: question.images
          .map((imageItem) => extractImageUrl(imageItem))
          .filter((url): url is string => Boolean(url))
          .map((url) => ({ url })),
        tableMarkdown: question.table_markdown,
        options: question.options.map((option) => ({
          label: option.label,
          value: option.text,
        })),
      }));

      setQuestions(mappedQuestions);

      if (!Array.isArray(payload)) {
        const finishedAtMs = new Date(payload.finished_at).getTime();
        const startedAtMs = new Date(payload.started_at).getTime();
        const fallbackSeconds = Math.max(Math.floor((finishedAtMs - startedAtMs) / 1000), 0);
        const remainingSeconds = Math.max(Math.floor((finishedAtMs - Date.now()) / 1000), 0);
        setTimeRemaining(remainingSeconds || fallbackSeconds);
      } else {
        setTimeRemaining(0);
      }
    } catch {
      setErrorMessage("Savollarni yuklashda xatolik yuz berdi. Qayta urinib ko'ring.");
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadSessionInfo();
  }, [loadSessionInfo]);

  useEffect(() => {
    if (blocker.state !== "blocked") {
      return;
    }

    setFinishError("");
    setShowFinishModal(true);
  }, [blocker]);

  useEffect(() => {
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    const handlePopState = () => {
      if (allowNavigationRef.current || isFinishing) {
        return;
      }

      window.history.pushState(null, "", currentUrl);
      setFinishError("");
      setShowFinishModal(true);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isFinishing]);

  useEffect(() => {
    const questionParam = searchParams.get("question");
    if (!questionParam) {
      return;
    }

    const questionIndex = parseInt(questionParam, 10);
    if (!Number.isNaN(questionIndex) && questionIndex >= 0 && questionIndex < questions.length) {
      setCurrentQuestion(questionIndex);
    }
  }, [searchParams, questions.length]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const timer = window.setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          window.clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isLoading]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    if (!sessionId) {
      setFinishError("Session ID topilmadi.");
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setFinishError("Token topilmadi. Avval tizimga kirib ko'ring.");
      return;
    }

    const answerPayload: FinishQuestionAnswer[] = Object.entries(selectedAnswers)
      .map(([questionIndex, selectedOption]) => {
        const idx = Number(questionIndex);
        const questionItem = questions[idx];
        if (!questionItem) {
          return null;
        }

        return {
          question_id: questionItem.id,
          selected_option: selectedOption,
        };
      })
      .filter((item): item is FinishQuestionAnswer => item !== null);

    setIsFinishing(true);
    setFinishError("");

    try {
      const response = await fetch(`${QUIZ_SESSION_BASE_URL}/${sessionId}/finish-single-player/`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(answerPayload),
      });

      if (!response.ok) {
        throw new Error("Testni yakunlab bo'lmadi.");
      }

      const payload = (await response.json()) as FinishSessionResponse;
      allowNavigationRef.current = true;
      if (blocker.state === "blocked") {
        blocker.reset();
      }
      navigate("/test-results", { state: { result: payload } });
    } catch {
      setFinishError("Testni yakunlashda xatolik bo'ldi. Qayta urinib ko'ring.");
    } finally {
      setIsFinishing(false);
    }
  };

  const handleViewAllQuestions = () => {
    if (!allowNavigationRef.current) {
      setFinishError("");
      setShowFinishModal(true);
      return;
    }

    const answeredIndexes = Object.keys(selectedAnswers).join(",");
    const params = new URLSearchParams({
      current: String(currentQuestion),
      answered: answeredIndexes,
      total: String(questions.length),
    });

    if (sessionId) {
      params.set("sessionId", String(sessionId));
    }

    navigate(`/question-map?${params.toString()}`);
  };

  const handleCloseFinishModal = () => {
    setShowFinishModal(false);
    setFinishError("");

    if (blocker.state === "blocked") {
      blocker.reset();
    }
  };

  const question = questions[currentQuestion];
  const parsedQuestionTable = useMemo(() => {
    if (!question?.tableMarkdown) {
      return null;
    }

    return parseMarkdownTable(question.tableMarkdown);
  }, [question?.tableMarkdown]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Savollar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 shadow-sm border border-red-200">
          <p className="text-sm text-red-700 mb-4">{errorMessage}</p>
          <div className="flex gap-3">
            <button
              onClick={() => void loadSessionInfo()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
            >
              Qayta yuklash
            </button>
            <button
              onClick={() => {
                setFinishError("");
                setShowFinishModal(true);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
            >
              Testlar ro'yxati
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Savollar topilmadi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Test</h1>
                <p className="text-xs text-gray-500">TEST REJIMI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-900">{formatTime(timeRemaining)}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setFinishError("");
                  setShowFinishModal(true);
                }}
                className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Yakunlash
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{currentQuestion + 1}-savol</h2>
          <span className="text-sm text-gray-500">{questions.length} tadan {currentQuestion + 1}-si</span>
        </div>

        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${((currentQuestion + 1) / questions.length) * 100}%`,
            }}
            className="h-full bg-indigo-600 rounded-full"
          />
        </div>

        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                {question.subject || "Fan ko'rsatilmagan"}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold">
                {question.topic || "Mavzu ko'rsatilmagan"}
              </span>
            </div>

            <MathContent content={question.text} className="text-gray-800 leading-relaxed mb-4" />

            {question.images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {question.images.map((image, index) => (
                  <div key={`${image.url}-${index}`} className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={image.url}
                      alt={`Savol rasmi ${index + 1}`}
                      className="w-full h-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}

            {question.tableMarkdown && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 overflow-x-auto border border-gray-200">
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
                              <MathContent content={row[cellIndex] ?? ""} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <MathContent content={question.tableMarkdown} className="text-sm text-gray-700 whitespace-pre-wrap" />
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {question.options.map((option) => (
              <motion.button
                key={option.label}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleAnswerSelect(option.label)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                  selectedAnswers[currentQuestion] === option.label
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-indigo-200"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${
                    selectedAnswers[currentQuestion] === option.label ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {option.label}
                </div>
                <MathContent
                  content={option.value}
                  className={`font-medium ${
                    selectedAnswers[currentQuestion] === option.label ? "text-indigo-900" : "text-gray-700"
                  }`}
                />
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Savollar xaritasi</h3>
            <button
              className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
              onClick={handleViewAllQuestions}
            >
              Hammasini ko'rish →
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {(() => {
              const totalQuestions = questions.length;
              const visibleCount = Math.min(5, totalQuestions);

              let startIndex = 0;
              if (totalQuestions > visibleCount) {
                startIndex = Math.min(Math.max(currentQuestion - (visibleCount - 1), 0), totalQuestions - visibleCount);
              }

              const visibleQuestions = Array.from({ length: visibleCount }, (_, i) => startIndex + i + 1);

              return visibleQuestions.map((num) => (
                <motion.button
                  key={num}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentQuestion(num - 1)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 transition-colors ${
                    currentQuestion === num - 1
                      ? "bg-indigo-600 text-white"
                      : selectedAnswers[num - 1]
                        ? "bg-green-100 text-green-700 border-2 border-green-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {num}
                </motion.button>
              ));
            })()}
          </div>
        </div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              currentQuestion === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Oldingi
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={currentQuestion === questions.length - 1}
            className={`flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              currentQuestion === questions.length - 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            Keyingi
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showFinishModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseFinishModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-yellow-500" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Testni yakunlamoqchimisiz?</h2>

              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                Siz hali barcha savollarga javob bermadingiz. Yakunlashdan oldin barchasini tekshirib chiqishni tavsiya qilamiz.
              </p>

              <div className="space-y-3">
                {finishError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {finishError}
                  </p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => void handleFinish()}
                  disabled={isFinishing}
                  className="w-full py-4 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {isFinishing ? "Yakunlanmoqda..." : "Ha, yakunlash"}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCloseFinishModal}
                  disabled={isFinishing}
                  className="w-full py-4 rounded-xl font-semibold bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Testga qaytish
                </motion.button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-6">Natijalar yakunlangandan so'ng qayta o'zgartirib bo'lmaydi.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
