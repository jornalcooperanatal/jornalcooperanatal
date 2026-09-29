const $ = id => document.getElementById(id);

const esc = s =>
  String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));

const fmtDate = v => {
  if (!v) return "";

  const value = String(v);
  const d = new Date(
    value.includes("T")
      ? value
      : value + "T12:00:00"
  );

  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("pt-BR");
};

let DATA = {};

async function api(path, opts = {}) {
  const r = await fetch(path, opts);

  if (!r.ok) {
    throw new Error(await r.text());
  }

  return r.json();
}

function youtubeId(url) {
  if (!url) return null;

  try {
    const u = new URL(url);

    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0];
    }

    if (u.pathname.includes("/shorts/")) {
      return u.pathname
        .split("/shorts/")[1]
        .split("/")[0];
    }

    if (u.pathname.includes("/embed/")) {
      return u.pathname
        .split("/embed/")[1]
        .split("/")[0];
    }

    return u.searchParams.get("v");
  } catch {
    return null;
  }
}

async function track(type, id) {
  fetch("/api/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type,
      id
    })
  }).catch(() => {});
}

/* =========================================================
   CAPA / CARROSSEL
   ========================================================= */

let HERO_ITEMS = [];
let HERO_INDEX = 0;
let HERO_TIMER = null;

function setupHeroCarousel(arts) {
  HERO_ITEMS = (arts || []).slice(0, 8);

  if (!HERO_ITEMS.length) return;

  const main = $("heroMain");

  if (!main) return;

  if (!$("heroControls")) {
    const controls =
      document.createElement("div");

    controls.id = "heroControls";
    controls.className = "hero-controls";

    controls.innerHTML = `
      <button
        id="heroPrev"
        type="button"
        aria-label="Notícia anterior"
      >
        ‹
      </button>

      <div
        id="heroDots"
        class="hero-dots"
      ></div>

      <button
        id="heroNext"
        type="button"
        aria-label="Próxima notícia"
      >
        ›
      </button>
    `;

    main.appendChild(controls);

    $("heroPrev").onclick = e => {
      e.stopPropagation();

      showHero(
        (
          HERO_INDEX -
          1 +
          HERO_ITEMS.length
        ) %
        HERO_ITEMS.length,
        true
      );
    };

    $("heroNext").onclick = e => {
      e.stopPropagation();

      showHero(
        (
          HERO_INDEX +
          1
        ) %
        HERO_ITEMS.length,
        true
      );
    };

    main.addEventListener(
      "mouseenter",
      () => clearInterval(HERO_TIMER)
    );

    main.addEventListener(
      "mouseleave",
      startHeroTimer
    );
  }

  $("heroDots").innerHTML =
    HERO_ITEMS.map(
      (_, i) => `
        <button
          class="hero-dot"
          data-i="${i}"
          type="button"
          aria-label="Abrir manchete ${i + 1}"
        ></button>
      `
    ).join("");

  document
    .querySelectorAll(".hero-dot")
    .forEach(dot => {
      dot.onclick = e => {
        e.stopPropagation();

        showHero(
          Number(dot.dataset.i),
          true
        );
      };
    });

  showHero(0, false);
  startHeroTimer();
}

function showHero(index, restart) {
  if (!HERO_ITEMS.length) return;

  HERO_INDEX = index;

  const a = HERO_ITEMS[index];

  if ($("heroImg")) {
    $("heroImg").src =
      a.image_url || "";
  }

  if ($("heroCat")) {
    $("heroCat").textContent =
      a.category || "";
  }

  if ($("heroTitle")) {
    $("heroTitle").textContent =
      a.title || "";
  }

  if ($("heroSummary")) {
    $("heroSummary").textContent =
      a.summary || "";
  }

  if ($("heroMain")) {
    $("heroMain").onclick =
      () => openArticle(a.id);
  }

  document
    .querySelectorAll(".hero-dot")
    .forEach((dot, i) => {
      dot.classList.toggle(
        "active",
        i === index
      );
    });

  if (restart) {
    startHeroTimer();
  }
}

function startHeroTimer() {
  clearInterval(HERO_TIMER);

  if (HERO_ITEMS.length > 1) {
    HERO_TIMER =
      setInterval(() => {
        showHero(
          (
            HERO_INDEX +
            1
          ) %
          HERO_ITEMS.length,
          false
        );
      }, 6500);
  }
}

/* =========================================================
   CARDS
   ========================================================= */

function articleCard(a) {
  return `
    <article
      class="card"
      onclick="openArticle(${a.id})"
      style="cursor:pointer"
    >
      ${
        a.image_url
          ? `
            <img
              src="${esc(a.image_url)}"
              alt=""
            >
          `
          : ""
      }

      <div class="card-body">
        <div class="cat">
          ${esc(a.category)}
        </div>

        <h3>
          ${esc(a.title)}
        </h3>

        <p>
          ${esc(a.summary)}
        </p>

        <div class="meta">
          ${esc(a.author || "Redação")}
          •
          ${fmtDate(a.published_at)}
        </div>
      </div>
    </article>
  `;
}

/* =========================================================
   FAIXA AGORA
   ========================================================= */

