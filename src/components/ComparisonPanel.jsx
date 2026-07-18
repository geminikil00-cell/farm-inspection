import React, { useState, useMemo } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line
} from 'recharts';
import { ArrowLeftRight, Calendar, MapPin, TrendingUp } from 'lucide-react';

const COLORS = {
  primary: '#3b82f6', // blue
  secondary: '#f97316', // orange
  excellent: '#22c55e',
  veryGood: '#3b82f6',
  good: '#06b6d4',
  acceptable: '#eab308',
  bad: '#ef4444',
  na: '#9ca3af'
};

export const ComparisonPanel = ({ history, facilities, t, lang }) => {
  const [compMode, setCompMode] = useState('time'); // 'time' or 'location'

  // Time Comparison Filters
  const [timeA, setTimeA] = useState({ year: '', quarter: '' });
  const [timeB, setTimeB] = useState({ year: '', quarter: '' });

  // Location Comparison Filters
  const [locA, setLocA] = useState('');
  const [locB, setLocB] = useState('');
  const [locFilter, setLocFilter] = useState({ year: '', quarter: '' });

  // Unique Years & Quarters present in history for dropdown lists
  const availableYears = useMemo(() => {
    const years = new Set();
    history.forEach(r => {
      if (r.inspection_year) years.add(r.inspection_year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [history]);

  const availableQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  // All Facility types mapping
  const facilityIds = Object.keys(facilities);

  // Compute stats for Time Comparison
  const timeComparisonData = useMemo(() => {
    if (compMode !== 'time') return null;

    const filterRecords = (year, quarter) => {
      return history.filter(r => {
        const matchYear = !year || r.inspection_year === parseInt(year, 10);
        const matchQuarter = !quarter || r.inspection_quarter === quarter;
        return matchYear && matchQuarter;
      });
    };

    const recordsA = filterRecords(timeA.year, timeA.quarter);
    const recordsB = filterRecords(timeB.year, timeB.quarter);

    const getAverageScore = (records) => {
      if (records.length === 0) return 0;
      const sum = records.reduce((acc, r) => acc + r.score, 0);
      return Math.round(sum / records.length);
    };

    const avgA = getAverageScore(recordsA);
    const avgB = getAverageScore(recordsB);
    const delta = avgB - avgA;

    // Radar Chart: Facility averages comparison
    const radarData = facilityIds.map(fid => {
      const facilityTitle = facilities[fid]?.title || fid;
      
      const scoreA = recordsA.filter(r => r.facility_id === fid);
      const scoreB = recordsB.filter(r => r.facility_id === fid);

      const fAvgA = scoreA.length > 0 ? Math.round(scoreA.reduce((sum, r) => sum + r.score, 0) / scoreA.length) : 0;
      const fAvgB = scoreB.length > 0 ? Math.round(scoreB.reduce((sum, r) => sum + r.score, 0) / scoreB.length) : 0;

      return {
        subject: facilityTitle,
        [t.entityA || 'A']: fAvgA,
        [t.entityB || 'B']: fAvgB
      };
    });

    // Status Distribution Comparison
    const getStatusDistribution = (records) => {
      const counts = { Excellent: 0, VeryGood: 0, Good: 0, Acceptable: 0, Bad: 0 };
      records.forEach(r => {
        if (r.data && Array.isArray(r.data.rows)) {
          r.data.rows.forEach(row => {
            if (!row.status) return;
            const s = row.status.trim();
            if (['ممتاز', 'Excellent', '优'].some(v => s.includes(v))) counts.Excellent++;
            else if (['جيد جداً', 'Very Good', '良'].some(v => s.includes(v))) counts.VeryGood++;
            else if (['جيد', 'Good', '可'].some(v => s.includes(v))) counts.Good++;
            else if (['مقبول', 'Acceptable', '不可'].some(v => s.includes(v))) counts.Acceptable++;
            else if (['سيء', 'Bad', '极'].some(v => s.includes(v))) counts.Bad++;
          });
        }
      });
      return counts;
    };

    const distA = getStatusDistribution(recordsA);
    const distB = getStatusDistribution(recordsB);

    const barData = [
      { name: t.excellentLabel, [t.entityA || 'A']: distA.Excellent, [t.entityB || 'B']: distB.Excellent },
      { name: t.veryGoodLabel, [t.entityA || 'A']: distA.VeryGood, [t.entityB || 'B']: distB.VeryGood },
      { name: t.goodLabel, [t.entityA || 'A']: distA.Good, [t.entityB || 'B']: distB.Good },
      { name: t.acceptableLabel, [t.entityA || 'A']: distA.Acceptable, [t.entityB || 'B']: distB.Acceptable },
      { name: t.badLabel, [t.entityA || 'A']: distA.Bad, [t.entityB || 'B']: distB.Bad }
    ];

    return { avgA, avgB, delta, radarData, barData, countA: recordsA.length, countB: recordsB.length };
  }, [history, compMode, timeA, timeB, facilities, t]);

  // Compute stats for Location Comparison
  const locationComparisonData = useMemo(() => {
    if (compMode !== 'location') return null;

    const filterRecords = (fid, year, quarter) => {
      return history.filter(r => {
        if (r.facility_id !== fid) return false;
        if (year && r.inspection_year !== parseInt(year, 10)) return false;
        if (quarter && r.inspection_quarter !== quarter) return false;
        return true;
      });
    };

    const recsA = filterRecords(locA, locFilter.year, locFilter.quarter);
    const recsB = filterRecords(locB, locFilter.year, locFilter.quarter);

    const getAverageScore = (records) => {
      if (records.length === 0) return 0;
      return Math.round(records.reduce((sum, r) => sum + r.score, 0) / records.length);
    };

    const avgA = getAverageScore(recsA);
    const avgB = getAverageScore(recsB);
    const delta = avgB - avgA;

    // Get time-based line trend for Location comparison
    const timeTrendMap = {};
    history.forEach(r => {
      if (r.facility_id !== locA && r.facility_id !== locB) return;
      const key = `${r.inspection_year}-${r.inspection_quarter}`;
      if (!timeTrendMap[key]) {
        timeTrendMap[key] = { key, name: `${r.inspection_year} ${r.inspection_quarter}`, countA: 0, totalA: 0, countB: 0, totalB: 0 };
      }
      if (r.facility_id === locA) {
        timeTrendMap[key].totalA += r.score;
        timeTrendMap[key].countA++;
      } else {
        timeTrendMap[key].totalB += r.score;
        timeTrendMap[key].countB++;
      }
    });

    const trendData = Object.values(timeTrendMap)
      .map(item => ({
        name: item.name,
        key: item.key,
        [facilities[locA]?.title || 'Location A']: item.countA > 0 ? Math.round(item.totalA / item.countA) : null,
        [facilities[locB]?.title || 'Location B']: item.countB > 0 ? Math.round(item.totalB / item.countB) : null
      }))
      .sort((a, b) => a.key.localeCompare(b.key));

    // Status Distribution
    const getStatusDistribution = (records) => {
      const counts = { Excellent: 0, VeryGood: 0, Good: 0, Acceptable: 0, Bad: 0 };
      records.forEach(r => {
        if (r.data && Array.isArray(r.data.rows)) {
          r.data.rows.forEach(row => {
            if (!row.status) return;
            const s = row.status.trim();
            if (['ممتاز', 'Excellent', '优'].some(v => s.includes(v))) counts.Excellent++;
            else if (['جيد جداً', 'Very Good', '良'].some(v => s.includes(v))) counts.VeryGood++;
            else if (['جيد', 'Good', '可'].some(v => s.includes(v))) counts.Good++;
            else if (['مقبول', 'Acceptable', '不可'].some(v => s.includes(v))) counts.Acceptable++;
            else if (['سيء', 'Bad', '极'].some(v => s.includes(v))) counts.Bad++;
          });
        }
      });
      return counts;
    };

    const distA = getStatusDistribution(recsA);
    const distB = getStatusDistribution(recsB);

    const titleA = facilities[locA]?.title || 'Location A';
    const titleB = facilities[locB]?.title || 'Location B';

    const barData = [
      { name: t.excellentLabel, [titleA]: distA.Excellent, [titleB]: distB.Excellent },
      { name: t.veryGoodLabel, [titleA]: distA.VeryGood, [titleB]: distB.VeryGood },
      { name: t.goodLabel, [titleA]: distA.Good, [titleB]: distB.Good },
      { name: t.acceptableLabel, [titleA]: distA.Acceptable, [titleB]: distB.Acceptable },
      { name: t.badLabel, [titleA]: distA.Bad, [titleB]: distB.Bad }
    ];

    return { avgA, avgB, delta, trendData, barData, countA: recsA.length, countB: recsB.length };
  }, [history, compMode, locA, locB, locFilter, facilities, t]);

  const labelA = useMemo(() => {
    if (compMode === 'time') {
      const parts = [];
      if (timeA.quarter) parts.push(timeA.quarter);
      if (timeA.year) parts.push(timeA.year);
      return parts.length > 0 ? parts.join(' ') : (t.entityA || 'A');
    } else {
      return facilities[locA]?.title || (t.entityA || 'A');
    }
  }, [compMode, timeA, locA, facilities, t]);

  const labelB = useMemo(() => {
    if (compMode === 'time') {
      const parts = [];
      if (timeB.quarter) parts.push(timeB.quarter);
      if (timeB.year) parts.push(timeB.year);
      return parts.length > 0 ? parts.join(' ') : (t.entityB || 'B');
    } else {
      return facilities[locB]?.title || (t.entityB || 'B');
    }
  }, [compMode, timeB, locB, facilities, t]);

  const activeComp = compMode === 'time' ? timeComparisonData : locationComparisonData;

  const showComparison = useMemo(() => {
    if (compMode === 'time') {
      return timeA.year || timeA.quarter || timeB.year || timeB.quarter;
    } else {
      return locA && locB;
    }
  }, [compMode, timeA, timeB, locA, locB]);

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <ArrowLeftRight className="text-orange-500" size={20} />
          <span>{t.comparisons}</span>
        </h3>
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-inner">
          <button
            onClick={() => setCompMode('time')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              compMode === 'time' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar size={16} className="inline-block mr-1.5 -mt-0.5" />
            <span>{t.timeVsTime}</span>
          </button>
          <button
            onClick={() => setCompMode('location')}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              compMode === 'location' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin size={16} className="inline-block mr-1.5 -mt-0.5" />
            <span>{t.locationVsLocation}</span>
          </button>
        </div>
      </div>

      {/* Filter Control Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {compMode === 'time' ? (
          <>
            {/* Time period A */}
            <div className="space-y-3">
              <h4 className="font-bold text-blue-600 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>{t.entityA || 'Entity A'}</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={timeA.year}
                  onChange={(e) => setTimeA(prev => ({ ...prev, year: e.target.value }))}
                  className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-gray-700 shadow-sm"
                >
                  <option value="">{t.selectYear}</option>
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  value={timeA.quarter}
                  onChange={(e) => setTimeA(prev => ({ ...prev, quarter: e.target.value }))}
                  className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-gray-700 shadow-sm"
                >
                  <option value="">{t.selectQuarter}</option>
                  {availableQuarters.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time period B */}
            <div className="space-y-3">
              <h4 className="font-bold text-orange-600 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span>{t.entityB || 'Entity B'}</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={timeB.year}
                  onChange={(e) => setTimeB(prev => ({ ...prev, year: e.target.value }))}
                  className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm text-gray-700 shadow-sm"
                >
                  <option value="">{t.selectYear}</option>
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  value={timeB.quarter}
                  onChange={(e) => setTimeB(prev => ({ ...prev, quarter: e.target.value }))}
                  className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm text-gray-700 shadow-sm"
                >
                  <option value="">{t.selectQuarter}</option>
                  {availableQuarters.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Location Selector */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-700 text-sm">{t.locationVsLocation}</h4>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={locA}
                  onChange={(e) => setLocA(e.target.value)}
                  className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-gray-700 shadow-sm"
                >
                  <option value="">{t.location} A</option>
                  {facilityIds.map(fid => (
                    <option key={fid} value={fid}>{facilities[fid]?.title || fid}</option>
                  ))}
                </select>
                <select
                  value={locB}
                  onChange={(e) => setLocB(e.target.value)}
                  className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm text-gray-700 shadow-sm"
                >
                  <option value="">{t.location} B</option>
                  {facilityIds.map(fid => (
                    <option key={fid} value={fid}>{facilities[fid]?.title || fid}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time Filter for Locations */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-700 text-sm flex items-center gap-1.5">
                <span>{t.date} ({t.optional || 'Optional'})</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={locFilter.year}
                  onChange={(e) => setLocFilter(prev => ({ ...prev, year: e.target.value }))}
                  className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-gray-700 shadow-sm"
                >
                  <option value="">{t.allYears}</option>
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  value={locFilter.quarter}
                  onChange={(e) => setLocFilter(prev => ({ ...prev, quarter: e.target.value }))}
                  className="bg-gray-50 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm text-gray-700 shadow-sm"
                >
                  <option value="">{t.allQuarters}</option>
                  {availableQuarters.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Comparison Area */}
      {!showComparison ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center text-blue-800">
          <ArrowLeftRight size={36} className="mx-auto mb-3 text-blue-400 animate-pulse" />
          <p className="font-bold text-lg">{t.noComparisonData}</p>
          <p className="text-sm mt-1">
            {compMode === 'time'
              ? 'Please select at least one Year or Quarter filter to start comparing.'
              : 'Select two locations to see side-by-side performance analysis.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Comparison Cards / Delta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between">
              <span className="text-sm font-bold text-gray-500 truncate">{labelA}</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-blue-600">{activeComp?.avgA || 0}%</span>
                <span className="text-xs text-gray-400 font-medium">({activeComp?.countA || 0} {t.recordCount})</span>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between">
              <span className="text-sm font-bold text-gray-500 truncate">{labelB}</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-orange-500">{activeComp?.avgB || 0}%</span>
                <span className="text-xs text-gray-400 font-medium">({activeComp?.countB || 0} {t.recordCount})</span>
              </div>
            </div>

            <div className={`p-6 rounded-xl border shadow-sm flex flex-col justify-between ${
              activeComp?.delta > 0
                ? 'bg-green-50 border-green-200 text-green-800'
                : activeComp?.delta < 0
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-gray-50 border-gray-200 text-gray-800'
            }`}>
              <span className="text-sm font-bold opacity-75">{t.delta}</span>
              <div className="mt-2 flex items-center gap-2">
                <TrendingUp size={28} className={activeComp?.delta < 0 ? 'transform rotate-180' : ''} />
                <span className="text-4xl font-extrabold dir-ltr" style={{ direction: 'ltr' }}>
                  {activeComp?.delta > 0 ? '+' : ''}
                  {activeComp?.delta || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Radar Chart (Period Comparisons only) or Trend Line (Location Comparison) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {compMode === 'time' ? (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                  <span>{t.radarPerformance}</span>
                </h4>
                <div className="h-80 w-full" style={{ direction: 'ltr' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={activeComp?.radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" fontSize={9} tick={{ fill: '#4a5568' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
                      <Radar
                        name={labelA}
                        dataKey={t.entityA || 'A'}
                        stroke={COLORS.primary}
                        fill={COLORS.primary}
                        fillOpacity={0.2}
                      />
                      <Radar
                        name={labelB}
                        dataKey={t.entityB || 'B'}
                        stroke={COLORS.secondary}
                        fill={COLORS.secondary}
                        fillOpacity={0.2}
                      />
                      <Tooltip />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                  <span>{t.performanceTrend}</span>
                </h4>
                <div className="h-80 w-full" style={{ direction: 'ltr' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeComp?.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={11} tick={{ fill: '#64748b' }} />
                      <YAxis domain={[0, 100]} fontSize={11} tick={{ fill: '#64748b' }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={facilities[locA]?.title || 'Location A'}
                        stroke={COLORS.primary}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey={facilities[locB]?.title || 'Location B'}
                        stroke={COLORS.secondary}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Status Distribution Comparison Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h4 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
                <span>{t.statusDistribution}</span>
              </h4>
              <div className="h-80 w-full" style={{ direction: 'ltr' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeComp?.barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={11} tick={{ fill: '#64748b' }} />
                    <YAxis fontSize={11} tick={{ fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Legend />
                    <Bar dataKey={labelA} fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey={labelB} fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
