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
  const d = new Date(v.length === 10 ? `${v}T12:00:00` : v);
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
      return u.pathname.split("/shorts/")[1].split("/")[0];
    }

    if (u.pathname.includes("/embed/")) {
      return u.pathname.split("/embed/")[1].split("/")[0];
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
   FAIXA "AGORA"
   ========================================================= */

let BREAKING_ITEMS = [];
let BREAKING_INDEX = 0;
let BREAKING_TIMER = null;

function relativePublished(value) {
  if (!value) return "";

  const normalized =
    value.length === 10
      ? `${value}T12:00:00`
      : value;

  const d = new Date(normalized);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  const diff = Date.now() - d.getTime();

  if (diff < 0) {
    return "publicado agora";
  }

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) {
    return "publicado agora";
  }

  if (minutes < 60) {
    return `publicado há ${minutes} min`;
  }

  if (hours < 24) {
    return `publicado há ${hours} h`;
  }

  if (days === 1) {
    return "publicado ontem";
  }

  if (days < 30) {
    return `publicado há ${days} dias`;
  }

  return `publicado em ${d.toLocaleDateString("pt-BR")}`;
}

function setupBreakingTicker(articles, fallback) {
  const bar = $("breakingText");

  if (!bar) return;

  BREAKING_ITEMS = (articles || []).slice(0, 10);

  if (!BREAKING_ITEMS.length) {
    bar.textContent = fallback || "";
    return;
  }

  showBreaking(0);

  const breakingBar = bar.closest(".breaking");

  if (breakingBar) {
    breakingBar.addEventListener("mouseenter", () => {
      clearInterval(BREAKING_TIMER);
    });

    breakingBar.addEventListener("mouseleave", () => {
      startBreakingTimer();
    });
  }

  startBreakingTimer();
}

function showBreaking(index) {
  if (!BREAKING_ITEMS.length) return;

  BREAKING_INDEX = index;

  const article = BREAKING_ITEMS[index];
  const bar = $("breakingText");

  if (!bar) return;

  bar.innerHTML = `
    <button class="breaking-story" type="button">
      <span class="breaking-title">
        ${esc(article.title || "")}
      </span>

      <span class="breaking-time">
        • ${relativePublished(article.published_at)}
      </span>
    </button>

    <span class="breaking-count">
      ${index + 1}/${BREAKING_ITEMS.length}
    </span>
  `;

  const button = bar.querySelector(".breaking-story");

  if (button) {
    button.onclick = () => openArticle(article.id);
  }
}

function startBreakingTimer() {
  clearInterval(BREAKING_TIMER);

  if (BREAKING_ITEMS.length > 1) {
    BREAKING_TIMER = setInterval(() => {
      const next =
        (BREAKING_INDEX + 1) %
        BREAKING_ITEMS.length;

      showBreaking(next);
    }, 5200);
  }
}

/* =========================================================
   CARROSSEL PRINCIPAL
   ========================================================= */

let HERO_ITEMS = [];
let HERO_INDEX = 0;
let HERO_TIMER = null;

function setupHeroCarousel(articles) {
  HERO_ITEMS = (articles || []).slice(0, 8);

  if (!HERO_ITEMS.length) return;

  const main = $("heroMain");

  if (!main) return;

  if (!$("heroControls")) {
    const controls = document.createElement("div");

    controls.id = "heroControls";
    controls.className = "hero-controls";

    controls.innerHTML = `
      <button
        id="heroPrev"
        aria-label="Notícia anterior"
        type="button"
      >
        ‹
      </button>

      <div
        id="heroDots"
        class="hero-dots"
      ></div>

      <button
        id="heroNext"
        aria-label="Próxima notícia"
        type="button"
      >
        ›
      </button>
    `;

    main.appendChild(controls);

    $("heroPrev").onclick = e => {
      e.stopPropagation();

      const prev =
        (HERO_INDEX - 1 + HERO_ITEMS.length) %
        HERO_ITEMS.length;

      showHero(prev, true);
    };

    $("heroNext").onclick = e => {
      e.stopPropagation();

      const next =
        (HERO_INDEX + 1) %
        HERO_ITEMS.length;

      showHero(next, true);
    };

    main.addEventListener("mouseenter", () => {
      clearInterval(HERO_TIMER);
    });

    main.addEventListener("mouseleave", () => {
      startHeroTimer();
    });
  }

  $("heroDots").innerHTML =
    HERO_ITEMS.map((_, i) => `
      <button
        class="hero-dot"
        data-i="${i}"
        aria-label="Abrir manchete ${i + 1}"
        type="button"
      ></button>
    `).join("");

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

  const article = HERO_ITEMS[index];

  $("heroImg").src =
    article.image_url || "";

  $("heroCat").textContent =
    article.category || "";

  $("heroTitle").textContent =
    article.title || "";

  $("heroSummary").textContent =
    article.summary || "";

  $("heroMain").onclick = () => {
    openArticle(article.id);
  };

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
    HERO_TIMER = setInterval(() => {
      const next =
        (HERO_INDEX + 1) %
        HERO_ITEMS.length;

      showHero(next, false);
    }, 6500);
  }
}

