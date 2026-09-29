/*
 * Ficha: DNIT 129/2011-EM — Cimento asfáltico de petróleo modificado por polímero elastomérico — recebimento do carregamento.
 * Usa o motor comum FE.recebimentoLigante (site/fichas/dnit-095-2006-em.js) e a biblioteca FE.aceitacao (site/fichas/es-comum.js).
 * Limites: Tabela 1 do Anexo A (conferida no PDF, p. 4).
 *
 * Este arquivo também define FE.recebimentoLigante.ext — extensões usadas pelas fichas de recebimento
 * dnit-129-2011-em, dnit-128-2010-em, dnit-111-2009-em, dnit-168-2013-em e dner-em-364-97 (carregadas depois desta):
 *   ext.importar(fid, mapas, dica) -> [param "importarVarios", param de texto com a origem]: traz os resultados das
 *       fichas ME (131 PA, 130 RE, 148 fulgor, 163 ductilidade, 384 estabilidade, 006 sedimentação, 193 densidade)
 *       para as colunas de determinação dos ensaios correspondentes (cada ensaio importado = uma determinação).
 *   ext.M — mapeadores resultado ME -> [[id do ensaio, valor, descrição]] (id "" = ignorado, com o motivo).
 *   ext.lote(F, cfg) — parecer do carregamento (ACEITO / COM RESSALVA / PENDENTE / REJEITADO) com FE.aceitacao, inspeção
 *       (seção 6), prazo do certificado e relatório com o parecer primeiro (F.lote = true).
 *   ext.espuma, ext.rtfotMassa, ext.paramInspecao — ensaios/parâmetros repetidos nas EM.
 */
