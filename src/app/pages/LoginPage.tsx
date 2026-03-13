import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { User, Lock, Eye, EyeOff, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    role: string | null;
    profile_image: string | null;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Foydalanuvchi nomi va parolni kiriting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const body = new URLSearchParams();
      body.append('username', username.trim());
      body.append('password', password);

      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/me/', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = (await response.json()) as LoginResponse;

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('access_token', data.access_token);
      storage.setItem('refresh_token', data.refresh_token);
      storage.setItem('token_type', data.token_type);
      storage.setItem('user', JSON.stringify(data.user));

      if (rememberMe) {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('token_type');
        sessionStorage.removeItem('user');
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('user');
      }

      toast.success('Muvaffaqiyatli tizimga kirdingiz');
      navigate(searchParams.get('next') || '/');
    } catch {
      setErrorMessage("Login muvaffaqiyatsiz. Username yoki parol noto'g'ri.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Main Container - 8px grid system */}
      <div className="w-full max-w-md">
        {/* Header Section - Clear Hierarchy */}
        <div className="text-center mb-8">
          {/* Logo - Simple and recognizable */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-6">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          
          {/* App Name - High contrast, readable */}
          <h1 className="text-gray-900 font-bold mb-2 text-3xl leading-9">
            Student
          </h1>
          
          {/* Subtitle - Clear purpose */}
          <p className="text-gray-600 font-medium text-base leading-6">
            O'quv testlari platformasiga kirish
          </p>
        </div>

        {/* Login Form - White card for focus */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Form Title - Task-focused */}
          <h2 className="text-gray-900 font-bold mb-6 text-xl leading-7">
            Tizimga kirish
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field - Large, accessible */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-gray-900 font-semibold mb-2 text-sm leading-5"
              >
                Foydalanuvchi nomi
              </label>
              <div className="relative">
                <User className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  autoComplete="username"
                  className="w-full h-14 pl-12 pr-4 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-colors text-base"
                  aria-label="Foydalanuvchi nomi"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Field - Large, accessible */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-gray-900 font-semibold mb-2 text-sm leading-5"
              >
                Parol
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-14 pl-12 pr-12 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-colors text-base"
                  aria-label="Parol"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 w-6 h-6 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password - 8px spacing */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded cursor-pointer focus:ring-4 focus:ring-indigo-100"
                  aria-label="Eslab qolish"
                  disabled={isSubmitting}
                />
                <span className="ml-2 text-gray-700 font-medium text-sm leading-5">
                  Eslab qolish
                </span>
              </label>
              <Link 
                to="#" 
                className="text-indigo-600 hover:text-indigo-700 font-semibold underline transition-colors text-sm leading-5"
              >
                Parolni unutdingizmi?
              </Link>
            </div>

            {errorMessage && (
              <p className="text-sm text-red-600 font-medium" role="alert">
                {errorMessage}
              </p>
            )}

            {/* Submit Button - Dominant, large touch target */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 mt-8 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Kirilmoqda...' : 'Kirish'}
            </button>
          </form>

          {/* Sign Up Link - Clear secondary action */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm leading-5">
              Hali ro'yxatdan o'tmagannisiz?{' '}
              <Link 
                to="/register" 
                className="text-indigo-600 hover:text-indigo-700 font-bold underline transition-colors"
              >
                Ro'yxatdan o'tish
              </Link>
            </p>
          </div>
        </div>

        {/* Help Text - Optional assistance */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-gray-500 bg-gray-100 px-4 py-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <p className="text-xs leading-5">
              Yordam kerakmi? <a href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold underline">Qo'llanma</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