function relativePublishedTime(value) {
  if (!value) return "";

  const raw = String(value);
  const hasTime = raw.includes("T");

  let d;

  if (hasTime) {
    d = new Date(raw);
  } else {
    const parts =
      raw
        .split("-")
        .map(Number);

    if (parts.length !== 3) {
      return "";
    }

    d = new Date(
      parts[0],
      parts[1] - 1,
      parts[2],
      12,
      0,
      0
    );
  }

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  const now = new Date();

  if (!hasTime) {
    const today =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const day =
      new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      );

    const diffDays =
      Math.round(
        (today - day) /
        86400000
      );

    if (diffDays <= 0) {
      return "publicado hoje";
    }

    if (diffDays === 1) {
      return "publicado ontem";
    }

    return `publicado há ${diffDays} dias`;
  }

  const sec =
    Math.max(
      0,
      Math.floor(
        (now - d) /
        1000
      )
    );

  if (sec < 60) {
    return "publicado agora";
  }

  const min =
    Math.floor(sec / 60);

  if (min < 60) {
    return `publicado há ${min} min`;
  }

  const hr =
    Math.floor(min / 60);

  if (hr < 24) {
    return `publicado há ${hr} h`;
  }

  const days =
    Math.floor(hr / 24);

  if (days === 1) {
    return "publicado ontem";
  }

  if (days < 30) {
    return `publicado há ${days} dias`;
  }

  return `publicado em ${fmtDate(
    raw.slice(0, 10)
  )}`;
}

function renderBreakingTicker(
  articles,
  settingsText
) {
  const host =
    $("breakingText");

  if (!host) return;

  const latest =
    (articles || [])
      .slice(0, 8);

  const items = [];

  if (
    settingsText &&
    settingsText.trim()
  ) {
    items.push({
      label:
        settingsText.trim(),
      id: null,
      time: ""
    });
  }

  latest.forEach(a => {
    items.push({
      label:
        a.title || "",
      id: a.id,
      time:
        relativePublishedTime(
          a.published_at
        )
    });
  });

  if (!items.length) {
    host.textContent =
      "Últimas atualizações do Jornal Coopera Natal";

    return;
  }

  host.innerHTML = `
    <div class="breaking-viewport">
      <div class="breaking-track">
        ${
          items.map(x => `
            <span
              class="breaking-item ${
                x.id
                  ? "is-link"
                  : ""
              }"
              ${
                x.id
                  ? `onclick="openArticle(${x.id})"`
                  : ""
              }
            >
              <strong>
                ${esc(x.label)}
              </strong>

              ${
                x.time
                  ? `
                    <em>
                      • ${esc(x.time)}
                    </em>
                  `
                  : ""
              }
            </span>
          `).join(
            `
              <span class="breaking-sep">
                ◆
              </span>
            `
          )
        }
      </div>
    </div>
  `;
}

/* =========================================================
   RENDER DO SITE
   ========================================================= */

function render() {
  const s =
    DATA.settings || {};

  document.documentElement
    .style
    .setProperty(
      "--primary",
      s.primary_color ||
      "#0a4f8a"
    );

  document.documentElement
    .style
    .setProperty(
      "--accent",
      s.accent_color ||
      "#a61f2b"
    );

  if ($("brand")) {
    $("brand").textContent =
      s.site_name ||
      "Jornal Coopera Natal";
  }

  if ($("footerBrand")) {
    $("footerBrand").textContent =
      s.site_name ||
      "Jornal Coopera Natal";
  }

  if ($("tagline")) {
    $("tagline").textContent =
      s.tagline || "";
  }

  if ($("footerAbout")) {
    $("footerAbout").textContent =
      s.about_text || "";
  }

  const arts =
    DATA.articles || [];

  renderBreakingTicker(
    arts,
    s.breaking_text || ""
  );

  setupHeroCarousel(arts);

  const side =
    arts.slice(1, 3);

  if ($("heroSide")) {
    $("heroSide").innerHTML =
      side.map(a => `
        <article
          class="side-story"
          onclick="openArticle(${a.id})"
        >
          ${
            a.image_url
              ? `
                <img
                  src="${esc(a.image_url)}"
                  alt=""
                >
              `
              : ""
          }

          <div>
            <div class="cat">
              ${esc(a.category)}
            </div>

            <h3>
              ${esc(a.title)}
            </h3>

            <p>
              ${esc(a.summary)}
            </p>
          </div>
        </article>
      `).join("");
  }

  if ($("newsGrid")) {
    $("newsGrid").innerHTML =
      arts
        .filter(
          a =>
            a.content_type !==
            "entrevista"
        )
        .slice(0, 12)
        .map(articleCard)
        .join("");
  }

  if ($("interviewGrid")) {
    $("interviewGrid").innerHTML =
      arts
        .filter(
          a =>
            a.content_type ===
              "entrevista" ||
            a.category ===
              "Entrevistas"
        )
        .slice(0, 9)
        .map(articleCard)
        .join("")
      ||
      "<p>Nenhuma entrevista publicada ainda.</p>";
  }

  if ($("coopGrid")) {
    $("coopGrid").innerHTML =
      (
        DATA.cooperatives ||
        []
      ).map(c => `
        <article class="coop-card">
          ${
            c.image_url
              ? `
                <img
                  src="${esc(c.image_url)}"
                  alt=""
                >
              `
              : ""
          }

          <div class="coop-body">
            <div class="cat">
              ${
                esc(
                  c.type ||
                  "Cooperativa"
                )
              }
            </div>

            <h3>
              ${esc(c.name)}
            </h3>

            <p>
              ${
                esc(
                  c.description ||
                  ""
                )
              }
            </p>

            ${
              c.website
                ? `
                  <a
                    class="btn primary"
                    target="_blank"
                    rel="noopener"
                    href="${esc(c.website)}"
                    onclick="track('coop',${c.id})"
                  >
                    Conhecer
                  </a>
                `
                : ""
            }

            ${
              c.instagram
                ? `
                  <a
                    class="btn light"
                    target="_blank"
                    rel="noopener"
                    href="${esc(c.instagram)}"
                    onclick="track('coop',${c.id})"
                  >
                    Instagram
                  </a>
                `
                : ""
            }
          </div>
        </article>
      `).join("");
  }

  if ($("linkGrid")) {
    $("linkGrid").innerHTML =
      (
        DATA.links ||
        []
      ).map(x => `
        <a
          class="link-card"
          target="_blank"
          rel="noopener"
          href="${esc(x.url)}"
          onclick="track('link',${x.id})"
        >
          <b>
            ${esc(x.name)}
          </b>

          <span>
            ${
              esc(
                x.description ||
                ""
              )
            }
          </span>

          <em>
            ${
              esc(
                x.category ||
                "Serviço"
              )
            }
            →
          </em>
        </a>
      `).join("");
  }

  if ($("faqList")) {
    $("faqList").innerHTML =
      (
        DATA.faqs ||
        []
      ).map(
        (f, i) => `
          <details
            ${
              i === 0
                ? "open"
                : ""
            }
          >
            <summary>
              ${esc(f.question)}
            </summary>

            <p>
              ${esc(f.answer)}
            </p>
          </details>
        `
      ).join("");
  }

  renderAds();
}

