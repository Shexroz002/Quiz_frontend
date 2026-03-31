import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Calendar, Users, CheckCircle2, XCircle, Search, ChevronRight, Clock, X, Minus, Award, BookOpen, Download } from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';

interface QuizSessionHistoryItem {
  session_id: number;
  user_id: number;
  title: string;
  subject: string | null;
  rank: number;
  participant_count: number;
  correct_answers: number;
  wrong_answers: number;
  total_questions: number;
  finished_at: string | null;
  created_at: string;
}

interface LeaderboardItem {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  profile_image: string | null;
  score: number;
  wrong_answers: number;
  total_questions: number;
  spend_time_seconds: string;
}

type FilterType = 'all' | 'best' | 'worst';

const QUIZ_HISTORY_URL = 'http://127.0.0.1:8000/api/v1/student/sessions/me/history/';
const QUIZ_LEADERBOARD_BASE_URL = 'http://127.0.0.1:8000/api/v1/student/sessions';

const getAccessToken = () => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Yakunlanmagan';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Noma\'lum vaqt';
  }

  return date.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatFriendlyCardDate = (value: string | null) => {
  if (!value) {
    return 'Yakunlanmagan';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Noma\'lum sana';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000));

  const timeLabel = date.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (diffDays === 0) {
    return `Bugun, ${timeLabel}`;
  }

  if (diffDays === 1) {
    return `Kecha, ${timeLabel}`;
  }

  if (diffDays > 1 && diffDays <= 6) {
    const weekDays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    return `${weekDays[date.getDay()]}, ${timeLabel}`;
  }

  const shortDate = date.toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'short',
  });
  return `${shortDate}, ${timeLabel}`;
};

const getRankBadge = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

