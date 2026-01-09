"use client";

import { useState, useCallback } from 'react';
import Toast, { ToastType } from '@/components/common/Toast';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastConfig & { id: number }>>([]);

  const showToast = useCallback((config: ToastConfig) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...config, id }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'success', duration });
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'error', duration });
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'info', duration });
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'warning', duration });
  }, [showToast]);

  const ToastContainer = useCallback(() => (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  ), [toasts, removeToast]);

  return {
    success,
    error,
    info,
    warning,
    ToastContainer,
  };
}

