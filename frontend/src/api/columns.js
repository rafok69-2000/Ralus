import api from './axios';

const base = (projectId) => `/projects/${projectId}/columns`;

export const getColumns = (projectId) =>
  api.get(base(projectId)).then((r) => r.data.columns);

export const createColumn = (projectId, name) =>
  api.post(base(projectId), { name }).then((r) => r.data.column);

export const updateColumn = (projectId, columnId, name) =>
  api.put(`${base(projectId)}/${columnId}`, { name }).then((r) => r.data.column);

export const reorderColumns = (projectId, columns) =>
  api.put(`${base(projectId)}/reorder`, { columns });

export const deleteColumn = (projectId, columnId) =>
  api.delete(`${base(projectId)}/${columnId}`);
