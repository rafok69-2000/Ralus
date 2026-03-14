import api from './axios';

export const getProjects = () => api.get('/projects').then((r) => r.data.projects);

export const createProject = (name, description) =>
  api.post('/projects', { name, description }).then((r) => r.data);

export const getProjectById = (id) => api.get(`/projects/${id}`).then((r) => r.data.project);

export const deleteProject = (id) => api.delete(`/projects/${id}`);