/* =========================================================
   PUBLICIDADE
   ========================================================= */

function renderAds() {
  ["top", "middle"]
    .forEach(place => {
      const host =
        $(
          place === "top"
            ? "adTop"
            : "adMiddle"
        );

      if (!host) return;

      const ad =
        (
          DATA.ads ||
          []
        ).find(
          a =>
            a.placement ===
            place
        );

      if (!ad) {
        host.innerHTML = "";
        return;
      }

      const key =
        "closed_ad_" +
        ad.id;

      if (
        sessionStorage
          .getItem(key)
      ) {
        host.innerHTML = "";
        return;
      }

      host.innerHTML = `
        <aside class="ad">
          <button
            class="ad-x"
            type="button"
          >
            ×
          </button>

          <div class="ad-label">
            Publicidade
          </div>

          <div class="ad-in">
            ${
              ad.image_url
                ? `
                  <img
                    src="${esc(ad.image_url)}"
                    alt=""
                  >
                `
                : ""
            }

            <div class="ad-copy">
              <h3>
                ${esc(ad.title)}
              </h3>

              <p>
                ${
                  esc(
                    ad.body ||
                    ""
                  )
                }
              </p>

              ${
                ad.target_url
                  ? `
                    <a
                      class="btn primary"
                      target="_blank"
                      rel="noopener"
                      href="${esc(ad.target_url)}"
                      onclick="track('ad',${ad.id})"
                    >
                      Saiba mais
                    </a>
                  `
                  : ""
              }
            </div>
          </div>
        </aside>
      `;

      host
        .querySelector(
          ".ad-x"
        )
        .onclick = () => {
          sessionStorage
            .setItem(
              key,
              "1"
            );

          host.innerHTML =
            "";
        };
    });
}

/* =========================================================
   MATÉRIA COMPLETA
   ========================================================= */

async function openArticle(id) {
  await track(
    "article",
    id
  );

  const a =
    (
      DATA.articles ||
      []
    ).find(
      x =>
        x.id === id
    );

  if (!a) return;

  const yid =
    youtubeId(
      a.youtube_url
    );

  if (!$("articleView")) {
    return;
  }

  $("articleView").innerHTML = `
    <div class="cat">
      ${esc(a.category)}
    </div>

    <h1>
      ${esc(a.title)}
    </h1>

    <div class="article-summary">
      ${
        esc(
          a.summary ||
          ""
        )
      }
    </div>

    <div class="meta">
      ${
        esc(
          a.author ||
          "Redação"
        )
      }
      •
      ${fmtDate(a.published_at)}
    </div>

    ${
      a.image_url
        ? `
          <img
            src="${esc(a.image_url)}"
            alt=""
          >
        `
        : ""
    }

    ${
      yid
        ? `
          <div class="video-wrap">
            <iframe
              src="https://www.youtube-nocookie.com/embed/${esc(yid)}"
              title="${esc(a.title)}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
        `
        : ""
    }

    <div class="article-content">
      ${a.body_html || ""}
    </div>

    <div style="margin-top:14px">
      ${
        a.extra_url
          ? `
            <a
              class="btn primary"
              target="_blank"
              rel="noopener"
              href="${esc(a.extra_url)}"
            >
              ${
                esc(
                  a.extra_label ||
                  "Abrir link"
                )
              }
            </a>
          `
          : ""
      }

      ${
        a.source_url
          ? `
            <a
              class="btn light"
              target="_blank"
              rel="noopener"
              href="${esc(a.source_url)}"
            >
              ${
                esc(
                  a.source_name ||
                  "Fonte"
                )
              }
            </a>
          `
          : ""
      }

      <button
        class="btn light"
        type="button"
        onclick="closeArticle()"
      >
        Fechar
      </button>
    </div>
  `;

  $("articleView")
    .classList
    .add("active");

  $("articleView")
    .scrollIntoView({
      behavior: "smooth"
    });
}

window.openArticle =
  openArticle;

window.closeArticle =
  () => {
    if ($("articleView")) {
      $("articleView")
        .classList
        .remove("active");
    }
  };

window.track = track;

/* =========================================================
   COMPARADOR CLT x COOPERATIVA
   ========================================================= */

