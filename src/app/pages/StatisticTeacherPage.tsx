import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { BottomNavigation } from '../components/BottomNavigation';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export function StatisticTeacherPage() {
  const navigate = useNavigate();

  // Class performance data for bar chart
  const classData = [
    { name: '7-A', ball: 82 },
    { name: '7-B', ball: 75 },
    { name: '8-A', ball: 88 },
    { name: '8-B', ball: 71 },
    { name: '9-A', ball: 79 },
  ];

  // Error distribution data for pie chart
  const errorData = [
    { name: 'Algebra', value: 35, color: '#2563EB' },
    { name: 'Geometriya', value: 25, color: '#10B981' },
    { name: 'Trigonometriya', value: 20, color: '#F59E0B' },
    { name: 'Statistika', value: 20, color: '#8B5CF6' },
  ];

  // Progress data for line chart
  const progressData = [
    { kun: '1-kun', ball: 65 },
    { kun: '7-kun', ball: 68 },
    { kun: '14-kun', ball: 72 },
    { kun: '21-kun', ball: 75 },
    { kun: '30-kun', ball: 78 },
  ];

  // Recent activity data
  const recentActivity = [
    { id: 1, student: "Aliyev Jasur", test: "Algebra asoslari", score: 85, date: "2 soat oldin", status: "success" },
    { id: 2, student: "Karimova Nilufar", test: "Geometriya", score: 92, date: "3 soat oldin", status: "success" },
    { id: 3, student: "Rahimov Sardor", test: "Trigonometriya", score: 58, date: "5 soat oldin", status: "warning" },
    { id: 4, student: "Toshmatova Malika", test: "Algebra asoslari", score: 78, date: "Bugun, 14:30", status: "success" },
    { id: 5, student: "Yusupov Aziz", test: "Statistika", score: 45, date: "Bugun, 12:15", status: "error" },
    { id: 6, student: "Ibragimov Rustam", test: "Geometriya", score: 67, date: "Kecha, 18:20", status: "warning" },
    { id: 7, student: "Nurmatova Gulnora", test: "Algebra asoslari", score: 91, date: "Kecha, 16:45", status: "success" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E8F0] px-5 py-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard-teacher')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
          </button>
          <div>
            <h1 className="text-[#0F172A] text-xl font-bold">Statistika</h1>
            <p className="text-[#475569] text-sm">O'quvchilar natijalari tahlili</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-6 space-y-6">
        {/* Bar Chart - Class Performance */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm">
          <h3 className="text-[#0F172A] text-base font-semibold mb-4">Sinf bo'yicha natijalar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={classData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }} 
              />
              <Bar dataKey="ball" fill="#2563EB" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Error Distribution */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm">
          <h3 className="text-[#0F172A] text-base font-semibold mb-4">Mavzular bo'yicha xatolar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={errorData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={5}
                dataKey="value"
              >
                {errorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {errorData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-[#475569]">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line Chart - Progress */}
        <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm">
          <h3 className="text-[#0F172A] text-base font-semibold mb-4">So'nggi 30 kun progress</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="kun" tick={{ fill: '#475569', fontSize: 12 }} />
              <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #E2E8F0', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="ball" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#E2E8F0]">
            <h3 className="text-[#0F172A] text-base font-semibold">So'nggi faoliyat</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="text-left text-xs font-semibold text-[#475569] px-4 py-3">O'quvchi</th>
                  <th className="text-left text-xs font-semibold text-[#475569] px-4 py-3">Test nomi</th>
                  <th className="text-center text-xs font-semibold text-[#475569] px-4 py-3">Ball</th>
                  <th className="text-left text-xs font-semibold text-[#475569] px-4 py-3">Sana</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity, index) => (
                  <tr 
                    key={activity.id} 
                    className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}
                  >
                    <td className="px-4 py-3 text-sm text-[#0F172A]">{activity.student}</td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{activity.test}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {activity.status === 'success' && <CheckCircle className="w-4 h-4 text-[#10B981]" />}
                        {activity.status === 'warning' && <Clock className="w-4 h-4 text-[#F59E0B]" />}
                        {activity.status === 'error' && <XCircle className="w-4 h-4 text-[#EF4444]" />}
                        <span className={`text-sm font-semibold ${
                          activity.status === 'success' ? 'text-[#10B981]' : 
                          activity.status === 'warning' ? 'text-[#F59E0B]' : 
                          'text-[#EF4444]'
                        }`}>
                          {activity.score}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#475569]">{activity.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
