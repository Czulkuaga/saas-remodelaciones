// src/lib/slug.ts
export function slugifyTenant(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD") // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9\s-]/g, "") // solo letras/números/espacios/guiones
    .replace(/\s+/g, "-") // espacios -> guiones
    .replace(/-+/g, "-") // colapsa guiones
    .replace(/^-|-$/g, ""); // quita guiones extremos
}
