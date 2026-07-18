import React, { useRef } from 'react';
import { Calendar, User, FileText, Trash2, Printer, Save, Image as ImageIcon, Plus, ArrowLeftRight } from 'lucide-react';
import { AutoResizeTextarea } from './AutoResizeTextarea';
import { STATUS_OPTIONS } from '../translations';

const getScoreColor = (score) => {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 60) return 'text-cyan-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

export const InspectionForm = ({
  activeTab,
  facilityTitle,
  currentData,
  lastRecord,
  scoreDifference,
  currentScore,
  handleHeaderChange,
  handleRowChange,
  handlePhotoUpload,
  removePhoto,
  clearCurrentForm,
  saveToHistory,
  handlePrint,
  t,
  isRtl
}) => {
  const fileInputRef = useRef(null);

  const statusOpts = STATUS_OPTIONS(t);
  const currentRows = currentData.rows || [];
  const currentPhotos = currentData.photos || [];

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 min-h-[29.7cm] flex flex-col justify-between">
      <div className="p-8 border-b-2 border-gray-100">
        {/* Print Headers */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 focus-ring" tabIndex="0">
              {t.generalTitle}
            </h1>
            <p className="text-gray-500">
              {t.location}: <span className="font-semibold text-gray-800">{facilityTitle}</span>
            </p>
          </div>
          
          <div className="flex gap-6 print-only">
            <div className="text-center">
              <div className="text-4xl font-bold border-4 border-black p-2 rounded-lg">{currentScore}%</div>
              <div className="text-sm font-bold mt-1">{t.generalEval}</div>
            </div>
            {lastRecord && (
              <div className="text-center">
                <div
                  className={`text-4xl font-bold border-4 p-2 rounded-lg ${
                    scoreDifference > 0 ? 'border-green-600 text-green-700' : scoreDifference < 0 ? 'border-red-600 text-red-700' : 'border-gray-400 text-gray-600'
                  }`}
                  style={{ direction: 'ltr' }}
                >
                  {scoreDifference > 0 ? '+' : ''}
                  {scoreDifference}%
                </div>
                <div className="text-sm font-bold mt-1">{t.change}</div>
              </div>
            )}
          </div>
          
          <div className="text-start hidden sm:block">
            <div className="text-sm text-gray-400">{t.modelNo}</div>
            <div className="text-sm text-gray-400">{t.issueDate}</div>
          </div>
        </div>

        {/* Inputs Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg border border-gray-100 no-print" role="form">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <User size={16} />
              <span>{t.inspector}</span>
            </label>
            <input
              type="text"
              value={currentData.inspector || ''}
              onChange={(e) => handleHeaderChange('inspector', e.target.value)}
              placeholder={t.inspector}
              className="w-full p-2 border border-gray-300 rounded-md focus-ring outline-none bg-white"
              aria-required="true"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar size={16} />
              <span>{t.date}</span>
            </label>
            <input
              type="date"
              value={currentData.date || ''}
              onChange={(e) => handleHeaderChange('date', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus-ring outline-none bg-white"
            />
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText size={16} />
              <span>{t.generalNotes}</span>
            </label>
            <AutoResizeTextarea
              value={currentData.notes || ''}
              onChange={(e) => handleHeaderChange('notes', e.target.value)}
              placeholder={t.generalNotes}
              className="w-full p-2 border border-gray-300 rounded-md focus-ring outline-none bg-white"
            />
          </div>
        </div>

        {/* Print-Only Header Block */}
        <div className="hidden print-only mb-6 bg-gray-100 p-4 rounded border border-gray-300">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>{t.inspector}:</strong> {currentData.inspector || 'N/A'}
            </div>
            <div>
              <strong>{t.date}:</strong> {currentData.date}
            </div>
            <div className="col-span-2">
              <strong>{t.generalNotes}:</strong> {currentData.notes || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="p-0 sm:p-4 flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm border-collapse" role="table">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b-2 border-gray-200">
              <tr role="row">
                <th className="p-3 border text-start w-52 min-w-[120px] print-tight">{t.criteria}</th>
                {activeTab === 'lakes' ? (
                  <>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <th key={i} className="p-3 border text-center min-w-[95px] print-tight">
                        {t.pond} {i}
                      </th>
                    ))}
                  </>
                ) : (
                  <th className="p-3 border text-center w-40 min-w-[140px]">{t.status}</th>
                )}
                <th className="p-3 border text-start min-w-[100px] print-tight">{t.action}</th>
                <th className="p-3 border text-start w-32 min-w-[80px] print-tight">{t.responsible}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentRows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors" role="row">
                  <td className="p-3 border font-medium text-gray-800 bg-white align-top whitespace-pre-wrap print-tight" role="cell">
                    {row.criteria}
                  </td>
                  {activeTab === 'lakes' ? (
                    [1, 2, 3, 4, 5, 6].map(n => (
                      <td key={n} className="p-1 border bg-white align-top" role="cell">
                        <select
                          value={row[`status_${n}`] || ''}
                          onChange={(e) => handleRowChange(index, `status_${n}`, e.target.value)}
                          className={`w-full p-1 rounded outline-none border border-gray-200 focus-ring text-center font-medium text-[9px] h-[38px] leading-tight ${
                            statusOpts.find(o => o.value === row[`status_${n}`])?.color || 'bg-white'
                          }`}
                          aria-label={`${t.pond} ${n} - ${row.criteria}`}
                        >
                          {statusOpts.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))
                  ) : (
                    <td className="p-1 border bg-white align-top" role="cell">
                      <select
                        value={row.status || ''}
                        onChange={(e) => handleRowChange(index, 'status', e.target.value)}
                        className={`w-full p-2 rounded outline-none border border-gray-200 focus-ring text-center font-medium h-[38px] ${
                          statusOpts.find(o => o.value === row.status)?.color || 'bg-white'
                        }`}
                        aria-label={`${t.status} - ${row.criteria}`}
                      >
                        {statusOpts.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="p-1 border bg-white align-top" role="cell">
                    <AutoResizeTextarea
                      value={row.action || ''}
                      onChange={(e) => handleRowChange(index, 'action', e.target.value)}
                      placeholder={t.action}
                      className="w-full p-2 text-gray-700 outline-none focus:bg-gray-50 border border-transparent focus:border-gray-300 rounded text-sm"
                      aria-label={`${t.action} for ${row.criteria}`}
                    />
                  </td>
                  <td className="p-1 border bg-white align-top" role="cell">
                    <AutoResizeTextarea
                      value={row.responsible || ''}
                      onChange={(e) => handleRowChange(index, 'responsible', e.target.value)}
                      placeholder={t.responsible}
                      className="w-full p-2 text-gray-700 outline-none focus:bg-gray-50 border border-transparent focus:border-gray-300 rounded text-sm"
                      aria-label={`${t.responsible} for ${row.criteria}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Photo Upload Section */}
        <div className="mt-8 border-t pt-6 px-4 no-print">
          <div className="flex items-center justify-between mb-4">
            <label className="text-lg font-bold text-gray-800 flex items-center gap-2 focus-ring" tabIndex="0">
              <ImageIcon size={20} className="text-blue-600" />
              <span>{t.photos}</span>
            </label>
            <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-bold flex items-center gap-2 border border-blue-200 focus-ring">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                aria-label="Upload photos"
              />
              <Plus size={16} />
              <span>{t.addPhotos}</span>
            </label>
          </div>

          {currentPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="region" aria-label="Attached photos preview">
              {currentPhotos.map((src, index) => (
                <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm focus-ring" tabIndex="0">
                  <img src={src} alt={`Attachment ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200"></div>
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-red-600 focus-ring"
                    title={t.delete}
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 focus-ring" tabIndex="0">
              {t.noPhotos}
            </div>
          )}
        </div>

        {/* Print-only Photos Section at Bottom */}
        {currentPhotos.length > 0 && (
          <div className="hidden print-only mt-8 photo-appendix">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">{t.photoAppendix}</h3>
            <div className="grid grid-cols-2 gap-4">
              {currentPhotos.map((src, index) => (
                <div key={index} className="border border-gray-300 p-1 rounded">
                  <img src={src} alt={`Attachment ${index + 1}`} className="w-full h-auto object-contain max-h-[300px]" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
