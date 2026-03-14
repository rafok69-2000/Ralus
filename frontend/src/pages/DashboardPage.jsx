import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getProjects, createProject, deleteProject } from '../api/projects';

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

  function closeModal() {
    setModalOpen(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const project = await createProject(name, description);
      setProjects((prev) => [project, ...prev]);
      closeModal();
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

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-10 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">Ralus</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 pt-20 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Mis proyectos</h2>
          <button
            onClick={openModal}
            className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            + Nuevo proyecto
          </button>
        </div>

        {loadingProjects ? (
          <p className="text-gray-500 text-sm">Cargando proyectos...</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500 text-sm">No tienes proyectos aún, crea uno.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                  <button
                    onClick={(e) => handleDelete(e, project.id)}
                    className="shrink-0 text-gray-400 hover:text-red-500 transition text-lg leading-none"
                    title="Eliminar proyecto"
                  >
                    ×
                  </button>
                </div>
                {project.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.description}</p>
                )}
                <p className="mt-3 text-xs text-gray-400">{formatDate(project.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuevo proyecto</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="proj-name" className="text-sm font-medium text-gray-700">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  id="proj-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  placeholder="Mi proyecto"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="proj-desc" className="text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  id="proj-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition resize-none"
                  placeholder="Descripción opcional..."
                />
              </div>

              {createError && <p className="text-sm text-red-600">{createError}</p>}

              <div className="flex gap-3 justify-end mt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creando...' : 'Crear proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
