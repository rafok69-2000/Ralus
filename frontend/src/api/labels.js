import api from './axios';

const base = (projectId) => `/projects/${projectId}/labels`;

export const getLabels = (projectId) =>
  api.get(base(projectId)).then((r) => r.data.labels);

export const createLabel = (projectId, name, color) =>
  api.post(base(projectId), { name, color }).then((r) => r.data.label);

export const deleteLabel = (projectId, labelId) =>
  api.delete(`${base(projectId)}/${labelId}`);

export const addLabelToCard = (projectId, _columnId, cardId, labelId) =>
  api.post(`${base(projectId)}/cards/${cardId}/labels`, { labelId }).then((r) => r.data.card);

export const removeLabelFromCard = (projectId, _columnId, cardId, labelId) =>
  api.delete(`${base(projectId)}/cards/${cardId}/labels/${labelId}`).then((r) => r.data.card);
