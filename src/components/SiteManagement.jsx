import React, { useState, useEffect } from 'react';
import {
  MapPin, Plus, Pencil, Trash2, Save, X, Building2, Waves,
  Package, Warehouse, Sprout, Users, HelpCircle, Check, Ban
} from 'lucide-react';
import { getSites, addSite, updateSite, deleteSite } from '../db';
import { DialogOverlay } from './DialogOverlay';

const SITE_TYPES = [
  { value: 'pond', icon: Waves },
  { value: 'processing', icon: Package },
  { value: 'storage', icon: Warehouse },
  { value: 'greenhouse', icon: Sprout },
  { value: 'warehouse', icon: Building2 },
  { value: 'restArea', icon: Users },
  { value: 'other', icon: HelpCircle }
];

export const SiteManagement = ({ t, isRtl }) => {
  const [sites, setSites] = useState([]);
  const [editingSite, setEditingSite] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'other', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadSites = async () => {
    const data = await getSites();
    setSites(data);
  };

  useEffect(() => { loadSites(); }, []);

  const resetForm = () => {
    setForm({ name: '', type: 'other', description: '' });
    setEditingSite(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingSite) {
      await updateSite(editingSite.id, { name: form.name.trim(), type: form.type, description: form.description.trim() });
    } else {
      await addSite({ name: form.name.trim(), type: form.type, description: form.description.trim() });
    }
    resetForm();
    await loadSites();
  };

  const handleEdit = (site) => {
    setForm({ name: site.name, type: site.type, description: site.description || '' });
    setEditingSite(site);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await deleteSite(id);
    setDeleteConfirm(null);
    await loadSites();
  };

  const getTypeIcon = (type) => {
    const st = SITE_TYPES.find(s => s.value === type);
    const Icon = st ? st.icon : HelpCircle;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeLabel = (type) => {
    const labels = {
      pond: t.siteTypePond,
      processing: t.siteTypeProcessing,
      storage: t.siteTypeStorage,
      greenhouse: t.siteTypeGreenhouse,
      warehouse: t.siteTypeWarehouse,
      restArea: t.siteTypeRestArea,
      other: t.siteTypeOther
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-green-600" />
          {t.siteManagement}
        </h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> {t.addSite}
        </button>
      </div>

      {sites.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t.noSitesYet}</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} className="inline mr-1" /> {t.addSite}
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {sites.map(site => (
            <div key={site.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getTypeIcon(site.type)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{site.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 rounded-full text-xs">{getTypeLabel(site.type)}</span>
                    {site.description && <span className="text-gray-400 truncate"> — {site.description}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(site)}
                  className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                  title={t.editSite}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(site)}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                  title={t.deleteSite}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DialogOverlay isOpen={showForm} onClose={resetForm} title={editingSite ? t.editSite : t.addSite}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.siteName}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t.enterSiteName}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.siteType}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SITE_TYPES.map(st => {
                const Icon = st.icon;
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: st.value })}
                    className={`flex items-center gap-2 p-2.5 border rounded-lg text-sm transition-colors ${
                      form.type === st.value
                        ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {getTypeLabel(st.value)}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.siteDescription}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <X size={16} className="inline mr-1" /> {t.cancel}
            </button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
              <Save size={16} className="inline mr-1" /> {t.saveSite}
            </button>
          </div>
        </form>
      </DialogOverlay>

      <DialogOverlay isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t.deleteSite}>
        <div className="space-y-4">
          <p className="text-gray-600">{t.confirmDeleteSite}</p>
          {deleteConfirm && (
            <p className="font-semibold text-gray-800">"{deleteConfirm.name}"</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <X size={16} className="inline mr-1" /> {t.cancel}
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <Trash2 size={16} className="inline mr-1" /> {t.delete}
            </button>
          </div>
        </div>
      </DialogOverlay>
    </div>
  );
};
