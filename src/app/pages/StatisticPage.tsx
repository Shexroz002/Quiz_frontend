import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Target,
  Brain,
  Trophy,
  BookOpen,
  CheckCircle2,
  XCircle,
  Flame
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNavigation } from '../components/BottomNavigation';
import { getAccessToken } from '../lib/auth';

const SUBJECT_ANALYTICS_URL = 'http://127.0.0.1:8000/api/v1/quiz/analytics/subjects';
const OVERALL_CARDS_URL = 'http://127.0.0.1:8000/api/v1/quiz/analytics/overall/cards';

type SubjectAnalytics = {
  subject_name: string;
  correct_answer: number;
  wrong_answer: number;
  total_answer: number;
  percentage: number;
};

type OverallCardsAnalytics = {
  total_quiz_session: number;
  correct_answer: number;
  average: string;
};

type SubjectCardConfig = {
  color: string;
  icon: string;
};

const SUBJECT_CARD_CONFIG: Record<string, SubjectCardConfig> = {
  Matematika: { color: '#F59E0B', icon: '📐' },
  Fizika: { color: '#3B82F6', icon: '⚛️' },
  Kimyo: { color: '#22C55E', icon: '⚗️' },
  'Ingliz tili': { color: '#8B5CF6', icon: '🌍' },
  'Ona tili': { color: '#EC4899', icon: '📚' },
};

const getSubjectCardConfig = (subjectName: string): SubjectCardConfig => {
  return SUBJECT_CARD_CONFIG[subjectName] ?? { color: '#64748B', icon: '📘' };
};

