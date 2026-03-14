import { useState, useEffect } from 'react';
import { getMembers, inviteMember, removeMember } from '../api/members';

// Deterministic color based on userId so it stays consistent across renders
const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
];

function avatarColor(id = '') {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const ROLE_BADGE = {
  ADMIN: 'bg-blue-100 text-blue-700',
  MEMBER: 'bg-gray-100 text-gray-600',
};

export default function MembersModal({ projectId, currentUser, projectOwner, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const isAdmin =
    currentUser.id === projectOwner.id ||
    members.some((m) => m.user.id === currentUser.id && m.role === 'ADMIN');

  useEffect(() => {
    getMembers(projectId)
      .then(setMembers)
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleInvite(e) {
    e.preventDefault();
    setInviteError('');
    setInviting(true);
    try {
      const data = await inviteMember(projectId, email.trim(), role);
      // Backend returns { message, member: { id, email, name, role } }
      // Wrap into the shape getMembers returns: { user: { id, name, email }, role }
      setMembers((prev) => [
        ...prev,
        { user: { id: data.member.id, name: data.member.name, email: data.member.email }, role: data.member.role },
      ]);
      setEmail('');
      setRole('MEMBER');
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Ocurrió un error, intenta de nuevo');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(userId) {
    if (!window.confirm('¿Remover a este miembro del proyecto?')) return;
    try {
      await removeMember(projectId, userId);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo remover al miembro');
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Miembros del proyecto</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Members list */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <p className="text-sm text-gray-500">Cargando miembros...</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {members.map((m) => {
                const isOwner = m.user.id === projectOwner.id;
                const isSelf = m.user.id === currentUser.id;
                const canRemove = isAdmin && !isOwner && !isSelf;

                return (
                  <li key={m.user.id} className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full ${avatarColor(m.user.id)} flex items-center justify-center shrink-0`}
                    >
                      <span className="text-white text-sm font-semibold">
                        {m.user.name?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {m.user.name}
                          {isOwner && (
                            <span className="ml-1 text-xs text-gray-400">(dueño)</span>
                          )}
                          {isSelf && !isOwner && (
                            <span className="ml-1 text-xs text-gray-400">(tú)</span>
                          )}
                        </span>
                        <span
                          className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full ${ROLE_BADGE[m.role] ?? ROLE_BADGE.MEMBER}`}
                        >
                          {m.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{m.user.email}</p>
                    </div>

                    {/* Remove */}
                    {canRemove && (
                      <button
                        onClick={() => handleRemove(m.user.id)}
                        className="shrink-0 text-gray-300 hover:text-red-500 transition"
                        title="Remover miembro"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Invite form — only for admins/owner */}
        {isAdmin && (
          <form
            onSubmit={handleInvite}
            className="px-6 py-4 border-t border-gray-100 flex flex-col gap-3"
          >
            <p className="text-sm font-medium text-gray-700">Invitar miembro</p>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setInviteError(''); }}
                placeholder="email@ejemplo.com"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-white"
              >
                <option value="MEMBER">MEMBER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}
            <button
              type="submit"
              disabled={inviting}
              className="bg-gray-900 text-white text-sm font-medium py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inviting ? 'Invitando...' : 'Invitar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
