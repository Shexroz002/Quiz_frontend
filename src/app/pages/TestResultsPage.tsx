import { motion } from 'motion/react';
import { ArrowLeft, Clock, Target, Trophy, FileText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useMemo, useState } from 'react';

interface TopicStatisticItem {
  topic_name: string;
  total_questions: number;
  correct_answers: number;
}

interface FinishSessionResponse {
  session_id: number;
  attempt_id: number;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  wrong_answers: number;
  spend_time: number;
  score: number;
  finished: boolean;
  topic_statistic: TopicStatisticItem[];
}

const formatDuration = (totalSeconds: number) => {
  const normalized = Math.max(totalSeconds, 0);
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  const seconds = normalized % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function TestResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { result?: FinishSessionResponse } | null;
  const result = state?.result;
  const [topicFilter, setTopicFilter] = useState<'all' | 'weak'>('all');
  const [showAllTopics, setShowAllTopics] = useState(false);

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Natija topilmadi</h2>
          <p className="text-sm text-gray-600 mb-4">
            Test yakunlash javobi olinmadi. Testlar ro'yxatidan qayta boshlang.
          </p>
          <button
            onClick={() => navigate('/tests-list')}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
          >
            Testlar ro'yxatiga o'tish
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = result.total_questions;
  const correctAnswers = result.correct_answers;
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const timeSpent = formatDuration(result.spend_time);
  const topicAnalysis = useMemo(
    () =>
      result.topic_statistic
        .map((topic) => {
          const topicPercentage =
            topic.total_questions > 0
              ? Math.round((topic.correct_answers / topic.total_questions) * 100)
              : 0;

          return {
            name: topic.topic_name,
            percentage: topicPercentage,
            color: topicPercentage < 40 ? 'bg-red-500' : topicPercentage < 70 ? 'bg-amber-500' : 'bg-emerald-500',
            ratio: `${topic.correct_answers}/${topic.total_questions}`,
            totalQuestions: topic.total_questions,
          };
        })
        .sort((a, b) => {
          if (a.percentage !== b.percentage) {
            return a.percentage - b.percentage;
          }

          return b.totalQuestions - a.totalQuestions;
        }),
    [result.topic_statistic],
  );
  const weakTopicCount = topicAnalysis.filter((topic) => topic.percentage < 70).length;
  const filteredTopics = topicFilter === 'weak'
    ? topicAnalysis.filter((topic) => topic.percentage < 70)
    : topicAnalysis;
  const visibleTopicLimit = 6;
  const visibleTopics = showAllTopics ? filteredTopics : filteredTopics.slice(0, visibleTopicLimit);
  const hiddenTopicsCount = Math.max(filteredTopics.length - visibleTopicLimit, 0);

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Natijalar</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="relative w-48 h-48">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle cx="96" cy="96" r="70" stroke="#E5E7EB" strokeWidth="16" fill="none" />
              <motion.circle
                cx="96"
                cy="96"
                r="70"
                stroke="#4F46E5"
                strokeWidth="16"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                style={{ strokeDasharray: circumference }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-indigo-600">{percentage}%</span>
              <span className="text-sm text-gray-500 mt-1">
                {correctAnswers}/{totalQuestions} to'g'ri
              </span>
            </div>
          </div>

          <p className="text-center text-gray-600 mt-6 max-w-xs leading-relaxed">
            Yakunlandi: {result.answered_questions} ta javob berildi, {result.wrong_answers} ta xato.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Sarflangan vaqt</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{timeSpent}</p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Aniqlik</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold mb-0.5">Umumiy ball</h3>
              <p className="text-white text-sm opacity-90">Siz {result.score} ball topladingiz.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-gray-900">Mavzular tahlili</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {filteredTopics.length} ta mavzu {topicFilter === 'weak' ? '(zaiflar)' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTopicFilter('all');
                  setShowAllTopics(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${topicFilter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}
              >
                Barchasi
              </button>
              <button
                onClick={() => {
                  setTopicFilter('weak');
                  setShowAllTopics(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${topicFilter === 'weak' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}
              >
                Zaif ({weakTopicCount})
              </button>
            </div>
          </div>

          {filteredTopics.length === 0 ? (
            <p className="text-sm text-gray-500">Mavzu statistikasi mavjud emas.</p>
          ) : (
            <div className={`${showAllTopics ? 'max-h-80 overflow-y-auto pr-1' : ''} space-y-4`}>
              {visibleTopics.map((topic, index) => (
                <motion.div
                  key={topic.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <span className="text-gray-700 font-medium text-sm leading-snug">{topic.name}</span>
                    <span className="text-indigo-600 font-bold text-sm whitespace-nowrap">{topic.percentage}% ({topic.ratio})</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.percentage}%` }}
                      transition={{ duration: 1, delay: 0.7 + index * 0.05, ease: 'easeOut' }}
                      className={`h-full ${topic.color} rounded-full`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {hiddenTopicsCount > 0 && (
            <button
              onClick={() => setShowAllTopics((prev) => !prev)}
              className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              {showAllTopics ? "Yig'ish" : `Yana ${hiddenTopicsCount} ta ko'rsatish`}
            </button>
          )}
        </motion.div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() =>
            navigate(`/error-analysis?sessionId=${result.session_id}`, {
              state: { sessionId: result.session_id },
            })
          }
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          <FileText className="w-5 h-5" />
          Xatolar tahlilini boshlash
        </motion.button>
      </div>
    </div>
  );
}
