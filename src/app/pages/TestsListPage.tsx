import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Search,
  Clock,
  FileText,
  Plus,
  User,
  Eye,
  Users,
  Sparkles
} from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';

interface Test {
  id: string;
  subject: string;
  title: string;
  description: string;
  questions: number;
  duration: number | null;
  iconBg: string;
  icon: string;
  isNew?: boolean;
}

interface QuizApiItem {
  id: number;
  title: string;
  created_at: string;
  question_count: number;
  description: string;
  subject: string;
  is_new: boolean;
}

const QUIZ_LIST_URL = 'http://127.0.0.1:8000/api/v1/student/quizzes/list';
const QUIZ_START_SESSION_BASE_URL = 'http://127.0.0.1:8000/api/v1/student/sessions';

const SUBJECT_STYLES: Array<{ pattern: RegExp; iconBg: string; icon: string }> = [
  { pattern: /fizika/i, iconBg: 'bg-indigo-100', icon: '⚡' },
  { pattern: /matematika/i, iconBg: 'bg-purple-100', icon: '📐' },
  { pattern: /kimyo/i, iconBg: 'bg-teal-100', icon: '🧪' },
  { pattern: /ona\s*tili|adabiyot/i, iconBg: 'bg-amber-100', icon: '📝' },
  { pattern: /biologiya/i, iconBg: 'bg-emerald-100', icon: '🧬' },
  { pattern: /tarix/i, iconBg: 'bg-orange-100', icon: '🏛️' },
  { pattern: /geografiya/i, iconBg: 'bg-cyan-100', icon: '🌍' },
];

const DEFAULT_SUBJECT_STYLE = { iconBg: 'bg-gray-100', icon: '📘' };

const getAccessToken = () => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

const getSubjectStyle = (subject: string) => {
  return SUBJECT_STYLES.find((entry) => entry.pattern.test(subject)) ?? DEFAULT_SUBJECT_STYLE;
};

