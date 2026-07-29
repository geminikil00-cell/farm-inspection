import React, { useState, useEffect } from 'react';
import {
  MapPin, ClipboardList, User, Check, Plus, X, Sparkles
} from 'lucide-react';
import { DialogOverlay } from './DialogOverlay';
import { getSites, addSite } from '../db';
import { FACILITY_TRANSLATIONS } from '../translations/criteria';

const SITE_TYPES = [
  { value: 'pond', labelKey: 'siteTypePond' },
  { value: 'processing', labelKey: 'siteTypeProcessing' },
  { value: 'storage', labelKey: 'siteTypeStorage' },
  { value: 'greenhouse', labelKey: 'siteTypeGreenhouse' },
  { value: 'warehouse', labelKey: 'siteTypeWarehouse' },
  { value: 'restArea', labelKey: 'siteTypeRestArea' },
  { value: 'other', labelKey: 'siteTypeOther' }
];

export const StartAuditDialog = ({ isOpen, onClose, onStart, t, lang }) => {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [inspectorName, setInspectorName] = useState('');

  const [showNewSiteForm, setShowNewSiteForm] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteType, setNewSiteType] = useState('other');

  const facilityNames = Object.keys(FACILITY_TRANSLATIONS.ar);

  useEffect(() => {
    if (isOpen) {
      setSelectedSiteId('');
      setSelectedTemplateKey('');
      setInspectorName('');
      setShowNewSiteForm(false);
      setNewSiteName('');
      loadSites();
    }
  }, [isOpen]);

  const loadSites = async () => {
    const data = await getSites();
    setSites(data);
  };

  const handleAddSite = async () => {
    if (!newSiteName.trim()) return;
    const site = await addSite({ name: newSiteName.trim(), type: newSiteType, description: '' });
    await loadSites();
    setSelectedSiteId(site.id);
    setShowNewSiteForm(false);
    setNewSiteName('');
  };

  const canStart = () => !!selectedSiteId && !!selectedTemplateKey && !!inspectorName.trim();

  const handleStart = () => {
    if (!canStart()) return;
    const selectedSite = sites.find(s => s.id === selectedSiteId);
    onStart({
      siteId: selectedSiteId,
      siteName: selectedSite?.name || t.selectSite,
      templateKey: selectedTemplateKey,
      inspectorName: inspectorName.trim()
    });
    onClose();
  };

  return (
    <DialogOverlay isOpen={isOpen} onClose={onClose} title={t.newInspection}>
      <div className="space-y-5">
        {/* Location / Site */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <MapPin size={16} className="text-green-500" /> {t.selectSite}
          </label>
          {showNewSiteForm ? (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="text" value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)}
                placeholder={t.enterSiteName}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm" autoFocus
              />
              <select
                value={newSiteType} onChange={(e) => setNewSiteType(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white"
              >
                {SITE_TYPES.map(st => (
                  <option key={st.value} value={st.value}>{t[st.labelKey]}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button onClick={handleAddSite} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                  <Plus size={16} className="inline mr-1" /> {t.addSite}
                </button>
                <button onClick={() => setShowNewSiteForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <X size={16} className="inline mr-1" /> {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white"
              >
                <option value="">-- {t.selectSite} --</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name} ({t['siteType' + site.type.charAt(0).toUpperCase() + site.type.slice(1)] || site.type})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowNewSiteForm(true)}
                className="w-full p-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-green-600 hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={16} /> {t.addNewSite}
              </button>
            </div>
          )}
        </div>

        {/* Template / Facility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <ClipboardList size={16} className="text-blue-500" /> {t.selectTemplate}
          </label>
          <select
            value={selectedTemplateKey}
            onChange={(e) => setSelectedTemplateKey(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white"
          >
            <option value="">-- {t.selectTemplate} --</option>
            {facilityNames.map(key => {
              const title = FACILITY_TRANSLATIONS[lang]?.[key]?.title || FACILITY_TRANSLATIONS.ar[key].title;
              return (
                <option key={key} value={key}>{title}</option>
              );
            })}
          </select>
        </div>

        {/* Inspector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <User size={16} className="text-purple-500" /> {t.inspector}
          </label>
          <input
            type="text"
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
            placeholder={t.enterInspector}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X size={16} className="inline mr-1" /> {t.cancel}
          </button>
          <button
            onClick={handleStart}
            disabled={!canStart()}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
              canStart() ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Sparkles size={16} /> {t.wizardStart}
          </button>
        </div>
      </div>
    </DialogOverlay>
  );
};
