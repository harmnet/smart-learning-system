"use client";

import { useState, useEffect } from 'react';
import { dictionaryService, DictionaryType, DictionaryItem, DictionaryTypeCreate } from '@/services/dictionary.service';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminDictionaryPage() {
  const { t } = useLanguage();
  const [types, setTypes] = useState<DictionaryType[]>([]);
  const [selectedType, setSelectedType] = useState<DictionaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editItemModalOpen, setEditItemModalOpen] = useState(false);
  const [addTypeModalOpen, setAddTypeModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DictionaryItem | null>(null);
  const [itemForm, setItemForm] = useState({
    code: '',
    label: '',
    value: '',
    sort_order: 0,
    remark: ''
  });
  const [typeForm, setTypeForm] = useState<DictionaryTypeCreate>({
    code: '',
    name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      setLoading(true);
      const data = await dictionaryService.getTypes();
      setTypes(data);
      if (data.length > 0 && !selectedType) {
        setSelectedType(data[0]);
      }
    } catch (error) {
      console.error('Failed to load dictionary types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item: DictionaryItem) => {
    setEditingItem(item);
    setItemForm({
      code: item.code,
      label: item.label,
      value: item.value,
      sort_order: item.sort_order,
      remark: item.remark || ''
    });
    setEditItemModalOpen(true);
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;
    
    try {
      await dictionaryService.updateItem(editingItem.id, itemForm);
      setEditItemModalOpen(false);
      setEditingItem(null);
      
      if (selectedType) {
        const data = await dictionaryService.getTypes();
        setTypes(data);
        const updatedType = data.find(t => t.id === selectedType.id);
        if (updatedType) setSelectedType(updatedType);
      }
    } catch (err: any) {
      console.error('Failed to update item:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm(t.common.confirm + '?')) return;
    
    try {
      await dictionaryService.deleteItem(itemId);
      if (selectedType) {
        const data = await dictionaryService.getTypes();
        setTypes(data);
        const updatedType = data.find(t => t.id === selectedType.id);
        if (updatedType) setSelectedType(updatedType);
      }
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      alert(t.common.error + ': ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleAddType = async () => {
    if (!typeForm.code || !typeForm.name) {
      alert(t.common.pleaseEnter + ' ' + t.admin.dictionary.types.code + ' 和 ' + t.admin.dictionary.types.name);
      return;
    }

    try {
      const newType = await dictionaryService.createType(typeForm);
      setAddTypeModalOpen(false);
      setTypeForm({ code: '', name: '', description: '', is_active: true });
      await loadTypes();
      // 查找新创建的类型并选中
      const updatedTypes = await dictionaryService.getTypes();
      const createdType = updatedTypes.find(t => t.code === typeForm.code);
      if (createdType) {
        setSelectedType(createdType);
      }
      alert(t.common.success);
    } catch (err: any) {
      console.error('Failed to create type:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Network error';
      
      // 如果是网络错误，先刷新列表检查是否已创建成功
      if (errorMessage.includes('network') || errorMessage.includes('Network') || !err.response) {
        try {
          await loadTypes();
          // 检查是否已经创建成功
          const updatedTypes = await dictionaryService.getTypes();
          const existingType = updatedTypes.find(t => t.code === typeForm.code);
          if (existingType) {
            // 数据已存在，说明创建成功了
            setAddTypeModalOpen(false);
            setTypeForm({ code: '', name: '', description: '', is_active: true });
            setSelectedType(existingType);
            alert(t.common.success + ' (数据已成功创建)');
            return;
          }
        } catch (refreshErr) {
          console.error('Failed to refresh types:', refreshErr);
        }
      }
      
      // 如果是重复数据错误，也刷新列表并选中已存在的类型
      if (errorMessage.includes('already exists') || errorMessage.includes('已存在')) {
        try {
          await loadTypes();
          const updatedTypes = await dictionaryService.getTypes();
          const existingType = updatedTypes.find(t => t.code === typeForm.code);
          if (existingType) {
            setAddTypeModalOpen(false);
            setTypeForm({ code: '', name: '', description: '', is_active: true });
            setSelectedType(existingType);
            alert(t.admin.dictionary.typeExists + '，已自动选中该类型');
            return;
          }
        } catch (refreshErr) {
          console.error('Failed to refresh types:', refreshErr);
        }
      }
      
      alert(t.common.error + ': ' + errorMessage);
    }
  };

  const inputStyle = "w-full px-4 py-3 bg-slate-50 border border-transparent rounded-full text-sm focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all";

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.admin.dictionary.title}</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">{t.admin.dictionary.subtitle}</p>
        </div>
        <button 
          onClick={() => setAddTypeModalOpen(true)}
          className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-full font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          {t.admin.dictionary.addType}
        </button>
      </div>

      <div className="flex-1 grid md:grid-cols-4 gap-6 min-h-0">
        {/* Left: Types List */}
        <div className="md:col-span-1 bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
          <div className="p-5 bg-slate-50/50 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">{t.admin.dictionary.types.title}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {types.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type)}
                className={`w-full text-left px-4 py-3 rounded-2xl transition-all group ${
                  selectedType?.id === type.id ? 'bg-blue-50 text-blue-700 shadow-sm' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className={`font-bold ${selectedType?.id === type.id ? 'text-blue-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
                  {type.name}
                </div>
                <div className={`text-xs font-mono mt-0.5 ${selectedType?.id === type.id ? 'text-blue-400' : 'text-slate-400'}`}>{type.code}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Items List */}
        <div className="md:col-span-3 bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col shadow-sm">
          {selectedType ? (
            <>
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{selectedType.name}</h2>
                  <p className="text-slate-500 text-sm mt-1 font-medium">{selectedType.description}</p>
                </div>
                <button className="px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                  {t.admin.dictionary.addItem}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 sticky top-0">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.dictionary.items.label}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.dictionary.items.value}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.dictionary.items.sort}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.common.status}</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedType.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.label}</td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded-lg w-fit border border-slate-100">{item.value}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-500">{item.sort_order}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                            {item.is_active ? t.common.active : t.common.inactive}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEditItem(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
              <p className="font-medium">{t.common.pleaseSelect}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Item Modal */}
      {editItemModalOpen && editingItem && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Edit Item</h2>
              <button onClick={() => setEditItemModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.dictionary.items.label}</label>
                <input type="text" value={itemForm.label} onChange={(e) => setItemForm({...itemForm, label: e.target.value})} className={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.dictionary.items.value}</label>
                <input type="text" value={itemForm.value} onChange={(e) => setItemForm({...itemForm, value: e.target.value})} className={inputStyle} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.dictionary.types.code}</label>
                <input type="text" value={itemForm.code} onChange={(e) => setItemForm({...itemForm, code: e.target.value})} className={inputStyle} disabled />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">{t.admin.dictionary.items.sort}</label>
                <input type="number" value={itemForm.sort_order} onChange={(e) => setItemForm({...itemForm, sort_order: parseInt(e.target.value)})} className={inputStyle} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setEditItemModalOpen(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors">{t.common.cancel}</button>
                <button onClick={handleSaveItem} className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors active:scale-95">{t.common.save}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Type Modal */}
      {addTypeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">{t.admin.dictionary.addType}</h2>
              <button 
                onClick={() => {
                  setAddTypeModalOpen(false);
                  setTypeForm({ code: '', name: '', description: '', is_active: true });
                }} 
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {t.admin.dictionary.types.code} <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={typeForm.code} 
                  onChange={(e) => setTypeForm({...typeForm, code: e.target.value})} 
                  className={inputStyle}
                  placeholder={t.admin.dictionary.types.code}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {t.admin.dictionary.types.name} <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={typeForm.name} 
                  onChange={(e) => setTypeForm({...typeForm, name: e.target.value})} 
                  className={inputStyle}
                  placeholder={t.admin.dictionary.types.name}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {t.admin.dictionary.types.desc}
                </label>
                <textarea 
                  value={typeForm.description || ''} 
                  onChange={(e) => setTypeForm({...typeForm, description: e.target.value})} 
                  className={inputStyle}
                  rows={3}
                  placeholder={t.admin.dictionary.types.desc}
                />
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group hover:border-blue-200 transition-all" onClick={() => setTypeForm({ ...typeForm, is_active: !typeForm.is_active })}>
                <div className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors duration-300 ${typeForm.is_active ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${typeForm.is_active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
                <span className={`font-bold select-none ${typeForm.is_active ? 'text-blue-700' : 'text-slate-500'}`}>
                  {typeForm.is_active ? t.common.active : t.common.inactive}
                </span>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => {
                    setAddTypeModalOpen(false);
                    setTypeForm({ code: '', name: '', description: '', is_active: true });
                  }} 
                  className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button 
                  onClick={handleAddType} 
                  className="px-8 py-3 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors active:scale-95"
                >
                  {t.common.submit}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
