import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { 
  ArrowLeft,
  Upload,
  ChevronDown,
  FileText,
  BarChart3,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function EditQuestionPage() {
  const navigate = useNavigate();
  const [questionText, setQuestionText] = useState("Amir Temur nechanchi yilda tavalud topgan va qayerda tug'ilgan?");
  const [subject, setSubject] = useState('Tarix - O\'rta asrlar');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [correctAnswer, setCorrectAnswer] = useState("1336-yil, Yashil shaharchada");
  const [wrongAnswerA, setWrongAnswerA] = useState("1340-yil, Samarqandda");
  const [wrongAnswerB, setWrongAnswerB] = useState("1330-yil, Shahrisabzda");
  const [wrongAnswerC, setWrongAnswerC] = useState("1350-yil, Buxoroda");

  const difficultyOptions = [
    { value: 'easy', label: "Oson", color: 'from-green-500 to-emerald-500' },
    { value: 'medium', label: "O'rtacha", color: 'from-yellow-500 to-orange-500' },
    { value: 'hard', label: "Qiyin", color: 'from-red-500 to-pink-500' }
  ];

  const handleSave = () => {
    toast.success("Savol muvaffaqiyatli saqlandi! 🎉", {
      description: "Barcha o'zgarishlar saqlandi va testga qo'shildi",
      duration: 3000,
      className: "toast-success",
      style: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '16px',
        padding: '16px',
        fontSize: '15px',
        fontWeight: '600',
        boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
      },
    });
    
    // Navigate back after a short delay
    setTimeout(() => {
      navigate(-1);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-6">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-md"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Orqaga</p>
              <h1 className="text-lg font-bold text-gray-900">Savolni tahrirlash</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-5">
        {/* Question Text Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Savol matni</h2>
              <p className="text-xs text-gray-500">Asosiy savol</p>
            </div>
          </div>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={4}
            className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-gray-900 resize-none"
            placeholder="Savol matnini bu yerga kiriting..."
          />
        </motion.div>

        {/* Upload Image Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full border-2 border-dashed border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl py-6 flex items-center justify-center gap-3 hover:border-indigo-400 hover:from-indigo-100 hover:to-purple-100 transition-all"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900">Rasm yuklash</h4>
              <p className="text-sm text-gray-600">Matematika fanlari uchun (PNG, JPG)</p>
            </div>
          </motion.button>
        </motion.div>

        {/* Subject Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Mavzu
          </label>
          <div className="relative">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full appearance-none px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-gray-900"
            >
              <option value="Tarix - O'rta asrlar">Tarix - O'rta asrlar</option>
              <option value="Matematika - Algebra">Matematika - Algebra</option>
              <option value="Matematika - Geometriya">Matematika - Geometriya</option>
              <option value="Fizika - Mexanika">Fizika - Mexanika</option>
              <option value="Kimyo - Organik kimyo">Kimyo - Organik kimyo</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </motion.div>

        {/* Difficulty Level Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Qiyinchilik darajasi</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {difficultyOptions.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDifficulty(option.value as 'easy' | 'medium' | 'hard')}
                className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                  difficulty === option.value
                    ? `bg-gradient-to-r ${option.color} text-white shadow-lg`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Answer Variants Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
            <h2 className="text-sm font-bold text-gray-900">Javob variantlari</h2>
          </div>

          <div className="space-y-4">
            {/* Correct Answer */}
            <div>
              <label className="block text-xs font-semibold text-green-600 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                To'g'ri javob matni
              </label>
              <div className="relative">
                <div className="absolute left-4 top-4 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                  ✓
                </div>
                <textarea
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  rows={3}
                  className="w-full pl-16 pr-4 py-3.5 bg-green-50 border-2 border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-medium text-gray-900 resize-none"
                  placeholder="To'g'ri javobni kiriting... (formulalar uchun ham)"
                />
              </div>
            </div>

            {/* Wrong Answer A */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Noto'g'ri variant A
              </label>
              <div className="relative">
                <div className="absolute left-4 top-4 w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                  A
                </div>
                <textarea
                  value={wrongAnswerA}
                  onChange={(e) => setWrongAnswerA(e.target.value)}
                  rows={3}
                  className="w-full pl-16 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-gray-900 resize-none"
                  placeholder="Noto'g'ri javob A..."
                />
              </div>
            </div>

            {/* Wrong Answer B */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Noto'g'ri variant B
              </label>
              <div className="relative">
                <div className="absolute left-4 top-4 w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                  B
                </div>
                <textarea
                  value={wrongAnswerB}
                  onChange={(e) => setWrongAnswerB(e.target.value)}
                  rows={3}
                  className="w-full pl-16 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-gray-900 resize-none"
                  placeholder="Noto'g'ri javob B..."
                />
              </div>
            </div>

            {/* Wrong Answer C */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Noto'g'ri variant C
              </label>
              <div className="relative">
                <div className="absolute left-4 top-4 w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                  C
                </div>
                <textarea
                  value={wrongAnswerC}
                  onChange={(e) => setWrongAnswerC(e.target.value)}
                  rows={3}
                  className="w-full pl-16 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-gray-900 resize-none"
                  placeholder="Noto'g'ri javob C..."
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4 pt-2"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(-1)}
            className="py-4 px-6 bg-white border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-md"
          >
            Bekor qilish
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all"
          >
            Saqlash
          </motion.button>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl p-5 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">💡 Maslahat</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                To'g'ri javob yashil rangda belgilangan. Barcha javoblar bir xil formatda yozilgan bo'lsin!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}