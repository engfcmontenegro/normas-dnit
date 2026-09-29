/*
 * Ficha: DNIT 461/2025-PRO — Agregados — Coleta de amostras de agregados (registro e verificação).
 * Registra cada amostra de campo (uma coluna por procedência/agregado): local de coleta (7.1 a 7.5), número de
 * amostras parciais, subáreas da carga, camada exterior removida, massa coletada e massa remetida após a redução
 * (8, DNIT 455-PRO) e confere com a massa mínima da Tabela 1 (ensaios físicos e químicos) ou da Tabela 2
 * (dosagem de concreto). Confere também a etiqueta (9 b). Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var TOL_CAMADA = 27;  // "cerca de 30 cm" removidos da camada exterior: aviso abaixo de 27 cm (critério da ficha)

  // Tabela 1 — massa total mínima (kg) por abertura nominal das malhas (mm)
  var TAB1 = [[9.5, 40], [19, 40], [37.5, 75], [75, 150]];
  // Tabela 2 — dosagem de concreto (kg)
  var TAB2 = { m1: [200, "Miúdo — apenas um agregado"], m2: [150, "Miúdo — dois ou mais agregados (por unidade)"],
    g1: [300, "Graúdo — apenas um tipo/graduação"], g2: [200, "Graúdo — duas ou mais graduações (por unidade)"] };
  var LOCAIS = [["silo", "Silo ou correia transportadora (7.1)"], ["pilhaMec", "Pilha de estocagem — com equipamento mecânico (7.2 d)"],
    ["pilhaMan", "Pilha de estocagem — coleta manual (7.2 e)"], ["veiculo", "Veículo (7.3)"], ["pedreira", "Pedreira — seção 5 da DNIT 257-PRO (7.4)"],
    ["deposito", "Depósito de areia e cascalho — DNER-PRO 003/94 ou 002/94 (7.5)"]];
  var ETQ = [["eDesc", "breve descrição do conteúdo"], ["eNat", "natureza do material"], ["eProc", "procedência do material"],
    ["eQtd", "quantidade"], ["eData", "data e local da coleta, com coordenadas geográficas"], ["eResp", "responsável pela coleta"],
    ["eFim", "fim a que se destina"], ["eEmp", "local onde será empregada"], ["eRem", "nome do remetente"]];
  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];
  function loc(d) { return ((d && d.params) || {}).local || "silo"; }
  function em() { var l = arguments; return function (d) { return Array.prototype.indexOf.call(l, loc(d)) >= 0; }; }
  function sempre() { return true; }
  var CHECK = [
    ["chkUmido", "5 d", "Amostragem feita com o material úmido, sempre que possível (evita segregação do pulverulento)", sempre],
    ["chkDesc", "7.1 b e c", "Amostras de várias descargas, evitando o início e o final das descargas", em("silo")],
    ["chkPontos", "7.2 a", "Amostras de vários pontos da pilha, alternadamente de um lado e de outro, da crista até a base", em("pilhaMec", "pilhaMan")],
    ["chkSec", "7.2 d", "Pilha secundária formada com equipamento mecânico, com incrementos de múltiplos pontos da pilha principal", em("pilhaMec")],
    ["chkTabua", "7.2 e", "Parciais do topo, do meio e da base, na superfície e no interior, com tábua vertical sobre o ponto de amostragem", em("pilhaMan")],
    ["chkMist", "7.3 c", "Amostras coletadas no veículo reunidas e misturadas", em("veiculo")],
    ["chk257", "7.4", "Coleta conforme a seção 5 da DNIT 257-PRO", em("pedreira")],
    ["chk003", "7.5", "Coleta conforme a DNER-PRO 003/94 (deformadas) ou 002/94 (indeformadas)", em("deposito")],
    ["chkRed", "8", "Amostra de campo reduzida por quarteamento conforme a DNIT 455-PRO antes da remessa", sempre],
    ["chkEmb", "9 a", "Embalagem adequada e resistente, amostra identificada e acompanhada de ofício", sempre],
  ];

  function mMin(P, dmax) {
    if (P.finalidade === "dosagem") return (TAB2[P.dosagem] || TAB2.m1)[0];
    if (!ok(dmax)) return NaN;
    for (var i = 0; i < TAB1.length; i++) if (dmax <= TAB1[i][0] + 1e-9) return TAB1[i][1];
    return NaN;
  }

  FE.FICHAS["dnit-461-2025-pro"] = {
    titulo: "Agregados — Coleta de amostras de agregados",
    resumo: "Registro e verificação da coleta em silos, correias, pilhas, veículos, pedreiras e depósitos (7): amostras parciais, subáreas, camada removida, massa remetida frente às Tabelas 1 e 2 (6), redução pela DNIT 455-PRO (8), embalagem e etiqueta (9).",
    params: [
      { k: "finalidade", r: "Finalidade (6)", tipo: "select", opcoes: [["fisq", "Ensaios físicos ou químicos — Tabela 1"], ["dosagem", "Dosagem de concreto — Tabela 2"]] },
      { k: "dosagem", r: "Categoria (Tabela 2)", tipo: "select", opcoes: Object.keys(TAB2).map(function (k) { return [k, TAB2[k][1] + " — " + TAB2[k][0] + " kg"]; }),
        se: function (d) { return (d.params || {}).finalidade === "dosagem"; } },
      { k: "agregado", r: "Agregado (3.1 e 3.2)", tipo: "select", opcoes: [["graudo", "Graúdo (passa 75 mm, retido 4,75 mm)"], ["miudo", "Miúdo (passa 4,75 mm, retido 0,075 mm)"], ["mistura", "Mistura de graúdo e miúdo"]] },
      { k: "local", r: "Local da coleta (7)", tipo: "select", recarrega: true, opcoes: LOCAIS },
      { k: "veiculo", r: "Posição na carga (7.3)", tipo: "select", se: em("veiculo"), opcoes: [["sup", "Superfície — seis subáreas (7.3 a)"], ["int", "Interior — após remover ≈ 30 cm (7.3 b)"], ["inf", "Parte inferior — traseira/lateral aberta (7.3 c)"]] },
      { k: "lote", r: "Lote / material submetido à avaliação", ph: "ex.: pilha de brita 1, 300 m³" },
    ].concat(CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN, se: c[3] }; })),
    padrao: { finalidade: "fisq", dosagem: "m1", agregado: "graudo", local: "silo", veiculo: "sup" },
    tabelas: function (d) {
      var l = loc(d), linhas = [{ grupo: "Coleta (7)" },
        { k: "dmax", r: "Abertura nominal das malhas — dimensão máxima (Tabela 1)", u: "mm" },
        { k: "nParc", r: "Amostras parciais reunidas", u: "nº" }];
      if (l === "veiculo") linhas.push({ k: "nSub", r: "Subáreas da carga amostradas (7.3 a)", u: "nº", ph: "6" });
      if (l === "pilhaMan" || l === "pilhaMec" || l === "veiculo") linhas.push({ k: "cam", r: "Camada exterior removida antes da coleta (7.2 f / 7.3 b)", u: "cm" });
      linhas = linhas.concat([
        { k: "mCampo", r: "Massa da amostra de campo coletada", u: "kg" },
        { k: "mRem", r: "Massa remetida ao laboratório, após a redução (8)", u: "kg" },
        { calc: "mMin", r: "Massa total mínima (Tabela " + (((d.params || {}).finalidade === "dosagem") ? "2" : "1") + ")", u: "kg", casas: 0 },
        { calc: "folga", r: "Massa remetida / mínima", u: "%", casas: 0, destaque: true },
        { grupo: "Etiqueta (9 b)" }]).concat(ETQ.map(function (e) { return { k: e[0], r: e[1], texto: true }; }));
      return [{ chave: "am", titulo: "Amostras de campo", rotulo: "Amostra", iniciais: 1, min: 1, linhas: linhas,
        dica: "uma coluna por procedência (7.2 c) ou por agregado/graduação (Tabela 2, por unidade)" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], l = loc(d), r = { n: 0, atende: 0 };
      var am = (d.am || []).map(function (x, i) {
        var rot = "Amostra " + (i + 1), o = {}, dmax = num(x.dmax);
        o.mMin = mMin(P, dmax);
        var mr = num(x.mRem), mc = num(x.mCampo);
        o.folga = ok(mr) && ok(o.mMin) ? mr / o.mMin * 100 : NaN;
        if (P.finalidade !== "dosagem" && ok(dmax) && dmax > 75) avisos.push(rot + ": dimensão de " + fmt(dmax, 1) + " mm fora da Tabela 1 (até 75 mm); agregado graúdo é o passante na peneira de 75 mm (3.1).");
        if (ok(mr) && ok(o.mMin)) { r.n++; if (mr >= o.mMin) r.atende++; else avisos.push(rot + ": massa remetida de " + fmt(mr, 1) + " kg é menor que a mínima de " + fmt(o.mMin, 0) + " kg (Tabela " + (P.finalidade === "dosagem" ? "2" : "1") + ").");
        }
        if (ok(mr) && ok(mc) && mc < mr) avisos.push(rot + ": massa remetida maior que a coletada no campo — confira.");
        var np = num(x.nParc);
        if (ok(np) && np < 3 && (l === "silo" || l === "pilhaMan")) avisos.push(rot + ": " + fmt(np, 0) + " amostra(s) parcial(is) — no mínimo três (" + (l === "silo" ? "7.1 a" : "7.2 e") + ").");
        if (ok(np) && np < 2 && l !== "silo" && l !== "pilhaMan") avisos.push(rot + ": a amostra deve reunir várias amostras parciais de vários pontos do lote (5 b).");
        var ns = num(x.nSub);
        if (l === "veiculo" && P.veiculo !== "inf" && ok(ns) && ns !== 6) avisos.push(rot + ": " + fmt(ns, 0) + " subárea(s) — a carga é dividida em seis subáreas (mediana longitudinal × duas transversais) e amostra-se cada uma (7.3 a).");
        var cam = num(x.cam);
        if (ok(cam) && cam < TOL_CAMADA) {
          if ((l === "pilhaMan" || l === "pilhaMec") && P.agregado === "miudo") avisos.push(rot + ": em pilha de agregado miúdo removem-se cerca de 30 cm ou mais da camada exterior (7.2 f); informado " + fmt(cam, 0) + " cm.");
          if (l === "veiculo" && P.veiculo === "int") avisos.push(rot + ": no interior da carga a coleta é feita após remover ≈ 30 cm da camada superior (7.3 b); informado " + fmt(cam, 0) + " cm.");
        }
        var falta = ETQ.filter(function (e) { return !String(x[e[0]] || "").trim(); }).map(function (e) { return e[1]; });
        o.falta = falta.length;
        if (falta.length) avisos.push(rot + ": etiqueta sem " + falta.join("; ") + " (9 b).");
        return o;
      });
      var chk = { feitos: 0, total: 0, pend: [], nao: 0 };
      CHECK.forEach(function (c) {
        if (!c[3](d)) return;
        chk.total++;
        if (P[c[0]] === "sim") chk.feitos++;
        else if (P[c[0]] === "nao") { chk.nao++; avisos.push("Não atendido (" + c[1] + "): " + c[2] + "."); }
        else chk.pend.push(c[1]);
      });
      r.chk = chk; r.nAvisos = avisos.length; r.mMin0 = (am[0] || {}).mMin; r.mRem0 = num(((d.am || [])[0] || {}).mRem);
      return { tab: { am: am }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, c = r.chk;
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var st = r.nAvisos ? '<span class="fe-nok">' + r.nAvisos + " verificação(ões) com aviso</span>" : c.pend.length ? "itens pendentes: " + esc(c.pend.join(", ")) : '<span class="fe-ok">conforme a norma</span>';
      return '<div class="fe-res">' + cx(r.atende + " / " + r.n, "Amostras com a massa mínima (6) · " + st) +
        cx(fmt(r.mRem0, 1) + " <small>kg</small>", "Massa remetida (amostra 1)") + cx(fmt(r.mMin0, 0) + " <small>kg</small>", "Massa mínima (amostra 1)") +
        cx(c.feitos + " / " + c.total, "Procedimentos confirmados") + "</div>";
    },
    relatorio: {
      notas: "Coleta conforme a DNIT 461/2025-PRO. Tabela 1 (ensaios físicos e químicos): até 19 mm, 40 kg; > 19 a 37,5 mm, 75 kg; > 37,5 a 75 mm, 150 kg. Tabela 2 (dosagem de concreto): miúdo 200 kg (um agregado) ou 150 kg por unidade; graúdo 300 kg (uma graduação) ou 200 kg por unidade. Pelo menos três parciais em silos/correias e pilhas sem equipamento; seis subáreas na carga de veículos; cerca de 30 cm da camada exterior removidos em pilhas de miúdo e no interior da carga. Redução por quarteamento (DNIT 455-PRO) antes da remessa. Critério da ficha: \"cerca de 30 cm\" aceito a partir de 27 cm.",
      resultados: function (calc, d) {
        var r = calc.resultados, rows = [];
        (d.am || []).forEach(function (x, i) {
          var o = calc.tab.am[i];
          rows.push(["Amostra " + (i + 1) + (x.eProc ? " — " + x.eProc : ""), "remetidos " + (x.mRem || "—") + " kg · mínimo " + fmt(o.mMin, 0) + " kg · " +
            (ok(o.folga) ? (o.folga >= 100 ? "atende" : "NÃO atende") : "—") + (o.falta ? " · etiqueta incompleta" : "")]);
        });
        rows.push(["Verificações", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Brita 1 e pó de pedra em pilhas — coleta manual, ensaios físicos", dados: function () {
        var etq = { eNat: "Agregado britado (gnaisse)", eProc: "Pedreira X", eResp: "Técnico A", eFim: "Caracterização para base de brita graduada", eEmp: "Obra A — BR-000, km 10 a 25", eRem: "Unidade A" };
        return { ident: { registro: "EX-CA-001", data: "2025-07-15", obra: "Obra A", origem: "Pedreira X", camada: "Base — brita graduada" },
          params: { finalidade: "fisq", agregado: "graudo", local: "pilhaMan", lote: "Pilhas de brita 1 e de pó de pedra do canteiro",
            chkUmido: "sim", chkPontos: "sim", chkTabua: "sim", chkRed: "sim", chkEmb: "sim" },
          am: [Object.assign({ dmax: "25", nParc: "6", cam: "", mCampo: "180", mRem: "82", eDesc: "Brita 1 — amostra de pilha", eQtd: "82 kg (3 sacos)",
            eData: "15/07/2025, pilha 2 do canteiro, coord. do ponto P1 (GPS)" }, etq),
            Object.assign({ dmax: "4,75", nParc: "4", cam: "35", mCampo: "95", mRem: "44", eDesc: "Pó de pedra — amostra de pilha", eQtd: "44 kg (2 sacos)",
            eData: "15/07/2025, pilha 3 do canteiro, coord. do ponto P2 (GPS)" }, etq)] };
      } },
      { nome: "Areia em caminhão para dosagem de concreto — subáreas e massa insuficientes", dados: function () {
        return { ident: { registro: "EX-CA-002", data: "2025-09-22", obra: "Obra B", origem: "Fornecedor A", camada: "Areia para concreto" },
          params: { finalidade: "dosagem", dosagem: "m1", agregado: "miudo", local: "veiculo", veiculo: "int", lote: "Carga de 12 m³",
            chkUmido: "sim", chkMist: "sim", chkRed: "nao", chkEmb: "sim" },
          am: [{ dmax: "4,75", nParc: "4", nSub: "4", cam: "15", mCampo: "210", mRem: "160", eDesc: "Areia média lavada", eNat: "Areia natural quartzosa",
            eProc: "Fornecedor A", eQtd: "160 kg", eData: "22/09/2025, canteiro da Obra B", eResp: "", eFim: "Dosagem de concreto C30", eEmp: "", eRem: "Unidade B" }] };
      } },
    ],
  };
})();
