import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText, Plus, Trash2, Save, Eye, Edit3, GripVertical,
  ClipboardEdit, X, Check, LayoutList, ChevronDown, ChevronRight
} from 'lucide-react';
import { supabase } from '../supabase';
import { DialogOverlay } from './DialogOverlay';
import { FACILITY_TRANSLATIONS } from '../translations/criteria';

let rowDragIndex = null;
let rowDragOverIndex = null;
let colDragIndex = null;
let colDragOverIndex = null;

const COLOR_PRESETS = [
  { value: 'bg-green-100 text-green-800', label: 'Green', swatch: 'bg-green-500' },
  { value: 'bg-blue-100 text-blue-800', label: 'Blue', swatch: 'bg-blue-500' },
  { value: 'bg-cyan-100 text-cyan-800', label: 'Cyan', swatch: 'bg-cyan-500' },
  { value: 'bg-yellow-100 text-yellow-800', label: 'Yellow', swatch: 'bg-yellow-500' },
  { value: 'bg-red-100 text-red-800', label: 'Red', swatch: 'bg-red-500' },
  { value: 'bg-gray-100 text-gray-800', label: 'Gray', swatch: 'bg-gray-500' },
];

const DEFAULT_COLUMNS = [
  { id: 'criteria', header: 'المعيار / البند', type: 'label' },
  { id: 'col_1', header: 'الحالة', type: 'select', options: [
    { value: '', label: 'اختر حالة', color: 'bg-white', score: null },
    { value: 'ممتاز', label: 'ممتاز', color: 'bg-green-100 text-green-800', score: 100 },
    { value: 'جيد جداً', label: 'جيد جداً', color: 'bg-blue-100 text-blue-800', score: 80 },
    { value: 'جيد', label: 'جيد', color: 'bg-cyan-100 text-cyan-800', score: 60 },
    { value: 'مقبول', label: 'مقبول', color: 'bg-yellow-100 text-yellow-800', score: 40 },
    { value: 'سيء', label: 'سيء', color: 'bg-red-100 text-red-800', score: 0 },
  ]},
  { id: 'col_2', header: 'الإجراء التصحيحي المطلوب', type: 'textarea' },
  { id: 'col_3', header: 'المسؤول', type: 'textarea' },
];

const COL_TYPE_LABELS = {
  select: 'typeSelect',
  textarea: 'typeTextarea',
  text: 'typeText',
  label: 'typeLabel',
};

const SAMPLE_ROW_VALUES = {
  select: '--',
  textarea: '',
  text: '',
  label: '',
};