const SIM_RAMO_CARGOS = {

  "Transporte e Logística": [
    {
      id: "motofretista",
      nome: "Motofretista / motociclista profissional",
      base: "minimo",
      periculosidade: 30
    },
    {
      id: "motorista",
      nome: "Motorista",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "motorista_onibus",
      nome: "Motorista de ônibus / micro-ônibus",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "motorista_van",
      nome: "Motorista de van",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "aux_logistica",
      nome: "Auxiliar de logística",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "conferente",
      nome: "Conferente / expedição",
      base: "minimo",
      periculosidade: 0
    }
  ],

  "Crédito e Serviços Financeiros": [
    {
      id: "atendimento_credito",
      nome: "Atendimento / relacionamento",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "caixa",
      nome: "Caixa / tesouraria",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "assistente_financeiro",
      nome: "Assistente financeiro",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "analista_credito",
      nome: "Analista de crédito",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "gerente",
      nome: "Gerente / gestor de unidade",
      base: "minimo",
      periculosidade: 0
    }
  ],

  "Saúde": [
    {
      id: "recepcao_saude",
      nome: "Recepcionista / atendimento",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "aux_saude",
      nome: "Auxiliar de serviços de saúde",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "tec_enfermagem",
      nome: "Técnico de enfermagem",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "enfermeiro",
      nome: "Enfermeiro",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "medico",
      nome: "Médico",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "dentista",
      nome: "Cirurgião-dentista",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "tec_laboratorio",
      nome: "Técnico de laboratório",
      base: "minimo",
      periculosidade: 0
    }
  ],

  "Agropecuário": [
    {
      id: "trabalhador_rural",
      nome: "Trabalhador rural",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "aux_agro",
      nome: "Auxiliar agropecuário",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "tec_agricola",
      nome: "Técnico agrícola / agropecuário",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "operador_maquinas",
      nome: "Operador de máquinas",
      base: "minimo",
      periculosidade: 0
    }
  ],

  "Consumo e Comércio": [
    {
      id: "atendente",
      nome: "Atendente",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "vendedor",
      nome: "Vendedor",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "estoquista",
      nome: "Estoquista",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "caixa_comercio",
      nome: "Operador de caixa",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "aux_adm",
      nome: "Auxiliar administrativo",
      base: "minimo",
      periculosidade: 0
    }
  ],

  "Infraestrutura e Energia": [
    {
      id: "eletricista",
      nome: "Eletricista",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "tec_manutencao",
      nome: "Técnico de manutenção",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "aux_manutencao",
      nome: "Auxiliar de manutenção",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "operador",
      nome: "Operador",
      base: "minimo",
      periculosidade: 0
    }
  ],

  "Construção e Habitação": [
    {
      id: "pedreiro",
      nome: "Pedreiro",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "servente",
      nome: "Servente / ajudante",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "pintor",
      nome: "Pintor",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "encanador",
      nome: "Encanador",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "eletricista_construcao",
      nome: "Eletricista de instalações",
      base: "minimo",
      periculosidade: 0
    }
  ],

  "Trabalho e Serviços": [
    {
      id: "asg",
      nome: "Auxiliar de serviços gerais",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "limpeza",
      nome: "Profissional de limpeza",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "portaria",
      nome: "Porteiro / controlador de acesso",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "recepcionista",
      nome: "Recepcionista",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "administrativo",
      nome: "Assistente administrativo",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "tecnico",
      nome: "Técnico / profissional especializado",
      base: "minimo",
      periculosidade: 0
    }
  ],

  "Educação e Formação": [
    {
      id: "instrutor",
      nome: "Instrutor / facilitador",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "professor",
      nome: "Professor",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "apoio_educacao",
      nome: "Apoio administrativo educacional",
      base: "minimo",
      periculosidade: 0
    }
  ],

  "Tecnologia e Comunicação": [
    {
      id: "suporte",
      nome: "Suporte técnico",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "desenvolvedor",
      nome: "Desenvolvedor / programação",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "designer",
      nome: "Designer / comunicação",
      base: "minimo",
      periculosidade: 0
    },
    {
      id: "social_media",
      nome: "Social media / conteúdo",
      base: "minimo",
      periculosidade: 0
    }
  ],

  "Outros": [
    {
      id: "geral",
      nome: "Outro cargo / atividade",
      base: "minimo",
      periculosidade: 0
    }
  ]
};

let SIM_CARGO_ATUAL = null;
let SIM_SALARIO_MANUAL = false;

function simMoney(v) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  ).format(
    Number.isFinite(v)
      ? v
      : 0
  );
}

function simN(id) {
  const el = $(id);

  return el
    ? Math.max(
        0,
        parseFloat(el.value) ||
        0
      )
    : 0;
}

function simHoursWindow() {
  const a =
    $("simInicio")?.value;

  const b =
    $("simFim")?.value;

  if (!a || !b) {
    return 0;
  }

  let [h1, m1] =
    a
      .split(":")
      .map(Number);

  let [h2, m2] =
    b
      .split(":")
      .map(Number);

  let x =
    h1 +
    m1 / 60;

  let y =
    h2 +
    m2 / 60;

  if (y <= x) {
    y += 24;
  }

  return Math.max(
    0,
    y - x
  );
}

function simOverlapNight(
  start,
  end
) {
  if (!start || !end) {
    return 0;
  }

  let [h1, m1] =
    start
      .split(":")
      .map(Number);

  let [h2, m2] =
    end
      .split(":")
      .map(Number);

  let s =
    h1 +
    m1 / 60;

  let e =
    h2 +
    m2 / 60;

  if (e <= s) {
    e += 24;
  }

  let total = 0;

  const windows = [
    [22, 29],
    [-2, 5],
    [46, 53]
  ];

  for (
    const [a, b]
    of windows
  ) {
    total +=
      Math.max(
        0,
        Math.min(e, b) -
        Math.max(s, a)
      );
  }

  return Math.min(
    total,
    e - s
  );
}

