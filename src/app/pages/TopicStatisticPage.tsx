import { useDeferredValue, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    TrendingUp,
    Target,
    Award,
    ChevronRight,
    CheckCircle2,
    XCircle,
    BarChart3,
    BookOpen,
    Search,
    X
} from 'lucide-react';
import { getAccessToken } from '../lib/auth';
import { BottomNavigation } from '../components/BottomNavigation';

const TOPIC_ANALYTICS_URL = 'http://127.0.0.1:8000/api/v1/quiz/analytics/topic';

interface TopicStat {
    subject_name: string;
    topic_name: string;
    correct_answer: number;
    wrong_answer: number;
    total_answer: number;
    percentage: number;
}

interface SubjectNavigationState {
    subject?: {
        name: string;
        value: number;
        color: string;
        icon: string;
    };
}

export function TopicStatisticPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { subject } = (location.state as SubjectNavigationState | null) ?? {};
    const [topicStats, setTopicStats] = useState<TopicStat[]>([]);
    const [isTopicsLoading, setIsTopicsLoading] = useState(true);
    const [topicsError, setTopicsError] = useState('');
    const [searchValue, setSearchValue] = useState('');

    const subjectName = subject?.name ?? "Fizika";
    const deferredSearchValue = useDeferredValue(searchValue.trim());
    const subjectColorByName: Record<string, string> = {
        "Matematika": "from-amber-500 to-orange-500",
        "Fizika": "from-blue-500 to-cyan-500",
        "Kimyo": "from-green-500 to-emerald-500",
        "Ingliz tili": "from-violet-500 to-purple-500",
        "Ona tili": "from-pink-500 to-rose-500"
    };
    const subjectColor = subjectColorByName[subjectName] ?? "from-blue-500 to-cyan-500";

    useEffect(() => {
        let isMounted = true;

        const fetchTopicAnalytics = async () => {
            const accessToken = getAccessToken();

            if (!accessToken) {
                if (!isMounted) return;
                setTopicStats([]);
                setTopicsError("Token topilmadi. Mavzu statistikasi yuklanmadi.");
                setIsTopicsLoading(false);
                return;
            }

            try {
                setIsTopicsLoading(true);
                setTopicsError('');
                const requestUrl = new URL(TOPIC_ANALYTICS_URL);
                requestUrl.searchParams.set('subject', subjectName);
                if (deferredSearchValue) {
                    requestUrl.searchParams.set('search', deferredSearchValue);
                }

                const response = await fetch(requestUrl.toString(), {
                    method: 'GET',
                    headers: {
                        accept: 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    if (!isMounted) return;
                    setTopicStats([]);
                    setTopicsError("Mavzu statistikasi yuklanmadi. Qaytadan urinib ko'ring.");
                    return;
                }

                const payload = (await response.json()) as TopicStat[];

                if (!isMounted) return;
                setTopicStats(Array.isArray(payload) ? payload : []);
            } catch {
                if (!isMounted) return;
                setTopicStats([]);
                setTopicsError("Mavzu statistikasi yuklanmadi. Qaytadan urinib ko'ring.");
            } finally {
                if (isMounted) {
                    setIsTopicsLoading(false);
                }
            }
        };

        void fetchTopicAnalytics();

        return () => {
            isMounted = false;
        };
    }, [subjectName, deferredSearchValue]);

    // Calculate overall statistics for this subject
    const totalCorrect = topicStats.reduce((sum, stat) => sum + stat.correct_answer, 0);
    const totalQuestions = topicStats.reduce((sum, stat) => sum + stat.total_answer, 0);
    const overallPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Get performance level and color
    const getPerformanceLevel = (percentage: number) => {
        if (percentage >= 80) return { level: "A'lo", color: "from-green-500 to-emerald-500", textColor: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
        if (percentage >= 60) return { level: "Yaxshi", color: "from-blue-500 to-cyan-500", textColor: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" };
        if (percentage >= 40) return { level: "Qoniqarli", color: "from-amber-500 to-orange-500", textColor: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" };
        return { level: "Yaxshilash kerak", color: "from-red-500 to-rose-500", textColor: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
    };

    // Get progress bar color
    const getProgressColor = (percentage: number) => {
        if (percentage >= 80) return "from-green-400 to-emerald-500";
        if (percentage >= 60) return "from-blue-400 to-cyan-500";
        if (percentage >= 40) return "from-amber-400 to-orange-500";
        return "from-red-400 to-rose-500";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-36">
            {/* Header */}
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
                            <p className="text-xs text-white/80 uppercase font-medium">Mavzu statistikasi</p>
                            <h1 className="text-lg font-bold text-white">{subjectName}</h1>
                        </div>
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 py-6 space-y-4">
                {/* Subject Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gradient-to-r ${subjectColor} rounded-3xl p-6 shadow-lg`}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-md">
                            <BookOpen className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-white/80 uppercase font-medium tracking-wide">Fan</p>
                            <h2 className="text-2xl font-bold text-white">{subjectName}</h2>
                        </div>
                    </div>

                    {/* Subject Overall Stats */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                        <div className="grid grid-cols-3 gap-3">
                            {/* Total Questions */}
                            <div className="text-center">
                                <p className="text-xs text-white/80 font-semibold mb-1">Jami</p>
                                <p className="text-3xl font-bold text-white">{totalQuestions}</p>
                            </div>

                            {/* Correct Answers */}
                            <div className="text-center">
                                <p className="text-xs text-white/80 font-semibold mb-1">To'g'ri</p>
                                <p className="text-3xl font-bold text-white">{totalCorrect}</p>
                            </div>

                            {/* Percentage */}
                            <div className="text-center">
                                <p className="text-xs text-white/80 font-semibold mb-1">Natija</p>
                                <p className="text-3xl font-bold text-white">{overallPercentage}%</p>
                            </div>
                        </div>

                        {/* Performance Badge */}
                        <div className="mt-4 flex items-center justify-center gap-2 bg-white/30 rounded-xl py-2">
                            <Award className="w-5 h-5 text-white" />
                            <p className="font-bold text-white">
                                {getPerformanceLevel(overallPercentage).level}
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-3xl border border-indigo-100 bg-white/85 p-4 shadow-md backdrop-blur-sm"
                >
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner">
                        <Search className="h-5 w-5 shrink-0 text-slate-400" />
                        <input
                            type="text"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Mavzu nomi bo'yicha qidirish"
                            className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                        />
                        {searchValue ? (
                            <button
                                type="button"
                                onClick={() => setSearchValue('')}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200/70 text-slate-500 transition hover:bg-slate-200"
                                aria-label="Qidiruvni tozalash"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        ) : null}
                    </div>
                    <div className="mt-3 flex items-center justify-between px-1">
                        <p className="text-xs font-medium text-slate-500">
                            {deferredSearchValue ? `"${deferredSearchValue}" bo'yicha natijalar` : "Barcha mavzular ko'rsatilmoqda"}
                        </p>
                        <p className="text-xs font-semibold text-indigo-600">
                            {isTopicsLoading ? "Qidirilmoqda..." : `${topicStats.length} ta mavzu`}
                        </p>
                    </div>
                </motion.div>

                {/* Section Header */}
                <div className="flex items-center justify-between pt-2">
                    <h2 className="text-lg font-bold text-gray-800">Mavzular bo'yicha</h2>
                    <div className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg">
                        {topicStats.length} ta mavzu
                    </div>
                </div>

                {/* Topic Statistics List */}
                <div className="space-y-3">
                    {isTopicsLoading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl p-4 shadow-md border-2 border-gray-100 animate-pulse"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="h-4 w-40 rounded bg-slate-200 mb-2" />
                                        <div className="h-3 w-16 rounded bg-slate-200" />
                                    </div>
                                    <div className="h-8 w-14 rounded-lg bg-slate-200" />
                                </div>
                                <div className="grid grid-cols-3 gap-3 mb-3">
                                    <div className="h-12 rounded-lg bg-slate-200" />
                                    <div className="h-12 rounded-lg bg-slate-200" />
                                    <div className="h-12 rounded-lg bg-slate-200" />
                                </div>
                                <div className="h-2.5 rounded-full bg-slate-200" />
                            </div>
                        ))
                    ) : topicsError ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                            <p className="text-sm text-rose-700">{topicsError}</p>
                        </div>
                    ) : topicStats.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <p className="text-sm text-slate-600">Bu fan uchun mavzu statistikasi hozircha mavjud emas.</p>
                        </div>
                    ) : (
                        topicStats.map((stat, index) => {
                            const percentage = Math.max(0, Math.min(stat.percentage, 100));
                            const performance = getPerformanceLevel(percentage);

                            return (
                                <motion.div
                                    key={`${stat.subject_name}-${stat.topic_name}-${index}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + index * 0.05 }}
                                    className="bg-white rounded-2xl p-4 shadow-md border-2 border-gray-100 hover:border-indigo-200 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 mb-1">{stat.topic_name}</h3>
                                            <p className="text-xs text-gray-500 font-medium">{stat.subject_name}</p>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-lg ${performance.bgColor} ${performance.borderColor} border`}>
                                            <p className={`text-xs font-bold ${performance.textColor}`}>
                                                {Math.round(percentage)}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">To'g'ri</p>
                                                <p className="text-sm font-bold text-green-600">{stat.correct_answer}</p>
                                            </div>
                                        </div>

                                        <div className="w-px h-8 bg-gray-200"></div>

                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                                <XCircle className="w-4 h-4 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Noto'g'ri</p>
                                                <p className="text-sm font-bold text-red-600">{stat.wrong_answer}</p>
                                            </div>
                                        </div>

                                        <div className="w-px h-8 bg-gray-200"></div>

                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                <Target className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Jami</p>
                                                <p className="text-sm font-bold text-indigo-600">{stat.total_answer}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 0.8, delay: 0.2 + index * 0.05 }}
                                                className={`h-full bg-gradient-to-r ${getProgressColor(percentage)} rounded-full`}
                                            />
                                        </div>
                                        {percentage > 15 && (
                                            <div className="absolute inset-0 flex items-center px-2">
                                                <p className="text-[10px] font-bold text-white drop-shadow">
                                                    {Math.round(percentage)}%
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${performance.color}`}></div>
                                            <p className={`text-xs font-bold ${performance.textColor}`}>
                                                {performance.level}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-indigo-600 text-xs font-semibold">
                                            Batafsil
                                            <ChevronRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl p-5 shadow-lg"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">Foydali maslahat</h3>
                            <p className="text-white/90 text-sm leading-relaxed">
                                Eng kam foizli mavzularni qayta takrorlang va ko'proq mashq qiling. Natijangizni yaxshilash uchun xatolarni tahlil qilishni unutmang!
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <BottomNavigation />
        </div>
    );
}
