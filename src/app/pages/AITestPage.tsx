import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Upload, 
  Info, 
  Sparkles,
  File,
  CheckCircle2,
  X,
  Clock,
  FileCheck,
  ListChecks
} from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';

export function AITestPage() {
  const navigate = useNavigate();
  const [testName, setTestName] = useState('');
  const [easyQuestions, setEasyQuestions] = useState('5');
  const [mediumQuestions, setMediumQuestions] = useState('15');
  const [hardQuestions, setHardQuestions] = useState('5');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        console.log('PDF selected:', file.name);
        setSelectedFile(file);
      }
    };
    input.click();
  };

  const handleCreateTest = () => {
    console.log('Creating test:', { 
      testName, 
      easyQuestions, 
      mediumQuestions, 
      hardQuestions 
    });
    // Handle test creation logic
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowSuccessModal(true);
    }, 3000);
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
            <button
              onClick={() => navigate('/create-test')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Yangi test yaratish
            </h1>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Guide Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 rounded-2xl p-4"
        >
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-blue-900 font-semibold mb-1">Yo'riqnoma</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                PDF faylga yuklang va bizim avtomatik tarzidagi savollar shakllantiriladi. Fayl hajmi 10MB dan oshmasligi kerak.
              </p>
            </div>
          </div>
        </motion.div>

        {/* PDF Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-6"
        >
          <div className="flex flex-col items-center text-center">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4"
            >
              <Upload className="w-8 h-8 text-indigo-600" />
            </motion.div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              PDF faylni yuklash
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Faylni shu yerga tashlang yoki bosing
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFileUpload}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
            >
              Faylni tanlash
            </motion.button>
          </div>
        </motion.div>

        {/* Test Name Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test nomi
          </label>
          <motion.input
            whileFocus={{ scale: 1.01 }}
            type="text"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="Masalan: Matematika 1-chorak"
            className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </motion.div>

        {/* Question Count by Difficulty */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Savollar soni (saralarda bo'yicha)
          </label>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Easy Questions */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">Oson</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="number"
                value={easyQuestions}
                onChange={(e) => setEasyQuestions(e.target.value)}
                placeholder="5"
                className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Medium Questions */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">O'rtacha</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="number"
                value={mediumQuestions}
                onChange={(e) => setMediumQuestions(e.target.value)}
                placeholder="15"
                className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Hard Questions */}
            <div>
              <label className="block text-xs text-gray-600 mb-2">Qiyin</label>
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="number"
                value={hardQuestions}
                onChange={(e) => setHardQuestions(e.target.value)}
                placeholder="5"
                className="w-full px-3 py-3 bg-white border border-gray-300 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </motion.div>

        {/* Create Test Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.3)" }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreateTest}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
          Testni yaratish
        </motion.button>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-[24px] shadow-2xl z-50 overflow-hidden max-w-md mx-auto"
            >
              {/* Success Icon Header */}
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 px-6 py-8 text-center relative overflow-hidden">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-12 h-12 text-white stroke-[2]" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  Muvaffaqiyatli yaratildi!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-sm"
                >
                  Testingiz tayyor
                </motion.p>
                
                {/* Close Button */}
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5 text-white stroke-[2]" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* File Info (if file selected) */}
                {selectedFile && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileCheck className="w-6 h-6 text-indigo-600 stroke-[2]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#1E293B] text-sm mb-1">
                          {selectedFile.name}
                        </h3>
                        <p className="text-xs text-[#64748B] mb-2">
                          {(selectedFile.size / 1024).toFixed(1)} KB • PDF
                        </p>
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">Tahlil tugallandi</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Test Info */}
                <div className="space-y-3 mb-5">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ListChecks className="w-5 h-5 text-purple-600 stroke-[2]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {parseInt(easyQuestions) + parseInt(mediumQuestions) + parseInt(hardQuestions)} ta savol yaratildi
                      </p>
                      <p className="text-xs text-[#64748B]">
                        Oson: {easyQuestions} • O'rtacha: {mediumQuestions} • Qiyin: {hardQuestions}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-blue-600 stroke-[2]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {testName || 'Yangi test'}
                      </p>
                      <p className="text-xs text-[#64748B]">Test nomi</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-600 stroke-[2]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {Math.ceil((parseInt(easyQuestions) + parseInt(mediumQuestions) + parseInt(hardQuestions)) * 1.2)} daqiqa
                      </p>
                      <p className="text-xs text-[#64748B]">Tavsiya etilgan vaqt</p>
                    </div>
                  </motion.div>
                </div>

                {/* Description */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 mb-5">
                  <p className="text-sm text-[#475569] leading-relaxed">
                    <span className="font-semibold text-[#1E293B]">🎉 Test tayyorlandi!</span>
                    <br />
                    Sun'iy intellekt sizning sozlamalaringiz asosida test yaratdi. 
                    Testni "Mening testlarim" bo'limida ko'rishingiz va tahrirlashingiz mumkin.
                  </p>
                </div>

                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/tests-list')}
                  className="w-full bg-gradient-to-r from-[#5B5FEF] to-[#7C3AED] text-white py-4 rounded-xl font-semibold text-base hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ListChecks className="w-5 h-5 stroke-[2.5]" />
                  Mening testlarim
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Analyzing Loading Modal */}
      <AnimatePresence>
        {isAnalyzing && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Loading Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-[24px] shadow-2xl z-50 overflow-hidden max-w-md mx-auto p-8"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 mx-auto mb-6"
                >
                  <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                </motion.div>

                <h3 className="text-xl font-bold text-[#1E293B] mb-2">
                  Test yaratilmoqda...
                </h3>
                <p className="text-sm text-[#64748B] mb-4">
                  AI savollarni tayyorlamoqda
                </p>

                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#64748B]">Yaratish jarayoni</span>
                    <span className="text-xs font-semibold text-indigo-600">73%</span>
                  </div>
                  <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "73%" }}
                      transition={{ duration: 2 }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}