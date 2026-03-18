import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getProjectById } from '../api/projects';
import { getColumns, createColumn, updateColumn, reorderColumns, deleteColumn } from '../api/columns';
import { createCard, moveCard, reorderCards, deleteCard } from '../api/cards';
import { getMembers } from '../api/members';
import MembersModal from '../components/MembersModal';
import CardDetail from '../components/CardDetail';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import { useAuth } from '../hooks/useAuth';
import { formatDate, getDueDateStatus, getDueDateColor } from '../utils/dates';
import NotificationBell from '../components/NotificationBell';

// ─── ColumnForm ───────────────────────────────────────────────────────────────

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
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          placeholder="Nombre de la columna"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition px-4 py-2 rounded-lg hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          placeholder="Título de la tarjeta"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Descripción</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none"
          placeholder="Descripción opcional..."
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition px-4 py-2 rounded-lg hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addColOpen, setAddColOpen] = useState(false);
  const [editCol, setEditCol] = useState(null);
  const [addCardColId, setAddCardColId] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null); // { card, columnId }

  // ── Load ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([getProjectById(projectId), getColumns(projectId), getMembers(projectId)])
      .then(([proj, cols, mems]) => {
        setProject(proj);
        setColumns(cols);
        setMembers(mems);
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [projectId, navigate]);

  const closeAdd  = useCallback(() => setAddColOpen(false), []);
  const closeEdit = useCallback(() => setEditCol(null), []);
  const closeCard = useCallback(() => setAddCardColId(null), []);

  // ── Drag & Drop ────────────────────────────────────────────────────────────

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

  // ── Column actions ─────────────────────────────────────────────────────────

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

  // ── Card actions ───────────────────────────────────────────────────────────

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

  function handleCardClick(card, columnId) {
    setSelectedCard({ card, columnId });
  }

  function handleCardUpdate(updatedCard) {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === selectedCard?.columnId
          ? { ...col, cards: col.cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)) }
          : col
      )
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Cargando tablero...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-10 bg-white border-b border-gray-200">
        <div className="px-5 h-14 flex items-center gap-3">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-800 transition"
          >
            Mis proyectos
          </button>
          <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-semibold text-gray-900 truncate flex-1">
            {project?.name}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            <button
              onClick={() => setMembersOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 border border-gray-200
                px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Miembros
            </button>
            <button
              onClick={() => setAddColOpen(true)}
              className="inline-flex items-center gap-1.5 bg-violet-600 text-white text-sm font-medium
                px-3 py-1.5 rounded-lg hover:bg-violet-700 transition"
            >
              <span className="text-base leading-none">+</span>
              Columna
            </button>
          </div>
        </div>
      </header>

      {/* ── Board ────────────────────────────────────────────────────────── */}
      <div className="pt-14 flex-1 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" type="COLUMN" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-3 p-5 min-h-[calc(100vh-3.5rem)] items-start"
              >
                {columns.map((col, colIndex) => (
                  <Draggable key={col.id} draggableId={col.id} index={colIndex}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`w-[280px] shrink-0 bg-white rounded-xl border flex flex-col
                          max-h-[calc(100vh-5rem)] transition-shadow
                          ${snapshot.isDragging
                            ? 'border-violet-300 shadow-lg'
                            : 'border-gray-200 shadow-sm'
                          }`}
                      >
                        {/* Column header */}
                        <div
                          {...provided.dragHandleProps}
                          className="px-3 pt-3 pb-2.5 flex items-center justify-between cursor-grab active:cursor-grabbing group/col"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-gray-900 truncate text-sm">
                              {col.name}
                            </span>
                            <span className="text-xs text-gray-500 font-medium bg-gray-100 rounded-full px-1.5 py-0.5 shrink-0">
                              {col.cards.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0 ml-2 opacity-0 group-hover/col:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditCol({ id: col.id, name: col.name })}
                              className="text-gray-400 hover:text-gray-700 transition p-1.5 rounded-lg hover:bg-gray-100"
                              title="Editar columna"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteColumn(col.id)}
                              className="text-gray-400 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-gray-100"
                              title="Eliminar columna"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12" />
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
                              className={`flex-1 overflow-y-auto px-2 flex flex-col gap-2 min-h-[2rem]
                                rounded-lg transition-colors
                                ${snapshot.isDraggingOver ? 'bg-violet-50' : ''}`}
                            >
                              {col.cards.map((card, cardIndex) => (
                                <Draggable key={card.id} draggableId={card.id} index={cardIndex}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      onClick={() => handleCardClick(card, col.id)}
                                      className={`bg-white border rounded-lg p-3 cursor-pointer
                                        group transition-shadow
                                        ${snapshot.isDragging
                                          ? 'border-violet-300 shadow-md'
                                          : 'border-gray-200 shadow-sm hover:shadow-md hover:border-violet-200'
                                        }`}
                                    >
                                      {/* Label chips */}
                                      {card.labels?.length > 0 && (
                                        <div className="flex gap-1 mb-2 flex-wrap">
                                          {card.labels.slice(0, 3).map((label) => (
                                            <span
                                              key={label.id}
                                              className="block h-2 rounded-sm flex-1 min-w-[1.5rem] max-w-[3rem]"
                                              style={{ backgroundColor: label.color }}
                                              title={label.name}
                                            />
                                          ))}
                                          {card.labels.length > 3 && (
                                            <span className="text-xs text-gray-400 font-medium self-center">
                                              +{card.labels.length - 3}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      <div className="flex items-start justify-between gap-2">
                                        <span className="text-sm font-medium text-gray-900 leading-snug">
                                          {card.title}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCard(col.id, card.id);
                                          }}
                                          className="shrink-0 text-gray-300 hover:text-red-500 transition
                                            opacity-0 group-hover:opacity-100 p-0.5 rounded"
                                          title="Eliminar tarjeta"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                      {card.description && (
                                        <p className="mt-1.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                          {card.description}
                                        </p>
                                      )}
                                      {/* Due date + assignee */}
                                      {(card.dueDate || card.assignedTo) && (
                                        <div className="mt-2 flex items-center justify-between gap-2">
                                          {card.dueDate ? (() => {
                                            const status = getDueDateStatus(card.dueDate);
                                            const color  = getDueDateColor(status);
                                            return (
                                              <div className={`flex items-center gap-1 ${color}`}>
                                                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-xs font-medium">{formatDate(card.dueDate)}</span>
                                              </div>
                                            );
                                          })() : <span />}
                                          {card.assignedTo && (
                                            <div className="relative group/avatar shrink-0">
                                              <Avatar name={card.assignedTo.name} size="sm" />
                                              <div className="absolute bottom-full right-0 mb-1.5 px-2 py-1 bg-gray-900 text-white text-xs
                                                rounded-md whitespace-nowrap pointer-events-none opacity-0 group-hover/avatar:opacity-100
                                                transition-opacity z-10">
                                                {card.assignedTo.name}
                                              </div>
                                            </div>
                                          )}
                                        </div>
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
                          className="mx-2 mb-2 mt-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50
                            rounded-lg py-1.5 transition text-left px-2.5"
                        >
                          + Tarjeta
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}

                {provided.placeholder}

                {columns.length === 0 && (
                  <div className="flex items-center justify-center w-full py-20">
                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-1">Sin columnas aún.</p>
                      <p className="text-gray-400 text-sm">
                        Usa el botón <span className="font-medium text-gray-500">"+ Columna"</span> para empezar.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Modals */}
      <Modal open={addColOpen} onClose={closeAdd} title="Nueva columna">
        <ColumnForm submitLabel="Crear columna" onSubmit={handleAddColumn} onClose={closeAdd} />
      </Modal>

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

      <Modal open={!!addCardColId} onClose={closeCard} title="Nueva tarjeta">
        {addCardColId && (
          <CardForm
            key={addCardColId}
            onSubmit={(title, desc) => handleAddCard(addCardColId, title, desc)}
            onClose={closeCard}
          />
        )}
      </Modal>

      {membersOpen && project && user && (
        <MembersModal
          projectId={projectId}
          currentUser={user}
          projectOwner={project.owner}
          onClose={() => setMembersOpen(false)}
        />
      )}

      {selectedCard && (
        <CardDetail
          key={selectedCard.card.id}
          card={selectedCard.card}
          projectId={projectId}
          columnId={selectedCard.columnId}
          members={members}
          onClose={() => setSelectedCard(null)}
          onUpdate={handleCardUpdate}
        />
      )}
    </div>
  );
}