/* =========================================================
   INSS 2026
   ========================================================= */

function simInssEmpregado(base) {
  const teto =
    8475.55;

  const b =
    Math.min(
      base,
      teto
    );

  const faixas = [
    [0, 1621, 0.075],
    [1621, 2902.84, 0.09],
    [2902.84, 4354.27, 0.12],
    [4354.27, 8475.55, 0.14]
  ];

  let total = 0;

  for (
    const [
      inicio,
      fim,
      aliquota
    ]
    of faixas
  ) {
    if (b > inicio) {
      total +=
        Math.max(
          0,
          Math.min(
            b,
            fim
          ) -
          inicio
        ) *
        aliquota;
    }
  }

  return total;
}

/* =========================================================
   IRRF 2026
   ========================================================= */

function simIrrf2026(
  rendimento,
  inss
) {
  const simplificado =
    607.20;

  const baseLegal =
    Math.max(
      0,
      rendimento -
      inss
    );

  const baseSimplificada =
    Math.max(
      0,
      rendimento -
      simplificado
    );

  const base =
    Math.min(
      baseLegal,
      baseSimplificada
    );

  let imposto = 0;

  if (base <= 2428.80) {
    imposto = 0;
  } else if (
    base <= 2826.65
  ) {
    imposto =
      base *
      0.075 -
      182.16;
  } else if (
    base <= 3751.05
  ) {
    imposto =
      base *
      0.15 -
      394.16;
  } else if (
    base <= 4664.68
  ) {
    imposto =
      base *
      0.225 -
      675.49;
  } else {
    imposto =
      base *
      0.275 -
      908.73;
  }

  imposto =
    Math.max(
      0,
      imposto
    );

  let reducao = 0;

  if (
    rendimento <=
    5000
  ) {
    reducao =
      Math.min(
        imposto,
        312.89
      );
  } else if (
    rendimento <=
    7350
  ) {
    reducao =
      Math.max(
        0,
        978.62 -
        (
          0.133145 *
          rendimento
        )
      );
  }

  return Math.max(
    0,
    imposto -
    reducao
  );
}

/* =========================================================
   RAMOS / CARGOS
   ========================================================= */

function simFillRamos() {
  const ramo =
    $("simRamo");

  if (!ramo) return;

  ramo.innerHTML =
    Object
      .keys(
        SIM_RAMO_CARGOS
      )
      .map(
        x => `
          <option
            value="${esc(x)}"
          >
            ${esc(x)}
          </option>
        `
      )
      .join("");

  simFillCargos();
}

function simFillCargos() {
  const ramo =
    $("simRamo")
      ?.value;

  const cargo =
    $("simCargo");

  if (!cargo) return;

  const list =
    SIM_RAMO_CARGOS[
      ramo
    ] || [];

  cargo.innerHTML =
    list
      .map(
        x => `
          <option
            value="${x.id}"
          >
            ${esc(x.nome)}
          </option>
        `
      )
      .join("");

  simCargoChanged();
}

function simCargoChanged() {
  const ramo =
    $("simRamo")
      ?.value;

  const id =
    $("simCargo")
      ?.value;

  const list =
    SIM_RAMO_CARGOS[
      ramo
    ] || [];

  SIM_CARGO_ATUAL =
    list.find(
      x =>
        x.id === id
    )
    ||
    list[0]
    ||
    null;

  SIM_SALARIO_MANUAL =
    false;

  const minimo =
    simN(
      "simMinimo"
    )
    ||
    1621;

  if (
    SIM_CARGO_ATUAL
      ?.base ===
    "minimo"
  ) {
    if ($("simSalario")) {
      $("simSalario").value =
        minimo.toFixed(2);
    }

    if ($("simSalarioNota")) {
      $("simSalarioNota")
        .textContent =
        "Referência vinculada ao salário mínimo. Se existir piso ou convenção coletiva da categoria, substitua pelo valor correto.";
    }
  }

  if (
    $("simPericulosidade")
  ) {
    $("simPericulosidade")
      .value =
      String(
        SIM_CARGO_ATUAL
          ?.periculosidade ||
        0
      );
  }

  simCalculate();
}

function simMinimumChanged() {
  const minimo =
    simN(
      "simMinimo"
    )
    ||
    1621;

  if (
    $("simMinimoLabel")
  ) {
    $("simMinimoLabel")
      .textContent =
      simMoney(minimo);
  }

  if (
    !SIM_SALARIO_MANUAL &&
    SIM_CARGO_ATUAL
      ?.base ===
      "minimo"
  ) {
    if ($("simSalario")) {
      $("simSalario").value =
        minimo.toFixed(2);
    }
  }

  simCalculate();
}

/* =========================================================
   QUANTIDADE DE CLTs
   ========================================================= */

function simCalcQtd(
  windowHours,
  days
) {
  const weekly =
    windowHours *
    days;

  let qtd =
    Math.max(
      1,
      Math.ceil(
        weekly /
        44
      )
    );

  if (
    windowHours >
    10
  ) {
    qtd =
      Math.max(
        qtd,
        Math.ceil(
          windowHours /
          10
        )
      );
  }

  if (
    days ===
    7
  ) {
    qtd =
      Math.max(
        qtd,
        2
      );
  }

  return qtd;
}

/* =========================================================
   CÁLCULO PRINCIPAL
   ========================================================= */