/* =========================================================
   CARDS
   ========================================================= */

function articleCard(article) {
  return `
    <article
      class="card"
      onclick="openArticle(${article.id})"
      style="cursor:pointer"
    >
      ${
        article.image_url
          ? `
            <img
              src="${esc(article.image_url)}"
              alt=""
            >
          `
          : ""
      }

      <div class="card-body">
        <div class="cat">
          ${esc(article.category || "")}
        </div>

        <h3>
          ${esc(article.title || "")}
        </h3>

        <p>
          ${esc(article.summary || "")}
        </p>

        <div class="meta">
          ${esc(article.author || "Redação")}
          •
          ${fmtDate(article.published_at)}
        </div>
      </div>
    </article>
  `;
}

/* =========================================================
   RENDER GERAL
   ========================================================= */

function render() {
  const settings =
    DATA.settings || {};

  document.documentElement.style.setProperty(
    "--primary",
    settings.primary_color || "#0a4f8a"
  );

  document.documentElement.style.setProperty(
    "--accent",
    settings.accent_color || "#a61f2b"
  );

  $("brand").textContent =
    settings.site_name ||
    "Jornal Coopera Natal";

  $("footerBrand").textContent =
    settings.site_name ||
    "Jornal Coopera Natal";

  $("tagline").textContent =
    settings.tagline || "";

  $("footerAbout").textContent =
    settings.about_text || "";

  const articles =
    DATA.articles || [];

  setupBreakingTicker(
    articles,
    settings.breaking_text || ""
  );

  setupHeroCarousel(articles);

  /* Destaques laterais */

  const side =
    articles.slice(1, 3);

  $("heroSide").innerHTML =
    side.map(article => `
      <article
        class="side-story"
        onclick="openArticle(${article.id})"
      >
        ${
          article.image_url
            ? `
              <img
                src="${esc(article.image_url)}"
                alt=""
              >
            `
            : ""
        }

        <div>
          <div class="cat">
            ${esc(article.category || "")}
          </div>

          <h3>
            ${esc(article.title || "")}
          </h3>

          <p>
            ${esc(article.summary || "")}
          </p>
        </div>
      </article>
    `).join("");

  /* Notícias */

  $("newsGrid").innerHTML =
    articles
      .filter(
        article =>
          article.content_type !==
          "entrevista"
      )
      .slice(0, 12)
      .map(articleCard)
      .join("");

  /* Entrevistas */

  $("interviewGrid").innerHTML =
    articles
      .filter(
        article =>
          article.content_type ===
            "entrevista" ||
          article.category ===
            "Entrevistas"
      )
      .slice(0, 9)
      .map(articleCard)
      .join("") ||
    "<p>Nenhuma entrevista publicada ainda.</p>";

  /* Cooperativas */

  $("coopGrid").innerHTML =
    (DATA.cooperatives || [])
      .map(coop => `
        <article class="coop-card">
          ${
            coop.image_url
              ? `
                <img
                  src="${esc(coop.image_url)}"
                  alt="${esc(coop.name || "")}"
                >
              `
              : ""
          }

          <div class="coop-body">
            <div class="cat">
              ${esc(coop.type || "Cooperativa")}
            </div>

            <h3>
              ${esc(coop.name || "")}
            </h3>

            <p>
              ${esc(coop.description || "")}
            </p>

            ${
              coop.website
                ? `
                  <a
                    class="btn primary"
                    target="_blank"
                    rel="noopener"
                    href="${esc(coop.website)}"
                    onclick="track('coop',${coop.id})"
                  >
                    Conhecer
                  </a>
                `
                : ""
            }

            ${
              coop.instagram
                ? `
                  <a
                    class="btn light"
                    target="_blank"
                    rel="noopener"
                    href="${esc(coop.instagram)}"
                    onclick="track('coop',${coop.id})"
                  >
                    Instagram
                  </a>
                `
                : ""
            }
          </div>
        </article>
      `)
      .join("");

  /* Links úteis */

  $("linkGrid").innerHTML =
    (DATA.links || [])
      .map(link => `
        <a
          class="link-card"
          target="_blank"
          rel="noopener"
          href="${esc(link.url)}"
          onclick="track('link',${link.id})"
        >
          <b>
            ${esc(link.name)}
          </b>

          <span>
            ${esc(link.description || "")}
          </span>

          <em>
            ${esc(link.category || "Serviço")}
            →
          </em>
        </a>
      `)
      .join("");

  /* FAQ */

  $("faqList").innerHTML =
    (DATA.faqs || [])
      .map((faq, i) => `
        <details ${i === 0 ? "open" : ""}>
          <summary>
            ${esc(faq.question)}
          </summary>

          <p>
            ${esc(faq.answer)}
          </p>
        </details>
      `)
      .join("");

  renderAds();
}

