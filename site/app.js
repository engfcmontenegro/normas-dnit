(function () {
  "use strict";

  var NORMAS = window.NORMAS_DATA || [];
  var GRAPH = window.GRAPH_DATA || { nodes: [], edges: [] };

  if (window.marked && marked.setOptions) {
    marked.setOptions({ gfm: true, tables: true, breaks: false });
  }

  var byId = {};
  var byMdPath = {};
  var byStem = {};
  NORMAS.forEach(function (n) {
    byId[n.id] = n;
    byMdPath[n.md] = n.id;
    byStem[n.md.split("/").pop().replace(/\.md$/, "")] = n.id;
  });

  // [[arquivo|rótulo]] / [[arquivo]] do Obsidian -> link interno do site
  function resolveWikilinks(md) {
    // ![[arquivo.png]] do Obsidian (figuras e fórmulas recortadas) -> imagem
    md = (md || "").replace(/!\[\[([^\[\]|]+\.(?:png|jpe?g|gif|svg))(?:\|[^\[\]]*)?\]\]/gi, function (all, file) {
      var dir = /_eq\d+|_m\d+/.test(file) ? "_formulas" : "_figuras";
      return "![](../markdown/" + dir + "/" + encodeURIComponent(file) + ")";
    });
    // dentro de tabela o Obsidian exige [[arquivo\|rótulo]] (o | sem escape separa células)
    return md.replace(/\[\[([^\[\]|\\]+)(?:\\?\|([^\[\]]+))?\]\]/g, function (all, stem, label) {
      var id = byStem[stem.trim()];
      var text = label || (id ? byId[id].codigo : stem);
      return id ? "[" + text + "](#norma:" + id + ")" : text;
    });
  }

  var citedBy = {}; // id -> [ids que citam esta norma]
  var citesTo = {}; // id -> [ids citados por esta norma]
  GRAPH.edges.forEach(function (e) {
    (citesTo[e.from] = citesTo[e.from] || []).push(e.to);
    (citedBy[e.to] = citedBy[e.to] || []).push(e.from);
  });

  var TIPOS = Array.from(new Set(NORMAS.map(function (n) { return n.tipo; }).filter(Boolean))).sort();

  var state = {
    orgao: new Set(),
    tipo: new Set(),
    status: new Set(),
    search: "",
    selectedId: null,
  };

  // ---------- Normalização de texto p/ busca ----------
  function normalize(s) {
    return (s || "")
      .toString()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  }

  // ---------- Filtros ----------
  var filtroTipoEl = document.getElementById("filtro-tipo");
  TIPOS.forEach(function (t) {
    var chip = document.createElement("div");
    chip.className = "chip";
    chip.dataset.value = t;
    chip.textContent = t;
    filtroTipoEl.appendChild(chip);
  });

  function setupChipGroup(containerId, set) {
    var container = document.getElementById(containerId);
    container.addEventListener("click", function (ev) {
      var chip = ev.target.closest(".chip");
      if (!chip) return;
      var v = chip.dataset.value;
      if (set.has(v)) {
        set.delete(v);
        chip.classList.remove("active");
      } else {
        set.add(v);
        chip.classList.add("active");
      }
      renderList();
    });
  }
  setupChipGroup("filtro-orgao", state.orgao);
  setupChipGroup("filtro-tipo", state.tipo);
  setupChipGroup("filtro-status", state.status);

  document.getElementById("search").addEventListener("input", function (ev) {
    state.search = normalize(ev.target.value.trim());
    renderList();
  });

  function matches(n) {
    if (state.orgao.size && !state.orgao.has(n.orgao)) return false;
    if (state.tipo.size && !state.tipo.has(n.tipo)) return false;
    if (state.status.size && !state.status.has(n.status)) return false;
    if (state.search) {
      var haystack = normalize(n.codigo + " " + n.titulo + " " + n.conteudo);
      if (haystack.indexOf(state.search) === -1) return false;
    }
    return true;
  }

  function compareCodigo(a, b) {
    return a.codigo.localeCompare(b.codigo, "pt-BR", { numeric: true });
  }

  // ---------- Lista ----------
  var listEl = document.getElementById("norma-list");
  var countEl = document.getElementById("result-count");

  function renderList() {
    var filtered = NORMAS.filter(matches).sort(compareCodigo);
    countEl.textContent = filtered.length + " de " + NORMAS.length + " normas";
    listEl.innerHTML = "";
    var frag = document.createDocumentFragment();
    filtered.forEach(function (n) {
      var item = document.createElement("div");
      item.className = "norma-item" + (n.id === state.selectedId ? " selected" : "");
      item.dataset.id = n.id;
      var badgeOrgao = '<span class="badge ' + n.orgao.toLowerCase() + '">' + n.orgao + "</span>";
      var badgeStatus = n.status === "suspensa" ? '<span class="badge suspensa">SUSPENSA</span>' : "";
      item.innerHTML =
        '<div class="codigo">' + escapeHtml(n.codigo) + badgeOrgao + badgeStatus + "</div>" +
        '<div class="titulo">' + escapeHtml(n.titulo) + "</div>";
      frag.appendChild(item);
    });
    listEl.appendChild(frag);
  }

  listEl.addEventListener("click", function (ev) {
    var item = ev.target.closest(".norma-item");
    if (!item) return;
    selectNorma(item.dataset.id);
  });

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- Resolução de links relativos dentro do markdown ----------
  function resolveRelativePath(baseFilePath, relative) {
    var baseParts = baseFilePath.split("/");
    baseParts.pop(); // remove o nome do arquivo, fica só o diretório
    var relParts = relative.split("/");
    relParts.forEach(function (part) {
      if (part === "." || part === "") return;
      if (part === "..") baseParts.pop();
      else baseParts.push(part);
    });
    return baseParts.join("/");
  }

  // ---------- Painel de conteúdo ----------
  var contentPanel = document.getElementById("content-panel");

  function renderRelated(n) {
    var citas = (citesTo[n.id] || []).map(function (id) { return byId[id]; }).filter(Boolean);
    var citadoPor = (citedBy[n.id] || []).map(function (id) { return byId[id]; }).filter(Boolean);
    if (!citas.length && !citadoPor.length) return "";

    function linkList(arr) {
      return arr
        .sort(compareCodigo)
        .map(function (r) {
          return '<a data-id="' + r.id + '" class="rel-link">' + escapeHtml(r.codigo) + "</a>";
        })
        .join(" ");
    }

    var html = "";
    if (citas.length) {
      html += '<div class="related-box"><div class="label">Esta norma cita (' + citas.length + ")</div>" + linkList(citas) + "</div>";
    }
    if (citadoPor.length) {
      html += '<div class="related-box"><div class="label">Citada por (' + citadoPor.length + ")</div>" + linkList(citadoPor) + "</div>";
    }
    return html;
  }

  var editingId = null; // id da norma atualmente em modo de edição, se houver

  function headerHtml(n, editMode) {
    var badgeOrgao = '<span class="badge ' + n.orgao.toLowerCase() + '">' + n.orgao + "</span>";
    var badgeStatus = n.status === "suspensa" ? '<span class="badge suspensa">SUSPENSA</span>' : "";
    var actionBtn = editMode
      ? '<button class="edit-btn save" id="btn-save">Salvar</button><button class="edit-btn cancel" id="btn-cancel">Cancelar</button>'
      : '<button class="edit-btn" id="btn-edit">✎ Editar</button>';
    return (
      '<div class="content-header">' +
        '<div class="header-top">' +
          '<div class="codigo">' + escapeHtml(n.codigo) + badgeOrgao + badgeStatus + "</div>" +
          '<div class="header-actions">' + actionBtn + "</div>" +
        "</div>" +
        '<div class="meta">Tipo: ' + escapeHtml(n.tipo || "-") + " · Ano: " + (n.ano || "-") + " · " +
          '<a class="pdf-link" href="../' + n.pdf + '" target="_blank">Abrir PDF original</a>' +
          (youtubeId(n.video)
            ? ' · <button class="video-reopen" id="btn-video" type="button">▶ Assistir ao vídeo</button>'
            : "") +
        "</div>" +
      "</div>"
    );
  }

  // ---------- Barra lateral do vídeo ----------
  var videoPanel = document.getElementById("video-panel");
  var VIDEO_KEY = "video_oculto"; // preferência do usuário: barra fechada
  var videoOculto = false;
  try { videoOculto = localStorage.getItem(VIDEO_KEY) === "1"; } catch (e) {}

  function youtubeId(url) {
    var m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url || "");
    return m ? m[1] : null;
  }

  function narrowScreen() {
    return window.matchMedia && window.matchMedia("(max-width: 1150px)").matches;
  }

  function renderVideo(n) {
    var id = n && youtubeId(n.video);
    if (!id || videoOculto) {
      videoPanel.hidden = true;
      videoPanel.innerHTML = "";
      return;
    }
    var watch = "https://www.youtube.com/watch?v=" + id;
    videoPanel.innerHTML =
      '<div class="vp-head"><span class="label">Vídeo relacionado</span>' +
        '<button class="vp-close" id="vp-close" type="button" title="Ocultar a barra de vídeo">Ocultar ✕</button></div>' +
      '<div class="vp-frame"><iframe src="https://www.youtube-nocookie.com/embed/' + id + '?rel=0" ' +
        'title="' + escapeHtml(n.video_titulo || "Vídeo") + '" loading="lazy" ' +
        'allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" ' +
        'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>' +
      (n.video_titulo ? '<div class="vp-title">' + escapeHtml(n.video_titulo) + "</div>" : "") +
      (n.video_canal ? '<div class="vp-canal">' + escapeHtml(n.video_canal) + "</div>" : "") +
      '<a class="vp-open" href="' + watch + '" target="_blank" rel="noopener">Abrir no YouTube ↗</a>' +
      (n.video_auto
        ? '<div class="vp-aviso">Vídeo escolhido automaticamente (primeiro resultado da busca pelo título da norma)' +
          (n.video_relacao_baixa ? " — <b>pode não corresponder ao ensaio</b>." : ".") +
          " Para trocar, edite o campo <code>video</code> da norma.</div>"
        : "");
    videoPanel.hidden = false;
    document.getElementById("vp-close").addEventListener("click", function () {
      videoOculto = true;
      try { localStorage.setItem(VIDEO_KEY, "1"); } catch (e) {}
      renderVideo(n);
    });
  }

  function bindVideoButton(n) {
    var btn = document.getElementById("btn-video");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (narrowScreen()) {
        window.open("https://www.youtube.com/watch?v=" + youtubeId(n.video), "_blank", "noopener");
        return;
      }
      videoOculto = false;
      try { localStorage.removeItem(VIDEO_KEY); } catch (e) {}
      renderVideo(n);
    });
  }

  // referências a outras normas na cor do órgão (DNER verde, DNIT azul)
  function colorRefs(container) {
    Array.prototype.forEach.call(container.querySelectorAll('a[href^="#norma:"], a.rel-link'), function (a) {
      var id = a.dataset.id || (a.getAttribute("href") || "").slice(7);
      var nid = byId[id] ? id : byStem[id];
      var ref = nid && byId[nid];
      if (ref && ref.orgao) a.classList.add("ref-" + ref.orgao.toLowerCase());
    });
  }

  function renderMath(container) {
    if (window.renderMathInElement) {
      try {
        renderMathInElement(container, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
          throwOnError: false,
        });
      } catch (e) {
        /* ignora fórmulas malformadas */
      }
    }
  }

  // callouts do Obsidian: "> [!warning]- Título" vira um bloco destacado
  function renderCallouts(container) {
    Array.prototype.forEach.call(container.querySelectorAll("blockquote"), function (bq) {
      var first = bq.firstElementChild;
      if (!first) return;
      var m = first.innerHTML.match(/^\s*\[!(\w+)\][-+]?\s*([^\n<]*)/);
      if (!m) return;
      bq.classList.add("callout", "callout-" + m[1].toLowerCase());
      first.innerHTML = first.innerHTML.slice(m[0].length).replace(/^\s*(<br>)?\s*/, "");
      var title = document.createElement("div");
      title.className = "callout-title";
      title.textContent = m[2] || m[1];
      bq.insertBefore(title, first);
      if (!first.textContent.trim()) first.remove();
    });
  }

  function renderViewMode(n) {
    editingId = null;
    var bodyHtml;
    try {
      bodyHtml = marked.parse(resolveWikilinks(n.conteudo) || "_Conteúdo não disponível._");
    } catch (e) {
      bodyHtml = "<pre>" + escapeHtml(n.conteudo || "") + "</pre>";
    }

    contentPanel.innerHTML =
      headerHtml(n, false) +
      renderRelated(n) +
      '<div class="markdown-body">' + bodyHtml + "</div>";

    document.getElementById("btn-edit").addEventListener("click", function () {
      renderEditMode(n);
    });

    // intercepta links internos para .md e resolve para o id correspondente
    Array.prototype.forEach.call(contentPanel.querySelectorAll(".markdown-body a"), function (a) {
      var href = a.getAttribute("href") || "";
      if (href.indexOf("#norma:") === 0) {
        var wikiTarget = href.slice(7);
        a.addEventListener("click", function (ev) {
          ev.preventDefault();
          selectNorma(wikiTarget);
        });
      } else if (href.indexOf(".md") !== -1 && !/^https?:/i.test(href)) {
        var resolved = resolveRelativePath(n.md, href);
        var targetId = byMdPath[resolved];
        if (targetId) {
          a.href = "javascript:void(0)";
          a.addEventListener("click", function (ev) {
            ev.preventDefault();
            selectNorma(targetId);
          });
        }
      }
    });

    Array.prototype.forEach.call(contentPanel.querySelectorAll(".rel-link"), function (a) {
      a.addEventListener("click", function () {
        selectNorma(a.dataset.id);
      });
    });

    renderCallouts(contentPanel.querySelector(".markdown-body"));
    renderMath(contentPanel.querySelector(".markdown-body"));
    colorRefs(contentPanel);
    bindVideoButton(n);
    renderVideo(n);
    contentPanel.scrollTop = 0;
  }

  function renderEditMode(n) {
    editingId = n.id;
    contentPanel.innerHTML =
      headerHtml(n, true) +
      '<div class="editor-hint">Editando o markdown de <code>' + escapeHtml(n.md) + "</code>. " +
        "Salvar grava direto no arquivo (precisa estar rodando via <code>python scripts/serve.py</code>).</div>" +
      '<textarea class="editor-textarea" id="editor-textarea" spellcheck="false"></textarea>';

    var textarea = document.getElementById("editor-textarea");
    textarea.value = n.conteudo || "";
    bindVideoButton(n);

    document.getElementById("btn-cancel").addEventListener("click", function () {
      renderViewMode(n);
    });

    document.getElementById("btn-save").addEventListener("click", function () {
      saveEdit(n, textarea.value);
    });
  }

  function saveEdit(n, newContent) {
    var btn = document.getElementById("btn-save");
    var originalLabel = btn.textContent;
    btn.textContent = "Salvando...";
    btn.disabled = true;

    fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: n.md, content: newContent }),
    })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (j) { throw new Error(j.error || res.statusText); });
        return res.json();
      })
      .then(function () {
        n.conteudo = newContent;
        renderViewMode(n);
      })
      .catch(function (err) {
        btn.textContent = originalLabel;
        btn.disabled = false;
        window.alert(
          "Não foi possível salvar: " + err.message +
          "\n\nCertifique-se de que o site está aberto via 'python scripts/serve.py' (não abrindo o arquivo direto)."
        );
      });
  }

  function selectNorma(id) {
    var n = byId[id];
    if (!n) return;
    state.selectedId = id;

    Array.prototype.forEach.call(listEl.querySelectorAll(".norma-item"), function (el) {
      el.classList.toggle("selected", el.dataset.id === id);
    });
    var selectedEl = listEl.querySelector('.norma-item[data-id="' + cssEscape(id) + '"]');
    if (selectedEl) selectedEl.scrollIntoView({ block: "nearest" });

    renderViewMode(n);
  }

  function cssEscape(s) {
    return s.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  // ---------- Abas ----------
  var tabNormas = document.getElementById("tab-normas");
  var tabRede = document.getElementById("tab-rede");
  var viewNormas = document.getElementById("view-normas");
  var viewRede = document.getElementById("view-rede");
  var networkInitialized = false;
  var networkInstance = null;

  var tabControle = document.getElementById("tab-controle");
  var viewControle = document.getElementById("view-controle");

  function showTab(tab, view) {
    [tabNormas, tabRede, tabControle].forEach(function (t) { t.classList.toggle("active", t === tab); });
    [viewNormas, viewRede, viewControle].forEach(function (v) { v.classList.toggle("active", v === view); });
  }

  tabNormas.addEventListener("click", function () { showTab(tabNormas, viewNormas); });
  tabControle.addEventListener("click", function () { showTab(tabControle, viewControle); });

  tabRede.addEventListener("click", function () {
    showTab(tabRede, viewRede);
    if (!networkInitialized) {
      networkInitialized = true;
      // adia a criação até o layout da aba (agora visível) ser calculado,
      // senão o canvas nasce com largura 0 (aba ainda estava display:none)
      requestAnimationFrame(function () {
        requestAnimationFrame(initNetwork);
      });
    } else if (networkInstance) {
      networkInstance.redraw();
    }
  });

  // ---------- Grafo de correlação ----------
  function initNetwork() {
    var degree = {};
    GRAPH.edges.forEach(function (e) {
      degree[e.from] = (degree[e.from] || 0) + 1;
      degree[e.to] = (degree[e.to] || 0) + 1;
    });

    var LABEL_ZOOM_THRESHOLD = 1.4;

    var nodes = new vis.DataSet(
      GRAPH.nodes.map(function (n) {
        var d = degree[n.id] || 0;
        return {
          id: n.id,
          label: n.label,
          title: n.label + " — " + n.titulo,
          group: n.orgao,
          value: 3 + d,
          x: n.x || 0,
          y: n.y || 0,
          font: { size: 0 }, // rótulos começam ocultos; só aparecem com zoom (ver toggleLabels)
        };
      })
    );

    var edges = new vis.DataSet(
      GRAPH.edges.map(function (e, i) {
        return { id: i, from: e.from, to: e.to, arrows: { to: { scaleFactor: 0.4 } } };
      })
    );

    document.getElementById("rede-info").textContent =
      GRAPH.nodes.length + " normas · " + GRAPH.edges.length + " referências cruzadas detectadas";

    var container = document.getElementById("network");
    var data = { nodes: nodes, edges: edges };
    var options = {
      groups: {
        DNER: { color: { background: "#34c38f", border: "#218c67" } },
        DNIT: { color: { background: "#4f8cff", border: "#2e5fc7" } },
      },
      nodes: {
        shape: "dot",
        font: {
          color: "#e6e8ec",
          size: 13,
          face: "-apple-system, Segoe UI, Roboto, Arial, sans-serif",
          strokeWidth: 4,
          strokeColor: "#0f1115",
        },
        scaling: { min: 4, max: 24 },
      },
      edges: {
        color: { color: "#3a4050", highlight: "#4f8cff", opacity: 0.5 },
        width: 0.5,
        smooth: { type: "continuous", roundness: 0.5 },
      },
      // parte das posições pré-calculadas no build (scripts/build_graph.py com
      // networkx) para não nascer do zero/aleatório, e usa física suave com
      // gravidade central (evita o "explodir pra longe" que uma repulsão forte
      // sem freio causava com ~400 nós) para a rede continuar se acomodando
      // com o tempo e reagir a arrastos. NÃO usar adaptiveTimestep aqui: em
      // combinação com forceAtlas2Based ele pode travar o cálculo de
      // estabilização indefinidamente com grafos deste tamanho.
      physics: {
        enabled: true,
        solver: "barnesHut",
        barnesHut: {
          gravitationalConstant: -800,
          centralGravity: 0.15,
          springLength: 70,
          springConstant: 0.03,
          damping: 0.6,
          avoidOverlap: 0.4,
        },
        maxVelocity: 20,
        minVelocity: 1,
        stabilization: { enabled: true, iterations: 150, fit: true },
      },
      interaction: { hover: true, tooltipDelay: 100, dragNodes: true, zoomView: true },
    };

    var network = new vis.Network(container, data, options);
    networkInstance = network;
    network.once("stabilizationIterationsDone", function () {
      network.fit({ animation: false });
      network.redraw();
      updateLabelVisibility();
    });

    // com ~400 nós, mostrar todos os rótulos o tempo todo vira uma poluição
    // visual ilegível; só revela o texto quando o zoom está próximo o
    // suficiente, e mostra sempre o rótulo do nó sob o mouse (hover)
    var labelsVisible = false;
    var hoveredId = null;
    function updateLabelVisibility() {
      var shouldShow = network.getScale() >= LABEL_ZOOM_THRESHOLD;
      if (shouldShow === labelsVisible) return;
      labelsVisible = shouldShow;
      var updates = nodes.getIds().map(function (id) {
        return { id: id, font: { size: shouldShow || id === hoveredId ? 13 : 0 } };
      });
      nodes.update(updates);
    }
    network.on("zoom", updateLabelVisibility);

    network.on("hoverNode", function (params) {
      hoveredId = params.node;
      if (!labelsVisible) nodes.update({ id: params.node, font: { size: 13 } });
    });
    network.on("blurNode", function (params) {
      hoveredId = null;
      if (!labelsVisible) nodes.update({ id: params.node, font: { size: 0 } });
    });

    network.on("click", function (params) {
      if (params.nodes.length) {
        var id = params.nodes[0];
        selectNorma(id);
        tabNormas.click();
      }
    });
  }

  // ---------- Controle de serviços (plano de ensaios por ES) ----------
  // dados: site/data/controle_data.js (gerado por scripts/bundle_controle.py a partir de data/controle/*.json)
  function initControle() {
    var PLANOS = (window.CONTROLE_DATA || []).filter(function (p) { return byId[p.es]; });
    var ETAPAS = [
      { key: "materiais", titulo: "Materiais — recebimento e caracterização", letra: "M" },
      { key: "execucao", titulo: "Execução — controle durante o serviço", letra: "E" },
      { key: "produto", titulo: "Produto acabado — verificação final", letra: "P" },
    ];
    var ctl = { modo: "checklist", es: null, busca: "", area: "Pavimentação" };
    var listEl = document.getElementById("ctl-list");
    var panel = document.getElementById("ctl-panel");

    PLANOS.sort(function (a, b) { return a.servico.localeCompare(b.servico, "pt-BR"); });
    var planoPorEs = {};
    PLANOS.forEach(function (p) { planoPorEs[p.es] = p; });

    function orgaoClass(id) {
      var n = byId[id];
      return n && n.orgao === "DNER" ? "ref-dner" : "ref-dnit";
    }
    function refLink(id) {
      var n = byId[id];
      if (!n) return "";
      return '<a class="ctl-ref ' + orgaoClass(id) + '" data-id="' + escapeHtml(id) + '" title="' +
        escapeHtml(n.titulo) + '">' + escapeHtml(n.codigo) + "</a>";
    }
    function abrirNorma(id) {
      selectNorma(id);
      showTab(tabNormas, viewNormas);
    }

    function lerMarcas(es) {
      try { return JSON.parse(localStorage.getItem("ctl:" + es) || "[]"); } catch (e) { return []; }
    }
    function gravarMarcas(es, marcas) {
      try { localStorage.setItem("ctl:" + es, JSON.stringify(marcas)); } catch (e) { /* sem storage */ }
    }

    function textoPlano(p) {
      var es = byId[p.es];
      return normalize([p.servico, es.codigo, es.titulo].concat(p.itens.map(function (it) {
        return it.ensaio + " " + (it.citado || "");
      })).join(" "));
    }
    PLANOS.forEach(function (p) { p._busca = textoPlano(p); });

    function filtrados() {
      var q = normalize(ctl.busca.trim());
      return PLANOS.filter(function (p) {
        return (!ctl.area || p.area === ctl.area) && (!q || p._busca.indexOf(q) !== -1);
      });
    }

    // filtro por área (uma de cada vez; "Todas" limpa) — a matriz com todas as ES fica larga demais
    var AREAS = {};
    PLANOS.forEach(function (p) { AREAS[p.area] = (AREAS[p.area] || 0) + 1; });
    if (!AREAS[ctl.area]) ctl.area = "";
    var areaEl = document.getElementById("ctl-area");
    function renderAreas() {
      areaEl.innerHTML = [["", "Todas", PLANOS.length]].concat(Object.keys(AREAS).sort(function (a, b) {
        return AREAS[b] - AREAS[a] || a.localeCompare(b, "pt-BR");
      }).map(function (a) { return [a, a, AREAS[a]]; })).map(function (x) {
        return '<div class="chip' + (x[0] === ctl.area ? " active" : "") + '" data-area="' + escapeHtml(x[0]) + '">' +
          escapeHtml(x[1]) + " (" + x[2] + ")</div>";
      }).join("");
    }
    areaEl.addEventListener("click", function (ev) {
      var chip = ev.target.closest(".chip");
      if (!chip) return;
      ctl.area = chip.dataset.area;
      render();
    });

    function renderLista() {
      var arr = filtrados();
      document.getElementById("ctl-count").textContent =
        arr.length + " de " + PLANOS.length + " serviços" + (ctl.area ? " · " + ctl.area : "");
      listEl.innerHTML = arr.map(function (p) {
        var es = byId[p.es];
        return '<div class="norma-item' + (p.es === ctl.es && ctl.modo === "checklist" ? " selected" : "") +
          '" data-es="' + escapeHtml(p.es) + '"><div class="codigo">' + escapeHtml(p.servico) + "</div>" +
          '<div class="titulo">' + escapeHtml(es.codigo) + ' <span class="badge ' + es.orgao.toLowerCase() + '">' +
          es.orgao + "</span> · " + p.itens.length + " itens</div></div>";
      }).join("");
    }

    function celulaNorma(it) {
      var partes = [];
      if (it.norma) partes.push(refLink(it.norma));
      (it.outras || []).forEach(function (o) { partes.push(refLink(o)); });
      var html = partes.join(" ");
      // o código citado só é repetido quando não há link ou quando traz alternativas fora do acervo
      if (it.citado && (!it.norma || (/,| ou | e /.test(it.citado) && partes.length < 2))) {
        html += '<div class="ctl-citado">' + (it.norma ? "citado: " : "") + escapeHtml(it.citado) +
          (it.norma ? "" : ' <span class="ctl-fora">(fora do acervo)</span>') + "</div>";
      }
      if (it.norma_atual) html += '<div class="ctl-atual">versão no acervo: ' + refLink(it.norma_atual) + "</div>";
      return html || '<span class="ctl-fora">—</span>';
    }

    function renderChecklist() {
      var p = planoPorEs[ctl.es];
      if (!p) {
        panel.innerHTML = '<div class="empty-state">Selecione um serviço à esquerda para ver os ensaios e verificações exigidos.</div>';
        return;
      }
      var es = byId[p.es];
      var marcas = lerMarcas(p.es);
      var refs = {};
      p.itens.forEach(function (it) {
        [it.norma, it.norma_atual].concat(it.outras || []).forEach(function (id) { if (id) refs[id] = 1; });
      });
      var html = '<div class="content-header"><div class="header-top"><div>' +
        '<div class="codigo">' + escapeHtml(p.servico) + "</div>" +
        '<div class="meta">' + refLink(p.es) + " — " + escapeHtml(es.titulo) + "</div>" +
        '<div class="meta">' + p.itens.length + " ensaios/verificações · " + Object.keys(refs).length +
        ' normas do acervo · <span id="ctl-progresso"></span></div></div>' +
        '<div class="header-actions"><button class="edit-btn" id="ctl-print">Imprimir</button>' +
        '<button class="edit-btn" id="ctl-limpar">Limpar marcações</button></div></div></div>';

      ETAPAS.forEach(function (et, n) {
        var itens = p.itens.map(function (it, i) { return { it: it, i: i }; })
          .filter(function (x) { return x.it.etapa === et.key; });
        if (!itens.length) return;
        html += '<h3 class="ctl-etapa ctl-' + et.key + '"><span class="ctl-letra">' + et.letra + "</span>" +
          (n + 1) + ". " + et.titulo + ' <span class="ctl-n">' + itens.length + "</span></h3>";
        html += '<table class="ctl-tabela"><thead><tr><th></th><th>Ensaio / verificação</th><th>Norma</th>' +
          "<th>Frequência</th><th>Critério de aceitação</th><th>Seção</th></tr></thead><tbody>";
        var grupo = null;
        itens.forEach(function (x) {
          var it = x.it;
          if (it.grupo !== grupo) {
            grupo = it.grupo;
            if (grupo) html += '<tr class="ctl-grupo"><td colspan="6">' + escapeHtml(grupo) + "</td></tr>";
          }
          var ok = marcas.indexOf(x.i) !== -1;
          html += '<tr class="' + (ok ? "feito" : "") + '"><td><input type="checkbox" data-i="' + x.i + '"' +
            (ok ? " checked" : "") + "></td>" +
            '<td class="ctl-ensaio">' + escapeHtml(it.ensaio) +
            (it.condicao ? '<div class="ctl-cond">' + escapeHtml(it.condicao) + "</div>" : "") +
            (it.obs ? '<div class="ctl-obs">' + escapeHtml(it.obs) + "</div>" : "") + "</td>" +
            "<td>" + celulaNorma(it) + "</td>" +
            "<td>" + escapeHtml(it.frequencia) + "</td>" +
            '<td class="ctl-crit">' + escapeHtml(it.criterio) + "</td>" +
            '<td class="ctl-secao">' + escapeHtml(it.secao || "") + "</td></tr>";
        });
        html += "</tbody></table>";
      });
      if (p.notas && p.notas.length) {
        html += '<div class="related-box ctl-notas"><div class="label">Observações gerais</div><ul>' +
          p.notas.map(function (t) { return "<li>" + escapeHtml(t) + "</li>"; }).join("") + "</ul></div>";
      }
      html += '<p class="ctl-aviso">Resumo extraído da norma para consulta rápida — em caso de dúvida prevalece o texto da ES e do projeto.</p>';
      panel.innerHTML = html;
      colorRefs(panel);
      panel.scrollTop = 0;

      function progresso() {
        var m = lerMarcas(p.es).length;
        document.getElementById("ctl-progresso").textContent = m + " de " + p.itens.length + " conferidos";
      }
      progresso();
      Array.prototype.forEach.call(panel.querySelectorAll('input[type="checkbox"]'), function (cb) {
        cb.addEventListener("change", function () {
          var i = Number(cb.dataset.i);
          var m = lerMarcas(p.es).filter(function (x) { return x !== i; });
          if (cb.checked) m.push(i);
          gravarMarcas(p.es, m);
          cb.closest("tr").classList.toggle("feito", cb.checked);
          progresso();
        });
      });
      document.getElementById("ctl-print").addEventListener("click", function () { window.print(); });
      document.getElementById("ctl-limpar").addEventListener("click", function () {
        gravarMarcas(p.es, []);
        renderChecklist();
      });
    }

    function renderMatriz() {
      var cols = filtrados();
      var linhas = {};
      cols.forEach(function (p, c) {
        p.itens.forEach(function (it) {
          [it.norma, it.norma_atual].concat(it.outras || []).forEach(function (id) {
            if (!id || id === p.es) return;
            var l = linhas[id] || (linhas[id] = { id: id, cel: {}, n: 0 });
            var cel = l.cel[c] || (l.cel[c] = { etapas: {}, ensaios: [] });
            cel.etapas[it.etapa] = 1;
            cel.ensaios.push(it.ensaio + " — " + it.criterio);
          });
        });
      });
      var ordemTipo = { ME: 0, EM: 1, PRO: 2, ES: 3, IE: 4, CLA: 5, TER: 6, PAD: 7 };
      var rows = Object.keys(linhas).map(function (id) {
        var l = linhas[id];
        l.n = Object.keys(l.cel).length;
        return l;
      }).sort(function (a, b) {
        var na = byId[a.id], nb = byId[b.id];
        return (ordemTipo[na.tipo] - ordemTipo[nb.tipo]) || (b.n - a.n) || compareCodigo(na, nb);
      });

      var html = '<div class="content-header"><div class="codigo">Matriz ES × ensaios' +
        (ctl.area ? " — " + escapeHtml(ctl.area) : "") + "</div>" +
        '<div class="meta">' + cols.length + " serviços × " + rows.length +
        " normas do acervo citadas no controle. Letras: " +
        '<span class="ctl-letra ctl-materiais">M</span> materiais · <span class="ctl-letra ctl-execucao">E</span> execução · ' +
        '<span class="ctl-letra ctl-produto">P</span> produto acabado. Passe o mouse para ver o ensaio e o critério; ' +
        "clique no cabeçalho de uma coluna para abrir o checklist do serviço.</div></div>";
      html += '<div class="ctl-matriz-wrap"><table class="ctl-matriz"><thead><tr><th class="ctl-canto">Norma de ensaio</th>' +
        '<th class="ctl-tot">nº</th>' +
        cols.map(function (p) {
          return '<th class="ctl-col" data-es="' + escapeHtml(p.es) + '" title="' + escapeHtml(p.servico + " — " + byId[p.es].codigo) +
            '"><div><b>' + escapeHtml(byId[p.es].codigo.replace(/^DNER-ES |^DNIT |-ES$/g, "")) + "</b> " +
            escapeHtml(p.servico) + "</div></th>";
        }).join("") + "</tr></thead><tbody>";
      var tipoAtual = null;
      rows.forEach(function (l) {
        var n = byId[l.id];
        if (n.tipo !== tipoAtual) {
          tipoAtual = n.tipo;
          html += '<tr class="ctl-grupo"><td colspan="' + (cols.length + 2) + '">' + tipoAtual + "</td></tr>";
        }
        html += '<tr><th class="ctl-linha">' + refLink(l.id) + '<div class="ctl-lt">' + escapeHtml(n.titulo) + "</div></th>" +
          '<td class="ctl-tot">' + l.n + "</td>";
        cols.forEach(function (p, c) {
          var cel = l.cel[c];
          if (!cel) { html += "<td></td>"; return; }
          html += '<td class="ctl-cel" title="' + escapeHtml(cel.ensaios.join("\n")) + '">' +
            ETAPAS.filter(function (et) { return cel.etapas[et.key]; }).map(function (et) {
              return '<span class="ctl-letra ctl-' + et.key + '">' + et.letra + "</span>";
            }).join("") + "</td>";
        });
        html += "</tr>";
      });
      html += "</tbody></table></div>";
      panel.innerHTML = html;
      colorRefs(panel);
      Array.prototype.forEach.call(panel.querySelectorAll(".ctl-col"), function (th) {
        th.addEventListener("click", function () { selecionar(th.dataset.es); });
      });
    }

    function render() {
      panel.classList.toggle("ctl-modo-matriz", ctl.modo === "matriz");
      renderAreas();
      renderLista();
      if (ctl.modo === "matriz") renderMatriz(); else renderChecklist();
    }

    function selecionar(es) {
      ctl.es = es;
      if (planoPorEs[es] && ctl.area && planoPorEs[es].area !== ctl.area) ctl.area = planoPorEs[es].area;
      ctl.modo = "checklist";
      Array.prototype.forEach.call(document.querySelectorAll("#ctl-modo .chip"), function (c) {
        c.classList.toggle("active", c.dataset.modo === "checklist");
      });
      render();
    }

    listEl.addEventListener("click", function (ev) {
      var item = ev.target.closest(".norma-item");
      if (item) selecionar(item.dataset.es);
    });
    panel.addEventListener("click", function (ev) {
      var a = ev.target.closest("a.ctl-ref");
      if (a) { ev.preventDefault(); abrirNorma(a.dataset.id); }
    });
    document.getElementById("ctl-modo").addEventListener("click", function (ev) {
      var chip = ev.target.closest(".chip");
      if (!chip) return;
      ctl.modo = chip.dataset.modo;
      Array.prototype.forEach.call(this.querySelectorAll(".chip"), function (c) { c.classList.toggle("active", c === chip); });
      render();
    });
    document.getElementById("ctl-search").addEventListener("input", function (ev) {
      ctl.busca = ev.target.value;
      render();
    });
    render();
    return {
      selecionar: selecionar,
      matriz: function () { document.querySelector('#ctl-modo .chip[data-modo="matriz"]').click(); },
    };
  }

  renderList();
  var controle = initControle();

  // index.html#norma:<id> abre direto a norma (links da página de revisão, favoritos)
  function openFromHash() {
    var h = decodeURIComponent(location.hash || "");
    var m = /^#norma:(.+)$/.exec(h);
    if (m && byId[m[1]] && m[1] !== state.selectedId) selectNorma(m[1]);
    // #controle, #controle:matriz ou #controle:<id da ES> abrem a aba de controle de serviços
    m = /^#controle(?::(.+))?$/.exec(h);
    if (m) {
      showTab(tabControle, viewControle);
      if (m[1] === "matriz") controle.matriz();
      else if (m[1]) controle.selecionar(m[1]);
    }
  }
  window.addEventListener("hashchange", openFromHash);
  openFromHash();
})();
