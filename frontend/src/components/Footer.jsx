export default function Footer() {
  return (
    <footer className="w-full py-4 text-center">
      <p className="text-xs text-gray-400 dark:text-gray-600">
        © {new Date().getFullYear()} Ralus — Todos los derechos reservados
      </p>
    </footer>
  )
}