function simCalculate() {
  if (!$("comparador")) {
    return;
  }

  const minimo =
    simN(
      "simMinimo"
    )
    ||
    1621;

  const salario =
    Math.max(
      simN(
        "simSalario"
      ),
      0
    );

  const dias =
    Number(
      $("simDias")
        ?.value ||
      5
    );

  const windowHours =
    simHoursWindow();

  const weeklyHours =
    windowHours *
    dias;

  const qtd =
    simCalcQtd(
      windowHours,
      dias
    );

  const perPct =
    simN(
      "simPericulosidade"
    ) /
    100;

  const insPct =
    simN(
      "simInsalubridade"
    ) /
    100;

  const beneficios =
    simN(
      "simBeneficios"
    );

  const equipamento =
    simN(
      "simEquipamento"
    );

  const patronalPct =
    simN(
      "simPatronal"
    ) /
    100;

  const ratPct =
    simN(
      "simRat"
    ) /
    100;

  const feriados =
    Math.floor(
      simN(
        "simFeriados"
      )
    );

  const compensa =
    $("simCompensaFeriado")
      ?.checked;

  const calcExtra =
    $("simHoraExtraAuto")
      ?.checked;

  const calcNoturno =
    $("simNoturnoAuto")
      ?.checked;

  const reservaRescisao =
    $("simRescisao")
      ?.checked;

  const horasPorCltSemana =
    weeklyHours /
    qtd;

  const horasPorCltDia =
    windowHours /
    qtd;

  const divisor =
    220;

  const valorHora =
    salario /
    divisor;

  const periculosidade =
    salario *
    perPct;

  const insalubridade =
    minimo *
    insPct;

  /* ===============================
     HORAS EXTRAS
     =============================== */

  let extraMes = 0;

  if (calcExtra) {
    const excedenteSemana =
      Math.max(
        0,
        horasPorCltSemana -
        44
      );

    const excedenteDia =
      Math.max(
        0,
        horasPorCltDia -
        8
      ) *
      dias;

    const extraSemanal =
      Math.max(
        excedenteSemana,
        excedenteDia
      );

    extraMes =
      extraSemanal *
      (
        52 /
        12
      ) *
      valorHora *
      1.5;
  }

  /* ===============================
     NOTURNO
     =============================== */

  let noturnoMes = 0;

  if (calcNoturno) {
    const nightWindow =
      simOverlapNight(
        $("simInicio")
          ?.value,
        $("simFim")
          ?.value
      );

    const nightPerClt =
      (
        nightWindow /
        qtd
      ) *
      dias *
      (
        52 /
        12
      );

    const horaNoturnaFicta =
      nightPerClt *
      (
        60 /
        52.5
      );

    noturnoMes =
      horaNoturnaFicta *
      valorHora *
      0.20;
  }

  /* ===============================
     FERIADOS
     =============================== */

  let feriadoMes = 0;

  if (
    feriados >
      0 &&
    !compensa
  ) {
    const horasFeriado =
      Math.min(
        8,
        Math.max(
          0,
          horasPorCltDia
        )
      );

    feriadoMes =
      feriados *
      horasFeriado *
      valorHora;
  }

  /* ===============================
     REMUNERAÇÃO
     =============================== */

  const remuneracao =
    salario +
    periculosidade +
    insalubridade +
    extraMes +
    noturnoMes +
    feriadoMes;

  const dec13 =
    remuneracao /
    12;

  const ferias =
    remuneracao /
    12;

  const tercoFerias =
    remuneracao /
    36;

  const baseProvisoes =
    remuneracao +
    dec13 +
    ferias +
    tercoFerias;

  const fgts =
    baseProvisoes *
    0.08;

  const patronal =
    baseProvisoes *
    patronalPct;

  const rat =
    baseProvisoes *
    ratPct;

  const provisaoRescisoria =
    reservaRescisao
      ? fgts * 0.40
      : 0;

  const custoUnit =
    remuneracao +
    dec13 +
    ferias +
    tercoFerias +
    fgts +
    patronal +
    rat +
    beneficios +
    equipamento +
    provisaoRescisoria;

  const custoClt =
    custoUnit *
    qtd;

  /* ===============================
     LÍQUIDO DO EMPREGADO
     =============================== */

  const inss =
    simInssEmpregado(
      remuneracao
    );

  const irrf =
    simIrrf2026(
      remuneracao,
      inss
    );

  const liquido =
    Math.max(
      0,
      remuneracao -
      inss -
      irrf
    );

  /* ===============================
     COOPERATIVA
     =============================== */

  const coopValor =
    simN(
      "simCoopValor"
    );

  const coopTaxa =
    simN(
      "simCoopTaxa"
    );

  const coopExtra =
    simN(
      "simCoopExtra"
    );

  const isencao =
    Math.min(
      12,
      Math.floor(
        simN(
          "simCoopIsencao"
        )
      )
    );

  const coopAno =
    (
      coopValor +
      coopExtra
    ) *
    12
    +
    coopTaxa *
    (
      12 -
      isencao
    );

  const coopMensalMedio =
    coopAno /
    12;

  /* ===============================
     RESULTADOS
     =============================== */

  if ($("simQtdClt")) {
    $("simQtdClt")
      .textContent =
      String(qtd);
  }

  if ($("simCustoClt")) {
    $("simCustoClt")
      .textContent =
      simMoney(
        custoClt
      );
  }

  if ($("simCustoCltAno")) {
    $("simCustoCltAno")
      .textContent =
      `${simMoney(
        custoClt *
        12
      )}/ano`;
  }

  if ($("simCustoCoop")) {
    $("simCustoCoop")
      .textContent =
      simMoney(
        coopMensalMedio
      );
  }

  if ($("simCustoCoopAno")) {
    $("simCustoCoopAno")
      .textContent =
      `${simMoney(
        coopAno
      )}/ano`;
  }

  if ($("simBruto")) {
    $("simBruto")
      .textContent =
      simMoney(
        remuneracao
      );
  }

  if ($("simInss")) {
    $("simInss")
      .textContent =
      simMoney(
        inss
      );
  }

  if ($("simIrrf")) {
    $("simIrrf")
      .textContent =
      simMoney(
        irrf
      );
  }

  if ($("simLiquido")) {
    $("simLiquido")
      .textContent =
      simMoney(
        liquido
      );
  }

  /* ===============================
     MOTIVOS DA QUANTIDADE
     =============================== */

  const motivos = [];

  if (
    dias ===
    7
  ) {
    motivos.push(
      "funcionamento em 7 dias exige revezamento e descanso semanal"
    );
  }

  if (
    windowHours >
    10
  ) {
    motivos.push(
      "a janela diária ultrapassa 10 horas"
    );
  }

  if (
    weeklyHours >
    44
  ) {
    motivos.push(
      `a operação exige ${weeklyHours
        .toFixed(1)
        .replace(".", ",")} h de cobertura por semana`
    );
  }

  if (!motivos.length) {
    motivos.push(
      "a cobertura informada cabe na referência geral de uma escala"
    );
  }

  if ($("simQtdMotivo")) {
    $("simQtdMotivo")
      .textContent =
      motivos.join("; ") +
      ".";
  }

  /* ===============================
     QUAL TEM MENOR CUSTO
     =============================== */

  const diff =
    custoClt -
    coopMensalMedio;

  const diffAbs =
    Math.abs(diff);

  if ($("simDiferenca")) {
    $("simDiferenca")
      .textContent =
      simMoney(
        diffAbs
      );
  }

  const card =
    $("simResultadoCard");

  if (
    diff >
    0.01
  ) {
    if ($("simResultadoLabel")) {
      $("simResultadoLabel")
        .textContent =
        "Menor custo estimado: Cooperativa";
    }

    if ($("simResultadoResumo")) {
      $("simResultadoResumo")
        .textContent =
        `${simMoney(diff)} por mês abaixo do custo CLT estimado.`;
    }

    if (card) {
      card.className =
        "sim-result-card emphasis is-coop";
    }

    if ($("simLeitura")) {
      $("simLeitura")
        .innerHTML =
        `
          <b>
            Financeiramente, neste cenário,
            a cooperativa apresenta menor
            custo mensal estimado.
          </b>

          A diferença é de
          ${simMoney(diff)}
          por mês.

          Compare também cobertura,
          contrato, autonomia cooperativa
          e responsabilidades operacionais.
        `;
    }
  } else if (
    diff <
    -0.01
  ) {
    if ($("simResultadoLabel")) {
      $("simResultadoLabel")
        .textContent =
        "Menor custo estimado: CLT";
    }

    if ($("simResultadoResumo")) {
      $("simResultadoResumo")
        .textContent =
        `${simMoney(diffAbs)} por mês abaixo do custo médio da cooperativa.`;
    }

    if (card) {
      card.className =
        "sim-result-card emphasis is-clt";
    }

    if ($("simLeitura")) {
      $("simLeitura")
        .innerHTML =
        `
          <b>
            Financeiramente, neste cenário,
            a contratação CLT apresenta
            menor custo mensal estimado.
          </b>

          A diferença é de
          ${simMoney(diffAbs)}
          por mês.

          O resultado não elimina diferenças
          de gestão, cobertura e responsabilidades
          entre os modelos.
        `;
    }
  } else {
    if ($("simResultadoLabel")) {
      $("simResultadoLabel")
        .textContent =
        "Custos praticamente equivalentes";
    }

    if ($("simResultadoResumo")) {
      $("simResultadoResumo")
        .textContent =
        "A diferença mensal é mínima.";
    }

    if (card) {
      card.className =
        "sim-result-card emphasis";
    }

    if ($("simLeitura")) {
      $("simLeitura")
        .innerHTML =
        `
          Os custos ficaram praticamente
          equivalentes.

          Nesse cenário, a análise deve se
          concentrar na estrutura operacional,
          continuidade da cobertura e
          responsabilidades de cada modelo.
        `;
    }
  }

  /* ===============================
     ALERTAS
     =============================== */

  const alertas = [];

  if (
    dias ===
    7
  ) {
    alertas.push(
      "<b>Operação 7 dias:</b> o simulador força no mínimo 2 CLTs para permitir revezamento e repouso semanal."
    );
  }

  if (
    windowHours >
    10
  ) {
    alertas.push(
      "<b>Janela diária extensa:</b> uma única pessoa não é considerada suficiente para cobrir toda a operação."
    );
  }

  if (
    weeklyHours >
    44
  ) {
    alertas.push(
      `<b>Cobertura semanal:</b> são ${weeklyHours
        .toFixed(1)
        .replace(".", ",")} horas de operação por semana.`
    );
  }

  if (
    calcNoturno &&
    simOverlapNight(
      $("simInicio")
        ?.value,
      $("simFim")
        ?.value
    ) >
    0
  ) {
    alertas.push(
      "<b>Horário noturno:</b> foi incluído adicional noturno urbano de referência no período entre 22h e 5h, com hora noturna reduzida."
    );
  }

  if (
    feriados >
      0 &&
    !compensa
  ) {
    alertas.push(
      `<b>Feriados:</b> foram considerados ${feriados} dia(s) trabalhado(s) sem folga compensatória.`
    );
  }

  if (
    insPct >
    0
  ) {
    alertas.push(
      "<b>Insalubridade:</b> o percentual só deve ser utilizado quando a atividade estiver efetivamente caracterizada conforme as normas aplicáveis."
    );
  }

  if ($("simAlertaJornada")) {
    $("simAlertaJornada")
      .innerHTML =
      alertas.length
        ? alertas.join("<br>")
        : "<b>Jornada:</b> nenhuma situação especial adicional foi identificada pelos parâmetros informados.";
  }

  /* ===============================
     DETALHAMENTO
     =============================== */

  const itens = [
    [
      "Salário-base",
      salario
    ],
    [
      `Periculosidade (${(
        perPct *
        100
      ).toFixed(0)}%)`,
      periculosidade
    ],
    [
      `Insalubridade (${(
        insPct *
        100
      ).toFixed(0)}%)`,
      insalubridade
    ],
    [
      "Horas extras estimadas",
      extraMes
    ],
    [
      "Adicional noturno estimado",
      noturnoMes
    ],
    [
      "Feriados sem compensação",
      feriadoMes
    ],
    [
      "13º provisionado",
      dec13
    ],
    [
      "Férias provisionadas",
      ferias
    ],
    [
      "1/3 de férias provisionado",
      tercoFerias
    ],
    [
      "FGTS (8%)",
      fgts
    ],
    [
      `Encargo patronal (${(
        patronalPct *
        100
      )
        .toFixed(1)
        .replace(".", ",")}%)`,
      patronal
    ],
    [
      `RAT (${(
        ratPct *
        100
      )
        .toFixed(1)
        .replace(".", ",")}%)`,
      rat
    ],
    [
      "Benefícios mensais",
      beneficios
    ],
    [
      "Equipamento / veículo / combustível",
      equipamento
    ]
  ];

  if (
    reservaRescisao
  ) {
    itens.push([
      "Reserva rescisória estimativa",
      provisaoRescisoria
    ]);
  }

  if ($("simDetalheClt")) {
    $("simDetalheClt")
      .innerHTML =
      itens
        .map(
          ([nome, valor]) => `
            <tr>
              <td>
                ${esc(nome)}
              </td>

              <td>
                ${simMoney(valor)}
              </td>

              <td>
                ${simMoney(
                  valor *
                  qtd
                )}
              </td>
            </tr>
          `
        )
        .join("")
      +
      `
        <tr class="sim-total">
          <td>
            TOTAL ESTIMADO
          </td>

          <td>
            ${simMoney(custoUnit)}
          </td>

          <td>
            ${simMoney(custoClt)}
          </td>
        </tr>
      `;
  }
}

