/*
 * Ficha: DNIT 454/2025-EM — Água para argamassa e concreto de cimento Portland — aceitação da água.
 * Motor FE.recebimentoMaterialEM (site/fichas/dner-em-036-95.js). Avaliação preliminar (Tabela 1, NBR 15900-3), análise
 * química (Tabela 2) e ensaios comparativos de pega e resistência (Tabela 3), com a frequência da Tabela 4.
 * Importa das fichas DNIT 036/2004-ME (ensaios químicos) e DNIT 037/2004-ME (ensaios comparativos).
 */
(function () {
  "use strict";
  var FE = window.FE, RM = FE.recebimentoMaterialEM, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-454-2025-em";
  function publica(P) { return (P.classe || "publica") === "publica"; }
  var G1 = "Avaliação preliminar — Tabela 1 (NBR 15900-3)", G2 = "Análise química — Tabela 2", G3 = "Ensaios comparativos com água de referência — Tabela 3";
  function q(bom, ruim, reBom, reRuim) { return [["ok", bom, reBom, true], ["nao", ruim, reRuim, false]]; }
  var CL = { protendido: 500, armado: 1000, simples: 4500 };

  FE.FICHAS[ID] = RM.criar({
    titulo: "Aceitação de água para argamassa e concreto",
    resumo: "Água de amassamento: avaliação preliminar (Tabela 1), limites químicos por tipo de concreto (Tabela 2), ensaios comparativos de pega e resistência (Tabela 3) e frequência por tipo de água (Tabela 4); parecer (6).",
    tabela: "DNIT 454/2025-EM",
    classes: [["publica", "Água de abastecimento público (3.1)"], ["recuperada", "Água recuperada do preparo do concreto (3.8)"], ["subterranea", "Água de origem subterrânea (3.6)"],
      ["superficie", "Água natural de superfície (3.7)"], ["industrial", "Água residual industrial (3.9)"], ["salobra", "Água salobra (3.10)"], ["pluvial", "Água de captação pluvial (3.2)"],
      ["reuso", "Água de esgoto tratada / de reuso de ETE (3.4, 3.5)"]],
    rotuloClasse: "Tipo de água",
    padrao: { classe: "subterranea", concreto: "armado", fase: "primeiro" },
    params: [
      { k: "concreto", r: "Tipo de concreto (limite de cloretos)", tipo: "select", opcoes: [["protendido", "Protendido ou graute — Cl⁻ ≤ 500 mg/L"], ["armado", "Armado — Cl⁻ ≤ 1 000 mg/L"],
        ["simples", "Simples (não armado) — Cl⁻ ≤ 4 500 mg/L"]] },
      { k: "raa", r: "Álcalis acima de 1 500 mg/L: ações preventivas contra a RAA comprovadas (NBR 15577-1)?", tipo: "select", opcoes: [["", "Não / não se aplica"], ["sim", "Sim — comprovadas"]],
        dica: "Tabela 2, nota 1" },
      { k: "fase", r: "Fase do controle (Tabela 4)", tipo: "select", opcoes: [["primeiro", "Antes do primeiro uso"], ["mensal", "Controle mensal"], ["reduzido", "Frequência reduzida (atendimento comprovado)"]] },
      { k: "dataAnterior", r: "Data da avaliação anterior (controle mensal)", ph: "dd/mm/aaaa", se: function (d) { return (d.params || {}).fase === "mensal"; } },
    ],
    lote: { unid: "m³", rotuloFornecedor: "Fonte / ponto de captação", rotuloQtd: "Volume previsto (m³) — opcional" },
    rotuloDet: "Amostra",
    ensaios: [
      { id: "mo", grupo: G1, r: "Matéria orgânica — cor após NaOH × solução-padrão", secao: "Tab. 1", tipo: "qual", facultativo: publica, lim: { texto: "igual ou mais clara que o padrão" },
        opcoes: q("igual ou mais clara", "mais escura", /^(igual|mais clara|clara|ok)/i, /^(mais escura|escura)/i), ph: "igual ou mais clara / mais escura" },
      { id: "res", grupo: G1, r: "Resíduo sólido", metodo: "NBR 15900-3", secao: "Tab. 1", u: "mg/L", casas: 0, facultativo: publica, lim: { max: 50000 } },
      { id: "ph", grupo: G1, r: "Ácidos — pH", metodo: "NBR 15900-3", secao: "Tab. 1", u: "", casas: 1, facultativo: publica, lim: { min: 5, casas: 0 } },
      { id: "deter", grupo: G1, r: "Detergentes — espuma", secao: "Tab. 1", tipo: "qual", facultativo: publica, lim: { texto: "espuma desaparece em até 2 min" },
        opcoes: q("desaparece em até 2 min", "persiste após 2 min", /^(desaparece|sem espuma|ok|at[eé] 2)/i, /^(persiste|n[aã]o desaparece|mais de 2)/i), ph: "desaparece em até 2 min / persiste" },
      { id: "oleo", grupo: G1, r: "Óleos e gorduras", secao: "Tab. 1", tipo: "qual", facultativo: publica, lim: { texto: "no máximo traços visíveis" },
        opcoes: q("no máximo traços", "acima de traços", /^(ausente|tra[çc]os|no m[aá]ximo|ok|sem)/i, /^(acima|presen|filme|mancha)/i), ph: "no máximo traços / acima de traços" },
      { id: "cor", grupo: G1, r: "Cor (comparada à da água potável)", secao: "Tab. 1", tipo: "qual", facultativo: publica, se: function (P) { return P.classe !== "recuperada"; },
        lim: { texto: "amarelo-claro a incolor" }, opcoes: q("amarelo-claro a incolor", "outra cor", /^(incolor|amarel|ok)/i, /^(outra|escura|marrom|turva|verde|cinza)/i), ph: "incolor / outra cor" },
      { id: "odor", grupo: G1, r: "Odor após adição de HCl", secao: "Tab. 1", tipo: "qual", facultativo: publica,
        lim: function (P) { return { texto: P.classe === "reuso" ? "sem odor (admite tênue odor de cimento / leve H₂S se houver escória)" : "inodora, sem odor de H₂S" }; },
        opcoes: q("inodora (ou odor admitido)", "com odor", /^(inodor|sem odor|t[eê]nue|leve|ok)/i, /^(com odor|odor|h2s|sulfeto|forte)/i), ph: "inodora / com odor" },
      { id: "cl", grupo: G2, r: "Cloretos (Cl⁻)", metodo: "NBR 15900-6", secao: "Tab. 2", u: "mg/L", casas: 0, facultativo: publica, lim: function (P) { return { max: CL[P.concreto || "armado"] }; } },
      { id: "so4", grupo: G2, r: "Sulfatos (SO₄²⁻)", metodo: "NBR 15900-7", secao: "Tab. 2", u: "mg/L", casas: 0, facultativo: publica, lim: { max: 2000 } },
      { id: "alc", grupo: G2, r: "Álcalis — equivalente alcalino de Na₂O", metodo: "NBR 15900-9", secao: "Tab. 2, nota 1", u: "mg/L", casas: 0, facultativo: publica, lim: { max: 1500 },
        falha: "nao_conforme" },
      { id: "acu", grupo: G2, r: "Açúcares", metodo: "NBR 15900-11", secao: "Tab. 2", u: "mg/L", casas: 0, facultativo: publica, lim: { max: 100 } },
      { id: "fos", grupo: G2, r: "Fosfatos (P₂O₅)", metodo: "NBR 15900-8", secao: "Tab. 2", u: "mg/L", casas: 0, facultativo: publica, lim: { max: 100 } },
      { id: "nit", grupo: G2, r: "Nitratos (NO₃⁻)", metodo: "NBR 15900-10", secao: "Tab. 2", u: "mg/L", casas: 0, facultativo: publica, lim: { max: 500 } },
      { id: "pb", grupo: G2, r: "Chumbo (Pb²⁺)", metodo: "NBR 15900-5", secao: "Tab. 2", u: "mg/L", casas: 0, facultativo: publica, lim: { max: 100 } },
      { id: "zn", grupo: G2, r: "Zinco (Zn²⁺)", metodo: "NBR 15900-4", secao: "Tab. 2", u: "mg/L", casas: 0, facultativo: publica, lim: { max: 100 } },
      { id: "dIni", grupo: G3, r: "Tempo de início de pega — diferença em relação à referência", metodo: "NBR NM 65", secao: "Tab. 3", u: "%", casas: 1, facultativo: publica, lim: { max: 25, casas: 0 } },
      { id: "dFim", grupo: G3, r: "Tempo de fim de pega — diferença em relação à referência", metodo: "NBR NM 65", secao: "Tab. 3", u: "%", casas: 1, facultativo: publica, lim: { max: 25, casas: 0 } },
      { id: "dR7", grupo: G3, r: "Resistência à compressão aos 7 dias — redução em relação à referência", metodo: "NBR 7215", secao: "Tab. 3 / 6 b", u: "%", casas: 1, facultativo: publica,
        lim: { max: 10, casas: 0 } },
      { id: "dR28", grupo: G3, r: "Resistência à compressão aos 28 dias — redução em relação à referência", metodo: "NBR 7215", secao: "Tab. 3 / 6 b", u: "%", casas: 1, facultativo: publica,
        lim: { max: 10, casas: 0 } },
      { id: "expa", grupo: G3, r: "Expansibilidade (em caso de dúvida)", secao: "5 d / 6 b", tipo: "qual", facultativo: true, lim: { texto: "sem indicação de expansão" },
        opcoes: q("sem expansão", "com expansão", /^(sem|n[aã]o|ok|aus)/i, /^(com|expans|sim)/i), ph: "sem expansão / com expansão" },
    ],
    importar: [
      { k: "impQ", r: "Importar ensaios químicos (DNIT 036/2004-ME)", de: "dnit-036-2004-me", ensaios: ["ph", "res", "so4", "cl", "acu"],
        valores: function (e) { return (e.resultados.am || []).map(function (a) { return { ph: a.ph, res: a.res, so4: a.so4, cl: a.cl, acu: a.acucar }; }); },
        rot: function (e, i) { var a = (e.resultados.am || [])[Math.max(0, i - 1)] || {}; return a.nome || ""; } },
      { k: "impC", r: "Importar ensaios comparativos de pega e resistência (DNIT 037/2004-ME)", de: "dnit-037-2004-me", ensaios: ["dIni", "dFim", "dR7", "dR28"],
        valores: function (e) {
          var r = e.resultados, R = r.R || {}, E = r.E || {}, o = {};
          if (ok(R.iniM) && ok(E.iniM) && R.iniM > 0) o.dIni = Math.abs(E.iniM - R.iniM) / R.iniM * 100;
          if (ok(R.fimM) && ok(E.fimM) && R.fimM > 0) o.dFim = Math.abs(E.fimM - R.fimM) / R.fimM * 100;
          (r.rc || []).forEach(function (x) { if (ok(x.rel) && (x.idade === 7 || x.idade === 28)) o["dR" + x.idade] = 100 - x.rel; });
          return o;
        } },
    ],
    extra: function (ctx) {
      var P = ctx.P, V = ctx.V, l = ctx.item.alc;
      // Tabela 2, nota 1: acima de 1 500 mg/L, só com ações preventivas contra a reação álcali-agregado comprovadas
      if (l && l.situacao === "nao_conforme" && P.raa === "sim") {
        l.situacao = "ressalva";
        l.motivos = [{ situacao: "ressalva", texto: "equivalente alcalino acima de 1 500 mg/L — uso admitido com ações preventivas contra a RAA comprovadas (NBR 15577-1; Tabela 2, nota 1)" }];
        l.motivo = l.motivos[0].texto;
      } else if (l && l.situacao === "nao_conforme") {
        ctx.A.marcar(l, "nao_conforme", "só pode ser usada se comprovadas as ações preventivas contra a RAA (Tabela 2, nota 1)");
      }
      // Tabela 4: frequência
      var fl = ctx.A.linha({ id: "freq", grupo: "Frequência — Tabela 4", criterio: "Frequência dos ensaios para o tipo de água", secao: "Tab. 4",
        exigido: publica(P) ? "não há necessidade de ensaios" : "antes do primeiro uso e mensalmente até comprovar o atendimento", n: 1 });
      if (publica(P)) { fl.resultado = "água de abastecimento público"; fl.situacao = "informativo"; }
      else if (P.fase === "mensal") {
        var dd = RM.dias(P.dataAnterior, P.dataAmostra);
        fl.resultado = ok(dd) ? dd + " dia(s) desde a avaliação anterior" : "controle mensal";
        if (ok(dd) && dd > 31) ctx.A.marcar(fl, "ressalva", dd + " dias desde a avaliação anterior: a Tabela 4 pede ensaios mensais até comprovar o atendimento");
        else if (!ok(dd)) fl.situacao = "informativo";
      } else { fl.resultado = P.fase === "reduzido" ? "frequência reduzida após comprovação" : "avaliação antes do primeiro uso"; fl.situacao = "informativo"; }
      if (["pluvial", "reuso"].indexOf(P.classe) >= 0) ctx.avisos.push("A Tabela 4 não lista este tipo de água; aplicada a mesma exigência das demais fontes (ensaiar antes do primeiro uso e mensalmente).");
      if (P.classe === "reuso") ctx.avisos.push("Odor (Tabela 1): a exceção de tênue odor de cimento / leve H₂S é da água da subseção 3.3 (esgoto); confira a origem da água.");
      if (P.classe === "recuperada") ctx.avisos.push("Cor (Tabela 1): a água recuperada do preparo do concreto (3.8) é a exceção ao critério de cor.");
      ctx.linhas.push(fl);
      if (ok(V.dIni) || ok(V.dR7)) ctx.avisos.push("Tabela 3: diferenças em relação à água de referência — pega em valor absoluto (%); resistência como redução percentual (6 b: redução de 10 % em qualquer idade basta para rejeitar).");
    },
    textos: { ACEITO: { titulo: "ÁGUA ACEITA", texto: "Todos os requisitos da DNIT 454/2025-EM atendidos nos ensaios realizados." },
      RESSALVA: { titulo: "ÁGUA ACEITA COM RESSALVA", texto: "Nenhum requisito reprovado, mas há pontos a documentar ou corrigir (ressalvas abaixo)." },
      PENDENTE: { titulo: "AVALIAÇÃO PENDENTE", texto: "Faltam ensaios exigidos para o tipo de água: complete-os antes do uso." },
      REJEITADO: { titulo: "ÁGUA REJEITADA", texto: "Há requisito da DNIT 454/2025-EM não atendido: a água não deve ser usada em argamassa ou concreto (6)." } },
    rotuloImportar: function (r) { return (r.classe || "") + " · " + (r.parecer ? r.parecer.titulo.toLowerCase() : "—"); },
    notas: "DNIT 454/2025-EM, seção 5: Tabela 1 (avaliação preliminar pela NBR 15900-3) — matéria orgânica, resíduo sólido ≤ 50 000 mg/L, pH ≥ 5, detergentes, óleos e gorduras, cor e odor; " +
      "Tabela 2 — cloretos ≤ 500 (protendido/graute), 1 000 (armado) ou 4 500 mg/L (simples), sulfatos ≤ 2 000, álcalis (Na₂O eq.) ≤ 1 500 (nota 1), açúcares ≤ 100, fosfatos ≤ 100, nitratos ≤ 500, " +
      "chumbo ≤ 100 e zinco ≤ 100 mg/L; Tabela 3 — pega inicial e final até 25 % de diferença e resistência (7 e 28 dias) até 10 % em relação à água de referência. Tabela 4: a água de abastecimento " +
      "público dispensa ensaios (4 b: presume-se satisfatória a água potável); as demais, antes do primeiro uso e mensalmente. Aceitação (6): atender a todos os requisitos; expansão, variação sensível " +
      "de pega ou redução de 10 % na resistência bastam para rejeitar. Importação: DNIT 036/2004-ME (uma coluna por amostra) e DNIT 037/2004-ME (diferenças calculadas dos tempos e da relação de resistências).",
    exemplos: [
      { nome: "Poço tubular e rede — importados da DNIT 036/037-2004-ME (água aceita)", dados: function () {
        var d = { ident: { registro: "AG-454-01", data: "2026-03-09", obra: "Obra A — central de concreto", origem: "Poço 1", camada: "Água de amassamento" },
          params: { classe: "subterranea", concreto: "armado", fase: "primeiro", fornecedor: "Poço 1 e rede", dataAmostra: "09/03/2026" },
          det: [{ mo: "mais clara", deter: "desaparece em até 2 min", oleo: "ausente", cor: "incolor", odor: "inodora", alc: "180", fos: "5", nit: "22", pb: "1", zn: "2" },
            { mo: "mais clara", deter: "desaparece em até 2 min", oleo: "ausente", cor: "incolor", odor: "inodora", alc: "95", fos: "3", nit: "12", pb: "1", zn: "1" }] };
        RM.importarEx(ID, d, "impQ", [["dnit-036-2004-me", 0]]);
        d.det[0].acu = "0"; d.det[1].acu = "0";  // açúcares: ensaio à parte (a amostra da DNIT 036-ME não o traz)
        RM.importarEx(ID, d, "impC", [["dnit-037-2004-me", 0]]);
        return d;
      } },
      { nome: "Água de açude para concreto protendido — rejeitada (matéria orgânica, pH, pega, resistência)", dados: function () {
        var d = { ident: { registro: "AG-454-02", data: "2026-04-13", obra: "Obra B", origem: "Açude", camada: "Água de amassamento" },
          params: { classe: "superficie", concreto: "protendido", fase: "mensal", dataAnterior: "02/02/2026", fornecedor: "Açude", dataAmostra: "13/04/2026" },
          det: [{ mo: "mais escura", deter: "desaparece em até 2 min", oleo: "traços", cor: "amarelo claro", odor: "inodora", alc: "620", fos: "8", nit: "40", pb: "2", zn: "3" }] };
        RM.importarEx(ID, d, "impQ", [["dnit-036-2004-me", 1]]);
        RM.importarEx(ID, d, "impC", [["dnit-037-2004-me", 1]]);
        return d;
      } },
    ],
  });
})();
