import { useNavigate } from 'react-router';
import { 
  Bell,
  Users,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  Plus,
  Link2,
  BarChart3,
  Settings
} from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';

export function DashboardTeacherPage() {
  const navigate = useNavigate();

  // Statistics data
  const stats = [
    { 
      title: "Jami o'quvchilar", 
      value: "156", 
      subtitle: "3 ta guruhda",
      icon: Users,
      color: "#2563EB"
    },
    { 
      title: "Faol testlar", 
      value: "12", 
      subtitle: "Hozir ishlayapti",
      icon: ClipboardList,
      color: "#10B981"
    },
    { 
      title: "O'rtacha ball", 
      value: "78%", 
      subtitle: "+5% o'tgan oy",
      icon: TrendingUp,
      color: "#2563EB"
    },
    { 
      title: "Eng zaif mavzu", 
      value: "Algebra", 
      subtitle: "64% to'g'ri",
      icon: AlertCircle,
      color: "#F59E0B"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-5 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#0F172A] text-xl font-bold mb-1">Xush kelibsiz, Ustoz 👋</h1>
            <p className="text-[#475569] text-sm">Bugungi natijalaringiz</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-[#475569]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#2563EB] rounded-full"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center">
              <span className="text-white text-sm font-semibold">UA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                    <IconComponent className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#0F172A] mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-[#0F172A] mb-1">{stat.title}</p>
                <p className="text-xs text-[#475569]">{stat.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Main Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/create-test')}
            className="w-full bg-[#2563EB] hover:bg-[#1E40AF] rounded-xl p-4 flex items-center justify-between transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-base">Test yaratish</p>
                <p className="text-white/80 text-xs">Yangi test qo'shish</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="grid grid-cols-3 gap-3">
            <button className="bg-white hover:bg-gray-50 border border-[#E2E8F0] rounded-xl p-3 transition-colors shadow-sm">
              <div className="w-10 h-10 bg-[#2563EB]/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Link2 className="w-5 h-5 text-[#2563EB]" />
              </div>
              <p className="text-[#0F172A] font-medium text-xs text-center">Test biriktirish</p>
            </button>

            <button 
              onClick={() => navigate('/statistic-teacher')}
              className="bg-white hover:bg-gray-50 border border-[#E2E8F0] rounded-xl p-3 transition-colors shadow-sm"
            >
              <div className="w-10 h-10 bg-[#10B981]/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-5 h-5 text-[#10B981]" />
              </div>
              <p className="text-[#0F172A] font-medium text-xs text-center">Statistika</p>
            </button>

            <button className="bg-white hover:bg-gray-50 border border-[#E2E8F0] rounded-xl p-3 transition-colors shadow-sm">
              <div className="w-10 h-10 bg-[#2563EB]/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Settings className="w-5 h-5 text-[#2563EB]" />
              </div>
              <p className="text-[#0F172A] font-medium text-xs text-center">Guruhlarni boshqarish</p>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