/* =========================================================
   INICIALIZAÇÃO DO COMPARADOR
   ========================================================= */

function initComparator() {
  if (!$("comparador")) {
    return;
  }

  simFillRamos();

  $("simRamo")
    ?.addEventListener(
      "change",
      simFillCargos
    );

  $("simCargo")
    ?.addEventListener(
      "change",
      simCargoChanged
    );

  $("simMinimo")
    ?.addEventListener(
      "input",
      simMinimumChanged
    );

  $("simSalario")
    ?.addEventListener(
      "input",
      () => {
        SIM_SALARIO_MANUAL =
          true;

        simCalculate();
      }
    );

  [
    "simPericulosidade",
    "simInsalubridade",
    "simBeneficios",
    "simEquipamento",
    "simInicio",
    "simFim",
    "simDias",
    "simFeriados",
    "simCompensaFeriado",
    "simHoraExtraAuto",
    "simNoturnoAuto",
    "simPatronal",
    "simRat",
    "simCoopValor",
    "simCoopTaxa",
    "simCoopExtra",
    "simCoopIsencao",
    "simRescisao"
  ].forEach(id => {
    const el =
      $(id);

    if (!el) return;

    el.addEventListener(
      "input",
      simCalculate
    );

    el.addEventListener(
      "change",
      simCalculate
    );
  });

  simMinimumChanged();
}

