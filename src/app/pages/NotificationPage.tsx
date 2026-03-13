import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Trophy,
  Users,
  ClipboardCheck,
  Star,
  UserPlus,
  Bell,
  Calendar,
  Award,
  MessageCircle,
  Check,
  X,
  MoreVertical,
  CheckCheck
} from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';

interface Notification {
  id: string;
  type: 'invitation' | 'result' | 'achievement' | 'friend' | 'reminder' | 'announcement' | 'group';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  actionable?: boolean;
  sender?: {
    name: string;
    avatar: string;
  };
  metadata?: {
    score?: number;
    subject?: string;
    testName?: string;
    groupName?: string;
  };
}

export function NotificationPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'invitation',
      title: 'Test taklifi',
      message: 'Aziza sizni "Matematika - Logarifmlar" testiga taklif qildi',
      time: '5 daqiqa oldin',
      isRead: false,
      actionable: true,
      sender: { name: 'Aziza', avatar: '👩‍🎓' },
      metadata: { testName: 'Matematika - Logarifmlar' }
    },
    {
      id: '2',
      type: 'friend',
      title: 'Do\'stlikka taklif',
      message: 'Kamol sizni do\'stlikka taklif qildi',
      time: '15 daqiqa oldin',
      isRead: false,
      actionable: true,
      sender: { name: 'Kamol', avatar: '👨‍🎓' },
    },
    {
      id: '3',
      type: 'result',
      title: 'Test natijasi',
      message: 'Siz "Organik kimyo" testini 85% natija bilan tugatdingiz!',
      time: '1 soat oldin',
      isRead: false,
      metadata: { score: 85, subject: 'Kimyo', testName: 'Organik kimyo' }
    },
    {
      id: '4',
      type: 'achievement',
      title: 'Yangi yutuq!',
      message: 'Tabriklaymiz! "Matematika ustasi" nishonini qo\'lga kiritdingiz',
      time: '2 soat oldin',
      isRead: true,
      metadata: { subject: 'Matematika' }
    },
    {
      id: '5',
      type: 'friend',
      title: 'Do\'stlik so\'rovi',
      message: 'Madina sizga do\'stlik so\'rovini yubordi',
      time: '3 soat oldin',
      isRead: true,
      actionable: true,
      sender: { name: 'Madina', avatar: '👧' }
    },
    {
      id: '6',
      type: 'reminder',
      title: 'Test eslatmasi',
      message: 'Bugun soat 16:00 da "Ingliz tili" testingiz boshlanadi',
      time: 'Bugun',
      isRead: true,
      metadata: { testName: 'Ingliz tili' }
    },
    {
      id: '7',
      type: 'announcement',
      title: 'O\'qituvchi xabari',
      message: 'Rustam Usmonov: Ertaga yangi mavzu bo\'yicha test qo\'shiladi',
      time: 'Kecha',
      isRead: true,
      sender: { name: 'Rustam Usmonov', avatar: '👨‍🏫' }
    },
    {
      id: '8',
      type: 'result',
      title: 'Musobaqa natijasi',
      message: 'Siz "Do\'stlar bilan fizika" musobaqasida 2-o\'rin oldingiz!',
      time: 'Kecha',
      isRead: true,
      metadata: { score: 92, subject: 'Fizika' }
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const handleAccept = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    handleMarkAsRead(id);
    
    // If it's a friend request, add the friend to localStorage
    if (notification?.type === 'friend' && notification.sender) {
      const newFriend = {
        id: Date.now(), // Generate unique ID
        name: notification.sender.name,
        avatar: notification.sender.avatar,
        isOnline: true,
        lastActive: 'Onlayn',
      };
      
      // Get existing friends from localStorage
      const existingFriends = localStorage.getItem('acceptedFriends');
      const friendsList = existingFriends ? JSON.parse(existingFriends) : [];
      
      // Add new friend if not already in list
      if (!friendsList.some((f: any) => f.name === newFriend.name)) {
        friendsList.push(newFriend);
        localStorage.setItem('acceptedFriends', JSON.stringify(friendsList));
      }
      
      // Navigate to friends page
      navigate('/friends');
    } else if (notification?.type === 'invitation') {
      // Test invitation - go to competition page
      navigate('/competition');
    } else if (notification?.type === 'group') {
      // Group invitation fallback - open friends screen until a dedicated groups route exists
      navigate('/friends');
    }
  };

  const handleDecline = (id: string) => {
    // Handle decline action
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { className: 'w-5 h-5 stroke-[2]' };
    switch (type) {
      case 'invitation':
        return <Trophy {...iconProps} />;
      case 'group':
        return <Users {...iconProps} />;
      case 'result':
        return <ClipboardCheck {...iconProps} />;
      case 'achievement':
        return <Award {...iconProps} />;
      case 'friend':
        return <UserPlus {...iconProps} />;
      case 'reminder':
        return <Calendar {...iconProps} />;
      case 'announcement':
        return <MessageCircle {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'invitation':
        return 'from-orange-500 to-amber-500';
      case 'group':
        return 'from-purple-500 to-indigo-500';
      case 'result':
        return 'from-green-500 to-emerald-500';
      case 'achievement':
        return 'from-yellow-500 to-orange-500';
      case 'friend':
        return 'from-pink-500 to-rose-500';
      case 'reminder':
        return 'from-blue-500 to-cyan-500';
      case 'announcement':
        return 'from-indigo-500 to-purple-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  // Group notifications
  const todayNotifications = notifications.filter(n => 
    n.time.includes('daqiqa') || n.time.includes('soat') || n.time === 'Bugun'
  );
  const yesterdayNotifications = notifications.filter(n => n.time === 'Kecha');
  const olderNotifications = notifications.filter(n => 
    !todayNotifications.includes(n) && !yesterdayNotifications.includes(n)
  );

  const renderNotification = (notification: Notification) => (
    <motion.div
      key={notification.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      layout
      className={`bg-white rounded-[20px] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)] border-l-4 ${
        notification.isRead ? 'border-gray-200' : 'border-[#5B5FEF]'
      } relative`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`w-11 h-11 bg-gradient-to-br ${getNotificationColor(notification.type)} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-white relative`}>
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-semibold text-[15px] leading-tight ${
              notification.isRead ? 'text-[#64748B]' : 'text-[#1E293B]'
            }`}>
              {notification.title}
            </h3>
            {!notification.isRead && (
              <div className="w-2 h-2 bg-[#5B5FEF] rounded-full flex-shrink-0 mt-1.5"></div>
            )}
          </div>

          {/* Sender info */}
          {notification.sender && (
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">{notification.sender.avatar}</span>
              <span className="text-xs font-medium text-[#64748B]">
                {notification.sender.name}
              </span>
            </div>
          )}

          <p className={`text-[14px] leading-relaxed mb-2 ${
            notification.isRead ? 'text-[#94A3B8]' : 'text-[#64748B]'
          }`}>
            {notification.message}
          </p>

          {/* Metadata */}
          {notification.metadata?.score && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg mb-2">
              <Star className="w-3.5 h-3.5 text-green-600 fill-green-600" />
              <span className="text-sm font-bold text-green-700">
                {notification.metadata.score}%
              </span>
            </div>
          )}

          {/* Action buttons */}
          {notification.actionable && !notification.isRead && (
            <div className="flex gap-2 mt-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAccept(notification.id)}
                className="flex-1 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 shadow-sm active:shadow-md transition-shadow"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Qabul qilish
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDecline(notification.id)}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 active:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                Rad etish
              </motion.button>
            </div>
          )}

          {/* Time */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-[#94A3B8]">{notification.time}</p>
            {notification.isRead && (
              <CheckCheck className="w-3.5 h-3.5 text-[#94A3B8]" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#5B5FEF] via-[#6366F1] to-[#7C7FF6] sticky top-0 z-10 shadow-lg">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/25 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2]" />
              </motion.button>
              <div>
                <h1 className="text-white text-xl font-semibold leading-tight">Bildirishnomalar</h1>
                {unreadCount > 0 && (
                  <p className="text-white/80 text-sm leading-tight">
                    {unreadCount} ta yangi
                  </p>
                )}
              </div>
            </div>

            {unreadCount > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl text-white text-sm font-medium hover:bg-white/25 transition-colors flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Barchasini o'qilgan
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-5 space-y-6">
        {notifications.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-[#1E293B] font-semibold text-lg mb-2">
              Bildirishnomalar yo'q
            </h3>
            <p className="text-[#64748B] text-sm text-center max-w-xs">
              Hozircha yangi bildirishnomalar yo'q. Biz sizga muhim yangiliklar haqida xabar beramiz!
            </p>
          </motion.div>
        ) : (
          <>
            {/* Today */}
            {todayNotifications.length > 0 && (
              <div>
                <h2 className="text-[#64748B] text-sm font-bold uppercase tracking-wider mb-3 px-1">
                  Bugun
                </h2>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {todayNotifications.map(renderNotification)}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Yesterday */}
            {yesterdayNotifications.length > 0 && (
              <div>
                <h2 className="text-[#64748B] text-sm font-bold uppercase tracking-wider mb-3 px-1">
                  Kecha
                </h2>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {yesterdayNotifications.map(renderNotification)}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Older */}
            {olderNotifications.length > 0 && (
              <div>
                <h2 className="text-[#64748B] text-sm font-bold uppercase tracking-wider mb-3 px-1">
                  Oldingi
                </h2>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {olderNotifications.map(renderNotification)}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
