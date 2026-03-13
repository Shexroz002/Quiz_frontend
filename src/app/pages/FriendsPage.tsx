import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, ChevronRight, Check, Link2, Users, ArrowLeft, X, Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNavigation } from '../components/BottomNavigation';

interface Friend {
  id: number;
  name: string;
  avatar: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  lastActive: string;
  mutualFriends?: number;
}

interface SuggestedFriend extends Friend {
  isRequestSent?: boolean;
  contactAvailable?: boolean;
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

interface ContactSuggestionItem {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  profile_image: string | null;
}

interface UserSearchItem {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  profile_image: string | null;
  contact_available: boolean;
}

const CONTACT_LIST_URL = 'http://127.0.0.1:8000/api/v1/contact/list/';
const CONTACT_SUGGESTIONS_URL = 'http://127.0.0.1:8000/api/v1/contact/suggestions/';
const CONTACT_CREATE_BASE_URL = 'http://127.0.0.1:8000/api/v1/contact/create';
const USERS_SEARCH_URL = 'http://127.0.0.1:8000/api/v1/users/search';

const getAccessToken = () => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

const getDisplayName = (user: { first_name: string | null; last_name: string | null; username: string }) => {
  const firstName = user.first_name?.trim() ?? '';
  const lastName = user.last_name?.trim() ?? '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || user.username;
};

export function FriendsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [myFriends, setMyFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [friendsErrorMessage, setFriendsErrorMessage] = useState('');

  const loadMyFriends = useCallback(async () => {
    setIsLoadingFriends(true);
    setFriendsErrorMessage('');

    const accessToken = getAccessToken();
    if (!accessToken) {
      setMyFriends([]);
      setFriendsErrorMessage("Token topilmadi. Avval tizimga kirib ko'ring.");
      setIsLoadingFriends(false);
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
        throw new Error("Do'stlar ro'yxatini yuklab bo'lmadi.");
      }

      const payload = (await response.json()) as ContactListItem[] | { results?: ContactListItem[] };
      const contacts = Array.isArray(payload) ? payload : payload.results ?? [];

      const apiFriends = contacts.map((contact) => ({
        id: contact.friend.id,
        name: getDisplayName(contact.friend),
        avatar: '👤',
        avatarUrl: contact.friend.profile_image,
        isOnline: false,
        lastActive: "Faolligi noma'lum",
      } satisfies Friend));

      setMyFriends(apiFriends);
    } catch {
      setMyFriends([]);
      setFriendsErrorMessage("Do'stlar ro'yxatini yuklab bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setIsLoadingFriends(false);
    }
  }, []);

  useEffect(() => {
    void loadMyFriends();
  }, [loadMyFriends]);

  const [suggestedFriends, setSuggestedFriends] = useState<SuggestedFriend[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [suggestionsErrorMessage, setSuggestionsErrorMessage] = useState('');
  const [sendingRequestIds, setSendingRequestIds] = useState<number[]>([]);
  const [requestActionErrorMessage, setRequestActionErrorMessage] = useState('');
  const [modalSearchUsers, setModalSearchUsers] = useState<SuggestedFriend[]>([]);
  const [isLoadingModalSearch, setIsLoadingModalSearch] = useState(false);
  const [modalSearchErrorMessage, setModalSearchErrorMessage] = useState('');

  const loadSuggestions = useCallback(async () => {
    setIsLoadingSuggestions(true);
    setSuggestionsErrorMessage('');

    const accessToken = getAccessToken();
    if (!accessToken) {
      setSuggestedFriends([]);
      setSuggestionsErrorMessage("Token topilmadi. Avval tizimga kirib ko'ring.");
      setIsLoadingSuggestions(false);
      return;
    }

    try {
      const response = await fetch(CONTACT_SUGGESTIONS_URL, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Tavsiya etilgan do'stlarni yuklab bo'lmadi.");
      }

      const payload = (await response.json()) as ContactSuggestionItem[] | { results?: ContactSuggestionItem[] };
      const suggestions = Array.isArray(payload) ? payload : payload.results ?? [];

      const mappedSuggestions = suggestions.map((user) => ({
        id: user.id,
        name: getDisplayName(user),
        avatar: '👤',
        avatarUrl: user.profile_image,
        isOnline: false,
        lastActive: "Faolligi noma'lum",
        mutualFriends: 0,
        isRequestSent: false,
      } satisfies SuggestedFriend));

      setSuggestedFriends(mappedSuggestions);
    } catch {
      setSuggestedFriends([]);
      setSuggestionsErrorMessage("Tavsiya etilgan do'stlarni yuklab bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  const markRequestSent = useCallback((friendId: number) => {
    setSuggestedFriends(prev =>
      prev.map(friend =>
        friend.id === friendId ? { ...friend, isRequestSent: true } : friend
      )
    );
    setModalSearchUsers(prev =>
      prev.map(user =>
        user.id === friendId
          ? { ...user, isRequestSent: true, contactAvailable: false }
          : user
      )
    );
  }, []);

  const sendFriendRequest = useCallback(async (friendId: number) => {
    if (sendingRequestIds.includes(friendId)) {
      return false;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setRequestActionErrorMessage("Token topilmadi. Avval tizimga kirib ko'ring.");
      return false;
    }

    setRequestActionErrorMessage('');
    setSendingRequestIds((prev) => [...prev, friendId]);

    try {
      const response = await fetch(`${CONTACT_CREATE_BASE_URL}/${friendId}`, {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("So'rov yuborilmadi");
      }

      markRequestSent(friendId);
      return true;
    } catch {
      setRequestActionErrorMessage("Do'stlik so'rovi yuborilmadi. Qayta urinib ko'ring.");
      return false;
    } finally {
      setSendingRequestIds((prev) => prev.filter((id) => id !== friendId));
    }
  }, [markRequestSent, sendingRequestIds]);

  const handleAddFriend = (friendId: number) => {
    void sendFriendRequest(friendId);
  };

  const handleAddFriendFromModal = (user: SuggestedFriend) => {
    void sendFriendRequest(user.id).then((isSuccess) => {
      if (!isSuccess) return;
      setIsAddFriendModalOpen(false);
      setModalSearchQuery('');
    });
  };

  const filteredFriends = myFriends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!isAddFriendModalOpen) {
      setModalSearchUsers([]);
      setModalSearchErrorMessage('');
      setIsLoadingModalSearch(false);
      return;
    }

    const trimmedQuery = modalSearchQuery.trim();
    if (!trimmedQuery) {
      setModalSearchUsers([]);
      setModalSearchErrorMessage('');
      setIsLoadingModalSearch(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const accessToken = getAccessToken();
      if (!accessToken) {
        setModalSearchUsers([]);
        setModalSearchErrorMessage("Token topilmadi. Avval tizimga kirib ko'ring.");
        setIsLoadingModalSearch(false);
        return;
      }

      setIsLoadingModalSearch(true);
      setModalSearchErrorMessage('');

      try {
        const url = new URL(USERS_SEARCH_URL);
        url.searchParams.set('search', trimmedQuery);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Qidiruv xatoligi');
        }

        const payload = (await response.json()) as UserSearchItem[] | { results?: UserSearchItem[] };
        const users = Array.isArray(payload) ? payload : payload.results ?? [];
        const myFriendIds = new Set(myFriends.map((friend) => friend.id));

        const mappedUsers = users
          .filter((user) => !myFriendIds.has(user.id))
          .map((user) => ({
            id: user.id,
            name: getDisplayName(user),
            avatar: '👤',
            avatarUrl: user.profile_image,
            isOnline: false,
            lastActive: "Faolligi noma'lum",
            mutualFriends: 0,
            isRequestSent: !user.contact_available,
            contactAvailable: user.contact_available,
          } satisfies SuggestedFriend));

        setModalSearchUsers(mappedUsers);
      } catch {
        setModalSearchUsers([]);
        setModalSearchErrorMessage("Qidiruv natijalarini yuklab bo'lmadi. Qayta urinib ko'ring.");
      } finally {
        setIsLoadingModalSearch(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isAddFriendModalOpen, modalSearchQuery, myFriends]);

  const searchResults = modalSearchUsers;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-br from-[#5B5FEF] via-[#6366F1] to-[#7C7FF6] px-5 pt-8 pb-8 rounded-b-[28px] shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white stroke-[2]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Do'stlar</h1>
              <p className="text-white/80 text-sm leading-tight">
                Do'stlaringiz bilan bog'laning
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddFriendModalOpen(true)}
            className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-md"
          >
            <UserPlus className="w-6 h-6 stroke-[2]" />
          </motion.button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Ism bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-white/15 backdrop-blur-sm text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all"
          />
          <Search className="absolute right-4 top-4 w-5 h-5 text-white/60" />
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* My Friends Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1E293B]">Mening do'stlarim</h2>
            <span className="text-sm text-[#64748B] font-medium">{filteredFriends.length} do'st</span>
          </div>

          <div className="space-y-3">
            {isLoadingFriends && (
              <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
                <p className="text-sm text-[#64748B]">Do&apos;stlar yuklanmoqda...</p>
              </div>
            )}

            {!isLoadingFriends && friendsErrorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-[20px] p-4 flex items-center justify-between gap-3">
                <p className="text-sm text-red-700">{friendsErrorMessage}</p>
                <button
                  type="button"
                  onClick={() => void loadMyFriends()}
                  className="text-sm font-semibold text-red-700"
                >
                  Qayta
                </button>
              </div>
            )}

            {!isLoadingFriends && !friendsErrorMessage && filteredFriends.length === 0 && (
              <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
                <p className="text-sm text-[#64748B]">
                  {searchQuery.trim()
                    ? "Qidiruv bo'yicha do'st topilmadi."
                    : "Hozircha do'stlar ro'yxati bo'sh."}
                </p>
              </div>
            )}

            {!isLoadingFriends && !friendsErrorMessage && filteredFriends.map((friend, index) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="bg-white rounded-[20px] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)] cursor-pointer active:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Circular Avatar with Online Status */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-2xl">
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span>{friend.avatar}</span>
                      )}
                    </div>
                    {friend.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#22C55E] rounded-full border-2 border-white shadow-sm"></div>
                    )}
                  </div>

                  {/* Friend Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#1E293B] text-[16px] mb-1 truncate">
                      {friend.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      {friend.isOnline ? (
                        <span className="flex items-center gap-1.5 text-[#22C55E] font-medium">
                          <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full"></div>
                          {friend.lastActive}
                        </span>
                      ) : (
                        <span className="text-[#64748B]">{friend.lastActive}</span>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-[#94A3B8] flex-shrink-0 stroke-[2]" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Suggested Friends Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1E293B]">Sizga tanish bo'lishi mumkin</h2>
          </div>

          <div className="space-y-3">
            {isLoadingSuggestions && (
              <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
                <p className="text-sm text-[#64748B]">Tavsiyalar yuklanmoqda...</p>
              </div>
            )}

            {!isLoadingSuggestions && suggestionsErrorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-[20px] p-4 flex items-center justify-between gap-3">
                <p className="text-sm text-red-700">{suggestionsErrorMessage}</p>
                <button
                  type="button"
                  onClick={() => void loadSuggestions()}
                  className="text-sm font-semibold text-red-700"
                >
                  Qayta
                </button>
              </div>
            )}

            {!isLoadingSuggestions && !suggestionsErrorMessage && requestActionErrorMessage && (
              <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-4">
                <p className="text-sm text-amber-700">{requestActionErrorMessage}</p>
              </div>
            )}

            {!isLoadingSuggestions && !suggestionsErrorMessage && suggestedFriends.length === 0 && (
              <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
                <p className="text-sm text-[#64748B]">Hozircha tavsiya etiladigan do'stlar yo'q.</p>
              </div>
            )}

            {!isLoadingSuggestions && !suggestionsErrorMessage && suggestedFriends.map((friend, index) => (
              <motion.div
                key={friend.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-[20px] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-center gap-4">
                  {/* Circular Avatar with Online Status */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-2xl">
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span>{friend.avatar}</span>
                      )}
                    </div>
                    {friend.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#22C55E] rounded-full border-2 border-white shadow-sm"></div>
                    )}
                  </div>

