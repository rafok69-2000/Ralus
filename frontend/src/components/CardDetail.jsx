import { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import ConfirmModal from './ConfirmModal';
import Button from './Button';
import { updateCard } from '../api/cards';
import { getLabels, createLabel, addLabelToCard, removeLabelFromCard } from '../api/labels';
import { getComments, createComment, updateComment, deleteComment } from '../api/comments';
import { formatDate, getDueDateStatus, getDueDateColor, toUTCDate } from '../utils/dates';
import { useAuth } from '../hooks/useAuth';

const LABEL_PALETTE = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
];

function toInputDate(date) {
  if (!date) return '';
  return new Date(date).toISOString().slice(0, 10);
}

// ─── CommentItem ──────────────────────────────────────────────────────────────

function CommentItem({ comment, currentUserId, onUpdate, onDelete }) {
  const [editing, setEditing]     = useState(false);
  const [content, setContent]     = useState(comment.content);
  const [saving, setSaving]       = useState(false);
  const isOwn = comment.author.id === currentUserId;

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const updated = await onUpdate(comment.id, content.trim());
      setContent(updated.content);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await onDelete(comment.id);
  }

  return (
    <div className="flex gap-3 group/comment">
      <Avatar name={comment.author.name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{comment.author.name}</span>
          <span className="text-xs text-gray-400 shrink-0">{formatDate(comment.createdAt)}</span>
        </div>
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-violet-500 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-700
                focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} loading={saving} disabled={!content.trim()}>
                Guardar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setContent(comment.content); }}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
              {comment.content}
            </p>
            {isOwn && (
              <div className="mt-1 flex gap-3 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-gray-400 hover:text-violet-600 transition font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs text-gray-400 hover:text-red-500 transition font-medium"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CardDetail ───────────────────────────────────────────────────────────────

export default function CardDetail({ card, projectId, columnId, members, onClose, onUpdate }) {
  const { user } = useAuth();

  const [title, setTitle]           = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [assignedTo, setAssignedTo] = useState(card.assignedTo ?? null);
  const [dueDate, setDueDate]       = useState(card.dueDate ?? null);
  const [labels, setLabels]         = useState(card.labels ?? []);
  const [projectLabels, setProjectLabels] = useState([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc]   = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  // New label form
  const [showNewLabel, setShowNewLabel]   = useState(false);
  const [newLabelName, setNewLabelName]   = useState('');
  const [newLabelColor, setNewLabelColor] = useState(LABEL_PALETTE[0]);
  const [creatingLabel, setCreatingLabel] = useState(false);

  const [confirmDeleteComment, setConfirmDeleteComment] = useState({ open: false, id: null });

  // Comments
  const [comments, setComments]         = useState([]);
  const [newComment, setNewComment]     = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    getLabels(projectId).then(setProjectLabels).catch(() => {});
    getComments(projectId, columnId, card.id).then(setComments).catch(() => {});
  }, [projectId, columnId, card.id]);

  const originalDue = card.dueDate ? new Date(card.dueDate).toISOString() : null;
  const currentDue  = dueDate       ? new Date(dueDate).toISOString()       : null;

  const hasChanges =
    title.trim() !== card.title ||
    description.trim() !== (card.description || '') ||
    (assignedTo?.id ?? null) !== (card.assignedTo?.id ?? null) ||
    currentDue !== originalDue;

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateCard(projectId, columnId, card.id, {
        title: title.trim(),
        description: description.trim() || null,
        assignedToId: assignedTo?.id ?? null,
        dueDate: dueDate ?? null,
      });
      onUpdate(updated);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function handleAssign(userId) {
    if (!userId) return;
    const m = members.find((m) => m.user.id === userId);
    if (m) setAssignedTo({ id: m.user.id, name: m.user.name, email: m.user.email });
  }

  function handleDueDateChange(e) {
    setDueDate(e.target.value ? toUTCDate(e.target.value) : null);
  }

  async function handleAddLabel(labelId) {
    if (!labelId || labels.some((l) => l.id === labelId)) return;
    try {
      const updated = await addLabelToCard(projectId, columnId, card.id, labelId);
      setLabels(updated.labels ?? []);
      onUpdate(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agregar etiqueta');
    }
  }

  async function handleRemoveLabel(labelId) {
    try {
      const updated = await removeLabelFromCard(projectId, columnId, card.id, labelId);
      setLabels(updated.labels ?? []);
      onUpdate(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al quitar etiqueta');
    }
  }

  async function handleCreateLabel(e) {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    setCreatingLabel(true);
    try {
      const label = await createLabel(projectId, newLabelName.trim(), newLabelColor);
      setProjectLabels((prev) => [...prev, label].sort((a, b) => a.name.localeCompare(b.name)));
      const updated = await addLabelToCard(projectId, columnId, card.id, label.id);
      setLabels(updated.labels ?? []);
      onUpdate(updated);
      setNewLabelName('');
      setNewLabelColor(LABEL_PALETTE[0]);
      setShowNewLabel(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear etiqueta');
    } finally {
      setCreatingLabel(false);
    }
  }

  async function handleSendComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const comment = await createComment(projectId, columnId, card.id, newComment.trim());
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar comentario');
    } finally {
      setSendingComment(false);
    }
  }

  async function handleUpdateComment(commentId, content) {
    const updated = await updateComment(projectId, columnId, card.id, commentId, content);
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    return updated;
  }

  async function handleDeleteComment(commentId) {
    await deleteComment(projectId, columnId, card.id, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  const createdFormatted = card.createdAt
    ? new Date(card.createdAt).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  const dueDateStatus = dueDate ? getDueDateStatus(dueDate) : null;
  const dueDateColor  = dueDateStatus ? getDueDateColor(dueDateStatus) : '';
  const STATUS_LABEL = { overdue: 'Vencida', soon: 'Vence pronto', ok: 'Con tiempo' };
  const STATUS_BG    = { overdue: 'bg-red-50 border-red-200', soon: 'bg-yellow-50 border-yellow-200', ok: 'bg-green-50 border-green-200' };

  const availableLabels = projectLabels.filter((pl) => !labels.some((l) => l.id === pl.id));

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Detalle de tarjeta</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Título</label>
            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitle(false); }}
                className="mt-1.5 w-full border border-violet-500 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-700
                  text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            ) : (
              <p
                onClick={() => setEditingTitle(true)}
                className="mt-1.5 text-sm font-medium text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg
                  hover:bg-gray-50 dark:hover:bg-gray-700 cursor-text border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition"
              >
                {title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Descripción</label>
            {editingDesc ? (
              <textarea
                autoFocus
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => setEditingDesc(false)}
                className="mt-1.5 w-full border border-violet-500 dark:border-violet-400 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-700
                  text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
            ) : (
              <p
                onClick={() => setEditingDesc(true)}
                className={`mt-1.5 text-sm px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-text
                  border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition min-h-[3rem]
                  ${description ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 italic'}`}
              >
                {description || 'Sin descripción — haz clic para agregar'}
              </p>
            )}
          </div>

          {/* Assignee */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Asignado a</label>
            <div className="mt-2">
              {assignedTo ? (
                <div className="flex items-center gap-2.5 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-700">
                  <Avatar name={assignedTo.name} size="sm" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{assignedTo.name}</span>
                  <button
                    onClick={() => setAssignedTo(null)}
                    className="text-gray-400 hover:text-red-500 transition p-0.5 rounded hover:bg-red-50"
                    title="Desasignar"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <select
                  value=""
                  onChange={(e) => handleAssign(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                >
                  <option value="">Seleccionar miembro...</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fecha límite</label>
            <div className="mt-2">
              {dueDate ? (
                <div className={`flex items-center gap-2.5 px-3 py-2 border rounded-lg ${STATUS_BG[dueDateStatus]}`}>
                  <svg className={`w-4 h-4 shrink-0 ${dueDateColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className={`text-sm font-medium flex-1 ${dueDateColor}`}>{formatDate(dueDate)}</span>
                  <span className={`text-xs font-medium ${dueDateColor}`}>{STATUS_LABEL[dueDateStatus]}</span>
                  <button
                    onClick={() => setDueDate(null)}
                    className="text-gray-400 hover:text-red-500 transition p-0.5 rounded hover:bg-red-50 ml-1"
                    title="Eliminar fecha límite"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <input
                  type="date"
                  value={toInputDate(dueDate)}
                  onChange={handleDueDateChange}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 dark:bg-gray-700
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                />
              )}
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Etiquetas</label>
            <div className="mt-2 flex flex-col gap-2">
              {labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {labels.map((label) => (
                    <span
                      key={label.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                      <button
                        onClick={() => handleRemoveLabel(label.id)}
                        className="opacity-70 hover:opacity-100 transition leading-none ml-0.5"
                        title="Quitar etiqueta"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {availableLabels.length > 0 && (
                <select
                  value=""
                  onChange={(e) => handleAddLabel(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700
                    focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                >
                  <option value="">Agregar etiqueta...</option>
                  {availableLabels.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              )}
              {showNewLabel ? (
                <form onSubmit={handleCreateLabel} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex flex-col gap-3 dark:bg-gray-700/50">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Nombre de la etiqueta"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-700
                      focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    {LABEL_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewLabelColor(c)}
                        className={`w-6 h-6 rounded-full transition ring-offset-1
                          ${newLabelColor === c ? 'ring-2 ring-gray-700' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowNewLabel(false); setNewLabelName(''); }}
                      className="flex-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100
                        border border-gray-200 dark:border-gray-600 rounded-lg py-1.5 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={creatingLabel || !newLabelName.trim()}
                      className="flex-1 bg-violet-600 text-white text-sm font-medium rounded-lg py-1.5
                        hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingLabel ? 'Creando...' : 'Crear'}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowNewLabel(true)}
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium text-left
                    transition flex items-center gap-1"
                >
                  <span className="text-base leading-none">+</span> Nueva etiqueta
                </button>
              )}
            </div>
          </div>

          {/* Meta */}
          {(createdFormatted || card.createdBy) && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 flex-wrap">
              {createdFormatted && <span>Creado el {createdFormatted}</span>}
              {createdFormatted && card.createdBy && <span>·</span>}
              {card.createdBy && <span>por {card.createdBy.name}</span>}
            </div>
          )}

          {/* ── Comments ─────────────────────────────────────────────────── */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-5 flex flex-col gap-4">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Comentarios {comments.length > 0 && `(${comments.length})`}
            </span>

            {comments.length > 0 && (
              <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-1">
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUserId={user?.id}
                    onUpdate={handleUpdateComment}
                    onDelete={(commentId) => setConfirmDeleteComment({ open: true, id: commentId })}
                  />
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}

            {/* New comment form */}
            <form onSubmit={handleSendComment} className="flex flex-col gap-2">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario..."
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 dark:bg-gray-700
                  placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500
                  focus:border-transparent transition resize-none"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  loading={sendingComment}
                  disabled={!newComment.trim()}
                >
                  Comentar
                </Button>
              </div>
            </form>
          </div>
        </div>

        <ConfirmModal
          isOpen={confirmDeleteComment.open}
          onClose={() => setConfirmDeleteComment({ open: false, id: null })}
          onConfirm={() => handleDeleteComment(confirmDeleteComment.id)}
          title="Eliminar comentario"
          message="¿Estás seguro? Esta acción no se puede deshacer."
          confirmText="Sí, eliminar"
        />

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
          {error ? (
            <p className="text-sm text-red-500 flex-1">{error}</p>
          ) : (
            <span />
          )}
          <div className="flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition
                px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges || !title.trim()}
              className="bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-lg
                hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
