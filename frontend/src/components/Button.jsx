const VARIANTS = {
  primary: 'bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600',
  outline: 'border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700',
  danger:  'bg-red-500 text-white hover:bg-red-600',
  ghost:   'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
};

const SIZES = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      disabled={loading || disabled}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition
        ${VARIANTS[variant]} ${SIZES[size]}
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}`}
      {...props}
    >
      {loading ? 'Cargando...' : children}
    </button>
  );
}
