import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import {
  Bell,
  BookOpen,
  ClipboardList,
  Trophy,
  Star,
  Brain,
  BarChart3,
  ChevronRight,
  UserPlus,
  X
} from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';
import { NotificationToast } from '../components/NotificationToast';

interface NotificationCountUpdateEvent {
  type: 'notification_count_update';
  data: {
    count: number;
  };
}

interface TestInviteNotificationEvent {
  type: 'test_invite_notification';
  data: {
    id: number;
    type: string;
    action_type: string;
    title: string;
    message: string;
    payload?: {
      session_code?: string;
      session_id?: number;
    };
    sender?: {
      id: number;
      first_name: string | null;
      last_name: string | null;
      profile_image: string | null;
    };
  };
}

type NotificationSocketEvent = NotificationCountUpdateEvent | TestInviteNotificationEvent;

const NOTIFICATIONS_WS_BASE_URL = 'ws://localhost:8000/ws/notifications';
const MULTIPLAYER_JOIN_URL = 'http://127.0.0.1:8000/api/v1/quiz/sessions/multiplayer/join/';
const AUTH_ME_URL = 'http://127.0.0.1:8000/api/v1/auth/me/';

type CurrentUser = {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  profile_image: string | null;
};

const getAccessToken = () => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

const getUserIdFromToken = (token: string): number | null => {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded) as { sub?: string | number };
    const userId = Number(parsed.sub);
    return Number.isFinite(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
};

const getSenderName = (event: TestInviteNotificationEvent['data']) => {
  const firstName = event.sender?.first_name?.trim() ?? '';
  const lastName = event.sender?.last_name?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Foydalanuvchi';
};

const getDisplayName = (user: {
  first_name: string | null;
  last_name: string | null;
  username: string;
}) => {
  const firstName = user.first_name?.trim() ?? '';
  const lastName = user.last_name?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || user.username;
};

const toAbsoluteAvatarUrl = (avatarUrl: string | null | undefined) => {
  if (!avatarUrl || !avatarUrl.trim()) return '';
  if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl;
  return `http://localhost:8000/${avatarUrl.replace(/^\/+/, '')}`;
};