(function () {
  "use strict";
  var FE = window.FE, ok = FE.ok, fmt = FE.fmt, num = FE.num;
  var RL = FE.recebimentoLigante, A = FE.aceitacao;
  if (!RL || !A) { if (window.console) console.error("dnit-129-2011-em.js: carregue antes site/fichas/dnit-095-2006-em.js e site/fichas/es-comum.js."); return; }
  var L = RL.L;

  // =====================================================================================
  // Extensões comuns das fichas de recebimento de ligantes modificados / alcatrões
  // =====================================================================================
  if (!RL.ext) RL.ext = (function () {
    function nstr(x, c) { var f = Math.pow(10, c || 0); return String(Math.round(x * f) / f).replace(".", ","); }
    function codigo(fid) {
      var m = /^(dner|dnit)-(me|em|es)-(\d+)-(\d+)$/.exec(fid) || [];
      if (m[1]) return m[1].toUpperCase() + "-" + m[2].toUpperCase() + " " + m[3] + "/" + m[4];
      m = /^(dnit)-(\d+)-(\d+)-(me|em|es)$/.exec(fid) || [];
      return m[1] ? "DNIT " + m[2] + "/" + m[3] + "-" + m[4].toUpperCase() : fid;
    }

    // ---- mapeadores: (resultados, dados da ficha ME) -> [[id do ensaio, valor em texto, descrição]] ----
    var M = {
      // DNIT 131/2010-ME: PA do ligante original ou do resíduo do RTFOT (parâmetro "Amostra")
      pa: function (ids) {
        ids = ids || {};
        return function (r) {
          if (!ok(r.pa)) return [];
          var rt = !!r.rtfot;
          return [[rt ? (ids.rtfot === undefined ? "paR" : ids.rtfot) : (ids.orig || "pa"), nstr(r.pa, 1), (rt ? "PA após RTFOT " : "PA ") + fmt(r.pa, 1) + " °C" +
            (rt && ids.rtfot === "" ? " (esta EM não tem ensaio após RTFOT para o PA)" : "")]];
        };
      },
      // DNIT 130/2010-ME: recuperação elástica do original ou do resíduo do RTFOT
      re: function (ids) {
        ids = ids || {};
        return function (r) {
          if (!ok(r.re)) return [];
          var rt = !!r.rtfot;
          return [[rt ? (ids.rtfot === undefined ? "reR" : ids.rtfot) : (ids.orig || "re"), nstr(r.re, 1),
            (rt ? "RE após RTFOT " : "RE ") + fmt(r.re, 0) + " %" + (rt && ids.rtfot === "" ? " (sem ensaio após RTFOT nesta EM)" : "")]];
        };
      },
      // DNER-ME 148/94: ponto de fulgor Cleveland (resultado corrigido e arredondado)
      fulgor: function (id) {
        return function (r) { return ok(r.fulgor) ? [[id || "fulgor", nstr(r.fulgor, 0), "fulgor " + fmt(r.fulgor, 0) + " °C"]] : []; };
      },
      // DNER-ME 163/98: ductilidade a 25 °C (original ou após RTFOT, pela especificação/material escolhidos na ficha)
      duct: function (ids) {
        ids = ids || {};
        return function (r, dd) {
          if (!ok(r.cm)) return [];
          var desc = "ductilidade " + (r.maior ? "> " : "") + fmt(r.cm, 0) + " cm";
          if (ok(r.temp) && Math.abs(r.temp - 25) > 0.5) return [["", "", desc + " a " + fmt(r.temp, 0) + " °C (a EM pede 25 °C)"]];
          var p = (dd || {}).params || {};
          var rt = /r$/.test(p.espec || "") || /rtfot/i.test(p.material || "");
          return [[rt ? (ids.rtfot || "ductR") : (ids.orig || "duct"), (r.maior ? "> " : "") + nstr(r.cm, 1), desc + (rt ? " após RTFOT" : "")]];
        };
      },
      // DNIT 384/2022-ME (antiga DNER-ME 384/99): diferença de PA entre topo e fundo do tubo
      estab: function (id) {
        return function (r) {
          var v = ok(r.abs) ? r.abs : ok(r.res) ? Math.abs(r.res) : NaN;
          return ok(v) ? [[id || "estab", nstr(v, 1), "diferença de PA topo × fundo " + fmt(v, 1) + " °C"]] : [];
        };
      },
      // DNER-ME 006/2000: sedimentação da emulsão
      sed: function (id) {
        return function (r) { return ok(r.res) ? [[id || "sed", nstr(r.res, 1), "sedimentação " + fmt(r.res, 1) + " %"]] : []; };
      },
      // DNER-ME 193/96: densidade a 25/25 °C (picnômetro)
      dens: function (id) {
        return function (r) {
          if (!ok(r.D)) return [];
          var T = String(r.T || "");
          if (T && Math.abs(num(T) - 25) > 0.01) return [["", "", "densidade " + fmt(r.D, 3) + " a " + T.replace(".", ",") + " °C (a EM pede 25/25 °C)"]];
          return [[id || "dens", nstr(r.D, 3), "densidade " + fmt(r.D, 3)]];
        };
      },
    };

    // ---- parâmetro de importação (tipo "importarVarios") ----
    function importar(fid, mapas, dica) {
      return [
        { k: "imp", r: "Importar resultados das fichas de ensaio (ME)", tipo: "importarVarios", de: Object.keys(mapas),
          dica: dica || "cada ensaio importado entra como uma determinação do ensaio correspondente (até 3); o resultado é a média",
          aplicar: function (lista, P, d) {
            var F = FE.FICHAS[fid], vis = {};
            F.tabelas(d)[0].linhas.forEach(function (l) { if (l.k) vis[l.k] = l.r; });
            var novos = {}, origem = [], ign = [];
            lista.forEach(function (e) {
              var reg = ((e.dados || {}).ident || {}).registro || "sem registro", cod = codigo(e.ficha);
              var pares = (mapas[e.ficha] || function () { return []; })(e.resultados || {}, e.dados || {});
              if (!pares.length) ign.push(cod + " " + reg + " (sem resultado)");
              pares.forEach(function (p) {
                if (!p[0]) { ign.push(cod + " " + reg + ": " + p[2]); return; }
                if (!vis[p[0]]) { ign.push(cod + " " + reg + ": " + p[2] + " — ensaio não exigido para esta classe"); return; }
                (novos[p[0]] = novos[p[0]] || []).push(p[1]);
                origem.push(cod + " " + reg + " → " + p[2]);
              });
            });
            d.det = d.det || [];
            while (d.det.length < 3) d.det.push({});
            // limpa o que a importação anterior trouxe e preenche as colunas na ordem
            (P.impIds || []).concat(Object.keys(novos)).forEach(function (k) { d.det.forEach(function (c) { c[k] = ""; }); });
            Object.keys(novos).forEach(function (k) {
              var v = novos[k];
              if (v.length > 3) ign.push(k + ": " + v.length + " resultados — só 3 determinações por ensaio; os excedentes foram ignorados");
              v.slice(0, 3).forEach(function (x, i) { d.det[i][k] = x; });
            });
            P.impIds = Object.keys(novos);
            P.origemImp = origem.join("; ") + (ign.length ? (origem.length ? " · " : "") + "Ignorados: " + ign.join("; ") : "");
          } },
        { k: "origemImp", r: "Resultados importados (origem)", dica: "preenchido pela importação; o que for digitado na tabela prevalece" },
      ];
    }

    // ---- ensaios repetidos ----
    function espuma(grupo, lim, secao) {
      return { id: "espuma", grupo: grupo, tipo: "qual", r: "Espuma ao ser aquecido (" + secao + ")", curto: "Não espumar (" + secao + ")", u: "",
        metodo: "inspeção (" + secao + ")", ph: "não espuma / espuma", lim: lim,
        opcoes: [["nao", "não espuma", /^(n[aã]o|ausente|sem|ok|aus)/i], ["sim", "espuma", /^(sim|espuma|espumou|presen)/i]] };
    }
    function rtfotMassa(grupo, lim, metodo, obs) {
      return { id: "rtfot", grupo: grupo, tipo: "col", r: "Variação em massa, máx." + (obs ? " " + obs : ""), rCalc: "ΔM = (Mi − Mf) / Mi × 100" + (obs ? " " + obs : ""),
        u: "% massa", casas: 2, casasCol: 3, metodo: metodo, abs: true, lim: lim,
        entradas: [{ k: "mi", r: "Massa antes do RTFOT (Mi) — recipiente", u: "g" }, { k: "mf", r: "Massa após o RTFOT (Mf)", u: "g" }],
        col: function (p) { var mi = num(p.mi), mf = num(p.mf); return ok(mi) && ok(mf) && mi > 0 ? (mi - mf) / mi * 100 : NaN; } };
    }
    function paramInspecao(secao, extra) {
      return { k: "inspecao", r: "Inspeção na entrega (" + secao + ")", tipo: "select",
        opcoes: [["ok", "Quantidade, tipo e acondicionamento conferem"], ["acond", "Parte do fornecimento em mau estado de acondicionamento"],
          ["diverge", "Quantidade ou tipo não corresponde ao estabelecido"]].concat(extra || []),
        dica: "a parte em mau estado de acondicionamento é rejeitada independentemente dos ensaios" };
    }

    // ---- parecer do carregamento ----
    function valorTxt(o) {
      if (o.e.tipo === "qual") return o.texto || "—";
      return ok(o.valor) ? (o.maior ? "> " : "") + fmt(o.valor, o.e.casas).replace(/^-/, "−") + (o.e.u ? " " + o.e.u : "") : "—";
    }
    function lote(F, cfg) {
      F.lote = true;
      var calc0 = F.calcular, html0 = F.resultadosHtml, rel0 = F.relatorio.resultados, ext0 = F.relatorio.extraHtml;
      var T = cfg.tabela, sec = cfg.secao;
      F.calcular = function (d) {
        var c = calc0(d), r = c.resultados, P = d.params || {}, linhas = [];
        r.ensaios.forEach(function (o) {
          if (o.situacao !== false) return;
          linhas.push(A.marcar(A.linha({ criterio: o.e.curto || o.e.r, secao: T.replace(/\s*\(Anexo A\)/, "") }), "nao_conforme",
            "resultado " + valorTxt(o) + " — exigido " + RL.fmtLim(o.lim)));
        });
        var nao = r.ensaios.filter(function (o) { return o.situacao === null; });
        if (nao.length) {
          linhas.push(A.marcar(A.linha({ criterio: "Ensaios da " + T, secao: sec }), "pendente", nao.length === r.ensaios.length ? "nenhum ensaio lançado" :
            nao.length + " de " + r.ensaios.length + " não realizado(s): " + nao.map(function (o) { return o.e.curto || o.e.r; }).join("; ")));
        }
        var insp = cfg.secaoInspecao || "6";
        if (P.inspecao === "acond") linhas.push(A.marcar(A.linha({ criterio: "Inspeção na entrega", secao: insp }), "ressalva",
          "rejeitar a parte do fornecimento em mau estado de acondicionamento, independentemente dos ensaios"));
        if (P.inspecao === "diverge") linhas.push(A.marcar(A.linha({ criterio: "Inspeção na entrega", secao: insp }), "pendente",
          "quantidade ou tipo fornecido não corresponde ao estabelecido — regularizar com o fornecedor"));
        if (cfg.certificado) {
          var dias = RL.diasEntre(P.dataCert, P.dataCarga);
          if (ok(dias) && dias > 3) linhas.push(A.marcar(A.linha({ criterio: "Certificado de análise", secao: cfg.certificado }), "pendente",
            "entre a fabricação/análise e o carregamento passaram " + dias + " dias (> 3): exigir novos ensaios e novo certificado"));
          else if (ok(dias) && dias < 0) linhas.push(A.marcar(A.linha({ criterio: "Certificado de análise", secao: cfg.certificado }), "pendente",
            "data do carregamento anterior à do certificado — confira"));
          if (!String(P.certificado || "").trim()) linhas.push(A.marcar(A.linha({ criterio: "Certificado de análise", secao: cfg.certificado }), "ressalva",
            "número do certificado do fabricante/fornecedor não informado (todo carregamento deve vir com ele)"));
        }
        if (cfg.extra) cfg.extra({ d: d, P: P, r: r, V: r.V, linhas: linhas, avisos: c.avisos });
        var rej = cfg.contraprova ? "CARREGAMENTO NÃO CONFORME — REJEITAR SE A CONTRAPROVA CONFIRMAR" : "CARREGAMENTO REJEITADO";
        r.parecer = A.parecer(linhas, [], {
          textos: {
            ACEITO: { titulo: "CARREGAMENTO ACEITO", texto: "Todos os ensaios da " + T + " atendem aos limites da classe (" + sec + ")." },
            RESSALVA: { titulo: "CARREGAMENTO ACEITO COM RESSALVA", texto: "Ensaios conformes, mas há ressalvas da inspeção ou da documentação (abaixo)." },
            PENDENTE: { titulo: "CARREGAMENTO PENDENTE", texto: "Nenhum resultado fora da especificação, mas faltam ensaios da " + T +
              " ou informações exigidas: complete-os antes de aceitar o carregamento (" + sec + ")." },
            REJEITADO: { titulo: rej, texto: cfg.contraprova ? "Resultado fora da " + T + ": o carregamento é rejeitado se a contraprova confirmar (" + sec + ")."
              : "Resultado fora da " + T + ": o fornecimento é rejeitado (" + sec + ")." },
          },
          providencias: function (par) {
            if (par.parecer === "REJEITADO") return cfg.contraprova ? ["Ensaiar a contraprova (amostra de reserva) nos itens não conformes; confirmado o resultado, rejeitar o carregamento e notificar o fornecedor."]
              : ["Rejeitar o fornecimento e notificar o fornecedor para a substituição do material."];
            if (par.parecer === "PENDENTE") return ["Não empregar o material antes de completar os ensaios e a documentação" + (cfg.secaoUso ? " (" + cfg.secaoUso + ")" : "") + "."];
            return [];
          },
          nota: cfg.nota || "",
        });
        if (cfg.nome) {  // ex.: "fornecimento" (DNER-EM 364)
          r.parecer.titulo = r.parecer.titulo.replace(/CARREGAMENTO/g, cfg.nome.toUpperCase());
          r.parecer.texto = r.parecer.texto.replace(/carregamento/g, cfg.nome);
          r.parecer.prov = r.parecer.prov.map(function (t) { return t.replace(/carregamento/g, cfg.nome); });
        }
        return c;
      };
      F.resultadosHtml = function (calc, d) { return A.htmlParecer(calc.resultados.parecer) + html0(calc, d); };
      F.relatorio.resultados = function (calc, d) { return [["Parecer do " + (cfg.nome || "carregamento"), calc.resultados.parecer.titulo]].concat(rel0(calc, d)); };
      F.relatorio.extraHtml = function (calc, d) { return A.htmlParecer(calc.resultados.parecer, { relat: true }) + ext0(calc, d); };
      return F;
    }

    return { M: M, importar: importar, espuma: espuma, rtfotMassa: rtfotMassa, paramInspecao: paramInspecao, lote: lote, codigo: codigo, nstr: nstr };
  })();
  var X = RL.ext;

  // =====================================================================================
  // DNIT 129/2011-EM — Tabela 1 do Anexo A
  // =====================================================================================
  var C = ["55/75-E", "60/85-E", "65/90-E"];
  function por(vals) { var o = {}; C.forEach(function (c, i) { o[c] = vals[i]; }); return o; }
  function todos(l) { return por([l, l, l]); }
  var G1 = "CAP modificado — ligante original (Tabela 1)", G2 = "Efeito do calor e do ar — RTFOT a 163 °C, 85 min (NBR 15235)";
  var BK = "NBR 15184";

  var ENSAIOS = [
    { id: "pen", grupo: G1, r: "Penetração (25 °C, 5 s, 100 g)", u: "0,1 mm", casas: 0, metodo: "DNIT 155/2010-ME",
      lim: por([L(45, 70), L(40, 70), L(40, 70)]), nMin: 3, nMinRef: "NBR 6576 / DNIT 155", verifica: RL.tolPenetracao("Penetração") },
    { id: "pa", grupo: G1, r: "Ponto de amolecimento, mín.", u: "°C", casas: 1, metodo: "DNIT 131/2010-ME", lim: por([L(55, null), L(60, null), L(65, null)]) },
    { id: "fulgor", grupo: G1, r: "Ponto de fulgor, mín.", u: "°C", casas: 0, metodo: "NBR 11341 · DNER-ME 148/94", lim: todos(L(235, null)) },
    { id: "bk135", grupo: G1, r: "Viscosidade Brookfield a 135 °C, spindle 21, 20 rpm, máx.", u: "cP", casas: 0, metodo: BK, lim: todos(L(null, 3000)) },
    { id: "bk150", grupo: G1, r: "Viscosidade Brookfield a 150 °C, spindle 21, 50 rpm, máx.", u: "cP", casas: 0, metodo: BK, lim: todos(L(null, 2000)) },
    { id: "bk177", grupo: G1, r: "Viscosidade Brookfield a 177 °C, spindle 21, 100 rpm, máx.", u: "cP", casas: 0, metodo: BK, lim: todos(L(null, 1000)) },
    { id: "sep", grupo: G1, r: "Separação de fase (diferença de PA), máx.", u: "°C", casas: 1, metodo: "NBR 15166 (≈ DNIT 384/2022-ME)", abs: true, lim: todos(L(null, 5)) },
    { id: "re", grupo: G1, r: "Recuperação elástica a 25 °C, 20 cm, mín.", u: "%", casas: 0, metodo: "DNIT 130/2010-ME", lim: por([L(75, null), L(85, null), L(90, null)]) },
    X.espuma(G1, todos({ igual: "não espuma" }), "6 d"),
    X.rtfotMassa(G2, todos(L(null, 1.0)), "NBR 15235", "(nota 1)"),
    { id: "paR", grupo: G2, tipo: "aux", r: "Ponto de amolecimento após RTFOT", u: "°C", casas: 1 },
    { id: "dpa", grupo: G2, tipo: "deriv", r: "Variação do PA, máx.", curto: "Variação do PA (−5 a +7 °C)", u: "°C", casas: 1, metodo: "DNIT 131/2010-ME", usa: ["paR", "pa"],
      formula: "PA após RTFOT − PA original", lim: todos(L(-5, 7)), f: function (V) { return V.paR - V.pa; } },
    { id: "penR", grupo: G2, tipo: "aux", r: "Penetração após RTFOT (25 °C, 5 s, 100 g)", u: "0,1 mm", casas: 1, verifica: RL.tolPenetracao("Penetração após RTFOT") },
    { id: "pret", grupo: G2, tipo: "deriv", r: "Percentagem de penetração original, mín.", u: "%", casas: 0, metodo: "DNIT 155/2010-ME", usa: ["penR", "pen"],
      formula: "PEN após RTFOT / PEN original × 100", lim: todos(L(60, null)), f: function (V) { return V.pen > 0 ? V.penR / V.pen * 100 : NaN; } },
    { id: "reR", grupo: G2, tipo: "aux", r: "Recuperação elástica após RTFOT (25 °C, 20 cm)", u: "%", casas: 0 },
    { id: "reret", grupo: G2, tipo: "deriv", r: "Percentagem de recuperação elástica original a 25 °C, mín.", curto: "% da RE original, mín.", u: "%", casas: 0,
      metodo: "DNIT 130/2010-ME", usa: ["reR", "re"], formula: "RE após RTFOT / RE original × 100", lim: todos(L(80, null)),
      f: function (V) { return V.re > 0 ? V.reR / V.re * 100 : NaN; } },
  ];

  var MAPAS = {
    "dnit-131-2010-me": X.M.pa(), "dnit-130-2010-me": X.M.re(), "dner-me-148-94": X.M.fulgor(), "dnit-384-2022-me": X.M.estab("sep"),
  };

  var F = RL.criar({
    titulo: "Recebimento de CAP modificado por polímero elastomérico",
    resumo: "Ensaios de recebimento do carregamento comparados com a Tabela 1 do Anexo A (55/75-E, 60/85-E, 65/90-E): penetração, ponto de amolecimento, fulgor, " +
      "viscosidades Brookfield, separação de fase, recuperação elástica, espuma e RTFOT (ΔM, variação do PA, % da penetração e da RE originais); importa PA, RE, fulgor e estabilidade das fichas ME.",
    tabela: "Tabela 1 (Anexo A)",
    textoTodos: "A amostra deve ser submetida aos ensaios da Tabela 1 do Anexo A (seção 7); o resultado geral vale só para os ensaios realizados.",
    rotuloClasse: "Tipo do CAP modificado por polímero (seção 4)",
    classes: C.map(function (c) { return [c, "CAP " + c]; }),
    padrao: { classe: "60/85-E", inspecao: "ok" },
    params: [X.paramInspecao("6")].concat(X.importar("dnit-129-2011-em", MAPAS,
      "DNIT 131 (PA; amostra após RTFOT → PA após RTFOT), DNIT 130 (RE; após RTFOT → RE após RTFOT), DNER-ME 148 (fulgor), DNIT 384 (diferença de PA, como separação de fase)")),
    dicaTabela: "RTFOT: uma coluna por recipiente",
    ensaios: ENSAIOS,
    avisos: function (res, V, P, avisos) {
      if (ok(V.penR) && !ok(V.pen)) avisos.push("Percentagem de penetração original: informe também a penetração do ligante original.");
      if (ok(V.paR) && !ok(V.pa)) avisos.push("Variação do PA: informe também o ponto de amolecimento do ligante original.");
      if (ok(V.reR) && !ok(V.re)) avisos.push("Percentagem de RE original: informe também a recuperação elástica do ligante original.");
      if (ok(V.sep) && /DNIT 384/.test(P.origemImp || "")) avisos.push("Separação de fase: a Tabela 1 cita a NBR 15166; o acervo tem a DNIT 384/2022-ME (estabilidade ao armazenamento, mesma diferença de PA topo × fundo) — confira o procedimento usado.");
    },
    notas: "Resultado de cada ensaio = média das determinações, comparada com a Tabela 1 do Anexo A da DNIT 129/2011-EM para o tipo. " +
      "ΔM = (Mi − Mf) / Mi × 100 (nota 1), comparada em valor absoluto com 1,0 %. Variação do PA = PA após RTFOT − PA original (−5 °C a +7 °C). " +
      "% da penetração original = PEN após RTFOT / PEN original × 100; % da RE original = RE após RTFOT / RE original × 100. " +
      "Certificado do fabricante com cada carregamento; novos ensaios e novo certificado se a fabricação e o carregamento distarem mais de 3 dias (seção 4). " +
      "O material não deve chegar com espuma (6 d). Aceitação (seção 7): todos os resultados atendendo, o carregamento é aceito; algum fora, é rejeitado se a contraprova confirmar.",
    exemplos: [
      { nome: "CAP 60/85-E — caracterização completa (RE importada das fichas DNIT 130), aceito", dados: function () {
        var d = { ident: { registro: "REC-AMP-EX-01", data: "2026-03-10", obra: "Obra A — usina de asfalto", origem: "Distribuidora A", camada: "CAP 60/85-E" },
          params: { classe: "60/85-E", inspecao: "ok", nf: "071245", quantidade: "28,4", procedencia: "Distribuidora A", certificado: "AMP-2026-114",
            dataCert: "08/03/2026", dataCarga: "09/03/2026", veiculo: "Carreta 1 — lacre 55821" },
          det: [{ pen: "52", pa: "63,4", fulgor: "284", bk135: "1850", bk150: "980", bk177: "420", sep: "1,8", espuma: "não espuma", mi: "35,110", mf: "34,902", paR: "66,2", penR: "38" },
            { pen: "53", pa: "63,8", fulgor: "288", bk135: "1830", bk150: "965", bk177: "415", mi: "35,046", mf: "34,851", paR: "66,6", penR: "37" },
            { pen: "51", penR: "38" }] };
        A.exemplos.importar(FE.FICHAS["dnit-129-2011-em"].params, d, "imp", [["dnit-130-2010-me", 0], ["dnit-130-2010-me", 1]]);
        return d;
      } },
      { nome: "CAP 65/90-E — RE e viscosidade fora, certificado com 5 dias (PA e RE importados)", dados: function () {
        var d = { ident: { registro: "REC-AMP-EX-02", data: "2026-04-15", obra: "Obra B — usina de asfalto", origem: "Distribuidora B", camada: "CAP 65/90-E" },
          params: { classe: "65/90-E", inspecao: "acond", nf: "113390", quantidade: "30,2", procedencia: "Distribuidora B", certificado: "Q-7781",
            dataCert: "10/04/2026", dataCarga: "15/04/2026" },
          det: [{ pen: "47", fulgor: "262", bk135: "3240", bk150: "1710", bk177: "690", sep: "3,6", espuma: "não espuma" },
            { pen: "46", fulgor: "266", bk135: "3180" }, { pen: "48" }] };
        A.exemplos.importar(FE.FICHAS["dnit-129-2011-em"].params, d, "imp", [["dnit-131-2010-me", 1], ["dnit-130-2010-me", 2]]);
        return d;
      } },
    ],
  });
  FE.FICHAS["dnit-129-2011-em"] = X.lote(F, { tabela: "Tabela 1 (Anexo A)", secao: "seção 7", secaoInspecao: "6", certificado: "4", contraprova: true, secaoUso: "5 a" });
})();