export const TemplateBuilder = ({ t, lang, onTemplatesChange }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState('');
  const [columns, setColumns] = useState([]);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCol, setExpandedCol] = useState(null);

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
    setColumns([]);
    setItems([]);
    setSelectedId(null);
    setIsNew(false);
    setPreviewing(false);
    setExpandedCol(null);
  };

  const handleSelect = (template) => {
    setSelectedId(template.id);
    setName(template.name);
    setColumns((template.columns && template.columns.length > 0) ? template.columns : DEFAULT_COLUMNS);
    setItems((template.items || []).map((it, i) => ({ ...it, order: it.order ?? i })));
    setIsNew(false);
    setPreviewing(false);
    setExpandedCol(null);
  };

  const handleNew = () => {
    resetEditor();
    setIsNew(true);
    setColumns(DEFAULT_COLUMNS.map(c => JSON.parse(JSON.stringify(c))));
    setItems([]);
    setTimeout(() => nameRef.current?.focus(), 100);
  };

  const handleColumnChange = (colId, field, value) => {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, [field]: value } : c));
  };

  const handleAddColumn = () => {
    const newId = 'col_' + Date.now();
    setColumns(prev => [...prev, { id: newId, header: '', type: 'text' }]);
    setExpandedCol(newId);
  };

  const handleDeleteColumn = (colId) => {
    setColumns(prev => prev.filter(c => c.id !== colId));
    if (expandedCol === colId) setExpandedCol(null);
  };

  const handleOptionChange = (colId, optIndex, field, value) => {
    setColumns(prev => prev.map(c => {
      if (c.id !== colId || !c.options) return c;
      const newOpts = [...c.options];
      newOpts[optIndex] = { ...newOpts[optIndex], [field]: value };
      return { ...c, options: newOpts };
    }));
  };

  const handleAddOption = (colId) => {
    setColumns(prev => prev.map(c => {
      if (c.id !== colId) return c;
      const newOpt = { value: '', label: '', color: COLOR_PRESETS[0].value, score: null };
      return { ...c, options: [...(c.options || []), newOpt] };
    }));
  };

  const handleDeleteOption = (colId, optIndex) => {
    setColumns(prev => prev.map(c => {
      if (c.id !== colId || !c.options) return c;
      return { ...c, options: c.options.filter((_, i) => i !== optIndex) };
    }));
  };

  const handleAddItem = () => {
    const newItem = { id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5), text: '', order: items.length };
    setItems(prev => [...prev, newItem]);
  };

  const handleItemChange = (id, text) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, text } : it));
  };

  const handleItemDelete = (id) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleRowDragStart = (index) => { rowDragIndex = index; };
  const handleRowDragEnter = (index) => { rowDragOverIndex = index; };
  const handleRowDragEnd = () => {
    if (rowDragIndex === null || rowDragOverIndex === null || rowDragIndex === rowDragOverIndex) {
      rowDragIndex = null; rowDragOverIndex = null;
      return;
    }
    const newItems = [...items];
    const [dragged] = newItems.splice(rowDragIndex, 1);
    newItems.splice(rowDragOverIndex, 0, dragged);
    setItems(newItems.map((it, i) => ({ ...it, order: i })));
    rowDragIndex = null; rowDragOverIndex = null;
  };

  const handleColDragStart = (index) => { colDragIndex = index; };
  const handleColDragEnter = (index) => { colDragOverIndex = index; };
  const handleColDragEnd = () => {
    if (colDragIndex === null || colDragOverIndex === null || colDragIndex === colDragOverIndex) {
      colDragIndex = null; colDragOverIndex = null;
      return;
    }
    if (colDragIndex === 0 || colDragOverIndex === 0) {
      colDragIndex = null; colDragOverIndex = null;
      return;
    }
    const newCols = [...columns];
    const [dragged] = newCols.splice(colDragIndex, 1);
    newCols.splice(colDragOverIndex, 0, dragged);
    setColumns(newCols);
    colDragIndex = null; colDragOverIndex = null;
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
    if (columns.length === 0) {
      alert(t.noColumnsYet || 'Add at least one column');
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

      const cleanColumns = columns.map(c => {
        const col = { id: c.id, header: c.header.trim() || '', type: c.type };
        if (c.type === 'select' && c.options) {
          col.options = c.options;
        }
        return col;
      });

      const payload = {
        name: name.trim(),
        type: 'custom',
        columns: cleanColumns,
        items: cleanItems,
        updated_at: new Date().toISOString()
      };

      if (isNew) {
        const { error } = await supabase.from('inspection_templates').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('inspection_templates').update(payload).eq('id', selectedId);
        if (error) throw error;
      }

      await fetchTemplates();
      resetEditor();
      if (onTemplatesChange) onTemplatesChange();
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
      if (onTemplatesChange) onTemplatesChange();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete template error:', err);
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  const isEditing = isNew || selectedId !== null;

  const getTypeLabel = (type) => {
    const key = COL_TYPE_LABELS[type];
    return key ? t[key] : type;
  };

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
                <div className="p-4 text-center text-sm text-gray-400">
                  {t.noTemplatesYet || (lang === 'ar' ? 'لا توجد نماذج' : 'No templates')}
                </div>
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
                  ? 'أنشئ نماذج تفتيش مخصصة بجداول وأعمدة قابلة للتخصيص. اختر نموذجاً من القائمة أو أنشئ نموذجاً جديداً.'
                  : 'Create custom inspection templates with configurable tables and columns. Select a template or create a new one.'}
              </p>
            </div>
          ) : previewing ? (
            /* Live Table Preview */
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
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      {columns.map(col => (
                        <th key={col.id} className={`p-2.5 font-bold text-gray-700 text-xs ${col.type === 'label' ? 'text-left' : 'text-center'}`}>
                          {col.header || (lang === 'ar' ? 'عمود' : 'Column')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(it => it.text.trim()).length > 0 ? (
                      items.filter(it => it.text.trim()).map((item, idx) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          {columns.map(col => {
                            if (col.type === 'label') {
                              return <td key={col.id} className="p-2.5 border text-xs font-medium text-gray-800 whitespace-pre-wrap">{item.text.trim()}</td>;
                            }
                            if (col.type === 'select') {
                              const defaultOpt = col.options && col.options.length > 0 ? col.options[0] : null;
                              const cls = defaultOpt ? defaultOpt.color : 'bg-white';
                              return (
                                <td key={col.id} className="p-1.5 border text-center">
                                  <span className={`inline-block px-2 py-1 rounded text-xs ${cls}`}>
                                    {defaultOpt ? (defaultOpt.label || '--') : '--'}
                                  </span>
                                </td>
                              );
                            }
                            return (
                              <td key={col.id} className="p-1.5 border">
                                <div className="w-full px-2 py-1 bg-gray-50 rounded border border-gray-100 text-xs text-gray-400 min-h-[32px]">
                                  &nbsp;
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={columns.length} className="p-6 text-center text-gray-400 text-sm">
                          {t.noCriteriaYet}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Editor Mode */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Template Name */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <input
                    ref={nameRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.enterTemplateName || (lang === 'ar' ? 'اسم النموذج' : 'Template name')}
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

              {/* Column Configuration */}
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h4 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                  <LayoutList size={16} /> {t.columnsConfig}
                </h4>
                <div className="flex flex-wrap gap-2 items-start">
                  {columns.map((col, index) => {
                    const isFirst = index === 0;
                    const isExpanded = expandedCol === col.id;
                    return (
                      <div
                        key={col.id}
                        draggable={!isFirst}
                        onDragStart={() => handleColDragStart(index)}
                        onDragEnter={() => handleColDragEnter(index)}
                        onDragEnd={handleColDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className={`bg-white rounded-lg border-2 transition-colors ${
                          isExpanded ? 'border-amber-400 shadow-md' : 'border-gray-200 hover:border-amber-300'
                        }`}
                        style={{ minWidth: isExpanded ? '280px' : '160px' }}
                      >
                        {/* Column Card Header */}
                        <div
                          className="flex items-center gap-1 px-3 py-2 cursor-pointer"
                          onClick={() => setExpandedCol(isExpanded ? null : col.id)}
                        >
                          {!isFirst && (
                            <div className="flex-shrink-0 p-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-amber-500">
                              <GripVertical size={14} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-700 truncate">
                              {col.header || (lang === 'ar' ? 'عمود' : 'Column')}
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {getTypeLabel(col.type)}
                            </span>
                          </div>
                          <span className="text-gray-300">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                        </div>

                        {/* Expanded Editor */}
                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-gray-500 uppercase">{t.columnHeader}</label>
                              <input
                                type="text"
                                value={col.header}
                                onChange={(e) => handleColumnChange(col.id, 'header', e.target.value)}
                                placeholder={t.columnPlaceholder || (lang === 'ar' ? 'اسم العمود' : 'Column name')}
                                className="w-full p-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-gray-500 uppercase">{t.columnType}</label>
                              <select
                                value={col.type}
                                onChange={(e) => handleColumnChange(col.id, 'type', e.target.value)}
                                disabled={isFirst}
                                className="w-full p-1.5 text-xs border border-gray-200 rounded focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-gray-100"
                              >
                                {isFirst ? (
                                  <option value="label">{t.typeLabel}</option>
                                ) : (
                                  <>
                                    <option value="select">{t.typeSelect}</option>
                                    <option value="textarea">{t.typeTextarea}</option>
                                    <option value="text">{t.typeText}</option>
                                  </>
                                )}
                              </select>
                            </div>

                            {/* Select Options Editor */}
                            {col.type === 'select' && col.options && (
                              <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-500 uppercase">{t.selectOptions}</label>
                                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                                  {col.options.map((opt, oi) => (
                                    <div key={oi} className="flex items-center gap-1 bg-gray-50 rounded p-1.5">
                                      <input
                                        type="text"
                                        value={opt.label}
                                        onChange={(e) => handleOptionChange(col.id, oi, 'label', e.target.value)}
                                        onBlur={(e) => {
                                          if (!opt.value) handleOptionChange(col.id, oi, 'value', e.target.value);
                                        }}
                                        placeholder={t.optionLabel}
                                        className="flex-1 p-1 text-xs border border-gray-200 rounded outline-none focus:ring-1 focus:ring-amber-500 min-w-0"
                                      />
                                      <input
                                        type="number"
                                        value={opt.score != null ? opt.score : ''}
                                        onChange={(e) => handleOptionChange(col.id, oi, 'score', e.target.value === '' ? null : Number(e.target.value))}
                                        placeholder={t.optionScore}
                                        className="w-14 p-1 text-xs border border-gray-200 rounded outline-none focus:ring-1 focus:ring-amber-500 text-center"
                                      />
                                      <div className="flex gap-0.5">
                                        {COLOR_PRESETS.map(cp => (
                                          <button
                                            key={cp.value}
                                            onClick={() => handleOptionChange(col.id, oi, 'color', cp.value)}
                                            className={`w-4 h-4 rounded-full border-2 ${cp.swatch} ${
                                              opt.color === cp.value ? 'border-gray-600 ring-1 ring-offset-1 ring-gray-400' : 'border-transparent'
                                            }`}
                                            title={cp.label}
                                          />
                                        ))}
                                      </div>
                                      <button
                                        onClick={() => handleDeleteOption(col.id, oi)}
                                        className="flex-shrink-0 p-0.5 text-gray-300 hover:text-red-500"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => handleAddOption(col.id)}
                                  className="w-full p-1.5 border border-dashed border-gray-300 rounded text-[10px] text-gray-500 hover:border-amber-400 hover:text-amber-600 flex items-center justify-center gap-1"
                                >
                                  <Plus size={12} /> {t.addOption}
                                </button>
                              </div>
                            )}

                            {!isFirst && (
                              <button
                                onClick={() => handleDeleteColumn(col.id)}
                                className="w-full p-1.5 text-red-500 hover:bg-red-50 rounded text-xs flex items-center justify-center gap-1"
                              >
                                <Trash2 size={12} /> {t.deleteColumn}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <button
                    onClick={handleAddColumn}
                    className="flex items-center gap-1 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors font-medium bg-white"
                  >
                    <Plus size={16} /> {t.addColumn}
                  </button>
                </div>
              </div>

              {/* Criteria Rows */}
              <div className="p-4">
                <h4 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  {lang === 'ar' ? 'معايير التفتيش' : 'Inspection Criteria'}
                </h4>

                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <LayoutList className="w-10 h-10 mx-auto mb-3" />
                    <p className="text-sm">{t.noCriteriaYet}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleRowDragStart(index)}
                        onDragEnter={() => handleRowDragEnter(index)}
                        onDragEnd={handleRowDragEnd}
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
                          placeholder={t.criteriaPlaceholder || (lang === 'ar' ? 'أدخل نص المعيار...' : 'Enter criteria text...')}
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
                  <Plus size={16} /> {t.addCriteria || (lang === 'ar' ? '+ إضافة معيار' : '+ Add Criteria')}
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
