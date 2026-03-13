import { useNavigate } from 'react-router';
import { ArrowLeft, FileText, Sparkles, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { BottomNavigation } from '../components/BottomNavigation';

export function CreateTestPage() {
  const navigate = useNavigate();

  const handlePDFUpload = () => {
    // Navigate to PDF upload page
    navigate('/pdf-test');
  };

  const handleAICreate = () => {
    console.log('AI test creation started');
    // Navigate to AI test creation flow
    navigate('/ai-test');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-purple-50/30 pb-24">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="px-4 py-4">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </motion.button>
            <h1 className="text-xl font-semibold text-gray-900">
              Qanday test yaratamiz?
            </h1>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4">
        {/* PDF Upload Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -5px rgba(99, 102, 241, 0.2)" }}
          className="bg-white rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2
              }}
              className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0"
            >
              <FileText className="w-7 h-7 text-indigo-600" />
            </motion.div>

            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                PDF-dan test yaratish
              </h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Fayl yuklang va savollarni sun'iy intellekt yordamida automatik ajratib oling
              </p>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePDFUpload}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                Fayli tanlash
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </motion.div>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* AI Create Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, boxShadow: "0 10px 30px -5px rgba(168, 85, 247, 0.2)" }}
          className="bg-white rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0"
            >
              <Sparkles className="w-7 h-7 text-purple-600" />
            </motion.div>

            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                AI yordamida test yaratish
              </h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Mavzu va qiyinchilik darajasini kiriting, AI siz uchun mukammal test tuzib beradi
              </p>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAICreate}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                AI bilan boshlash
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                >
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </motion.div>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Info Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.01 }}
          className="flex gap-3 bg-blue-50 rounded-2xl p-4"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          </motion.div>
          <p className="text-sm text-blue-900 leading-relaxed">
            Yaratilgan testlar avtomatik ravishda "Mening testlarim" bo'limiga saqlanadi va ularni istagan vaqtda tahrirlash mumkin.
          </p>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}