const parseNotificationSocketEvent = (raw: unknown): NotificationSocketEvent | null => {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as { type?: unknown; data?: unknown; event?: unknown };
  const type = typeof candidate.type === 'string'
    ? candidate.type
    : typeof candidate.event === 'string'
      ? candidate.event
      : '';

  if (!type || !candidate.data || typeof candidate.data !== 'object') {
    return null;
  }

  if (type === 'notification_count_update') {
    const countRaw = (candidate.data as { count?: unknown }).count;
    const count = Number(countRaw);
    if (!Number.isFinite(count) || count < 0) return null;

    return {
      type: 'notification_count_update',
      data: { count: Math.floor(count) },
    };
  }

  if (type === 'test_invite_notification') {
    const inviteData = candidate.data as TestInviteNotificationEvent['data'];
    if (!inviteData || typeof inviteData.id !== 'number') return null;

    return {
      type: 'test_invite_notification',
      data: inviteData,
    };
  }

  return null;
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [inviteNotification, setInviteNotification] = useState<TestInviteNotificationEvent['data'] | null>(null);
  const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
  const [inviteErrorMessage, setInviteErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [sessionCodeInput, setSessionCodeInput] = useState('');
  const [joinSessionError, setJoinSessionError] = useState('');
  const [isJoiningSession, setIsJoiningSession] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchCurrentUser = async () => {
      const accessToken = getAccessToken();
      if (!accessToken) return;

      try {
        const response = await fetch(AUTH_ME_URL, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) return;

        const payload = (await response.json()) as CurrentUser;
        if (!isMounted) return;
        setCurrentUser(payload);
      } catch {
        // Keep dashboard header fallbacks if user info cannot be fetched.
      }
    };

    void fetchCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const accessToken = getAccessToken();
    const userId = accessToken ? getUserIdFromToken(accessToken) : null;

    if (!accessToken || !userId) {
      return;
    }

    const wsUrls = [
      `${NOTIFICATIONS_WS_BASE_URL}/${userId}?token=${encodeURIComponent(accessToken)}`,
      `${NOTIFICATIONS_WS_BASE_URL}/${userId}/?token=${encodeURIComponent(accessToken)}`,
      `${NOTIFICATIONS_WS_BASE_URL}?token=${encodeURIComponent(accessToken)}`,
      `${NOTIFICATIONS_WS_BASE_URL}/?token=${encodeURIComponent(accessToken)}`,
    ];

    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let reconnectAttempt = 0;
    let urlIndex = 0;
    let isCancelled = false;

    const clearReconnectTimer = () => {
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const connect = () => {
      if (isCancelled) return;
      const nextUrl = wsUrls[urlIndex] ?? wsUrls[0];

      try {
        socket = new WebSocket(nextUrl);
      } catch {
        urlIndex = (urlIndex + 1) % wsUrls.length;
        reconnectAttempt += 1;
        const delay = Math.min(1000 * 2 ** reconnectAttempt, 10000);
        reconnectTimer = window.setTimeout(connect, delay);
        return;
      }

      socket.onopen = () => {
        reconnectAttempt = 0;
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as unknown;
          const parsedEvent = parseNotificationSocketEvent(payload);
          if (!parsedEvent) return;

          if (parsedEvent.type === 'notification_count_update') {
            setNotificationCount(parsedEvent.data.count);
            return;
          }

          if (parsedEvent.type === 'test_invite_notification') {
            setInviteNotification(parsedEvent.data);
            setInviteErrorMessage('');
            setShowNotification(true);
            setNotificationCount((prev) => prev + 1);
          }
        } catch {
        }
      };

      socket.onclose = () => {
        if (isCancelled) return;
        urlIndex = (urlIndex + 1) % wsUrls.length;
        reconnectAttempt += 1;
        const delay = Math.min(1000 * 2 ** reconnectAttempt, 10000);
        clearReconnectTimer();
        reconnectTimer = window.setTimeout(connect, delay);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      isCancelled = true;
      clearReconnectTimer();
      socket?.close();
    };
  }, []);

  const displayName = currentUser ? getDisplayName(currentUser) : '';
  const displayRole = currentUser?.role?.trim() || '';
  const profileImageUrl = toAbsoluteAvatarUrl(currentUser?.profile_image);

  const joinMultiplayerSession = async (sessionCode: string, fallbackSessionId?: number) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error("Token topilmadi. Avval tizimga kirib ko'ring.");
    }

    const normalizedCode = sessionCode.trim().toUpperCase();
    if (!normalizedCode && !fallbackSessionId) {
      throw new Error('Session kodi topilmadi.');
    }

    if (!normalizedCode && fallbackSessionId) {
      return fallbackSessionId;
    }

    const response = await fetch(MULTIPLAYER_JOIN_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ session_code: normalizedCode }),
    });

    if (!response.ok) {
      throw new Error("Sessiyaga qo'shilishda xatolik bo'ldi.");
    }

    const payload = (await response.json()) as { id?: number };
    const joinedSessionId = payload.id ?? fallbackSessionId;
    if (!joinedSessionId || !Number.isFinite(joinedSessionId) || joinedSessionId <= 0) {
      throw new Error('Session ID qaytmadi.');
    }

    return joinedSessionId;
  };

  const handleAcceptNotification = async () => {
    const sessionCode = inviteNotification?.payload?.session_code;
    const fallbackSessionId = inviteNotification?.payload?.session_id;

    setIsAcceptingInvite(true);
    setInviteErrorMessage('');

    try {
      const joinedSessionId = await joinMultiplayerSession(sessionCode ?? '', fallbackSessionId);

      setShowNotification(false);
      setInviteNotification(null);
      setNotificationCount((prev) => Math.max(0, prev - 1));
      navigate(`/competition?sessionId=${joinedSessionId}`, { state: { sessionId: joinedSessionId } });
    } catch {
      setInviteErrorMessage("Taklifni qabul qilishda xatolik bo'ldi. Qayta urinib ko'ring.");
    } finally {
      setIsAcceptingInvite(false);
    }
  };

  const handleJoinWithCode = async () => {
    setJoinSessionError('');

    try {
      setIsJoiningSession(true);
      const joinedSessionId = await joinMultiplayerSession(sessionCodeInput);
      setShowJoinModal(false);
      setSessionCodeInput('');
      navigate(`/competition?sessionId=${joinedSessionId}`, { state: { sessionId: joinedSessionId } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sessiyaga qo'shilishda xatolik bo'ldi.";
      setJoinSessionError(message);
    } finally {
      setIsJoiningSession(false);
    }
  };

  const handleDeclineNotification = () => {
    setShowNotification(false);
    setInviteNotification(null);
    setInviteErrorMessage('');
    setNotificationCount((prev) => Math.max(0, prev - 1));
  };

  const handleDismissNotification = () => {
    setShowNotification(false);
    setInviteNotification(null);
    setInviteErrorMessage('');
    setNotificationCount((prev) => Math.max(0, prev - 1));
  };

  const subjects = [
    { name: 'Matematika', icon: '📐', progress: 75, color: 'from-orange-400 to-orange-500', tests: 12, xp: 450 },
    { name: 'Fizika', icon: '⚛️', progress: 60, color: 'from-blue-400 to-blue-500', tests: 8, xp: 320 },
    { name: 'Ona tili', icon: '📚', progress: 42, color: 'from-purple-400 to-purple-500', tests: 5, xp: 210 },
    { name: 'Ingliz tili', icon: '🌍', progress: 88, color: 'from-green-400 to-green-500', tests: 15, xp: 580 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header with Modern Soft Gradient */}
      <div className="bg-gradient-to-br from-[#5B5FEF] via-[#6366F1] to-[#7C7FF6] px-5 pt-8 pb-8 rounded-b-[28px] shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md border border-white/30 overflow-hidden">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">👨‍🎓</span>
              )}
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium leading-tight">Assalomu alaykum</p>
              {displayRole ? <p className="text-white text-xl font-semibold leading-tight">{displayRole}</p> : null}
              {displayName ? <p className="text-white/80 text-sm leading-tight mt-0.5">{displayName}</p> : null}
            </div>
          </div>

          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2.5 bg-white/15 backdrop-blur-sm rounded-xl hover:bg-white/25 transition-colors"
          >
            <Bell className="w-5 h-5 text-white stroke-[2]" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-[#F59E0B] rounded-full text-white text-[10px] flex items-center justify-center font-bold shadow-md">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 -mt-4 space-y-4">
        {/* Main Action Section */}
        <div className="space-y-3">
          {/* Large Primary Button - Test ishlash */}
          <button
            onClick={() => navigate('/tests-list')}
            className="w-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] rounded-[20px] p-5 shadow-[0_8px_20px_rgba(34,197,94,0.25)] flex items-center justify-between active:scale-[0.98] transition-all min-h-[80px]"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-white stroke-[2]" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold text-[22px] leading-tight mb-1">Test ishlash</h3>
                <p className="text-white/90 text-[14px] leading-tight">Bilimingizni sinang</p>
              </div>
            </div>
            <div className="text-white">
              <ChevronRight className="w-7 h-7 stroke-[2.5]" />
            </div>
          </button>

          {/* Secondary Button - Test yaratish */}
          <button
            onClick={() => navigate('/create-test')}
            className="w-full bg-white rounded-[20px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.06)] flex items-center justify-between active:scale-[0.98] transition-all min-h-[72px]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#5B5FEF]/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#5B5FEF] stroke-[2]" />
              </div>
              <div className="text-left">
                <h3 className="text-[#1E293B] font-semibold text-[17px] leading-tight">Test yaratish</h3>
                <p className="text-[#64748B] text-[14px] leading-tight mt-0.5">PDF yoki AI orqali</p>
              </div>
            </div>
            <div className="text-[#64748B]">
              <ChevronRight className="w-6 h-6 stroke-[2]" />
            </div>
          </button>

          {/* Two Medium Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Natijalar Card */}
            <button
              onClick={() => navigate('/natijalar')}
              className="bg-white rounded-[20px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-all min-h-[120px] flex flex-col items-start"
            >
              <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center mb-3">
                <BarChart3 className="w-6 h-6 text-[#F59E0B] stroke-[2]" />
              </div>
              <h3 className="text-[#1E293B] font-semibold text-[16px] mb-0.5 text-left leading-tight">Natijalar</h3>
              <p className="text-[#64748B] text-[13px] text-left leading-tight">Statistika</p>
            </button>

            {/* Do'stlar bilan ishlash Card */}
            <button
              onClick={() => navigate('/create-room')}
              className="bg-white rounded-[20px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-all min-h-[120px] flex flex-col items-start"
            >
              <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center mb-3">
                <Trophy className="w-6 h-6 text-[#F59E0B] stroke-[2]" />
              </div>
              <h3 className="text-[#1E293B] font-semibold text-[16px] mb-0.5 text-left leading-tight">Do'stlar bilan ishlash</h3>
              <p className="text-[#64748B] text-[13px] text-left leading-tight">Real vaqtda</p>
            </button>
          </div>

          <button
            onClick={() => {
              setJoinSessionError('');
              setShowJoinModal(true);
            }}
            className="w-full rounded-[22px] border border-[#C7D2FE] bg-gradient-to-r from-[#EEF2FF] via-white to-[#ECFEFF] p-5 shadow-[0_10px_24px_rgba(99,102,241,0.12)] active:scale-[0.985] transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 text-left">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4F46E5_0%,#06B6D4_100%)] text-white shadow-md">
                  <UserPlus className="w-7 h-7 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-[19px] font-semibold leading-tight text-slate-900">Testga qo'shilish</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-slate-600">
                    Session kodini kiriting va musobaqaga qo'shiling.
                  </p>
                </div>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#4F46E5] shadow-sm">
                <ChevronRight className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>
          </button>
        </div>

        {/* Subject Progress Section */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.06)] mt-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-[#5B5FEF]/10 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-[#5B5FEF] stroke-[2]" />
            </div>
            <div>
              <h3 className="text-[#1E293B] font-semibold text-[18px] leading-tight">Mening fanlarim</h3>
              <p className="text-[#64748B] text-[13px] leading-tight">Hozirgi o'rganayotgan fanlar</p>
            </div>
          </div>

          <div className="space-y-3">
            {subjects.map((subject) => (
              <div
                key={subject.name}
                className="bg-[#F8FAFC] rounded-[18px] p-4 border border-gray-100/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                    {subject.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-[#1E293B] font-semibold text-[16px] leading-tight">{subject.name}</h4>
                      <span className="text-[#5B5FEF] font-bold text-[20px] leading-tight">{subject.progress}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-[13px] text-[#64748B]">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="w-3.5 h-3.5 stroke-[2]" />
                        {subject.tests} test
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-[#F59E0B] stroke-[2]" fill="currentColor" />
                        {subject.xp} XP
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-2 bg-gray-200/60 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${subject.progress}%` }}
                    className={`h-full bg-gradient-to-r ${subject.color} rounded-full transition-all duration-300`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Notification Toast */}
      <NotificationToast
        id={String(inviteNotification?.id ?? '0')}
        type="invitation"
        title="Quiz sessionga taklif"
        senderName={inviteNotification ? getSenderName(inviteNotification) : 'Foydalanuvchi'}
        senderAvatarUrl={toAbsoluteAvatarUrl(inviteNotification?.sender?.profile_image)}
        senderAvatar="👤"
        message={`${inviteNotification?.message || "Sizni testga taklif qilishdi."}${inviteErrorMessage ? ` ${inviteErrorMessage}` : ''}`}
        time="Hozir"
        isVisible={showNotification}
        isAccepting={isAcceptingInvite}
        onAccept={handleAcceptNotification}
        onDecline={handleDeclineNotification}
        onDismiss={handleDismissNotification}
      />

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (isJoiningSession) return;
              setShowJoinModal(false);
            }}
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
            <div className="bg-[linear-gradient(135deg,#EEF2FF_0%,#F8FAFC_55%,#ECFEFF_100%)] px-5 pb-5 pt-5">
              <div className="relative flex flex-col items-center text-center">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  disabled={isJoiningSession}
                  className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-slate-500 shadow-sm transition hover:bg-white disabled:cursor-not-allowed"
                  aria-label="Modalni yopish"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4F46E5_0%,#06B6D4_100%)] text-white shadow-md">
                  <UserPlus className="h-6 w-6 stroke-[2.2]" />
                </div>
                <div className="mt-3">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#6366F1]">Join session</p>
                  <h3 className="mt-1 text-[24px] font-semibold leading-tight text-slate-900">Testga qo'shilish</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-slate-500">
                    Session kodini kiriting va kutish sahifasiga o'ting.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-4">
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <label htmlFor="session-code" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Session kodi
                </label>
                <input
                  id="session-code"
                  type="text"
                  autoFocus
                  value={sessionCodeInput}
                  onChange={(e) => {
                    setSessionCodeInput(e.target.value.toUpperCase());
                    if (joinSessionError) {
                      setJoinSessionError('');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleJoinWithCode();
                    }
                  }}
                  placeholder="Masalan, 55VOOM"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-center text-[24px] font-semibold uppercase tracking-[0.28em] text-slate-900 outline-none transition focus:border-[#6366F1] focus:ring-4 focus:ring-indigo-100"
                />
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                  Kodni bo'sh joysiz kiriting. Tizim sizni avtomatik ravishda musobaqa kutish sahifasiga olib o'tadi.
                </p>
              </div>

              {joinSessionError && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <p className="text-[13px] text-rose-700">{joinSessionError}</p>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  disabled={isJoiningSession}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={() => void handleJoinWithCode()}
                  disabled={isJoiningSession}
                  className="flex-1 rounded-2xl bg-[linear-gradient(135deg,#4F46E5_0%,#06B6D4_100%)] px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_14px_30px_rgba(79,70,229,0.28)] transition hover:shadow-[0_18px_36px_rgba(79,70,229,0.34)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isJoiningSession ? "Qo'shilmoqda..." : "Qo'shilish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
