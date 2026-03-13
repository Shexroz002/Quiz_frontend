import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Target,
  Zap,
  Brain,
  Trophy,
  BookOpen,
  CheckCircle2,
  XCircle,
  Flame
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNavigation } from '../components/BottomNavigation';

export function StatisticPage() {
  const navigate = useNavigate();

  // Subject performance data
  const subjectData = [
    { name: 'Matematika', value: 92, color: '#F59E0B', icon: '📐' },
    { name: 'Fizika', value: 85, color: '#3B82F6', icon: '⚛️' },
    { name: 'Kimyo', value: 88, color: '#22C55E', icon: '⚗️' },
    { name: 'Ingliz tili', value: 95, color: '#8B5CF6', icon: '🌍' },
    { name: 'Ona tili', value: 78, color: '#EC4899', icon: '📚' },
  ];

  const stats = {
    totalTests: 156,
    averageScore: 89,
    studyStreak: 12,
    totalHours: 41,
    xpEarned: 1250,
    rank: '#23',
    correctAnswers: 892,
    wrongAnswers: 108,
    accuracy: 89.2,
    currentLevel: 8,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
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
            <p className="text-2xl font-bold text-white mb-1">{stats.totalTests}</p>
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
            <p className="text-2xl font-bold text-white mb-1">{stats.averageScore}%</p>
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
            <p className="text-2xl font-bold text-white mb-1">{stats.studyStreak}</p>
            <p className="text-white/80 text-xs">Kun ketma-ket</p>
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
            {subjectData.map((subject, index) => (
              <motion.div
                key={subject.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${subject.color}20` }}
                >
                  {subject.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-[#1E293B] text-sm">{subject.name}</span>
                    <span className="font-bold text-[#1E293B]">{subject.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${subject.value}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Accuracy Stats */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-bold text-[#1E293B] mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#5B5FEF] stroke-[2]" />
            To'g'ri javoblar
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 stroke-[2]" />
                <span className="text-sm font-semibold text-green-900">To'g'ri</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{stats.correctAnswers}</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600 stroke-[2]" />
                <span className="text-sm font-semibold text-red-900">Xato</span>
              </div>
              <p className="text-3xl font-bold text-red-600">{stats.wrongAnswers}</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-900 mb-1">Umumiy aniqlik</p>
                <p className="text-xs text-purple-700">Barcha javoblar</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-purple-600">{stats.accuracy}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-[20px] p-5 shadow-[0_8px_20px_rgba(245,158,11,0.3)]">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-6 h-6 text-white stroke-[2]" />
              <span className="text-white/90 text-sm font-semibold">XP</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.xpEarned}</p>
            <p className="text-white/80 text-xs">Jami ball</p>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-white/90 text-xs">Level {stats.currentLevel}</p>
              <div className="h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-[20px] p-5 shadow-[0_8px_20px_rgba(236,72,153,0.3)]">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-6 h-6 text-white stroke-[2]" />
              <span className="text-white/90 text-sm font-semibold">Reyting</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.rank}</p>
            <p className="text-white/80 text-xs">Umumiy reytingda</p>
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-white text-xs">Top 5% da 🎯</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
