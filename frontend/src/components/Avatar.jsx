const COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
];

function getColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(hash) % COLORS.length];
}

const SIZES = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export default function Avatar({ name = '', size = 'md' }) {
  return (
    <div
      className={`${SIZES[size]} ${getColor(name)} rounded-full flex items-center justify-center shrink-0`}
    >
      <span className="text-white font-semibold leading-none">
        {name[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  );
}
