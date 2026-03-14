import api from './axios';

const base = (projectId) => `/projects/${projectId}/members`;

export const getMembers = (projectId) =>
  api.get(base(projectId)).then((r) => r.data.members);

export const inviteMember = (projectId, email, role) =>
  api.post(base(projectId), { email, role }).then((r) => r.data);

export const removeMember = (projectId, memberId) =>
  api.delete(`${base(projectId)}/${memberId}`);
