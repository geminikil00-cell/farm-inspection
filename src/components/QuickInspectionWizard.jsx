import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, ClipboardList, User, Check, ChevronRight, ChevronLeft,
  Plus, Sparkles
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

export const QuickInspectionWizard = ({ isOpen, onClose, onStart, t, lang }) => {
  const [step, setStep] = useState(1);
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('');
  const [inspectorName, setInspectorName] = useState('');

  const [showNewSiteForm, setShowNewSiteForm] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteType, setNewSiteType] = useState('other');
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCriteria, setNewTemplateCriteria] = useState('');
  const [newTemplateFacility, setNewTemplateFacility] = useState('');

  const facilityNames = Object.keys(FACILITY_TRANSLATIONS.ar);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedSiteId('');
      setSelectedTemplateKey('');
      setInspectorName('');
      setShowNewSiteForm(false);
      setNewSiteName('');
      setShowNewTemplateForm(false);
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

  const handleAddTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateCriteria.trim()) return;
    const criteriaItems = newTemplateCriteria.split('\n').filter(c => c.trim());
    const templateKey = 'custom_' + Date.now();
    if (!FACILITY_TRANSLATIONS.ar[templateKey]) {
      FACILITY_TRANSLATIONS.ar[templateKey] = { title: newTemplateName.trim(), items: criteriaItems };
      if (!FACILITY_TRANSLATIONS.en[templateKey]) {
        FACILITY_TRANSLATIONS.en[templateKey] = { title: newTemplateName.trim(), items: criteriaItems };
      }
    }
    setSelectedTemplateKey(templateKey);
    setShowNewTemplateForm(false);
    setNewTemplateName('');
    setNewTemplateCriteria('');
  };

  const canGoNext = () => {
    if (step === 1) return !!selectedSiteId;
    if (step === 2) return !!selectedTemplateKey;
    if (step === 3) return !!inspectorName.trim();
    return false;
  };

  const handleStart = () => {
    if (!canGoNext()) return;
    const selectedSite = sites.find(s => s.id === selectedSiteId);
    const templateKey = selectedTemplateKey.startsWith('custom_')
      ? selectedTemplateKey
      : selectedTemplateKey;
    onStart({
      siteId: selectedSiteId,
      siteName: selectedSite?.name || '',
      templateKey,
      inspectorName: inspectorName.trim()
    });
    onClose();
  };

  const getTypeLabel = (type) => {
    const labels = {
      pond: t.siteTypePond, processing: t.siteTypeProcessing, storage: t.siteTypeStorage,
      greenhouse: t.siteTypeGreenhouse, warehouse: t.siteTypeWarehouse, restArea: t.siteTypeRestArea, other: t.siteTypeOther
    };
    return labels[type] || type;
  };

  return (
    <DialogOverlay isOpen={isOpen} onClose={onClose} title={t.quickInspection}>
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <Check size={16} /> : s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-green-600' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
        <div className="text-center text-sm font-medium text-gray-500">
          {step === 1 ? t.wizardStep1 : step === 2 ? t.wizardStep2 : t.wizardStep3}
        </div>

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-4">
            {showNewSiteForm ? (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-700 flex items-center gap-2"><Plus size={16} /> {t.addSite}</h4>
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
                    {t.addSite}
                  </button>
                  <button onClick={() => setShowNewSiteForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.selectSite}</label>
                  {sites.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <MapPin className="w-10 h-10 mx-auto mb-2" />
                      <p className="text-sm">{t.noSitesYet}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {sites.map(site => (
                        <button
                          key={site.id}
                          type="button"
                          onClick={() => setSelectedSiteId(site.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center gap-3 ${
                            selectedSiteId === site.id
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <MapPin size={18} className="text-green-500" />
                          <div>
                            <span className="font-medium">{site.name}</span>
                            <span className="text-xs text-gray-400 ml-2">{getTypeLabel(site.type)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowNewSiteForm(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> {t.addNewSite}
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 2: Template */}
        {step === 2 && (
          <div className="space-y-4">
            {showNewTemplateForm ? (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-700 flex items-center gap-2"><Plus size={16} /> {t.createTemplate}</h4>
                <input
                  type="text" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder={t.enterTemplateName}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                />
                <select
                  value={newTemplateFacility} onChange={(e) => setNewTemplateFacility(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white"
                >
                  <option value="">{t.selectFacility}</option>
                  {facilityNames.map(key => (
                    <option key={key} value={key}>{FACILITY_TRANSLATIONS[lang]?.[key]?.title || FACILITY_TRANSLATIONS.ar[key].title}</option>
                  ))}
                </select>
                <textarea
                  value={newTemplateCriteria} onChange={(e) => setNewTemplateCriteria(e.target.value)}
                  placeholder={t.templateCriteria}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  rows={5}
                />
                <div className="flex gap-2">
                  <button onClick={handleAddTemplate} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                    {t.createTemplate}
                  </button>
                  <button onClick={() => setShowNewTemplateForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.selectTemplate}</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {facilityNames.map(key => {
                      const title = FACILITY_TRANSLATIONS[lang]?.[key]?.title || FACILITY_TRANSLATIONS.ar[key].title;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedTemplateKey(key)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedTemplateKey === key
                              ? 'border-green-500 bg-green-50 text-green-800'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <span className="font-medium">{title}</span>
                          <span className="text-xs text-gray-400 ml-2">
                            ({(FACILITY_TRANSLATIONS.ar[key]?.items || []).length} items)
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Inspector */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} /> {t.inspector}
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                placeholder={t.enterInspector}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />
            </div>
            {selectedSiteId && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                  <Sparkles size={16} className="text-yellow-500" />
                  <span>{t.wizardStep3}</span>
                </div>
                <p className="text-sm font-medium text-gray-700">
                  {sites.find(s => s.id === selectedSiteId)?.name} &mdash;{' '}
                  {FACILITY_TRANSLATIONS[lang]?.[selectedTemplateKey]?.title || FACILITY_TRANSLATIONS.ar[selectedTemplateKey]?.title || selectedTemplateKey}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <ChevronLeft size={16} /> {step === 1 ? t.cancel : t.wizardBack}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                canGoNext() ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {t.wizardNext} <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={!canGoNext()}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${
                canGoNext() ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Check size={18} /> {t.wizardStart}
            </button>
          )}
        </div>
      </div>
    </DialogOverlay>
  );
};
