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
      var badgeStatus = n.status === "suspensa" ? '<span class="badge suspensa">SUSPENSA</span>'
        : n.status === "cancelada" ? '<span class="badge suspensa">CANCELADA</span>' : "";
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

  // ---------- Dependências entre métodos de ensaio (data/dependencias.json) ----------
  var DEPS = window.DEPENDENCIAS || {};
  var VIA_TXT = { substituida: "substituída por", outra_edicao: "no acervo em outra edição:", cancelada: "use no lugar" };

  function depItem(d, nivel, caminho, raiz) {
    var html;
    if (d.via === "cancelada" && d.id && byId[d.id] && byId[d.id].status === "cancelada") {
      html = '<a data-id="' + escapeHtml(d.id) + '" class="rel-link">' + escapeHtml(byId[d.id].codigo) + "</a> " +
        '<span class="dep-tit">' + escapeHtml(byId[d.id].titulo) + "</span> " +
        '<span class="dep-via dep-falta">cancelada pelo DNIT em ' + escapeHtml(d.cancelada) + "</span>" +
        (d.sucessora && byId[d.sucessora] ? ' <span class="dep-via">(use no lugar <a data-id="' + escapeHtml(d.sucessora) +
          '" class="rel-link">' + escapeHtml(byId[d.sucessora].codigo) + "</a>)</span>" : "");
    } else if (d.via === "acervo" || d.via === "tecnica") {
      html = '<a data-id="' + escapeHtml(d.id) + '" class="rel-link">' + escapeHtml(byId[d.id].codigo) + "</a> " +
        '<span class="dep-tit">' + escapeHtml(byId[d.id].titulo) + "</span>" +
        (d.via === "tecnica" ? ' <span class="dep-via dep-tec" title="' + escapeHtml(d.nota || "") +
          '">dependência técnica (não citada na norma)' + (d.nota ? ": " + escapeHtml(d.nota) : "") + "</span>" : "");
    } else {
      html = '<span class="dep-fora">' + escapeHtml(d.codigo) + "</span> " +
        (d.titulo ? '<span class="dep-tit">' + escapeHtml(d.titulo) + "</span> " : "");
      if (d.via === "cancelada") {
        html += '<span class="dep-via dep-falta">cancelada pelo DNIT em ' + escapeHtml(d.cancelada) + "</span> ";
      }
      if (d.id) {
        html += '<span class="dep-via">(' + VIA_TXT[d.via] + ' <a data-id="' + escapeHtml(d.id) + '" class="rel-link">' +
          escapeHtml(byId[d.id].codigo) + "</a>)</span>";
      } else if (d.via !== "cancelada") {
        html += '<span class="dep-via dep-falta">fora do acervo</span>';
      }
    }
    // cadeia: o que o método citado, por sua vez, exige (sem repetir quem já está no caminho)
    var filhos = d.id && d.via !== "faltante" && DEPS[d.id] && nivel < 4
      ? DEPS[d.id].depende.filter(function (x) {
        // não repete o que já está no caminho nem o que já aparece como dependência direta
        var k = x.id || x.codigo;
        return caminho.indexOf(k) === -1 && raiz.indexOf(k) === -1;
      })
      : [];
    if (filhos.length) {
      html += '<ul class="dep-arvore">' + filhos.map(function (x) {
        return depItem(x, nivel + 1, caminho.concat([x.id || x.codigo]), raiz);
      }).join("") + "</ul>";
    }
    return "<li>" + html + "</li>";
  }

  function renderDependencias(n) {
    var d = DEPS[n.id];
    if (!d || (!d.depende.length && !d.usado_por.length)) return "";
    var html = '<div class="related-box dep-box">';
    if (d.depende.length) {
      var fora = d.depende.filter(function (x) { return x.via !== "acervo"; }).length;
      var raiz = d.depende.map(function (x) { return x.id || x.codigo; });
      html += '<div class="label">Depende de — ensaios exigidos por este método (' + d.depende.length + ') · ' +
        '<a href="#deps:' + escapeHtml(n.id) + '" class="dep-diagrama">ver no diagrama</a></div>' +
        '<ul class="dep-arvore dep-raiz">' + d.depende.map(function (x) {
          return depItem(x, 1, [n.id, x.id || x.codigo], raiz);
        }).join("") + "</ul>" +
        (fora ? '<div class="dep-nota">' + fora + ' citado(s) não estão no acervo nesta edição — ' +
          '<a href="normas_faltantes.html" target="_blank">ver todas as normas faltantes</a></div>' : "");
    }
    if (d.usado_por.length) {
      html += '<div class="label"' + (d.depende.length ? ' style="margin-top:10px"' : "") +
        ">Usado por — métodos que dependem deste (" + d.usado_por.length + ")</div>" +
        d.usado_por.map(function (id) { return byId[id]; }).filter(Boolean).sort(compareCodigo).map(function (r) {
          return '<a data-id="' + r.id + '" class="rel-link">' + escapeHtml(r.codigo) + "</a>";
        }).join(" ");
    }
    return html + "</div>";
  }

  // ---------- Tarja de norma cancelada (data/canceladas.json, página "Normas canceladas IPR") ----------
  var URL_CANCELADAS = "https://www.gov.br/dnit/pt-br/assuntos/planejamento-e-pesquisa/ipr/coletanea-de-normas/normas-canceladas-ipr";

  function tarjaCancelada(n, linkClass) {
    var c = n && n.cancelada;
    if (!c && !(n && n.status === "suspensa")) return "";
    if (!c) {
      return '<div class="tarja-cancelada tarja-suspensa"><div class="tc-titulo">Norma suspensa. Não está em vigor.</div></div>';
    }
    var subst = (c.sucessoras || []).filter(function (id) { return byId[id]; }).map(function (id) {
      return '<a data-id="' + escapeHtml(id) + '" class="' + linkClass + '">' + escapeHtml(byId[id].codigo) + "</a>";
    });
    return '<div class="tarja-cancelada"><div class="tc-titulo">Norma cancelada. Não está mais em vigor.</div>' +
      '<div class="tc-det">Cancelada pelo DNIT em ' + escapeHtml(c.data) + ". " + escapeHtml(c.motivo || "") +
      (subst.length ? " Use no lugar: " + subst.join(", ") + "." : "") +
      (c.pdf ? ' · <a href="' + escapeHtml(c.pdf) + '" target="_blank">PDF com tarja</a>' : "") +
      ' · <a href="' + URL_CANCELADAS + '" target="_blank">normas canceladas no site do DNIT</a></div></div>';
  }

  // ---------- Link do PDF: arquivo local ou, se não encontrado, o link oficial (campo url) ----------
  function linkPdf(n) {
    var oficial = n.url ? ' · <a class="pdf-oficial" href="' + escapeHtml(n.url) + '" target="_blank" rel="noopener">link oficial</a>' : "";
    if (n.pdf_existe === false && n.url) {
      return '<a class="pdf-link" href="' + escapeHtml(n.url) + '" target="_blank" rel="noopener" title="PDF não está no acervo local">Abrir PDF (site do DNIT)</a>';
    }
    return '<a class="pdf-link" data-pdf-id="' + escapeHtml(n.id) + '" href="../' + escapeHtml(n.pdf) + '" target="_blank">Abrir PDF original</a>' + oficial;
  }

  // Servido por http(s) (scripts/serve.py), confere se o arquivo existe antes de abrir; em file://
  // vale a verificação feita no build (pdf_existe), pois o navegador não deixa consultar o disco.
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a.pdf-link[data-pdf-id]");
    if (!a || !/^https?:$/.test(location.protocol) || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
    var n = byId[a.getAttribute("data-pdf-id")];
    if (!n || !n.url) return;
    ev.preventDefault();
    var janela = window.open("", "_blank");  // aberta já no clique, para não ser bloqueada
    var destino = function (url) { if (janela) janela.location.href = url; else location.href = url; };
    fetch(a.href, { method: "HEAD" }).then(function (r) { destino(r.ok ? a.href : n.url); },
      function () { destino(n.url); });
  });

  // fichas de ensaio de uma norma: a de mesmo id e as que declaram {norma: id} (ex.: aceitação de lote de uma ES)
  function fichasDaNorma(id) {
    var FE = window.FICHAS_ENSAIO || {};
    return Object.keys(FE).filter(function (fid) { return fid === id || FE[fid].norma === id; })
      .sort(function (a, b) { return (a === id ? 0 : 1) - (b === id ? 0 : 1); });
  }

  var editingId = null; // id da norma atualmente em modo de edição, se houver
  // edição do markdown só com o servidor local (scripts/serve.py grava em /api/save); no GitHub Pages fica oculta
  var EDICAO_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  function headerHtml(n, editMode) {
    var badgeOrgao = '<span class="badge ' + n.orgao.toLowerCase() + '">' + n.orgao + "</span>";
    var badgeStatus = n.status === "suspensa" ? '<span class="badge suspensa">SUSPENSA</span>'
        : n.status === "cancelada" ? '<span class="badge suspensa">CANCELADA</span>' : "";
    var actionBtn = editMode
      ? '<button class="edit-btn save" id="btn-save">Salvar</button><button class="edit-btn cancel" id="btn-cancel">Cancelar</button>'
      : EDICAO_LOCAL ? '<button class="edit-btn" id="btn-edit">✎ Editar</button>' : "";
    return (
      '<div class="content-header">' +
        '<div class="header-top">' +
          '<div class="codigo">' + escapeHtml(n.codigo) + badgeOrgao + badgeStatus + "</div>" +
          '<div class="header-actions">' + actionBtn + "</div>" +
        "</div>" +
        '<div class="meta">Tipo: ' + escapeHtml(n.tipo || "-") + " · Ano: " + (n.ano || "-") + " · " +
          linkPdf(n) +
          (youtubeId(n.video)
            ? ' · <button class="video-reopen" id="btn-video" type="button">▶ Assistir ao vídeo</button>'
            : "") +
          fichasDaNorma(n.id).map(function (fid) {
            var F = window.FICHAS_ENSAIO[fid];
            return ' · <a class="video-reopen" href="#fichas:' + fid + '"' + (fid !== n.id ? ' title="' + escapeHtml(F.titulo) + '"' : "") + ">🧮 " +
              (fid === n.id ? "Ficha de ensaio" : escapeHtml(F.rotuloLink || F.titulo)) + "</a>";
          }).join("") +
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
      tarjaCancelada(n, "rel-link") +
      headerHtml(n, false) +
      renderDependencias(n) +
      renderRelated(n) +
      '<div class="markdown-body">' + bodyHtml + "</div>";

    var btnEdit = document.getElementById("btn-edit");
    if (btnEdit) btnEdit.addEventListener("click", function () {
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
  var tabDeps = document.getElementById("tab-deps");
  var viewDeps = document.getElementById("view-deps");
  var depsIniciado = false;
  var tabFichas = document.getElementById("tab-fichas");
  var viewFichas = document.getElementById("view-fichas");
  var fichas = null;  // controlador da aba "Fichas de ensaios" (site/fichas.js)

  function showTab(tab, view) {
    [tabNormas, tabRede, tabControle, tabDeps, tabFichas].forEach(function (t) { t.classList.toggle("active", t === tab); });
    [viewNormas, viewRede, viewControle, viewDeps, viewFichas].forEach(function (v) { v.classList.toggle("active", v === view); });
  }

  function abrirFichas(fid) {
    showTab(tabFichas, viewFichas);
    if (!fichas && window.initFichas) {
      fichas = window.initFichas({
        byId: byId, DEPS: DEPS,
        abrirNorma: function (id) { selectNorma(id); showTab(tabNormas, viewNormas); },
      });
    }
    if (fichas && fid) fichas.abrir(fid);
  }
  tabFichas.addEventListener("click", function () { abrirFichas(null); });

  tabDeps.addEventListener("click", function () {
    showTab(tabDeps, viewDeps);
    if (!depsIniciado) {
      depsIniciado = true;
      // mesma razão da rede: só cria o canvas depois que a aba está visível
      requestAnimationFrame(function () { requestAnimationFrame(function () { initDependencias("todas"); }); });
    }
  });

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
          es.orgao + "</span>" + (es.status === "cancelada" ? ' <span class="badge suspensa">CANCELADA</span>' : "") +
          " · " + p.itens.length + " itens</div></div>";
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
      (it.canceladas || []).forEach(function (c) {
        var subst = (c.sucessoras || []).filter(function (id) { return byId[id]; });
        html += '<div class="ctl-canc">' + (c.id && byId[c.id] ? refLink(c.id) : escapeHtml(c.codigo)) +
          " cancelada em " + escapeHtml(c.data) +
          (subst.length ? " — use " + subst.map(refLink).join(", ") : "") + "</div>";
      });
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
      var html = tarjaCancelada(es, "ctl-ref") +
        '<div class="content-header"><div class="header-top"><div>' +
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
          var canc = byId[p.es].status === "cancelada";
          return '<th class="ctl-col' + (canc ? " ctl-col-canc" : "") + '" data-es="' + escapeHtml(p.es) + '" title="' +
            escapeHtml(p.servico + " — " + byId[p.es].codigo + (canc ? " (CANCELADA)" : "")) +
            '"><div><b>' + escapeHtml(byId[p.es].codigo.replace(/^DNER-ES |^DNIT |-ES$/g, "")) + "</b> " +
            (canc ? '<span class="ctl-canc-tag">cancelada</span> ' : "") + escapeHtml(p.servico) + "</div></th>";
        }).join("") + "</tr></thead><tbody>";
      var tipoAtual = null;
      rows.forEach(function (l) {
        var n = byId[l.id];
        if (n.tipo !== tipoAtual) {
          tipoAtual = n.tipo;
          html += '<tr class="ctl-grupo"><td colspan="' + (cols.length + 2) + '">' + tipoAtual + "</td></tr>";
        }
        html += '<tr><th class="ctl-linha">' + refLink(l.id) +
          (n.status === "cancelada" ? ' <span class="ctl-canc-tag" style="color:#e5534b">cancelada</span>' : "") +
          '<div class="ctl-lt">' + escapeHtml(n.titulo) + "</div></th>" +
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

  // ---------- Aba "Dependências de ensaios" (ME que exigem outros ME) ----------
  // dados: window.DEPENDENCIAS (scripts/dependencias.py). Aresta = pré-requisito -> ensaio que depende dele.
  // modo: "todas" | "norma" (só o que a norma cita pelo código) | "tecnica" (só dependências técnicas curadas)
  var depsRede = null;
  function initDependencias(modo, focoInicial) {
    modo = modo || "todas";
    if (depsRede) { depsRede.destroy(); depsRede = null; }
    Array.prototype.forEach.call(document.querySelectorAll("#deps-modo .chip"), function (c) {
      c.classList.toggle("active", c.dataset.modo === modo);
    });
    document.getElementById("deps-modo").onclick = function (ev) {
      var c = ev.target.closest(".chip");
      if (c && c.dataset.modo !== modo) initDependencias(c.dataset.modo, estado.sel);
    };
    var nos = {};      // chave -> {chave, id|null, codigo, titulo, tipo: "acervo"|"cancelada"|"fora"}
    var arestas = [];  // {de, para, via}
    function no(chave, d) {
      if (!nos[chave]) nos[chave] = d;
      return nos[chave];
    }
    Object.keys(DEPS).forEach(function (meId) {
      if (meId.charAt(0) === "_" || !byId[meId]) return;
      DEPS[meId].depende.forEach(function (x) {
        if (modo === "norma" && x.via === "tecnica") return;
        if (modo === "tecnica" && x.via !== "tecnica") return;
        var chave = x.id || "fora:" + x.codigo;
        if (x.id && byId[x.id]) {
          no(x.id, { chave: x.id, id: x.id, codigo: byId[x.id].codigo, titulo: byId[x.id].titulo,
            tipo: byId[x.id].status === "cancelada" ? "cancelada" : "acervo" });
        } else {
          no(chave, { chave: chave, id: null, codigo: x.codigo, titulo: x.titulo || "", tipo: "fora" });
        }
        var n = byId[meId];
        no(meId, { chave: meId, id: meId, codigo: n.codigo, titulo: n.titulo, tipo: n.status === "cancelada" ? "cancelada" : "acervo" });
        // a mesma norma citada em grafias diferentes (edições) vira uma aresta só
        if (!arestas.some(function (a) { return a.de === chave && a.para === meId; })) {
          arestas.push({ de: chave, para: meId, via: x.via, citado: x.codigo, nota: x.nota });
        }
      });
    });

    // famílias = componentes conexos, nomeadas pelo início mais comum dos títulos ("Solo-cimento", "Agregados"...)
    var viz = {};
    Object.keys(nos).forEach(function (k) { viz[k] = []; });
    arestas.forEach(function (a) { viz[a.de].push(a.para); viz[a.para].push(a.de); });
    var familiaDe = {}, familias = [];
    Object.keys(nos).forEach(function (k) {
      if (familiaDe[k] !== undefined) return;
      var f = { membros: [] }, pilha = [k];
      familiaDe[k] = familias.length;
      while (pilha.length) {
        var x = pilha.pop();
        f.membros.push(x);
        viz[x].forEach(function (y) { if (familiaDe[y] === undefined) { familiaDe[y] = familias.length; pilha.push(y); } });
      }
      var cont = {};
      f.membros.forEach(function (m) {
        var t = (nos[m].titulo || "").split(/\s[-–]\s/)[0].trim();
        if (t) cont[t] = (cont[t] || 0) + 1;
      });
      var nomes = Object.keys(cont).sort(function (a, b) { return cont[b] - cont[a]; });
      f.nome = nomes[0] || nos[f.membros[0]].codigo;
      if (nomes[1] && cont[nomes[1]] === cont[nomes[0]] && nomes[1].length < 40) f.nome += " / " + nomes[1];
      f.nome = f.nome.charAt(0).toUpperCase() + f.nome.slice(1);
      familias.push(f);
    });
    familias.forEach(function (f, i) { f.idx = i; });
    familias.sort(function (a, b) { return b.membros.length - a.membros.length || a.nome.localeCompare(b.nome, "pt-BR"); });

    // foco: ao clicar num ensaio o diagrama mostra só a cadeia dele (pré-requisitos + quem o usa)
    var estado = { familia: null, busca: "", fora: true, sel: null, foco: null, focoSet: null };
    var famEl = document.getElementById("deps-familias");
    var info = document.getElementById("deps-info");

    function visivel(k) {
      var n = nos[k];
      if (estado.focoSet) return !!estado.focoSet[k] && (estado.fora || n.tipo !== "fora" || k === estado.foco);
      if (!estado.fora && n.tipo === "fora") return false;
      if (estado.familia !== null && familiaDe[k] !== estado.familia) return false;
      return true;
    }

    function renderFamilias() {
      var q = normalize(estado.busca.trim());
      var lista = familias.filter(function (f) {
        return !q || f.membros.some(function (m) { return normalize(nos[m].codigo + " " + nos[m].titulo).indexOf(q) !== -1; });
      });
      document.getElementById("deps-count").textContent =
        Object.keys(nos).length + " ensaios · " + arestas.length + " dependências" +
        (modo === "norma" ? " citadas" : modo === "tecnica" ? " técnicas" : "") + " · " + familias.length +
        (familias.length === 1 ? " família" : " famílias");
      famEl.innerHTML = '<div class="norma-item' + (estado.familia === null ? " selected" : "") + '" data-f="">' +
        '<div class="codigo">Todas as famílias</div><div class="titulo">visão geral</div></div>' +
        lista.map(function (f) {
          var codigos = f.membros.filter(function (m) { return nos[m].tipo !== "fora"; }).slice(0, 4)
            .map(function (m) { return nos[m].codigo; }).join(", ");
          return '<div class="norma-item' + (estado.familia === f.idx ? " selected" : "") + '" data-f="' + f.idx + '">' +
            '<div class="codigo">' + escapeHtml(f.nome) + ' <span class="deps-n">' + f.membros.length + "</span></div>" +
            '<div class="titulo">' + escapeHtml(codigos) + (f.membros.length > 4 ? "…" : "") + "</div></div>";
        }).join("");
    }

    var COR = { DNER: "#34c38f", DNIT: "#4f8cff" };
    function corNo(n) {
      if (n.tipo === "fora") return { background: "#2a2f3a", border: "#6b7384" };
      if (n.tipo === "cancelada") return { background: "#e5534b", border: "#a8322c" };
      var c = COR[byId[n.id].orgao];
      return { background: c, border: c };
    }

    var visNos = new vis.DataSet(), visArestas = new vis.DataSet();
    var rede = depsRede = new vis.Network(document.getElementById("deps-network"), { nodes: visNos, edges: visArestas }, {
      layout: { hierarchical: { direction: "LR", sortMethod: "directed", levelSeparation: 260, nodeSpacing: 70, treeSpacing: 90 } },
      physics: false,
      nodes: {
        shape: "box", margin: 8, borderWidth: 1, widthConstraint: { maximum: 210 },
        font: { color: "#0f1115", size: 13, face: "-apple-system, Segoe UI, Roboto, Arial, sans-serif", multi: "html" },
      },
      edges: { arrows: { to: { scaleFactor: 0.6 } }, color: { color: "#5b6475", highlight: "#e6e8ec" }, width: 1.2,
        smooth: { type: "cubicBezier", forceDirection: "horizontal", roundness: 0.4 } },
      interaction: { hover: true, tooltipDelay: 120 },
    });

    function desenhar() {
      var ks = Object.keys(nos).filter(visivel);
      visNos.clear();
      visArestas.clear();
      visNos.add(ks.map(function (k) {
        var n = nos[k], cor = corNo(n);
        var tit = (n.titulo || "").replace(/\s*[-–]\s*M[ée]todo de ensaio\s*$/i, "");
        return {
          id: k,
          label: "<b>" + n.codigo + "</b>\n" + (tit.length > 60 ? tit.slice(0, 58) + "…" : tit),
          title: n.codigo + " — " + (n.titulo || "") + (n.tipo === "fora" ? " (fora do acervo)" : n.tipo === "cancelada" ? " (CANCELADA)" : ""),
          color: { background: cor.background, border: cor.border, highlight: { background: cor.background, border: "#fff" },
            hover: { background: cor.background, border: "#fff" } },
          font: { color: n.tipo === "fora" ? "#c7cdd8" : "#0f1115" },
          shapeProperties: { borderDashes: n.tipo === "fora" ? [4, 3] : false },
        };
      }));
      visArestas.add(arestas.filter(function (a) { return visivel(a.de) && visivel(a.para); }).map(function (a, i) {
        var tec = a.via === "tecnica";
        return { id: i, from: a.de, to: a.para, dashes: tec ? [2, 5] : a.via !== "acervo", width: tec ? 2 : 1.2,
          color: tec ? { color: "#e0a13a", highlight: "#ffc766" } : undefined,
          title: tec ? nos[a.para].codigo + " usa " + a.citado + " — dependência técnica, não citada na norma: " + (a.nota || "")
            : nos[a.para].codigo + " exige " + a.citado + (a.via === "substituida" ? " (substituída pela norma indicada)"
            : a.via === "outra_edicao" ? " (no acervo em outra edição)" : a.via === "cancelada" ? " (cancelada)" : "") };
      }));
      rede.fit({ animation: false });
      if (estado.sel && visNos.get(estado.sel)) marcar(estado.sel); else mostrarInfo(null);
    }

    function cadeia(k, dir) {
      // dir "antes": pré-requisitos (de quem k depende); "depois": ensaios que dependem de k
      var vistos = {}, pilha = [k];
      while (pilha.length) {
        var x = pilha.pop();
        arestas.forEach(function (a) {
          var prox = dir === "antes" ? (a.para === x ? a.de : null) : (a.de === x ? a.para : null);
          if (prox && !vistos[prox] && prox !== k) { vistos[prox] = 1; pilha.push(prox); }
        });
      }
      return Object.keys(vistos);
    }

    function chip(k) {
      var n = nos[k];
      var cls = n.tipo === "fora" ? "deps-chip fora" : n.tipo === "cancelada" ? "deps-chip canc" : "deps-chip ref-" + byId[n.id].orgao.toLowerCase();
      return '<a class="' + cls + '" data-k="' + escapeHtml(k) + '" title="' + escapeHtml(n.titulo || "") + '">' + escapeHtml(n.codigo) + "</a>";
    }

    function mostrarInfo(k) {
      if (!k) {
        info.innerHTML = '<div class="deps-vazio">Clique num ensaio do diagrama para ver o que ele exige antes (pré-requisitos) ' +
          "e quais ensaios dependem dele.<br><br>Setas laranja pontilhadas: dependência técnica — a norma usa o resultado " +
          "do outro ensaio mas não o cita pelo código.<br><br>Setas tracejadas: a norma citada foi substituída, está em outra edição " +
          "ou foi cancelada; caixas cinza tracejadas: norma que não está no acervo.</div>";
        return;
      }
      var n = nos[k];
      var antes = cadeia(k, "antes"), depois = cadeia(k, "depois");
      var diretos = arestas.filter(function (a) { return a.para === k; }).map(function (a) { return a.de; });
      var html = '<div class="deps-cod">' + escapeHtml(n.codigo) +
        (n.tipo === "cancelada" ? ' <span class="badge suspensa">CANCELADA</span>' : n.tipo === "fora" ? ' <span class="badge deps-fora-badge">FORA DO ACERVO</span>' : "") +
        '</div><div class="deps-tit">' + escapeHtml(n.titulo || "") + "</div>";
      html += '<div class="deps-botoes">' + (n.id ? '<button class="edit-btn" id="deps-abrir">Abrir a norma</button>' : "") +
        (estado.foco ? '<button class="edit-btn" id="deps-familia">Ver a família inteira</button>' : "") + "</div>";
      html += '<div class="label">Exige antes (' + antes.length + ")</div>" +
        (antes.length ? '<div class="deps-lista">' + diretos.map(chip).join(" ") +
          (antes.length > diretos.length ? '<div class="deps-sub">e, indiretamente: ' +
            antes.filter(function (x) { return diretos.indexOf(x) === -1; }).map(chip).join(" ") + "</div>" : "") + "</div>"
          : '<div class="deps-sub">nenhum pré-requisito citado</div>');
      html += '<div class="label">É usado por (' + depois.length + ")</div>" +
        (depois.length ? '<div class="deps-lista">' + depois.map(chip).join(" ") + "</div>" : '<div class="deps-sub">nenhum ensaio do acervo cita este</div>');
      info.innerHTML = html;
      var b = document.getElementById("deps-abrir");
      if (b) b.addEventListener("click", function () { selectNorma(n.id); showTab(tabNormas, viewNormas); });
      var bf = document.getElementById("deps-familia");
      if (bf) bf.addEventListener("click", sairFoco);
    }

    function marcar(k) {
      var marcados = [k].concat(cadeia(k, "antes"), cadeia(k, "depois")).filter(function (x) { return visNos.get(x); });
      rede.selectNodes(marcados, true);
      mostrarInfo(k);
    }

    // seleciona e entra no foco da cadeia do ensaio
    function selecionar(k) {
      estado.sel = k;
      estado.foco = k;
      estado.focoSet = {};
      [k].concat(cadeia(k, "antes"), cadeia(k, "depois")).forEach(function (x) { estado.focoSet[x] = 1; });
      desenhar();
    }

    function sairFoco() {
      if (!estado.foco) return;
      estado.familia = familiaDe[estado.foco];
      estado.foco = null;
      estado.focoSet = null;
      renderFamilias();
      desenhar();
    }

    rede.on("click", function (p) {
      if (p.nodes.length) selecionar(p.nodes[0]);
      else { estado.sel = null; rede.unselectAll(); mostrarInfo(null); }
    });
    rede.on("doubleClick", function (p) {
      var n = p.nodes.length && nos[p.nodes[0]];
      if (n && n.id) { selectNorma(n.id); showTab(tabNormas, viewNormas); }
    });
    info.onclick = function (ev) {
      var a = ev.target.closest(".deps-chip");
      if (!a) return;
      var k = a.dataset.k;
      if (nos[k]) selecionar(k);
    };
    famEl.onclick = function (ev) {
      var it = ev.target.closest(".norma-item");
      if (!it) return;
      estado.familia = it.dataset.f === "" ? null : Number(it.dataset.f);
      estado.sel = null;
      estado.foco = null;
      estado.focoSet = null;
      renderFamilias();
      desenhar();
    };
    document.getElementById("deps-search").oninput = function (ev) {
      estado.busca = ev.target.value;
      renderFamilias();
      // um único ensaio encontrado: seleciona-o no diagrama
      var q = normalize(estado.busca.trim());
      var achados = q ? Object.keys(nos).filter(function (k) { return visivel(k) && normalize(nos[k].codigo + " " + nos[k].titulo).indexOf(q) !== -1; }) : [];
      if (achados.length) { rede.selectNodes(achados, false); if (achados.length === 1) { rede.focus(achados[0], { scale: 1, animation: true }); mostrarInfo(achados[0]); } }
    };
    document.getElementById("deps-fora").onchange = function (ev) {
      estado.fora = ev.target.checked;
      desenhar();
    };
    estado.fora = document.getElementById("deps-fora").checked;
    estado.busca = document.getElementById("deps-search").value || "";

    // abre na maior família: a visão com todas empilha 20 grupos e fica miúda demais
    estado.familia = familias.length ? familias[0].idx : null;
    renderFamilias();
    desenhar();
    depsSelecionar = function (id) {
      if (!nos[id]) return;
      estado.familia = familiaDe[id];
      renderFamilias();
      selecionar(id);
    };
    if (focoInicial && nos[focoInicial]) depsSelecionar(focoInicial);  // troca de modo mantém o ensaio em foco
    if (depsPendente) { depsSelecionar(depsPendente); depsPendente = null; }
  }
  var depsSelecionar = null;
  var depsPendente = null;

  renderList();
  var controle = initControle();

  // index.html#norma:<id> abre direto a norma (links da página de revisão, favoritos)
  function openFromHash() {
    var h = decodeURIComponent(location.hash || "");
    var m = /^#norma:(.+)$/.exec(h);
    if (m && byId[m[1]] && m[1] !== state.selectedId) selectNorma(m[1]);
    // #fichas ou #fichas:<id do ME> abrem a aba de fichas de ensaios
    m = /^#fichas(?::(.+))?$/.exec(h);
    if (m) abrirFichas(m[1] || null);
    // #deps ou #deps:<id do ME> abrem a aba de dependências de ensaios
    m = /^#deps(?::(.+))?$/.exec(h);
    if (m) {
      tabDeps.click();
      if (m[1]) {
        if (depsSelecionar) depsSelecionar(m[1]);
        else depsPendente = m[1];  // aplicado no fim de initDependencias
      }
    }
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
