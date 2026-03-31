import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Info,
  Sparkles,
  CheckCircle2,
  X,
  Clock,
  FileCheck,
  ListChecks,
} from 'lucide-react';
import { toast } from 'sonner';
import { BottomNavigation } from '../components/BottomNavigation';
import { getAccessToken } from '../lib/auth';

type JobStatusType = 'queued' | 'processing' | 'completed' | 'failed';

interface SubjectOption {
  id: number;
  name: string;
}

interface AiJobCreateResponse {
  job_id: string;
  status: JobStatusType;
  progress: number;
  message: string;
  task_id: string;
}

interface AiJobStatusResponse {
  type?: 'snapshot' | 'progress' | 'completed' | 'failed';
  job_id: string;
  status: JobStatusType;
  progress: number;
  message: string;
  quiz_id: number | null;
  question_count: number | null;
  error: string | null;
}

const SUBJECT_LIST_URL = 'http://127.0.0.1:8000/api/v1/subject/list/';
const AI_QUIZ_GENERATE_URL = 'http://127.0.0.1:8000/api/v1/quiz-generator/quiz/generate';
const AI_JOB_STATUS_BASE_URL = 'http://127.0.0.1:8000/api/v1/quiz-generator/jobs';
const AI_JOB_ACTIVE_ID_KEY = 'ai_quiz_active_job_id';