const formatSpendSeconds = (value: string) => {
  const raw = Number.parseFloat(value);
  if (!Number.isFinite(raw) || raw < 0) return "0 soniya";

  const totalSeconds = Math.round(raw);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds} soniya`;
  return `${minutes} daq ${seconds} son`;
};

const getDisplayUserName = (firstName: string | null, lastName: string | null, fallbackId: number) => {
  const fullName = `${firstName?.trim() || ''} ${lastName?.trim() || ''}`.trim();
  return fullName || `Foydalanuvchi ${fallbackId}`;
};

function CircleProgress({
  pct,
  size = 120,
  r = 46,
  stroke = '#22C55E',
  track = '#E2E8F0',
  strokeWidth = 8,
}: {
  pct: number;
  size?: number;
  r?: number;
  stroke?: string;
  track?: string;
  strokeWidth?: number;
}) {
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NatijalarPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<QuizSessionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedSession, setSelectedSession] = useState<QuizSessionHistoryItem | null>(null);
  const [ratingSession, setRatingSession] = useState<QuizSessionHistoryItem | null>(null);
  const [ratingLeaderboard, setRatingLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [ratingErrorMessage, setRatingErrorMessage] = useState('');

  const loadHistory = useCallback(async (search: string) => {
    setIsLoading(true);
    setErrorMessage('');

    const accessToken = getAccessToken();
    if (!accessToken) {
      setErrorMessage("Token topilmadi. Avval tizimga kirib ko'ring.");
      setSessions([]);
      setIsLoading(false);
      return;
    }

    try {
      const searchValue = search.trim();
      const searchParams = new URLSearchParams();
      if (searchValue) {
        searchParams.set('search', searchValue);
      }
      const url = searchParams.toString()
        ? `${QUIZ_HISTORY_URL}?${searchParams.toString()}`
        : QUIZ_HISTORY_URL;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Natijalar tarixini yuklab bo\'lmadi.');
      }

      const payload = (await response.json()) as QuizSessionHistoryItem[];
      setSessions(Array.isArray(payload) ? payload : []);
    } catch {
      setErrorMessage("Natijalar tarixini yuklab bo'lmadi. Qayta urinib ko'ring.");
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadHistory(searchQuery);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadHistory, searchQuery]);

  const filteredSessions = useMemo(() => {
    let data = sessions;
    if (filterType === 'best') {
      return [...data].sort((a, b) => b.correct_answers - a.correct_answers);
    }

    if (filterType === 'worst') {
      return [...data].sort((a, b) => b.wrong_answers - a.wrong_answers);
    }

    return data;
  }, [sessions, searchQuery, filterType]);
  const hasSearchQuery = searchQuery.trim().length > 0;
  const summaryStats = useMemo(() => {
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalMinutes = 0;
    let bestScore = 0;

    for (const session of sessions) {
      const questions = session.total_questions > 0
        ? session.total_questions
        : session.correct_answers + session.wrong_answers;
      const score = questions > 0 ? Math.round((session.correct_answers / questions) * 100) : 0;
      const startDate = new Date(session.created_at);
      const finishDate = new Date(session.finished_at || session.created_at);
      const durationMinutes = Number.isNaN(startDate.getTime()) || Number.isNaN(finishDate.getTime())
        ? 0
        : Math.max(Math.round((finishDate.getTime() - startDate.getTime()) / 60000), 0);

      totalQuestions += questions;
      totalCorrect += session.correct_answers;
      totalMinutes += durationMinutes;
      bestScore = Math.max(bestScore, score);
    }

    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return {
      sessionsCount: sessions.length,
      bestScore,
      totalMinutes,
      totalQuestions,
      accuracy,
    };
  }, [sessions]);
  useEffect(() => {
    if (!ratingSession) {
      setRatingLeaderboard([]);
      setRatingErrorMessage('');
      setIsRatingLoading(false);
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setRatingLeaderboard([]);
      setRatingErrorMessage("Token topilmadi. Avval tizimga kirib ko'ring.");
      setIsRatingLoading(false);
      return;
    }

    const loadLeaderboard = async () => {
      setIsRatingLoading(true);
      setRatingErrorMessage('');

      try {
        const response = await fetch(`${QUIZ_LEADERBOARD_BASE_URL}/${ratingSession.session_id}/leaderboard/`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Reyting yuklanmadi');
        }

        const payload = (await response.json()) as LeaderboardItem[] | { results?: LeaderboardItem[] };
        const rows = Array.isArray(payload) ? payload : payload.results ?? [];
        setRatingLeaderboard(rows);
      } catch {
        setRatingLeaderboard([]);
        setRatingErrorMessage("Reyting ma'lumotlarini yuklab bo'lmadi. Qayta urinib ko'ring.");
      } finally {
        setIsRatingLoading(false);
      }
    };

    void loadLeaderboard();
  }, [ratingSession]);

  const currentUserLeaderboardIndex = useMemo(() => {
    if (!ratingSession || ratingLeaderboard.length === 0) return -1;
    return ratingLeaderboard.findIndex((entry) => entry.user_id === ratingSession.user_id);
  }, [ratingLeaderboard, ratingSession]);
  const currentUserLeaderboard = currentUserLeaderboardIndex >= 0
    ? ratingLeaderboard[currentUserLeaderboardIndex]
    : null;
  const handleDownloadRatingPdf = useCallback(() => {
    if (!ratingSession || ratingLeaderboard.length === 0) {
      return;
    }

    const reportTitle = `${ratingSession.title} - Reyting hisobot`;
    const generatedAt = new Date().toLocaleString('uz-UZ');

    const rowsHtml = ratingLeaderboard
      .map((row, index) => {
        const rank = index + 1;
        const percent = row.total_questions > 0
          ? Math.round((row.score / row.total_questions) * 100)
          : 0;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

        return `
          <tr>
            <td>${medal}</td>
            <td>${getDisplayUserName(row.first_name, row.last_name, row.user_id)}</td>
            <td>${row.user_id}</td>
            <td>${row.score} / ${row.total_questions}</td>
            <td>${row.wrong_answers}</td>
            <td>${percent}%</td>
            <td>${formatSpendSeconds(row.spend_time_seconds)}</td>
          </tr>
        `;
      })
      .join('');

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      setRatingErrorMessage("PDF oynasini ochib bo'lmadi. Brauzer popup'ni bloklagan bo'lishi mumkin.");
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html lang="uz">
      <head>
        <meta charset="utf-8" />
        <title>${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          .meta { margin-bottom: 16px; color: #475569; font-size: 13px; }
          .summary { margin-bottom: 16px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
          .summary p { margin: 4px 0; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>${reportTitle}</h1>
        <div class="meta">
          <div>Sana: ${generatedAt}</div>
          <div>Session ID: ${ratingSession.session_id}</div>
        </div>
        <div class="summary">
          <p><strong>Fan:</strong> ${ratingSession.subject || "Fan ko'rsatilmagan"}</p>
          <p><strong>Ishtirokchilar:</strong> ${ratingLeaderboard.length}</p>
          <p><strong>Sizning o'rningiz:</strong> #${currentUserLeaderboardIndex >= 0 ? currentUserLeaderboardIndex + 1 : ratingSession.rank}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>O'rin</th>
              <th>Ism</th>
              <th>User ID</th>
              <th>Ball</th>
              <th>Xato</th>
              <th>Foiz</th>
              <th>Vaqt</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [currentUserLeaderboardIndex, ratingLeaderboard, ratingSession]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#5B5FEF] via-[#676AF5] to-[#7C7FF6] px-4 pt-6 pb-6 rounded-b-[24px] shadow-lg">
        <div className="absolute -top-7 -right-4 w-28 h-28 rounded-full bg-white/10 blur-[1px]" />
        <div className="absolute -bottom-10 -left-8 w-32 h-32 rounded-full bg-white/10 blur-[1px]" />

        <div className="relative flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-white text-sm font-semibold tracking-wide flex-1 text-center pr-12">Natijalar</h1>
          <button
            type="button"
            className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-sm"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-white/70 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Quiz yoki fan qidirish..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-white/20 bg-white/15 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/35"
          />
        </div>

        <div className="mt-3 rounded-2xl bg-white/12 border border-white/20 p-3 backdrop-blur-sm">
          <div className="flex gap-3">
            <div className="w-[78px] h-[78px] rounded-full border border-white/35 bg-white/10 flex items-center justify-center relative shrink-0">
              <CircleProgress
                pct={summaryStats.accuracy}
                size={68}
                r={27}
                stroke="#ffffff"
                track="rgba(255,255,255,0.28)"
                strokeWidth={5}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <span className="text-base font-bold leading-none">{summaryStats.accuracy}%</span>
                <span className="text-[9px] text-white/80 mt-1">Natijalar</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 flex-1 text-white">
              <div className="rounded-xl bg-white/14 px-3 py-2">
                <p className="text-[10px] text-white/70">📁 Sessiyalar</p>
                <p className="text-sm font-semibold leading-tight">{summaryStats.sessionsCount}</p>
              </div>
              <div className="rounded-xl bg-white/14 px-3 py-2">
                <p className="text-[10px] text-white/70">🏆 Eng yuqori</p>
                <p className="text-sm font-semibold leading-tight">{summaryStats.bestScore}%</p>
              </div>
              <div className="rounded-xl bg-white/14 px-3 py-2">
                <p className="text-[10px] text-white/70">🕒 Jami vaqt</p>
                <p className="text-sm font-semibold leading-tight">{summaryStats.totalMinutes} daq</p>
              </div>
              <div className="rounded-xl bg-white/14 px-3 py-2">
                <p className="text-[10px] text-white/70">❓ Savollar</p>
                <p className="text-sm font-semibold leading-tight">{summaryStats.totalQuestions}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-3 space-y-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${filterType === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setFilterType('best')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${filterType === 'best' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Eng yaxshi
            </button>
            <button
              onClick={() => setFilterType('worst')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${filterType === 'worst' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}
            >
              Eng qiyin
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Natijalar yuklanmoqda...</p>
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <button onClick={() => void loadHistory(searchQuery)} className="text-sm font-semibold text-red-700">
              Qayta
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && filteredSessions.length === 0 && !hasSearchQuery && (
          <div className="rounded-3xl p-[1px] bg-gradient-to-br from-indigo-200/70 via-sky-100/80 to-emerald-100/80 shadow-sm">
            <div className="bg-white/90 backdrop-blur rounded-3xl p-6 border border-white">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <BookOpen className="h-7 w-7" />
              </div>
              <p className="text-center text-base font-semibold text-slate-800 leading-relaxed">
                Siz hali test ishlamagansiz! Test ishlash uchun testlar bo&apos;limiga o&apos;ting.
              </p>
              <p className="mt-2 text-center text-sm text-slate-500">
                Testni boshlang va natijalaringiz shu yerda ko&apos;rinadi.
              </p>
            </div>
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={() => navigate('/tests-list')}
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,0.9)] hover:bg-indigo-700 active:scale-[0.99] transition-all"
              >
                Testlarga o&apos;tish
              </button>
            </div>
          </div>
        )}

        {!isLoading && !errorMessage && filteredSessions.length === 0 && hasSearchQuery && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Natijalar topilmadi.</p>
          </div>
        )}

        {!isLoading && !errorMessage && filteredSessions.map((session) => {
          const totalQuestions = session.total_questions > 0
            ? session.total_questions
            : session.correct_answers + session.wrong_answers;
          const accuracy = totalQuestions > 0 ? Math.round((session.correct_answers / totalQuestions) * 100) : 0;
          const scoreTone = accuracy >= 85 ? 'text-emerald-500' : accuracy >= 60 ? 'text-amber-500' : 'text-rose-500';
          const startDate = new Date(session.created_at);
          const finishDate = new Date(session.finished_at || session.created_at);
          const durationMinutes = Number.isNaN(startDate.getTime()) || Number.isNaN(finishDate.getTime())
            ? 0
            : Math.max(Math.round((finishDate.getTime() - startDate.getTime()) / 60000), 0);

          return (
            <button
              key={session.session_id}
              type="button"
              onClick={() => setSelectedSession(session)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-indigo-200 transition-all text-left"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-500 bg-emerald-50 flex items-center justify-center shrink-0">
                  <span className="text-lg">📐</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-[17px] font-bold text-slate-800 truncate">{session.title}</h3>
                      <p className="text-sm text-indigo-500 truncate">{session.subject || "Fan ko'rsatilmagan"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xl font-black leading-tight ${scoreTone}`}>{accuracy}%</p>
                      <div className="flex items-center justify-end gap-1 text-amber-500 text-xs font-semibold">
                        <span>{getRankBadge(session.rank)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1.5 text-xs">
                    <div className="flex items-center gap-3 text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {session.correct_answers}
                      </span>
                      <span className="flex items-center gap-1 text-rose-500">
                        <XCircle className="w-3.5 h-3.5" />
                        {session.wrong_answers}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Users className="w-3.5 h-3.5" />
                        {session.participant_count}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <BookOpen className="w-3.5 h-3.5" />
                        {totalQuestions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {durationMinutes} daq
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatFriendlyCardDate(session.finished_at || session.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setRatingSession(session);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
                    >
                      <Award className="w-3.5 h-3.5" />
                      Reyting
                    </button>
                  </div>
                </div>
                <div className="self-center">
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedSession && (() => {
        const totalQuestions = selectedSession.total_questions > 0
          ? selectedSession.total_questions
          : selectedSession.correct_answers + selectedSession.wrong_answers;
        const correctAnswers = selectedSession.correct_answers;
        const wrongAnswers = selectedSession.wrong_answers;
        const skippedAnswers = Math.max(totalQuestions - correctAnswers - wrongAnswers, 0);
        const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

        const startDate = new Date(selectedSession.created_at);
        const finishDate = new Date(selectedSession.finished_at || selectedSession.created_at);
        const durationMinutes = Math.max(Math.round((finishDate.getTime() - startDate.getTime()) / 60000), 0);
        const displayDate = formatDateTime(selectedSession.finished_at || selectedSession.created_at).split(',')[0];

        return (
          <div
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-[2px] flex items-end justify-center"
            onClick={() => setSelectedSession(null)}
          >
            <div
              className="w-full max-w-md bg-white rounded-t-[30px] p-5 pb-12 max-h-[92vh] overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm text-indigo-400 mb-1">{selectedSession.subject || "Fan ko'rsatilmagan"}</p>
                  <h3 className="text-2xl font-bold text-slate-800 leading-tight">{selectedSession.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="flex items-center justify-center mb-4">
                <div className="relative flex items-center justify-center">
                  <CircleProgress pct={accuracy} />
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-emerald-500 leading-none">{accuracy}%</span>
                    <span className="text-xs text-slate-400 mt-1">ball</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-emerald-600 leading-none">{correctAnswers}</p>
                  <p className="text-xs text-emerald-500 mt-1">To'g'ri</p>
                </div>
                <div className="bg-rose-50 rounded-2xl p-3 text-center">
                  <XCircle className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-rose-600 leading-none">{wrongAnswers}</p>
                  <p className="text-xs text-rose-500 mt-1">Noto'g'ri</p>
                </div>
                <div className="bg-slate-100 rounded-2xl p-3 text-center">
                  <Minus className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-slate-500 leading-none">{skippedAnswers}</p>
                  <p className="text-xs text-slate-400 mt-1">O'tkazilgan</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div className="bg-emerald-400" style={{ width: `${totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0}%` }} />
                  <div className="bg-rose-400" style={{ width: `${totalQuestions > 0 ? (wrongAnswers / totalQuestions) * 100 : 0}%` }} />
                  <div className="bg-slate-200 flex-1" />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-emerald-500">{correctAnswers} to'g'ri</span>
                  <span className="text-xs text-slate-400">{totalQuestions} ta savol</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /> Ishtirokchilar</span>
                  <span className="text-sm font-semibold text-slate-700">{selectedSession.participant_count} ta o'quvchi</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Vaqt sarflandi</span>
                  <span className="text-sm font-semibold text-slate-700">{durationMinutes} daqiqa</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Award className="w-4 h-4 text-amber-400" /> O'rnim</span>
                  <span className="text-sm font-semibold text-slate-700">#{selectedSession.rank} / {selectedSession.participant_count}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-400" /> Sana</span>
                  <span className="text-sm font-semibold text-slate-700">{displayDate}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-400" /> Session ID</span>
                  <span className="text-sm font-semibold text-slate-700">#{selectedSession.session_id}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {ratingSession && (
        <div
          className="fixed inset-0 z-[130] bg-black/45 backdrop-blur-[2px] flex items-end justify-center"
          onClick={() => setRatingSession(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-[30px] p-5 pb-8 max-h-[86vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-indigo-400">{ratingSession.subject || "Fan ko'rsatilmagan"}</p>
                <h3 className="text-2xl font-bold text-slate-800 leading-tight">{ratingSession.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {ratingSession.participant_count} ishtirokchi • {formatFriendlyCardDate(ratingSession.finished_at || ratingSession.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadRatingPdf}
                  disabled={isRatingLoading || ratingLeaderboard.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF yuklab olish
                </button>
                <button
                  type="button"
                  onClick={() => setRatingSession(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Sizning o'rningiz</span>
                <span className="font-bold text-slate-800">
                  #{currentUserLeaderboardIndex >= 0 ? currentUserLeaderboardIndex + 1 : ratingSession.rank}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${Math.max(
                      8,
                      Math.min(
                        100,
                        currentUserLeaderboard
                          ? Math.round((currentUserLeaderboard.score / Math.max(currentUserLeaderboard.total_questions, 1)) * 100)
                          : 100 - ((ratingSession.rank - 1) / Math.max(ratingSession.participant_count, 1)) * 100,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {isRatingLoading && (
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-sm text-slate-500">Reyting yuklanmoqda...</p>
                </div>
              )}

              {!isRatingLoading && ratingErrorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm text-rose-700">{ratingErrorMessage}</p>
                </div>
              )}

              {!isRatingLoading && !ratingErrorMessage && ratingLeaderboard.length === 0 && (
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-sm text-slate-500">Reyting ma&apos;lumotlari topilmadi.</p>
                </div>
              )}

              {!isRatingLoading && !ratingErrorMessage && ratingLeaderboard.map((row, index) => {
                const rank = index + 1;
                const percent = row.total_questions > 0
                  ? Math.round((row.score / row.total_questions) * 100)
                  : 0;
                const isMe = ratingSession.user_id === row.user_id;

                return (
                  <div
                    key={`${row.user_id}-${rank}`}
                    className={`rounded-2xl border p-3 ${isMe ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-100'}`}
                  >
                    <div className="flex items-center gap-3">
                      {rank === 1 ? (
                        <span className="w-8 text-xl text-center" aria-label="1-o'rin">🥇</span>
                      ) : rank === 2 ? (
                        <span className="w-8 text-xl text-center" aria-label="2-o'rin">🥈</span>
                      ) : rank === 3 ? (
                        <span className="w-8 text-xl text-center" aria-label="3-o'rin">🥉</span>
                      ) : (
                        <span className="w-8 text-base font-bold text-slate-400">#{rank}</span>
                      )}
                      <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-sm shrink-0">
                        {row.profile_image ? (
                          <img
                            src={row.profile_image}
                            alt={getDisplayUserName(row.first_name, row.last_name, row.user_id)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>👤</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-700">
                            {getDisplayUserName(row.first_name, row.last_name, row.user_id)} {isMe ? '(Siz)' : ''}
                          </p>
                          <p className="text-sm font-bold text-amber-500">
                            {row.score}
                            <span className="text-xs text-slate-400"> / {row.total_questions}</span>
                          </p>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="text-rose-500">Xato: {row.wrong_answers}</span>
                          <span className="text-slate-500">{formatSpendSeconds(row.spend_time_seconds)}</span>
                          <span className="text-amber-500 font-semibold">{percent}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
              <p className="text-sm font-semibold text-emerald-700">Reyting tizimi</p>
              <p className="text-xs text-emerald-600 mt-1">
                Ishtirokchilar to&apos;g&apos;ri javoblar soniga qarab tartiblangan.
              </p>
            </div>
          </div>
        </div>
      )}

      {!selectedSession && <BottomNavigation />}
    </div>
  );
}
