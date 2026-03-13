import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  User, Lock, Eye, EyeOff, GraduationCap, UserCircle, Briefcase, Check, ChevronLeft,
  Grid3x3, Leaf, Languages, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

type UserRole = 'school-student' | 'university-student' | 'teacher' | null;

interface Subject {
  id: number;
  name: string;
  icon: string;
  category: 'languages' | 'stem' | 'sciences';
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: ''
  });
  const [selectedSubjects, setSelectedSubjects] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['languages', 'stem', 'sciences'])
  );
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    // Auto-advance to step 2 after role selection
    setTimeout(() => setCurrentStep(2), 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Move to step 3 (subject selection)
    setCurrentStep(3);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  useEffect(() => {
    const loadSubjects = async () => {
      setIsSubjectsLoading(true);
      setSubjectsError('');

      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/subject/list/', {
          method: 'GET',
          headers: { accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to load subjects');
        }

        const data = (await response.json()) as Array<{
          id: number;
          name: string;
          type: string;
          icon: string;
        }>;

        const allowedTypes: Subject['category'][] = ['languages', 'stem', 'sciences'];

        setSubjects(
          data
            .filter((subject) => allowedTypes.includes(subject.type as Subject['category']))
            .map((subject) => ({
              id: subject.id,
              name: subject.name,
              category: subject.type as Subject['category'],
              icon: subject.icon || '📘',
            }))
        );
      } catch {
        setSubjectsError("Fanlar ro'yxatini yuklab bo'lmadi. Qaytadan urinib ko'ring.");
      } finally {
        setIsSubjectsLoading(false);
      }
    };

    void loadSubjects();
  }, []);

  const categories = {
    languages: {
      label: 'Tillar va adabiyot',
      icon: <Languages className="w-5 h-5" />,
      emoji: '📚'
    },
    stem: {
      label: 'Aniq fanlar',
      icon: <Grid3x3 className="w-5 h-5" />,
      emoji: '🔬'
    },
    sciences: {
      label: 'Tabiiy va ijtimoiy fanlar',
      icon: <Leaf className="w-5 h-5" />,
      emoji: '🌍'
    }
  };

  const getSubjectsByCategory = (category: 'languages' | 'stem' | 'sciences') => {
    return subjects.filter(s => s.category === category);
  };

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleFinalSubmit = async () => {
    if (selectedSubjects.size < 2 || isRegistering) {
      return;
    }

    setRegistrationError('');
    setIsRegistering(true);

    const registrationData = {
      username: formData.username,
      password: formData.password,
      first_name: formData.firstName,
      last_name: formData.lastName,
      subjects: Array.from(selectedSubjects).map(id => ({ id })),
      role: userRole === 'teacher' ? 'teacher' : 'student'
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/register/', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null) as { detail?: string } | null;
        throw new Error(errorData?.detail || "Ro'yxatdan o'tishda xatolik yuz berdi.");
      }

      toast.success("Ro'yxatdan o'tish muvaffaqiyatli.");
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ro'yxatdan o'tishda xatolik yuz berdi.";
      setRegistrationError(message);
    } finally {
      setIsRegistering(false);
    }
  };

  const progressPercentage = (currentStep / 3) * 100;

  const isValid = selectedSubjects.size >= 2;
  const minRequired = 2;
  const isSubmitDisabled = !isValid || isRegistering || isSubjectsLoading || !!subjectsError;
  const submitButtonText = isRegistering
    ? "Yuborilmoqda..."
    : isSubjectsLoading
      ? 'Fanlar yuklanmoqda...'
      : subjectsError
        ? "Fanlar yuklanmagan"
        : isValid
          ? 'Ro\'yxatdan o\'tish'
          : `Kamida ${minRequired} ta fan tanlang`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Ro'yxatdan o'tish</p>
              <p className="text-xs text-gray-500 mt-1">{currentStep}-qadam / 3 qadamdan</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Step 1 */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${currentStep > 1 ? 'bg-indigo-600 text-white' : currentStep === 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className={`w-8 h-1 rounded-full transition-all ${currentStep > 1 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>

              {/* Step 2 */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${currentStep > 2 ? 'bg-indigo-600 text-white' : currentStep === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className={`w-8 h-1 rounded-full transition-all ${currentStep > 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>

              {/* Step 3 */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${currentStep === 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                3
              </div>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          {/* Back Button (show on step 2 and 3) */}
          {(currentStep === 2 || currentStep === 3) && (
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-semibold">Orqaga</span>
            </button>
          )}

          {/* Step 1: Role Selection */}
          {currentStep === 1 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Xush kelibsiz!
                </h1>
                <p className="text-sm text-gray-600">
                  Kim sifatida ro'yxatdan o'tasiz?
                </p>
              </div>

              <div className="space-y-4">
                {/* School Student */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('school-student')}
                  className={`w-full flex items-center gap-4 p-5 border-2 rounded-xl transition-all hover:border-indigo-300 hover:shadow-md ${userRole === 'school-student'
                    ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-100'
                    : 'border-gray-300 bg-white'
                    }`}
                  aria-pressed={userRole === 'school-student'}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${userRole === 'school-student' ? 'bg-indigo-600' : 'bg-gray-100'
                    }`}>
                    <UserCircle className={`w-7 h-7 ${userRole === 'school-student' ? 'text-white' : 'text-gray-600'
                      }`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-bold text-base mb-1 ${userRole === 'school-student' ? 'text-indigo-900' : 'text-gray-900'
                      }`}>
                      O'quvchi (Maktab)
                    </p>
                    <p className="text-xs text-gray-500">5-11 sinf o'quvchilari uchun</p>
                  </div>
                  {userRole === 'school-student' && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>

                {/* University Student */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('university-student')}
                  className={`w-full flex items-center gap-4 p-5 border-2 rounded-xl transition-all hover:border-indigo-300 hover:shadow-md ${userRole === 'university-student'
                    ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-100'
                    : 'border-gray-300 bg-white'
                    }`}
                  aria-pressed={userRole === 'university-student'}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${userRole === 'university-student' ? 'bg-indigo-600' : 'bg-gray-100'
                    }`}>
                    <GraduationCap className={`w-7 h-7 ${userRole === 'university-student' ? 'text-white' : 'text-gray-600'
                      }`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-bold text-base mb-1 ${userRole === 'university-student' ? 'text-indigo-900' : 'text-gray-900'
                      }`}>
                      Talaba (Universitet)
                    </p>
                    <p className="text-xs text-gray-500">Universitet yoki kollej talabasi</p>
                  </div>
                  {userRole === 'university-student' && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>

                {/* Teacher */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('teacher')}
                  className={`w-full flex items-center gap-4 p-5 border-2 rounded-xl transition-all hover:border-indigo-300 hover:shadow-md ${userRole === 'teacher'
                    ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-100'
                    : 'border-gray-300 bg-white'
                    }`}
                  aria-pressed={userRole === 'teacher'}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${userRole === 'teacher' ? 'bg-indigo-600' : 'bg-gray-100'
                    }`}>
                    <Briefcase className={`w-7 h-7 ${userRole === 'teacher' ? 'text-white' : 'text-gray-600'
                      }`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className={`font-bold text-base mb-1 ${userRole === 'teacher' ? 'text-indigo-900' : 'text-gray-900'
                      }`}>
                      O'qituvchi
                    </p>
                    <p className="text-xs text-gray-500">Maktab yoki universitet o'qituvchisi</p>
                  </div>
                  {userRole === 'teacher' && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Shaxsiy ma'lumotlar
                </h1>
                <p className="text-sm text-gray-600">
                  Iltimos, barcha maydonlarni to'ldiring
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* First Name */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-gray-900 mb-2">
                    Ism
                    <span className="text-red-600 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      placeholder="Ismingizni kiriting"
                      required
                      className="w-full h-14 pl-12 pr-4 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-colors text-base"
                      aria-label="Ism"
                    />
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-gray-900 mb-2">
                    Familiya
                    <span className="text-red-600 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      placeholder="Familiyangizni kiriting"
                      required
                      className="w-full h-14 pl-12 pr-4 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-colors text-base"
                      aria-label="Familiya"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-900 mb-2">
                    Foydalanuvchi nomi
                    <span className="text-red-600 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      placeholder="username"
                      required
                      className="w-full h-14 pl-12 pr-4 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-colors text-base"
                      aria-label="Foydalanuvchi nomi"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Lotin harflari va raqamlardan foydalaning
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                    Parol
                    <span className="text-red-600 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Kamida 8 ta belgi"
                      required
                      minLength={8}
                      className="w-full h-14 pl-12 pr-12 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-colors text-base"
                      aria-label="Parol"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 w-6 h-6 text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Kamida 8 ta belgi ishlatish tavsiya etiladi
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 mt-8 text-base"
                >
                  Fanlarni tanlash
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Subject Selection */}
          {currentStep === 3 && (
            <div className="-m-6 md:-m-8">
              {/* Header Section */}
              <div className="bg-white border-b border-gray-200 p-6 md:p-8">
                {/* Back Button */}
                {/* <button
                  onClick={goBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-semibold">Orqaga</span>
                </button> */}

                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Qaysi fanlarni o'rganmoqchisiz?
                </h1>

                {/* Real-time Selection Counter */}
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${isValid
                  ? 'bg-green-50 border-2 border-green-500'
                  : 'bg-purple-50 border-2 border-purple-200'
                  }`}>
                  {isValid ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-bold text-green-900">
                        {selectedSubjects.size} fan tanlandi ✓
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-bold text-purple-900">
                        {selectedSubjects.size} / kamida {minRequired} ta fan tanlang
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Scrollable Subject List */}
              <div className="overflow-y-auto p-6 md:p-8" style={{ maxHeight: '400px' }}>
                {isSubjectsLoading && (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 mb-4">
                    <p className="text-sm font-medium text-indigo-900">Fanlar yuklanmoqda...</p>
                  </div>
                )}

                {!isSubjectsLoading && subjectsError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-4">
                    <p className="text-sm font-medium text-red-700">{subjectsError}</p>
                  </div>
                )}

                {!isSubjectsLoading && !subjectsError && subjects.length === 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
                    <p className="text-sm font-medium text-amber-800">Hozircha fanlar topilmadi.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Languages Section */}
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => toggleSection('languages')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{categories.languages.emoji}</span>
                        <div className="text-left">
                          <p className="text-sm font-bold text-gray-900">
                            {categories.languages.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getSubjectsByCategory('languages').length} ta fan
                          </p>
                        </div>
                      </div>
                      {expandedSections.has('languages') ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.has('languages') && (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-2">
                          {getSubjectsByCategory('languages').map((subject) => {
                            const isSelected = selectedSubjects.has(subject.id);
                            return (
                              <button
                                key={subject.id}
                                onClick={() => toggleSubject(subject.id)}
                                className={`relative min-h-[72px] p-3 rounded-2xl border-2 transition-all ${isSelected
                                  ? 'border-purple-600 bg-purple-600 shadow-lg shadow-purple-200 scale-[0.98]'
                                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md active:scale-[0.97]'
                                  }`}
                                aria-pressed={isSelected}
                              >
                                {isSelected && (
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-purple-600" />
                                  </div>
                                )}

                                <div className={`flex flex-col items-start gap-1.5 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                  <div className={isSelected ? 'text-white' : 'text-gray-400'}>
                                    {subject.icon}
                                  </div>
                                  <p className="text-sm font-semibold leading-tight text-left">
                                    {subject.name}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEM Section */}
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => toggleSection('stem')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{categories.stem.emoji}</span>
                        <div className="text-left">
                          <p className="text-sm font-bold text-gray-900">
                            {categories.stem.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getSubjectsByCategory('stem').length} ta fan
                          </p>
                        </div>
                      </div>
                      {expandedSections.has('stem') ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.has('stem') && (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-2">
                          {getSubjectsByCategory('stem').map((subject) => {
                            const isSelected = selectedSubjects.has(subject.id);
                            return (
                              <button
                                key={subject.id}
                                onClick={() => toggleSubject(subject.id)}
                                className={`relative min-h-[72px] p-3 rounded-2xl border-2 transition-all ${isSelected
                                  ? 'border-purple-600 bg-purple-600 shadow-lg shadow-purple-200 scale-[0.98]'
                                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md active:scale-[0.97]'
                                  }`}
                                aria-pressed={isSelected}
                              >
                                {isSelected && (
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-purple-600" />
                                  </div>
                                )}

                                <div className={`flex flex-col items-start gap-1.5 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                  <div className={isSelected ? 'text-white' : 'text-gray-400'}>
                                    {subject.icon}
                                  </div>
                                  <p className="text-sm font-semibold leading-tight text-left">
                                    {subject.name}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sciences Section */}
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => toggleSection('sciences')}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{categories.sciences.emoji}</span>
                        <div className="text-left">
                          <p className="text-sm font-bold text-gray-900">
                            {categories.sciences.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getSubjectsByCategory('sciences').length} ta fan
                          </p>
                        </div>
                      </div>
                      {expandedSections.has('sciences') ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {expandedSections.has('sciences') && (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-2">
                          {getSubjectsByCategory('sciences').map((subject) => {
                            const isSelected = selectedSubjects.has(subject.id);
                            return (
                              <button
                                key={subject.id}
                                onClick={() => toggleSubject(subject.id)}
                                className={`relative min-h-[72px] p-3 rounded-2xl border-2 transition-all ${isSelected
                                  ? 'border-purple-600 bg-purple-600 shadow-lg shadow-purple-200 scale-[0.98]'
                                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md active:scale-[0.97]'
                                  }`}
                                aria-pressed={isSelected}
                              >
                                {isSelected && (
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-purple-600" />
                                  </div>
                                )}

                                <div className={`flex flex-col items-start gap-1.5 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                  <div className={isSelected ? 'text-white' : 'text-gray-400'}>
                                    {subject.icon}
                                  </div>
                                  <p className="text-sm font-semibold leading-tight text-left">
                                    {subject.name}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Submit Button */}
              <div className="bg-white border-t border-gray-200 p-6 md:p-8">
                {registrationError && (
                  <p className="mb-4 text-sm font-medium text-red-700">{registrationError}</p>
                )}
                <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitDisabled}
                  className={`w-full h-14 rounded-2xl font-bold text-base transition-all ${!isSubmitDisabled
                    ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  aria-label={submitButtonText}
                >
                  {submitButtonText}
                </button>
              </div>
            </div>
          )}

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Sizda allaqachon hisob bormi?{' '}
              <Link to="/" className="text-indigo-600 hover:text-indigo-700 font-bold underline transition-colors">
                Tizimga kiring
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
