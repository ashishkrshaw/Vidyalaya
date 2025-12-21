import React, { useState, useEffect } from 'react';
import SchoolIcon from '@mui/icons-material/School';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import GroupIcon from '@mui/icons-material/Group';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';
import { getAdmissions, loadFeeMap } from './db';
import './Statistics.css';

interface StatisticsProps {
  mode: 'light' | 'dark';
}

interface StatCardData {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
  trend?: { direction: 'up' | 'down' | 'neutral'; text: string };
}

interface ClassData {
  class: string;
  count: number;
  percentage: number;
}

const Statistics: React.FC<StatisticsProps> = ({ mode }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFeeCollected: 0,
    thisMonthAdmissions: 0,
    lastMonthAdmissions: 0,
    totalDues: 0,
    maleCount: 0,
    femaleCount: 0,
    avgFeePerStudent: 0,
    collectionRate: 0,
  });
  const [classData, setClassData] = useState<ClassData[]>([]);
  const [topClasses, setTopClasses] = useState<ClassData[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const students = await getAdmissions();
      const feeMap = await loadFeeMap();

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      let totalFee = 0;
      let totalDuesAmount = 0;
      let thisMonthCount = 0;
      let lastMonthCount = 0;
      let maleCount = 0;
      let femaleCount = 0;
      const classCountMap: { [key: string]: number } = {};

      students.forEach((student: any) => {
        // Count by class
        classCountMap[student.class] = (classCountMap[student.class] || 0) + 1;

        // Count gender
        if (student.gender?.toLowerCase() === 'male') maleCount++;
        else if (student.gender?.toLowerCase() === 'female') femaleCount++;

        // Count admissions by month
        const admissionDate = new Date(student.createdAt || student.timestamp);
        if (admissionDate.getMonth() === thisMonth && admissionDate.getFullYear() === thisYear) {
          thisMonthCount++;
        }
        if (admissionDate.getMonth() === lastMonth && admissionDate.getFullYear() === lastMonthYear) {
          lastMonthCount++;
        }

        // Calculate fees collected
        if (student.feeHistory && Array.isArray(student.feeHistory)) {
          student.feeHistory.forEach((payment: any) => {
            totalFee += Number(payment.amount) || 0;
          });
        }

        // Calculate pending dues
        const classFee = Number(feeMap[student.class]) || 0;
        const expectedTotal = classFee * 12; // Full year
        const paidTotal = (student.feeHistory || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
        totalDuesAmount += Math.max(0, expectedTotal - paidTotal);
      });

      // Calculate class data with percentages
      const totalStudents = students.length;
      const classDataArray: ClassData[] = Object.entries(classCountMap)
        .map(([cls, count]) => ({
          class: cls,
          count,
          percentage: totalStudents > 0 ? (count / totalStudents) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate collection rate
      const expectedYearlyTotal = students.reduce((sum: number, s: any) => {
        return sum + (Number(feeMap[s.class]) || 0) * 12;
      }, 0);
      const collectionRate = expectedYearlyTotal > 0 ? (totalFee / expectedYearlyTotal) * 100 : 0;

      setStats({
        totalStudents,
        totalFeeCollected: totalFee,
        thisMonthAdmissions: thisMonthCount,
        lastMonthAdmissions: lastMonthCount,
        totalDues: totalDuesAmount,
        maleCount,
        femaleCount,
        avgFeePerStudent: totalStudents > 0 ? Math.round(totalFee / totalStudents) : 0,
        collectionRate: Math.round(collectionRate),
      });

      setClassData(classDataArray);
      setTopClasses(classDataArray.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const getAdmissionTrend = () => {
    const diff = stats.thisMonthAdmissions - stats.lastMonthAdmissions;
    if (diff > 0) return { direction: 'up' as const, text: `+${diff} from last month` };
    if (diff < 0) return { direction: 'down' as const, text: `${diff} from last month` };
    return { direction: 'neutral' as const, text: 'Same as last month' };
  };

  const statCards: StatCardData[] = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: <SchoolIcon />,
      color: 'blue',
    },
    {
      title: 'This Month Admissions',
      value: stats.thisMonthAdmissions,
      icon: <CalendarTodayIcon />,
      color: 'green',
      trend: getAdmissionTrend(),
    },
    {
      title: 'Total Fee Collected',
      value: `₹${stats.totalFeeCollected.toLocaleString()}`,
      icon: <MonetizationOnIcon />,
      color: 'purple',
    },
    {
      title: 'Pending Dues',
      value: `₹${stats.totalDues.toLocaleString()}`,
      icon: <WarningIcon />,
      color: 'red',
    },
    {
      title: 'Collection Rate',
      value: `${stats.collectionRate}%`,
      icon: <TrendingUpIcon />,
      color: 'teal',
    },
    {
      title: 'Avg. Fee / Student',
      value: `₹${stats.avgFeePerStudent.toLocaleString()}`,
      icon: <AssessmentIcon />,
      color: 'orange',
    },
  ];

  if (loading) {
    return (
      <div className="stats-page">
        <div className="stats-header">
          <h1 className="stats-title">
            <AssessmentIcon />
            Statistics Dashboard
          </h1>
        </div>
        <div style={{ textAlign: 'center', padding: 40, color: '#6B778C' }}>
          Loading statistics...
        </div>
      </div>
    );
  }

  return (
    <div className="stats-page">
      {/* Header */}
      <div className="stats-header">
        <h1 className="stats-title">
          <AssessmentIcon />
          Statistics Dashboard
        </h1>
        <p className="stats-subtitle">Overview of school performance and metrics</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="stats-cards-grid">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card">
            <div className={`stat-card-icon ${card.color}`}>
              {card.icon}
            </div>
            <div className="stat-card-content">
              <p className="stat-card-label">{card.title}</p>
              <h3 className="stat-card-value">{card.value}</h3>
              {card.trend && (
                <div className={`stat-card-trend ${card.trend.direction}`}>
                  {card.trend.direction === 'up' && <TrendingUpIcon style={{ fontSize: 14 }} />}
                  {card.trend.direction === 'down' && <TrendingDownIcon style={{ fontSize: 14 }} />}
                  {card.trend.text}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="stats-two-col">
        {/* Students by Class */}
        <div className="stats-section">
          <h2 className="stats-section-title">
            <GroupIcon />
            Students by Class
          </h2>
          <div className="stats-chart">
            {classData.map((item) => (
              <div key={item.class} className="stats-bar">
                <span className="stats-bar-label">{item.class}</span>
                <div className="stats-bar-track">
                  <div
                    className="stats-bar-fill"
                    style={{ width: `${Math.max(item.percentage, 5)}%` }}
                  />
                </div>
                <span className="stats-bar-value">{item.count}</span>
              </div>
            ))}
            {classData.length === 0 && (
              <p style={{ color: '#6B778C', textAlign: 'center' }}>No data available</p>
            )}
          </div>
        </div>

        {/* Gender Distribution & Top Classes */}
        <div className="stats-section">
          <h2 className="stats-section-title">
            <PeopleIcon />
            Gender Distribution
          </h2>
          <div style={{ display: 'flex', gap: 40, marginBottom: 30 }}>
            <div className="stats-progress-ring">
              <div className="stats-ring-value" style={{ color: '#0052CC' }}>
                {stats.maleCount}
              </div>
              <div className="stats-ring-label">Male Students</div>
            </div>
            <div className="stats-progress-ring">
              <div className="stats-ring-value" style={{ color: '#6554C0' }}>
                {stats.femaleCount}
              </div>
              <div className="stats-ring-label">Female Students</div>
            </div>
            <div className="stats-progress-ring">
              <div className="stats-ring-value" style={{ color: '#6B778C' }}>
                {stats.totalStudents - stats.maleCount - stats.femaleCount}
              </div>
              <div className="stats-ring-label">Not Specified</div>
            </div>
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#42526E', marginBottom: 12 }}>
            Top 5 Classes by Enrollment
          </h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Class</th>
                <th>Students</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {topClasses.map((item, index) => (
                <tr key={item.class}>
                  <td>#{index + 1}</td>
                  <td>{item.class}</td>
                  <td>{item.count}</td>
                  <td>{item.percentage.toFixed(1)}%</td>
                </tr>
              ))}
              {topClasses.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#6B778C' }}>
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
