import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Camera, 
  User, 
  Mail, 
  Phone, 
  School, 
  BookOpen, 
  Target,
  Clock,
  Bell,
  Check,
  X,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNavigation } from '../components/BottomNavigation';

export function ProfilePage() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('👨‍🎓');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: 'Azamat',
    lastName: 'Rahimov',
    email: 'azamat.rahimov@example.com',
    phone: '+998 90 123 45 67',
    school: 'Respublika ixtisoslashtirilgan maktabi',
    grade: '11-sinf',
    bio: 'Matematika va fizikaga qiziqaman. DTM ga tayyorlanmoqdaman.',
    studyGoal: 'DTM 2024',
    preferredStudyTime: 'Kechqurun',
    notificationsEnabled: true,
  });

  const [selectedSubjects, setSelectedSubjects] = useState([
    'Matematika',
    'Fizika',
    'Ingliz tili',
    'Kimyo'
  ]);

  const avatarOptions = ['👨‍🎓', '👩‍🎓', '👨‍💼', '👩‍💼', '👦', '👧', '🧑‍🎓', '👨‍🏫', '👩‍🏫'];
  
  const allSubjects = [
    { name: 'Matematika', icon: '📐', color: 'from-orange-400 to-orange-500' },
    { name: 'Fizika', icon: '⚛️', color: 'from-blue-400 to-blue-500' },
    { name: 'Kimyo', icon: '⚗️', color: 'from-green-400 to-green-500' },
    { name: 'Biologiya', icon: '🧬', color: 'from-teal-400 to-teal-500' },
    { name: 'Ona tili', icon: '📚', color: 'from-purple-400 to-purple-500' },
    { name: 'Ingliz tili', icon: '🌍', color: 'from-indigo-400 to-indigo-500' },
    { name: 'Tarix', icon: '📜', color: 'from-amber-400 to-amber-500' },
    { name: 'Geografiya', icon: '🗺️', color: 'from-cyan-400 to-cyan-500' },
  ];

  const studyGoals = [
    'DTM 2024',
    'DTM 2025',
    'Olimpiada',
    'Maktab imtihonlari',
    'IELTS/CEFR',
    'Shunchaki o\'rganish'
  ];

  const studyTimes = [
    'Ertalab',
    'Kunduzi',
    'Kechqurun',
    'Tunda',
    'Har qanday vaqt'
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSubject = (subjectName: string) => {
    if (selectedSubjects.includes(subjectName)) {
      setSelectedSubjects(prev => prev.filter(s => s !== subjectName));
    } else {
      setSelectedSubjects(prev => [...prev, subjectName]);
    }
  };

  const handleSave = () => {
    // Save logic here
    setIsEditing(false);
    // Show success toast or notification
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data to original values
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#5B5FEF] via-[#6366F1] to-[#7C7FF6] px-5 pt-8 pb-24 relative">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white stroke-[2]" />
          </button>
          
          <h1 className="text-xl font-bold text-white">Profil</h1>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl text-white text-sm font-semibold hover:bg-white/25 transition-colors"
            >
              Tahrirlash
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/25 transition-colors"
              >
                <X className="w-5 h-5 text-white stroke-[2]" />
              </button>
              <button
                onClick={handleSave}
                className="w-10 h-10 bg-[#22C55E] rounded-xl flex items-center justify-center hover:bg-[#16A34A] transition-colors shadow-md"
              >
                <Check className="w-5 h-5 text-white stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Avatar Section */}
      <div className="px-5 -mt-16 mb-6">
        <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_20px_rgba(0,0,0,0.06)] text-center">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center text-5xl border-4 border-white shadow-lg">
              {selectedAvatar}
            </div>
            {isEditing && (
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#5B5FEF] rounded-full flex items-center justify-center shadow-md hover:bg-[#4B4FD0] transition-colors"
              >
                <Camera className="w-4 h-4 text-white stroke-[2]" />
              </button>
            )}
          </div>

          {showAvatarPicker && isEditing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap justify-center gap-3 mb-4 p-4 bg-[#F8FAFC] rounded-xl"
            >
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    setShowAvatarPicker(false);
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                    selectedAvatar === avatar
                      ? 'bg-[#5B5FEF] scale-110 ring-2 ring-[#5B5FEF] ring-offset-2'
                      : 'bg-white hover:scale-105'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </motion.div>
          )}

          <h2 className="text-2xl font-bold text-[#1E293B] mb-1">
            {formData.firstName} {formData.lastName}
          </h2>
          <p className="text-[#64748B] text-sm mb-3">{formData.school}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B5FEF]/10 rounded-full">
            <School className="w-4 h-4 text-[#5B5FEF] stroke-[2]" />
            <span className="text-[#5B5FEF] font-semibold text-sm">{formData.grade}</span>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Personal Information */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-bold text-[#1E293B] mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#5B5FEF] stroke-[2]" />
            Shaxsiy ma'lumotlar
          </h3>

          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="text-sm font-semibold text-[#64748B] mb-2 block">Ism</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B5FEF] focus:border-transparent text-[#1E293B] font-medium"
                />
              ) : (
                <p className="text-[#1E293B] font-semibold">{formData.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="text-sm font-semibold text-[#64748B] mb-2 block">Familiya</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B5FEF] focus:border-transparent text-[#1E293B] font-medium"
                />
              ) : (
                <p className="text-[#1E293B] font-semibold">{formData.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-semibold text-[#64748B] mb-2 block flex items-center gap-1.5">
                <Mail className="w-4 h-4" />
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B5FEF] focus:border-transparent text-[#1E293B] font-medium"
                />
              ) : (
                <p className="text-[#1E293B] font-semibold">{formData.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-semibold text-[#64748B] mb-2 block flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                Telefon raqam
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B5FEF] focus:border-transparent text-[#1E293B] font-medium"
                />
              ) : (
                <p className="text-[#1E293B] font-semibold">{formData.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Education Information */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-bold text-[#1E293B] mb-4 flex items-center gap-2">
            <School className="w-5 h-5 text-[#5B5FEF] stroke-[2]" />
            Ta'lim
          </h3>

          <div className="space-y-4">
            {/* School */}
            <div>
              <label className="text-sm font-semibold text-[#64748B] mb-2 block">Maktab/Universitet</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.school}
                  onChange={(e) => handleInputChange('school', e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B5FEF] focus:border-transparent text-[#1E293B] font-medium"
                />
              ) : (
                <p className="text-[#1E293B] font-semibold">{formData.school}</p>
              )}
            </div>

            {/* Grade */}
            <div>
              <label className="text-sm font-semibold text-[#64748B] mb-2 block">Sinf</label>
              {isEditing ? (
                <select
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B5FEF] focus:border-transparent text-[#1E293B] font-medium"
                >
                  {Array.from({ length: 11 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={`${num}-sinf`}>{num}-sinf</option>
                  ))}
                  <option value="Universitet">Universitet</option>
                </select>
              ) : (
                <p className="text-[#1E293B] font-semibold">{formData.grade}</p>
              )}
            </div>
          </div>
        </div>

        {/* Selected Subjects */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-bold text-[#1E293B] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#5B5FEF] stroke-[2]" />
            Fanlar
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {allSubjects.map((subject) => {
              const isSelected = selectedSubjects.includes(subject.name);
              return (
                <button
                  key={subject.name}
                  onClick={() => isEditing && toggleSubject(subject.name)}
                  disabled={!isEditing}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-[#5B5FEF] bg-[#5B5FEF]/5'
                      : 'border-gray-200 bg-[#F8FAFC]'
                  } ${isEditing ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 bg-gradient-to-br ${subject.color} rounded-xl flex items-center justify-center text-2xl shadow-sm`}>
                      {subject.icon}
                    </div>
                    <div className="text-center w-full">
                      <p className={`font-semibold text-sm leading-tight ${isSelected ? 'text-[#5B5FEF]' : 'text-[#1E293B]'}`}>
                        {subject.name}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 bg-[#5B5FEF] rounded-full flex items-center justify-center mt-1">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Study Preferences */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-bold text-[#1E293B] mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#5B5FEF] stroke-[2]" />
            O'qish sozlamalari
          </h3>

          <div className="space-y-4">
            {/* Study Goal */}
            <div>
              <label className="text-sm font-semibold text-[#64748B] mb-2 block">Maqsad</label>
              {isEditing ? (
                <select
                  value={formData.studyGoal}
                  onChange={(e) => handleInputChange('studyGoal', e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B5FEF] focus:border-transparent text-[#1E293B] font-medium"
                >
                  {studyGoals.map((goal) => (
                    <option key={goal} value={goal}>{goal}</option>
                  ))}
                </select>
              ) : (
                <p className="text-[#1E293B] font-semibold">{formData.studyGoal}</p>
              )}
            </div>

            {/* Preferred Study Time */}
            <div>
              <label className="text-sm font-semibold text-[#64748B] mb-2 block flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Afzal o'qish vaqti
              </label>
              {isEditing ? (
                <select
                  value={formData.preferredStudyTime}
                  onChange={(e) => handleInputChange('preferredStudyTime', e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B5FEF] focus:border-transparent text-[#1E293B] font-medium"
                >
                  {studyTimes.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              ) : (
                <p className="text-[#1E293B] font-semibold">{formData.preferredStudyTime}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-semibold text-[#64748B] mb-2 block">Haqimda</label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B5FEF] focus:border-transparent text-[#1E293B] font-medium resize-none"
                />
              ) : (
                <p className="text-[#1E293B] font-medium">{formData.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <h3 className="text-lg font-bold text-[#1E293B] mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#5B5FEF] stroke-[2]" />
            Bildirishnomalar
          </h3>

          <button
            onClick={() => isEditing && handleInputChange('notificationsEnabled', !formData.notificationsEnabled)}
            disabled={!isEditing}
            className="w-full flex items-center justify-between p-4 bg-[#F8FAFC] rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                formData.notificationsEnabled ? 'bg-[#5B5FEF]/10' : 'bg-gray-100'
              }`}>
                <Bell className={`w-5 h-5 stroke-[2] ${
                  formData.notificationsEnabled ? 'text-[#5B5FEF]' : 'text-gray-400'
                }`} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#1E293B]">Push bildirishnomalar</p>
                <p className="text-sm text-[#64748B]">Test va takliflar haqida xabar olish</p>
              </div>
            </div>
            <div className={`w-12 h-7 rounded-full transition-all ${
              formData.notificationsEnabled ? 'bg-[#22C55E]' : 'bg-gray-300'
            } relative`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                formData.notificationsEnabled ? 'right-1' : 'left-1'
              } shadow-sm`}></div>
            </div>
          </button>
        </div>

        {/* Statistics Section */}
        <div className="bg-gradient-to-br from-[#5B5FEF] to-[#7C3AED] rounded-[20px] p-5 shadow-[0_12px_30px_rgba(91,93,239,0.25)]">
          <h3 className="text-lg font-bold text-white mb-4">Statistikam</h3>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white mb-1">156</p>
              <p className="text-white/80 text-xs">Testlar</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white mb-1">89%</p>
              <p className="text-white/80 text-xs">O'rtacha</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white mb-1">1.2k</p>
              <p className="text-white/80 text-xs">XP</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3 pb-4"
          >
            <button
              onClick={handleCancel}
              className="py-3.5 bg-gray-100 text-[#64748B] rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5 stroke-[2]" />
              Bekor qilish
            </button>
            <button
              onClick={handleSave}
              className="py-3.5 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              Saqlash
            </button>
          </motion.div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}