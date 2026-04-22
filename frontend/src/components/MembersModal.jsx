import { useState, useEffect } from 'react';
import { getMembers, inviteMember, removeMember } from '../api/members';
import Avatar from './Avatar';
import ConfirmModal from './ConfirmModal';

const ROLE_BADGE = {
  ADMIN: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400',
  MEMBER: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
};

export default function MembersModal({ projectId, currentUser, projectOwner, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirmRemove, setConfirmRemove] = useState({ open: false, id: null });

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

  async function handleRemoveConfirmed(userId) {
    try {
      await removeMember(projectId, userId);
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo remover al miembro');
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Miembros del proyecto</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 leading-none"
          >
            ✕
          </button>
        </div>

        {/* Members list */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando miembros...</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {members.map((m) => {
                const isOwner = m.user.id === projectOwner.id;
                const isSelf  = m.user.id === currentUser.id;
                const canRemove = isAdmin && !isOwner && !isSelf;

                return (
                  <li key={m.user.id} className="flex items-center gap-3">
                    <Avatar name={m.user.name ?? ''} size="md" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {m.user.name}
                          {isOwner && (
                            <span className="ml-1 text-xs text-gray-400 dark:text-gray-500 font-normal">(dueño)</span>
                          )}
                          {isSelf && !isOwner && (
                            <span className="ml-1 text-xs text-gray-400 dark:text-gray-500 font-normal">(tú)</span>
                          )}
                        </span>
                        <span
                          className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full ${ROLE_BADGE[m.role] ?? ROLE_BADGE.MEMBER}`}
                        >
                          {m.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.user.email}</p>
                    </div>

                    {canRemove && (
                      <button
                        onClick={() => setConfirmRemove({ open: true, id: m.user.id })}
                        className="shrink-0 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Remover miembro"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Invite form */}
        {isAdmin && (
          <form
            onSubmit={handleInvite}
            className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-3"
          >
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Invitar miembro</p>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setInviteError(''); }}
                placeholder="email@ejemplo.com"
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-700
                  placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500
                  focus:border-transparent transition"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              >
                <option value="MEMBER">MEMBER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            {inviteError && <p className="text-xs text-red-500">{inviteError}</p>}
            <button
              type="submit"
              disabled={inviting}
              className="bg-violet-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-violet-700
                transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {inviting ? 'Invitando...' : 'Invitar'}
            </button>
          </form>
        )}
      </div>
      <ConfirmModal
        isOpen={confirmRemove.open}
        onClose={() => setConfirmRemove({ open: false, id: null })}
        onConfirm={() => handleRemoveConfirmed(confirmRemove.id)}
        title="Remover miembro"
        message="¿Remover a este miembro del proyecto?"
        confirmText="Sí, remover"
      />
    </div>
  );
}
