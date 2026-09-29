/*
 * Ficha de ACEITAÇÃO: DNIT 096/2006-ES — Drenagem — Bueiros de concreto tipo minitúnel sem interrupção do tráfego.
 *
 * O PDF numera as subseções como "B.1 … B.10" dentro das seções 4, 5, 7 e 8; o índice geral (p. 7) dá a numeração
 * pretendida: B.1 = 4.1, B.2 = 5.1 (B.2.1 a B.2.4 = 5.1.1 a 5.1.4), B.3 = 5.2, B.4 = 5.3, B.5 = 5.4, B.6 = 7.1,
 * B.7 = 7.2, B.8 = 7.3, B.9 = 8.1, B.10 = 8.2. A ficha cita as duas ("B.6 / 7.1").
 *
 * O que a ES manda (seções do PDF):
 *   3     peças pré-moldadas de concreto de alto desempenho (fck ≥ 50 MPa); seção entre 0,80 × 1,40 m e 2,20 × 2,60 m
 *         (limites práticos).
 *   4     locação topográfica; declividade e alinhamento controlados a cada etapa de montagem com nível a laser;
 *         conferência do alinhamento, esconsidade, declividade, comprimentos e cotas.
 *   B.2.1 concreto fck ≥ 50 MPa aos 28 dias (peças pré-moldadas e laje in loco), NBR 12655; aço CA-50 e CA-60;
 *         instalação por firma credenciada pelo fabricante.
 *   B.2.2 enchimento dos vazios com argamassa fluida de solo argiloso, cimento e água (injeção sob pressão).
 *   B.2.3 rejuntamento das costelas com argamassa 1:3 com adições/aditivos (ou graute); orifícios preenchidos; espaços
 *         junto às bocas tamponados.
 *   B.2.4 bocas, alas, testas e berços: concreto (DNER-ES 330, NBR 6118, NBR 7187) com fck ≥ 15 MPa aos 28 dias.
 *   B.3   NOTA: equipamentos vistoriados.
 *   B.4   sondagens a percussão (SPT e nível d'água) prévias; estudo da estabilidade do maciço; embasamento com pedra de
 *         mão em solo fraco; poços de ataque escorados e revestidos; bomba submersa se preciso; execução de jusante para
 *         montante com a boca de montante tamponada; escavação no perímetro mais próximo da estrutura, com avanço
 *         ≈ comprimento das peças (terrenos fracos) e até 2 m (terrenos pouco compactos e bastante coesivos); piso em
 *         concreto armado in loco; injeção de solo-cimento; bocas e alas preservando as saias dos aterros.
 *   B.6/B.8 controle geométrico topográfico; seções transversais com diferença ≤ 1 % do projeto em pontos isolados.
 *   B.7   controle tecnológico: CPs rompidos aos 7 dias (controle assistemático, NBR 6118) com relação experimental
 *         7 × 28 dias estabelecida previamente.
 * A ES não tem seção de condições de conformidade: a ficha trata como não conforme o requisito numérico não atendido
 * (fck, seção, dimensões) e o item de execução não atendido.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, D = FE.aceitacaoDrenagem, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var GM = "Materiais (B.2 / 5.1)", GC = "Controle tecnológico (B.7 / 7.2)", GE = "Execução (4; B.4 / 5.3)", GG = "Controle geométrico (B.6, B.8 / 7.1, 7.3)", GA = "Meio ambiente (6)";
  function preencher(F, d, falhas) {
    d.verificacoes = [];
    F.simples.criterios.filter(function (it) { return it.tipo === "sim_nao"; }).forEach(function (it) {
      if (it.se && !it.se(d.params)) { d.verificacoes.push({}); return; }
      d.verificacoes.push((falhas || {})[it.id] || { atende: "S", real: "1" });
    });
  }
  var itFc7 = D.itemFc({ id: "fc7", idade: 7, grupo: GC, texto: "Concreto das peças e da laje — resistência aos 7 dias (exemplares)", secao: "B.2.1; B.7 / 5.1.1; 7.2" });
  itFc7.exigido = "fc7 × (f28/f7) → fck,est ≥ 50 MPa";

  var F = A.fichaSimples({
    id: "dnit-096-2006-es",
    titulo: "Bueiros de concreto tipo minitúnel — aceitação (DNIT 096/2006-ES)",
    resumo: "Aceitação de bueiro minitúnel executado sem interrupção do tráfego: concreto das peças fck ≥ 50 MPa por CPs de 7 dias com a relação 7 × 28 dias (B.7), bocas e alas fck ≥ 15 MPa (B.2.4), materiais de enchimento e vedação (B.2), execução (B.4) e controle geométrico com seções a ± 1 % do projeto (B.8).",
    lote: false,
    params: [
      { k: "bueiro", r: "Identificação do minitúnel", ph: "ex.: minitúnel 1,60 × 2,00 m, est. 75" },
      { k: "larg", r: "Largura interna da seção de projeto (m)", dica: "3: limites práticos de 0,80 × 1,40 m a 2,20 × 2,60 m" },
      { k: "alt", r: "Altura interna da seção de projeto (m)" },
      { k: "comp", r: "Comprimento do minitúnel (m)" },
      { k: "cotaMont", r: "Cota executada da soleira — montante (m)" },
      { k: "cotaJus", r: "Cota executada da soleira — jusante (m)" },
      { k: "declProj", r: "Declividade de projeto (%)" },
      { k: "solo", r: "Terreno escavado", tipo: "select", recarrega: true, opcoes: [["coesivo", "Pouco compacto e bastante coesivo (avanço até 2 m)"], ["fraco", "Fraco / pouco coesivo (avanço ≈ uma peça)"]] },
      { k: "compPeca", r: "Comprimento de uma peça (costela) (m)", se: function (d) { return ((d && d.params) || {}).solo === "fraco"; } },
      { k: "poco", r: "Emboque por poço de ataque?", tipo: "select", recarrega: true, opcoes: [["nao", "Não — pelo talude"], ["sim", "Sim"]] },
      { k: "rel", r: "Relação experimental f28 / f7 do concreto", dica: "B.7: estabelecida previamente (ex.: 1,25)" },
      D.paramCond,
      D.paramModo("fc7", "concreto das peças (valores convertidos a 28 d)"),
      D.paramModo("fc15", "concreto das bocas e alas"),
    ],
    padrao: { solo: "coesivo", poco: "nao", condPreparo: "A", modo_fc7: "parcial", modo_fc15: "excepcional" },
    refs: { reprova: "B.2.1 / 5.1.1" },
    providencias: function (par) { return par.parecer === "ACEITO" ? [] : ["Requisito não atendido: corrigir ou refazer o serviço e verificar de novo (a ES não traz seção de conformidade; ver notas)."]; },
    criterios: [
      itFc7,
      D.itemFc({ id: "fc15", grupo: GM, texto: "Concreto das bocas, alas, testas e berços — fck ≥ 15 MPa aos 28 dias (exemplares)", secao: "B.2.4 / 5.1.4" }),
      { id: "relPrev", grupo: GC, texto: "Relação experimental entre as resistências aos 7 e 28 dias estabelecida previamente", secao: "B.7 / 7.2", tipo: "sim_nao" },
      { id: "aco", grupo: GM, texto: "Aço CA-50 e CA-60; concreto preparado conforme NBR 12655", secao: "B.2.1 / 5.1.1", tipo: "sim_nao" },
      { id: "firma", grupo: GM, texto: "Instalação por firma credenciada pelo fabricante", secao: "B.2.1 / 5.1.1", tipo: "sim_nao" },
      { id: "enchim", grupo: GM, texto: "Vazios entre a estrutura e o terreno preenchidos por injeção sob pressão de argamassa fluida de solo argiloso, cimento e água", secao: "B.2.2; B.4 / 5.1.2; 5.3", tipo: "sim_nao" },
      { id: "vedacao", grupo: GM, texto: "Rejuntamento das costelas com argamassa 1:3 com adições/aditivos (ou graute); orifícios de montagem preenchidos; espaços junto às bocas tamponados", secao: "B.2.3 / 5.1.3", tipo: "sim_nao" },
      { id: "equip", grupo: GE, texto: "Equipamentos vistoriados antes do início do serviço", secao: "B.3 NOTA / 5.2", tipo: "sim_nao" },
      { id: "sondagem", grupo: GE, texto: "Sondagens a percussão (SPT e nível d'água) e estudo da estabilidade do maciço antes da escavação", secao: "B.4 a / 5.3", tipo: "sim_nao" },
      { id: "locacao", grupo: GE, texto: "Locação topográfica conforme Notas de Serviço; declividade e alinhamento controlados com nível a laser a cada etapa de montagem", secao: "4; B.4 b; B.5 / 5.4", tipo: "sim_nao" },
      { id: "sentido", grupo: GE, texto: "Execução de jusante para montante, com a boca de montante tamponada", secao: "B.4 / 5.3", tipo: "sim_nao" },
      { id: "pocoAt", grupo: GE, texto: "Poços de ataque escorados e revestidos, seguros para os operários", secao: "B.4 / 5.3", tipo: "sim_nao", se: function (P) { return P.poco === "sim"; }, naoAplicaPor: "emboque pelo talude" },
      { id: "avanco", grupo: GE, texto: "Avanço da escavação à frente da montagem", secao: "B.4 / 5.3", tipo: "valor", unid: "m", casas: 2, falha: "ressalva",
        max: function (P) { return P.solo === "fraco" ? num(P.compPeca) : 2; }, exigido: "≤ 2 m (coesivo) ou ≈ uma peça (terreno fraco)" },
      { id: "piso", grupo: GE, texto: "Piso em concreto armado in loco engastado às peças pré-moldadas", secao: "B.4 / 5.3", tipo: "sim_nao" },
      { id: "bocas", grupo: GE, texto: "Bocas, alas ou terminais executados preservando as saias dos aterros (enrocamento quando necessário)", secao: "B.2.4; B.4 / 5.1.4; 5.3", tipo: "sim_nao" },
      { id: "geomConf", grupo: GG, texto: "Alinhamento, esconsidade, declividade, comprimentos e cotas conferidos por topografia (Notas de Serviço)", secao: "4; B.6 / 7.1", tipo: "sim_nao" },
      { id: "amb", grupo: GA, texto: "Manejo ambiental: excedente removido a local definido com a Fiscalização; proteção dos deságues; sem tráfego desnecessário; DNER-ISA 07", secao: "6", tipo: "sim_nao" },
    ],
    extra: function (ctx) {
      var P = ctx.P, r = num(P.rel);
      // fck das peças: 7 dias × relação f28/f7, depois fck,est (NBR 12655) ≥ 50 MPa
      var conv = (ctx.d.fc7 || []).map(function (c) { var v = num(c.v); return { est: c.est, pos: c.pos, reg: c.reg, v: ok(v) && ok(r) ? String(v * r).replace(".", ",") : "" }; });
      var l7 = D.avaliarFck({ d: { fc7: conv }, item: ctx.item, avisos: ctx.avisos }, "fc7", 50, { modo: P.modo_fc7, cond: P.condPreparo, secao: "B.2.1 / 5.1.1" });
      if (l7 && l7.situacao !== "nao_exigido") {
        var n7 = (ctx.d.fc7 || []).filter(function (c) { return ok(num(c.v)); }).length;
        l7.exigido = "fck,est (fc7 × f28/f7) ≥ 50,0 MPa";
        if (!ok(r)) { l7.n = n7; l7.situacao = "conforme"; l7.motivos = []; A.marcar(l7, n7 ? "pendente" : "sem_dados", n7 ? "informe a relação experimental f28/f7 (B.7)" : "sem exemplares de 7 dias"); l7.resultado = n7 ? "n = " + n7 + " (sem relação f28/f7)" : "—"; }
        else l7.resultado = "convertidos a 28 d (× " + fmt(r, 2) + "): " + l7.resultado;
      }
      D.avaliarFck(ctx, "fc15", 15, { modo: P.modo_fc15, cond: P.condPreparo, secao: "B.2.4 / 5.1.4" });
      D.avaliarGeom(ctx, { secao: "B.8 / 7.3", grupo: GG, tolE: null });
      var b = num(P.larg), h = num(P.alt);
      if (ok(b) && ok(h)) {
        var li = D.info(ctx, { id: "secaoLim", grupo: GG, criterio: "Seção de projeto × limites práticos de execução", secao: "3", exigido: "0,80 × 1,40 m a 2,20 × 2,60 m",
          resultado: fmt(b, 2) + " × " + fmt(h, 2) + " m" });
        if (b < 0.8 || h < 1.4 || b > 2.2 || h > 2.6) li.motivo = "fora dos limites práticos citados na seção 3 (informativo)";
      }
      var cm = num(P.cotaMont), cj = num(P.cotaJus), L = num(P.comp), ip = num(P.declProj);
      if (ok(cm) && ok(cj) && ok(L) && L > 0) {
        var i = (cm - cj) / L * 100;
        var l = D.info(ctx, { id: "decl", grupo: GG, criterio: "Declividade executada pelas cotas das soleiras", secao: "4; B.6 / 7.1",
          exigido: ok(ip) ? "a de projeto: " + fmt(ip, 2) + " % (a ES não fixa tolerância)" : "a de projeto",
          resultado: fmt(i, 2) + " %" + (ok(ip) ? " (projeto " + fmt(ip, 2) + " %; diferença " + A.fmtR(i - ip, 2) + " %)" : ""), motivo: "(" + fmt(cm, 3) + " − " + fmt(cj, 3) + ") / " + fmt(L, 2) + " m" });
        if (i <= 0) { l.situacao = "conforme"; A.marcar(l, "nao_conforme", "declividade nula ou contrária ao escoamento"); }
      }
    },
    notas: "Critérios da DNIT 096/2006-ES (seções 3, 4, 5, 6 e 7; subseções B.x do PDF). Resistência das peças: cada exemplar de 7 dias é convertido a 28 dias pela relação experimental f28/f7 (B.7) e o fck,est é calculado pela ABNT NBR 12655 (amostragem parcial n ≥ 6: 2(f1+…+fm−1)/(m−1) − fm, não menor que ψ6·f1; total: f1; excepcional: ψ6·f1) e comparado com 50 MPa (B.2.1). Seções transversais: |desvio| ≤ 1 % do projeto (B.8); a ES não fixa tolerância de espessura. A ES não traz condições de conformidade nem frequências: cada item é exigido ao menos uma vez por minitúnel.",
    exemplos: [
      { nome: "Minitúnel 1,60 × 2,00 m em terreno coesivo — aceito", dados: function () {
        var d = { ident: { registro: "MNT-A-001", data: "2026-07-28", obra: "Obra A — BR-000", trecho: "Travessia sob aterro", local: "Est. 75+00" },
          params: { bueiro: "Minitúnel 1,60 × 2,00 m — est. 75", larg: "1,60", alt: "2,00", comp: "36,0", cotaMont: "212,540", cotaJus: "212,180", declProj: "1,00",
            solo: "coesivo", poco: "nao", rel: "1,25", condPreparo: "A", modo_fc7: "parcial", modo_fc15: "excepcional" },
          fc7: [{ est: "peças 1–6", pos: "ex. 1", v: "43,0" }, { est: "peças 7–12", pos: "ex. 2", v: "44,2" }, { est: "peças 13–18", pos: "ex. 3", v: "45,1" },
            { est: "peças 19–24", pos: "ex. 4", v: "46,0" }, { est: "laje in loco", pos: "ex. 5", v: "46,8" }, { est: "peças 25–30", pos: "ex. 6", v: "47,5" }],
          fc15: [{ est: "boca de montante", pos: "ex. B1", v: "21,5" }, { est: "boca de jusante", pos: "ex. B2", v: "22,0" }],
          avanco: [{ est: "frente a 6 m", v: "1,20" }, { est: "frente a 18 m", v: "1,50" }, { est: "frente a 30 m", v: "1,80" }],
          geom: [
            { est: "6 m", elem: "largura interna", tipo: "D", proj: "1,60", med: "1,605" },
            { est: "6 m", elem: "altura interna", tipo: "D", proj: "2,00", med: "1,99" },
            { est: "24 m", elem: "largura interna", tipo: "D", proj: "1,60", med: "1,595" }] };
        preencher(F, d);
        return d;
      } },
      { nome: "Minitúnel 1,20 × 1,80 m — rejeitado (fck das peças e seção; avanço da escavação com ressalva)", dados: function () {
        var d = { ident: { registro: "MNT-B-002", data: "2026-08-30", obra: "Obra B — BR-000", trecho: "Travessia sob aterro", local: "Est. 142+10" },
          params: { bueiro: "Minitúnel 1,20 × 1,80 m — est. 142+10", larg: "1,20", alt: "1,80", comp: "28,0", cotaMont: "98,420", cotaJus: "98,150", declProj: "1,00",
            solo: "fraco", compPeca: "0,50", poco: "sim", rel: "1,20", condPreparo: "A", modo_fc7: "parcial", modo_fc15: "excepcional" },
          fc7: [{ est: "peças 1–6", pos: "ex. 1", v: "40,5" }, { est: "peças 7–12", pos: "ex. 2", v: "41,8" }, { est: "peças 13–18", pos: "ex. 3", v: "39,6" },
            { est: "peças 19–24", pos: "ex. 4", v: "43,0" }, { est: "laje in loco", pos: "ex. 5", v: "42,2" }, { est: "peças 25–30", pos: "ex. 6", v: "44,1" }],
          fc15: [{ est: "boca de montante", pos: "ex. B1", v: "22,3" }, { est: "boca de jusante", pos: "ex. B2", v: "21,8" }],
          avanco: [{ est: "frente a 4 m", v: "0,50" }, { est: "frente a 12 m", v: "0,90" }],
          geom: [
            { est: "8 m", elem: "largura interna", tipo: "D", proj: "1,20", med: "1,18" },
            { est: "8 m", elem: "altura interna", tipo: "D", proj: "1,80", med: "1,805" }] };
        preencher(F, d);
        return d;
      } },
    ],
  });
  D.estender(F, { tabelas: function () { return [D.tabelaGeom({ unid: "m", rotTipo: "Tipo (D = dimensão da seção)", dica: "uma coluna por medida; Tipo D = dimensão da seção transversal (largura, altura); projeto e medido na mesma unidade" })]; },
    geom: ["geom"], fck: ["fc7", "fc15"], semEstaca: true });
})();
