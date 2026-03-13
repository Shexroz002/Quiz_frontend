import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

export function QuestionMapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentQuestion = parseInt(searchParams.get('current') || '0', 10);
  const answeredQuestionsParam = searchParams.get('answered') || '';
  const answeredQuestions = answeredQuestionsParam ? answeredQuestionsParam.split(',').map(Number) : [];
  const sessionId = searchParams.get('sessionId');
  const totalQuestionsParam = parseInt(searchParams.get('total') || '30', 10);

  const totalQuestions = Number.isFinite(totalQuestionsParam) && totalQuestionsParam > 0 ? totalQuestionsParam : 30;

  const handleQuestionClick = (questionIndex: number) => {
    // Navigate back to test taking page with the selected question
    const params = new URLSearchParams({
      question: String(questionIndex),
    });

    if (sessionId) {
      params.set('sessionId', sessionId);
    }

    navigate(`/test-taking?${params.toString()}`);
  };

  const handleClose = () => {
    navigate(-1);
  };

  const getQuestionStatus = (index: number) => {
    if (index === currentQuestion) {
      return 'current';
    } else if (answeredQuestions.includes(index)) {
      return 'answered';
    } else {
      return 'unanswered';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Savollar xaritasi</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Question Grid */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: totalQuestions }, (_, i) => {
              const status = getQuestionStatus(i);
              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuestionClick(i)}
                  className={`aspect-square rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                    status === 'current'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : status === 'answered'
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
            Belgilar
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                1
              </div>
              <span className="text-gray-700">Joriy savol</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center text-green-700 font-semibold text-sm">
                2
              </div>
              <span className="text-gray-700">Javob berilgan</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-semibold text-sm">
                3
              </div>
              <span className="text-gray-700">Javob berilmagan</span>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClose}
          className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Testga qaytish
        </motion.button>
      </div>
    </div>
  );
}
