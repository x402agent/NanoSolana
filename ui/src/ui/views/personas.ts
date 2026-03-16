// ── Personas Browser View ───────────────────────────────────────────
//
// Displays the 43+ DeFi agent personas with category filtering,
// search, and detail cards.
// ────────────────────────────────────────────────────────────────────

import { html, nothing, type TemplateResult } from "lit";

// ── Types (client-side mirror of PersonaDefinition) ─────────────────

interface PersonaMeta {
  title: string;
  avatar: string;
  description: string;
  category: string;
  tags: string[];
}

interface PersonaConfig {
  systemRole: string;
  openingMessage: string;
  openingQuestions: string[];
}

export interface PersonaItem {
  id: string;
  meta: PersonaMeta;
  config: PersonaConfig;
}

export interface PersonaCategory {
  name: string;
  emoji: string;
  personas: PersonaItem[];
}

export interface PersonasViewState {
  personasLoading: boolean;
  personasError: string | null;
  personasList: PersonaItem[];
  personasCategories: PersonaCategory[];
  personasSearchQuery: string;
  personasSelectedCategory: string | null;
  personasSelectedId: string | null;
}

// ── Category emoji map ──────────────────────────────────────────────

const CATEGORY_EMOJIS: Record<string, string> = {
  crypto: "🪙",
  defi: "🏦",
  trading: "📈",
  security: "🔒",
  education: "📚",
  governance: "📁",
  tools: "🔧",
  programming: "🧑‍💻",
};

// ── Render helpers ──────────────────────────────────────────────────

function renderPersonaCard(
  persona: PersonaItem,
  isSelected: boolean,
  onSelect: (id: string) => void,
): TemplateResult {
  return html`
    <button
      class="persona-card ${isSelected ? "persona-card--selected" : ""}"
      @click=${() => onSelect(persona.id)}
    >
      <div class="persona-card__header">
        <span class="persona-card__avatar">${persona.meta.avatar}</span>
        <span class="persona-card__title">${persona.meta.title}</span>
      </div>
      <p class="persona-card__desc">${persona.meta.description}</p>
      <div class="persona-card__tags">
        ${persona.meta.tags.slice(0, 4).map(
          (tag) => html`<span class="persona-tag">${tag}</span>`,
        )}
      </div>
      <div class="persona-card__category">
        <span>${CATEGORY_EMOJIS[persona.meta.category.toLowerCase()] ?? "📁"}</span>
        <span>${persona.meta.category}</span>
      </div>
    </button>
  `;
}

function renderPersonaDetail(persona: PersonaItem): TemplateResult {
  return html`
    <div class="persona-detail">
      <div class="persona-detail__header">
        <span class="persona-detail__avatar">${persona.meta.avatar}</span>
        <div>
          <h3 class="persona-detail__title">${persona.meta.title}</h3>
          <span class="persona-detail__id"><code>${persona.id}</code></span>
        </div>
      </div>

      <p class="persona-detail__desc">${persona.meta.description}</p>

      <div class="persona-detail__tags">
        ${persona.meta.tags.map(
          (tag) => html`<span class="persona-tag">${tag}</span>`,
        )}
      </div>

      <div class="persona-detail__section">
        <h4>Opening Message</h4>
        <p class="persona-detail__opening">${persona.config.openingMessage}</p>
      </div>

      ${persona.config.openingQuestions.length > 0
        ? html`
        <div class="persona-detail__section">
          <h4>Research Questions</h4>
          <ul class="persona-detail__questions">
            ${persona.config.openingQuestions.map(
              (q) => html`<li>${q}</li>`,
            )}
          </ul>
        </div>
      `
        : nothing}

      <div class="persona-detail__section">
        <h4>Spawn Command</h4>
        <code class="persona-detail__cmd">/spawn analyst --persona ${persona.id}</code>
      </div>

      <div class="persona-detail__section">
        <h4>System Role</h4>
        <pre class="persona-detail__role">${persona.config.systemRole.slice(0, 500)}${persona.config.systemRole.length > 500 ? "…" : ""}</pre>
      </div>
    </div>
  `;
}

// ── Main render ─────────────────────────────────────────────────────

export function renderPersonasView(
  state: PersonasViewState,
  handlers: {
    onSearch: (query: string) => void;
    onSelectCategory: (cat: string | null) => void;
    onSelectPersona: (id: string | null) => void;
  },
): TemplateResult {
  if (state.personasLoading) {
    return html`
      <div class="personas-view">
        <div class="personas-header">
          <h2 class="view-title">🧬 Agent Personas</h2>
          <p class="view-subtitle">43+ DeFi agent personalities for swarm agents</p>
        </div>
        <div class="swarm-loading">
          <div class="spinner"></div>
          <span>Loading personas…</span>
        </div>
      </div>
    `;
  }

  // Filter personas
  let filtered = state.personasList;
  if (state.personasSelectedCategory) {
    filtered = filtered.filter(
      (p) => p.meta.category.toLowerCase() === state.personasSelectedCategory!.toLowerCase(),
    );
  }
  if (state.personasSearchQuery) {
    const q = state.personasSearchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.meta.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.meta.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.meta.description.toLowerCase().includes(q),
    );
  }

  const selectedPersona = state.personasSelectedId
    ? state.personasList.find((p) => p.id === state.personasSelectedId) ?? null
    : null;

  return html`
    <div class="personas-view">
      <div class="personas-header">
        <h2 class="view-title">🧬 Agent Personas</h2>
        <p class="view-subtitle">${state.personasList.length} DeFi agent personalities available</p>
      </div>

      <!-- Search + Category filter -->
      <div class="personas-toolbar">
        <input
          class="personas-search"
          type="text"
          placeholder="Search personas…"
          .value=${state.personasSearchQuery}
          @input=${(e: Event) => handlers.onSearch((e.target as HTMLInputElement).value)}
        />
        <div class="personas-categories">
          <button
            class="persona-cat-btn ${!state.personasSelectedCategory ? "persona-cat-btn--active" : ""}"
            @click=${() => handlers.onSelectCategory(null)}
          >All (${state.personasList.length})</button>
          ${state.personasCategories.map(
            (cat) => html`
            <button
              class="persona-cat-btn ${state.personasSelectedCategory === cat.name.toLowerCase() ? "persona-cat-btn--active" : ""}"
              @click=${() => handlers.onSelectCategory(cat.name.toLowerCase())}
            >${cat.emoji} ${cat.name} (${cat.personas.length})</button>
          `,
          )}
        </div>
      </div>

      <!-- Content: Grid + Optional Detail -->
      <div class="personas-content ${selectedPersona ? "personas-content--split" : ""}">
        <div class="personas-grid">
          ${filtered.length === 0
            ? html`<div class="swarm-empty">No personas match your search.</div>`
            : filtered.map((p) =>
                renderPersonaCard(
                  p,
                  p.id === state.personasSelectedId,
                  (id) => handlers.onSelectPersona(id === state.personasSelectedId ? null : id),
                ),
              )}
        </div>

        ${selectedPersona ? renderPersonaDetail(selectedPersona) : nothing}
      </div>
    </div>
  `;
}
