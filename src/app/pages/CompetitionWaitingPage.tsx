import { useState, useEffect, useRef } from 'react';
import { useBlocker, useLocation, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Info,
  Copy,
  Play,
  UserPlus,
  Search,
  Crown,
  CheckCircle,
  Clock,
  WifiOff,
  Users as UsersIcon,
  Sparkles
} from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

interface Participant {
  id: string;
  userId: number | null;
  name: string;
  avatar: string;
  status: 'Tayyor' | 'Tayyorlanmoqda' | 'Uzildi';
  online: boolean;
  isHost?: boolean;
}

interface JoinNotification {
  id: string;
  name: string;
  avatar: string;
  message: string;
  type: 'connected' | 'disconnected';
}

interface MultiplayerParticipantApi {
  participant_id: number;
  user_id: number | null;
  nickname: string | null;
  profile_image: string | null;
  is_host: boolean;
  first_name: string | null;
  last_name: string | null;
  participant_status: 'preparing' | 'ready' | 'disconnected' | string;
}

interface MultiplayerSessionInfo {
  session_id: number;
  quiz_id: number;
  host_id: number;
  join_code: string;
  status: string;
  duration_minutes: number;
  questions_count: number;
  started_at: string | null;
  finished_at: string | null;
}

interface ContactListItem {
  id: number;
  friend: {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
    role: string | null;
    profile_image: string | null;
  };
}

interface InviteContact {
  id: string;
  recipientId: number;
  name: string;
  username: string;
  avatar: string;
}

const MULTIPLAYER_INFO_BASE_URL = 'http://127.0.0.1:8000/api/v1/quiz/sessions/multiplayer';
const MULTIPLAYER_PARTICIPANTS_SUFFIX = 'participants/';
const MULTIPLAYER_LEAVE_URL = 'http://127.0.0.1:8000/api/v1/quiz/sessions/multiplayer/leave/';
const MULTIPLAYER_WS_BASE_URL = 'ws://localhost:8000/ws/quiz/sessions';
const CONTACT_LIST_URL = 'http://127.0.0.1:8000/api/v1/contact/list/';
const DASHBOARD_ROUTE = '/';

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

