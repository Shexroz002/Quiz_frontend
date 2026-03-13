import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Users,
  Clock,
  FileText,
  Trophy,
  ChevronsUpDown,
  Sparkles,
  Check,
} from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';

interface Test {
  id: string;
  title: string;
  subject: string;
  questions: number;
}

interface QuizApiItem {
  id: number;
  title: string;
  created_at: string;
  question_count: number;
  description: string | null;
  subject: string | null;
  is_new: boolean;
}

const QUIZ_LIST_URL = 'http://127.0.0.1:8000/api/v1/quiz/list/';
const MULTIPLAYER_CREATE_URL = 'http://127.0.0.1:8000/api/v1/quiz/sessions/multiplayer/create/';
const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 100;
const MIN_DURATION = 1;
const MAX_DURATION = 180;

const getAccessToken = () => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

const clampValue = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const parsePositiveNumber = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
};

const parseSessionId = (value: unknown): number | null => {
  const raw = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN;
  if (!Number.isFinite(raw) || raw <= 0) {
    return null;
  }

  return Math.floor(raw);
};

export function CreateRoomPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTest, setSelectedTest] = useState('');
  const [isTestSelectOpen, setIsTestSelectOpen] = useState(false);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(true);
  const [testLoadError, setTestLoadError] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createRoomError, setCreateRoomError] = useState('');
  const [participantCount, setParticipantCount] = useState(4);
  const [duration, setDuration] = useState(15);
  const [participantInput, setParticipantInput] = useState('4');
  const [durationInput, setDurationInput] = useState('15');
  const [isParticipantSelectOpen, setIsParticipantSelectOpen] = useState(false);
  const [isDurationSelectOpen, setIsDurationSelectOpen] = useState(false);
  const testDropdownRef = useRef<HTMLDivElement | null>(null);
  const participantDropdownRef = useRef<HTMLDivElement | null>(null);
  const durationDropdownRef = useRef<HTMLDivElement | null>(null);

  const participantOptions = [2, 4, 6, 8, 10];
  const durationOptions = [5, 10, 15, 20, 30, 45, 60];
  const navigationState = location.state as { selectedTestId?: unknown } | null;
  const preselectedTestId =
    typeof navigationState?.selectedTestId === 'string' ? navigationState.selectedTestId : '';

  const selectedTestData = useMemo(
    () => availableTests.find((test) => test.id === selectedTest) ?? null,
    [availableTests, selectedTest],
  );

  const filteredTests = useMemo(() => {
    const query = testSearchQuery.trim().toLowerCase();
    if (!query) {
      return availableTests;
    }

    return availableTests.filter((test) => {
      return (
        test.title.toLowerCase().includes(query) ||
        test.subject.toLowerCase().includes(query) ||
        String(test.questions).includes(query)
      );
    });
  }, [availableTests, testSearchQuery]);

  const loadTests = useCallback(async () => {
    setIsLoadingTests(true);
    setTestLoadError('');

    const accessToken = getAccessToken();
    if (!accessToken) {
      setTestLoadError("Token topilmadi. Avval tizimga kirib ko'ring.");
      setAvailableTests([]);
      setIsLoadingTests(false);
      return;
    }

    try {
      const response = await fetch(QUIZ_LIST_URL, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Testlar ro'yxatini yuklab bo'lmadi.");
      }

      const payload = (await response.json()) as QuizApiItem[] | { results?: QuizApiItem[] };
      const quizzes = Array.isArray(payload) ? payload : payload.results ?? [];

      const mappedTests = quizzes.map((quiz) => ({
        id: String(quiz.id),
        title: quiz.title,
        subject: quiz.subject?.trim() || "Fan ko'rsatilmagan",
        questions: quiz.question_count,
      }));

      setAvailableTests(mappedTests);
    } catch {
      setTestLoadError("Testlar ro'yxatini yuklab bo'lmadi. Qayta urinib ko'ring.");
      setAvailableTests([]);
    } finally {
      setIsLoadingTests(false);
    }
  }, []);

  useEffect(() => {
    void loadTests();
  }, [loadTests]);

  useEffect(() => {
    if (!preselectedTestId || availableTests.length === 0) {
      return;
    }

    const hasMatchingTest = availableTests.some((test) => test.id === preselectedTestId);
    if (!hasMatchingTest) {
      return;
    }

    setSelectedTest((currentValue) => currentValue || preselectedTestId);
  }, [availableTests, preselectedTestId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!testDropdownRef.current) {
        setIsTestSelectOpen(false);
      } else if (!testDropdownRef.current.contains(event.target as Node)) {
        setIsTestSelectOpen(false);
      }

      if (!participantDropdownRef.current) {
        setIsParticipantSelectOpen(false);
      } else if (!participantDropdownRef.current.contains(event.target as Node)) {
        setIsParticipantSelectOpen(false);
      }

      if (!durationDropdownRef.current) {
        setIsDurationSelectOpen(false);
      } else if (!durationDropdownRef.current.contains(event.target as Node)) {
        setIsDurationSelectOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const applyParticipantValue = useCallback((rawValue: string) => {
    const parsed = parsePositiveNumber(rawValue);
    if (parsed === null) {
      setParticipantInput(String(participantCount));
      return participantCount;
    }

    const normalizedValue = clampValue(parsed, MIN_PARTICIPANTS, MAX_PARTICIPANTS);
    setParticipantCount(normalizedValue);
    setParticipantInput(String(normalizedValue));
    return normalizedValue;
  }, [participantCount]);

  const applyDurationValue = useCallback((rawValue: string) => {
    const parsed = parsePositiveNumber(rawValue);
    if (parsed === null) {
      setDurationInput(String(duration));
      return duration;
    }

    const normalizedValue = clampValue(parsed, MIN_DURATION, MAX_DURATION);
    setDuration(normalizedValue);
    setDurationInput(String(normalizedValue));
    return normalizedValue;
  }, [duration]);

  const handleCreateRoom = async () => {
    const normalizedParticipantCount = applyParticipantValue(participantInput);
    const normalizedDuration = applyDurationValue(durationInput);

    if (!selectedTest) {
      alert('Iltimos, testni tanlang!');
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setCreateRoomError("Token topilmadi. Avval tizimga kirib ko'ring.");
      return;
    }

    const quizId = Number(selectedTest);
    if (!Number.isFinite(quizId) || quizId <= 0) {
      setCreateRoomError('Yaroqli test tanlanmadi.');
      return;
    }

    setIsCreatingRoom(true);
    setCreateRoomError('');

    try {
      const response = await fetch(MULTIPLAYER_CREATE_URL, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          quiz_id: quizId,
          duration_minutes: normalizedDuration,
          max_participants: normalizedParticipantCount,
        }),
      });

      if (!response.ok) {
        throw new Error("Musobaqa yaratib bo'lmadi.");
      }

      const payload = (await response.json()) as { id?: unknown; session_id?: unknown };
      const createdSessionId = parseSessionId(payload.id) ?? parseSessionId(payload.session_id);

      if (!createdSessionId) {
        throw new Error('Session ID qaytmadi.');
      }

      navigate(`/competition?sessionId=${createdSessionId}`, { state: { sessionId: createdSessionId } });
    } catch {
      setCreateRoomError("Musobaqa yaratishda xatolik bo'ldi. Qayta urinib ko'ring.");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleSelectTest = (testId: string) => {
    setSelectedTest(testId);
    setTestSearchQuery('');
    setIsTestSelectOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-24">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white shadow-md hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex-1">
              <p className="text-xs text-white/80 uppercase font-medium">Yangi</p>
              <h1 className="text-lg font-bold text-white">Musobaqa yaratish</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-xl mb-2">Do'stlar bilan musobaqa!</h2>
              <p className="text-white/90 text-sm leading-relaxed">
                Testni tanlang, ishtirokchilar sonini va vaqtni belgilang. Real vaqtda do'stlaringiz bilan bahslashing!
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-lg border-2 border-indigo-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-white stroke-[2]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-indigo-400 uppercase font-bold tracking-wider">1-qadam</p>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">Testni tanlang</h3>
            </div>
          </div>

          <div className="relative" ref={testDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTestSelectOpen((prev) => !prev)}
              className="w-full h-[56px] flex items-center justify-between px-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl hover:border-indigo-300 text-left shadow-sm transition-colors"
            >
              <div className="min-w-0">
                {selectedTestData ? (
                  <div className="space-y-0.5">
                    <p className="font-semibold text-gray-900 truncate text-sm">{selectedTestData.title}</p>
                    <p className="text-xs text-gray-600 truncate">
                      {selectedTestData.subject} • {selectedTestData.questions} savol
                    </p>
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">Test tanlang...</span>
                )}
              </div>
              <ChevronsUpDown className="w-5 h-5 text-indigo-500 ml-2 shrink-0" />
            </button>

            {isTestSelectOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 border border-indigo-200 rounded-xl overflow-hidden shadow-[0_12px_30px_rgba(67,56,202,0.2)] bg-white">
                <div className="px-3 py-2 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <input
                    type="text"
                    value={testSearchQuery}
                    onChange={(e) => setTestSearchQuery(e.target.value)}
                    placeholder="Test qidirish..."
                    className="w-full h-9 bg-white border border-indigo-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
                  />
                </div>

                <div className="max-h-[290px] overflow-y-auto">
                  {filteredTests.length === 0 ? (
                    <p className="text-sm text-gray-500 py-6 text-center">Test topilmadi.</p>
                  ) : (
                    filteredTests.map((test) => (
                      <button
                        key={test.id}
                        type="button"
                        onClick={() => handleSelectTest(test.id)}
                        className="w-full flex items-center gap-3 py-2.5 px-3 border-b last:border-b-0 border-gray-100 hover:bg-indigo-50 transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-sm">{test.title}</p>
                          <p className="text-xs text-gray-500 truncate">{test.subject} • {test.questions} savol</p>
                        </div>
                        <Check className={`w-4 h-4 ${selectedTest === test.id ? 'opacity-100 text-indigo-600' : 'opacity-0'}`} />
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {isLoadingTests && <p className="mt-3 text-sm text-gray-500">Testlar yuklanmoqda...</p>}

          {testLoadError && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
              <p className="text-xs text-red-700">{testLoadError}</p>
              <button onClick={() => void loadTests()} className="text-xs font-semibold text-red-700">
                Qayta
              </button>
            </div>
          )}

          {selectedTest && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl"
            >
              <div className="flex items-center gap-2 text-green-700">
                <Sparkles className="w-4 h-4" />
                <p className="text-sm font-bold">Test tanlandi: {selectedTestData?.title}</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-lg border-2 border-indigo-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white stroke-[2]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-orange-400 uppercase font-bold tracking-wider">2-qadam</p>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">Ishtirokchilar soni</h3>
            </div>
          </div>

          <div className="space-y-4">
            <div
              ref={participantDropdownRef}
              className="relative rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Miqdor</p>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={MIN_PARTICIPANTS}
                    max={MAX_PARTICIPANTS}
                    step={1}
                    value={participantInput}
                    onChange={(e) => setParticipantInput(e.target.value)}
                    onBlur={() => applyParticipantValue(participantInput)}
                    placeholder="Masalan, 4"
                    className="h-14 w-full rounded-xl border border-orange-200 bg-white px-4 text-lg font-bold text-gray-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-200/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsParticipantSelectOpen((prev) => !prev)}
                  className="mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-white text-orange-500 shadow-sm transition hover:border-orange-300 hover:bg-orange-50"
                  aria-label="Ishtirokchilar sonini tanlash"
                >
                  <ChevronsUpDown className="h-5 w-5" />
                </button>
              </div>

              {isParticipantSelectOpen && (
                <div className="absolute left-3 right-3 top-[calc(100%+8px)] z-30 rounded-2xl border border-orange-200 bg-white p-3 shadow-[0_12px_30px_rgba(249,115,22,0.18)]">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">Tez tanlash</p>
                  <div className="grid grid-cols-2 gap-2">
                    {participantOptions.map((count) => (
                      <button
                        key={`participant-option-${count}`}
                        type="button"
                        onClick={() => {
                          setParticipantCount(count);
                          setParticipantInput(String(count));
                          setIsParticipantSelectOpen(false);
                        }}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                          participantCount === count
                            ? 'bg-orange-500 text-white'
                            : 'bg-orange-50 text-gray-700 hover:bg-orange-100'
                        }`}
                      >
                        <span>{count} kishi</span>
                        <Check className={`h-4 w-4 ${participantCount === count ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-gray-500">Qo'lda istalgan qiymatni ham kiritishingiz mumkin.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
              <p className="text-base text-gray-800 text-center font-semibold leading-relaxed">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={participantCount}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-block"
                  >
                    <span className="text-orange-600 font-black text-xl">{participantCount}</span>
                  </motion.span>
                </AnimatePresence>{' '}
                kishi ishtirok etadi
              </p>
            </div>
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              2 dan 100 gacha kiritishingiz mumkin. Do'stlaringizga taklif kodi yuboriladi.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 shadow-lg border-2 border-indigo-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5 text-white stroke-[2]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-green-400 uppercase font-bold tracking-wider">3-qadam</p>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">Vaqt (daqiqa)</h3>
            </div>
          </div>

          <div className="space-y-4">
            <div
              ref={durationDropdownRef}
              className="relative rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">Davomiylik</p>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={MIN_DURATION}
                    max={MAX_DURATION}
                    step={1}
                    value={durationInput}
                    onChange={(e) => setDurationInput(e.target.value)}
                    onBlur={() => applyDurationValue(durationInput)}
                    placeholder="Masalan, 15"
                    className="h-14 w-full rounded-xl border border-emerald-200 bg-white px-4 text-lg font-bold text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsDurationSelectOpen((prev) => !prev)}
                  className="mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-500 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                  aria-label="Vaqtni tanlash"
                >
                  <ChevronsUpDown className="h-5 w-5" />
                </button>
              </div>

              {isDurationSelectOpen && (
                <div className="absolute left-3 right-3 top-[calc(100%+8px)] z-30 rounded-2xl border border-emerald-200 bg-white p-3 shadow-[0_12px_30px_rgba(16,185,129,0.18)]">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Tez tanlash</p>
                  <div className="grid grid-cols-2 gap-2">
                    {durationOptions.map((time) => (
                      <button
                        key={`duration-option-${time}`}
                        type="button"
                        onClick={() => {
                          setDuration(time);
                          setDurationInput(String(time));
                          setIsDurationSelectOpen(false);
                        }}
                        className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                          duration === time
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-50 text-gray-700 hover:bg-emerald-100'
                        }`}
                      >
                        <span>{time} daqiqa</span>
                        <Check className={`h-4 w-4 ${duration === time ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-gray-500">Qisqa yoki uzun testlar uchun o'zingiz ham vaqt kiritishingiz mumkin.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <p className="text-base text-gray-800 text-center font-semibold leading-relaxed">
                Musobaqa{' '}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={duration}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-block"
                  >
                    <span className="text-green-600 font-black text-xl">{duration}</span>
                  </motion.span>
                </AnimatePresence>{' '}
                daqiqa davom etadi
              </p>
            </div>
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              1 dan 180 daqiqagacha kiriting. Vaqt tugagach test avtomatik yakunlanadi.
            </p>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => void handleCreateRoom()}
          disabled={isCreatingRoom}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-5 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_40px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-3 min-h-[64px]"
        >
          <Trophy className="w-6 h-6" />
          {isCreatingRoom ? 'Yaratilmoqda...' : 'Musobaqa yaratish'}
        </motion.button>

        {createRoomError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700">{createRoomError}</p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl p-5 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Qanday ishlaydi?</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                Musobaqa yaratganingizdan so'ng, do'stlaringizga kod yuboring. Ular qo'shilgandan keyin test boshlandi!
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNavigation />
    </div>
  );
}
