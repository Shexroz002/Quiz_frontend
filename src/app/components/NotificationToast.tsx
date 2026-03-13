import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Users, Award, UserPlus, MessageCircle, X, Check } from 'lucide-react';

interface NotificationToastProps {
  id: string;
  type: 'invitation' | 'group' | 'achievement' | 'friend' | 'announcement';
  title: string;
  senderName: string;
  senderAvatar?: string;
  senderAvatarUrl?: string;
  message: string;
  time: string;
  isVisible: boolean;
  isAccepting?: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
}

export function NotificationToast({
  type,
  title,
  senderName,
  senderAvatar,
  senderAvatarUrl,
  message,
  time,
  isVisible,
  isAccepting = false,
  onAccept,
  onDecline,
  onDismiss
}: NotificationToastProps) {
  const getNotificationIcon = () => {
    const iconProps = { className: 'w-5 h-5 stroke-[2] text-white' };
    switch (type) {
      case 'invitation':
        return <Trophy {...iconProps} />;
      case 'group':
        return <Users {...iconProps} />;
      case 'achievement':
        return <Award {...iconProps} />;
      case 'friend':
        return <UserPlus {...iconProps} />;
      case 'announcement':
        return <MessageCircle {...iconProps} />;
      default:
        return <Trophy {...iconProps} />;
    }
  };

  const getNotificationColor = () => {
    switch (type) {
      case 'invitation':
        return 'from-[#F59E0B] to-[#F97316]';
      case 'group':
        return 'from-[#5B5FEF] to-[#7C3AED]';
      case 'achievement':
        return 'from-[#FBBF24] to-[#F59E0B]';
      case 'friend':
        return 'from-[#EC4899] to-[#F43F5E]';
      case 'announcement':
        return 'from-[#6366F1] to-[#8B5CF6]';
      default:
        return 'from-[#F59E0B] to-[#F97316]';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
            mass: 0.8
          }}
          className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md"
        >
          <div className="bg-white rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-l-4 border-[#5B5FEF] overflow-hidden">
            {/* Top close button */}
            <button
              onClick={onDismiss}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
            >
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>

            <div className="p-4">
              <div className="flex gap-3">
                {/* Icon */}
                <div className={`w-12 h-12 bg-gradient-to-br ${getNotificationColor()} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}>
                  {getNotificationIcon()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-bold text-[15px] leading-tight text-[#1E293B]">
                      {title}
                    </h3>
                    {/* Unread indicator */}
                    <div className="w-2 h-2 bg-[#5B5FEF] rounded-full flex-shrink-0 mt-1.5"></div>
                  </div>

                  {/* Sender info */}
                  <div className="flex items-center gap-1.5 mb-2">
                    {senderAvatarUrl ? (
                      <img
                        src={senderAvatarUrl}
                        alt={senderName}
                        className="w-6 h-6 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <span className="text-base leading-none">{senderAvatar || '👤'}</span>
                    )}
                    <span className="text-xs font-semibold text-[#64748B]">
                      {senderName}
                    </span>
                  </div>

                  {/* Message */}
                  <p className="text-[13px] leading-relaxed text-[#64748B] mb-3 line-clamp-2">
                    {message}
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={onAccept}
                      disabled={isAccepting}
                      className="flex-1 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 shadow-sm active:shadow-md transition-shadow"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      {isAccepting ? 'Qabul qilinmoqda...' : 'Qabul qilish'}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={onDecline}
                      disabled={isAccepting}
                      className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl font-semibold text-sm active:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                      Rad etish
                    </motion.button>
                  </div>

                  {/* Time */}
                  <p className="text-xs text-[#94A3B8] mt-2">{time}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
