import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BookOpen,
  Globe,
  BookText,
  Grid3x3,
  FlaskConical,
  Microscope,
  Leaf,
  Map,
  Scroll,
  Building2,
  Monitor,
  Languages,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'languages' | 'stem' | 'sciences';
}

export function SelectSubjectsPage() {
  const navigate = useNavigate();
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['languages', 'stem', 'sciences'])
  );

  const subjects: Subject[] = [
    // Languages & Literature
    { id: 'ona-tili', name: 'Ona tili', icon: <BookOpen className="w-5 h-5" />, category: 'languages' },
    { id: 'rus-tili', name: 'Rus tili', icon: <Globe className="w-5 h-5" />, category: 'languages' },
    { id: 'chet-tillari', name: 'Chet tillari', icon: <Languages className="w-5 h-5" />, category: 'languages' },
    { id: 'adabiyot', name: 'Adabiyot', icon: <BookText className="w-5 h-5" />, category: 'languages' },

    // STEM Subjects
    { id: 'matematika', name: 'Matematika', icon: <Grid3x3 className="w-5 h-5" />, category: 'stem' },
    { id: 'fizika', name: 'Fizika', icon: <FlaskConical className="w-5 h-5" />, category: 'stem' },
    { id: 'kimyo', name: 'Kimyo', icon: <Microscope className="w-5 h-5" />, category: 'stem' },
    { id: 'informatika', name: 'Informatika', icon: <Monitor className="w-5 h-5" />, category: 'stem' },

    // Natural & Social Sciences
    { id: 'biologiya', name: 'Biologiya', icon: <Leaf className="w-5 h-5" />, category: 'sciences' },
    { id: 'geografiya', name: 'Geografiya', icon: <Map className="w-5 h-5" />, category: 'sciences' },
    { id: 'ozbekiston-tarixi', name: "O'zbekiston tarixi", icon: <Scroll className="w-5 h-5" />, category: 'sciences' },
    { id: 'jahon-tarixi', name: 'Jahon tarixi', icon: <Building2 className="w-5 h-5" />, category: 'sciences' },
  ];

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

  const toggleSubject = (subjectId: string) => {
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

  const handleContinue = () => {
    if (selectedSubjects.size >= 2) {
      console.log('Selected subjects:', Array.from(selectedSubjects));
      navigate('/');
    }
  };

  const isValid = selectedSubjects.size >= 2;
  const minRequired = 2;

  const getSubjectsByCategory = (category: string) => {
    return subjects.filter(s => s.category === category);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Fixed */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        {/* Progress Indicator */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Ro'yxatdan o'tish</p>
              <p className="text-xs text-gray-500 mt-1">3-qadam / 3 qadamdan</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Steps */}
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="w-6 h-0.5 bg-purple-600 rounded-full"></div>
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="w-6 h-0.5 bg-purple-600 rounded-full"></div>
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </div>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Title & Counter */}
        <div className="px-4 pb-4">
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
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <div className="space-y-4 max-w-md mx-auto">
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

      {/* Sticky Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleContinue}
            disabled={!isValid}
            className={`w-full h-14 rounded-2xl font-bold text-base transition-all ${isValid
                ? 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            aria-label={isValid ? 'Davom etish' : `Kamida ${minRequired} ta fan tanlang`}
          >
            {isValid ? 'Davom etish' : `Kamida ${minRequired} ta fan tanlang`}
          </button>
        </div>
      </div>
    </div>
  );
}