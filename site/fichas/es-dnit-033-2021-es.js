/*
 * Ficha de ES: DNIT 033/2021-ES — Concreto asfáltico reciclado em usina a quente (ou morno) — ACEITAÇÃO DE LOTE.
 * Motor comum: FE.aceitacaoG3.criar (es-dnit-112-2009-es.js); base das ES do DNIT: FE.aceitacaoG3.familiaDNIT
 * (es-dnit-032-2005-es.js).
 *
 * A DNIT 033/2021 não fixa limites próprios: composição, controle da produção, verificação do produto, plano de
 * amostragem e conformidade seguem a "DNIT 031-ES vigente" (5.2, 7.1 a 7.4), que NÃO está no acervo. Os limites vêm
 * como parâmetros editáveis, com padrão igual aos da DNIT 031/2006-ES (os mesmos reproduzidos na DNIT 034/2005-ES, da
 * mesma família): Vv 3–5 / 4–6 %, RBV 75–82 / 65–72 %, estabilidade ≥ 500 kgf, RT ≥ 0,65 MPa, GC 97–101 %, espessura
 * ± 5 %, alinhamentos ± 5 cm, réguas 0,5 cm, QI < 35, VDR ≥ 45, HS 0,6–1,2 mm — confira com a 031 vigente e o projeto.
 * Itens próprios da 033: teor de RAP de projeto (4 c), umidade do RAP antes e ao longo do dia (7.1.1.3), teor de
 * ligante do RAP quando exigido em projeto (7.1.1.4), mistura morna (5.1.3) e parâmetros mecânicos compatíveis com o
 * projeto (5.2, 7.1.4 — RT e, se houver, módulo de resiliência).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G3 = FE.aceitacaoG3, num = FE.num, ok = FE.ok, fmt = FE.fmt, nstr = A.nstr;

  var PAD = { rolamento: { vv: [3, 5], rbv: [75, 82] }, ligacao: { vv: [4, 6], rbv: [65, 72] } };
  function v(P, k, pad) { var x = num(P[k]); return ok(x) ? x : pad; }
  function limites(P) {
    var c = PAD[P.camada === "rolamento" ? "rolamento" : "ligacao"];
    return { vv: [v(P, "vvMin", c.vv[0]), v(P, "vvMax", c.vv[1])], rbv: [v(P, "rbvMin", c.rbv[0]), v(P, "rbvMax", c.rbv[1])], est: v(P, "estMin", 500), rt: v(P, "rtMin", 0.65) };
  }
  var REV = function (P) { return P.camada === "rolamento"; };
  var MORNA = function (P) { return P.morna === "sim"; };
  var TEOR031 = { A: [4.0, 7.0], B: [4.5, 7.5], C: [4.5, 9.0] };

  G3.criar(G3.familiaDNIT({
    id: "dnit-033-2021-es", codigo: "DNIT 033/2021-ES",
    titulo: "Concreto asfáltico reciclado em usina a quente — aceitação de lote",
    resumo: "Reúne os ensaios do lote e aplica os critérios que a DNIT 033/2021-ES remete à DNIT 031-ES vigente (limites editáveis, padrão da DNIT 031/2006): teor ± 0,3 %, faixa de trabalho, Vv, RBV, estabilidade, RT, temperaturas, GC 97–101 %, espessura, alinhamentos, réguas, QI e segurança — mais os controles próprios do RAP: teor de RAP de projeto, umidade do RAP, teor de ligante do RAP e parâmetros mecânicos do projeto.",
    revestimento: REV, agregados: true, morna: MORNA, silos: true,
    secTeor: "7.1.4 → DNIT 031", secGran: "7.1.4 → DNIT 031", secTemp: "7.1.4 → DNIT 031; 5.1.3", secGC: "7.2 → DNIT 031", secEsp: "7.2 → DNIT 031", secGeo: "7.2 → DNIT 031",
    secAlin: "7.2 → DNIT 031", secRegua: "7.2 → DNIT 031", secChuva: "4 d, e", secIns: "7.1", secInsAceite: "7.1", secK: "7.3 → DNIT 031 (tabela de amostragem variável)",
    refs: { reprova: "7.4 → DNIT 031", atende: "7.4 → DNIT 031", corrige: "7.4 → DNIT 031", regra: "7.4 → DNIT 031" },
    camadas: [["rolamento", "Revestimento — camada de rolamento"], ["ligacao", "Camada de ligação (binder)"], ["base", "Base, regularização ou reforço (limites do binder)"]],
    dicaCamada: "4 a: revestimento, base, regularização ou reforço; limites padrão da DNIT 031/2006 por camada (editáveis abaixo)",
    faixas: ["dnit-034-2005-es-A", "dnit-034-2005-es-B", "dnit-034-2005-es-C", "dnit-385-2026-es-A-25", "dnit-385-2026-es-B-19", "dnit-385-2026-es-C-12-5", "dnit-385-2026-es-D-9-5"],
    rotFaixa: function (f) { return /034/.test(f.id) ? "Faixa " + f.faixa + " (DNIT 031/2006 = DNIT 034/2005)" : "Faixa " + f.faixa + " (DNIT 385/2026)"; },
    secFaixa: "5.2 → DNIT 031 ou projeto", retido4: "DNIT 031",
    teorFaixa: function (P, fx) { return fx && /034/.test(fx.id) ? TEOR031[fx.faixa] : null; },
    dicaTeor: "teor de ligante total de projeto (RAP + ligante novo); tolerância ± 0,3 % (DNIT 031)",
    dicaUsina: "extrações da mistura reciclada (DNER-ME 053; o ligante do RAP é extraído junto); adotado no mínimo 1 por jornada",
    phTLig: "107 a 177", dicaTLig: "DNIT 031: entre 107 e 177 °C (mistura morna: temperatura do projeto); ± 5 °C",
    padrao: { camada: "rolamento", morna: "nao", ligRap: "nao" },
    params: [
      { k: "rapProj", r: "Teor de RAP de projeto (%)", dica: "4 c: usar o teor de RAP previsto em projeto" },
      { k: "rapTol", r: "Tolerância do teor de RAP (± %) — opcional", dica: "a ES não fixa tolerância; vazio = só registra (informativo)" },
      { k: "morna", r: "Mistura morna (aditivo — 5.1.3)?", tipo: "select", opcoes: [["nao", "Não — temperaturas de CA a quente"], ["sim", "Sim — temperaturas reduzidas do projeto"]] },
      { k: "ligRap", r: "Projeto exige verificar o teor de ligante do RAP (7.1.1.4)?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "vvMin", r: "Vv mínimo (%) — vazio = DNIT 031/2006", ph: "3 / 4" }, { k: "vvMax", r: "Vv máximo (%)", ph: "5 / 6" },
      { k: "rbvMin", r: "RBV mínima (%)", ph: "75 / 65" }, { k: "rbvMax", r: "RBV máxima (%)", ph: "82 / 72" },
      { k: "estMin", r: "Estabilidade mínima (kgf)", ph: "500" },
      { k: "rtMin", r: "RT mínima (MPa) — projeto / DNIT 031", ph: "0,65", dica: "5.2 e 7.1.4: parâmetros mecânicos compatíveis com o projeto" },
      { k: "mrMin", r: "Módulo de resiliência mínimo de projeto (MPa) — opcional", recarrega: "tabela" },
      { k: "impMr", r: "Módulo de resiliência", tipo: "importarVarios", de: "dnit-135-2018-me",
        dica: "marque os ensaios e clique em \"Importar selecionados\": DNIT 135 (substitui as colunas importadas antes)",
        aplicar: function (lista, P, d) {
          A.importacao.substituir(d, "mr", lista.map(function (e) {
            var i = e.dados.ident || {}, r = e.resultados || {};
            return { reg: i.registro || "", data: A.dataBR(i.data), mr: nstr(r.mr, 0) };
          }));
        } },
    ],
    marshall: function (P) {
      var c = limites(P);
      return { secao: "7.1.4 → DNIT 031", dica: "médias de cada conjunto de CPs Marshall da produção (1 por jornada — DNIT 031)",
        itens: [
          { k: "vv", nome: "Porcentagem de vazios", unid: "%", casas: 1, min: c.vv[0], max: c.vv[1], modo: "estat" },
          { k: "rbv", nome: "Relação betume/vazios", unid: "%", casas: 1, min: c.rbv[0], max: c.rbv[1], modo: "estat" },
          { k: "est", nome: "Estabilidade (75 golpes)", unid: "kgf", casas: 0, min: c.est, modo: "estat", obrig: true },
        ],
        freq: function (L) { return { regra: "1 conjunto por jornada (DNIT 031)", exigido: ok(L.jor) ? L.jor : NaN }; } };
    },
    rt: { secao: "5.2, 7.1.4 → projeto / DNIT 031", min: function (P) { return limites(P).rt; }, dica: "1 por jornada",
      freq: function (L) { return { regra: "1 por jornada (DNIT 031)", exigido: ok(L.jor) ? L.jor : NaN }; } },
    tabelasExtra: function (P) {
      var t = [{ chave: "rap", titulo: "RAP — teor na mistura, umidade e teor de ligante (4 c, 7.1.1.3, 7.1.1.4)", rotulo: "Verificação", iniciais: 2, min: 1,
        dica: "umidade do RAP antes do início da produção e ao longo do dia; teor de RAP efetivamente dosado (registro da usina)",
        linhas: [{ k: "hora", r: "Jornada / hora", texto: true }, { k: "pct", r: "Teor de RAP dosado", u: "%" }, { k: "umid", r: "Umidade do RAP", u: "%" }, { k: "lig", r: "Teor de ligante do RAP", u: "%" }] }];
      if (ok(num(P.mrMin))) t.push({ chave: "mr", titulo: "Módulo de resiliência (5.2, 7.1.4 — projeto)", rotulo: "Ensaio", iniciais: 1, min: 1,
        linhas: [{ k: "reg", r: "Registro", texto: true }, { k: "data", r: "Data", texto: true }, { k: "mr", r: "MR (DNIT 135)", u: "MPa" }] });
      return t;
    },
    extra: function (ctx) {
      var P = ctx.P, L = ctx.L, rap = ctx.d.rap || [];
      var rp = num(P.rapProj), tol = num(P.rapTol);
      var pts = rap.map(function (r, i) { return { v: num(r.pct), rot: r.hora || "verificação " + (i + 1) }; }).filter(function (p) { return ok(p.v); });
      var l;
      if (ok(tol)) l = ctx.aval({ id: "rap", grupo: "RAP", criterio: "Teor de RAP dosado", secao: "4 c", unid: "%", casas: 1, min: rp - tol, max: rp + tol, pontos: pts,
        exigido: fmt(rp, 1) + " ± " + fmt(tol, 1) + " % (projeto)" }, "indiv");
      else {
        l = A.linha({ id: "rap", grupo: "RAP", criterio: "Teor de RAP dosado", secao: "4 c", unid: "%", casas: 1, exigido: ok(rp) ? "teor de projeto: " + fmt(rp, 1) + " %" : "teor de projeto", n: pts.length });
        if (!pts.length) { l.situacao = "pendente"; l.motivo = "registre o teor de RAP efetivamente dosado (4 c)"; }
        else {
          var xs = pts.map(function (p) { return p.v; });
          l.media = FE.media(xs); l.txtEstat = "—";
          l.resultado = (xs.length > 1 ? fmt(Math.min.apply(null, xs), 1) + " a " : "") + fmt(Math.max.apply(null, xs), 1) + " %";
          l.situacao = "informativo"; l.motivo = "a ES não fixa tolerância para o teor de RAP (informe a tolerância do projeto para verificar)";
        }
      }
      if (!ok(rp)) A.marcar(l, "pendente", "informe o teor de RAP de projeto (4 c)");
      ctx.linhas.push(l);
      var nU = rap.filter(function (r) { return ok(num(r.umid)); }).length;
      var lu = A.linha({ id: "rapU", grupo: "RAP", criterio: "Umidade do RAP (antes do início e ao longo do dia)", secao: "7.1.1.3", unid: "%", casas: 1, n: nU, exigido: "verificar (a ES não fixa limite)", txtEstat: "—" });
      if (nU) { var us = rap.map(function (r) { return num(r.umid); }).filter(ok); lu.media = FE.media(us); lu.resultado = (us.length > 1 ? fmt(Math.min.apply(null, us), 1) + " a " : "") + fmt(Math.max.apply(null, us), 1) + " %"; lu.situacao = "informativo"; lu.motivo = "registrada; ajustar a temperatura dos agregados virgens à umidade (Anexo C)"; }
      else { lu.situacao = "sem_dados"; lu.motivo = "sem determinações"; }
      ctx.linhas.push(lu);
      ctx.freqs.push(A.frequencia({ ensaio: "Umidade do RAP", metodo: "—", regra: "antes do início da produção e ao longo do dia (mín. 2 por jornada)", exigido: ctx.nJ(2, 2), realizado: nU }));
      if (P.ligRap === "sim") {
        var nL = rap.filter(function (r) { return ok(num(r.lig)); }).length;
        ctx.freqs.push(A.frequencia({ ensaio: "Teor de ligante do RAP", metodo: "DNER-ME 053", regra: "quando determinado em projeto (mín. 1 no lote)", exigido: 1, realizado: nL }));
      }
      var mrMin = num(P.mrMin);
      if (ok(mrMin)) {
        var pm = (ctx.d.mr || []).map(function (r, i) { return { v: num(r.mr), rot: r.reg || "ensaio " + (i + 1) }; }).filter(function (p) { return ok(p.v); });
        ctx.linhas.push(ctx.aval({ id: "mr", grupo: "Mistura — CPs Marshall", criterio: "Módulo de resiliência", secao: "5.2, 7.1.4 (projeto)", unid: "MPa", casas: 0, min: mrMin, pontos: pm }, "estat"));
      }
    },
    insumos: function (P, L) {
      return [
        ["cap", "Cimento asfáltico — ensaios da DNIT 031 (por carregamento)", G3.porCarreg(L), "nao_conforme"],
        ["gra", "Agregados virgens — granulometria de cada silo quente (DNIT 031, por jornada)", ok(L.jor) ? L.silos * L.jor : NaN, "ressalva"],
        ["ea", "Agregado miúdo — equivalente de areia (DNIT 031)", NaN, "ressalva"],
        ["rapc", "RAP — caracterização dos estoques (7.1.1.1, 7.1.1.2)", 1, "ressalva"],
      ];
    },
    notas: "DNIT 033/2021-ES: composição, controle da produção, do produto, plano de amostragem e conformidade seguem a DNIT 031-ES vigente (5.2, 7.1.4, 7.2 a 7.4), fora do acervo. Limites padrão desta ficha = DNIT 031/2006-ES (iguais aos da DNIT 034/2005-ES), editáveis. " +
      "Controle estatístico X̄ − k·s ≥ mínimo e/ou X̄ + k·s ≤ máximo com a tabela de amostragem variável (n = 5: 1,55 … n = 21: 1,01); n < 5: valores individuais; estatística atendida com valor individual fora: ressalva. Frequências adotadas: extração, Marshall e RT 1 por jornada; GC 1 a cada 700 m²; umidade do RAP 2 por jornada (antes do início e ao longo do dia). Teor de RAP: a ES não fixa tolerância — informativo, salvo tolerância de projeto.",
    exemplos: [
      { nome: "Lote aceito — binder faixa B com 20 % de RAP, 60 m (CPs Marshall, RT e densímetro importados dos exemplos das fichas ME)", dados: function () {
        var pens = [38.1, 25.4, 19.1, 9.5, 4.8, 2.0, 0.42, 0.18, 0.075], proj = [100, 97, 88, 62, 44, 32, 20, 13, 5.5];
        var d = G3.montar({ ident: { registro: "LOTE-RAP-004", data: "2026-06-10", obra: "Obra A", trecho: "BR-000 — km 8", local: "Est. 20+00 a 23+00",
            camada: "Camada de ligação — CA reciclado em usina, 20 % de RAP, faixa B", origem: "Usina A", laboratorista: "Equipe de controle" },
          params: { estIni: "20+00", estFim: "23+00", largura: "3,60", pista: "pista direita", camada: "ligacao", faixa: "dnit-034-2005-es-B", teorProj: "4,7", gmbProj: "2,380", espProj: "6,0",
            tLig: "155", tMist: "155", tComp: "145", dataIni: "2026-06-10", dataFim: "2026-06-10", jornadas: "1", massa: "31", nCarreg: "1", massaLig: "10", nSilos: "3", chuva: "nao", tAmb: "22",
            rapProj: "20", rapTol: "2", morna: "nao", ligRap: "nao" },
          pens: pens, proj: proj, teores: [4.66], pref: "EXT-0610", data: "10/06/2026",
          temp: [{ carga: "07h50", tagr: "168", tlig: "156", tsai: "154", tesp: "147" }, { carga: "12h40", tagr: "167", tlig: "154", tsai: "157", tesp: "144" }],
          estIni: "20+00", gc: [], gmbRef: 2.380, nGeo: 4,
          ins: [[1, 0], [3, 0], [1, 0], [1, 0]],
          obs: "Lote de demonstração: CPs Marshall (controle, binder), RT (DNIT 136) e grau de compactação pelo densímetro (DNIT 431) importados dos exemplos das fichas ME; demais valores digitados." });
        d.rap = [{ hora: "06h50 (antes do início)", pct: "20", umid: "2,1" }, { hora: "11h30", pct: "21", umid: "1,8" }];
        return d;
      }, depois: function (d, params) {
        A.exemplos.importar(params, d, "impMar", [["dnit-385-2026-es", 1]]);
        A.exemplos.importar(params, d, "impRt", [["dnit-136-2018-me", 0]]);
        A.exemplos.importar(params, d, "impPista", [["dnit-431-2020-me", 0]]);
        ["6,02", "5,96", "6,09", "6,00", "5,94", "6,06"].forEach(function (e, i) { if (d.pista[i]) d.pista[i].esp = e; });
        d.params.impUsina = []; d.params.impMr = [];
      } },
      { nome: "Lote rejeitado — rolamento com 30 % de RAP, 200 m: Vv e RBV fora; umidade e ligante do RAP incompletos (dados gerados)", dados: function () {
        var pens = [19.1, 12.7, 9.5, 4.8, 2.0, 0.42, 0.18, 0.075], proj = [100, 90, 80, 56, 35, 17, 10, 6];
        var gc = [98.2, 99.1, 97.8, 98.6, 99.4], esp = [5.02, 4.94, 5.10, 4.97, 5.05];
        var d = G3.montar({ ident: { registro: "LOTE-RAP-012", data: "2026-07-01", obra: "Obra C", trecho: "BR-000 — km 90", local: "Est. 50+00 a 60+00",
            camada: "Revestimento — CA reciclado em usina, 30 % de RAP, faixa C", origem: "Usina B", laboratorista: "Equipe de controle" },
          params: { estIni: "50+00", estFim: "60+00", largura: "7,00", pista: "pista única", camada: "rolamento", faixa: "dnit-034-2005-es-C", teorProj: "5,5", gmbProj: "2,372", espProj: "5,0",
            tLig: "155", tMist: "155", tComp: "145", dataIni: "2026-07-01", dataFim: "2026-07-01", jornadas: "1", massa: "165", nCarreg: "1", massaLig: "9", nSilos: "3", chuva: "nao", tAmb: "18",
            rapProj: "30", morna: "nao", ligRap: "sim", impUsina: [], impMar: [], impRt: [], impPista: [], impMr: [] },
          pens: pens, proj: proj, teores: [5.42, 5.61], pref: "EXT-0701", data: "01/07/2026",
          mar: [{ reg: "MAR-0701", data: "01/07/2026", teor: "5,45", gmb: "2,350", vv: "5,8", rbv: "72,0", est: "560", ncp: "3" }],
          rt: [0.81],
          temp: [{ carga: "07h30", tagr: "169", tlig: "155", tsai: "156", tesp: "146" }],
          estIni: "50+00", passoGC: 40, gc: gc, esp: esp, gmbRef: 2.372, nGeo: 11,
          sup: [{ est: "50+00 a 60+00", qi: "27", hs: "0,68", vdr: "53" }],
          ins: [[1, 0], [3, 0], [1, 0], [1, 0]],
          obs: "Dados gerados para demonstração: Vv e RBV fora dos limites do rolamento (mistura com 30 % de RAP); só uma medição de umidade do RAP; teor de ligante do RAP exigido em projeto e não determinado." });
        d.rap = [{ hora: "06h40 (antes do início)", pct: "30", umid: "3,4" }];
        return d;
      } },
    ],
  }));
})();
