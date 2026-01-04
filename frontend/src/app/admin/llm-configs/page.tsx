'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Modal from '@/components/common/Modal';
import { llmConfigService, LLMConfig, LLMConfigCreate, LLMConfigUpdate } from '@/services/llmConfig.service';

export default function LLMConfigsPage() {
  const { t } = useLanguage();
  const [configs, setConfigs] = useState<LLMConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LLMConfig | null>(null);
  const [formData, setFormData] = useState<LLMConfigCreate>({
    provider_name: '',
    provider_key: '',
    api_key: '',
    api_secret: '',
    endpoint_url: '',
    model_name: '',
    config_json: '',
    is_active: true,
  });

  // Test功能相关状态
  const [showTestModal, setShowTestModal] = useState(false);
  const [testingConfig, setTestingConfig] = useState<LLMConfig | null>(null);
  const [testMessage, setTestMessage] = useState('你好，请介绍一下自己');
  const [testResponse, setTestResponse] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await llmConfigService.getAll();
      setConfigs(data);
    } catch (error) {
      console.error('Failed to load LLM configs:', error);
      alert('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingConfig(null);
    setFormData({
      provider_name: '',
      provider_key: '',
      api_key: '',
      api_secret: '',
      endpoint_url: '',
      model_name: '',
      config_json: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (config: LLMConfig) => {
    setEditingConfig(config);
    setFormData({
      provider_name: config.provider_name,
      provider_key: config.provider_key,
      api_key: config.api_key,
      api_secret: config.api_secret || '',
      endpoint_url: config.endpoint_url || '',
      model_name: config.model_name || '',
      config_json: config.config_json || '',
      is_active: config.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingConfig) {
        await llmConfigService.update(editingConfig.id, formData);
        alert(t.admin.llmConfigs.updateSuccess);
      } else {
        await llmConfigService.create(formData);
        alert(t.admin.llmConfigs.createSuccess);
      }
      setShowModal(false);
      loadConfigs();
    } catch (error: any) {
      console.error('Failed to save config:', error);
      alert(error.response?.data?.detail || '保存失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.admin.llmConfigs.confirmDelete)) return;
    try {
      await llmConfigService.delete(id);
      alert(t.admin.llmConfigs.deleteSuccess);
      loadConfigs();
    } catch (error) {
      console.error('Failed to delete config:', error);
      alert('删除失败');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await llmConfigService.toggle(id);
      alert(t.admin.llmConfigs.toggleSuccess);
      loadConfigs();
    } catch (error) {
      console.error('Failed to toggle config:', error);
      alert('切换状态失败');
    }
  };

  const handleTest = (config: LLMConfig) => {
    setTestingConfig(config);
    setTestMessage('你好，请介绍一下自己');
    setTestResponse('');
    setShowTestModal(true);
  };

  const handleSendTest = async () => {
    if (!testingConfig || !testMessage.trim()) {
      alert('请输入测试消息');
      return;
    }

    try {
      setTesting(true);
      setTestResponse('');
      const result = await llmConfigService.test(testingConfig.id, testMessage);
      
      if (result.success) {
        setTestResponse(result.response || '');
      } else {
        setTestResponse(`错误: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Test failed:', error);
      setTestResponse(`测试失败: ${error.response?.data?.detail || error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{t.admin.llmConfigs.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.admin.llmConfigs.subtitle}</p>
        </div>

        {/* Add Button */}
        <div className="mb-4">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.admin.llmConfigs.addConfig}
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.admin.llmConfigs.columns.provider}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.admin.llmConfigs.columns.model}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.admin.llmConfigs.columns.endpoint}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.admin.llmConfigs.columns.status}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {t.admin.llmConfigs.columns.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {configs.map((config) => (
                  <tr key={config.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{config.provider_name}</div>
                      <div className="text-sm text-slate-500">{config.provider_key}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {config.model_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="max-w-xs truncate">{config.endpoint_url || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          config.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {config.is_active ? t.admin.llmConfigs.enabled : t.admin.llmConfigs.disabled}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleToggle(config.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {t.admin.llmConfigs.toggle}
                      </button>
                      <button
                        onClick={() => handleTest(config)}
                        className="text-green-600 hover:text-green-900"
                        disabled={!config.api_key}
                      >
                        {t.admin.llmConfigs.test}
                      </button>
                      <button
                        onClick={() => handleEdit(config)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {t.common.edit}
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t.common.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {configs.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                {t.common.noData}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingConfig ? t.admin.llmConfigs.editConfig : t.admin.llmConfigs.addConfig}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.admin.llmConfigs.providerName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.provider_name}
              onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.admin.llmConfigs.providerKey} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.provider_key}
              onChange={(e) => setFormData({ ...formData, provider_key: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!editingConfig}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.admin.llmConfigs.apiKey} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.admin.llmConfigs.apiSecret}
            </label>
            <input
              type="text"
              value={formData.api_secret}
              onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.admin.llmConfigs.endpointUrl}
            </label>
            <input
              type="text"
              value={formData.endpoint_url}
              onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.admin.llmConfigs.modelName}
            </label>
            <input
              type="text"
              value={formData.model_name}
              onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.admin.llmConfigs.configJson}
            </label>
            <textarea
              value={formData.config_json}
              onChange={(e) => setFormData({ ...formData, config_json: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            />
            <label className="ml-2 block text-sm text-slate-700">
              {t.admin.llmConfigs.isActive}
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t.common.save}
            </button>
          </div>
        </form>
      </Modal>

      {/* Test Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title={`${t.admin.llmConfigs.test} - ${testingConfig?.provider_name}`}
        size="lg"
      >
        <div className="p-6 space-y-4">
          {/* Test Message Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t.admin.llmConfigs.testMessage}
            </label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder={t.admin.llmConfigs.testMessagePlaceholder}
            />
          </div>

          {/* Send Button */}
          <div>
            <button
              onClick={handleSendTest}
              disabled={testing || !testMessage.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t.admin.llmConfigs.testing}</span>
                </>
              ) : (
                t.admin.llmConfigs.sendTest
              )}
            </button>
          </div>

          {/* Response Display */}
          {testResponse && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t.admin.llmConfigs.testResponse}
              </label>
              <div className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 min-h-[100px] max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                {testResponse}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