/* =========================================================
   PUBLICIDADE
   ========================================================= */

function renderAds() {
  ["top", "middle"].forEach(place => {
    const host =
      $(place === "top"
        ? "adTop"
        : "adMiddle");

    if (!host) return;

    const ad =
      (DATA.ads || []).find(
        item =>
          item.placement === place
      );

    if (!ad) {
      host.innerHTML = "";
      return;
    }

    const sessionKey =
      `closed_ad_${ad.id}`;

    if (
      sessionStorage.getItem(
        sessionKey
      )
    ) {
      host.innerHTML = "";
      return;
    }

    host.innerHTML = `
      <aside class="ad">
        <button
          class="ad-x"
          type="button"
          aria-label="Fechar anúncio"
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
              ${esc(ad.body || "")}
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
      .querySelector(".ad-x")
      .onclick = () => {
        sessionStorage.setItem(
          sessionKey,
          "1"
        );

        host.innerHTML = "";
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

  const article =
    (DATA.articles || []).find(
      item => item.id === id
    );

  if (!article) return;

  const videoId =
    youtubeId(
      article.youtube_url
    );

  $("articleView").innerHTML = `
    <div class="cat">
      ${esc(article.category || "")}
    </div>

    <h1>
      ${esc(article.title)}
    </h1>

    <div class="article-summary">
      ${esc(article.summary || "")}
    </div>

    <div class="meta">
      ${esc(article.author || "Redação")}
      •
      ${fmtDate(article.published_at)}
    </div>

    ${
      article.image_url
        ? `
          <img
            src="${esc(article.image_url)}"
            alt=""
          >
        `
        : ""
    }

    ${
      videoId
        ? `
          <div class="video-wrap">
            <iframe
              src="https://www.youtube-nocookie.com/embed/${esc(videoId)}"
              title="${esc(article.title)}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
        `
        : ""
    }

    <div class="article-content">
      ${article.body_html || ""}
    </div>

    <div
      style="
        margin-top:14px;
        display:flex;
        gap:7px;
        flex-wrap:wrap;
      "
    >
      ${
        article.extra_url
          ? `
            <a
              class="btn primary"
              target="_blank"
              rel="noopener"
              href="${esc(article.extra_url)}"
            >
              ${esc(
                article.extra_label ||
                "Abrir link"
              )}
            </a>
          `
          : ""
      }

      ${
        article.source_url
          ? `
            <a
              class="btn light"
              target="_blank"
              rel="noopener"
              href="${esc(article.source_url)}"
            >
              ${esc(
                article.source_name ||
                "Fonte"
              )}
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
      behavior: "smooth",
      block: "start"
    });
}

window.openArticle =
  openArticle;

window.closeArticle = () => {
  $("articleView")
    .classList
    .remove("active");
};

window.track = track;

/* =========================================================
   FORMULÁRIO DE CONTATO
   ========================================================= */

const contactForm =
  $("contactForm");

if (contactForm) {
  contactForm.addEventListener(
    "submit",
    async e => {
      e.preventDefault();

      const status =
        $("contactStatus");

      status.textContent =
        "Enviando...";

      try {
        await api(
          "/api/contact",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              name:
                $("contactName")
                  .value
                  .trim(),

              email:
                $("contactEmail")
                  .value
                  .trim(),

              subject:
                $("contactSubject")
                  .value
                  .trim(),

              message:
                $("contactMessage")
                  .value
                  .trim()
            })
          }
        );

        status.textContent =
          "Mensagem enviada com sucesso.";

        status.style.color =
          "#13724a";

        contactForm.reset();
      } catch (err) {
        status.textContent =
          "Não foi possível enviar. Tente novamente.";

        status.style.color =
          "#a61f2b";
      }
    }
  );
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

(async () => {
  try {
    DATA =
      await api(
        "/api/site-data"
      );

    render();

    track(
      "page",
      0
    );
  } catch (error) {
    console.error(
      "Erro ao carregar o Jornal Coopera Natal:",
      error
    );
  }
})();
