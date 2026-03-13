import { useNavigate, useRouteError } from 'react-router';
import { motion } from 'motion/react';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export function ErrorPage() {
  const navigate = useNavigate();
  const error = useRouteError() as any;

  const isNotFound = error?.status === 404;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <AlertTriangle className="w-12 h-12 text-white" />
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-6xl font-bold text-white mb-4">
            {isNotFound ? '404' : 'Xato'}
          </h1>
          <p className="text-xl text-white text-opacity-90 mb-2">
            {isNotFound
              ? "Sahifa topilmadi"
              : "Nimadir noto'g'ri ketdi"}
          </p>
          <p className="text-white text-opacity-70 text-sm">
            {isNotFound
              ? "Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan."
              : "Iltimos, qaytadan urinib ko'ring yoki bosh sahifaga qayting."}
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="w-full py-4 bg-white text-indigo-600 rounded-xl font-semibold shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Bosh sahifa
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-full py-4 bg-white bg-opacity-20 backdrop-blur-sm text-white border-2 border-white border-opacity-30 rounded-xl font-semibold hover:bg-opacity-30 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Orqaga qaytish
          </motion.button>
        </motion.div>

        {/* Error Details (development only) */}
        {import.meta.env.DEV && error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 bg-black bg-opacity-30 backdrop-blur-sm rounded-xl text-left"
          >
            <p className="text-white text-xs font-mono break-all">
              {error.statusText || error.message || 'Unknown error'}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