export function TestsListPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const [isInitialEmpty, setIsInitialEmpty] = useState(false);

  const loadTests = useCallback(async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    const accessToken = getAccessToken();

    if (!accessToken) {
      setErrorMessage("Token topilmadi. Avval tizimga kirib ko'ring.");
      setTests([]);
      setIsLoading(false);
      return;
    }

    try {
      const requestUrl = new URL(QUIZ_LIST_URL);
      const trimmedQuery = query.trim();

      if (trimmedQuery) {
        requestUrl.searchParams.set('search', trimmedQuery);
      }

      const response = await fetch(requestUrl.toString(), {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Testlar roʻyxatini yuklab boʻlmadi.');
      }

      const payload = (await response.json()) as QuizApiItem[] | { results?: QuizApiItem[] };
      const quizzes = Array.isArray(payload) ? payload : payload.results ?? [];

      const mappedTests = quizzes.map((quiz) => {
        const style = getSubjectStyle(quiz.subject);

        return {
          id: String(quiz.id),
          subject: quiz.subject,
          title: quiz.title,
          description: quiz.description,
          questions: quiz.question_count,
          duration: null,
          iconBg: style.iconBg,
          icon: style.icon,
          isNew: quiz.is_new,
        } satisfies Test;
      });

      setTests(mappedTests);
      if (!trimmedQuery) {
        setIsInitialEmpty(mappedTests.length === 0);
      }
    } catch {
      setErrorMessage("Testlar ro'yxatini yuklab bo'lmadi. Qaytadan urinib ko'ring.");
      setTests([]);
      if (!query.trim()) {
        setIsInitialEmpty(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialEmpty && searchQuery.trim()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadTests(searchQuery);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isInitialEmpty, loadTests, searchQuery]);

  const hasSearchQuery = searchQuery.trim().length > 0;
  const showEmptyCreateCard = !isLoading && !errorMessage && tests.length === 0 && !hasSearchQuery;

  const handleStartTest = useCallback(
    async (testId: string) => {
      const parsedQuizId = Number(testId);
      if (!Number.isFinite(parsedQuizId) || parsedQuizId <= 0) {
        setErrorMessage('Testni boshlash uchun yaroqli quiz ID topilmadi.');
        return;
      }

      const accessToken = getAccessToken();
      if (!accessToken) {
        setErrorMessage("Token topilmadi. Avval tizimga kirib ko'ring.");
        return;
      }

      setStartingTestId(testId);
      setErrorMessage('');

      try {
        const response = await fetch(`${QUIZ_START_SESSION_BASE_URL}/${parsedQuizId}/start-single-player/`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Test seansini boshlashda xatolik yuz berdi.');
        }

        const payload = (await response.json()) as { session_id?: number };
        if (!payload.session_id || payload.session_id <= 0) {
          throw new Error('Session ID qaytmadi.');
        }

        navigate(`/test-taking?sessionId=${payload.session_id}`);
      } catch {
        setErrorMessage("Testni boshlashda xatolik bo'ldi. Qayta urinib ko'ring.");
      } finally {
        setStartingTestId(null);
      }
    },
    [navigate],
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="w-10 h-10 bg-[#5B5FEF] rounded-xl flex items-center justify-center text-white shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <h1 className="text-lg font-bold text-gray-900">Testlar</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
            >
              <User className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Testlar</h2>
          <p className="text-gray-600">
            Bilimingizni sinab ko'ring va natijalarni yaxshilang
          </p>
        </motion.div>

        {/* Search Bar */}
        {!isInitialEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Testlarni izlash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/20 focus:border-[#5B5FEF] transition-all placeholder:text-gray-400 shadow-sm"
            />
          </motion.div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-sm">{errorMessage}</span>
            <button
              onClick={() => void loadTests(searchQuery)}
              className="text-sm font-semibold text-red-700 hover:text-red-800"
            >
              Qayta yuklash
            </button>
          </div>
        )}

        {/* Tests List */}
        <div className="space-y-4">
          {isLoading && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Testlar yuklanmoqda...</p>
            </div>
          )}

          {!isLoading && tests.length === 0 && hasSearchQuery && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Hech qanday test topilmadi.</p>
            </div>
          )}

          {tests.map((test, index) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* New Badge */}
              {test.isNew && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, type: 'spring', stiffness: 200 }}
                  className="absolute top-4 right-4 z-10"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: 'reverse'
                    }}
                    className="relative"
                  >
                    {/* Glow Effect */}
                    <motion.div
                      animate={{
                        opacity: [0.4, 0.7, 0.4],
                        scale: [1, 1.15, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: 'reverse'
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-[#5B5FEF] to-purple-500 rounded-full blur-md"
                    />

                    {/* Badge */}
                    <div className="relative bg-gradient-to-r from-[#5B5FEF] to-purple-500 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                      <motion.div
                        animate={{ rotate: [0, 15, 0, -15, 0] }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          repeatType: 'reverse'
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </motion.div>
                      <span className="text-xs font-bold text-white uppercase tracking-wide">
                        Yangi
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Test Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`${test.iconBg} w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
                  {test.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#5B5FEF] uppercase mb-1.5 tracking-wide">
                    {test.subject}
                  </p>
                  <h3 className="font-bold text-gray-900 text-xl mb-2 leading-snug">
                    {test.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {test.description}
                  </p>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex items-center gap-5 mb-5 px-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm font-medium">{test.questions} savol</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm font-medium">
                    {test.duration ? `${test.duration} daqiqa` : 'Vaqti ko\'rsatilmagan'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => void handleStartTest(test.id)}
                  disabled={startingTestId === test.id}
                  className="flex-1 bg-[#5B5FEF] text-white h-12 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all hover:bg-[#4B4FDF]"
                >
                  {startingTestId === test.id ? 'Boshlanmoqda...' : 'Testni boshlash'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/test-detail?id=${test.id}`, { state: { testId: test.id } })}
                  className="h-12 px-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Secondary Action */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate('/create-room', { state: { selectedTestId: test.id } })}
                className="w-full mt-3 h-12 bg-white border-2 border-[#5B5FEF] text-[#5B5FEF] rounded-xl font-semibold hover:bg-[#5B5FEF]/5 transition-all flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Do'stlar bilan ishlash
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Add New Test Button */}
        {showEmptyCreateCard ? (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/create-test')}
            className="w-full rounded-3xl p-[1px] bg-gradient-to-br from-sky-200/80 via-indigo-100/90 to-emerald-100/80 text-left shadow-sm"
          >
            <div className="rounded-3xl border border-white bg-white/90 backdrop-blur px-5 py-6">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
                <Plus className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Yangi test qo&apos;shish</h4>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Testlar hali mavjud emas. Birinchi testingizni yarating va o&apos;quvchilar bilan ulashing.
              </p>
              <div className="mt-5 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,0.9)]">
                Test yaratish
              </div>
            </div>
          </motion.button>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/create-test')}
            className="w-full border-2 border-dashed border-gray-300 bg-white rounded-2xl py-6 flex flex-col items-center justify-center gap-3 hover:border-[#5B5FEF] hover:bg-[#5B5FEF]/5 transition-all"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Plus className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Yangi test qo&apos;shish</h4>
              <p className="text-sm text-gray-500">O&apos;z testlaringizni yarating</p>
            </div>
          </motion.button>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
