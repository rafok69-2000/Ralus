import api from './axios';

const base = (projectId, columnId, cardId) =>
  `/projects/${projectId}/columns/${columnId}/cards/${cardId}/comments`;

export const getComments = (projectId, columnId, cardId) =>
  api.get(base(projectId, columnId, cardId)).then((r) => r.data.comments);

export const createComment = (projectId, columnId, cardId, content) =>
  api.post(base(projectId, columnId, cardId), { content }).then((r) => r.data.comment);

export const updateComment = (projectId, columnId, cardId, commentId, content) =>
  api.put(`${base(projectId, columnId, cardId)}/${commentId}`, { content }).then((r) => r.data.comment);

export const deleteComment = (projectId, columnId, cardId, commentId) =>
  api.delete(`${base(projectId, columnId, cardId)}/${commentId}`);
