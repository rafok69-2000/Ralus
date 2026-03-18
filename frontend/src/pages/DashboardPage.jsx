import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getProjects, createProject, deleteProject } from '../api/projects';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .finally(() => setLoadingProjects(false));
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function openModal() {
    setName('');
    setDescription('');
    setCreateError('');
    setModalOpen(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const project = await createProject(name, description);
      setProjects((prev) => [project, ...prev]);
      setModalOpen(false);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Ocurrió un error, intenta de nuevo');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!window.confirm('¿Seguro que quieres eliminar este proyecto?')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo eliminar el proyecto');
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-60 shrink-0 bg-white border-r border-gray-200 fixed left-0 top-0 bottom-0 flex flex-col z-10">
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-gray-100">
          <div className="flex items-center justify-center w-8 h-8 bg-violet-600 rounded-lg shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <span className="text-base font-bold text-gray-900">Ralus</span>
        </div>

        {/* Projects nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
            Mis proyectos
          </p>
          {loadingProjects ? (
            <p className="text-xs text-gray-400 px-2">Cargando...</p>
          ) : projects.length === 0 ? (
            <p className="text-xs text-gray-400 px-2">Sin proyectos aún.</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {projects.map((project) => (
                <li key={project.id}>
                  <button
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition truncate"
                  >
                    {project.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bottom actions */}
        <div className="px-3 py-3 border-t border-gray-100 flex flex-col gap-2">
          <button
            onClick={openModal}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-violet-600 hover:bg-violet-50 transition"
          >
            <span className="text-base leading-none">+</span>
            <span>Nuevo proyecto</span>
          </button>

          {/* User */}
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <Avatar name={user?.name ?? ''} size="sm" />
            <span className="flex-1 text-sm text-gray-700 truncate">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="shrink-0 text-gray-400 hover:text-gray-700 transition"
              title="Cerrar sesión"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="ml-60 flex-1 px-8 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Mis proyectos</h2>
            {!loadingProjects && (
              <p className="text-sm text-gray-500 mt-0.5">
                {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
              </p>
            )}
          </div>
          <button
            onClick={openModal}
            className="bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-violet-700 transition"
          >
            + Nuevo proyecto
          </button>
        </div>

        {/* Grid */}
        {loadingProjects ? (
          <p className="text-gray-500 text-sm">Cargando proyectos...</p>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-900 font-medium mb-1">Sin proyectos aún</p>
            <p className="text-gray-500 text-sm mb-5">Crea tu primer proyecto para empezar.</p>
            <button
              onClick={openModal}
              className="bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-violet-700 transition"
            >
              + Nuevo proyecto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer
                  hover:shadow-md hover:border-violet-200 transition group overflow-hidden"
              >
                {/* Color bar */}
                <div className="h-1 bg-violet-600" />

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 truncate leading-snug">
                      {project.name}
                    </h3>
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      className="shrink-0 text-gray-300 hover:text-red-500 transition
                        opacity-0 group-hover:opacity-100 p-0.5 rounded"
                      title="Eliminar proyecto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Description */}
                  {project.description ? (
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-300 italic">Sin descripción</p>
                  )}

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{formatDate(project.createdAt)}</span>
                    {(project.memberCount ?? project._count?.members) != null && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {project.memberCount ?? project._count?.members}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal nuevo proyecto ──────────────────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo proyecto">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="proj-name" className="text-sm font-medium text-gray-700">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="proj-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              placeholder="Mi proyecto"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="proj-desc" className="text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              id="proj-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition resize-none"
              placeholder="Descripción opcional..."
            />
          </div>

          {createError && (
            <p className="text-sm text-red-500">{createError}</p>
          )}

          <div className="flex gap-3 justify-end mt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              className="bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creando...' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
