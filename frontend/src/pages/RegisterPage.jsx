import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-violet-600 flex-col items-center justify-center relative overflow-hidden p-12">
        {/* Decorative geometric shapes */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-violet-500 rounded-full opacity-50" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-violet-500 rounded-full opacity-50" />
        <div className="absolute top-1/2 right-12 w-20 h-20 bg-violet-500 rotate-45 opacity-40 rounded-lg" />
        <div className="absolute top-20 left-20 w-10 h-10 bg-violet-400 rotate-12 opacity-60 rounded-md" />
        <div className="absolute bottom-28 right-24 w-14 h-14 bg-violet-400 -rotate-12 opacity-50 rounded-md" />

        {/* Content */}
        <div className="relative z-10 text-center text-white select-none">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-3">Ralus</h1>
          <p className="text-violet-200 text-lg max-w-xs">
            Empieza a organizar tu equipo y tus proyectos hoy.
          </p>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-600 rounded-xl mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">Ralus</span>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Crea tu cuenta</h2>
          <p className="text-gray-500 text-sm mb-8">Regístrate gratis y empieza en segundos.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                placeholder="Tu nombre"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                placeholder="tu@email.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2.5 rounded-lg">
                <span className="shrink-0 font-semibold">✕</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 bg-violet-600 text-white font-medium py-2.5 rounded-lg hover:bg-violet-700
                transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-violet-600 hover:text-violet-700 transition">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
