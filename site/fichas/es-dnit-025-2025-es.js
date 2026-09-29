/*
 * Ficha de ACEITAÇÃO: DNIT 025/2025-ES — Drenagem — Bueiros celulares de concreto.
 *
 * O que a ES manda (seções do PDF):
 *   4     sinalização; sem serviço em dia de chuva; bueiro não assentado direto no fundo da vala; aduelas limpas, sem
 *         defeitos/quebras (encaixe macho e fêmea); valas de jusante para montante; escoramento obrigatório de vala com
 *         profundidade > 1,25 m (NR-18, NBR 9061); descida das aduelas por equipamento mecânico; ensecadeira removida.
 *   5.1   aduelas NBR 15396; concreto NBR 6118/12655 com fck do projeto; concreto magro fck ≥ 15 MPa (5.1.3);
 *         aço CA-50 (NBR 7480) e telas CA-60 (NBR 7481); argamassa das juntas rígidas 1:3 em massa; graute NBR 16868-2;
 *         manta geotêxtil não tecida; compensado resinado (DNIT 120-ES) e EPS (NBR 16866) nas juntas.
 *   5.3.1 réguas e gabaritos a cada 5 m; aterro de assentamento em camadas ≤ 0,20 m; folga lateral da vala ≥ 0,50 m.
 *   5.3.2 moldado in loco: berço; lastro de concreto magro 15 MPa com 10 cm e folga lateral de 15 cm; vibração;
 *         juntas de dilatação a cada 20,0 m (sem projeto específico); manta com largura ≥ 0,40 m.
 *   5.3.3 pré-moldado: NBR 15645; juntas rígidas 1:3 com 1,0 a 2,0 cm; manta ≥ 0,40 m; furos de içamento grauteados;
 *         NOTA 5: linhas duplas/triplas separadas por 10 cm preenchidos com concreto magro 15 MPa.
 *   5.3.4 aterro sobre o bueiro em camadas ≤ 20 cm com compactação portátil até 50 cm acima da geratriz superior;
 *         sem vibração até 2 m; NOTA 6: recobrimento < 50 cm → laje de travamento ≥ 15 cm (recomendação).
 *   7.1   controle do concreto pela NBR 12655/6118; plano de retirada de CPs; consistência (NBR 16889 / 15823-2) na
 *         1ª amassada do dia, após interrupção > 2 h, a cada moldagem de CPs, na troca de operador e com variação de
 *         umidade dos agregados; NOTA 8: testemunhos não servem de controle regular.
 *   7.2.1 seções transversais: diferença ≤ 1 % do projeto em pontos isolados; espessuras: ± 10 % da de projeto.
 *   7.2.2 acabamento (visual) sem prejuízo hidráulico; embasamento e enchimento das valas acompanhados.
 *   7.3   fck,est ≥ fck → conformidade; fck,est < fck → não conformidade. Detalhe mal executado deve ser corrigido;
 *         só é aceito se a correção o colocar em conformidade.
 * A ES não define como estimar o fck (remete à ABNT NBR 12655): a ficha usa a NBR 12655 (amostragem parcial,
 * total ou caso excepcional; ψ6 da tabela da NBR 12655) — ver FE.aceitacaoDrenagem abaixo.
 *
 * Este arquivo também define FE.aceitacaoDrenagem (fck,est pela NBR 12655 e tabela de controle geométrico por
 * desvio relativo ao projeto), usado pelas fichas das DNIT 026, 030 e 096 (carregadas depois desta no index.html).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  // =====================================================================================
  // FE.aceitacaoDrenagem — utilidades comuns das ES de drenagem com concreto
  // =====================================================================================
  if (!FE.aceitacaoDrenagem) FE.aceitacaoDrenagem = (function () {
    var D = {};
    // ψ6 da ABNT NBR 12655 (tabela de ψ6 em função do nº de exemplares e da condição de preparo)
    var PSI6 = { n: [2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16],
      A: [0.82, 0.86, 0.89, 0.91, 0.92, 0.94, 0.95, 0.97, 0.99, 1.00, 1.02],
      B: [0.75, 0.80, 0.84, 0.87, 0.89, 0.91, 0.93, 0.96, 0.98, 1.00, 1.02] };
    D.PSI6 = PSI6;
    // n não tabelado (9, 11, 13, 15): ψ6 do n tabelado imediatamente inferior (menor ψ6 = a favor da segurança)
    D.psi6 = function (n, cond) {
      if (!(n >= 2)) return NaN;
      var t = cond === "A" ? PSI6.A : PSI6.B, v = NaN;
      PSI6.n.forEach(function (x, i) { if (x <= n) v = t[i]; });
      return v;
    };
    // fck,est (ABNT NBR 12655): modo "parcial" (n ≥ 6; fck,est = 2(f1+…+fm−1)/(m−1) − fm, m = n/2, desprezando o
    // maior valor se n for ímpar; não menor que ψ6·f1), "total" (n ≤ 20: f1; n > 20: fi, i = 0,05n arredondado para
    // cima) e "excepcional" (lote ≤ 10 m³ com 2 a 5 exemplares: ψ6·f1).
    D.fckEst = function (vals, modo, cond) {
      var f = (vals || []).filter(ok).slice().sort(function (a, b) { return a - b; }), n = f.length, r = { n: n, f: f, modo: modo };
      if (!n) { r.erro = "sem exemplares"; return r; }
      var psi = D.psi6(n, cond);
      if (modo === "total") {
        if (n <= 20) { r.est = f[0]; r.regra = "amostragem total, n ≤ 20: fck,est = f1"; }
        else { var i = Math.ceil(0.05 * n - 1e-9); r.est = f[i - 1]; r.regra = "amostragem total, n > 20: fck,est = f" + i + " (i = 0,05·n)"; }
        return r;
      }
      if (modo === "excepcional") {
        if (n < 2) { r.erro = "o caso excepcional exige de 2 a 5 exemplares"; return r; }
        if (n > 5) r.aviso = "caso excepcional com " + n + " exemplares (a NBR 12655 o prevê para 2 a 5): considere a amostragem parcial";
        r.psi = psi; r.est = psi * f[0]; r.regra = "caso excepcional (lote ≤ 10 m³): fck,est = ψ6·f1 = " + fmt(psi, 2) + " × " + fmt(f[0], 1);
        return r;
      }
      if (n < 6) { r.erro = "amostragem parcial exige no mínimo 6 exemplares (NBR 12655); com " + n + ", use o caso excepcional (lote ≤ 10 m³) ou complete o lote"; return r; }
      var nn = n % 2 ? n - 1 : n, m = nn / 2, soma = 0;
      for (var j = 0; j < m - 1; j++) soma += f[j];
      r.m = m; r.psi = psi; r.formula = 2 * soma / (m - 1) - f[m - 1]; r.minPsi = psi * f[0];
      r.est = Math.max(r.formula, r.minPsi);
      r.regra = "amostragem parcial: m = " + m + (n % 2 ? " (maior valor desprezado, n ímpar)" : "") + "; 2·(f1+…+f" + (m - 1) + ")/" + (m - 1) + " − f" + m + " = " +
        fmt(r.formula, 1) + "; ψ6·f1 = " + fmt(psi, 2) + " × " + fmt(f[0], 1) + " = " + fmt(r.minPsi, 1);
      return r;
    };
    D.OPC_MODO = [["parcial", "Amostragem parcial (n ≥ 6)"], ["total", "Amostragem total (todas as betonadas)"], ["excepcional", "Caso excepcional (lote ≤ 10 m³, 2 a 5 exemplares)"]];
    D.paramCond = { k: "condPreparo", r: "Condição de preparo do concreto (NBR 12655, para ψ6)", tipo: "select",
      opcoes: [["A", "A — cimento e agregados medidos em massa"], ["B", "B ou C — agregados medidos em volume / massa com correção"]] };
    D.paramModo = function (id, rotulo, se) {
      var p = { k: "modo_" + id, r: "Controle do " + rotulo + " (NBR 12655)", tipo: "select", opcoes: D.OPC_MODO };
      if (se) p.se = function (d) { return se((d && d.params) || {}); };
      return p;
    };
    // item "valor" de fichaSimples para os exemplares (maior valor do exemplar) de um concreto, importável da DNER-ME 091
    D.itemFc = function (o) {
      var idade = o.idade || 28;
      return { id: o.id, grupo: o.grupo, texto: o.texto, secao: o.secao, tipo: "valor", unid: "MPa", casas: 1, se: o.se, naoAplicaPor: o.naoAplicaPor,
        exigido: "fck,est ≥ fck", metodo: "ABNT NBR 12655 (CPs: DNER-ME 091 / NBR 5739)", freq: o.freq,
        importar: { de: "dner-me-091-98", valores: function (e) {
          return ((e.resultados || {}).lista || []).filter(function (x) { return x.idade === idade; })
            .map(function (x) { return { v: x.fc, rot: x.nome + " (" + idade + " d)" }; });
        } } };
    };
    // avalia fck,est ≥ fck na linha do item (substitui a avaliação individual padrão da fichaSimples)
    D.avaliarFck = function (ctx, id, fck, o) {
      o = o || {};
      var l = ctx.item[id];
      if (!l || l.situacao === "nao_exigido") return l;
      var vals = (ctx.d[id] || []).map(function (c) { return num(c.v); }).filter(ok);
      var modo = o.modo || "parcial", cond = o.cond || "B", u = " MPa";
      delete l.est; delete l.fora;
      l.motivos = []; l.motivo = ""; l.situacao = "conforme"; l.n = vals.length; l.media = vals.length ? FE.media(vals) : NaN;
      l.lim = { min: fck }; l.exigido = ok(fck) ? "fck,est ≥ " + fmt(fck, 1) + u : "fck,est ≥ fck (informe o fck)";
      l.regra = "fck,est (NBR 12655)";
      if (!vals.length) { l.resultado = "—"; A.marcar(l, "sem_dados", "sem exemplares de resistência à compressão"); return l; }
      var r = D.fckEst(vals, modo, cond);
      if (ok(r.est)) r.est = Math.round(r.est * 10 + 1e-9) / 10;  // fck,est expresso com 0,1 MPa antes da comparação
      l.fck = { fck: fck, r: r, vals: (ctx.d[id] || []).map(function (c, i) { return { v: num(c.v), rot: c.pos || c.reg || "ex. " + (i + 1) }; }).filter(function (p) { return ok(p.v); }) };
      l.resultado = "n = " + r.n + " · f1 = " + fmt(r.f[0], 1) + u + (ok(r.est) ? " · fck,est = " + fmt(r.est, 1) + u : "");
      if (r.erro) { A.marcar(l, "pendente", r.erro); return l; }
      if (r.aviso) ctx.avisos.push(l.criterio + ": " + r.aviso + ".");
      if (!ok(fck)) { A.marcar(l, "pendente", "informe o fck de projeto"); return l; }
      if (r.est < fck - 1e-9) A.marcar(l, "nao_conforme", "fck,est = " + fmt(r.est, 1) + " < fck = " + fmt(fck, 1) + u + " — não conformidade (" + (o.secao || "7.3") + "); " + r.regra);
      else l.motivo = "fck,est = " + fmt(r.est, 1) + " ≥ " + fmt(fck, 1) + u + " (" + (o.secao || "7.3") + "); " + r.regra;
      return l;
    };
    D.graficoFck = function (l, opt) {
      if (!l || !l.fck || !l.fck.vals.length) return null;
      var F = l.fck, pts = F.vals.map(function (p, i) { return { x: i + 1, y: p.v, fora: ok(F.fck) && p.v < F.fck }; });
      var lin = [];
      if (ok(F.fck)) lin.push({ y: F.fck, tipo: "lim", txt: "fck " + fmt(F.fck, 1) });
      if (ok(F.r.est)) lin.push({ y: F.r.est, tipo: "ks", txt: "fck,est " + fmt(F.r.est, 1) });
      return A.grafico(l.criterio + " — exemplares (MPa)", pts, lin, opt, "idx");
    };

    // ---------- controle geométrico: medido × projeto ----------
    // tipos: "D" dimensão da seção transversal (|desvio| ≤ tolD %), "E" espessura (± tolE %), "C" comprimento/outro (informativo)
    D.tabelaGeom = function (o) {
      return { chave: o.chave || "geom", titulo: o.titulo || "Controle geométrico — medido × projeto (7.2.1)", rotulo: "Medida", iniciais: o.iniciais || 3, min: 1,
        dica: o.dica || "uma coluna por medida; Tipo: D = dimensão da seção transversal (vão, altura, largura), E = espessura (laje, parede, lastro); projeto e medido na mesma unidade",
        linhas: [{ k: "est", r: "Local / seção", texto: true }, { k: "elem", r: "Elemento medido", texto: true },
          { k: "tipo", r: o.rotTipo || "Tipo (D = dimensão; E = espessura)", texto: true }, { k: "proj", r: "Valor de projeto", u: o.unid || "" },
          { k: "med", r: "Valor medido", u: o.unid || "" }, { calc: "desv", r: "Desvio em relação ao projeto", u: "%", casas: 2 }] };
    };
    function tipoGeom(t) {
      t = String(t || "").trim().toUpperCase();
      if (/^D/.test(t)) return "D";
      if (/^E/.test(t)) return "E";
      return "";
    }
    D.desviosGeom = function (lista) {
      return (lista || []).map(function (c, i) {
        var p = num(c.proj), m = num(c.med);
        return { i: i, tipo: tipoGeom(c.tipo), desv: ok(p) && ok(m) && p !== 0 ? (m - p) / p * 100 : NaN, est: c.est || "", rot: (c.elem || "medida " + (i + 1)) + (c.est ? " — " + c.est : ""), c: c };
      });
    };
    // acrescenta as linhas "Dimensões das seções" e "Espessuras" ao ctx (fichaSimples.extra)
    D.avaliarGeom = function (ctx, o) {
      o = o || {};
      var ds = D.desviosGeom(ctx.d[o.chave || "geom"]), sec = o.secao || "7.2.1", grupo = o.grupo || "Controle geométrico (" + sec + ")";
      var semTipo = ds.filter(function (x) { return ok(x.desv) && !x.tipo; });
      if (semTipo.length) ctx.avisos.push("Controle geométrico: " + semTipo.length + " medida(s) sem tipo D/E — não avaliadas (" + semTipo.map(function (x) { return x.rot; }).join("; ") + ").");
      function pts(tp, abs) { return ds.filter(function (x) { return x.tipo === tp && ok(x.desv); }).map(function (x) { return { v: abs ? Math.abs(x.desv) : x.desv, rot: x.rot }; }); }
      var novas = [];
      novas.push(A.avaliar({ id: "geomD", grupo: grupo, criterio: "Dimensões das seções transversais — |desvio| em relação ao projeto", secao: sec, unid: "%", casas: 2,
        pontos: pts("D", true), max: o.tolD === undefined ? 1 : o.tolD, individual: true, falha: o.falha || "nao_conforme",
        exigido: "≤ " + fmt(o.tolD === undefined ? 1 : o.tolD, 0) + " % em pontos isolados" }));
      if (o.tolE !== null) novas.push(A.avaliar({ id: "geomE", grupo: grupo, criterio: "Espessuras — desvio em relação à espessura de projeto", secao: sec, unid: "%", casas: 2,
        pontos: pts("E"), min: -(o.tolE || 10), max: o.tolE || 10, individual: true, falha: o.falha || "nao_conforme",
        exigido: "± " + fmt(o.tolE || 10, 0) + " % (todas as medidas)" }));
      else if (pts("E").length) ctx.avisos.push("Controle geométrico: a ES não fixa tolerância de espessura — medidas tipo E não avaliadas.");
      novas.forEach(function (l) {
        if (l.situacao === "sem_dados") { l.situacao = "pendente"; l.motivo = "sem medidas deste tipo na tabela de controle geométrico"; l.motivos = [{ situacao: "pendente", texto: l.motivo }]; }
        ctx.linhas.push(l); ctx.item[l.id] = l;
        ctx.freqs.push(A.frequencia({ ensaio: l.criterio.split(" — ")[0], metodo: "levantamento topográfico / trena", regra: "conforme Notas de Serviço (" + sec + ")", exigido: 1, realizado: l.n || 0 }));
      });
      return novas;
    };
    // encaixa tabelas extras, a coluna calculada de desvios e gráficos extras numa ficha da fichaSimples
    D.estender = function (F, o) {
      var tab0 = F.tabelas, calc0 = F.calcular, graf0 = F.graficos;
      F.tabelas = function (d) { return tab0(d).concat(o.tabelas ? o.tabelas(d) : []); };
      F.calcular = function (d) {
        var r = calc0(d);
        (o.geom || []).forEach(function (ch) { r.tab[ch] = D.desviosGeom(d[ch]).map(function (x) { return { desv: x.desv }; }); });
        // ficha sem estacas (dispositivo isolado): "local" é texto livre — gráficos por nº da determinação
        if (o.semEstaca) r.resultados.linhas.forEach(function (l) { (l.pontos || []).forEach(function (p) { p.x = NaN; }); });
        return r;
      };
      F.graficos = function (calc, d, opt) {
        var extra = (o.fck || []).map(function (id) { return D.graficoFck(calc.resultados.linhas.filter(function (l) { return l.id === id; })[0], opt); }).filter(Boolean);
        var g = graf0(calc, d, opt).filter(function (s) { return !/fe-graf-vazio/.test(s); });
        var out = extra.concat(g);
        return out.length ? out : ['<div class="fe-graf-vazio">Os gráficos aparecem com os valores medidos.</div>'];
      };
      return F;
    };
    // linha informativa (não entra no parecer)
    D.info = function (ctx, o) {
      var l = A.linha({ id: o.id, grupo: o.grupo || "", criterio: o.criterio, secao: o.secao || "", exigido: o.exigido || "—", resultado: o.resultado || "—", situacao: "informativo", motivo: o.motivo || "" });
      ctx.linhas.push(l); ctx.item[o.id] = l;
      return l;
    };
    return D;
  })();

  // =====================================================================================
  // Ficha DNIT 025/2025-ES
  // =====================================================================================
  var D = FE.aceitacaoDrenagem;
  function P_(P, k) { return P[k] || ""; }
  function inloco(P) { return P_(P, "tipo") !== "premoldado"; }
  function premold(P) { return P_(P, "tipo") === "premoldado"; }
  function linhasMult(P) { return num(P.linhas) > 1; }
  var GM = "Materiais (5.1)", GC = "Controle do concreto (7.1; 7.3)", GE = "Execução (4; 5.3)", GA = "Acabamento e meio ambiente (6; 7.2.2)";

  var F = A.fichaSimples({
    id: "dnit-025-2025-es",
    titulo: "Bueiros celulares de concreto — aceitação (DNIT 025/2025-ES)",
    resumo: "Aceitação de um bueiro celular moldado in loco ou pré-moldado: materiais (5.1), controle do concreto com fck,est ≥ fck (7.1; 7.3, NBR 12655), execução (4; 5.3), controle geométrico com seções a ± 1 % e espessuras a ± 10 % do projeto (7.2.1) e acabamento (7.2.2).",
    lote: false,
    params: [
      { k: "bueiro", r: "Identificação do bueiro", ph: "ex.: BSCC 2,00 × 2,00 — est. 120+10" },
      { k: "tipo", r: "Tipo de execução", tipo: "select", recarrega: true, opcoes: [["inloco", "Moldado in loco (5.3.2)"], ["premoldado", "Pré-moldado — aduelas (5.3.3)"]] },
      { k: "linhas", r: "Número de linhas (células lado a lado)", tipo: "select", recarrega: true, opcoes: [["1", "Simples"], ["2", "Duplo"], ["3", "Triplo"]] },
      { k: "comp", r: "Comprimento do bueiro (m)" },
      { k: "profVala", r: "Profundidade máxima da vala (m)", dica: "> 1,25 m: escoramento obrigatório (4)" },
      { k: "recobr", r: "Altura de aterro sobre a laje superior (m)", dica: "< 0,50 m: NOTA 6 recomenda laje de travamento ≥ 15 cm" },
      { k: "cotaMont", r: "Cota executada da soleira — montante (m)" },
      { k: "cotaJus", r: "Cota executada da soleira — jusante (m)" },
      { k: "declProj", r: "Declividade de projeto (%)" },
      { k: "fck", r: "fck do concreto estrutural — projeto (MPa)", dica: "5.1.2: conforme o projeto estrutural aprovado" },
      D.paramCond,
      D.paramModo("fc", "concreto estrutural"),
      D.paramModo("fcm", "concreto magro", function (P) { return inloco(P) || linhasMult(P); }),
    ],
    padrao: { tipo: "inloco", linhas: "1", condPreparo: "B", modo_fc: "parcial", modo_fcm: "excepcional", fck: "25" },
    refs: { reprova: "7.3", corrige: "7.3", regra: "7.3" },
    providencias: function (par) { return par.parecer === "ACEITO" ? [] : ["Todo detalhe incorreto ou mal executado deve ser corrigido; o serviço corrigido só é aceito se a correção o colocar em conformidade com a ES (7.3).",
      "Não conformidades tratadas e registradas conforme a DNIT 011-PRO (7.3)."]; },
    criterios: [
      // materiais
      { id: "aduelas", grupo: GM, texto: "Aduelas conforme NBR 15396 e projeto; células limpas, sem defeitos ou quebras (encaixe macho e fêmea)", secao: "4; 5.1.1", tipo: "sim_nao", se: premold, naoAplicaPor: "moldado in loco" },
      D.itemFc({ id: "fc", grupo: GM, texto: "Concreto estrutural — resistência à compressão aos 28 dias (exemplares)", secao: "5.1.2; 7.3" }),
      D.itemFc({ id: "fcm", grupo: GM, texto: "Concreto magro (lastro / enchimento entre linhas) — fck ≥ 15 MPa", secao: "5.1.3; 7.3",
        se: function (P) { return inloco(P) || linhasMult(P); }, naoAplicaPor: "pré-moldado em linha simples (sem lastro nem enchimento)" }),
      { id: "aco", grupo: GM, texto: "Aço CA-50 (NBR 7480); telas soldadas CA-60 (NBR 7481) quando previstas", secao: "5.1.4", tipo: "sim_nao" },
      { id: "argam", grupo: GM, texto: "Argamassa das juntas rígidas: cimento e areia 1:3 em massa (sistema não estanque) ou projeto específico", secao: "5.1.5", tipo: "sim_nao", se: premold, naoAplicaPor: "moldado in loco" },
      { id: "graute", grupo: GM, texto: "Graute dos furos de içamento conforme NBR 16868-2", secao: "5.1.6", tipo: "sim_nao", se: premold, naoAplicaPor: "moldado in loco" },
      { id: "manta", grupo: GM, texto: "Manta geotêxtil não tecida com as propriedades do projeto", secao: "5.1.7", tipo: "sim_nao" },
      { id: "juntasMat", grupo: GM, texto: "Juntas: compensado resinado (DNIT 120-ES) e EPS (NBR 16866)", secao: "5.1.8; 5.1.9", tipo: "sim_nao", se: inloco, naoAplicaPor: "pré-moldado (juntas rígidas)" },
      // controle do concreto
      { id: "plano", grupo: GC, texto: "Plano de retirada de CPs e de amostras de aço, cimento e agregados estabelecido previamente", secao: "7.1", tipo: "sim_nao" },
      { id: "consist", grupo: GC, texto: "Consistência (NBR 16889 / NBR 15823-2) na 1ª amassada do dia, após interrupção > 2 h, a cada moldagem de CPs, na troca de operador e com variação de umidade dos agregados", secao: "7.1", tipo: "sim_nao" },
      // execução
      { id: "sinal", grupo: GE, texto: "Sinalização da obra implantada e mantida; serviço não executado em dia de chuva", secao: "4", tipo: "sim_nao" },
      { id: "locacao", grupo: GE, texto: "Locação topográfica com réguas e gabaritos a cada 5 m (alinhamento, profundidade e declividade)", secao: "5.3.1 b", tipo: "sim_nao" },
      { id: "valas", grupo: GE, texto: "Valas abertas de jusante para montante; bueiro não assentado diretamente no fundo da vala", secao: "4", tipo: "sim_nao" },
      { id: "escora", grupo: GE, texto: "Escoramento da vala (profundidade > 1,25 m ou solo sujeito a desmoronamento) — NR-18 / NBR 9061", secao: "4", tipo: "sim_nao",
        se: function (P) { return !ok(num(P.profVala)) || num(P.profVala) > 1.25; }, naoAplicaPor: "vala ≤ 1,25 m (exigido também se o solo for instável)" },
      { id: "folga", grupo: GE, texto: "Folga lateral da vala para o berço (cada lado)", secao: "5.3.1 c", tipo: "valor", unid: "m", casas: 2, min: 0.5 },
      { id: "camadas", grupo: GE, texto: "Espessura das camadas de aterro de assentamento e do reaterro sobre o bueiro", secao: "5.3.1 c; 5.3.4", tipo: "valor", unid: "cm", casas: 1, max: 20 },
      { id: "berco", grupo: GE, texto: "Berço de rachão ou brita graduada compactada conforme projeto", secao: "5.3.2 a; 5.3.3 a", tipo: "sim_nao" },
      { id: "lastro", grupo: GE, texto: "Espessura do lastro de concreto magro (10 cm ± 10 %)", secao: "5.3.2 b; 7.2.1", tipo: "valor", unid: "cm", casas: 1, min: 9, max: 11,
        exigido: "10 cm ± 10 % (9,0 a 11,0 cm)", se: inloco, naoAplicaPor: "pré-moldado" },
      { id: "folgaLastro", grupo: GE, texto: "Folga lateral do lastro de concreto magro (cada lado)", secao: "5.3.2 b", tipo: "valor", unid: "cm", casas: 0, min: 15, se: inloco, naoAplicaPor: "pré-moldado" },
      { id: "concretagem", grupo: GE, texto: "Concretagem por etapas com adensamento por vibração; fôrmas com desmoldante; vigas de cabeceira/muros de testa com a laje superior", secao: "5.3.2 c–j", tipo: "sim_nao", se: inloco, naoAplicaPor: "pré-moldado" },
      { id: "juntasDil", grupo: GE, texto: "Espaçamento das juntas de dilatação (sem projeto específico)", secao: "5.3.2 k", tipo: "valor", unid: "m", casas: 1, max: 20, falha: "ressalva",
        exigido: "a cada 20,0 m (ou conforme projeto)", se: inloco, naoAplicaPor: "pré-moldado" },
      { id: "larguraManta", grupo: GE, texto: "Largura da manta geotêxtil sobre as juntas (faces externas)", secao: "5.3.2 l; 5.3.3 d", tipo: "valor", unid: "m", casas: 2, min: 0.4 },
      { id: "manuseio", grupo: GE, texto: "Aduelas manuseadas pelos pontos de içamento com equipamento adequado (sem empilhadeira) e descidas na vala por equipamento mecânico", secao: "4; 5.3.3 b", tipo: "sim_nao", se: premold, naoAplicaPor: "moldado in loco" },
      { id: "espJunta", grupo: GE, texto: "Espessura das juntas rígidas de argamassa", secao: "5.3.3 c", tipo: "valor", unid: "cm", casas: 1, min: 1, max: 2, se: premold, naoAplicaPor: "moldado in loco" },
      { id: "furos", grupo: GE, texto: "Furos de içamento preenchidos com graute e recobertos com manta geotêxtil", secao: "5.3.3 e", tipo: "sim_nao", se: premold, naoAplicaPor: "moldado in loco" },
      { id: "sepLinhas", grupo: GE, texto: "Separação entre galerias em linhas duplas/triplas (preenchida com concreto magro 15 MPa)", secao: "5.3.3 NOTA 5", tipo: "valor", unid: "cm", casas: 1, min: 10,
        exigido: "10 cm", se: function (P) { return premold(P) && linhasMult(P); }, naoAplicaPor: "linha simples ou moldado in loco" },
      { id: "aterro", grupo: GE, texto: "Aterro sobre o bueiro: compactação com equipamento portátil até 50 cm acima da geratriz superior; sem vibração até 2 m; material de qualidade compatível", secao: "5.3.4", tipo: "sim_nao" },
      { id: "enseca", grupo: GE, texto: "Ensecadeira (quando prevista) removida após a conclusão do bueiro", secao: "4", tipo: "sim_nao" },
      { id: "declConf", grupo: GE, texto: "Declividade, cotas, localização e dimensões conforme projeto / Notas de Serviço (levantamento topográfico)", secao: "4; 7.2.1", tipo: "sim_nao" },
      // acabamento e meio ambiente
      { id: "acab", grupo: GA, texto: "Acabamento (visual) sem prejuízo à operação hidráulica; embasamento e enchimento das valas acompanhados", secao: "7.2.2", tipo: "sim_nao" },
      { id: "amb", grupo: GA, texto: "Condicionantes ambientais (DNIT 070-PRO e componente ambiental do projeto)", secao: "6", tipo: "sim_nao" },
    ],
    extra: function (ctx) {
      var P = ctx.P;
      D.avaliarFck(ctx, "fc", num(P.fck), { modo: P.modo_fc, cond: P.condPreparo, secao: "7.3" });
      D.avaliarFck(ctx, "fcm", 15, { modo: P.modo_fcm, cond: P.condPreparo, secao: "5.1.3; 7.3" });
      D.avaliarGeom(ctx, { secao: "7.2.1" });
      // declividade executada pelas cotas das soleiras
      var cm = num(P.cotaMont), cj = num(P.cotaJus), L = num(P.comp), ip = num(P.declProj);
      if (ok(cm) && ok(cj) && ok(L) && L > 0) {
        var i = (cm - cj) / L * 100;
        var l = D.info(ctx, { id: "decl", grupo: "Controle geométrico (7.2.1)", criterio: "Declividade executada pelas cotas das soleiras", secao: "4; 7.2.1",
          exigido: ok(ip) ? "a de projeto: " + fmt(ip, 2) + " % (a ES não fixa tolerância)" : "a de projeto",
          resultado: fmt(i, 2) + " %" + (ok(ip) ? " (projeto " + fmt(ip, 2) + " %; diferença " + A.fmtR(i - ip, 2) + " %)" : ""),
          motivo: "(" + fmt(cm, 3) + " − " + fmt(cj, 3) + ") / " + fmt(L, 2) + " m" });
        if (i <= 0) { l.situacao = "conforme"; A.marcar(l, "nao_conforme", "declividade nula ou contrária ao escoamento — prejudica a operação hidráulica (4; 7.2.2)"); }
      }
      var rec = num(P.recobr);
      if (ok(rec) && rec < 0.5) D.info(ctx, { id: "nota6", grupo: GE, criterio: "Recobrimento sobre a laje superior < 50 cm", secao: "5.3.4 NOTA 6",
        exigido: "recomendação: laje de travamento moldada in loco ≥ 15 cm", resultado: fmt(rec, 2) + " m", motivo: "confirme a laje de travamento prevista no projeto" });
    },
    notas: "Critérios da DNIT 025/2025-ES. fck,est pela ABNT NBR 12655 (a ES remete a ela): amostragem parcial (n ≥ 6) fck,est = 2(f1+…+fm−1)/(m−1) − fm, m = n/2, não menor que ψ6·f1; amostragem total fck,est = f1 (n ≤ 20) ou fi com i = 0,05n; caso excepcional (≤ 10 m³, 2 a 5 exemplares) fck,est = ψ6·f1. Exemplar = maior valor dos CPs da mesma amassada. Controle geométrico: |desvio| ≤ 1 % nas seções transversais (pontos isolados) e ± 10 % nas espessuras (7.2.1). A ES não fixa frequência de verificação: cada item é exigido ao menos uma vez por bueiro.",
    exemplos: [
      { nome: "Bueiro celular moldado in loco — aceito", dados: function () {
        var d = { ident: { registro: "BCC-A-001", data: "2026-07-10", obra: "Obra A — BR-000", trecho: "Bueiro celular simples", local: "Est. 120+10" },
          params: { bueiro: "BSCC 2,00 × 2,00 m — est. 120+10", tipo: "inloco", linhas: "1", comp: "24,0", profVala: "1,80", recobr: "3,20",
            cotaMont: "101,480", cotaJus: "101,240", declProj: "1,00", fck: "25", condPreparo: "A", modo_fc: "parcial", modo_fcm: "excepcional" },
          verificacoes: [], fc: [], fcm: [
            { est: "lastro 0–12 m", pos: "ex. M1", reg: "", v: "19,2" }, { est: "lastro 12–24 m", pos: "ex. M2", reg: "", v: "20,1" }],
          folga: [{ est: "montante", v: "0,55" }, { est: "jusante", v: "0,60" }],
          camadas: [{ est: "reaterro 1ª camada", v: "18" }, { est: "reaterro 2ª camada", v: "19" }, { est: "reaterro 3ª camada", v: "17" }],
          lastro: [{ est: "3 m", v: "10,2" }, { est: "12 m", v: "9,6" }, { est: "21 m", v: "10,5" }],
          folgaLastro: [{ est: "montante", v: "15" }, { est: "jusante", v: "16" }],
          juntasDil: [{ est: "junta J1", v: "12,0" }, { est: "junta J2", v: "12,0" }],
          larguraManta: [{ est: "junta J1", v: "0,45" }, { est: "junta J2", v: "0,42" }],
          geom: [
            { est: "S1 (4 m)", elem: "vão livre", tipo: "D", proj: "2,00", med: "2,01" },
            { est: "S1 (4 m)", elem: "altura livre", tipo: "D", proj: "2,00", med: "1,99" },
            { est: "S2 (16 m)", elem: "vão livre", tipo: "D", proj: "2,00", med: "2,015" },
            { est: "S1 (4 m)", elem: "laje superior", tipo: "E", proj: "0,25", med: "0,26" },
            { est: "S2 (16 m)", elem: "parede lateral", tipo: "E", proj: "0,25", med: "0,24" }] };
        // itens sim/não na ordem da ficha: todos atendidos (os não aplicáveis ficam vazios)
        F.simples.criterios.filter(function (it) { return it.tipo === "sim_nao"; }).forEach(function (it) {
          d.verificacoes.push(!it.se || it.se(d.params) ? { atende: "S", real: "1" } : {});
        });
        // concreto estrutural: 2 exemplares importados (DNER-ME 091, exemplo 2) + 4 digitados → amostragem parcial, n = 6
        A.exemplos.importar(F.params, d, "imp_fc", [["dner-me-091-98", 1]]);
        d.fc.forEach(function (c, i) { c.est = i ? "laje superior" : "laje de fundo"; });
        d.fc = d.fc.concat([{ est: "paredes", pos: "ex. E3", v: "28,6" }, { est: "paredes", pos: "ex. E4", v: "29,4" },
          { est: "laje superior", pos: "ex. E5", v: "30,2" }, { est: "cabeceiras", pos: "ex. E6", v: "27,0" }]);
        return d;
      } },
      { nome: "Bueiro celular pré-moldado duplo — rejeitado (fck,est, seção e junta)", dados: function () {
        var d = { ident: { registro: "BCC-B-002", data: "2026-08-22", obra: "Obra B — BR-000", trecho: "Bueiro celular duplo", local: "Est. 58+00" },
          params: { bueiro: "BDCC 1,50 × 1,50 m (aduelas) — est. 58+00", tipo: "premoldado", linhas: "2", comp: "18,0", profVala: "2,10", recobr: "0,40",
            cotaMont: "88,300", cotaJus: "88,120", declProj: "1,00", fck: "30", condPreparo: "B", modo_fc: "parcial", modo_fcm: "excepcional" },
          verificacoes: [],
          fc: [{ est: "aduela 1", v: "31,5" }, { est: "aduela 2", v: "28,2" }, { est: "aduela 3", v: "29,0" }, { est: "aduela 4", v: "33,1" },
            { est: "aduela 5", v: "27,4" }, { est: "aduela 6", v: "30,8" }, { est: "aduela 7", v: "32,0" }],
          fcm: [{ est: "enchimento entre linhas", pos: "ex. M1", v: "21,0" }, { est: "enchimento entre linhas", pos: "ex. M2", v: "22,4" }],
          folga: [{ est: "montante", v: "0,52" }, { est: "jusante", v: "0,50" }],
          camadas: [{ est: "reaterro 1ª camada", v: "20" }, { est: "reaterro 2ª camada", v: "24" }],
          larguraManta: [{ est: "junta 3", v: "0,40" }, { est: "junta 7", v: "0,40" }],
          espJunta: [{ est: "junta 3", v: "1,5" }, { est: "junta 5", v: "2,4" }, { est: "junta 7", v: "1,8" }],
          sepLinhas: [{ est: "montante", v: "10" }, { est: "jusante", v: "11" }],
          geom: [
            { est: "aduela 2", elem: "vão livre", tipo: "D", proj: "1,50", med: "1,51" },
            { est: "aduela 5", elem: "altura livre", tipo: "D", proj: "1,50", med: "1,47" },
            { est: "aduela 2", elem: "laje superior", tipo: "E", proj: "0,18", med: "0,18" }] };
        F.simples.criterios.filter(function (it) { return it.tipo === "sim_nao"; }).forEach(function (it) {
          if (it.se && !it.se(d.params)) { d.verificacoes.push({}); return; }
          d.verificacoes.push(it.id === "aduelas" ? { real: "9", nc: "1", obs: "aduela 5 com quebra no encaixe fêmea" } : { atende: "S", real: "1" });
        });
        return d;
      } },
    ],
  });
  D.estender(F, { tabelas: function () { return [D.tabelaGeom({ unid: "m" })]; }, geom: ["geom"], fck: ["fc", "fcm"], semEstaca: true });
})();
