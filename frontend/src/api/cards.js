import api from './axios';

const base = (projectId, columnId) =>
  `/projects/${projectId}/columns/${columnId}/cards`;

export const createCard = (projectId, columnId, title, description) =>
  api.post(base(projectId, columnId), { title, description }).then((r) => r.data.card);

export const updateCard = (projectId, columnId, cardId, data) =>
  api.put(`${base(projectId, columnId)}/${cardId}`, data).then((r) => r.data.card);

export const moveCard = (projectId, columnId, cardId, targetColumnId, position) =>
  api.put(`${base(projectId, columnId)}/${cardId}/move`, { targetColumnId, position });

export const reorderCards = (projectId, columnId, cards) =>
  api.put(`${base(projectId, columnId)}/reorder`, { cards });

export const deleteCard = (projectId, columnId, cardId) =>
  api.delete(`${base(projectId, columnId)}/${cardId}`);
