import { useEffect, useState } from 'react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  danger = true,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isOpen) { setVisible(false); return; }
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handler(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center px-4
        bg-black/50 dark:bg-black/70 backdrop-blur-sm
        transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700
          rounded-xl shadow-xl p-6
          transition-all duration-150 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-600 dark:text-gray-400
              hover:text-gray-900 dark:hover:text-gray-100 transition
              px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600
              hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`text-sm font-medium text-white px-4 py-2 rounded-lg transition
              ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-violet-600 hover:bg-violet-700'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
