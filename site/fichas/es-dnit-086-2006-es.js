/*
 * Ficha de ACEITAÇÃO: DNIT 086/2006-ES — Recuperação do sistema de drenagem (obras de arte especiais).
 *
 * O que a ES manda (seções do PDF):
 *   5.1 a) captação só no extremo mais baixo da obra: comprimento ≤ 50 m, declividade longitudinal ≥ 2 % e seções
 *         transversais com declividade ≥ 2 %; obra > 50 m com declividade longitudinal < 2 %: canaletas laterais com
 *         declividade não nula; casos desfavoráveis: curva vertical côncava → captação nos pontos mais baixos; curva
 *         horizontal com inclinação transversal única → só no lado mais baixo; declividade longitudinal nula →
 *         distribuída ao longo das canaletas dos dois lados.
 *   5.1 b) pavimento íntegro (tratado ou substituído); trincas e fissuras da laje tratadas, sem infiltração.
 *   5.1 c) juntas de dilatação (obrigatórias nas extremidades) recuperadas ou substituídas, estanques.
 *   5.1 d) pontes rurais: buzinotes (tubo galvanizado ou PVC) em rebaixos do pavimento; nos dois lados da seção:
 *         Ø 100 mm, espaçamento 4,00 m; não sobre saias de aterro nem sobre rodovias atravessadas; comprimento livre
 *         inferior de 10 cm; afastados dos elementos estruturais. Pontes urbanas/entroncamentos: caixas com grelhas
 *         junto aos pilares e prumadas semiverticais.
 *   5.1 e) pingadeiras (colagem de placas pré-moldadas: especificação própria).
 *   5.2   estruturas celulares: aberturas de visita (de preferência na laje inferior); buzinotes Ø ≥ 5 cm em todos os
 *         pontos baixos das células.
 *   5.3   juntas transversais estanques entre a ponte e os aterros de acesso; aterro de acesso com tratamento
 *         diferenciado (solo, compactação, estabilidade, drenagem) em comprimento ≥ 3 × a altura do aterro; sarjetas,
 *         taludes revestidos, descidas d'água com dissipadores e valetas de proteção.
 *   6     materiais removidos para locais previamente determinados logo após a conclusão.
 *   7     acompanhamento constante de engenheiro capacitado.  8  serviço não conforme → refeito imediatamente.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var GP = "Drenagem da pista (5.1)", GB = "Dispositivos de captação (5.1 d)", GC = "Estruturas celulares (5.2)", GT = "Aterros de acesso (5.3)", GG = "Gerais (6; 7)";
  function rural(P) { return (P.local || "rural") === "rural"; }
  function doisLados(P) { return rural(P) && P.ladosBuz !== "um"; }
  function celular(P) { return P.celular === "sim"; }
  function preencher(F, d, falhas) {
    d.verificacoes = [];
    F.simples.criterios.filter(function (it) { return it.tipo === "sim_nao"; }).forEach(function (it) {
      if (it.se && !it.se(d.params)) { d.verificacoes.push({}); return; }
      d.verificacoes.push((falhas || {})[it.id] || { atende: "S", real: "1" });
    });
  }
  var CASOS = { concava: "captação nos pontos mais baixos (curva vertical côncava)", unica: "captação só no lado mais baixo (curva horizontal com inclinação transversal única)",
    nula: "captação distribuída ao longo das canaletas, dos dois lados (declividade longitudinal nula)" };

  var F = A.fichaSimples({
    id: "dnit-086-2006-es",
    titulo: "Recuperação do sistema de drenagem de OAE — aceitação (DNIT 086/2006-ES)",
    resumo: "Aceitação da recuperação da drenagem de ponte/viaduto: regra de captação por comprimento e declividades (5.1 a), pavimento, laje e juntas (5.1 b, c), buzinotes Ø 100 mm a cada 4,00 m com 10 cm livres (5.1 d), pingadeiras, drenagem das células (Ø ≥ 5 cm) e aterros de acesso tratados em ≥ 3 × a altura (5.3). Não conforme → refazer (8).",
    lote: false,
    params: [
      { k: "obra", r: "Obra de arte", ph: "ex.: ponte sobre o rio A, est. 300" },
      { k: "comp", r: "Comprimento da obra (m)" },
      { k: "iLong", r: "Declividade longitudinal (%)" },
      { k: "captacao", r: "Solução de captação da pista", tipo: "select", recarrega: true, opcoes: [["extremo", "Só no extremo mais baixo da obra"], ["canaletas", "Canaletas laterais com dispositivos ao longo da obra"]] },
      { k: "caso", r: "Caso desfavorável (5.1 a)", tipo: "select", recarrega: true, opcoes: [["nenhum", "Nenhum"], ["concava", "Curva vertical côncava"], ["unica", "Curva horizontal com inclinação transversal única"], ["nula", "Declividade longitudinal nula"]] },
      { k: "local", r: "Tipo de ponte", tipo: "select", recarrega: true, opcoes: [["rural", "Rural — buzinotes"], ["urbana", "Urbana / entroncamento — caixas com grelhas e prumadas"]] },
      { k: "ladosBuz", r: "Buzinotes", tipo: "select", recarrega: true, opcoes: [["dois", "Nos dois lados da seção"], ["um", "Em um só lado"]], se: function (d) { return rural((d && d.params) || {}); } },
      { k: "celular", r: "Estrutura celular (caixão)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "hAterro", r: "Altura do aterro de acesso (m)", dica: "5.3: tratamento diferenciado em comprimento ≥ 3 × a altura" },
    ],
    padrao: { captacao: "canaletas", caso: "nenhum", local: "rural", ladosBuz: "dois", celular: "nao" },
    refs: { reprova: "8" },
    textos: { REJEITADO: { titulo: "SERVIÇO NÃO CONFORME", texto: "Há exigência da ES não atendida: o serviço deve ser refeito imediatamente (8)." },
      ACEITO: { titulo: "SERVIÇO CONFORME", texto: "Todas as exigências da DNIT 086/2006-ES verificadas e atendidas." } },
    providencias: function (par) { return par.parecer === "ACEITO" ? [] : ["Serviços não conformes devem ser refeitos imediatamente (8)."]; },
    criterios: [
      { id: "canaletas", grupo: GP, texto: "Canaletas laterais (rebaixos junto aos guarda-rodas/barreiras) com declividade não nula", secao: "5.1 a", tipo: "sim_nao",
        se: function (P) { return P.captacao === "canaletas"; }, naoAplicaPor: "captação só no extremo" },
      { id: "caso", grupo: GP, texto: "Dispositivos de captação posicionados conforme o caso desfavorável", secao: "5.1 a", tipo: "sim_nao",
        se: function (P) { return !!CASOS[P.caso]; }, naoAplicaPor: "sem caso desfavorável" },
      { id: "iTrans", grupo: GP, texto: "Declividade transversal das seções (captação só no extremo)", secao: "5.1 a", tipo: "valor", unid: "%", casas: 1, min: 2,
        se: function (P) { return P.captacao === "extremo"; }, naoAplicaPor: "captação ao longo da obra" },
      { id: "pav", grupo: GP, texto: "Pavimento íntegro (tratado ou substituído); trincas e fissuras da laje tratadas, sem infiltração", secao: "5.1 b", tipo: "sim_nao" },
      { id: "juntas", grupo: GP, texto: "Juntas de dilatação (obrigatórias nas extremidades) recuperadas ou substituídas, estanques", secao: "5.1 c; 5.3", tipo: "sim_nao" },
      { id: "buzDiam", grupo: GB, texto: "Diâmetro dos buzinotes (tubo galvanizado ou PVC) — nos dois lados da seção", secao: "5.1 d", tipo: "valor", unid: "mm", casas: 0, min: 100, max: 100,
        exigido: "100 mm", se: doisLados, naoAplicaPor: "ponte urbana ou buzinotes em um só lado" },
      { id: "buzEsp", grupo: GB, texto: "Espaçamento entre buzinotes", secao: "5.1 d", tipo: "valor", unid: "m", casas: 2, max: 4, exigido: "4,00 m (tomado como máximo)", se: doisLados, naoAplicaPor: "ponte urbana ou buzinotes em um só lado" },
      { id: "buzLivre", grupo: GB, texto: "Comprimento livre inferior dos buzinotes", secao: "5.1 d", tipo: "valor", unid: "cm", casas: 0, min: 10, exigido: "10 cm (tomado como mínimo)", se: rural, naoAplicaPor: "ponte urbana" },
      { id: "buzLocal", grupo: GB, texto: "Buzinotes em rebaixos do pavimento, fora das saias de aterro e de rodovias atravessadas, afastados dos elementos estruturais", secao: "5.1 d", tipo: "sim_nao", se: rural, naoAplicaPor: "ponte urbana" },
      { id: "grelhas", grupo: GB, texto: "Caixas com grelhas de grande capacidade de engolimento junto aos pilares e prumadas semiverticais", secao: "5.1 d", tipo: "sim_nao", se: function (P) { return !rural(P); }, naoAplicaPor: "ponte rural" },
      { id: "pinga", grupo: GB, texto: "Pingadeiras nas extremidades laterais (saliência ou sulco longitudinal)", secao: "5.1 e", tipo: "sim_nao" },
      { id: "visita", grupo: GC, texto: "Aberturas de visita (de preferência na laje inferior) permitindo o acesso às células", secao: "5.2", tipo: "sim_nao", se: celular, naoAplicaPor: "estrutura não celular" },
      { id: "celPontos", grupo: GC, texto: "Buzinotes em todos os pontos baixos das células", secao: "5.2", tipo: "sim_nao", se: celular, naoAplicaPor: "estrutura não celular" },
      { id: "celDiam", grupo: GC, texto: "Diâmetro dos buzinotes das células", secao: "5.2", tipo: "valor", unid: "cm", casas: 1, min: 5, se: celular, naoAplicaPor: "estrutura não celular" },
      { id: "aterroExt", grupo: GT, texto: "Comprimento do aterro de acesso com tratamento diferenciado (cada extremidade)", secao: "5.3", tipo: "valor", unid: "m", casas: 1,
        min: function (P) { var h = num(P.hAterro); return ok(h) ? 3 * h : NaN; }, exigido: "≥ 3 × a altura do aterro" },
      { id: "aterroDisp", grupo: GT, texto: "Aterros de acesso com sarjetas, taludes revestidos, descidas d'água com dissipadores e valetas de proteção", secao: "5.3", tipo: "sim_nao" },
      { id: "remocao", grupo: GG, texto: "Materiais de tratamentos e excedentes removidos para locais previamente determinados logo após a conclusão", secao: "6", tipo: "sim_nao" },
      { id: "engenheiro", grupo: GG, texto: "Acompanhamento constante de engenheiro capacitado", secao: "7", tipo: "sim_nao" },
    ],
    extra: function (ctx) {
      var P = ctx.P, L = num(P.comp), il = num(P.iLong);
      var l = A.linha({ id: "regra", grupo: GP, criterio: "Solução de captação × comprimento e declividade longitudinal", secao: "5.1 a",
        exigido: P.captacao === "extremo" ? "comprimento ≤ 50 m e declividade longitudinal ≥ 2 % (e transversal ≥ 2 %)" : "obra > 50 m com declividade < 2 %: canaletas laterais",
        resultado: (ok(L) ? fmt(L, 1) + " m" : "comprimento ?") + " · " + (ok(il) ? fmt(il, 2) + " %" : "declividade ?") + " · " + (P.captacao === "extremo" ? "captação só no extremo" : "canaletas laterais") });
      if (!ok(L) || !ok(il)) A.marcar(l, "pendente", "informe o comprimento e a declividade longitudinal da obra");
      else if (P.captacao === "extremo") {
        var f = [];
        if (L > 50) f.push("comprimento de " + fmt(L, 1) + " m > 50 m");
        if (il < 2) f.push("declividade longitudinal de " + fmt(il, 2) + " % < 2 %");
        if (P.caso === "nula") f.push("declividade longitudinal nula exige captação distribuída");
        if (f.length) A.marcar(l, "nao_conforme", "captação só no extremo mais baixo não admitida: " + f.join("; "));
        else l.motivo = "captação no extremo admitida (≤ 50 m e ≥ 2 %)";
      } else l.motivo = "captação ao longo da obra por canaletas laterais";
      if (CASOS[P.caso]) l.exigido += "; " + CASOS[P.caso];
      ctx.linhas.unshift(l); ctx.item.regra = l;
      if (ok(L) && ok(il) && L <= 50 && il < 2 && P.captacao !== "extremo") ctx.avisos.push("Obra ≤ 50 m com declividade < 2 %: a ES não trata este caso explicitamente (5.1 a) — adotadas canaletas laterais.");
      if (!ok(num(P.hAterro)) && ctx.item.aterroExt && ctx.item.aterroExt.n) ctx.avisos.push("Informe a altura do aterro de acesso para verificar o comprimento tratado (≥ 3 × a altura, 5.3).");
    },
    notas: "Critérios da DNIT 086/2006-ES (seções 5 a 8). A ES não define ensaios nem frequência: cada verificação é exigida ao menos uma vez por obra. Interpretações: Ø 100 mm dos buzinotes tomado como diâmetro nominal (exigido quando há buzinotes nos dois lados da seção); espaçamento de 4,00 m como máximo; comprimento livre inferior de 10 cm como mínimo. Não conforme → refazer imediatamente (8).",
    exemplos: [
      { nome: "Ponte rural de 120 m com estrutura celular — conforme", dados: function () {
        var d = { ident: { registro: "OAE-A-001", data: "2026-08-05", obra: "Obra A — BR-000", trecho: "Recuperação de OAE", local: "Ponte sobre o rio A" },
          params: { obra: "Ponte sobre o rio A (120 m, caixão celular)", comp: "120", iLong: "1,0", captacao: "canaletas", caso: "nenhum", local: "rural", ladosBuz: "dois", celular: "sim", hAterro: "6,0" },
          buzDiam: [{ est: "LD — buz. 1", v: "100" }, { est: "LE — buz. 1", v: "100" }],
          buzEsp: [{ est: "LD — buz. 1–2", v: "4,00" }, { est: "LD — buz. 14–15", v: "3,95" }, { est: "LE — buz. 7–8", v: "4,00" }],
          buzLivre: [{ est: "LD — buz. 1", v: "10" }, { est: "LE — buz. 8", v: "12" }],
          celDiam: [{ est: "célula 1", v: "5" }, { est: "célula 2", v: "7,5" }],
          aterroExt: [{ est: "encontro E1", v: "20,0" }, { est: "encontro E2", v: "19,0" }] };
        preencher(F, d);
        return d;
      } },
      { nome: "Ponte rural de 45 m — não conforme (captação no extremo com 1,5 %, buzinotes e aterro de acesso)", dados: function () {
        var d = { ident: { registro: "OAE-B-002", data: "2026-09-01", obra: "Obra B — BR-000", trecho: "Recuperação de OAE", local: "Ponte sobre o córrego B" },
          params: { obra: "Ponte sobre o córrego B (45 m)", comp: "45", iLong: "1,5", captacao: "extremo", caso: "nenhum", local: "rural", ladosBuz: "dois", celular: "nao", hAterro: "5,0" },
          iTrans: [{ est: "seção 1", v: "2,0" }, { est: "seção 3", v: "1,6" }],
          buzDiam: [{ est: "LD — buz. 1", v: "100" }, { est: "LE — buz. 1", v: "75" }],
          buzEsp: [{ est: "LD — buz. 1–2", v: "5,00" }, { est: "LE — buz. 1–2", v: "4,00" }],
          buzLivre: [{ est: "LD — buz. 1", v: "10" }],
          aterroExt: [{ est: "encontro E1", v: "15,0" }, { est: "encontro E2", v: "12,0" }] };
        preencher(F, d, { juntas: { real: "2", nc: "1", obs: "junta extrema do encontro E2 sem vedação — erosão no aterro" } });
        return d;
      } },
    ],
  });
  // locais em texto livre ("LD — buz. 1"): gráficos por nº da determinação, não por estaca
  var calc0 = F.calcular;
  F.calcular = function (d) {
    var r = calc0(d);
    r.resultados.linhas.forEach(function (l) { (l.pontos || []).forEach(function (p) { p.x = NaN; }); });
    return r;
  };
})();
