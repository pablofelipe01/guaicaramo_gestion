"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">G</span>
                </div>
                <span className="text-xl font-bold text-black dark:text-white hidden sm:inline-block">
                  Guaicaramo
                </span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="#features"
                className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-orange-400 transition-colors"
              >
                Características
              </Link>
              <Link
                href="#about"
                className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-orange-400 transition-colors"
              >
                Acerca de
              </Link>
              <Link
                href="#contact"
                className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-orange-400 transition-colors"
              >
                Contacto
              </Link>
              <Link href="/auth" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors font-medium">
                Iniciar Sesión
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-orange-400 transition-colors"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="md:hidden pb-4">
              <div className="flex flex-col gap-4">
                <Link
                  href="#features"
                  className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-orange-400 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Características
                </Link>
                <Link
                  href="#about"
                  className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-orange-400 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Acerca de
                </Link>
                <Link
                  href="#contact"
                  className="text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-orange-400 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Contacto
                </Link>
                <Link href="/auth" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors w-full font-medium text-center">
                  Iniciar Sesión
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="flex flex-col justify-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black dark:text-white mb-6 leading-tight">
                Bienvenido a <span className="text-emerald-600 dark:text-orange-400">Guaicaramo</span>
              </h1>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                Diseña, gestiona y optimiza tus proyectos con nuestra plataforma moderna y profesional.
                Experiencia de usuario excepcional con tecnología de vanguardia.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-center">
                  Iniciar Sesión
                </Link>
                <Link href="/auth" className="bg-gray-200 dark:bg-zinc-800 text-black dark:text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors text-center">
                  Crear Cuenta
                </Link>
              </div>
            </div>

            {/* Right Content - Placeholder */}
            <div className="flex items-center justify-center">
              <div className="w-full aspect-square bg-gradient-to-br from-orange-50 to-orange-100 dark:from-emerald-900 dark:to-emerald-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🚀</div>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold">
                    Tu contenido aquí
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-gray-50 dark:bg-zinc-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
                Características Principales
              </h2>
              <p className="text-gray-700 dark:text-gray-400 max-w-2xl mx-auto">
                Todo lo que necesitas para llevar tu proyecto al siguiente nivel
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: "⚡",
                  title: "Rápido",
                  description: "Rendimiento optimizado para la mejor experiencia",
                },
                {
                  icon: "🛡️",
                  title: "Seguro",
                  description: "Protección de datos con los estándares más altos",
                },
                {
                  icon: "📱",
                  title: "Responsivo",
                  description: "Funciona perfectamente en cualquier dispositivo",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow border-t-4 border-emerald-600"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900 dark:bg-black border-t border-zinc-800 text-gray-300 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">G</span>
                </div>
                <span className="text-xl font-bold text-white">Guaicaramo</span>
              </div>
              <p className="text-sm text-gray-400">
                Soluciones profesionales para tu proyecto
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-orange-400 transition-colors">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-orange-400 transition-colors">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-orange-400 transition-colors">
                    Documentación
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-orange-400 transition-colors">
                    Acerca de
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-orange-400 transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-orange-400 transition-colors">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-orange-400 transition-colors">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-orange-400 transition-colors">
                    Términos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-orange-400 transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              &copy; 2026 Guaicaramo. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <Link href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                Twitter
              </Link>
              <Link href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                LinkedIn
              </Link>
              <Link href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
