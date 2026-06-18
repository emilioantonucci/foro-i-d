import { CATEGORIAS } from "@/lib/constants";

const ROLE =
  "Eres un analista senior de Investigación y Desarrollo de doinGlobal, una institución de educación superior y formación profesional con foco en LATAM. Respondés en español neutro, formal y conciso.";

const JSON_ONLY =
  "Respondé EXCLUSIVAMENTE con un JSON válido que cumpla la forma indicada. Sin texto adicional, sin markdown, sin comentarios.";

export function summaryPrompt(input: { url?: string; rawText?: string }): string {
  const cats = CATEGORIAS.map((c) => c.nombre).join(", ");
  return `${ROLE}
Analizá el siguiente recurso para el equipo de I+D.
${input.url ? `URL: ${input.url}` : ""}
${input.rawText ? `Contenido / contexto:\n"""${input.rawText.slice(0, 7000)}"""` : ""}

Devolvé un JSON con esta forma exacta:
{
  "resumen": "2 a 3 frases que resuman el recurso",
  "ideasClave": ["3 a 5 ideas clave, frases breves"],
  "aplicacionIyD": "cómo podría aplicarse en I+D / educación superior (1-2 frases)",
  "riesgos": ["1 a 3 riesgos o limitaciones"],
  "etiquetasSugeridas": ["3 a 6 etiquetas en minúscula, sin el símbolo #"],
  "categoriaSugerida": "exactamente una de estas: ${cats}"
}
${JSON_ONLY}`;
}

export function synthesisPrompt(input: {
  titulo: string;
  resumen?: string | null;
  comentarios: string[];
}): string {
  const debate = input.comentarios.map((c, i) => `(${i + 1}) ${c}`).join("\n");
  return `${ROLE}
Sintetizá el debate del equipo sobre la siguiente publicación.
Título: ${input.titulo}
${input.resumen ? `Resumen: ${input.resumen}` : ""}

Comentarios (${input.comentarios.length}):
${debate || "(sin comentarios)"}

Devolvé un JSON con esta forma exacta:
{
  "argumentos": ["principales argumentos planteados"],
  "consenso": "puntos de consenso (1-2 frases)",
  "tension": "puntos de tensión o desacuerdo (1-2 frases)",
  "proximasAcciones": ["2 a 4 próximas acciones sugeridas"],
  "decisionRecomendada": "una decisión recomendada, accionable (1-2 frases)"
}
${JSON_ONLY}`;
}

interface PostLite {
  titulo: string;
  resumen?: string | null;
  categoria?: string | null;
  estado?: string | null;
}

function postsBlock(posts: PostLite[]): string {
  return posts
    .map(
      (p, i) =>
        `(${i + 1}) [${p.categoria ?? "sin categoría"}] ${p.titulo}${p.resumen ? ` — ${p.resumen}` : ""}`,
    )
    .join("\n");
}

export function opportunitiesPrompt(input: { posts: PostLite[] }): string {
  return `${ROLE}
A partir ÚNICAMENTE de las publicaciones internas listadas (no inventes datos ni estadísticas externas), detectá oportunidades emergentes para I+D.

Publicaciones (${input.posts.length}):
${postsBlock(input.posts)}

Cada oportunidad debe tener un "tipo" que sea uno de:
"nuevo programa", "línea temática emergente", "benchmark competitivo", "insumo comercial", "mejora académica", "tema para investigación".

Devolvé un JSON con esta forma exacta:
{
  "oportunidades": [
    { "tipo": "...", "titulo": "título breve de la oportunidad", "justificacion": "por qué, basándote SOLO en las publicaciones internas" }
  ]
}
Incluí entre 2 y 5 oportunidades. ${JSON_ONLY}`;
}

export function briefPrompt(input: { posts: PostLite[] }): string {
  return `${ROLE}
Generá un brief estratégico de oportunidad a partir ÚNICAMENTE de las publicaciones internas listadas (no inventes estadísticas externas).

Publicaciones (${input.posts.length}):
${postsBlock(input.posts)}

Devolvé un JSON con esta forma exacta:
{
  "tituloOportunidad": "título de la oportunidad",
  "contexto": "contexto y antecedentes (2-3 frases)",
  "evidenciaInterna": ["evidencia tomada de las publicaciones internas"],
  "hipotesisMercado": "hipótesis de mercado (1-2 frases)",
  "aplicacionAcademica": "posible aplicación académica (1-2 frases)",
  "aplicacionComercial": "posible aplicación comercial (1-2 frases)",
  "riesgos": ["1 a 3 riesgos"],
  "proximosPasos": ["2 a 4 próximos pasos recomendados"]
}
${JSON_ONLY}`;
}
