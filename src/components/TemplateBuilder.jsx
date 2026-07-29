import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText, Plus, Trash2, Save, Eye, Edit3, GripVertical,
  ClipboardEdit, X, Check, LayoutList
} from 'lucide-react';
import { supabase } from '../supabase';
import { DialogOverlay } from './DialogOverlay';
import { FACILITY_TRANSLATIONS } from '../translations/criteria';

let dragItemIndex = null;
let dragOverItemIndex = null;

export const TemplateBuilder = ({ t, lang }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState('');
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);

  const nameRef = useRef(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inspection_templates')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const resetEditor = () => {
    setName('');
    setItems([]);
    setSelectedId(null);
    setIsNew(false);
    setPreviewing(false);
  };

  const handleSelect = (template) => {
    setSelectedId(template.id);
    setName(template.name);
    setItems((template.items || []).map((it, i) => ({ ...it, order: it.order ?? i })));
    setIsNew(false);
    setPreviewing(false);
  };

  const handleNew = () => {
    resetEditor();
    setIsNew(true);
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const handleAddItem = () => {
    const newItem = { id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), text: '', order: items.length };
    setItems(prev => [...prev, newItem]);
  };

  const handleItemChange = (id, text) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, text } : it));
  };

  const handleItemDelete = (id) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleDragStart = (index) => {
    dragItemIndex = index;
  };

  const handleDragEnter = (index) => {
    dragOverItemIndex = index;
  };

  const handleDragEnd = () => {
    if (dragItemIndex === null || dragOverItemIndex === null || dragItemIndex === dragOverItemIndex) {
      dragItemIndex = null;
      dragOverItemIndex = null;
      return;
    }
    const newItems = [...items];
    const [dragged] = newItems.splice(dragItemIndex, 1);
    newItems.splice(dragOverItemIndex, 0, dragged);
    setItems(newItems.map((it, i) => ({ ...it, order: i })));
    dragItemIndex = null;
    dragOverItemIndex = null;
  };

  const validate = () => {
    if (!name.trim()) {
      alert(t.enterTemplateNameRequired);
      return false;
    }
    const validItems = items.filter(it => it.text.trim());
    if (validItems.length === 0) {
      alert(t.enterAtLeastOneCriteria);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const cleanItems = items
        .filter(it => it.text.trim())
        .map((it, i) => ({ id: it.id, text: it.text.trim(), order: i }));

      if (isNew) {
        const { error } = await supabase.from('inspection_templates').insert({
          name: name.trim(),
          type: 'custom',
          items: cleanItems,
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('inspection_templates').update({
          name: name.trim(),
          items: cleanItems,
          updated_at: new Date().toISOString()
        }).eq('id', selectedId);
        if (error) throw error;
      }

      await fetchTemplates();
      resetEditor();
      window.location.reload();
    } catch (err) {
      console.error('Save template error:', err);
      alert('Save failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('inspection_templates').delete().eq('id', id);
      if (error) throw error;
      if (selectedId === id) resetEditor();
      await fetchTemplates();
      window.location.reload();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete template error:', err);
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  const isEditing = isNew || selectedId !== null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardEdit className="w-6 h-6 text-amber-600" />
          {t.templateBuilder}
        </h2>
      </div>

      <div className="flex gap-6">
        {/* Left Panel: Template List */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <button
                onClick={handleNew}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                <Plus size={16} /> {t.builderNewTemplate}
              </button>
            </div>

            <div className="p-2">
              <div className="text-xs font-bold text-gray-400 uppercase px-2 py-2">{t.customTemplates}</div>

              {loading ? (
                <div className="p-4 text-center text-sm text-gray-400">{t.loading}</div>
              ) : templates.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-400">{t.noTemplatesYet}</div>
              ) : (
                <div className="space-y-1">
                  {templates.map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => handleSelect(tmpl)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between group transition-colors ${
                        selectedId === tmpl.id
                          ? 'bg-amber-50 border border-amber-200 text-amber-800'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="truncate text-sm font-medium">{tmpl.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(tmpl); }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-2 border-t border-gray-100">
              <div className="text-xs font-bold text-gray-400 uppercase px-2 py-2">{t.builtInTemplates}</div>
              <div className="px-3 py-1 text-xs text-gray-400 italic">
                {Object.keys(FACILITY_TRANSLATIONS.ar).length} {lang === 'ar' ? 'نماذج' : 'templates'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="flex-1 min-w-0">
          {!isEditing ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <ClipboardEdit className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-500">{t.templateBuilder}</h3>
              <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                {lang === 'ar'
                  ? 'أنشئ نماذج تفتيش مخصصة مع معاييرك الخاصة. اختر نموذجاً من القائمة أو أنشئ نموذجاً جديداً.'
                  : 'Create custom inspection templates with your own criteria. Select a template from the list or create a new one.'}
              </p>
            </div>
          ) : previewing ? (
            /* Preview Mode */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-amber-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Eye size={18} className="text-amber-600" />
                  {t.templatePreviewLabel}: {name}
                </h3>
                <button
                  onClick={() => setPreviewing(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors flex items-center gap-1"
                >
                  <Edit3 size={14} /> {t.editTemplate}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-3 text-left font-medium text-gray-600 w-12">#</th>
                      <th className="p-3 text-left font-medium text-gray-600">{t.criteria}</th>
                      <th className="p-3 text-left font-medium text-gray-600 w-32">{t.status}</th>
                      <th className="p-3 text-left font-medium text-gray-600 w-48">{t.action}</th>
                      <th className="p-3 text-left font-medium text-gray-600 w-40">{t.responsible}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(it => it.text.trim()).map((item, idx) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 text-gray-400">{idx + 1}</td>
                        <td className="p-3 font-medium text-gray-800">{item.text.trim()}</td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-400">--</span>
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-400">--</span>
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-400">--</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Editor Mode */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <input
                    ref={nameRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.enterTemplateName}
                    className="w-full text-lg font-bold p-2 border-b-2 border-transparent focus:border-amber-500 outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewing(true)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
                    disabled={items.filter(it => it.text.trim()).length === 0}
                  >
                    <Eye size={14} /> {t.templatePreview}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <Save size={14} /> {saving ? t.loading : t.saveTemplate}
                  </button>
                  <button
                    onClick={resetEditor}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Criteria Items */}
              <div className="p-4">
                {items.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <LayoutList className="w-10 h-10 mx-auto mb-3" />
                    <p className="text-sm">{t.noCriteriaYet}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className="flex items-center gap-2 group"
                      >
                        <div
                          className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-amber-500 transition-colors"
                          title={lang === 'ar' ? 'اسحب لإعادة الترتيب' : 'Drag to reorder'}
                        >
                          <GripVertical size={18} />
                        </div>
                        <span className="flex-shrink-0 w-6 text-center text-xs text-gray-400 font-mono">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={item.text}
                          onChange={(e) => handleItemChange(item.id, e.target.value)}
                          placeholder={t.criteriaPlaceholder}
                          className="flex-1 p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
                        />
                        <button
                          onClick={() => handleItemDelete(item.id)}
                          className="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleAddItem}
                  className="mt-4 w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-amber-500 hover:text-amber-600 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus size={16} /> {t.addCriteria}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DialogOverlay isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t.deleteTemplate}>
        <div className="space-y-4">
          <p className="text-gray-600">{t.confirmDeleteTemplate}</p>
          {deleteConfirm && (
            <p className="font-semibold text-gray-800">"{deleteConfirm.name}"</p>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              {t.cancel}
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-1"
            >
              <Trash2 size={16} /> {t.delete}
            </button>
          </div>
        </div>
      </DialogOverlay>
    </div>
  );
};