                  {/* Friend Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#1E293B] text-[16px] mb-1 truncate">
                      {friend.name}
                    </h3>
                    <div className="flex flex-col gap-0.5">
                      {friend.isOnline ? (
                        <span className="flex items-center gap-1.5 text-sm text-[#22C55E] font-medium">
                          <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full"></div>
                          Onlayn
                        </span>
                      ) : (
                        <span className="text-sm text-[#64748B]">{friend.lastActive}</span>
                      )}
                      {friend.mutualFriends && friend.mutualFriends > 0 && (
                        <span className="text-xs text-[#94A3B8]">
                          {friend.mutualFriends} umumiy do'st
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add Friend Button */}
                  {!friend.isRequestSent ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddFriend(friend.id)}
                      disabled={sendingRequestIds.includes(friend.id)}
                      className="px-4 py-2.5 bg-gradient-to-r from-[#5B5FEF] to-[#7C3AED] text-white rounded-xl font-semibold text-sm hover:shadow-md transition-all flex items-center gap-1.5 flex-shrink-0"
                    >
                      <UserPlus className="w-4 h-4 stroke-[2.5]" />
                      {sendingRequestIds.includes(friend.id) ? "Yuborilmoqda..." : "Qo'shish"}
                    </motion.button>
                  ) : (
                    <motion.button
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="px-4 py-2.5 bg-gray-100 text-[#64748B] rounded-xl font-semibold text-sm flex items-center gap-1.5 flex-shrink-0 cursor-default"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      Jo'natildi
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Invite Friends CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-[#5B5FEF] to-[#7C3AED] rounded-[20px] p-6 text-center shadow-[0_12px_30px_rgba(91,93,239,0.25)]"
        >
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <Link2 className="w-8 h-8 text-white stroke-[2]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Do'stlarni taklif qiling!
          </h3>
          <p className="text-white/90 mb-5 text-sm leading-relaxed">
            Sinfdoshlaringizni platformaga taklif qiling va birgalikda o'rganing
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-[#5B5FEF] px-6 py-3 rounded-xl font-semibold hover:bg-white/95 transition-all inline-flex items-center gap-2 shadow-md"
          >
            <Link2 className="w-5 h-5 stroke-[2.5]" />
            Havola ulashish
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Add Friend Modal */}
      <AnimatePresence>
        {isAddFriendModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddFriendModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-20 bottom-20 bg-white rounded-[24px] shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-br from-[#5B5FEF] to-[#7C3AED] px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-white stroke-[2]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Do'st qo'shish</h2>
                      <p className="text-white/80 text-xs">Do'stlaringizni qidiring</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAddFriendModalOpen(false)}
                    className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/25 transition-colors"
                  >
                    <X className="w-5 h-5 text-white stroke-[2]" />
                  </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    type="text"
                    placeholder="Ism bo'yicha qidirish..."
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/15 backdrop-blur-sm text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all"
                  />
                </div>
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto p-5">
                {modalSearchQuery === '' ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1E293B] mb-2">Do'stingizni qidiring</h3>
                    <p className="text-[#64748B] text-sm">
                      Ism yoki familiyani kiriting
                    </p>
                  </div>
                ) : isLoadingModalSearch ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1E293B] mb-2">Qidirilmoqda...</h3>
                    <p className="text-[#64748B] text-sm">
                      Natijalar yuklanmoqda
                    </p>
                  </div>
                ) : modalSearchErrorMessage ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
                      <X className="w-10 h-10 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1E293B] mb-2">Xatolik</h3>
                    <p className="text-[#64748B] text-sm">
                      {modalSearchErrorMessage}
                    </p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-[#1E293B] mb-2">Natija topilmadi</h3>
                    <p className="text-[#64748B] text-sm">
                      "{modalSearchQuery}" bo'yicha foydalanuvchi topilmadi
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-[#64748B] font-medium mb-3">
                      {searchResults.length} foydalanuvchi topildi
                    </p>
                    {searchResults.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-xl p-4 border-2 border-gray-100 hover:border-[#5B5FEF] transition-all"
                      >
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-xl">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <span>{user.avatar}</span>
                              )}
                            </div>
                            {user.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#22C55E] rounded-full border-2 border-white"></div>
                            )}
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#1E293B] text-sm mb-0.5 truncate">
                              {user.name}
                            </h3>
                            <div className="flex flex-col gap-0.5">
                              {user.isOnline ? (
                                <span className="flex items-center gap-1.5 text-xs text-[#22C55E] font-medium">
                                  <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full"></div>
                                  Onlayn
                                </span>
                              ) : (
                                <span className="text-xs text-[#64748B]">{user.lastActive}</span>
                              )}
                              {user.mutualFriends && user.mutualFriends > 0 && (
                                <span className="text-xs text-[#94A3B8]">
                                  {user.mutualFriends} umumiy do'st
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Add Button */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleAddFriendFromModal(user)}
                            disabled={sendingRequestIds.includes(user.id) || user.contactAvailable === false}
                            className="px-4 py-2 bg-gradient-to-r from-[#5B5FEF] to-[#7C3AED] text-white rounded-xl font-semibold text-sm hover:shadow-md transition-all flex items-center gap-1.5 flex-shrink-0"
                          >
                            <UserPlus className="w-4 h-4 stroke-[2.5]" />
                            {sendingRequestIds.includes(user.id)
                              ? "Yuborilmoqda..."
                              : user.contactAvailable === false
                                ? "Mavjud"
                                : "Qo'shish"}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