const parseQuestionCount = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export function AITestPage() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [easyQuestions, setEasyQuestions] = useState('5');
  const [mediumQuestions, setMediumQuestions] = useState('15');
  const [hardQuestions, setHardQuestions] = useState('5');
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState('');
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [jobStatus, setJobStatus] = useState<AiJobStatusResponse | null>(null);
  const [pageError, setPageError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedQuizId, setCompletedQuizId] = useState<number | null>(null);
  const [completedQuestionCount, setCompletedQuestionCount] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const totalQuestions =
    parseQuestionCount(easyQuestions) +
    parseQuestionCount(mediumQuestions) +
    parseQuestionCount(hardQuestions);

  const selectedSubjectName =
    subjects.find((subject) => String(subject.id) === selectedSubjectId)?.name || '';

  const isAnalyzing =
    isStartingJob ||
    (jobStatus !== null && (jobStatus.status === 'queued' || jobStatus.status === 'processing'));

  const cleanupTracking = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const handleJobStatusUpdate = useCallback((update: AiJobStatusResponse) => {
    setJobStatus(update);
    setPageError('');

    if (update.status === 'completed') {
      cleanupTracking();
      localStorage.removeItem(AI_JOB_ACTIVE_ID_KEY);
      setCompletedQuizId(update.quiz_id);
      setCompletedQuestionCount(update.question_count);
      setShowSuccessModal(true);
      toast.success('AI test tayyor bo‘ldi.');
      return;
    }

    if (update.status === 'failed') {
      cleanupTracking();
      localStorage.removeItem(AI_JOB_ACTIVE_ID_KEY);
      setPageError(update.error || update.message || 'AI test yaratishda xatolik yuz berdi.');
      toast.error('AI test yaratish muvaffaqiyatsiz tugadi.');
    }
  }, [cleanupTracking]);

  const fetchJobStatus = useCallback(async (jobId: string, token: string) => {
    const response = await fetch(`${AI_JOB_STATUS_BASE_URL}/${jobId}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Job holatini olishda xatolik.');
    }

    const data = (await response.json()) as AiJobStatusResponse;
    handleJobStatusUpdate(data);
    return data;
  }, [handleJobStatusUpdate]);

  const startTrackingJob = useCallback((jobId: string, token: string) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    localStorage.setItem(AI_JOB_ACTIVE_ID_KEY, jobId);

    const ws = new WebSocket(`ws://localhost:8000/ws/jobs/${jobId}/?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as AiJobStatusResponse;
        if (typeof payload.status === 'string') {
          handleJobStatusUpdate(payload);
        }
      } catch {
      }
    };

    ws.onerror = () => {
      // onclose handles fallback fetch/reconnect
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }

      void fetchJobStatus(jobId, token)
        .then((latestStatus) => {
          if (latestStatus.status === 'completed' || latestStatus.status === 'failed') {
            return;
          }

          reconnectTimeoutRef.current = window.setTimeout(() => {
            startTrackingJob(jobId, token);
          }, 3000);
        })
        .catch(() => {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            startTrackingJob(jobId, token);
          }, 5000);
        });
    };
  }, [fetchJobStatus, handleJobStatusUpdate]);

  useEffect(() => {
    const loadSubjects = async () => {
      setIsSubjectsLoading(true);
      setSubjectsError('');

      try {
        const response = await fetch(SUBJECT_LIST_URL, {
          method: 'GET',
          headers: { accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error("Fanlar ro'yxatini yuklab bo'lmadi.");
        }

        const data = (await response.json()) as Array<{
          id: number;
          name: string;
        }>;

        setSubjects(data.map((subject) => ({
          id: subject.id,
          name: subject.name,
        })));
      } catch {
        setSubjectsError("Fanlar ro'yxatini yuklab bo'lmadi. Qaytadan urinib ko'ring.");
      } finally {
        setIsSubjectsLoading(false);
      }
    };

    void loadSubjects();
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const token = getAccessToken();
    const activeJobId = localStorage.getItem(AI_JOB_ACTIVE_ID_KEY);

    if (!token || !activeJobId) {
      return;
    }

    const resumeJob = async () => {
      try {
        const latestStatus = await fetchJobStatus(activeJobId, token);
        if (isCancelled) {
          return;
        }

        if (latestStatus.status === 'queued' || latestStatus.status === 'processing') {
          startTrackingJob(activeJobId, token);
        } else {
          localStorage.removeItem(AI_JOB_ACTIVE_ID_KEY);
        }
      } catch {
        localStorage.removeItem(AI_JOB_ACTIVE_ID_KEY);
      }
    };

    void resumeJob();

    return () => {
      isCancelled = true;
    };
  }, [fetchJobStatus, startTrackingJob]);

  useEffect(() => {
    return () => {
      cleanupTracking();
    };
  }, [cleanupTracking]);

  const handleCreateTest = async () => {
    if (isStartingJob || isAnalyzing) {
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      setPageError("Token topilmadi. Avval tizimga kirib ko'ring.");
      return;
    }

    if (!selectedSubjectId) {
      setPageError('Fan tanlang.');
      return;
    }

    if (!description.trim()) {
      setPageError('Mavzu tavsifini kiriting.');
      return;
    }

    if (totalQuestions <= 0) {
      setPageError('Kamida 1 ta savol kiriting.');
      return;
    }

    setPageError('');
    setShowSuccessModal(false);
    setCompletedQuizId(null);
    setCompletedQuestionCount(null);
    setIsStartingJob(true);

    try {
      const requestUrl = new URL(AI_QUIZ_GENERATE_URL);
      requestUrl.searchParams.set('subject', selectedSubjectId);
      requestUrl.searchParams.set('description', description.trim());
      requestUrl.searchParams.set('question_count', String(totalQuestions));

      const response = await fetch(requestUrl.toString(), {
        method: 'POST',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: '',
      });

      if (!response.ok) {
        throw new Error('AI test yaratishni boshlashda xatolik yuz berdi.');
      }

      const data = (await response.json()) as AiJobCreateResponse;
      setJobStatus({
        job_id: data.job_id,
        status: data.status,
        progress: data.progress,
        message: data.message,
        quiz_id: null,
        question_count: null,
        error: null,
      });

      startTrackingJob(data.job_id, accessToken);
      toast.success('So‘rov yuborildi. AI test yaratishni boshladi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI test yaratishda xatolik yuz berdi.';
      setPageError(message);
    } finally {
      setIsStartingJob(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-purple-50/30 pb-24">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/create-test')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              AI yordamida test yaratish
            </h1>
          </div>
        </div>
      </motion.div>

      <div className="px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 rounded-2xl p-4"
        >
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-blue-900 font-semibold mb-1">Yo&apos;riqnoma</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                Fan va mavzu tavsifini kiriting. Tizim umumiy savollar soni bo&apos;yicha AI job yaratadi va natijani real vaqt rejimida ko&apos;rsatadi.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 p-5"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fan
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={isSubjectsLoading || isAnalyzing}
            className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">
              {isSubjectsLoading ? 'Fanlar yuklanmoqda...' : 'Fanni tanlang'}
            </option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          {subjectsError && (
            <p className="text-sm text-red-600 mt-2">{subjectsError}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mavzu tavsifi
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Masalan: Elektr, elektromagnit maydon va elektr kuchlanish mavzusi bo‘yicha test yaratib ber"
            rows={5}
            className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Savollar soni (qiyinchilik bo&apos;yicha)
          </label>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-2">Oson</label>
              <input
                type="number"
                min="0"
                value={easyQuestions}
                onChange={(e) => setEasyQuestions(e.target.value)}
                className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-2">O&apos;rtacha</label>
              <input
                type="number"
                min="0"
                value={mediumQuestions}
                onChange={(e) => setMediumQuestions(e.target.value)}
                className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-2">Qiyin</label>
              <input
                type="number"
                min="0"
                value={hardQuestions}
                onChange={(e) => setHardQuestions(e.target.value)}
                className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-indigo-50 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-indigo-900">Umumiy savollar soni</span>
            <span className="text-lg font-semibold text-indigo-700">{totalQuestions}</span>
          </div>
        </motion.div>

        {pageError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            <p className="text-sm">{pageError}</p>
          </div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02, boxShadow: '0 20px 25px -5px rgba(79, 70, 229, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateTest}
          disabled={isAnalyzing || isSubjectsLoading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-indigo-300 disabled:to-purple-300 text-white py-4 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 disabled:cursor-not-allowed"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
          {isAnalyzing ? 'Jarayon davom etmoqda...' : 'Testni yaratish'}
        </motion.button>
      </div>

      <BottomNavigation />

      <AnimatePresence>
        {showSuccessModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-[24px] shadow-2xl z-50 overflow-hidden max-w-md mx-auto"
            >
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 px-6 py-8 text-center relative overflow-hidden">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-12 h-12 text-white stroke-[2]" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  Muvaffaqiyatli yaratildi!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-sm"
                >
                  AI testi tayyor
                </motion.p>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5 text-white stroke-[2]" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-3 mb-5">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ListChecks className="w-5 h-5 text-purple-600 stroke-[2]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {completedQuestionCount ?? totalQuestions} ta savol yaratildi
                      </p>
                      <p className="text-xs text-[#64748B]">
                        Oson: {parseQuestionCount(easyQuestions)} • O&apos;rtacha: {parseQuestionCount(mediumQuestions)} • Qiyin: {parseQuestionCount(hardQuestions)}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileCheck className="w-5 h-5 text-blue-600 stroke-[2]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {selectedSubjectName || 'Fan tanlanmagan'}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {completedQuizId ? `Quiz ID: ${completedQuizId}` : 'Test saqlandi'}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600 stroke-[2]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {Math.ceil((completedQuestionCount ?? totalQuestions) * 1.2)} daqiqa
                      </p>
                      <p className="text-xs text-[#64748B]">Tavsiya etilgan vaqt</p>
                    </div>
                  </motion.div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 mb-5">
                  <p className="text-sm text-[#475569] leading-relaxed">
                    <span className="font-semibold text-[#1E293B]">Test tayyorlandi.</span>
                    <br />
                    AI siz kiritgan tavsif bo&apos;yicha test yaratdi. Testni &quot;Mening testlarim&quot; bo&apos;limida ko&apos;rishingiz mumkin.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/tests-list')}
                  className="w-full bg-gradient-to-r from-[#5B5FEF] to-[#7C3AED] text-white py-4 rounded-xl font-semibold text-base hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ListChecks className="w-5 h-5 stroke-[2.5]" />
                  Mening testlarim
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAnalyzing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-[24px] shadow-2xl z-50 overflow-hidden max-w-md mx-auto p-8"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 mx-auto mb-6"
                >
                  <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                </motion.div>

                <h3 className="text-xl font-bold text-[#1E293B] mb-2">
                  Test yaratilmoqda...
                </h3>
                <p className="text-sm text-[#64748B] mb-4">
                  {jobStatus?.message || 'AI savollarni tayyorlamoqda'}
                </p>

                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#64748B]">Yaratish jarayoni</span>
                    <span className="text-xs font-semibold text-indigo-600">
                      {jobStatus?.progress ?? 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${jobStatus?.progress ?? 0}%` }}
                      transition={{ duration: 0.4 }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
