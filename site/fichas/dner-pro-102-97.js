/*
 * Ficha: DNER-PRO 102/97 — Sondagem de reconhecimento pelo método rotativo (boletim de sondagem rotativa, Anexo F).
 * Uma coluna por manobra: profundidades, comprimento, recuperação (3.4), número de peças (3.5), fraturas naturais e
 * grau de fraturamento (Tabela 13), RQD (7.1.2, Tabela 12), graus de alteração (Tabela 11) e de coerência
 * (Tabela 14), coroa, alargador, revestimento e classificação. Resume recuperação e RQD do furo, confere a
 * recuperação mínima acordada (5.3), manobras curtas em rocha alterada/friável (5.4 d), lama (5.5), nível d'água
 * (5.6), itens do boletim (7.2) e desenha o perfil individual (Anexo E, simplificado). Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var DIAM = [["HX", "HW / HX"], ["NX", "NW / NX"], ["BX", "BW / BX"], ["AX", "AW / AX"], ["EX", "EW / EX"],
    ["HQ", "HQ (wire-line)"], ["NQ", "NQ (wire-line)"], ["BQ", "BQ (wire-line)"], ["AQ", "AQ (wire-line)"]];
  // Anexo B — caixas de testemunho: a (mm) e número de divisões; b = 275 mm
  var CAIXA = { HX: [78, 3], NX: [56, 4], BX: [43, 5], AX: [34, 6], EX: [27, 7] };
  // testemunho aproximado (Tabelas 7, 8 e 10), mm — barriletes WG/WM e série Q
  var TEST = { HX: 75.4, NX: 53.9, BX: 41.2, AX: 29.3, EX: 20.6, HQ: 63.0, NQ: 47.4, BQ: 36.2, AQ: 26.8 };
  var RQD = [[25, "Muito pobre"], [50, "Pobre"], [75, "Regular"], [90, "Boa"], [100.0001, "Excelente"]];
  var ALT = { "A0": "Rocha sã ou praticamente sã", "A1": "Rocha pouco alterada", "A2": "Rocha medianamente alterada", "A3": "Rocha muito alterada", "A4": "Rocha extremamente alterada" };
  var COE = { "C1": "Muito coerente", "C2": "Coerente", "C3": "Pouco coerente", "C4": "Friável" };
  var BOLETIM = [["firma", "b) nome da firma"], ["inclin", "c) inclinação"], ["rumo", "c) rumo"], ["inicio", "d) data do início"], ["termino", "d) data do término"],
    ["resp", "e) responsável pela execução"], ["cota", "f) cota da boca do furo"], ["equip", "g) equipamento (avanço da sonda, coroas e barriletes)"], ["motivo", "o) motivo do término"]];

  function qualRQD(v) { if (!ok(v)) return ""; for (var i = 0; i < RQD.length; i++) if (v < RQD[i][0]) return RQD[i][1]; return RQD[RQD.length - 1][1]; }
  function grauFrat(n, frag) {
    if (frag) return "F5";
    if (!ok(n)) return "";
    return n <= 5 ? "F1" : n <= 10 ? "F2" : n <= 20 ? "F3" : "F4";
  }
  var NOME_F = { F1: "Pouco fraturada", F2: "Medianamente fraturada", F3: "Muito fraturada", F4: "Extremamente fraturada", F5: "Em fragmentos" };
  function cod(s, re) { var m = String(s || "").toUpperCase().replace(/[\s.]/g, "").match(re); return m ? m[0] : ""; }

  function manobras(d) {
    return (d.man || []).map(function (x) {
      var de = num(x.de), ate = num(x.ate), rec = num(x.rec), sRqd = num(x.sRqd), nFr = num(x.nFr);
      var frag = /^s/i.test(String(x.frag || "").trim());
      var o = { de: de, ate: ate };
      o.comp = ok(de) && ok(ate) ? ate - de : NaN;
      o.recP = ok(o.comp) && o.comp > 0 && ok(rec) ? rec / o.comp * 100 : NaN;
      o.rqd = ok(o.comp) && o.comp > 0 && ok(sRqd) ? sRqd / o.comp * 100 : NaN;
      o.frM = ok(o.comp) && o.comp > 0 && ok(nFr) ? nFr / o.comp : NaN;
      o.F = grauFrat(nFr, frag);
      o.A = cod(x.alt, /A[0-4]/); o.C = cod(x.coe, /C[1-4]/);
      o.rec = rec; o.sRqd = sRqd; o.nFr = nFr; o.nPec = num(x.nPec); o.classe = x.classe || "";
      return o;
    });
  }

  FE.FICHAS["dner-pro-102-97"] = {
    titulo: "Sondagem rotativa — Boletim de sondagem",
    resumo: "Boletim de sondagem rotativa por manobra: recuperação (3.4), número de peças (3.5), RQD e qualidade da rocha (7.1.2, Tabela 12), grau de fraturamento (Tabela 13), alteração e coerência (Tabelas 11 e 14); recuperação mínima (5.3), manobras curtas (5.4 d), nível d'água (5.6), itens do boletim (7.2) e perfil individual.",
    params: [
      { k: "firma", r: "Firma executora (7.2 b)" },
      { k: "inclin", r: "Inclinação com a vertical, ° (3.6; 7.2 c)", ph: "0 = vertical" },
      { k: "rumo", r: "Rumo da sondagem (5.7.2)", ph: "ex.: N45E ou vertical" },
      { k: "cota", r: "Cota da boca do furo, m (7.2 f)" },
      { k: "afast", r: "Afastamento / locação (Anexo F)" },
      { k: "inicio", r: "Início da sondagem (7.2 d)", tipo: "date" },
      { k: "termino", r: "Término da sondagem (7.2 d)", tipo: "date" },
      { k: "resp", r: "Responsável pela execução / sondador (7.2 e)" },
      { k: "equip", r: "Equipamento: avanço da sonda, coroas e barriletes (7.2 g)", ph: "ex.: sonda hidráulica, coroa diamantada NX" },
      { k: "diam", r: "Diâmetro de perfuração em rocha (5.3)", tipo: "select", opcoes: DIAM },
      { k: "barrilete", r: "Barrilete (4.4)", tipo: "select", opcoes: [["duplogir", "Duplo giratório (WG/WT)"], ["wm", "Duplo giratório WM com caixa de mola"],
        ["duplorig", "Duplo rígido"], ["simples", "Simples"], ["wireline", "Wire-line (série Q)"]] },
      { k: "profPerc", r: "Profundidade do trecho a percussão (solo), m (5.2)", ph: "0 se não houver" },
      { k: "revest", r: "Profundidade final do revestimento, m (7.2 h)" },
      { k: "recMin", r: "Recuperação mínima acordada entre as partes, % (5.3)" },
      { k: "lama", r: "Lama de circulação (5.5)", tipo: "select", opcoes: [["nao", "Não usada"], ["aut", "Usada, com autorização do responsável pela obra"], ["semaut", "Usada, sem autorização"]] },
      { k: "naIni", r: "Nível d'água — leitura inicial, m (5.6.1; 7.2 l)", ph: "profundidade" },
      { k: "naFin", r: "Nível d'água — leitura final, m (8 e)" },
      { k: "naData", r: "Data/hora da leitura final do NA (8 e)" },
      { k: "artes", r: "Artesianismo (5.6.1)", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim — níveis estático e dinâmico e vazão registrados"]] },
      { k: "motivo", r: "Motivo do término da sondagem (7.2 o)" },
      { k: "geologo", r: "Geólogo responsável pela classificação (7.1; 8 o)" },
      { k: "fotos", r: "Fotografias coloridas das caixas (6.7)", tipo: "select", opcoes: [["", "— não pedidas"], ["sim", "Feitas (caixas inteiramente visíveis, sem distorção)"], ["nao", "Pedidas e não feitas"]] },
    ],
    padrao: { diam: "NX", barrilete: "duplogir", lama: "nao", artes: "nao", fotos: "" },
    tabelas: function () {
      return [{ chave: "man", titulo: "Manobras (Anexo F)", rotulo: "Manobra", iniciais: 4, min: 1,
        linhas: [
          { grupo: "Profundidade e metragem" },
          { k: "de", r: "Profundidade — de", u: "m" },
          { k: "ate", r: "Profundidade — até", u: "m" },
          { calc: "comp", r: "Comprimento da manobra (metragem)", u: "m", casas: 2 },
          { grupo: "Recuperação e fraturas (3.4, 3.5, 7.1.2, 7.1.3)" },
          { k: "rec", r: "Comprimento dos testemunhos recuperados", u: "m" },
          { calc: "recP", r: "Recuperação (3.4)", u: "%", casas: 0, destaque: true },
          { k: "nPec", r: "Número de peças (fracionamento, 3.5)", u: "nº" },
          { k: "sRqd", r: "Soma das peças sãs e compactas > 10 cm", u: "m" },
          { calc: "rqd", r: "RQD (7.1.2)", u: "%", casas: 0, destaque: true },
          { k: "nFr", r: "Fraturas naturais (fendilhamento; exclui quebras da perfuração)", u: "nº" },
          { calc: "frM", r: "Fraturas por metro", u: "f/m", casas: 1 },
          { k: "frag", r: "Rocha em fragmentos — F5? (sim/não)", texto: true },
          { grupo: "Classificação (7.1)" },
          { k: "alt", r: "Grau de alteração A0–A4 (Tabela 11)", texto: true },
          { k: "coe", r: "Grau de coerência C1–C4 (Tabela 14)", texto: true },
          { k: "classe", r: "Classificação litológica / descrição sumária", texto: true },
          { grupo: "Ferramentas e ocorrências" },
          { k: "coroa", r: "Coroa (nº)", texto: true },
          { k: "alarg", r: "Alargador (nº)", texto: true },
          { k: "revM", r: "Revestimento ao fim da manobra", u: "m" },
          { k: "perda", r: "Perda d'água, fendas, avanço livre (5.8.2; 7.2 m, n)", texto: true },
        ],
        dica: "uma coluna por manobra, na ordem; profundidades ao longo do furo" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], ms = manobras(d), ant = NaN;
      var recMin = num(P.recMin), sC = 0, sR = 0, sQ = 0, nQ = 0, cRqd = 0, prof = NaN, alterada = false;
      ms.forEach(function (o, i) {
        var rot = "Manobra " + (i + 1);
        if (ok(o.comp) && o.comp <= 0) avisos.push(rot + ": profundidade final menor ou igual à inicial.");
        if (ok(o.de) && ok(ant) && Math.abs(o.de - ant) > 0.005) avisos.push(rot + ": começa em " + fmt(o.de, 2) + " m e a anterior termina em " + fmt(ant, 2) + " m — registre todas as manobras.");
        if (ok(o.ate)) { ant = o.ate; prof = o.ate; }
        if (ok(o.rec) && ok(o.comp) && o.rec > o.comp + 0.005) avisos.push(rot + ": recuperado (" + fmt(o.rec, 2) + " m) maior que a manobra (" + fmt(o.comp, 2) + " m) — confira (testemunho de manobra anterior?).");
        if (ok(o.sRqd) && ok(o.rec) && o.sRqd > o.rec + 0.005) avisos.push(rot + ": soma das peças > 10 cm maior que o comprimento recuperado — confira.");
        if (ok(o.recP) && ok(recMin) && o.recP < recMin) avisos.push(rot + ": recuperação de " + fmt(o.recP, 0) + " % abaixo da mínima acordada (" + fmt(recMin, 0) + " %) (5.3) — adotar os cuidados de 5.4.");
        var alt = o.A === "A3" || o.A === "A4" || o.C === "C3" || o.C === "C4";
        if (alt) alterada = true;
        if (alt && ok(o.comp) && o.comp >= 1) avisos.push(rot + ": " + fmt(o.comp, 2) + " m em rocha " + (o.A === "A3" || o.A === "A4" ? "alterada (" + o.A + ")" : "friável/pouco coerente (" + o.C + ")") + " — usar manobras curtas, inferiores a 1 m (5.4 d).");
        if (String(d.man[i].alt || "").trim() && !o.A) avisos.push(rot + ": grau de alteração não reconhecido — use A0 a A4 (Tabela 11).");
        if (String(d.man[i].coe || "").trim() && !o.C) avisos.push(rot + ": grau de coerência não reconhecido — use C1 a C4 (Tabela 14).");
        if (ok(o.comp)) {
          if (ok(o.rec)) { sC += o.comp; sR += o.rec; }
          if (ok(o.sRqd)) { cRqd += o.comp; sQ += o.sRqd; nQ++; }
        }
      });
      var r = { n: ms.length, prof: prof, comp: sC, recG: sC > 0 ? sR / sC * 100 : NaN, rqdG: cRqd > 0 ? sQ / cRqd * 100 : NaN };
      r.qual = qualRQD(r.rqdG);
      if (ms.length && ok(num(P.profPerc)) && ok(ms[0].de) && Math.abs(ms[0].de - num(P.profPerc)) > 0.005) avisos.push("A primeira manobra começa em " + fmt(ms[0].de, 2) + " m, mas o trecho a percussão vai até " + fmt(num(P.profPerc), 2) + " m — o perfil deve ser completo (5.2).");
      if (nQ && (P.diam === "EX")) avisos.push("RQD com coroa EW/EX: para representar bem a qualidade da rocha recomendam-se coroas de diâmetro igual ou maior que AX (7.1.2).");
      if (nQ && P.barrilete !== "duplogir" && P.barrilete !== "wm") avisos.push("RQD obtido sem barrilete duplo giratório — recomendado para o RQD (7.1.2).");
      if (alterada && P.barrilete === "simples") avisos.push("Barrilete simples em rocha alterada ou friável: é inadequado em rochas friáveis, quebradiças ou facilmente erosíveis (4.4.2).");
      if (P.lama === "semaut") avisos.push("Lama de circulação só pode ser usada com autorização do responsável pela obra (5.5).");
      if (P.lama === "aut" || P.lama === "semaut") avisos.push("Uso de lama: deve constar obrigatoriamente do boletim e dos perfis individuais (5.5).");
      if (!String(P.naIni || "").trim()) avisos.push("Registre a leitura do nível d'água no início de cada turno e a leitura final (5.6.1; 7.2 l; 8 e) — escreva \"seco\" se não houver.");
      if (String(P.naIni || "").trim() && !String(P.naFin || "").trim()) avisos.push("Falta a leitura final do nível d'água, com data e hora (8 e).");
      if (P.fotos === "nao") avisos.push("Fotografias coloridas das caixas pedidas e não feitas (6.7).");
      if (!String(P.geologo || "").trim()) avisos.push("A classificação dos testemunhos deve ser feita por geólogo, que assina o relatório (7.1; 8 o).");
      var falta = BOLETIM.filter(function (b) { return !String(P[b[0]] || "").trim(); }).map(function (b) { return b[1]; });
      if (falta.length) avisos.push("Boletim sem: " + falta.join("; ") + " (7.2).");
      r.cx = CAIXA[P.diam];
      r.nAvisos = avisos.length;
      return { tab: { man: ms }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var st = r.nAvisos ? '<span class="fe-nok">' + r.nAvisos + " aviso(s)</span>" : '<span class="fe-ok">sem avisos</span>';
      return '<div class="fe-res">' + cx(fmt(r.prof, 2) + " <small>m</small>", "Profundidade final · " + r.n + " manobra(s) · " + st) +
        cx(fmt(r.recG, 0) + " <small>%</small>", "Recuperação do trecho rotativo (" + fmt(r.comp, 2) + " m)") +
        cx(fmt(r.rqdG, 0) + " <small>%</small>", "RQD do trecho · " + esc(r.qual || "—") + " (Tabela 12)") + "</div>" + tabelaClasses(calc);
    },
    graficos: function (calc, d, opt) { return [perfil(calc, d, opt || {})]; },
    relatorio: {
      parametros: [["Caixas de testemunho (Anexo B)", "madeira aplainada, b = 275 mm; HX a = 78 mm, 3 div.; NX 56 mm, 4; BX 43 mm, 5; AX 34 mm, 6; EX 27 mm, 7; guardadas 30 dias após a entrega do relatório (6.8)"]],
      notas: "Boletim conforme a DNER-PRO 102/97 (7.2 e Anexo F). Recuperação = comprimento dos testemunhos / comprimento da manobra × 100 (3.4); RQD = soma das peças sãs e compactas maiores que 10 cm / comprimento perfurado × 100 (7.1.2), classificado pela Tabela 12 (limites de classe atribuídos à classe superior: 25 % = pobre; critério da ficha); grau de fraturamento pelo número de fraturas naturais por manobra (Tabela 13; 0 a 5 = F1, critério da ficha para zero fratura). Recuperação e RQD do trecho ponderados pelo comprimento das manobras. Manobras inferiores a 1 m em rocha alterada ou friável (5.4 d). O perfil é uma representação simplificada do Anexo E; escala usual 1:100 (Nota 15).",
      extraHtml: function (calc) { return tabelaClasses(calc, true); },
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        var rows = [["Profundidade final", fmt(r.prof, 2) + " m (" + r.n + " manobras)"], ["Recuperação do trecho rotativo", fmt(r.recG, 0) + " % em " + fmt(r.comp, 2) + " m"],
          ["RQD do trecho", fmt(r.rqdG, 0) + " % — " + (r.qual || "—")]];
        if (P.naIni || P.naFin) rows.push(["Nível d'água", "inicial " + (P.naIni || "—") + " m · final " + (P.naFin || "—") + " m" + (P.naData ? " (" + P.naData + ")" : "")]);
        rows.push(["Avisos", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Gnaisse sob solo residual — cinco manobras NX", dados: function () {
        return { ident: { registro: "SR-01", data: "2025-06-17", obra: "Obra A — ponte sobre o córrego", local: "Est. 85, eixo, apoio P2", camada: "Fundação", laboratorista: "Sondador A", responsavel: "Geólogo A" },
          params: { firma: "Empresa de sondagem A", inclin: "0", rumo: "vertical", cota: "102,45", afast: "eixo", inicio: "2025-06-16", termino: "2025-06-17", resp: "Sondador A",
            equip: "Sonda hidráulica; coroas diamantadas NX; barrilete duplo giratório NWG", diam: "NX", barrilete: "duplogir", profPerc: "6,20", revest: "6,50", recMin: "80",
            lama: "nao", naIni: "3,10", naFin: "3,25", naData: "18/06/2025 07:00", artes: "nao", motivo: "Profundidade programada (5 m em rocha sã)", geologo: "Geólogo A", fotos: "sim" },
          man: [
            { de: "6,20", ate: "6,90", rec: "0,58", nPec: "9", sRqd: "0,22", nFr: "7", alt: "A3", coe: "C3", classe: "Gnaisse muito alterado", coroa: "1", alarg: "1", revM: "6,50", perda: "Perda parcial" },
            { de: "6,90", ate: "8,40", rec: "1,41", nPec: "8", sRqd: "0,98", nFr: "6", alt: "A2", coe: "C2", classe: "Gnaisse medianamente alterado", coroa: "1", alarg: "1", revM: "6,50" },
            { de: "8,40", ate: "9,90", rec: "1,47", nPec: "5", sRqd: "1,30", nFr: "3", alt: "A1", coe: "C1", classe: "Gnaisse pouco alterado", coroa: "1", alarg: "1", revM: "6,50" },
            { de: "9,90", ate: "11,40", rec: "1,50", nPec: "3", sRqd: "1,44", nFr: "2", alt: "A0", coe: "C1", classe: "Gnaisse são", coroa: "1", alarg: "1", revM: "6,50" },
            { de: "11,40", ate: "12,90", rec: "1,49", nPec: "2", sRqd: "1,46", nFr: "1", alt: "A0", coe: "C1", classe: "Gnaisse são", coroa: "1", alarg: "1", revM: "6,50" }] };
      } },
      { nome: "Basalto fraturado — manobras longas em rocha alterada, baixa recuperação e lama sem autorização", dados: function () {
        return { ident: { registro: "SR-02", data: "2025-08-05", obra: "Obra B — corte em rocha", local: "Est. 240, LE 12 m", camada: "Talude de corte" },
          params: { firma: "Empresa de sondagem B", inclin: "", rumo: "", cota: "58,00", inicio: "2025-08-04", termino: "2025-08-05", resp: "Sondador B",
            equip: "Sonda mecânica; coroas de vídia BX; barrilete simples", diam: "BX", barrilete: "simples", profPerc: "2,00", recMin: "85", lama: "semaut",
            naIni: "", motivo: "", geologo: "" },
          man: [
            { de: "2,00", ate: "3,50", rec: "0,70", nPec: "25", sRqd: "0,10", nFr: "22", alt: "A3", coe: "C4", classe: "Basalto muito alterado, amigdaloide", coroa: "2", alarg: "2" },
            { de: "3,50", ate: "5,00", rec: "1,05", nPec: "14", sRqd: "0,45", frag: "", nFr: "12", alt: "A2", coe: "C2", classe: "Basalto medianamente alterado", coroa: "2", alarg: "2", perda: "Perda total a 4,2 m" },
            { de: "5,20", ate: "6,70", rec: "1,30", nPec: "6", sRqd: "1,02", nFr: "5", alt: "A1", coe: "C1", classe: "Basalto denso", coroa: "2", alarg: "2" }] };
      } },
    ],
  };

  function tabelaClasses(calc, imp) {
    var ms = calc.tab.man.filter(function (o) { return ok(o.comp); });
    if (!ms.length) return "";
    var th = imp ? ' style="background:#f2f2f2"' : "";
    return '<table class="' + (imp ? "gr" : "fe-resumo") + '"><thead><tr><th' + th + ">Manobra (m)</th><th" + th + ">Rec. %</th><th" + th + ">RQD %</th><th" + th + ">Qualidade (Tab. 12)</th><th" + th +
      ">Fraturamento (Tab. 13)</th><th" + th + ">Alteração (Tab. 11)</th><th" + th + ">Coerência (Tab. 14)</th></tr></thead><tbody>" +
      ms.map(function (o) {
        return "<tr><td>" + fmt(o.de, 2) + " – " + fmt(o.ate, 2) + "</td><td>" + fmt(o.recP, 0) + "</td><td>" + fmt(o.rqd, 0) + "</td><td>" + esc(qualRQD(o.rqd) || "—") + "</td><td>" +
          (o.F ? o.F + " — " + NOME_F[o.F] : "—") + "</td><td>" + (o.A ? o.A + " — " + ALT[o.A] : "—") + "</td><td>" + (o.C ? o.C + " — " + COE[o.C] : "—") + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  // perfil individual simplificado (Anexo E): recuperação e RQD, fraturas/m, graus e classificação × profundidade
  function perfil(calc, d, opt) {
    var ms = calc.tab.man.filter(function (o) { return ok(o.de) && ok(o.ate) && o.ate > o.de; });
    if (!ms.length) return '<div class="fe-graf-vazio">O perfil aparece com as profundidades das manobras.</div>';
    var P = d.params || {}, imp = opt.imprimir;
    var z0 = Math.min.apply(null, ms.map(function (o) { return o.de; })), z1 = Math.max.apply(null, ms.map(function (o) { return o.ate; }));
    var pp = num(P.profPerc); if (ok(pp) && pp < z0) z0 = pp;
    z0 = Math.floor(z0); z1 = Math.ceil(z1);
    var W = 620, top = 42, esc1 = Math.max(24, Math.min(60, 560 / Math.max(1, z1 - z0))), H = top + (z1 - z0) * esc1 + 16;
    var txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ccc" : "var(--border)", cR = "#4f8cff", cQ = "#34c38f", cF = "#e0a13a";
    var xA = 44, xR = 60, wR = 170, xF = 250, wF = 80, xG = 345, xC = 420;
    function Y(z) { return top + (z - z0) * esc1; }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
    s += '<text x="' + (xR + wR / 2) + '" y="12" text-anchor="middle" fill="' + txt + '">Recuperação / RQD (%)</text>';
    s += '<text x="' + (xF + wF / 2) + '" y="12" text-anchor="middle" fill="' + txt + '">Fraturas/manobra</text>';
    s += '<text x="' + (xG + 30) + '" y="12" text-anchor="middle" fill="' + txt + '">Graus</text>';
    s += '<text x="' + xC + '" y="12" fill="' + txt + '">Classificação</text>';
    [0, 50, 100].forEach(function (v) {
      var x = xR + v / 100 * wR;
      s += '<line x1="' + x + '" y1="' + (top - 4) + '" x2="' + x + '" y2="' + (H - 16) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + x + '" y="' + (top - 8) + '" text-anchor="middle" fill="' + txt + '" font-size="9">' + v + "</text>";
    });
    [0, 10, 20].forEach(function (v) {
      var x = xF + v / 25 * wF;
      s += '<line x1="' + x + '" y1="' + (top - 4) + '" x2="' + x + '" y2="' + (H - 16) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + x + '" y="' + (top - 8) + '" text-anchor="middle" fill="' + txt + '" font-size="9">' + v + "</text>";
    });
    for (var z = z0; z <= z1; z++) {
      s += '<line x1="' + (xA - 4) + '" y1="' + Y(z) + '" x2="' + xA + '" y2="' + Y(z) + '" stroke="' + txt + '"/>';
      s += '<text x="' + (xA - 7) + '" y="' + (Y(z) + 3.5) + '" text-anchor="end" fill="' + txt + '">' + z + "</text>";
    }
    s += '<line x1="' + xA + '" y1="' + Y(z0) + '" x2="' + xA + '" y2="' + Y(z1) + '" stroke="' + txt + '"/>';
    s += '<text x="10" y="' + (top + (H - top) / 2) + '" fill="' + txt + '" transform="rotate(-90 10 ' + (top + (H - top) / 2) + ')" text-anchor="middle">Profundidade (m)</text>';
    if (ok(pp) && pp > z0) {
      s += '<rect x="' + xR + '" y="' + Y(z0) + '" width="' + wR + '" height="' + (Y(pp) - Y(z0)) + '" fill="' + grade + '" opacity="0.5"/>';
      s += '<text x="' + (xR + wR / 2) + '" y="' + ((Y(z0) + Y(pp)) / 2 + 3) + '" text-anchor="middle" fill="' + txt + '">percussão (solo)</text>';
    }
    ms.forEach(function (o) {
      var y0 = Y(o.de), y1 = Y(o.ate), h = y1 - y0, hh = Math.max(1, h / 2 - 1);
      s += '<line x1="' + xA + '" y1="' + y1 + '" x2="' + (W - 6) + '" y2="' + y1 + '" stroke="' + grade + '" stroke-dasharray="3 3"/>';
      if (ok(o.recP)) s += '<rect x="' + xR + '" y="' + (y0 + 1) + '" width="' + Math.min(100, o.recP) / 100 * wR + '" height="' + hh + '" fill="' + cR + '"><title>Recuperação ' + fmt(o.recP, 0) + ' %</title></rect>';
      if (ok(o.rqd)) s += '<rect x="' + xR + '" y="' + (y0 + h / 2) + '" width="' + Math.min(100, o.rqd) / 100 * wR + '" height="' + hh + '" fill="' + cQ + '"><title>RQD ' + fmt(o.rqd, 0) + ' %</title></rect>';
      if (ok(o.nFr)) s += '<rect x="' + xF + '" y="' + (y0 + 2) + '" width="' + Math.min(25, o.nFr) / 25 * wF + '" height="' + Math.max(1, h - 4) + '" fill="' + cF + '"><title>' + fmt(o.nFr, 0) + ' fraturas</title></rect>';
      if (o.F === "F5") s += '<text x="' + (xF + 3) + '" y="' + ((y0 + y1) / 2 + 3.5) + '" fill="' + txt + '">fragm.</text>';
      s += '<text x="' + xG + '" y="' + ((y0 + y1) / 2 + 3.5) + '" fill="' + txt + '">' + [o.A, o.C, o.F].filter(Boolean).join(" ") + "</text>";
      var cl = String(o.classe || ""); if (cl.length > 34) cl = cl.slice(0, 33) + "…";
      s += '<text x="' + xC + '" y="' + ((y0 + y1) / 2 + 3.5) + '" fill="' + txt + '">' + esc(cl) + "</text>";
    });
    var na = num(P.naFin); if (!ok(na)) na = num(P.naIni);
    if (ok(na) && na >= z0 && na <= z1) {
      s += '<polygon points="' + (xA + 2) + "," + (Y(na) - 7) + " " + (xA + 12) + "," + (Y(na) - 7) + " " + (xA + 7) + "," + Y(na) + '" fill="#4fc3d9"/>';
      s += '<text x="' + (xA + 2) + '" y="' + (Y(na) - 9) + '" fill="' + txt + '" font-size="9">NA</text>';
    }
    var rv = num(P.revest);
    if (ok(rv) && rv > z0) s += '<line x1="' + (xA + 2) + '" y1="' + Y(z0) + '" x2="' + (xA + 2) + '" y2="' + Y(Math.min(rv, z1)) + '" stroke="' + txt + '" stroke-width="3"><title>Revestimento até ' + fmt(rv, 2) + " m</title></line>";
    s += '<rect x="' + xR + '" y="' + (H - 11) + '" width="10" height="7" fill="' + cR + '"/><text x="' + (xR + 13) + '" y="' + (H - 4) + '" fill="' + txt + '" font-size="9">recuperação</text>';
    s += '<rect x="' + (xR + 85) + '" y="' + (H - 11) + '" width="10" height="7" fill="' + cQ + '"/><text x="' + (xR + 98) + '" y="' + (H - 4) + '" fill="' + txt + '" font-size="9">RQD</text>';
    return s + "</svg>";
  }
})();
