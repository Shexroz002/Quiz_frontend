import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft, 
  Camera, 
  User, 
  Mail, 
  Phone, 
  School, 
  BookOpen, 
  Check,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNavigation } from '../components/BottomNavigation';
import { getAccessToken } from '../lib/auth';

const AUTH_ME_URL = 'http://127.0.0.1:8000/api/v1/auth/me/';
const USERS_BASE_URL = 'http://127.0.0.1:8000/api/v1/users';
const SUBJECT_LIST_URL = 'http://127.0.0.1:8000/api/v1/subject/list/';

type ProfileSubject = {
  id: number;
  subject: {
    id: number;
    name: string;
    type: string;
    icon: string | null;
  };
};

type ProfileResponse = {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  profile_image: string | null;
  email: string | null;
  phone_number: string | null;
  school_name: string | null;
  education_level: string | null;
  subjects: ProfileSubject[];
};

type UserSubjectCard = {
  id: number;
  name: string;
  icon: string;
};

type SubjectListItem = {
  id: number;
  name: string;
  type: string;
  icon: string | null;
};

export function ProfilePage() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccessMessage, setAvatarSuccessMessage] = useState('');
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [userSubjects, setUserSubjects] = useState<UserSubjectCard[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectListItem[]>([]);
  const [isSubjectsCatalogLoading, setIsSubjectsCatalogLoading] = useState(false);
  const [subjectsCatalogError, setSubjectsCatalogError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    school: '',
    grade: '',
  });
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        if (!isMounted) return;
        setProfileError("Token topilmadi. Profil yuklanmadi.");
        setIsProfileLoading(false);
        return;
      }

      try {
        setIsProfileLoading(true);
        setProfileError('');

        const response = await fetch(AUTH_ME_URL, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          if (!isMounted) return;
          setProfileError("Profil ma'lumotlari yuklanmadi. Qaytadan urinib ko'ring.");
          return;
        }

        const payload = (await response.json()) as ProfileResponse;

        if (!isMounted) return;

        setProfileId(payload.id);
        setFormData((prev) => ({
          ...prev,
          firstName: payload.first_name ?? '',
          lastName: payload.last_name ?? '',
          email: payload.email ?? '',
          phone: payload.phone_number ?? '',
          school: payload.school_name ?? '',
          grade: payload.education_level ?? '',
        }));
        setProfileImageUrl(payload.profile_image ?? '');
        setUserSubjects(
          payload.subjects.map((item) => ({
            id: item.subject.id,
            name: item.subject.name,
            icon: item.subject.icon?.trim() || '📘',
          }))
        );
        setSelectedSubjectIds(payload.subjects.map((item) => item.subject.id));
      } catch {
        if (!isMounted) return;
        setProfileError("Profil ma'lumotlari yuklanmadi. Qaytadan urinib ko'ring.");
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    void fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isEditing) {
      return () => {
        isMounted = false;
      };
    }

    const fetchSubjectsCatalog = async () => {
      try {
        setIsSubjectsCatalogLoading(true);
        setSubjectsCatalogError('');

        const response = await fetch(SUBJECT_LIST_URL, {
          method: 'GET',
          headers: {
            accept: 'application/json',
          },
        });

        if (!response.ok) {
          if (!isMounted) return;
          setAvailableSubjects([]);
          setSubjectsCatalogError("Fanlar ro'yxati yuklanmadi. Qaytadan urinib ko'ring.");
          return;
        }

        const payload = (await response.json()) as SubjectListItem[];

        if (!isMounted) return;
        setAvailableSubjects(Array.isArray(payload) ? payload : []);
      } catch {
        if (!isMounted) return;
        setAvailableSubjects([]);
        setSubjectsCatalogError("Fanlar ro'yxati yuklanmadi. Qaytadan urinib ko'ring.");
      } finally {
        if (isMounted) {
          setIsSubjectsCatalogLoading(false);
        }
      }
    };

    void fetchSubjectsCatalog();

    return () => {
      isMounted = false;
    };
  }, [isEditing]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjectIds((prev) => (
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    ));
  };

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!profileId) {
      setAvatarError('Foydalanuvchi ID topilmadi. Avatar yuklanmadi.');
      event.target.value = '';
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      setAvatarError("Token topilmadi. Avatar yuklanmadi.");
      event.target.value = '';
      return;
    }

    try {
      setIsAvatarUploading(true);
      setAvatarError('');
      setAvatarSuccessMessage('');

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${USERS_BASE_URL}/${profileId}/avatar/`, {
        method: 'PUT',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        setAvatarError("Avatarni yuklashda xatolik bo'ldi. Qaytadan urinib ko'ring.");
        return;
      }

      setProfileImageUrl(URL.createObjectURL(file));
      setAvatarSuccessMessage('Avatar yangilandi.');
    } catch {
      setAvatarError("Avatarni yuklashda xatolik bo'ldi. Qaytadan urinib ko'ring.");
    } finally {
      setIsAvatarUploading(false);
      event.target.value = '';
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
    <div className="min-h-screen bg-[#F8FAFC] pb-36">
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
          {profileError ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left">
              <p className="text-sm text-rose-700">{profileError}</p>
            </div>
          ) : null}

          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 bg-[linear-gradient(145deg,#4F46E5_0%,#6366F1_42%,#06B6D4_100%)] rounded-full flex items-center justify-center text-5xl border-4 border-white shadow-[0_18px_40px_rgba(79,70,229,0.24)] overflow-hidden">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                '👨‍🎓'
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleAvatarFileChange(event)}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isAvatarUploading || isProfileLoading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-[#5B5FEF] rounded-full flex items-center justify-center shadow-md hover:bg-[#4B4FD0] transition-colors disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Camera className="w-4 h-4 text-white stroke-[2]" />
            </button>
          </div>

          {avatarError ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left">
              <p className="text-sm text-rose-700">{avatarError}</p>
            </div>
          ) : null}

          {avatarSuccessMessage ? (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left">
              <p className="text-sm text-emerald-700">{avatarSuccessMessage}</p>
            </div>
          ) : null}

          <div className="mb-4">
            <p className="text-xs font-medium text-slate-500">
              {isAvatarUploading ? 'Avatar yuklanmoqda...' : 'Avatar rasmi alohida yangilanadi'}
            </p>
          </div>

          <h2 className="text-2xl font-bold text-[#1E293B] mb-1">
            {isProfileLoading ? 'Yuklanmoqda...' : `${formData.firstName} ${formData.lastName}`.trim() || 'Foydalanuvchi'}
          </h2>
          <p className="text-[#64748B] text-sm mb-3">{formData.school || 'Maktab kiritilmagan'}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B5FEF]/10 rounded-full">
            <School className="w-4 h-4 text-[#5B5FEF] stroke-[2]" />
            <span className="text-[#5B5FEF] font-semibold text-sm">{formData.grade || 'Daraja kiritilmagan'}</span>
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
                <p className="text-[#1E293B] font-semibold">{formData.firstName || '-'}</p>
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
                <p className="text-[#1E293B] font-semibold">{formData.lastName || '-'}</p>
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
                <p className="text-[#1E293B] font-semibold">{formData.email || '-'}</p>
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
                <p className="text-[#1E293B] font-semibold">{formData.phone || '-'}</p>
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
                <p className="text-[#1E293B] font-semibold">{formData.school || '-'}</p>
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
                <p className="text-[#1E293B] font-semibold">{formData.grade || '-'}</p>
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

          {!isEditing && userSubjects.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-600">Foydalanuvchiga biriktirilgan fanlar topilmadi.</p>
            </div>
          ) : isEditing ? (
            isSubjectsCatalogLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-xl border-2 border-slate-200 bg-slate-50 p-3 animate-pulse">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-xl bg-slate-200" />
                      <div className="h-4 w-20 rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : subjectsCatalogError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
                <p className="text-sm text-rose-700">{subjectsCatalogError}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {availableSubjects.map((subject) => {
                  const isSelected = selectedSubjectIds.includes(subject.id);

                  return (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => toggleSubject(subject.id)}
                      className={`p-3 rounded-xl border-2 transition-all active:scale-95 ${
                        isSelected
                          ? 'border-[#5B5FEF] bg-[#5B5FEF]/5'
                          : 'border-gray-200 bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm bg-white">
                          {subject.icon?.trim() || '📘'}
                        </div>
                        <div className="text-center w-full">
                          <p className={`font-semibold text-sm leading-tight ${isSelected ? 'text-[#5B5FEF]' : 'text-[#1E293B]'}`}>
                            {subject.name}
                          </p>
                        </div>
                        {isSelected ? (
                          <div className="w-5 h-5 bg-[#5B5FEF] rounded-full flex items-center justify-center mt-1">
                            <Check className="w-3 h-3 text-white stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 mt-1" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {userSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="p-3 rounded-xl border-2 border-[#5B5FEF] bg-[#5B5FEF]/5"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm bg-white">
                      {subject.icon}
                    </div>
                    <div className="text-center w-full">
                      <p className="font-semibold text-sm leading-tight text-[#5B5FEF]">
                        {subject.name}
                      </p>
                    </div>
                    <div className="w-5 h-5 bg-[#5B5FEF] rounded-full flex items-center justify-center mt-1">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
