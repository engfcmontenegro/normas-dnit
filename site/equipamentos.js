/*
 * Aba "Equipamentos de laboratório": a aparelhagem que cada método de ensaio (ME/IE) exige, extraída da seção
 * "Aparelhagem" das normas (scripts/aparelhagem.py -> window.APARELHAGEM) e classificada por tipo de equipamento.
 * Modos: por ensaio; lista consolidada dos ensaios marcados (para montar/conferir um laboratório); por equipamento.
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function semAcento(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  var CHAVE = "equip_selecao_v1";
  function lerSel() { try { return JSON.parse(localStorage.getItem(CHAVE) || "[]"); } catch (e) { return []; } }
  function gravarSel(a) { try { localStorage.setItem(CHAVE, JSON.stringify(a)); } catch (e) { /* sem armazenamento */ } }

  window.initEquipamentos = function (ctx) {
    var byId = ctx.byId, AP = window.APARELHAGEM || {}, CATS = window.APARELHAGEM_CATS || [];
    var areaDe = window.FE && window.FE.areas ? function (n) { return window.FE.areas.deTexto(n.titulo); } : function () { return "Outros"; };
    var lista = document.getElementById("eq-lista"), painel = document.getElementById("eq-painel");
    var ids = Object.keys(AP).filter(function (id) { return byId[id]; }).sort(function (a, b) {
      return byId[a].codigo.localeCompare(byId[b].codigo, "pt", { numeric: true });
    });
    var ordemGrupo = [], ordemCat = {};
    CATS.forEach(function (c, i) { if (ordemGrupo.indexOf(c.grupo) < 0) ordemGrupo.push(c.grupo); ordemCat[c.cat] = i; });
    var est = { modo: "ensaio", atual: ids[0] || null, cat: null, sel: lerSel().filter(function (id) { return AP[id]; }),
      busca: "", areas: [], soVigor: false };

    // ---------- filtros e lista ----------
    function passa(id) {
      var n = byId[id];
      if (est.areas.length && est.areas.indexOf(areaDe(n)) < 0) return false;
      if (est.soVigor && n.status !== "vigente") return false;
      var q = semAcento(est.busca).trim();
      if (!q) return true;
      var alvo = semAcento(n.codigo + " " + n.titulo + " " + AP[id].itens.map(function (it) { return it.cat + " " + it.texto; }).join(" "));
      var cod = alvo.replace(/[^a-z0-9]/g, "");
      return q.split(/\s+/).every(function (p) { var pc = p.replace(/[^a-z0-9]/g, ""); return alvo.indexOf(p) >= 0 || (pc && cod.indexOf(pc) >= 0); });
    }
    function montarChips() {
      var fa = document.getElementById("eq-f-area");
      var cont = {};
      ids.forEach(function (id) { var a = areaDe(byId[id]); cont[a] = (cont[a] || 0) + 1; });
      var areas = (window.FE && window.FE.areas ? window.FE.areas.lista : []).concat(["Outros"]).filter(function (a) { return cont[a]; });
      fa.innerHTML = areas.map(function (a) { return '<div class="chip" data-area="' + esc(a) + '">' + esc(a) + " <small>" + cont[a] + "</small></div>"; }).join("");
      fa.onclick = function (ev) {
        var c = ev.target.closest(".chip"); if (!c) return;
        var on = !c.classList.contains("active"); c.classList.toggle("active", on);
        est.areas = on ? est.areas.concat([c.dataset.area]) : est.areas.filter(function (x) { return x !== c.dataset.area; });
        renderLista();
      };
      document.getElementById("eq-f-outros").onclick = function (ev) {
        var c = ev.target.closest(".chip"); if (!c) return;
        est.soVigor = !c.classList.contains("active"); c.classList.toggle("active", est.soVigor);
        renderLista();
      };
      document.getElementById("eq-busca").oninput = function (ev) { est.busca = ev.target.value; renderLista(); };
    }
    function renderLista() {
      var vis = ids.filter(passa);
      document.getElementById("eq-count").innerHTML = (vis.length === ids.length ? ids.length + " ensaios" : vis.length + " de " + ids.length + " ensaios") +
        ' · <a class="eq-acao" data-acao="sel-vis">marcar visíveis</a> · <a class="eq-acao" data-acao="limpar">limpar seleção</a>';
      lista.innerHTML = vis.map(function (id) {
        var n = byId[id], on = est.sel.indexOf(id) >= 0;
        return '<div class="norma-item eq-item' + (est.modo === "ensaio" && est.atual === id ? " selected" : "") + '" data-id="' + esc(id) + '">' +
          '<input type="checkbox" class="eq-check" data-sel="' + esc(id) + '"' + (on ? " checked" : "") + ' title="Incluir na lista consolidada">' +
          '<div><div class="codigo">' + esc(n.codigo) + (n.status === "cancelada" ? ' <span class="eq-canc">cancelada</span>' : "") + '</div><div class="titulo">' +
          esc(n.titulo) + " · " + AP[id].itens.length + " itens</div></div></div>";
      }).join("") || '<div class="fe-prox">Nenhum ensaio com esses filtros.</div>';
      renderAbas();
    }
    lista.onclick = function (ev) {
      var cb = ev.target.closest("[data-sel]");
      if (cb) {
        var id = cb.dataset.sel;
        est.sel = cb.checked ? est.sel.concat([id]) : est.sel.filter(function (x) { return x !== id; });
        gravarSel(est.sel); renderAbas(); if (est.modo === "consolidado") renderPainel();
        return;
      }
      var it = ev.target.closest(".eq-item");
      if (it) { est.modo = "ensaio"; est.atual = it.dataset.id; renderLista(); renderPainel(); }
    };
    document.getElementById("eq-count").onclick = function (ev) {
      var a = ev.target.closest("[data-acao]"); if (!a) return;
      if (a.dataset.acao === "sel-vis") { var v = ids.filter(passa); est.sel = est.sel.concat(v.filter(function (x) { return est.sel.indexOf(x) < 0; })); }
      else est.sel = [];
      gravarSel(est.sel); renderLista(); if (est.modo === "consolidado") renderPainel();
    };

    // ---------- agrupamentos ----------
    function porGrupo(pares) {  // pares: [{id, it}] -> [{grupo, cats: [{cat, pares}]}]
      var g = {};
      pares.forEach(function (p) {
        var gr = p.it.grupo || "Outros", c = p.it.cat || "Outros equipamentos";
        g[gr] = g[gr] || {}; (g[gr][c] = g[gr][c] || []).push(p);
      });
      return Object.keys(g).sort(function (a, b) { return ordemGrupo.indexOf(a) - ordemGrupo.indexOf(b); }).map(function (gr) {
        return { grupo: gr, cats: Object.keys(g[gr]).sort(function (a, b) { return (ordemCat[a] || 999) - (ordemCat[b] || 999); })
          .map(function (c) { return { cat: c, pares: g[gr][c] }; }) };
      });
    }
    function paresDe(idsSel) {
      var out = [];
      idsSel.forEach(function (id) { (AP[id] || { itens: [] }).itens.forEach(function (it) { out.push({ id: id, it: it }); }); });
      return out;
    }
    function textoItem(it, comDetalhe) {
      return esc(it.texto) + (it.parte_de ? ' <span class="eq-parte">(parte de: ' + esc(it.parte_de) + "…)</span>" : "") +
        (comDetalhe && it.detalhes && it.detalhes.length ? '<div class="eq-det">' + it.detalhes.map(esc).join("<br>") + "</div>" : "");
    }
    function linkNorma(id) { return '<a class="eq-norma" data-norma="' + esc(id) + '">' + esc(byId[id].codigo) + "</a>"; }

    // ---------- painel ----------
    function renderAbas() {
      var el = document.getElementById("eq-modos");
      if (!el) return;
      el.innerHTML = [["ensaio", "Por ensaio"], ["consolidado", "Lista consolidada (" + est.sel.length + ")"], ["equipamento", "Por equipamento"]].map(function (m) {
        return '<div class="chip' + (est.modo === m[0] ? " active" : "") + '" data-modo="' + m[0] + '">' + esc(m[1]) + "</div>";
      }).join("");
    }
    function renderPainel() {
      var html = '<div class="content-header"><div class="header-top"><div><div class="codigo">Equipamentos de laboratório</div>' +
        '<div class="meta">Aparelhagem exigida por ' + ids.length + " métodos e instruções de ensaio, extraída da seção “Aparelhagem” de cada norma e agrupada por tipo de equipamento.</div></div>" +
        '<div class="header-actions"><button class="edit-btn" id="eq-csv">Baixar CSV</button><button class="edit-btn" id="eq-imprimir">Imprimir</button></div></div>' +
        '<div class="chip-row eq-modos" id="eq-modos"></div></div>';
      if (est.modo === "ensaio") html += painelEnsaio();
      else if (est.modo === "consolidado") html += painelConsolidado();
      else html += painelEquipamento();
      painel.innerHTML = html;
      renderAbas();
      painel.scrollTop = 0;
    }
    function painelEnsaio() {
      var id = est.atual;
      if (!id || !AP[id]) return '<div class="empty-state">Escolha um ensaio na lista à esquerda.</div>';
      var n = byId[id], on = est.sel.indexOf(id) >= 0, FF = (window.FE && window.FE.FICHAS) || {};
      var ficha = FF[id] ? id : Object.keys(FF).filter(function (k) { return FF[k].norma === id; })[0];
      var html = '<div class="eq-cab"><h2>' + esc(n.codigo) + "</h2><div>" + esc(n.titulo) + "</div>" +
        '<div class="eq-links">' + linkNorma(id).replace(">" + esc(n.codigo) + "<", ">📄 abrir a norma<") +
        (ficha ? ' · <a href="#fichas:' + esc(ficha) + '">🧮 ficha de ensaio</a>' : "") +
        ' · <a class="eq-acao" data-toggle="' + esc(id) + '">' + (on ? "✓ na lista consolidada (remover)" : "+ incluir na lista consolidada") + "</a>" +
        " · seção: " + esc(AP[id].secao.replace(/^#+\s*/, "")) + "</div></div>";
      porGrupo(paresDe([id])).forEach(function (g) {
        html += '<h3 class="fe-h">' + esc(g.grupo) + "</h3><table class=\"eq-tab\"><tbody>" + g.cats.map(function (c) {
          return c.pares.map(function (p, k) {
            return "<tr>" + (k === 0 ? '<th rowspan="' + c.pares.length + '">' + esc(c.cat) + "</th>" : "") + "<td>" + textoItem(p.it, true) + "</td></tr>";
          }).join("");
        }).join("") + "</tbody></table>";
      });
      return html;
    }
    function painelConsolidado() {
      if (!est.sel.length) {
        return '<div class="empty-state">Marque na lista à esquerda os ensaios que o laboratório vai realizar (ou filtre e use “marcar visíveis”). ' +
          "A lista consolidada junta a aparelhagem de todos eles, agrupada por equipamento, com a especificação exigida por cada norma.</div>";
      }
      var grupos = porGrupo(paresDe(est.sel));
      var nCats = grupos.reduce(function (s, g) { return s + g.cats.length; }, 0);
      var html = '<p class="eq-resumo"><b>' + est.sel.length + " ensaios</b> · " + nCats + " tipos de equipamento. Cada tipo mostra a especificação que cada norma exige — " +
        "o equipamento do laboratório precisa atender à mais exigente (capacidade, resolução, dimensões).</p>" +
        '<div class="eq-sel">' + est.sel.map(function (id) { return byId[id] ? linkNorma(id) : ""; }).join(" ") + "</div>";
      grupos.forEach(function (g) {
        html += '<h3 class="fe-h">' + esc(g.grupo) + "</h3>";
        g.cats.forEach(function (c) {
          var usos = {}; c.pares.forEach(function (p) { usos[p.id] = true; });
          html += '<details class="eq-cat"' + (Object.keys(usos).length <= 3 ? "" : "") + "><summary><b>" + esc(c.cat) + "</b> — " +
            Object.keys(usos).length + " ensaio(s)</summary><table class=\"eq-tab\"><tbody>" + c.pares.map(function (p) {
              return "<tr><th>" + linkNorma(p.id) + "</th><td>" + textoItem(p.it, false) + "</td></tr>";
            }).join("") + "</tbody></table></details>";
        });
      });
      return html;
    }
    function painelEquipamento() {
      var base = ids.filter(passa), todos = porGrupo(paresDe(base));
      var html = '<p class="eq-resumo">Escolha um tipo de equipamento para ver quais ensaios o exigem e com que especificação (respeita os filtros da lista).</p><div class="eq-cats">';
      todos.forEach(function (g) {
        html += '<div class="eq-grupo"><div class="label">' + esc(g.grupo) + "</div>" + g.cats.map(function (c) {
          var n = {}; c.pares.forEach(function (p) { n[p.id] = true; });
          return '<div class="chip' + (est.cat === c.cat ? " active" : "") + '" data-cat="' + esc(c.cat) + '">' + esc(c.cat) + " <small>" + Object.keys(n).length + "</small></div>";
        }).join("") + "</div>";
      });
      html += "</div>";
      if (est.cat) {
        var pares = paresDe(base).filter(function (p) { return p.it.cat === est.cat; });
        html += '<h3 class="fe-h">' + esc(est.cat) + " — " + pares.length + " menções</h3><table class=\"eq-tab\"><tbody>" + pares.map(function (p) {
          return "<tr><th>" + linkNorma(p.id) + '<div class="eq-tit">' + esc(byId[p.id].titulo) + "</div></th><td>" + textoItem(p.it, true) + "</td></tr>";
        }).join("") + "</tbody></table>";
      }
      return html;
    }

    // ---------- exportar ----------
    function linhasExport() {
      var base = est.modo === "consolidado" ? est.sel : est.modo === "ensaio" ? [est.atual] : ids.filter(passa);
      var pares = paresDe(base);
      if (est.modo === "equipamento" && est.cat) pares = pares.filter(function (p) { return p.it.cat === est.cat; });
      return pares.map(function (p) { return [p.it.grupo, p.it.cat, byId[p.id].codigo, byId[p.id].titulo, p.it.texto]; });
    }
    function baixarCsv() {
      var cab = ["Grupo", "Equipamento", "Norma", "Ensaio", "Especificação na norma"];
      var csv = [cab].concat(linhasExport()).map(function (r) {
        return r.map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }).join(";");
      }).join("\r\n");
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      a.download = "equipamentos_laboratorio.csv";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    }
    function imprimir() {
      var rows = linhasExport(), w = window.open("", "_blank");
      if (!w) { alert("Permita pop-ups para imprimir."); return; }
      var titulo = est.modo === "consolidado" ? "Lista consolidada — " + est.sel.length + " ensaios" : est.modo === "ensaio" ? byId[est.atual].codigo : "Equipamento: " + (est.cat || "todos");
      w.document.write('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Equipamentos de laboratório</title><style>' +
        "@page{size:A4;margin:12mm}body{font:11px Arial,sans-serif}h1{font-size:15px}table{border-collapse:collapse;width:100%}" +
        "th,td{border:1px solid #bbb;padding:3px 5px;text-align:left;vertical-align:top}th{background:#f2f2f2}td.c{width:18%}</style></head><body>" +
        "<h1>Equipamentos de laboratório — " + esc(titulo) + "</h1><table><thead><tr><th>Grupo</th><th>Equipamento</th><th>Norma</th><th>Especificação</th></tr></thead><tbody>" +
        rows.map(function (r) { return '<tr><td class="c">' + esc(r[0]) + '</td><td class="c">' + esc(r[1]) + '</td><td class="c">' + esc(r[2]) + "</td><td>" + esc(r[4]) + "</td></tr>"; }).join("") +
        "</tbody></table><script>print()<\/script></body></html>");
      w.document.close();
    }

    painel.onclick = function (ev) {
      var m = ev.target.closest("[data-modo]");
      if (m) { est.modo = m.dataset.modo; renderLista(); renderPainel(); return; }
      var c = ev.target.closest("[data-cat]");
      if (c) { est.cat = est.cat === c.dataset.cat ? null : c.dataset.cat; renderPainel(); return; }
      var t = ev.target.closest("[data-toggle]");
      if (t) {
        var id = t.dataset.toggle;
        est.sel = est.sel.indexOf(id) >= 0 ? est.sel.filter(function (x) { return x !== id; }) : est.sel.concat([id]);
        gravarSel(est.sel); renderLista(); renderPainel(); return;
      }
      var nl = ev.target.closest("[data-norma]");
      if (nl) { ctx.abrirNorma(nl.dataset.norma); return; }
      if (ev.target.id === "eq-csv") baixarCsv();
      if (ev.target.id === "eq-imprimir") imprimir();
    };

    montarChips();
    renderLista();
    renderPainel();
    return {
      abrir: function (id) {
        if (!AP[id]) return;
        est.modo = "ensaio"; est.atual = id; renderLista(); renderPainel();
        var el = lista.querySelector('[data-id="' + id + '"]'); if (el) el.scrollIntoView({ block: "nearest" });
      },
    };
  };
})();
