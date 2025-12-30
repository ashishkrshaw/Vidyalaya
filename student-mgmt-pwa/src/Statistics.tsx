import React, { useState, useEffect } from 'react';
import SchoolIcon from '@mui/icons-material/School';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { getAdmissions, loadFeeMap } from './db';
import './Statistics.css';

interface StatisticsProps {
  mode: 'light' | 'dark';
}

interface ClassData {
  class: string;
  count: number;
  percentage: number;
}

const Statistics: React.FC<StatisticsProps> = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFeeCollected: 0,
    thisMonthAdmissions: 0,
    totalDues: 0,
    maleCount: 0,
    femaleCount: 0,
    collectionRate: 0,
  });
  const [classData, setClassData] = useState<ClassData[]>([]);
  const [monthlyFees, setMonthlyFees] = useState<{ month: string, amount: number }[]>([]);

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

      let totalFee = 0;
      let totalDuesAmount = 0;
      let thisMonthCount = 0;
      let maleCount = 0;
      let femaleCount = 0;
      const classCountMap: { [key: string]: number } = {};
      const monthlyFeeData: { [key: string]: number } = {};

      const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
      // Standard short names for data collection
      const standardMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      standardMonths.forEach(m => { monthlyFeeData[m] = 0; });

      students.forEach((student: any) => {
        classCountMap[student.class] = (classCountMap[student.class] || 0) + 1;

        if (student.gender?.toLowerCase() === 'male') maleCount++;
        else if (student.gender?.toLowerCase() === 'female') femaleCount++;

        const admissionDate = new Date(student.createdAt || student.timestamp);
        if (admissionDate.getMonth() === thisMonth && admissionDate.getFullYear() === thisYear) {
          thisMonthCount++;
        }

        if (student.feeHistory && Array.isArray(student.feeHistory)) {
          student.feeHistory.forEach((payment: any) => {
            const amount = Number(payment.amount) || 0;
            totalFee += amount;

            // Trend Logic: Based on Payment Date (Cash Flow)
            if (payment.date) {
              const pDate = new Date(payment.date);

              // Determine current academic year range
              const currentYear = now.getFullYear();
              const currentMonth = now.getMonth(); // 0=Jan

              let startYear = currentYear;
              if (currentMonth < 3) { // Jan, Feb, Mar belong to previous year's cycle
                startYear = currentYear - 1;
              }

              const acadStart = new Date(startYear, 3, 1); // April 1st
              const acadEnd = new Date(startYear + 1, 2, 31); // March 31st
              acadEnd.setHours(23, 59, 59, 999); // Include the entire end date

              // Only include if in current academic cycle
              if (pDate >= acadStart && pDate <= acadEnd) {
                const monthIndex = pDate.getMonth();
                const shortMonth = standardMonths[monthIndex];
                if (monthlyFeeData[shortMonth] !== undefined) {
                  monthlyFeeData[shortMonth] += amount;
                }
              }
            }
          });
        }

        // Dues logic - consistent with FeeManagement (Accrued Dues)
        const classFee = Number(student.monthlyFee || feeMap[student.class]) || 0;

        // Accrued calculation
        const monthOptions = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
        let applicableMonths = [...monthOptions];
        if (student.admissionDate) {
          const admDate = new Date(student.admissionDate);
          const admMonth = admDate.getMonth(); // 0-11
          // Academic year: April (3) to March (2)
          const academicMonthIndex = (admMonth >= 3) ? admMonth - 3 : admMonth + 9;
          applicableMonths = monthOptions.slice(academicMonthIndex);
        }

        const currentMonthIndex = now.getMonth();
        const currentAcademicMonthIndex = (currentMonthIndex >= 3) ? currentMonthIndex - 3 : currentMonthIndex + 9;

        // Filter applicableMonths to only those that have passed or are current
        const elapsedMonths = applicableMonths.filter(m => {
          // We can check indices in monthOptions.
          return monthOptions.indexOf(m) <= currentAcademicMonthIndex;
        });

        const accruedFee = classFee * elapsedMonths.length;

        // Total Paid for Tuition (Exclude Misc/Admission)
        const paidForTuition = (student.feeHistory || []).reduce((sum: number, p: any) => {
          if (p.type === 'misc' || p.type === 'Admission Fee') return sum;
          return sum + (Number(p.amount) || 0);
        }, 0);

        totalDuesAmount += Math.max(0, accruedFee - paidForTuition);
      });

      const totalStudents = students.length;
      const classDataArray: ClassData[] = Object.entries(classCountMap)
        .map(([cls, count]) => ({
          class: cls,
          count,
          percentage: totalStudents > 0 ? (count / totalStudents) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const expectedYearlyTotal = students.reduce((sum: number, s: any) => {
        return sum + (Number(feeMap[s.class]) || 0) * 12;
      }, 0);
      const collectionRate = expectedYearlyTotal > 0 ? (totalFee / expectedYearlyTotal) * 100 : 0;

      const monthlyArray = monthNames.map(m => ({ month: m, amount: Math.round(monthlyFeeData[m]) }));

      setStats({
        totalStudents,
        totalFeeCollected: totalFee,
        thisMonthAdmissions: thisMonthCount,
        totalDues: totalDuesAmount,
        maleCount,
        femaleCount,
        collectionRate: Math.round(collectionRate),
      });

      setClassData(classDataArray);
      setMonthlyFees(monthlyArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  // Generate area chart path
  const maxFee = Math.max(...monthlyFees.map(m => m.amount), 1);
  const generateAreaPath = () => {
    const width = 100;
    const height = 60;
    const padding = 2;
    const points = monthlyFees.map((item, i) => {
      const x = padding + (i / (monthlyFees.length - 1)) * (width - padding * 2);
      const y = height - padding - (item.amount / maxFee) * (height - padding * 2);
      return `${x},${y}`;
    });
    const linePath = `M ${points.join(' L ')}`;
    const areaPath = `${linePath} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;
    return { linePath, areaPath };
  };

  const { linePath, areaPath } = generateAreaPath();

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">Analytics Dashboard</h1>
          <p className="analytics-subtitle">School performance overview</p>
        </div>
        <div className="analytics-date">
          <CalendarTodayIcon />
          <span>{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon blue">
            <SchoolIcon />
          </div>
          <div className="metric-content">
            <span className="metric-value">{stats.totalStudents}</span>
            <span className="metric-label">Total Students</span>
          </div>
          <div className="metric-trend up">
            <TrendingUpIcon />
            <span>Active</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <PeopleIcon />
          </div>
          <div className="metric-content">
            <span className="metric-value">{stats.thisMonthAdmissions}</span>
            <span className="metric-label">New This Month</span>
          </div>
          <div className="metric-mini-chart">
            <svg viewBox="0 0 40 20">
              <path d="M0,15 Q10,5 20,10 T40,5" fill="none" stroke="#22c55e" strokeWidth="2" />
            </svg>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon purple">
            <AccountBalanceWalletIcon />
          </div>
          <div className="metric-content">
            <span className="metric-value">₹{stats.totalFeeCollected.toLocaleString()}</span>
            <span className="metric-label">Fee Collected</span>
          </div>
          <div className="metric-progress">
            <div className="progress-ring-small">
              <svg viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" className="progress-bg" />
                <circle cx="18" cy="18" r="15" className="progress-fill purple"
                  style={{ strokeDasharray: `${stats.collectionRate} 100` }} />
              </svg>
              <span className="progress-text">{stats.collectionRate}%</span>
            </div>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon orange">
            <WarningAmberIcon />
          </div>
          <div className="metric-content">
            <span className="metric-value">₹{stats.totalDues.toLocaleString()}</span>
            <span className="metric-label">Pending Dues</span>
          </div>
          <div className="metric-trend down">
            <span>Outstanding</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Area Chart - Monthly Fee Collection */}
        <div className="chart-card large">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Fee Collection Trend</h3>
              <p className="chart-subtitle">Cash received per month (Current Academic Year)</p>
            </div>
            <div className="chart-legend">
              <span className="legend-dot blue"></span>
              <span>Collection (₹)</span>
            </div>
          </div>
          <div className="area-chart">
            <svg viewBox="0 0 100 60" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#areaGradient)" />
              <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="0.8" strokeLinecap="round" />
            </svg>
            <div className="area-chart-labels">
              {monthlyFees.map((item) => (
                <span key={item.month} className="chart-label">{item.month}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Donut Chart - Gender Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Gender Ratio</h3>
          </div>
          <div className="donut-container">
            <svg viewBox="0 0 100 100" className="donut-svg">
              <circle cx="50" cy="50" r="40" className="donut-bg" />
              {stats.totalStudents > 0 && (
                <>
                  <circle cx="50" cy="50" r="40" className="donut-segment blue"
                    style={{
                      strokeDasharray: `${(stats.maleCount / stats.totalStudents) * 251.2} 251.2`,
                      transform: 'rotate(-90deg)',
                      transformOrigin: '50px 50px'
                    }} />
                  <circle cx="50" cy="50" r="40" className="donut-segment purple"
                    style={{
                      strokeDasharray: `${(stats.femaleCount / stats.totalStudents) * 251.2} 251.2`,
                      strokeDashoffset: `-${(stats.maleCount / stats.totalStudents) * 251.2}`,
                      transform: 'rotate(-90deg)',
                      transformOrigin: '50px 50px'
                    }} />
                </>
              )}
              <text x="50" y="42" className="donut-value">{stats.totalStudents}</text>
              <text x="50" y="62" className="donut-label">Total</text>
            </svg>
            <div className="donut-legend">
              <div className="legend-row">
                <span className="legend-dot blue"></span>
                <span className="legend-text">Male</span>
                <span className="legend-value">{stats.maleCount}</span>
              </div>
              <div className="legend-row">
                <span className="legend-dot purple"></span>
                <span className="legend-text">Female</span>
                <span className="legend-value">{stats.femaleCount}</span>
              </div>
              <div className="legend-row">
                <span className="legend-dot gray"></span>
                <span className="legend-text">Other</span>
                <span className="legend-value">{stats.totalStudents - stats.maleCount - stats.femaleCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Class Distribution */}
      <div className="chart-card full">
        <div className="chart-header">
          <h3 className="chart-title">
            <AssessmentIcon />
            Class-wise Enrollment
          </h3>
        </div>
        <div className="bars-grid">
          {classData.slice(0, 10).map((item, index) => (
            <div key={item.class} className="bar-item-v2">
              <div className="bar-header-v2">
                <span className="bar-label-v2">Class {item.class}</span>
                <span className="bar-value-v2">{item.count}</span>
              </div>
              <div className="bar-track-v2">
                <div
                  className="bar-fill-v2"
                  style={{ width: `${item.percentage}%`, animationDelay: `${index * 0.05}s` }}
                />
              </div>
            </div>
          ))}
          {classData.length === 0 && (
            <p className="no-data">No enrollment data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
