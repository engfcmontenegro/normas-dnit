/*
 * Ficha: DNER-IE 146/94 — Defensas metálicas — Controle tecnológico durante a fabricação.
 * Registro da fiscalização na fábrica: prazos de notificação (3.1 e 3.2), matéria-prima (bobinas / chapas e
 * certificados da siderúrgica, seção 6), peças zincadas — espessura e dimensões por amostragem da Tabela (7.1 e 7.2.1),
 * porcas e parafusos (7.2.2), arruelas (7.2.3) e liberação com etiqueta (8). Parecer por lote de produção (FE.aceitacao).
 * Os limites de espessura, zincagem e tolerâncias são os da DNER-EM 145 (fora do acervo): informados por lote.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // 7.1 — Tabela: uma unidade de cada componente a cada "produção" peças
  var PRODUCAO = [["calco", "calço", 150], ["cinta", "cinta", 150], ["espacador", "espaçador", 200], ["lamina", "lâmina", 200], ["travessa", "travessa", 200],
    ["poste", "poste", 50], ["garra", "garra", 200], ["plaqueta", "plaqueta", 500], ["terminal", "terminal", 50]];
  var FIX = [["parafuso", "parafuso", 20], ["porca", "porca", 20], ["arruela", "arruela", 5]];   // kg por amostra (7.2.2 b, 7.2.3)
  function chave(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, ""); }
  function achar(lista, txt) {
    var k = chave(txt);
    if (!k) return null;
    return lista.filter(function (x) { return k.indexOf(x[0]) === 0 || x[0].indexOf(k) === 0 || k.indexOf(x[0].slice(0, 5)) === 0; })[0] || null;
  }
  function sn(v) { var s = chave(v); return s === "s" || s === "sim" ? true : s === "n" || s === "nao" ? false : null; }
  // dias úteis entre duas datas (segunda a sexta; feriados não descontados)
  function diasUteis(de, ate) {
    var a = new Date(de + "T12:00:00"), b = new Date(ate + "T12:00:00");
    if (isNaN(a) || isNaN(b)) return NaN;
    var n = 0, sinal = b >= a ? 1 : -1, d = new Date(a);
    while ((sinal > 0 && d < b) || (sinal < 0 && d > b)) {
      d.setDate(d.getDate() + sinal);
      var w = d.getDay();
      if (w !== 0 && w !== 6) n += sinal;
    }
    return n;
  }
  function dataBR(s) { return A.dataBR ? A.dataBR(s) : s; }

  FE.FICHAS["dner-ie-146-94"] = {
    titulo: "Defensas metálicas — Controle tecnológico durante a fabricação",
    lote: true,
    rotuloImportar: function (r) { return (r.parecer || "—") + " · " + (r.nLotes || 0) + " lote(s) de peças"; },
    resumo: "Fiscalização na fábrica: prazos de notificação, certificados das bobinas / chapas, amostragem das peças zincadas pela Tabela da seção 7.1 (espessura, gabaritos e zincagem), porcas, parafusos e arruelas, e liberação com etiqueta; parecer por lote de produção.",
    blocos: [],
    params: [
      { k: "fabricante", r: "Fabricante", ph: "ex.: Fornecedor A" },
      { k: "contrato", r: "Contrato / ordem de fornecimento" },
      { k: "entidade", r: "Fiscalização (3.1 / 3.3)", tipo: "select", opcoes: [["drf", "Fiscal do distrito mais próximo da fábrica (3.1)"], ["delegada", "Entidade delegada, com plano de trabalho aprovado (3.3)"]] },
      { k: "dtFab", r: "Data em que o fabricante informou a fabricação (3.1)", tipo: "date" },
      { k: "dtNotif", r: "Data da notificação do órgão licitante ao fiscal (3.2)", tipo: "date" },
      { k: "dtIni", r: "Início da fabricação", tipo: "date" },
      { k: "dtFim", r: "Fim do período de fabricação", tipo: "date" },
      { k: "periodo", r: "O período de fabricação está explícito na notificação? (3.2.1)", tipo: "select", opcoes: [["", "—"], ["sim", "Sim"], ["nao", "Não"]] },
    ],
    padrao: { entidade: "drf", periodo: "" },
    tabelas: function () {
      return [
        { chave: "bob", titulo: "Matéria-prima — bobinas e chapas (seção 6)", rotulo: "Bobina", iniciais: 2, min: 1,
          dica: "uma coluna por bobina (ou lingada de chapas); responda S ou N",
          linhas: [
            { k: "num", r: "Nº da bobina (ou da bobina que originou a lingada)", texto: true },
            { k: "sigla", r: "Sigla da siderúrgica", texto: true },
            { k: "cert", r: "Tem certificado da siderúrgica? (6.1)", texto: true, ph: "S/N" },
            { k: "ident", r: "Identificação confere com o certificado (6.1 a, b)?", texto: true, ph: "S/N" },
            { k: "legivel", r: "Marcação legível, sem rasura (6.4)?", texto: true, ph: "S/N" },
            { k: "ensaios", r: "Ensaios mecânicos e químicos do certificado atendem à EM 145, item 10 (6.2)?", texto: true, ph: "S/N" },
          ] },
        { chave: "pec", titulo: "Peças zincadas — espessura e dimensões (7.1 e 7.2.1)", rotulo: "Lote", iniciais: 3, min: 1,
          dica: "uma coluna por lote de produção de um componente (calço, cinta, espaçador, lâmina, travessa, poste, garra, plaqueta, terminal); limites da DNER-EM 145",
          linhas: [
            { k: "comp", r: "Componente", texto: true, ph: "lâmina" },
            { k: "prod", r: "Quantidade produzida no lote", u: "peças" },
            { k: "nAm", r: "Peças inspecionadas", u: "peças" },
            { calc: "nEx", r: "Peças exigidas (1 a cada n da Tabela, 7.1)", u: "peças", casas: 0 },
            { k: "eMin", r: "Espessura mínima admitida (EM 145)", u: "mm" },
            { k: "e1", r: "Espessura medida — ponto 1 (paquímetro)", u: "mm" },
            { k: "e2", r: "Espessura medida — ponto 2", u: "mm" },
            { k: "e3", r: "Espessura medida — ponto 3", u: "mm" },
            { k: "e4", r: "Espessura medida — ponto 4", u: "mm" },
            { calc: "eMed", r: "Menor espessura medida", u: "mm", casas: 2, destaque: true },
            { k: "znMin", r: "Camada de zinco mínima (EM 145) — opcional", u: "µm" },
            { k: "zn", r: "Camada de zinco medida (menor leitura, 5.4) — opcional", u: "µm" },
            { k: "gab", r: "Furações, contornos, ângulos e dimensões conferem com o gabarito (7.2.1)?", texto: true, ph: "S/N" },
            { k: "etq", r: "Etiqueta DNER aplicada (8)?", texto: true, ph: "S/N" },
            { k: "obsL", r: "Observação", texto: true },
          ] },
        { chave: "fix", titulo: "Porcas, parafusos e arruelas (7.2.2 e 7.2.3)", rotulo: "Lote", iniciais: 3, min: 1,
          dica: "parafusos e porcas: 1 unidade a cada 20 kg ou fração, rosca verificada com a porca / parafuso padrão; arruelas: 1 a cada 5 kg ou fração, paquímetro",
          linhas: [
            { k: "tipo", r: "Peça (parafuso, porca ou arruela)", texto: true, ph: "parafuso" },
            { k: "kg", r: "Massa do lote", u: "kg" },
            { k: "nAm", r: "Amostras verificadas", u: "un." },
            { calc: "nEx", r: "Amostras exigidas", u: "un.", casas: 0 },
            { k: "conf", r: "Rosca / dimensões conforme o padrão (S/N)", texto: true, ph: "S/N" },
            { k: "etq", r: "Etiqueta DNER no saco (8)?", texto: true, ph: "S/N" },
          ] },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], linhas = [];
      // prazos (3.1 e 3.2)
      var du1 = P.dtFab && P.dtIni ? diasUteis(P.dtFab, P.dtIni) : NaN, du2 = P.dtNotif && P.dtIni ? diasUteis(P.dtNotif, P.dtIni) : NaN;
      var l1 = A.linha({ grupo: "Notificação", criterio: "Aviso do fabricante antes da fabricação", secao: "3.1", exigido: "≥ 10 dias úteis",
        resultado: ok(du1) ? du1 + " dias úteis" : "—" });
      if (!ok(du1)) A.marcar(l1, "pendente", "informe as datas do aviso do fabricante e do início da fabricação");
      else if (du1 < 10) A.marcar(l1, "ressalva", "aviso com " + du1 + " dias úteis de antecedência (mínimo 10)");
      var l2 = A.linha({ grupo: "Notificação", criterio: "Notificação do órgão licitante ao fiscal", secao: "3.2", exigido: "≥ 7 dias úteis antes do início",
        resultado: ok(du2) ? du2 + " dias úteis" : "—" });
      if (!ok(du2)) A.marcar(l2, "pendente", "informe a data da notificação ao fiscal");
      else if (du2 < 7) A.marcar(l2, "ressalva", "notificação com " + du2 + " dias úteis de antecedência (mínimo 7)");
      if (P.periodo === "nao") A.marcar(l2, "ressalva", "período de fabricação não explícito na notificação (3.2.1)");
      linhas.push(l1, l2);
      if (P.dtIni && P.dtFim && P.dtFim < P.dtIni) avisos.push("O fim do período de fabricação é anterior ao início.");

      // matéria-prima (6)
      var bob = (d.bob || []).map(function (p, i) {
        var tem = ["num", "sigla", "cert", "ident", "legivel", "ensaios"].some(function (k) { return String(p[k] || "").trim(); });
        if (!tem) return {};
        var rot = "Bobina " + (p.num || i + 1), l = A.linha({ grupo: "Matéria-prima (seção 6)", criterio: rot + (p.sigla ? " — " + p.sigla : ""), secao: "6.1 a 6.4",
          exigido: "certificado, identificação legível e ensaios conforme a EM 145", resultado: "enviada à produção" });
        var cert = sn(p.cert), id = sn(p.ident), leg = sn(p.legivel), ens = sn(p.ensaios);
        if (!String(p.num || "").trim() || !String(p.sigla || "").trim()) A.marcar(l, "pendente", "registre o nº da bobina e a sigla da siderúrgica (6.1)");
        if (cert === false) A.marcar(l, "nao_conforme", "sem certificado da siderúrgica (6.1)");
        if (id === false) A.marcar(l, "nao_conforme", "identificação não confere com o certificado (6.1)");
        if (leg === false) A.marcar(l, "nao_conforme", "marcação ilegível ou rasurada — rejeitar (6.4)");
        if (ens === false) A.marcar(l, "nao_conforme", "ensaios do certificado não atendem à EM 145 — rejeitar (6.3)");
        [[cert, "certificado"], [id, "identificação"], [leg, "legibilidade"], [ens, "ensaios do certificado"]].forEach(function (x) {
          if (x[0] === null) A.marcar(l, "pendente", "verificação sem resposta: " + x[1]);
        });
        if (l.situacao === "nao_conforme") l.resultado = "REJEITADA";
        linhas.push(l);
        return { ok: l.situacao === "conforme" };
      });

      // peças (7.1, 7.2.1, 8)
      var nLotes = 0;
      var pec = (d.pec || []).map(function (p, i) {
        if (!String(p.comp || "").trim() && !ok(num(p.prod))) return {};
        nLotes++;
        var c = achar(PRODUCAO, p.comp), prod = num(p.prod), nAm = num(p.nAm), o = {};
        o.nEx = c && ok(prod) ? Math.max(1, Math.ceil(prod / c[2])) : NaN;
        var es = ["e1", "e2", "e3", "e4"].map(function (k) { return num(p[k]); }).filter(ok);
        o.eMed = es.length ? Math.min.apply(null, es) : NaN;
        var eMin = num(p.eMin), zn = num(p.zn), znMin = num(p.znMin), gab = sn(p.gab), etq = sn(p.etq);
        var l = A.linha({ grupo: "Peças zincadas (7.1 e 7.2.1)", criterio: "Lote " + (i + 1) + " — " + (c ? c[1] : p.comp || "componente?") + (ok(prod) ? " (" + fmt(prod, 0) + " peças)" : ""),
          secao: "7.1; 7.2.1", casas: 2, exigido: (ok(eMin) ? "e ≥ " + fmt(eMin, 2) + " mm; " : "") + (ok(znMin) ? "Zn ≥ " + fmt(znMin, 0) + " µm; " : "") + "gabarito",
          resultado: (ok(o.eMed) ? "e mín. " + fmt(o.eMed, 2) + " mm" : "—") + (ok(zn) ? " · Zn " + fmt(zn, 0) + " µm" : "") + (gab === true ? " · gabarito OK" : gab === false ? " · gabarito NÃO" : "") });
        l.exig = o.nEx; l.real = ok(nAm) ? nAm : 0;
        if (!c) A.marcar(l, "pendente", "componente não reconhecido na Tabela da seção 7.1 (" + (p.comp || "vazio") + ")");
        if (!ok(prod)) A.marcar(l, "pendente", "informe a quantidade produzida no lote");
        if (ok(o.nEx) && (!ok(nAm) || nAm < o.nEx)) A.marcar(l, "pendente", "amostragem insuficiente: " + (ok(nAm) ? fmt(nAm, 0) : "0") + " de " + o.nEx + " peça(s) — 1 a cada " + c[2] + " (7.1)");
        if (!es.length) A.marcar(l, "pendente", "sem medidas de espessura (7.1)");
        else if (!ok(eMin)) A.marcar(l, "pendente", "informe a espessura mínima da DNER-EM 145 para o componente");
        else if (o.eMed < eMin - 1e-9) A.marcar(l, "nao_conforme", "espessura de " + fmt(o.eMed, 2) + " mm abaixo do mínimo de " + fmt(eMin, 2) + " mm");
        if (ok(zn) && ok(znMin) && zn < znMin) A.marcar(l, "nao_conforme", "camada de zinco de " + fmt(zn, 0) + " µm abaixo do mínimo de " + fmt(znMin, 0) + " µm");
        if (gab === false) A.marcar(l, "nao_conforme", "furações / contornos / ângulos / dimensões não coincidem com o gabarito — rejeitar a produção referente à amostra (7.2.1)");
        else if (gab === null) A.marcar(l, "pendente", "verificação com o gabarito sem resposta (7.2.1)");
        if (l.situacao === "nao_conforme" && etq === true) A.marcar(l, "nao_conforme", "lote reprovado com etiqueta de liberação — retirar as etiquetas e separar as peças (7.2.1 e 8)");
        if (l.situacao !== "nao_conforme" && l.situacao !== "pendente" && etq !== true) A.marcar(l, "ressalva", "lote aprovado ainda sem a etiqueta DNER de liberação (8)");
        if (p.obsL) l.resultado += " · " + p.obsL;
        linhas.push(l);
        o.sit = l.situacao;
        return o;
      });

      // porcas, parafusos e arruelas (7.2.2 e 7.2.3)
      var fix = (d.fix || []).map(function (p, i) {
        if (!String(p.tipo || "").trim() && !ok(num(p.kg))) return {};
        var c = achar(FIX, p.tipo), kg = num(p.kg), nAm = num(p.nAm), conf = sn(p.conf), etq = sn(p.etq), o = {};
        o.nEx = c && ok(kg) ? Math.max(1, Math.ceil(kg / c[2] - 1e-9)) : NaN;
        var l = A.linha({ grupo: "Porcas, parafusos e arruelas (7.2.2 e 7.2.3)", criterio: "Lote " + (i + 1) + " — " + (c ? c[1] + "s" : p.tipo || "peça?") + (ok(kg) ? " (" + fmt(kg, 1) + " kg)" : ""),
          secao: c && c[0] === "arruela" ? "7.2.3" : "7.2.2", exigido: c ? "1 amostra a cada " + c[2] + " kg ou fração; " + (c[0] === "arruela" ? "dimensões da EM 145" : "rosca conforme o padrão") : "—",
          resultado: conf === true ? "conforme" : conf === false ? "NÃO conforme" : "—" });
        l.exig = o.nEx; l.real = ok(nAm) ? nAm : 0;
        if (!c) A.marcar(l, "pendente", "peça não reconhecida (parafuso, porca ou arruela)");
        if (!ok(kg)) A.marcar(l, "pendente", "informe a massa do lote");
        if (ok(o.nEx) && (!ok(nAm) || nAm < o.nEx)) A.marcar(l, "pendente", "amostragem insuficiente: " + (ok(nAm) ? fmt(nAm, 0) : "0") + " de " + o.nEx);
        if (conf === false) A.marcar(l, "nao_conforme", c && c[0] === "arruela" ? "dimensões fora da EM 145 — rejeitar (7.2.3)" : "rosca não confere com o padrão — rejeitar (7.2.2)");
        else if (conf === null) A.marcar(l, "pendente", "verificação sem resposta");
        if (l.situacao === "conforme" && etq !== true) A.marcar(l, "ressalva", "lote aprovado ainda sem a etiqueta DNER no saco (8)");
        linhas.push(l);
        return o;
      });
      if (!nLotes) avisos.push("Registre ao menos um lote de peças zincadas (7.1).");
      var par = A.parecer(linhas, [], {
        textos: {
          ACEITO: { titulo: "PRODUÇÃO APROVADA", texto: "Matéria-prima, peças e fixações verificadas conforme a DNER-IE 146/94 e liberadas com etiqueta." },
          RESSALVA: { titulo: "PRODUÇÃO APROVADA COM RESSALVA", texto: "Nenhum lote reprovado; há prazos de notificação descumpridos ou lotes aprovados ainda sem etiqueta." },
          PENDENTE: { titulo: "CONTROLE PENDENTE", texto: "Nenhum lote reprovado, mas falta completar a amostragem, as medidas ou os limites da DNER-EM 145." },
          REJEITADO: { titulo: "HÁ PRODUÇÃO REJEITADA", texto: "Matéria-prima ou lote(s) de peças reprovados: separe a produção referente às amostras reprovadas e dê ciência ao responsável pela produção (6.3, 6.4 e 7.2.1); os lotes aprovados podem ser etiquetados e liberados (8)." },
        },
        nota: "Espessuras, tolerâncias e camada de zinco: limites da DNER-EM 145/94 (não incluída no acervo), informados por lote. Dias úteis contados de segunda a sexta, sem descontar feriados.",
      });
      return { tab: { bob: bob, pec: pec, fix: fix }, linhas: linhas, par: par, avisos: avisos,
        resultados: { parecer: par.parecer, titulo: par.titulo, nLotes: nLotes, du1: du1, du2: du2,
          rejeitados: linhas.filter(function (l) { return l.situacao === "nao_conforme"; }).map(function (l) { return l.criterio; }) } };
    },
    resultadosHtml: function (calc) {
      return A.htmlParecer(calc.par) + A.htmlCriterios(calc.linhas, { estilo: "resultado" });
    },
    relatorio: {
      notas: "Amostragem (7.1): uma peça de cada componente a cada 150 (calço, cinta), 200 (espaçador, lâmina, travessa, garra), 50 (poste, terminal) ou 500 (plaqueta) peças produzidas, após a zincagem; espessura com paquímetro em tantos pontos quantos necessários (registrada a menor) e verificação com gabarito por superposição (lâmina, plaqueta, cinta) ou encaixe (poste, travessa, espaçador, calço, garra, terminal). Porcas e parafusos: 1 unidade a cada 20 kg ou fração, rosca verificada com a peça padrão; arruelas: 1 a cada 5 kg ou fração. Lote reprovado: a produção referente à amostra é rejeitada e separada.",
      resultados: function (calc, d) {
        var P = d.params || {}, r = calc.resultados;
        var rows = [["Parecer", calc.par.titulo]];
        if (P.fabricante) rows.push(["Fabricante", P.fabricante]);
        if (P.dtIni) rows.push(["Período de fabricação", dataBR(P.dtIni) + (P.dtFim ? " a " + dataBR(P.dtFim) : "")]);
        rows.push(["Antecedência do aviso do fabricante / da notificação ao fiscal", (ok(r.du1) ? r.du1 : "—") + " / " + (ok(r.du2) ? r.du2 : "—") + " dias úteis"]);
        if (r.rejeitados.length) rows.push(["Itens rejeitados", r.rejeitados.join("; ")]);
        return rows;
      },
      extraHtml: function (calc) { return A.htmlParecer(calc.par, { relat: true }) + A.htmlCriterios(calc.linhas, { relat: true, estilo: "resultado" }); },
    },
    exemplos: [
      { nome: "Lâminas, postes e espaçadores — produção aprovada", dados: function () {
        return { ident: { registro: "FD-146-01", data: "2026-03-16", obra: "Obra A", origem: "Fornecedor A", camada: "Defensa semimaleável simples", laboratorista: "Inspetor A" },
          params: { fabricante: "Fornecedor A", contrato: "OF 012/2026", entidade: "drf", dtFab: "2026-02-23", dtNotif: "2026-03-03", dtIni: "2026-03-16", dtFim: "2026-03-27", periodo: "sim" },
          bob: [{ num: "B-40317", sigla: "SID-X", cert: "S", ident: "S", legivel: "S", ensaios: "S" }, { num: "B-40322", sigla: "SID-X", cert: "S", ident: "S", legivel: "S", ensaios: "S" }],
          pec: [
            { comp: "lâmina", prod: "1200", nAm: "6", eMin: "2,51", e1: "2,68", e2: "2,66", e3: "2,70", e4: "2,65", znMin: "70", zn: "86", gab: "S", etq: "S" },
            { comp: "poste", prod: "300", nAm: "6", eMin: "4,50", e1: "4,72", e2: "4,69", e3: "4,75", znMin: "70", zn: "92", gab: "S", etq: "S" },
            { comp: "espaçador", prod: "600", nAm: "3", eMin: "4,50", e1: "4,66", e2: "4,70", znMin: "70", zn: "81", gab: "S", etq: "S" }],
          fix: [{ tipo: "parafuso", kg: "95", nAm: "5", conf: "S", etq: "S" }, { tipo: "porca", kg: "38", nAm: "2", conf: "S", etq: "S" }, { tipo: "arruela", kg: "12", nAm: "3", conf: "S", etq: "S" }] };
      } },
      { nome: "Bobina sem certificado, travessas fora do gabarito e amostragem curta — produção rejeitada", dados: function () {
        return { ident: { registro: "FD-146-02", data: "2026-06-08", obra: "Obra B", origem: "Fornecedor B", camada: "Defensa maleável dupla" },
          params: { fabricante: "Fornecedor B", entidade: "delegada", dtFab: "2026-06-01", dtNotif: "2026-06-03", dtIni: "2026-06-08", dtFim: "2026-06-12", periodo: "nao" },
          bob: [{ num: "C-1182", sigla: "SID-Y", cert: "S", ident: "S", legivel: "S", ensaios: "S" }, { num: "C-1190", sigla: "SID-Y", cert: "N", ident: "N", legivel: "S", ensaios: "" }],
          pec: [
            { comp: "lâmina", prod: "800", nAm: "4", eMin: "2,51", e1: "2,62", e2: "2,59", e3: "2,61", znMin: "70", zn: "78", gab: "S", etq: "S" },
            { comp: "travessa", prod: "400", nAm: "2", eMin: "4,50", e1: "4,61", e2: "4,58", gab: "N", etq: "N", obsL: "furação oblonga deslocada 4 mm" },
            { comp: "plaqueta", prod: "1600", nAm: "2", eMin: "4,50", e1: "4,40", e2: "4,55", gab: "S", etq: "S" },
            { comp: "terminal", prod: "40", nAm: "1", eMin: "2,51", e1: "2,60", gab: "S", etq: "" }],
          fix: [{ tipo: "parafuso", kg: "61", nAm: "3", conf: "N", etq: "N" }, { tipo: "arruela", kg: "9", nAm: "2", conf: "S", etq: "S" }] };
      } },
    ],
  };
})();
