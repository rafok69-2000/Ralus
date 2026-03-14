import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getProjectById } from '../api/projects';
import { getColumns, createColumn, updateColumn, reorderColumns, deleteColumn } from '../api/columns';
import { createCard, moveCard, reorderCards, deleteCard } from '../api/cards';
import MembersModal from '../components/MembersModal';
import { useAuth } from '../hooks/useAuth';

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ─── ColumnForm — shared form used by add/edit column modals ──────────────────

function ColumnForm({ initialName = '', submitLabel, onSubmit, onClose }) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(name.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          placeholder="Nombre de la columna"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition px-4 py-2 rounded-lg"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─── CardForm ─────────────────────────────────────────────────────────────────

function CardForm({ onSubmit, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(title.trim(), description.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          placeholder="Título de la tarjeta"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition resize-none"
          placeholder="Descripción opcional..."
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition px-4 py-2 rounded-lg"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando...' : 'Crear tarjeta'}
        </button>
      </div>
    </form>
  );
}

// ─── BoardPage ────────────────────────────────────────────────────────────────

export default function BoardPage() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [addColOpen, setAddColOpen] = useState(false);
  const [editCol, setEditCol] = useState(null);   // { id, name }
  const [addCardColId, setAddCardColId] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([getProjectById(projectId), getColumns(projectId)])
      .then(([proj, cols]) => {
        setProject(proj);
        setColumns(cols);
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [projectId, navigate]);

  // ── Close modals helper ───────────────────────────────────────────────────

  const closeAdd = useCallback(() => setAddColOpen(false), []);
  const closeEdit = useCallback(() => setEditCol(null), []);
  const closeCard = useCallback(() => setAddCardColId(null), []);

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  function onDragEnd(result) {
    const { type, source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    const previousColumns = columns;

    if (type === 'COLUMN') {
      const next = [...columns];
      const [removed] = next.splice(source.index, 1);
      next.splice(destination.index, 0, removed);
      setColumns(next);

      reorderColumns(projectId, next.map((col, i) => ({ id: col.id, position: i + 1 })))
        .catch(() => setColumns(previousColumns));
    }

    if (type === 'CARD') {
      const next = columns.map((c) => ({ ...c, cards: [...c.cards] }));
      const srcIdx = next.findIndex((c) => c.id === source.droppableId);
      const dstIdx = next.findIndex((c) => c.id === destination.droppableId);
      const [movedCard] = next[srcIdx].cards.splice(source.index, 1);
      next[dstIdx].cards.splice(destination.index, 0, movedCard);
      setColumns(next);

      if (source.droppableId === destination.droppableId) {
        reorderCards(
          projectId,
          source.droppableId,
          next[dstIdx].cards.map((c, i) => ({ id: c.id, position: i + 1 }))
        ).catch(() => setColumns(previousColumns));
      } else {
        moveCard(
          projectId,
          source.droppableId,
          movedCard.id,
          destination.droppableId,
          destination.index + 1
        ).catch(() => setColumns(previousColumns));
      }
    }
  }

  // ── Column actions ────────────────────────────────────────────────────────

  async function handleAddColumn(name) {
    const column = await createColumn(projectId, name);
    setColumns((prev) => [...prev, { ...column, cards: [] }]);
    setAddColOpen(false);
  }

  async function handleEditColumn(name) {
    const updated = await updateColumn(projectId, editCol.id, name);
    setColumns((prev) =>
      prev.map((c) => (c.id === editCol.id ? { ...c, name: updated.name } : c))
    );
    setEditCol(null);
  }

  async function handleDeleteColumn(colId) {
    if (!window.confirm('¿Eliminar esta columna y todas sus tarjetas?')) return;
    await deleteColumn(projectId, colId);
    setColumns((prev) => prev.filter((c) => c.id !== colId));
  }

  // ── Card actions ──────────────────────────────────────────────────────────

  async function handleAddCard(columnId, title, description) {
    const card = await createCard(projectId, columnId, title, description || undefined);
    setColumns((prev) =>
      prev.map((c) =>
        c.id === columnId ? { ...c, cards: [...c.cards, card] } : c
      )
    );
    setAddCardColId(null);
  }

  async function handleDeleteCard(columnId, cardId) {
    if (!window.confirm('¿Eliminar esta tarjeta?')) return;
    await deleteCard(projectId, columnId, cardId);
    setColumns((prev) =>
      prev.map((c) =>
        c.id === columnId
          ? { ...c, cards: c.cards.filter((card) => card.id !== cardId) }
          : c
      )
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 text-sm">Cargando tablero...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-10 bg-white shadow-sm">
        <div className="px-4 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            ← Volver
          </button>
          <h1 className="flex-1 text-center font-semibold text-gray-900 truncate">
            {project?.name}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMembersOpen(true)}
              className="text-sm font-medium text-gray-700 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              👥 Miembros
            </button>
            <button
              onClick={() => setAddColOpen(true)}
              className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              + Columna
            </button>
          </div>
        </div>
      </header>

      {/* Board */}
      <div className="pt-14 flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" type="COLUMN" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-4 p-4 min-h-[calc(100vh-3.5rem)] items-start"
              >
                {columns.map((col, colIndex) => (
                  <Draggable key={col.id} draggableId={col.id} index={colIndex}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`w-[280px] shrink-0 bg-white rounded-xl shadow-sm flex flex-col max-h-[calc(100vh-5.5rem)] ${
                          snapshot.isDragging ? 'shadow-lg ring-2 ring-gray-200' : ''
                        }`}
                      >
                        {/* Column header — drag handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="px-3 pt-3 pb-2 flex items-center justify-between cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-gray-900 truncate text-sm">
                              {col.name}
                            </span>
                            <span className="text-xs text-gray-400 font-medium bg-gray-100 rounded-full px-1.5 py-0.5 shrink-0">
                              {col.cards.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              onClick={() => setEditCol({ id: col.id, name: col.name })}
                              className="text-gray-400 hover:text-gray-700 transition p-1 rounded"
                              title="Editar columna"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteColumn(col.id)}
                              className="text-gray-400 hover:text-red-500 transition p-1 rounded"
                              title="Eliminar columna"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Cards droppable */}
                        <Droppable droppableId={col.id} type="CARD">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`flex-1 overflow-y-auto px-2 flex flex-col gap-2 transition-colors min-h-[2rem] ${
                                snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''
                              }`}
                            >
                              {col.cards.map((card, cardIndex) => (
                                <Draggable key={card.id} draggableId={card.id} index={cardIndex}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`bg-white border border-gray-100 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing group ${
                                        snapshot.isDragging ? 'shadow-md ring-2 ring-blue-200' : 'hover:shadow-md hover:border-gray-200'
                                      } transition-shadow`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <span className="text-sm font-medium text-gray-900 leading-snug">
                                          {card.title}
                                        </span>
                                        <button
                                          onClick={() => handleDeleteCard(col.id, card.id)}
                                          className="shrink-0 text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                          title="Eliminar tarjeta"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                      {card.description && (
                                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                                          {card.description}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        {/* Add card button */}
                        <button
                          onClick={() => setAddCardColId(col.id)}
                          className="mx-2 mb-2 mt-1 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg py-1.5 transition text-left px-2"
                        >
                          + Tarjeta
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}

                {/* Empty state */}
                {columns.length === 0 && (
                  <div className="flex items-center justify-center w-full py-20">
                    <p className="text-gray-400 text-sm">
                      No hay columnas. Crea una con el botón "+ Columna".
                    </p>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Add column modal */}
      <Modal open={addColOpen} onClose={closeAdd} title="Nueva columna">
        <ColumnForm submitLabel="Crear columna" onSubmit={handleAddColumn} onClose={closeAdd} />
      </Modal>

      {/* Edit column modal */}
      <Modal open={!!editCol} onClose={closeEdit} title="Editar columna">
        {editCol && (
          <ColumnForm
            key={editCol.id}
            initialName={editCol.name}
            submitLabel="Guardar cambios"
            onSubmit={handleEditColumn}
            onClose={closeEdit}
          />
        )}
      </Modal>

      {/* Add card modal */}
      <Modal open={!!addCardColId} onClose={closeCard} title="Nueva tarjeta">
        {addCardColId && (
          <CardForm
            key={addCardColId}
            onSubmit={(title, desc) => handleAddCard(addCardColId, title, desc)}
            onClose={closeCard}
          />
        )}
      </Modal>

      {/* Members modal */}
      {membersOpen && project && user && (
        <MembersModal
          projectId={projectId}
          currentUser={user}
          projectOwner={project.owner}
          onClose={() => setMembersOpen(false)}
        />
      )}
    </div>
  );
}
