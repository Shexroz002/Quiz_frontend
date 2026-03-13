import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Upload,
  FileText,
  Info,
  CloudUpload,
  File,
  CheckCircle2,
  X,
  Clock,
  FileCheck,
  ListChecks
} from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';
import { toast } from 'sonner';

type JobStatusType = 'queued' | 'processing' | 'completed' | 'failed';

interface PdfJobCreateResponse {
  job_id: string;
  status: JobStatusType;
  progress: number;
  message: string;
  task_id: string;
}

interface PdfJobStatusResponse {
  job_id: string;
  status: JobStatusType;
  progress: number;
  message: string;
  quiz_id: number | null;
  question_count: number | null;
  error: string | null;
}

const PDF_JOB_UPLOAD_URL = 'http://127.0.0.1:8000/api/v1/quiz/jop/pdf-jobs';
const PDF_JOB_STATUS_BASE_URL = 'http://127.0.0.1:8000/api/v1/quiz/jop/jobs';
const PDF_JOB_ACTIVE_ID_KEY = 'pdf_active_job_id';

const getAccessToken = () => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

export function PDFTestPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [jobStatus, setJobStatus] = useState<PdfJobStatusResponse | null>(null);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [pageError, setPageError] = useState('');
  const [completedQuestionCount, setCompletedQuestionCount] = useState<number | null>(null);
  const [completedQuizId, setCompletedQuizId] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const isAnalyzing = isStartingJob || (jobStatus !== null && (jobStatus.status === 'queued' || jobStatus.status === 'processing'));

  const cleanupTracking = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const handleJobStatusUpdate = useCallback((update: PdfJobStatusResponse) => {
    setJobStatus(update);
    setPageError('');

    if (update.status === 'completed') {
      cleanupTracking();
      localStorage.removeItem(PDF_JOB_ACTIVE_ID_KEY);
      setCompletedQuizId(update.quiz_id);
      setCompletedQuestionCount(update.question_count);
      setShowSuccessModal(true);
      toast.success('PDF tahlili yakunlandi.');
      return;
    }

    if (update.status === 'failed') {
      cleanupTracking();
      localStorage.removeItem(PDF_JOB_ACTIVE_ID_KEY);
      setPageError(update.error || update.message || "Tahlil jarayonida xatolik yuz berdi.");
      toast.error("PDF tahlili muvaffaqiyatsiz tugadi.");
    }
  }, [cleanupTracking]);

  const fetchJobStatus = useCallback(async (jobId: string, token: string) => {
    const response = await fetch(`${PDF_JOB_STATUS_BASE_URL}/${jobId}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Job holatini olishda xatolik.');
    }

    const data = (await response.json()) as PdfJobStatusResponse;
    handleJobStatusUpdate(data);
    return data;
  }, [handleJobStatusUpdate]);

  const startTrackingJob = useCallback((jobId: string, token: string) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    localStorage.setItem(PDF_JOB_ACTIVE_ID_KEY, jobId);

    const ws = new WebSocket(`ws://localhost:8000/ws/jobs/${jobId}/?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as PdfJobStatusResponse | { type?: string };
        if (typeof (payload as PdfJobStatusResponse).status === 'string') {
          handleJobStatusUpdate(payload as PdfJobStatusResponse);
        }
      } catch {
      }
    };

    ws.onerror = () => {
      // onclose handles fallback fetch/reconnect
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }

      void fetchJobStatus(jobId, token).then((latestStatus) => {
        if (latestStatus.status === 'completed' || latestStatus.status === 'failed') {
          return;
        }

        reconnectTimeoutRef.current = window.setTimeout(() => {
          startTrackingJob(jobId, token);
        }, 3000);
      }).catch(() => {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          startTrackingJob(jobId, token);
        }, 5000);
      });
    };

  }, [fetchJobStatus, handleJobStatusUpdate]);

  useEffect(() => {
    let isCancelled = false;
    const token = getAccessToken();
    const activeJobId = localStorage.getItem(PDF_JOB_ACTIVE_ID_KEY);

    if (!token || !activeJobId) {
      return;
    }

    const resumeJob = async () => {
      try {
        const latestStatus = await fetchJobStatus(activeJobId, token);
        if (isCancelled) {
          return;
        }

        if (latestStatus.status === 'queued' || latestStatus.status === 'processing') {
          startTrackingJob(activeJobId, token);
        } else {
          localStorage.removeItem(PDF_JOB_ACTIVE_ID_KEY);
        }
      } catch {
        localStorage.removeItem(PDF_JOB_ACTIVE_ID_KEY);
      }
    };

    void resumeJob();

    return () => {
      isCancelled = true;
    };
  }, [fetchJobStatus, startTrackingJob]);

  useEffect(() => {
    return () => {
      cleanupTracking();
    };
  }, [cleanupTracking]);

  const handleFileSelect = () => {
    if (isAnalyzing) {
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) {
        return;
      }

      if (file.type !== 'application/pdf') {
        setPageError('Faqat PDF fayl tanlashingiz mumkin.');
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        setPageError('Fayl hajmi 20MB dan oshmasligi kerak.');
        return;
      }

      setPageError('');
      setSelectedFile(file);
    };
    input.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isAnalyzing) {
      return;
    }

    const file = e.dataTransfer.files[0];
    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      setPageError('Faqat PDF fayl tanlashingiz mumkin.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setPageError('Fayl hajmi 20MB dan oshmasligi kerak.');
      return;
    }

    setPageError('');
    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile || isStartingJob || isAnalyzing) {
      return;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      setPageError("Token topilmadi. Avval tizimga kirib ko'ring.");
      return;
    }

    setPageError('');
    setIsStartingJob(true);
    setShowSuccessModal(false);
    setCompletedQuizId(null);
    setCompletedQuestionCount(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(PDF_JOB_UPLOAD_URL, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Faylni yuklashda xatolik yuz berdi.');
      }

      const data = (await response.json()) as PdfJobCreateResponse;
      setJobStatus({
        job_id: data.job_id,
        status: data.status,
        progress: data.progress,
        message: data.message,
        quiz_id: null,
        question_count: null,
        error: null,
      });

      startTrackingJob(data.job_id, accessToken);
      toast.success('Fayl qabul qilindi. Tahlil boshlandi.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Faylni yuklashda xatolik yuz berdi.';
      setPageError(message);
    } finally {
      setIsStartingJob(false);
    }
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
              onClick={() => navigate('/create-test')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </motion.button>
            <h1 className="text-xl font-semibold text-gray-900">
              PDF-dan test yaratish
            </h1>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="flex justify-center"
        >
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2
            }}
            className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center"
          >
            <FileText className="w-10 h-10 text-indigo-600" />
          </motion.div>
        </motion.div>

        {/* Title and Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            PDF faylingizni yuklang
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Sun'iy intellekt yordamida test savollarini avtomatik yaratish uchun PDF faylni tanlang.
          </p>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-white rounded-3xl p-8 border-2 border-dashed transition-all ${isDragging
            ? 'border-indigo-500 bg-indigo-50/50'
            : 'border-gray-300'
            }`}
        >
          <div className="flex flex-col items-center text-center">
            {/* Upload Icon */}
            <motion.div
              animate={{
                y: selectedFile ? 0 : [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: selectedFile ? 0 : Infinity,
              }}
              className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${selectedFile
                ? 'bg-green-100'
                : 'bg-indigo-100'
                }`}
            >
              {selectedFile ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <File className="w-10 h-10 text-green-600" />
                </motion.div>
              ) : (
                <CloudUpload className="w-10 h-10 text-indigo-600" />
              )}
            </motion.div>

            {/* Text */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedFile ? selectedFile.name : 'Faylni tanlang yoki tashlang'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              PDF formatidagi fayllar (maksimal 20MB)
            </p>

            {/* Upload Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFileSelect}
              disabled={isAnalyzing}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              Faylni yuklash
            </motion.button>
          </div>
        </motion.div>

        {pageError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            <p className="text-sm">{pageError}</p>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-blue-900 font-semibold mb-1">Qanday ishlaydi?</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                PDF yuklanganidan so'ng, tizim matni tahlil qiladi va asosiy tushunchalar asosida savollar tuzadi.
              </p>
            </div>
          </div>
        </div>

        {/* Analyze Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{
            scale: selectedFile ? 1.02 : 1,
            boxShadow: selectedFile ? "0 20px 25px -5px rgba(79, 70, 229, 0.3)" : "none"
          }}
          whileTap={{ scale: selectedFile ? 0.98 : 1 }}
          onClick={handleAnalyze}
          disabled={!selectedFile || isAnalyzing}
          className={`w-full py-4 rounded-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-2 ${selectedFile && !isAnalyzing
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
        >
          <FileText className="w-5 h-5" />
          {isAnalyzing ? 'Jarayon davom etmoqda...' : 'Faylni tahlil qilish'}
        </motion.button>
      </div>

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
                  Muvaffaqiyatli tahlil qilindi!
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
                {/* File Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-6 h-6 text-indigo-600 stroke-[2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1E293B] text-sm mb-1">
                        {selectedFile?.name}
                      </h3>
                      <p className="text-xs text-[#64748B] mb-2">
                        {selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB • PDF
                      </p>
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">Tahlil tugallandi</span>
                      </div>
                    </div>
                  </div>
                </div>

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
                        {completedQuestionCount ?? '-'} ta savol yaratildi
                      </p>
                      <p className="text-xs text-[#64748B]">PDF matnidan</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-600 stroke-[2]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">30 daqiqa</p>
                      <p className="text-xs text-[#64748B]">Test davomiyligi</p>
                    </div>
                  </motion.div>
                </div>

                {/* Description */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 mb-5">
                  <p className="text-sm text-[#475569] leading-relaxed">
                    <span className="font-semibold text-[#1E293B]">📝 Test tayyorlandi!</span>
                    <br />
                    Sun'iy intellekt sizning PDF faylingizdan avtomatik ravishda savollar yaratdi.
                    Testni "Mening testlarim" bo'limida ko'rishingiz va tahrirlashingiz mumkin.
                  </p>
                </div>

                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (completedQuizId) {
                      navigate(`/test-detail?id=${completedQuizId}`);
                      return;
                    }

                    navigate('/tests-list');
                  }}
                  className="w-full bg-gradient-to-r from-[#5B5FEF] to-[#7C3AED] text-white py-4 rounded-xl font-semibold text-base hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <ListChecks className="w-5 h-5 stroke-[2.5]" />
                  {completedQuizId ? "Testni ko'rish" : 'Mening testlarim'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNavigation />

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
                  Faylni tahlil qilyapmiz...
                </h3>
                <p className="text-sm text-[#64748B] mb-4">
                  {jobStatus?.message || "PDF matnidan savollar yaratilmoqda"}
                </p>

                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#64748B]">Tahlil jarayoni</span>
                    <span className="text-xs font-semibold text-indigo-600">{jobStatus?.progress ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: `${jobStatus?.progress ?? 0}%` }}
                      transition={{ duration: 0.3 }}
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
