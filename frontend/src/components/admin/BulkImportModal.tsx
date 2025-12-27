"use client";

import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<any>;
  templateUrl: string;
  title: string;
  description?: string;
}

export default function BulkImportModal({
  open,
  onClose,
  onImport,
  templateUrl,
  title,
  description
}: BulkImportModalProps) {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; errors?: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 检查文件类型
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert(t.admin.bulkImport.invalidFileType);
      return;
    }

    setFile(selectedFile);
    setPreviewFileName(selectedFile.name);
    setImportResult(null);
  };

  const handleDownloadTemplate = () => {
    window.open(templateUrl, '_blank');
  };

  const handleImport = async () => {
    if (!file) {
      alert(t.admin.bulkImport.pleaseSelectFile);
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const result = await onImport(file);
      setImportResult({
        success: true,
        message: result.message || t.admin.bulkImport.importSuccess
      });
      // 清空文件选择
      setFile(null);
      setPreviewFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Import error:', error);
      
      // 处理错误信息
      let errorMessage = t.admin.bulkImport.importError;
      let errors: string[] = [];

      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (detail.message) {
          errorMessage = detail.message;
          if (detail.errors && Array.isArray(detail.errors)) {
            errors = detail.errors;
          }
        } else if (Array.isArray(detail)) {
          errors = detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setImportResult({
        success: false,
        message: errorMessage,
        errors: errors.length > 0 ? errors : undefined
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewFileName('');
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!open) return null;

  const buttonStyle = "px-6 py-3 text-sm font-bold rounded-full transition-colors active:scale-95";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900">{title}</h2>
            {description && (
              <p className="text-sm text-slate-500 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 下载模板 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              {t.admin.bulkImport.downloadTemplate}
            </label>
            <button
              onClick={handleDownloadTemplate}
              className={`${buttonStyle} text-blue-600 bg-blue-50 hover:bg-blue-100 flex items-center gap-2`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              {t.admin.bulkImport.downloadTemplate}
            </button>
          </div>

          {/* 上传文件 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
              {t.admin.bulkImport.selectFile}
            </label>
            <div
              className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewFileName ? (
                <div className="space-y-2">
                  <svg className="w-12 h-12 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p className="text-sm font-medium text-slate-900">{previewFileName}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreviewFileName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {t.common.reset}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <svg className="w-12 h-12 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                  </svg>
                  <p className="text-sm text-slate-600">{t.admin.bulkImport.dragDrop}</p>
                  <p className="text-xs text-slate-400">{t.admin.bulkImport.supportedFormats}</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* 导入结果 */}
          {importResult && (
            <div className={`rounded-2xl p-4 ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-3">
                {importResult.success ? (
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                )}
                <div className="flex-1">
                  <p className={`text-sm font-bold ${importResult.success ? 'text-green-900' : 'text-red-900'}`}>
                    {importResult.message}
                  </p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {importResult.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-700">{error}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className={`${buttonStyle} text-slate-500 hover:bg-slate-100`}
              disabled={importing}
            >
              {importResult?.success ? t.common.close : t.common.cancel}
            </button>
            {!importResult?.success && (
              <button
                type="button"
                onClick={handleImport}
                disabled={!file || importing}
                className={`${buttonStyle} text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {importing ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t.admin.bulkImport.importing}
                  </>
                ) : (
                  t.admin.bulkImport.import
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