export function CompetitionWaitingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [competitionInfo, setCompetitionInfo] = useState<MultiplayerSessionInfo | null>(null);
  const [isInfoLoading, setIsInfoLoading] = useState(true);
  const [infoError, setInfoError] = useState('');
  const [isParticipantsLoading, setIsParticipantsLoading] = useState(true);
  const [participantsError, setParticipantsError] = useState('');
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [startSessionError, setStartSessionError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const [contacts, setContacts] = useState<InviteContact[]>([]);
  const [contactsError, setContactsError] = useState('');
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [invitingContactIds, setInvitingContactIds] = useState<Set<string>>(new Set());
  const [inviteRequestError, setInviteRequestError] = useState('');
  const [joinNotification, setJoinNotification] = useState<JoinNotification | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [isLeavingSession, setIsLeavingSession] = useState(false);
  const [isNavigationUnlocked, setIsNavigationUnlocked] = useState(false);
  const [pendingLeavePath, setPendingLeavePath] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const hasNavigatedToTestRef = useRef(false);
  const skipBeforeUnloadRef = useRef(false);
  const state = location.state as { sessionId?: number } | null;
  const currentUserId = (() => {
    const accessToken = getAccessToken();
    return accessToken ? getUserIdFromToken(accessToken) : null;
  })();
  const sessionId = (() => {
    const querySessionId = Number(searchParams.get('sessionId'));
    if (Number.isFinite(querySessionId) && querySessionId > 0) {
      return Math.floor(querySessionId);
    }

    if (state?.sessionId && Number.isFinite(state.sessionId) && state.sessionId > 0) {
      return Math.floor(state.sessionId);
    }

    return null;
  })();
  const competitionCode = competitionInfo?.join_code ?? '------';
  const joinLink = competitionInfo?.join_code ? `edutest.uz/join/${competitionInfo.join_code}` : 'edutest.uz/join';
  const isCurrentUserHost =
    !!competitionInfo &&
    currentUserId !== null &&
    competitionInfo.host_id === currentUserId;
  const currentParticipant = currentUserId !== null
    ? participants.find((participant) => participant.userId === currentUserId) ?? null
    : null;
  const blocker = useBlocker(!isNavigationUnlocked);

  const buildParticipantName = (item: MultiplayerParticipantApi): string => {
    const fullName = `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim();
    return fullName || item.nickname || `Foydalanuvchi #${item.participant_id}`;
  };

  const buildParticipantAvatar = (item: MultiplayerParticipantApi): string => {
    const avatarUrl = toAbsoluteAvatarUrl(item.profile_image);
    if (avatarUrl) {
      return avatarUrl;
    }

    const source = item.nickname || buildParticipantName(item);
    return source.slice(0, 2).toUpperCase();
  };

  const toAbsoluteAvatarUrl = (avatarUrl: string | null | undefined): string => {
    if (!avatarUrl || !avatarUrl.trim()) {
      return '';
    }

    if (/^https?:\/\//i.test(avatarUrl)) {
      return avatarUrl;
    }

    return `http://localhost:8000/${avatarUrl.replace(/^\/+/, '')}`;
  };

  const buildNameFromParts = (
    firstName: string | null | undefined,
    lastName: string | null | undefined,
    username: string | null | undefined,
    fallbackId: number | string,
  ): string => {
    const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();
    return fullName || username || `Foydalanuvchi #${fallbackId}`;
  };

  const normalizeParticipantName = (value: string) => {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  const findParticipantIndex = (
    list: Participant[],
    candidate: { id: string; userId?: number | null; name: string; avatar: string },
  ) => {
    if (candidate.userId !== null && candidate.userId !== undefined) {
      const userIdMatch = list.findIndex((participant) => participant.userId === candidate.userId);
      if (userIdMatch >= 0) {
        return userIdMatch;
      }
    }

    const directIdMatch = list.findIndex((participant) => participant.id === candidate.id);
    if (directIdMatch >= 0) {
      return directIdMatch;
    }

    const normalizedName = normalizeParticipantName(candidate.name);
    const nameMatch = list.findIndex((participant) => normalizeParticipantName(participant.name) === normalizedName);
    if (nameMatch >= 0) {
      return nameMatch;
    }

    if (candidate.avatar.startsWith('http')) {
      return list.findIndex((participant) => participant.avatar === candidate.avatar);
    }

    return -1;
  };

  const mapParticipantStatus = (status: string | null | undefined): Participant['status'] => {
    switch (status) {
      case 'ready':
        return 'Tayyor';
      case 'disconnected':
        return 'Uzildi';
      case 'preparing':
      default:
        return 'Tayyorlanmoqda';
    }
  };

  const mapParticipantStatusFromWebsocket = (
    eventType: string,
    status: string | null | undefined,
  ): Participant['status'] => {
    if (eventType === 'participant_reconnected') {
      return 'Tayyorlanmoqda';
    }

    if (eventType === 'participant_read') {
      return 'Tayyor';
    }

    if (eventType === 'participant_disconnected') {
      return 'Uzildi';
    }

    return mapParticipantStatus(status);
  };

  const isParticipantOnline = (status: string | null | undefined) => status !== 'disconnected';

  useEffect(() => {
    const loadCompetitionInfo = async () => {
      setIsInfoLoading(true);
      setInfoError('');

      if (!sessionId) {
        setInfoError('Session ID topilmadi. Musobaqani qayta yarating.');
        setCompetitionInfo(null);
        setIsInfoLoading(false);
        return;
      }

      const accessToken = getAccessToken();
      if (!accessToken) {
        setInfoError("Token topilmadi. Avval tizimga kirib ko'ring.");
        setCompetitionInfo(null);
        setIsInfoLoading(false);
        return;
      }

      try {
        const response = await fetch(`${MULTIPLAYER_INFO_BASE_URL}/${sessionId}/info/`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Musobaqa ma'lumotlarini yuklab bo'lmadi.");
        }

        const payload = (await response.json()) as MultiplayerSessionInfo;
        setCompetitionInfo(payload);
      } catch {
        setInfoError("Musobaqa ma'lumotlarini yuklab bo'lmadi. Qayta urinib ko'ring.");
        setCompetitionInfo(null);
      } finally {
        setIsInfoLoading(false);
      }
    };

    void loadCompetitionInfo();
  }, [sessionId]);

  useEffect(() => {
    if (!competitionInfo || competitionInfo.status !== 'running' || hasNavigatedToTestRef.current) {
      return;
    }

    hasNavigatedToTestRef.current = true;
    setShowLeaveModal(false);
    setLeaveError('');
    setPendingLeavePath(null);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
    skipBeforeUnloadRef.current = true;
    setIsNavigationUnlocked(true);
    window.location.assign(`/test-taking?sessionId=${competitionInfo.session_id}`);
  }, [blocker, competitionInfo]);

  useEffect(() => {
    if (blocker.state !== 'blocked') {
      return;
    }

    setPendingLeavePath(`${blocker.location.pathname}${blocker.location.search}${blocker.location.hash}`);
    setLeaveError('');
    setShowLeaveModal(true);
  }, [blocker]);

  useEffect(() => {
    const loadParticipants = async () => {
      setIsParticipantsLoading(true);
      setParticipantsError('');

      if (!sessionId) {
        setParticipantsError('Session ID topilmadi.');
        setParticipants([]);
        setIsParticipantsLoading(false);
        return;
      }

      const accessToken = getAccessToken();
      if (!accessToken) {
        setParticipantsError("Token topilmadi. Avval tizimga kirib ko'ring.");
        setParticipants([]);
        setIsParticipantsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${MULTIPLAYER_INFO_BASE_URL}/${sessionId}/${MULTIPLAYER_PARTICIPANTS_SUFFIX}`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Ishtirokchilar ro'yxatini yuklab bo'lmadi.");
        }

        const payload = (await response.json()) as MultiplayerParticipantApi[];
        const list = Array.isArray(payload) ? payload : [];
        const mapped = list.map((item) => ({
          id: String(item.participant_id),
          userId: typeof item.user_id === 'number' && Number.isFinite(item.user_id) ? item.user_id : null,
          name: buildParticipantName(item),
          avatar: buildParticipantAvatar(item),
          status: mapParticipantStatus(item.participant_status),
          online: isParticipantOnline(item.participant_status),
          isHost: item.is_host,
        }));

        setParticipants(mapped);
      } catch {
        setParticipantsError("Ishtirokchilar ro'yxatini yuklab bo'lmadi.");
        setParticipants([]);
      } finally {
        setIsParticipantsLoading(false);
      }
    };

    void loadParticipants();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }

    const socket = new WebSocket(`${MULTIPLAYER_WS_BASE_URL}/${sessionId}?token=${encodeURIComponent(accessToken)}`);
    let notificationTimer: number | null = null;

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as { event?: string; data?: Record<string, unknown> };
        const eventType = payload.event;
        const data = payload.data ?? {};

        if (!eventType) {
          return;
        }

        if (eventType === 'session_started') {
          const startedSessionId = Number(data.session_id);
          if (Number.isFinite(startedSessionId) && startedSessionId > 0) {
            hasNavigatedToTestRef.current = true;
            setShowLeaveModal(false);
            setLeaveError('');
            setPendingLeavePath(null);
            if (blocker.state === 'blocked') {
              blocker.reset();
            }
            skipBeforeUnloadRef.current = true;
            setIsNavigationUnlocked(true);
            window.location.assign(`/test-taking?sessionId=${Math.floor(startedSessionId)}`);
          }
          return;
        }

        if (
          eventType !== 'participant_joined' &&
          eventType !== 'participant_reconnected' &&
          eventType !== 'participant_read' &&
          eventType !== 'participant_disconnected'
        ) {
          return;
        }

        const userId = Number(data.user_id);
        if (!Number.isFinite(userId) || userId <= 0) {
          return;
        }

        const username = typeof data.username === 'string' ? data.username : null;
        const firstName = typeof data.first_name === 'string' ? data.first_name : null;
        const lastName = typeof data.last_name === 'string' ? data.last_name : null;
        const avatarUrlRaw = typeof data.avatar_url === 'string' ? data.avatar_url : null;
        const resolvedAvatarUrl = toAbsoluteAvatarUrl(avatarUrlRaw);
        const fallbackName = buildNameFromParts(firstName, lastName, username, userId);
        const fallbackAvatar = resolvedAvatarUrl || (username || fallbackName).slice(0, 2).toUpperCase();
        const rawStatus = typeof data.status === 'string' ? data.status : null;
        const nextStatus = mapParticipantStatusFromWebsocket(eventType, rawStatus);
        const nextOnline = isParticipantOnline(rawStatus);
        const isJoinEvent = eventType === 'participant_joined';
        setParticipants((prev) => {
          const candidate = {
            id: String(userId),
            userId,
            name: fallbackName,
            avatar: fallbackAvatar,
          };
          const existingIndex = findParticipantIndex(prev, candidate);

          if (existingIndex >= 0) {
            const currentParticipant = prev[existingIndex];
            const nextParticipant = {
              ...currentParticipant,
              name:
                firstName || lastName || username
                  ? fallbackName
                  : currentParticipant.name,
              avatar: resolvedAvatarUrl || currentParticipant.avatar,
              online: nextOnline,
              status: nextStatus,
            };

            return prev.map((participant, index) =>
              index === existingIndex
                ? nextParticipant
                : participant,
            );
          }

          const nextParticipant = {
            id: String(userId),
            userId,
            name: fallbackName,
            avatar: fallbackAvatar,
            online: nextOnline,
            status: nextStatus,
            isHost: false,
          };

          return [
            ...prev,
            nextParticipant,
          ];
        });

        if (isJoinEvent) {
          setJoinNotification({
            id: String(userId),
            name: fallbackName,
            avatar: fallbackAvatar,
            message: "musobaqaga qo'shildi",
            type: 'connected',
          });

          if (notificationTimer) {
            window.clearTimeout(notificationTimer);
          }
          notificationTimer = window.setTimeout(() => setJoinNotification(null), 3000);
        }
      } catch {
      }
    };

    return () => {
      if (notificationTimer) {
        window.clearTimeout(notificationTimer);
      }
      socket.close();
    };
  }, [blocker, sessionId]);

  useEffect(() => {
    if (isNavigationUnlocked) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (skipBeforeUnloadRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isNavigationUnlocked]);

  useEffect(() => {
    if (!showInviteModal) {
      setInviteSearchQuery('');
      setInviteRequestError('');
      return;
    }

    const loadContacts = async () => {
      setIsContactsLoading(true);
      setContactsError('');

      const accessToken = getAccessToken();
      if (!accessToken) {
        setContacts([]);
        setContactsError("Token topilmadi. Avval tizimga kirib ko'ring.");
        setIsContactsLoading(false);
        return;
      }

      try {
        const response = await fetch(CONTACT_LIST_URL, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Kontaktlar ro'yxatini yuklab bo'lmadi.");
        }

        const payload = (await response.json()) as ContactListItem[] | { results?: ContactListItem[] };
        const list = Array.isArray(payload) ? payload : payload.results ?? [];
        const mapped = list.map((item) => {
          const friend = item.friend;
          const name = buildNameFromParts(friend.first_name, friend.last_name, friend.username, friend.id);
          const avatarUrl = toAbsoluteAvatarUrl(friend.profile_image);
          const avatarFallback = (friend.username || name).slice(0, 2).toUpperCase();

          return {
            id: String(item.id),
            recipientId: friend.id,
            name,
            username: `@${friend.username}`,
            avatar: avatarUrl || avatarFallback,
          } satisfies InviteContact;
        });

        setContacts(mapped);
      } catch {
        setContacts([]);
        setContactsError("Kontaktlar ro'yxatini yuklab bo'lmadi. Qayta urinib ko'ring.");
      } finally {
        setIsContactsLoading(false);
      }
    };

    void loadContacts();
  }, [showInviteModal]);

  const handleInvite = async (contact: InviteContact) => {
    if (!sessionId || !competitionInfo?.join_code) {
      setInviteRequestError("Session ma'lumotlari topilmadi.");
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setInviteRequestError("Token topilmadi. Avval tizimga kirib ko'ring.");
      return;
    }

    setInviteRequestError('');
    setInvitingContactIds((prev) => new Set(prev).add(contact.id));

    try {
      const response = await fetch(
        `${MULTIPLAYER_INFO_BASE_URL}/${sessionId}/invite/?session_code=${encodeURIComponent(competitionInfo.join_code)}`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ recipient_id: contact.recipientId }),
        },
      );

      if (!response.ok) {
        throw new Error("Taklif yuborilmadi.");
      }

      setInvitedFriends((prev) => new Set(prev).add(contact.id));
    } catch {
      setInviteRequestError("Taklif yuborishda xatolik bo'ldi. Qayta urinib ko'ring.");
    } finally {
      setInvitingContactIds((prev) => {
        const next = new Set(prev);
        next.delete(contact.id);
        return next;
      });
    }
  };

  const handleStartCompetition = async () => {
    setStartSessionError('');

    if (!sessionId) {
      setStartSessionError('Session ID topilmadi.');
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setStartSessionError("Token topilmadi. Avval tizimga kirib ko'ring.");
      return;
    }

    setIsStartingSession(true);
    try {
      const response = await fetch(`${MULTIPLAYER_INFO_BASE_URL}/${sessionId}/start/`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Sessiyani boshlashda xatolik.");
      }

      const payload = (await response.json()) as { id?: number | string };
      const startedSessionId = Number(payload.id);
      if (!Number.isFinite(startedSessionId) || startedSessionId <= 0) {
        throw new Error('Session ID qaytmadi.');
      }

      hasNavigatedToTestRef.current = true;
      setIsNavigationUnlocked(true);
      navigate(`/test-taking?sessionId=${Math.floor(startedSessionId)}`);
    } catch {
      setStartSessionError("Testni boshlashda xatolik bo'ldi. Qayta urinib ko'ring.");
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleCopy = () => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = joinLink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Copy failed:', err);
      }

      textArea.remove();
    } catch (err) {
      console.error('Copy operation failed:', err);
    }
  };

  const closeLeaveModal = () => {
    setShowLeaveModal(false);
    setLeaveError('');
    setPendingLeavePath(null);

    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  const handleLeaveRequest = (nextPath?: string) => {
    setPendingLeavePath(nextPath ?? DASHBOARD_ROUTE);
    setLeaveError('');
    setShowLeaveModal(true);
  };

  const handleConfirmLeave = async () => {
    if (!sessionId) {
      setLeaveError('Session ID topilmadi.');
      return;
    }

    if (!currentParticipant) {
      setLeaveError("Ishtirokchi ma'lumotlari topilmadi.");
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setLeaveError("Token topilmadi. Avval tizimga kirib ko'ring.");
      return;
    }

    setIsLeavingSession(true);
    setLeaveError('');

    try {
      const response = await fetch(MULTIPLAYER_LEAVE_URL, {
        method: 'POST',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          participant_id: Number(currentParticipant.id),
        }),
      });

      if (response.status !== 204) {
        throw new Error("Xonadan chiqishda xatolik.");
      }

      skipBeforeUnloadRef.current = true;
      setIsNavigationUnlocked(true);
      setShowLeaveModal(false);

      if (blocker.state === 'blocked') {
        blocker.reset();
      }

      window.location.assign(DASHBOARD_ROUTE);
    } catch {
      setLeaveError("Xonadan chiqib bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setIsLeavingSession(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Tayyor':
        return {
          icon: CheckCircle,
          color: 'bg-green-100 text-green-700 border-green-200',
          text: 'Tayyor'
        };
      case 'Tayyorlanmoqda':
        return {
          icon: Clock,
          color: 'bg-amber-100 text-amber-700 border-amber-200',
          text: 'Tayyorlanmoqda'
        };
      case 'Uzildi':
        return {
          icon: WifiOff,
          color: 'bg-red-100 text-red-700 border-red-200',
          text: 'Uzildi'
        };
      default:
        return {
          icon: Clock,
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          text: status
        };
    }
  };

  const readyCount = participants.filter((participant) => participant.online).length;
  const totalCount = participants.length;
  const filteredContacts = contacts.filter((contact) => {
    const q = inviteSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return contact.name.toLowerCase().includes(q) || contact.username.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#F5F7FB] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleLeaveRequest(DASHBOARD_ROUTE)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-900" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Do'stlar bilan Test
                </h1>
                <p className="text-xs text-gray-500">Kutish xonasi</p>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Info className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Join Notification */}
      <AnimatePresence>
        {joinNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed top-20 left-0 right-0 z-50 flex justify-center"
            style={{ width: '100%', paddingLeft: '5%', paddingRight: '5%' }}
          >
            {/* Floating Notification Card */}
            <motion.button
              onClick={() => { }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white rounded-2xl p-4 shadow-xl border border-gray-100 relative overflow-hidden cursor-pointer hover:shadow-2xl transition-shadow"
              style={{
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)'
              }}
            >
              {/* Sparkle Effects */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 1.5] }}
                transition={{ duration: 1, times: [0, 0.5, 1] }}
                className="absolute top-4 right-4"
              >
                <Sparkles className="w-5 h-5 text-yellow-400" fill="currentColor" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 1.5] }}
                transition={{ duration: 1, delay: 0.2, times: [0, 0.5, 1] }}
                className="absolute top-8 right-12"
              >
                <Sparkles className="w-4 h-4 text-purple-400" fill="currentColor" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1, 1.5] }}
                transition={{ duration: 1, delay: 0.4, times: [0, 0.5, 1] }}
                className="absolute bottom-6 right-8"
              >
                <Sparkles className="w-3 h-3 text-pink-400" fill="currentColor" />
              </motion.div>

              {/* Main Content */}
              <div className="flex items-center gap-4 relative z-10">
                {/* Avatar with Pulse Effect */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 15, stiffness: 300 }}
                  className="relative flex-shrink-0"
                >
                  {joinNotification.avatar.startsWith('http') ? (
                    <img
                      src={joinNotification.avatar}
                      alt={joinNotification.name}
                      className="w-14 h-14 rounded-full object-cover border border-gray-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#5B5DF0] to-[#8B7DF9] flex items-center justify-center text-lg font-bold text-white shadow-lg">
                      {joinNotification.avatar}
                    </div>
                  )}
                  {/* Pulse Ring */}
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-[#5B5DF0]"
                  />
                  {/* Success Checkmark */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${joinNotification.type === 'connected' ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                      }`}
                  >
                    {joinNotification.type === 'connected' ? (
                      <CheckCircle className="w-4 h-4 text-white" fill="currentColor" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-white" />
                    )}
                  </motion.div>
                </motion.div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 text-left">
                  <motion.p
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="font-bold text-gray-900 truncate text-base"
                  >
                    {joinNotification.name}
                  </motion.p>
                  <motion.p
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-gray-500 mt-0.5"
                  >
                    {joinNotification.message}
                  </motion.p>
                </div>

                {/* Tap to View Indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex-shrink-0"
                >
                  <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full font-medium">
                    Ko'rish
                  </div>
                </motion.div>
              </div>

              {/* Progress Bar for Auto-dismiss */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#5B5DF0] to-[#8B7DF9] rounded-b-2xl origin-left"
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="px-5 py-6 space-y-5">
        {isInfoLoading && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Musobaqa ma'lumotlari yuklanmoqda...</p>
          </div>
        )}

        {infoError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-700">{infoError}</p>
          </div>
        )}

        {participantsError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm text-red-700">{participantsError}</p>
          </div>
        )}

        {/* Competition Code - Compact Modern Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#5B5DF0] to-[#7B7DF9] rounded-2xl p-5 shadow-lg"
        >
          <div className="text-center mb-4">
            <p className="text-xs text-white/70 uppercase tracking-wide mb-2 font-semibold">
              Musobaqa kodi
            </p>
            <h2 className="text-4xl font-black text-white mb-1 tracking-wider">
              {competitionCode}
            </h2>
            <p className="text-sm text-white/80">Do'stlaringizni taklif qiling</p>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Nusxa olindi! ✓' : 'Kodni nusxalash'}
          </button>
        </motion.div>

        {/* Participants Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          {/* Header with count */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#5B5DF0] to-[#7B7DF9] rounded-xl flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Ishtirokchilar
                </h3>
                <p className="text-xs text-gray-500">
                  {readyCount} / {totalCount} online
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-sm font-bold text-gray-900">{totalCount}/50</span>
            </div>
          </div>

          {/* Add Friend Button */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="w-full bg-[#5B5DF0]/10 hover:bg-[#5B5DF0]/20 text-[#5B5DF0] py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mb-4"
          >
            <UserPlus className="w-4 h-4" />
            Do'st qo'shish
          </button>

          {/* Participants List - Compact & Scalable */}
          <div
            className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
          >
            {isParticipantsLoading && (
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-500">Ishtirokchilar yuklanmoqda...</p>
              </div>
            )}

            {participants.map((participant, index) => {
              const statusInfo = getStatusInfo(participant.status);
              const StatusIcon = statusInfo.icon;

              return (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar with online indicator */}
                  <div className="relative flex-shrink-0">
                    {participant.avatar.startsWith('http') ? (
                      <img
                        src={participant.avatar}
                        alt={participant.name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-sm font-bold text-gray-700">
                        {participant.avatar}
                      </div>
                    )}
                    {participant.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                    {participant.isHost && (
                      <div className="absolute -top-1 -left-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-md">
                        <Crown className="w-3 h-3 text-white" fill="currentColor" />
                      </div>
                    )}
                  </div>

                  {/* Name and Status */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate flex items-center gap-2">
                      {participant.name}
                      {participant.isHost && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                          Host
                        </span>
                      )}
                    </p>
                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${statusInfo.color} text-xs font-semibold mt-1`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.text}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {startSessionError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
              <p className="text-sm text-red-700">{startSessionError}</p>
            </div>
          )}

          {isCurrentUserHost && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => void handleStartCompetition()}
              disabled={isStartingSession}
              className="w-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              {isStartingSession ? 'Boshlanmoqda...' : 'Testni boshlash'}
            </motion.button>
          )}

          {/* Leave Room Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLeaveRequest(DASHBOARD_ROUTE)}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-2xl font-semibold transition-all hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Xonadan chiqish
          </motion.button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      <AlertDialog open={showLeaveModal} onOpenChange={(open) => {
        if (!open) {
          closeLeaveModal();
        }
      }}>
        <AlertDialogContent className="rounded-3xl border-0 p-0 overflow-hidden bg-white">
          <div className="bg-gradient-to-br from-[#5B5DF0] to-[#7B7DF9] px-6 py-5 text-white">
            <AlertDialogHeader className="text-left">
              <AlertDialogTitle className="text-xl font-bold text-white">
                Siz testni tark etmoqchimisiz
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-white/80">
                Tasdiqlasangiz, siz kutish xonasidan chiqasiz.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          <div className="px-6 py-5 space-y-4">
            {leaveError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{leaveError}</p>
              </div>
            )}

            <AlertDialogFooter className="flex-row gap-3 sm:justify-stretch">
              <AlertDialogCancel
                onClick={closeLeaveModal}
                className="mt-0 h-12 flex-1 rounded-2xl border-gray-200 text-gray-700"
              >
                Yoq
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  void handleConfirmLeave();
                }}
                className="h-12 flex-1 rounded-2xl bg-[#EF4444] text-white hover:bg-[#DC2626]"
              >
                {isLeavingSession ? 'Chiqilmoqda...' : 'Ha'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Friends Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-white rounded-t-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Do'stlarni taklif qilish
                </h2>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ism yoki username..."
                    value={inviteSearchQuery}
                    onChange={(event) => setInviteSearchQuery(event.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B5DF0] transition-all"
                  />
                </div>
              </div>

              {/* Contacts List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {contactsError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-700">{contactsError}</p>
                  </div>
                )}

                {inviteRequestError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-700">{inviteRequestError}</p>
                  </div>
                )}

                {isContactsLoading && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-sm text-gray-500">Kontaktlar yuklanmoqda...</p>
                  </div>
                )}

                {!isContactsLoading && !contactsError && filteredContacts.length === 0 && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-sm text-gray-500">Kontakt topilmadi.</p>
                  </div>
                )}

                {!isContactsLoading && !contactsError && filteredContacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {contact.avatar.startsWith('http') ? (
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-base">
                          {contact.avatar}
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                        {contact.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {contact.username}
                      </p>
                    </div>

                    {/* Invite Button */}
                    {invitedFriends.has(contact.id) ? (
                      <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-semibold text-xs">
                        Yuborildi
                      </span>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => void handleInvite(contact)}
                        disabled={invitingContactIds.has(contact.id)}
                        className="px-4 py-2 bg-[#5B5DF0] text-white rounded-lg font-semibold text-xs hover:bg-[#4B4DD0] transition-colors"
                      >
                        {invitingContactIds.has(contact.id) ? 'Yuborilmoqda...' : 'Taklif'}
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
