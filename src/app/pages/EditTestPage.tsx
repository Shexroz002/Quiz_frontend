import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { 
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  Save,
  FileText
} from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';

interface Question {
  id: number;
  question_text: string;
  topic: string;
}

interface TestData {
  id: number;
  title: string;
  description: string | null;
  subject: string | null;
  questions: Question[];
}

export function EditTestPage() {
  const navigate = useNavigate();
  
  // Sample data matching the provided JSON structure
  const [testData, setTestData] = useState<TestData>({
    id: 5,
    title: "11-Biologiya (18-20 mavzular) Testi",
    description: null,
    subject: null,
    questions: [
      {
        id: 96,
        question_text: "Keltirilganlardan chuchuk suv (a) va dengiz (b) ekosistemalariga xos bo'lgan hususiyatlarni juftlab ko'rsating.\n1) tirik organizimlar uchun chuchuk suv manbayi;\n2) tuzilishiga ko'ra 3 guruhga bo'linadi; 3) yer sharining 70%i egallaydi; 4) bentos, plankton nekton organizimlari uchraydi; 5) ko'l, hozuz, buloqlar misol bo'ladi; 6) ko'rfaz va bo'g'ozlar tarkibga kiradi",
        topic: "Ekosistemalar"
      }
    ]
  });

  const [testName, setTestName] = useState(testData.title);
  const [subject, setSubject] = useState(testData.subject || 'Biologiya');
  const [description, setDescription] = useState(testData.description || '');

  const handleDeleteQuestion = (id: number) => {
    setTestData({
      ...testData,
      questions: testData.questions.filter(q => q.id !== id)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
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
                <h1 className="text-lg font-bold text-gray-900">Testni tahrirlash</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* General Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
              Umumiy ma'lumotlar
            </h2>
          </div>

          <div className="space-y-5">
            {/* Test Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Test nomi
              </label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-gray-900"
                placeholder="Test nomini kiriting..."
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fan
              </label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full appearance-none px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-gray-900"
                >
                  <option value="Biologiya">Biologiya</option>
                  <option value="Tarix">Tarix</option>
                  <option value="Matematika">Matematika</option>
                  <option value="Fizika">Fizika</option>
                  <option value="Kimyo">Kimyo</option>
                  <option value="Ona tili">Ona tili</option>
                  <option value="Adabiyot">Adabiyot</option>
                  <option value="Ingliz tili">Ingliz tili</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tavsif
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-gray-900 resize-none"
                placeholder="Test haqida qisqacha ma'lumot..."
              />
            </div>

            {/* Save Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
            >
              <Save className="w-5 h-5" />
              Saqlash
            </motion.button>
          </div>
        </motion.div>

        {/* Questions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                Savollar ro'yxati
              </h2>
            </div>
            <div className="bg-indigo-100 px-3 py-1.5 rounded-full">
              <span className="text-sm font-bold text-indigo-600">
                {testData.questions.length} ta savol
              </span>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4 mb-5">
            {testData.questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border-2 border-indigo-100 hover:border-indigo-300 transition-all"
              >
                <div className="flex gap-4">
                  {/* Question Number */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                      {index + 1}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 min-w-0">
                    {/* Topic Badge */}
                    {question.topic && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold mb-3">
                        <FileText className="w-3 h-3" />
                        {question.topic}
                      </div>
                    )}
                    
                    <p className="text-gray-800 font-medium leading-relaxed mb-4 break-words whitespace-pre-line">
                      {question.question_text}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-3 flex-wrap">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/edit-question')}
                        className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl font-semibold text-indigo-600 shadow-sm hover:shadow-md transition-all border border-indigo-200"
                      >
                        <Edit2 className="w-4 h-4" />
                        Tahrirlash
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl font-semibold text-red-500 shadow-sm hover:shadow-md transition-all border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        O'chirish
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Add Question Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full border-2 border-dashed border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl py-6 flex items-center justify-center gap-3 hover:border-indigo-400 hover:from-indigo-100 hover:to-purple-100 transition-all"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900">Yangi savol qo'shish</h4>
              <p className="text-sm text-gray-600">Testga savol qo'shing</p>
            </div>
          </motion.button>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl p-5 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Maslahat</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                Har bir savol aniq va tushunarli bo'lishi kerak. Javoblar bir xil uslubda yozilgan bo'lsin.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}