/* =========================================================
   INICIALIZAÇÃO DO SITE
   ========================================================= */

(async () => {
  try {
    DATA =
      await api(
        "/api/site-data"
      );

    render();

    initComparator();

    track(
      "page",
      0
    );
  } catch (e) {
    console.error(
      "Erro ao carregar o Jornal Coopera Natal:",
      e
    );
  }
})();

/* =========================================================
   CONTATO
   ========================================================= */

const contactForm =
  $("contactForm");

if (contactForm) {
  contactForm
    .addEventListener(
      "submit",
      async e => {
        e.preventDefault();

        const status =
          $("contactStatus");

        if (status) {
          status.textContent =
            "Enviando...";
        }

        try {
          await api(
            "/api/contact",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body:
                JSON.stringify({
                  name:
                    $("contactName")
                      ?.value
                      .trim() ||
                    "",

                  email:
                    $("contactEmail")
                      ?.value
                      .trim() ||
                    "",

                  subject:
                    $("contactSubject")
                      ?.value
                      .trim() ||
                    "",

                  message:
                    $("contactMessage")
                      ?.value
                      .trim() ||
                    ""
                })
            }
          );

          if (status) {
            status.textContent =
              "Mensagem enviada com sucesso.";

            status.style.color =
              "#13724a";
          }

          contactForm.reset();
        } catch (err) {
          if (status) {
            status.textContent =
              "Não foi possível enviar. Tente novamente.";

            status.style.color =
              "#a61f2b";
          }
        }
      }
    );
}
