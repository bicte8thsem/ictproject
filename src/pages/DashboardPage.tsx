// ============================================
// DASHBOARD PAGE
// ============================================

import { useAuth } from '@/contexts/AuthContext';
import { navigateTo } from '@/lib/router';
import { useDashboardStats } from '@/hooks/useApi';
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import logo from '../../logo.svg';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  LogOut, 
  ChevronRight,
  Plus,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#2563eb', '#059669', '#7c3aed', '#dc2626'];

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  color,
  isLoading 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ElementType; 
  description?: string;
  color: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            {isLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
            )}
          </div>
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { logout } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const isHeaderVisible = useAutoHideHeader();

  const handleLogout = async () => {
    await logout();
    navigateTo({ page: 'login' });
  };

  // Prepare chart data
  const programData = stats ? [
    { name: 'BCA', value: stats.total_bca_students },
    { name: 'BICTE', value: stats.total_bicte_students },
  ] : [];

  const semesterData = stats ? [
    { name: '1st', students: stats.semester_1_students },
    { name: '2nd', students: stats.semester_2_students },
    { name: '3rd', students: stats.semester_3_students },
    { name: '4th', students: stats.semester_4_students },
    { name: '5th', students: stats.semester_5_students },
    { name: '6th', students: stats.semester_6_students },
    { name: '7th', students: stats.semester_7_students },
    { name: '8th', students: stats.semester_8_students },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={`bg-white border-b border-border sticky top-0 z-30 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 py-3 sm:py-0 sm:h-20">
            <div className="flex justify-center sm:justify-start">
              <img src={logo} alt="Logo" className="h-14 sm:h-16 w-auto shrink-0" />
            </div>
            <div className="text-center min-w-0">
              <p className="text-sm sm:text-base font-semibold text-foreground leading-tight truncate">
                Janamaitri Multiple Campus
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight truncate">
                Department of ICT, Student Record
              </p>
            </div>
            
            <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-4 flex-wrap">
              <Button
                size="sm"
                onClick={() => navigateTo({ page: 'add-student' })}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Student</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateTo({ page: 'students' })}
                className="text-muted-foreground hover:text-primary"
              >
                <Users className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Students</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-red-600"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">
            Monitor student enrollment and academic progress
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={stats?.total_students || 0}
            icon={Users}
            description="Active enrolled students"
            color="#2563eb"
            isLoading={isLoading}
          />
          <StatCard
            title="BCA Students"
            value={stats?.total_bca_students || 0}
            icon={GraduationCap}
            description="Bachelor of Computer Applications"
            color="#059669"
            isLoading={isLoading}
          />
          <StatCard
            title="BICTE Students"
            value={stats?.total_bicte_students || 0}
            icon={BookOpen}
            description="Bachelor in ICT Education"
            color="#7c3aed"
            isLoading={isLoading}
          />
          <StatCard
            title="Programs"
            value="2"
            icon={TrendingUp}
            description="Active academic programs"
            color="#dc2626"
            isLoading={false}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Semester Distribution Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg text-foreground">Semester-wise Distribution</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={semesterData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        stroke="#64748b"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        stroke="#64748b"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="students" 
                        fill="#2563eb" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Program Distribution Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <CardTitle className="text-lg text-foreground">Program Distribution</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={programData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {programData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {programData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {entry.name}: {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-primary to-primary/90">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-white">
                <h3 className="text-xl font-semibold mb-1">Manage Students</h3>
                <p className="text-primary-foreground/80 text-sm">
                  View, add, edit student records and manage academic progress
                </p>
              </div>
              <Button
                onClick={() => navigateTo({ page: 'students' })}
                variant="secondary"
                className="bg-white text-primary hover:bg-primary/10"
              >
                View All Students
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
