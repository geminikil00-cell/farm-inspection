import React, { useState, useMemo } from 'react';
import { FileText, Filter, History, Eye, Trash2, Calendar } from 'lucide-react';

export const HistoryPanel = ({
  history,
  historyFilter,
  setHistoryFilter,
  facilities,
  loadRecord,
  deleteRecord,
  t,
  historyLoading,
  historyError,
  onRetry
}) => {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');

  // Extract unique years from history
  const availableYears = useMemo(() => {
    const years = new Set();
    history.forEach(r => {
      if (r.inspection_year) years.add(r.inspection_year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [history]);

  const availableQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  // Filter and group records
  const groupedGroups = useMemo(() => {
    const filtered = history.filter(item => {
      const matchFacility = historyFilter === 'all' || item.facility_id === historyFilter;
      const matchYear = !selectedYear || item.inspection_year === parseInt(selectedYear, 10);
      const matchQuarter = !selectedQuarter || item.inspection_quarter === selectedQuarter;
      return matchFacility && matchYear && matchQuarter;
    });

    const groups = {};
    filtered.forEach(item => {
      const qText = item.inspection_quarter || 'Q1';
      const yText = item.inspection_year || new Date(item.date).getFullYear();
      const key = `${yText}-${qText}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          title: `${yText} ${qText}`,
          records: []
        };
      }
      groups[key].records.push(item);
    });

    // Sort groups descending
    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  }, [history, historyFilter, selectedYear, selectedQuarter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Filters Control Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            <span>{t.historyHeader}</span>
          </h3>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            {/* Location filter */}
            <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-sm flex-1 min-w-[180px]">
              <Filter size={16} className="text-gray-400 mx-2 flex-shrink-0" />
              <select
                className="bg-transparent border-none outline-none text-xs sm:text-sm text-gray-700 p-2 w-full focus-ring"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                aria-label={t.filterSites}
              >
                <option value="all">{t.filterSites}</option>
                {Object.keys(facilities).map(fid => (
                  <option key={fid} value={fid}>
                    {facilities[fid].title}
                  </option>
                ))}
              </select>
            </div>

            {/* Year filter */}
            <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-sm">
              <Calendar size={16} className="text-gray-400 mx-2 flex-shrink-0" />
              <select
                className="bg-transparent border-none outline-none text-xs sm:text-sm text-gray-700 p-2 focus-ring w-full"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                aria-label="Filter by Year"
              >
                <option value="">{t.allYears}</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Quarter filter */}
            <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-200 shadow-sm">
              <select
                className="bg-transparent border-none outline-none text-xs sm:text-sm text-gray-700 p-2 focus-ring w-full"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                aria-label="Filter by Quarter"
              >
                <option value="">{t.allQuarters}</option>
                {availableQuarters.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {historyLoading ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">{t.loading || 'Loading records...'}</p>
          </div>
        ) : historyError ? (
          <div className="text-center py-12 bg-red-50 rounded-lg border-2 border-dashed border-red-200">
            <p className="text-red-500 font-medium mb-4">{t.fetchError || 'Error fetching records:'} {historyError}</p>
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              {t.retry || 'Retry'}
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 focus-ring" tabIndex="0">
            <History size={48} className="mx-auto text-gray-300 mb-4 animate-pulse" />
            <p className="text-gray-500 font-medium">{t.noHistory}</p>
            <p className="text-sm text-gray-400 mt-2">{t.historySubtitle}</p>
          </div>
        ) : groupedGroups.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 font-medium">No records match the active filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedGroups.map(group => (
              <div key={group.key} className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-2">
                  <h4 className="text-md font-bold text-gray-700">{group.title}</h4>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full border">
                    {group.records.length} {t.recordCount}
                  </span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-start text-xs sm:text-sm border-collapse" role="table">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                      <tr role="row">
                        <th className="p-2.5 sm:p-3 font-semibold text-start min-w-[90px]">{t.date}</th>
                        <th className="p-2.5 sm:p-3 font-semibold text-start min-w-[120px]">{t.location}</th>
                        <th className="p-2.5 sm:p-3 font-semibold text-start min-w-[100px]">{t.inspector}</th>
                        <th className="p-2.5 sm:p-3 font-semibold text-center min-w-[70px]">{t.score}</th>
                        <th className="p-2.5 sm:p-3 font-semibold text-center min-w-[100px]">{t.action}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {group.records.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 group transition-colors" role="row">
                          <td className="p-2.5 sm:p-3 text-gray-800 font-medium whitespace-nowrap" role="cell">{record.date}</td>
                          <td className="p-2.5 sm:p-3 text-blue-600 font-semibold" role="cell">{record.facility_title}</td>
                          <td className="p-2.5 sm:p-3 text-gray-600" role="cell">{record.inspector}</td>
                          <td className="p-2.5 sm:p-3 text-center" role="cell">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                record.score >= 90
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : record.score >= 80
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : record.score >= 60
                                  ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                                  : record.score >= 40
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}
                            >
                              {record.score}%
                            </span>
                          </td>
                          <td className="p-2.5 sm:p-3 flex justify-center items-center gap-1.5" role="cell">
                            <button
                              onClick={() => loadRecord(record)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-xs font-bold focus-ring border border-blue-100 shadow-sm"
                              title={t.load}
                              aria-label={`${t.load} record from ${record.date} for ${record.facility_title}`}
                            >
                              <Eye size={13} />
                              <span>{t.load}</span>
                            </button>
                            <button
                              onClick={() => deleteRecord(record.id)}
                              className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-xs border border-red-100 shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-ring"
                              title={t.delete}
                              aria-label={`${t.delete} record from ${record.date} for ${record.facility_title}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
