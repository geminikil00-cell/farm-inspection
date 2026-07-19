import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { TrendingUp, BarChart2, PieChart as PieIcon, Activity, Calendar, Award } from 'lucide-react';
import { FACILITY_TRANSLATIONS } from '../translations/criteria';

const COLORS = {
  excellent: '#22c55e',
  veryGood: '#3b82f6',
  good: '#06b6d4',
  acceptable: '#eab308',
  bad: '#ef4444',
  na: '#9ca3af'
};

export const AnalyticsDashboard = ({ history, t, lang }) => {
  const [yearFilter, setYearFilter] = useState('');
  const [quarterFilter, setQuarterFilter] = useState('');

  // Extract available years
  const availableYears = useMemo(() => {
    const years = new Set();
    history.forEach(r => {
      if (r.inspection_year) years.add(r.inspection_year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [history]);

  const availableQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  // Filter records based on selection
  const filteredHistory = useMemo(() => {
    return history.filter(r => {
      if (yearFilter && r.inspection_year !== parseInt(yearFilter, 10)) return false;
      if (quarterFilter && r.inspection_quarter !== quarterFilter) return false;
      return true;
    });
  }, [history, yearFilter, quarterFilter]);

  const analyticsData = useMemo(() => {
    if (filteredHistory.length === 0) return null;

    // 1. Trend Data: Grouped and averaged by Quarter
    const quarterTrend = {};
    filteredHistory.forEach(item => {
      const qKey = `${item.inspection_year}-${item.inspection_quarter}`;
      if (!quarterTrend[qKey]) {
        quarterTrend[qKey] = {
          key: qKey,
          name: `${item.inspection_year} ${item.inspection_quarter}`,
          total: 0,
          count: 0
        };
      }
      quarterTrend[qKey].total += item.score;
      quarterTrend[qKey].count += 1;
    });

    const trendData = Object.values(quarterTrend)
      .map(q => ({
        date: q.name,
        key: q.key,
        score: Math.round(q.total / q.count)
      }))
      .sort((a, b) => a.key.localeCompare(b.key));

    // 2. Comparison Data: Average score by facility type
    const facilityScores = {};
    filteredHistory.forEach(item => {
      if (!facilityScores[item.facility_id]) {
        facilityScores[item.facility_id] = { total: 0, count: 0, title: item.facility_title };
      }
      facilityScores[item.facility_id].total += item.score;
      facilityScores[item.facility_id].count += 1;
    });

    const comparisonData = Object.keys(facilityScores).map(key => ({
      name: facilityScores[key].title,
      average: Math.round(facilityScores[key].total / facilityScores[key].count)
    }));

    // 3. Status Distribution Data (Pie Chart)
    const statusCounts = { Excellent: 0, VeryGood: 0, Good: 0, Acceptable: 0, Bad: 0 };
    filteredHistory.forEach(record => {
      if (record.data && Array.isArray(record.data.rows)) {
        record.data.rows.forEach(row => {
          if (row.status) {
            const statusVal = row.status.trim();
            if (['ممتاز', 'Excellent', '优'].some(v => statusVal.includes(v))) statusCounts.Excellent++;
            else if (['جيد جداً', 'Very Good', '良'].some(v => statusVal.includes(v))) statusCounts.VeryGood++;
            else if (['جيد', 'Good', '可'].some(v => statusVal.includes(v))) statusCounts.Good++;
            else if (['مقبول', 'Acceptable', '不可'].some(v => statusVal.includes(v))) statusCounts.Acceptable++;
            else if (['سيء', 'Bad', '极'].some(v => statusVal.includes(v))) statusCounts.Bad++;
          }
        });
      }
    });

    const pieData = [
      { name: t.excellentLabel, value: statusCounts.Excellent, color: COLORS.excellent },
      { name: t.veryGoodLabel, value: statusCounts.VeryGood, color: COLORS.veryGood },
      { name: t.goodLabel, value: statusCounts.Good, color: COLORS.good },
      { name: t.acceptableLabel, value: statusCounts.Acceptable, color: COLORS.acceptable },
      { name: t.badLabel, value: statusCounts.Bad, color: COLORS.bad }
    ].filter(d => d.value > 0);

    return { trendData, comparisonData, pieData };
  }, [filteredHistory, t]);

  // 4. Quarterly Status Distribution Stacked Chart (covers all years or filtered year)
  const quarterlyStatusData = useMemo(() => {
    const quarterMap = {};
    history.forEach(r => {
      if (yearFilter && r.inspection_year !== parseInt(yearFilter, 10)) return;
      const qKey = `${r.inspection_year}-${r.inspection_quarter}`;
      if (!quarterMap[qKey]) {
        quarterMap[qKey] = {
          key: qKey,
          name: `${r.inspection_year} ${r.inspection_quarter}`,
          [t.excellentLabel]: 0,
          [t.veryGoodLabel]: 0,
          [t.goodLabel]: 0,
          [t.acceptableLabel]: 0,
          [t.badLabel]: 0
        };
      }
      if (r.data && Array.isArray(r.data.rows)) {
        r.data.rows.forEach(row => {
          if (row.status) {
            const statusVal = row.status.trim();
            if (['ممتاز', 'Excellent', '优'].some(v => statusVal.includes(v))) quarterMap[qKey][t.excellentLabel]++;
            else if (['جيد جداً', 'Very Good', '良'].some(v => statusVal.includes(v))) quarterMap[qKey][t.veryGoodLabel]++;
            else if (['جيد', 'Good', '可'].some(v => statusVal.includes(v))) quarterMap[qKey][t.goodLabel]++;
            else if (['مقبول', 'Acceptable', '不可'].some(v => statusVal.includes(v))) quarterMap[qKey][t.acceptableLabel]++;
            else if (['سيء', 'Bad', '极'].some(v => statusVal.includes(v))) quarterMap[qKey][t.badLabel]++;
          }
        });
      }
    });
    return Object.values(quarterMap).sort((a, b) => a.key.localeCompare(b.key));
  }, [history, yearFilter, t]);

  // 5. Radar Chart Data: Performance across all 13 locations
  const radarData = useMemo(() => {
    const facilityIds = [
      'greenhouses', 'warehouses', 'irrigation', 'nursery', 'pesticides',
      'accommodation', 'workshop', 'scrap', 'lakes', 'packing',
      'femaleRestArea', 'maleRestArea', 'generalFacilities'
    ];
    
    return facilityIds.map(fid => {
      const facilityTitle = FACILITY_TRANSLATIONS[lang]?.[fid]?.title || FACILITY_TRANSLATIONS.ar[fid]?.title || fid;
      const matchingRecs = filteredHistory.filter(r => r.facility_id === fid);
      const avg = matchingRecs.length > 0
        ? Math.round(matchingRecs.reduce((sum, r) => sum + r.score, 0) / matchingRecs.length)
        : 0;

      return {
        subject: facilityTitle,
        score: avg
      };
    });
  }, [filteredHistory, lang]);

  if (history.length < 2) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center text-yellow-800 focus-ring" tabIndex="0">
        <Activity size={32} className="mx-auto mb-2 opacity-50" />
        <p className="font-bold">{t.insufficientData}</p>
        <p className="text-sm mt-1">{t.minTwoRecords}</p>
      </div>
    );
  }

  const averageScore = filteredHistory.length > 0
    ? Math.round(filteredHistory.reduce((sum, r) => sum + r.score, 0) / filteredHistory.length)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filters Control Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 no-print">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="text-blue-600" size={18} />
          <span>Filters</span>
        </h3>
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center w-full md:w-auto">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-gray-50 border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-xs sm:text-sm text-gray-700 shadow-sm flex-1 md:flex-none"
          >
            <option value="">{t.allYears}</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={quarterFilter}
            onChange={(e) => setQuarterFilter(e.target.value)}
            className="bg-gray-50 border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-xs sm:text-sm text-gray-700 shadow-sm flex-1 md:flex-none"
          >
            <option value="">{t.allQuarters}</option>
            {availableQuarters.map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">{t.analytics}</h3>
        </div>
        <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-sm border font-bold text-gray-700">
            {t.recordCount}: {filteredHistory.length}
          </div>
          <div className="bg-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-sm border font-bold text-gray-700">
            {t.average}: <span className="text-green-600">{averageScore}%</span>
          </div>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="bg-gray-100 rounded-xl p-6 sm:p-8 text-center text-gray-500">
          <p className="font-bold text-sm sm:text-base">No records match the active filter criteria.</p>
        </div>
      ) : (
        <div className="analytics-print-container grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Trend Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 analytics-print-item focus-ring" tabIndex="0" aria-label="Performance trend chart">
            <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" />
              {t.performanceTrend}
            </h4>
            <div className="h-64 w-full" style={{ direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="date" fontSize={12} tick={{ fill: '#666' }} />
                  <YAxis domain={[0, 100]} fontSize={12} tick={{ fill: '#666' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name={t.score}
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart: All 13 Locations Coverage */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 analytics-print-item focus-ring" tabIndex="0" aria-label="Locations radar chart">
            <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
              <Award size={18} className="text-green-500" />
              {t.performanceByFacility} (Radar)
            </h4>
            <div className="h-64 w-full" style={{ direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" fontSize={8} tick={{ fill: '#4a5568' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={8} />
                  <Radar
                    name="Average Score"
                    dataKey="score"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quarterly Stacked Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 analytics-print-item focus-ring" tabIndex="0" aria-label="Quarterly status distribution chart">
            <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
              <BarChart2 size={18} className="text-orange-500" />
              {t.quarterlyTrend}
            </h4>
            <div className="h-64 w-full" style={{ direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quarterlyStatusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" fontSize={11} tick={{ fill: '#666' }} />
                  <YAxis fontSize={12} tick={{ fill: '#666' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={t.excellentLabel} stackId="a" fill={COLORS.excellent} />
                  <Bar dataKey={t.veryGoodLabel} stackId="a" fill={COLORS.veryGood} />
                  <Bar dataKey={t.goodLabel} stackId="a" fill={COLORS.good} />
                  <Bar dataKey={t.acceptableLabel} stackId="a" fill={COLORS.acceptable} />
                  <Bar dataKey={t.badLabel} stackId="a" fill={COLORS.bad} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Comparison Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 analytics-print-item focus-ring" tabIndex="0" aria-label="Department comparison chart">
            <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
              <BarChart2 size={18} className="text-purple-500" />
              {t.compDepartments}
            </h4>
            <div className="h-64 w-full" style={{ direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="name" fontSize={9} tick={{ fill: '#666' }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} fontSize={12} tick={{ fill: '#666' }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="average" name={t.average} fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 analytics-print-full lg:col-span-2 focus-ring" tabIndex="0" aria-label="Status distribution chart">
            <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
              <PieIcon size={18} className="text-green-500" />
              {t.distStatus}
            </h4>
            <div className="h-64 w-full flex justify-center" style={{ direction: 'ltr' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