export function StatisticPage() {
  const navigate = useNavigate();
  const [subjectData, setSubjectData] = useState<SubjectAnalytics[]>([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState('');
  const [overallCards, setOverallCards] = useState<OverallCardsAnalytics>({
    total_quiz_session: 0,
    correct_answer: 0,
    average: '0',
  });
  const [isOverallCardsLoading, setIsOverallCardsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchOverallCards = async () => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        if (!isMounted) return;
        setIsOverallCardsLoading(false);
        return;
      }

      try {
        setIsOverallCardsLoading(true);

        const response = await fetch(OVERALL_CARDS_URL, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (!isMounted) return;
          setOverallCards({
            total_quiz_session: 0,
            correct_answer: 0,
            average: '0',
          });
          return;
        }

        const payload = (await response.json()) as OverallCardsAnalytics;

        if (!isMounted) return;
        setOverallCards({
          total_quiz_session: Number(payload.total_quiz_session) || 0,
          correct_answer: Number(payload.correct_answer) || 0,
          average: payload.average || '0',
        });
      } catch {
        if (!isMounted) return;
        setOverallCards({
          total_quiz_session: 0,
          correct_answer: 0,
          average: '0',
        });
      } finally {
        if (isMounted) {
          setIsOverallCardsLoading(false);
        }
      }
    };

    const fetchSubjectAnalytics = async () => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        if (!isMounted) return;
        setSubjectData([]);
        setSubjectsError("Token topilmadi. Fanlar statistikasi yuklanmadi.");
        setIsSubjectsLoading(false);
        return;
      }

      try {
        setIsSubjectsLoading(true);
        setSubjectsError('');

        const response = await fetch(SUBJECT_ANALYTICS_URL, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (!isMounted) return;
          setSubjectData([]);
          setSubjectsError("Fanlar statistikasi yuklanmadi. Qaytadan urinib ko'ring.");
          return;
        }

        const payload = (await response.json()) as SubjectAnalytics[];

        if (!isMounted) return;
        setSubjectData(Array.isArray(payload) ? payload : []);
      } catch {
        if (!isMounted) return;
        setSubjectData([]);
        setSubjectsError("Fanlar statistikasi yuklanmadi. Qaytadan urinib ko'ring.");
      } finally {
        if (isMounted) {
          setIsSubjectsLoading(false);
        }
      }
    };

    void fetchOverallCards();
    void fetchSubjectAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubjectClick = (subject: SubjectAnalytics) => {
    const subjectConfig = getSubjectCardConfig(subject.subject_name);

    navigate('/topic-statistic', {
      state: {
        subject: {
          name: subject.subject_name,
          value: subject.percentage,
          color: subjectConfig.color,
          icon: subjectConfig.icon,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-36">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#5B5FEF] via-[#6366F1] to-[#7C7FF6] px-5 pt-8 pb-6 rounded-b-[28px]">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white stroke-[2]" />
          </button>
          
          <h1 className="text-xl font-bold text-white">Statistika</h1>

          <div className="w-10"></div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-5 h-5 text-white stroke-[2]" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {isOverallCardsLoading ? '...' : overallCards.total_quiz_session}
            </p>
            <p className="text-white/80 text-xs">Testlar</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-white stroke-[2]" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {isOverallCardsLoading ? '...' : `${overallCards.average}%`}
            </p>
            <p className="text-white/80 text-xs">O'rtacha</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Flame className="w-5 h-5 text-white stroke-[2]" />
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {isOverallCardsLoading ? '...' : overallCards.correct_answer}
            </p>
            <p className="text-white/80 text-xs">To'g'ri javob</p>
          </motion.div>
        </div>
      </div>

      <div className="px-5 mt-6 space-y-4">
        {/* AI Suggestion Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#5B5FEF] via-[#7C3AED] to-[#8B5CF6] rounded-[20px] p-5 shadow-[0_12px_30px_rgba(91,93,239,0.3)] border border-white/20"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-white stroke-[2]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">AI Tavsiyasi</h3>
                <span className="px-2 py-0.5 bg-[#22C55E] rounded-full text-white text-xs font-bold">
                  Yangi
                </span>
              </div>
              <p className="text-white/70 text-xs">Sun'iy intellekt tahlili</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">🎯</span>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1">Kuchli tomonlaringiz</h4>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Matematika va Ingliz tilida ajoyib natijalar! So'nggi 7 kunda 95% ko'rsatkich bilan 23 ta testni ishladingiz.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1">Yaxshilash kerak</h4>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Ona tili fanida o'rtacha ball 78%. Kuniga 15-20 daqiqa qo'shimcha mashq qilishni tavsiya etamiz.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📈</span>
                <div className="flex-1">
                  <h4 className="font-bold text-white mb-1">Keyingi maqsad</h4>
                  <p className="text-white/90 text-sm leading-relaxed">
                    Fizika fanida yana 5 ta test ishlasangiz, 90% ballga erishasiz! Davom eting! 💪
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Subject Performance */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-bold text-[#1E293B] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#5B5FEF] stroke-[2]" />
            Fanlar bo'yicha natija
          </h3>

          <div className="space-y-3">
            {isSubjectsLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl px-2 py-2 -mx-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-200" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="h-4 w-28 rounded bg-slate-200" />
                        <div className="h-4 w-12 rounded bg-slate-200" />
                      </div>
                      <div className="h-2 rounded-full bg-slate-200" />
                    </div>
                  </div>
                </div>
              ))
            ) : subjectsError ? (
              <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-[13px] text-rose-700">{subjectsError}</p>
              </div>
            ) : subjectData.length === 0 ? (
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-[13px] text-slate-600">Fanlar statistikasi hozircha mavjud emas.</p>
              </div>
            ) : (
              subjectData.map((subject, index) => {
                const subjectConfig = getSubjectCardConfig(subject.subject_name);
                const percentage = Math.max(0, Math.min(subject.percentage, 100));

                return (
                  <motion.div
                    key={subject.subject_name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSubjectClick(subject)}
                    className="cursor-pointer rounded-2xl border border-slate-100 bg-slate-50/70 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: `${subjectConfig.color}20` }}
                      >
                        {subjectConfig.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-[#1E293B] text-sm">{subject.subject_name}</span>
                          <span className="font-bold text-[#1E293B]">{Math.round(percentage)}%</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="rounded-xl bg-white p-2.5 border border-slate-100">
                            <div className="flex items-center gap-1 mb-1 text-green-600">
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2]" />
                              <span className="text-[11px] font-medium">To'g'ri</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900">{subject.correct_answer}</p>
                          </div>

                          <div className="rounded-xl bg-white p-2.5 border border-slate-100">
                            <div className="flex items-center gap-1 mb-1 text-red-600">
                              <XCircle className="w-3.5 h-3.5 stroke-[2]" />
                              <span className="text-[11px] font-medium">Xato</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900">{subject.wrong_answer}</p>
                          </div>

                          <div className="rounded-xl bg-white p-2.5 border border-slate-100">
                            <div className="flex items-center gap-1 mb-1 text-indigo-600">
                              <Target className="w-3.5 h-3.5 stroke-[2]" />
                              <span className="text-[11px] font-medium">Jami</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900">{subject.total_answer}</p>
                          </div>
                        </div>

                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: subjectConfig.color }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
