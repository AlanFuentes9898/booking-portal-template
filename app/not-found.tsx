import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#dbe6bc]/30 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-7xl font-bold text-[#a8c658] tabular-nums">404</p>
          <h1 className="mt-4 text-2xl sm:text-3xl font-semibold text-[#2a2a2a]">
            No encontramos esa página
          </h1>
          <p className="mt-3 text-[#2a2a2a]/70">
            El enlace puede estar roto o la cita que buscas ya no existe.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-2xl bg-[#a8c658] text-[#2a2a2a] font-medium px-6 py-3 hover:brightness-95 transition"
          >
            Volver al inicio
          </Link>
        </div>
      </body>
    </html>
  );
}
