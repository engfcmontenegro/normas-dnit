/*
 * Ficha: DNIT 257/2021-PRO — Estudo e amostragem de rochas em pedreiras para fins rodoviários (registro e checklist).
 * Reconhecimento e situação legal (4.1 e 4.2), mapeamento geológico de superfície (4.3 a: raio de cerca de 1 km,
 * coordenadas com DATUM, curvas de nível de 1,0 m, fotos com escala, elementos mínimos por ocorrência) e de
 * subsuperfície (4.3 b: sondagens rotativas pela DNER-PRO 102, capa de estéril, volumes), relatório técnico,
 * amostragem por litotipo (5.1: ≥ 20 cm abaixo da superfície da rocha sã, cerca de 100 kg a 130 kg por litotipo,
 * amostra de punho para lâmina, etiqueta e número), análise petrográfica pela DNIT 435-PRO (5.2) e remessa (5.3).
 * Os ensaios tecnológicos das amostras não são fixados pela norma: a ficha só os registra (importados das fichas ME).
 * Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];
  var MAPA = [
    ["mLito", "4.3 a", "Litologia de cada tipo: composição mineral estimada, cor sã e alterada, grãos, textura, estruturas, fraturamento, nome e espessura explorável"],
    ["mContato", "4.3 a", "Relações de contato com as encaixantes e entre litotipos"],
    ["mAlter", "4.3 a", "Grau de alteração das rochas e perfis de solo (composição, espessura, textura)"],
    ["mCoer", "4.3 a", "Grau de coerência das rochas"],
    ["mDesc", "4.3 a", "Estruturas e descontinuidades medidas (persistência, rugosidade, abertura, preenchimento, espaçamento)"],
    ["mEsteril", "4.3 a", "Espessura e volume da capa de estéril"],
    ["mFotos", "4.3 a", "Registro fotográfico com elemento de escala"],
    ["mTopo", "4.3 a NOTA", "Levantamento topográfico da área explorável com curvas de nível de 1,0 m"],
  ];
  var RELAT = [
    ["rLegal", "Situação legal atualizada"], ["rLocal", "Localização e acesso"], ["rUnid", "Unidades geológicas, densidade de fraturas e feições estruturais (enfoque geotécnico)"],
    ["rCav", "Identificação de cavernas"], ["rMin", "Ocorrências minerais"], ["rAnexos", "Mapas, plantas, perfis e fotointerpretação aérea em anexo"],
  ];
  // fichas de ensaio de rocha / agregado que podem ser importadas (a norma não fixa os ensaios tecnológicos)
  var ORIGENS = ["dnit-435-2021-pro", "dnit-451-2024-me", "dner-me-197-97", "dner-me-096-98", "dner-me-399-99", "dner-me-400-99", "dner-me-397-99",
    "dner-me-081-98", "dnit-413-2021-me", "dnit-424-2020-me", "dnit-452-2024-me"];
  function codigo(id) {
    var p = id.split("-");
    return p[0] === "dner" ? "DNER-" + p[1].toUpperCase() + " " + p[2] + "/" + p[3] : "DNIT " + p[1] + "/" + p[2] + "-" + p[3].toUpperCase();
  }
  function resumo(id, r) {
    r = r || {};
    var O = FE.FICHAS[id];
    if (O && O.rotuloImportar) return O.rotuloImportar(r);
    if (id === "dner-me-197-97") return "esmagamento R = " + fmt(r.R, 1) + " %";
    if (id === "dner-me-096-98") return "10 % de finos = " + fmt(r.X, 1) + " kN";
    if (id === "dner-me-399-99") return "perda ao choque Treton = " + fmt(r.T, 1) + " %";
    if (id === "dner-me-400-99") return "desgaste após fervura P₁₀ = " + fmt(r.p10, 1) + " %";
    if (id === "dner-me-397-99") return "IDW = " + (ok(r.idw) ? r.idw : "—");
    if (id === "dner-me-081-98") return "densidade aparente " + fmt(r.dap, 3) + " · absorção " + fmt(r.abs, 2) + " %";
    if (id === "dnit-413-2021-me") return "MEsb " + fmt(r.mesb, 3) + " g/cm³ · absorção " + fmt(r.abs, 2) + " %";
    return "—";
  }

  FE.FICHAS["dnit-257-2021-pro"] = {
    titulo: "Rochas em pedreiras — Estudo geológico e amostragem (registro)",
    rotuloImportar: function (r) { return (r.nLito || 0) + " litotipo(s) · " + (r.nAm || 0) + " amostra(s) · " + fmt(r.massaTot, 0) + " kg"; },
    resumo: "Registro e checklist do estudo de pedreira: reconhecimento e situação legal (4.1 e 4.2), mapeamento geológico de superfície e subsuperfície (4.3), volumes de estéril e rocha, amostras por litotipo (≥ 20 cm abaixo da rocha sã, cerca de 100 kg a 130 kg por litotipo — 5.1), análise petrográfica (DNIT 435-PRO, 5.2) e remessa (5.3).",
    blocos: [],
    params: [
      { k: "situacao", r: "Situação da ocorrência", tipo: "select", opcoes: [["", "—"], ["virgem", "Pedreira virgem"], ["exploracao", "Pedreira em exploração"], ["paralisada", "Pedreira paralisada / abandonada"]] },
      { k: "restricoes", r: "Restrições à exploração (4.1)", ph: "áreas protegidas, zoneamento, distância ao consumo, acessos, logística" },
      { k: "anm", r: "Situação junto à ANM (4.2)", tipo: "select",
        opcoes: [["", "— não verificada"], ["dispensa", "Declaração de Dispensa de Título Minerário (uso exclusivo na obra)"], ["requerimento", "Processo em requerimento — bloqueio da área solicitado"],
          ["titulo", "Área com título — negociação direta com o detentor"], ["livre", "Área livre, sem processo"]] },
      { k: "ambiental", r: "Normas, estudos e licenças ambientais consultados (4.2)", tipo: "select", opcoes: SN },
      { k: "raio", r: "Raio mapeado em torno do indício (km)", ph: "≈ 1", dica: "cerca de 1 km (4.3 a)" },
      { k: "datum", r: "Coordenadas (preferencialmente UTM) — DATUM (4.3 a)", ph: "ex.: SIRGAS 2000, fuso 23S" },
      { k: "escala", r: "Escala do mapa-base / imagem", ph: "ex.: 1:5 000" },
      { k: "curvas", r: "Equidistância das curvas de nível (m)", ph: "1,0", dica: "1,0 m na área explorável (NOTA de 4.3 a)" },
    ].concat(MAPA.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN }; })).concat([
      { k: "furos", r: "Sondagens rotativas executadas (nº de furos, DNER-PRO 102)", dica: "descrição com grau de alteração, fraturas, coerência e resistência (4.3 b)" },
      { k: "geofisica", r: "Investigação geofísica integrada às sondagens (4.3 b)", tipo: "select", opcoes: [["", "—"], ["sim", "Sim"], ["nao", "Não realizada"]] },
      { k: "deleterios", r: "Minerais deletérios / reativos identificados (argilominerais expansivos, sílica amorfa) (4.3 b)", ph: "ex.: não identificados" },
      { k: "area", r: "Área explorável (m²)" },
      { k: "espEst", r: "Espessura média da capa de estéril (m)" },
      { k: "espRocha", r: "Espessura média de rocha explorável (m)" },
    ]).concat(RELAT.map(function (c) { return { k: c[0], r: "Relatório técnico contém: " + c[1] + " (4.3 b)", tipo: "select", opcoes: SN }; })).concat([
      { k: "ensaios", r: "Ensaios das amostras: importar das fichas de rocha e agregado (petrografia, abrasão, esmagamento, durabilidade...)", tipo: "importarVarios", de: ORIGENS,
        dica: "a DNIT 257 não fixa os ensaios tecnológicos; os limites vêm da especificação do serviço",
        aplicar: function (lista, P, d) {
          d.ens = lista.map(function (e) {
            var i = e.dados.ident || {};
            return { ensaio: codigo(e.ficha), reg: i.registro || "", lito: i.camada || (e.dados.params || {}).denominacao || i.origem || "", res: resumo(e.ficha, e.resultados), fid: e.ficha };
          });
          if (!d.ens.length) d.ens = [{}];
        } },
    ]),
    padrao: {},
    tabelas: function () {
      return [
        { chave: "am", titulo: "Amostras coletadas (5.1 e 5.3)", rotulo: "Amostra", iniciais: 3, min: 1,
          dica: "uma coluna por amostra; B = bloco de afloramento/frente, T = testemunho de sondagem",
          linhas: [
            { k: "etq", r: "Etiqueta / número", texto: true },
            { k: "lito", r: "Litotipo", texto: true },
            { k: "ponto", r: "Ponto / coordenadas", texto: true },
            { k: "tipo", r: "Tipo (B = bloco, T = testemunho)", texto: true, ph: "B" },
            { k: "prof", r: "Profundidade abaixo da superfície da rocha sã", u: "cm", ph: "≥ 20" },
            { k: "massa", r: "Massa da amostra", u: "kg" },
            { k: "lam", r: "Inclui amostra de punho para lâmina (S/N)", texto: true, ph: "S" },
            { k: "dest", r: "Destinação / ensaios previstos (5.3)", texto: true },
            { k: "pet", r: "Registro da análise petrográfica (DNIT 435)", texto: true },
          ] },
        { chave: "ens", titulo: "Ensaios realizados nas amostras", rotulo: "Ensaio", iniciais: 1, min: 1,
          dica: "preenchida pela importação ou à mão",
          linhas: [
            { k: "ensaio", r: "Método", texto: true }, { k: "reg", r: "Registro", texto: true },
            { k: "lito", r: "Litotipo / material", texto: true }, { k: "res", r: "Resultado", texto: true },
          ] },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      // reconhecimento e situação legal
      if (!P.anm) avisos.push("Verifique a situação legal da área junto à ANM (4.2).");
      if (P.ambiental === "nao") avisos.push("Consulte as normas ambientais, estudos e licenças vigentes na área (4.2).");
      var raio = num(P.raio), curvas = num(P.curvas);
      if (ok(raio) && raio < 0.8) avisos.push("Mapeamento de superfície num raio de " + fmt(raio, 2) + " km — a norma pede cerca de 1 km em torno do indício (4.3 a).");
      if (ok(curvas) && curvas > 1.0 + 1e-9) avisos.push("Curvas de nível a cada " + fmt(curvas, 1) + " m — a planta deve ter curvas espaçadas de 1,0 m (NOTA de 4.3 a).");
      if (!P.datum) avisos.push("Registre as coordenadas dos pontos com o DATUM (4.3 a).");
      MAPA.forEach(function (c) { if (P[c[0]] === "nao") avisos.push("Não atendido (" + c[1] + "): " + c[2] + "."); });
      RELAT.forEach(function (c) { if (P[c[0]] === "nao") avisos.push("O relatório técnico deve conter: " + c[1].toLowerCase() + " (4.3 b)."); });
      // volumes
      var A = num(P.area), eE = num(P.espEst), eR = num(P.espRocha);
      var vE = ok(A) && ok(eE) ? A * eE : NaN, vR = ok(A) && ok(eR) ? A * eR : NaN, rel = ok(vE) && ok(vR) && vR > 0 ? vE / vR : NaN;
      // amostras
      var litos = {}, ordem = [], nAm = 0, massaTot = 0;
      (d.am || []).forEach(function (x, i) {
        var rot = "Amostra " + (x.etq || i + 1), m = num(x.massa), pr = num(x.prof), tipo = String(x.tipo || "").trim().toUpperCase().charAt(0);
        var lito = String(x.lito || "").trim();
        if (!lito && !ok(m) && !x.etq) return;
        nAm++;
        if (!lito) avisos.push(rot + ": informe o litotipo.");
        if (!x.etq) avisos.push(rot + ": as amostras devem ser etiquetadas e numeradas (5.1 e 5.3).");
        if (tipo !== "T" && ok(pr) && pr < 20) avisos.push(rot + ": coletada a " + fmt(pr, 0) + " cm — retirar do interior do afloramento, no mínimo 20 cm abaixo da superfície da rocha sã (5.1).");
        if (tipo !== "T" && !ok(pr)) avisos.push(rot + ": registre a profundidade de coleta (≥ 20 cm abaixo da superfície da rocha sã, 5.1).");
        if (!x.dest) avisos.push(rot + ": indique a destinação (fins e ensaios) na identificação (5.3).");
        var k = lito || "(sem litotipo)";
        if (!litos[k]) { litos[k] = { nome: k, massa: 0, n: 0, lam: false, pet: [] }; ordem.push(k); }
        var L = litos[k];
        L.n++; if (ok(m)) { L.massa += m; massaTot += m; }
        if (/^s/i.test(String(x.lam || "").trim())) L.lam = true;
        if (x.pet) L.pet.push(x.pet);
      });
      // ensaios importados/registrados: petrografia por litotipo
      var ens = (d.ens || []).filter(function (e) { return e.ensaio || e.res; });
      ens.forEach(function (e) {
        if (!/435/.test(e.ensaio || "")) return;
        ordem.forEach(function (k) { if (e.lito && k && e.lito.toLowerCase().indexOf(k.toLowerCase()) >= 0 && litos[k].pet.indexOf(e.reg) < 0) litos[k].pet.push(e.reg || e.ensaio); });
      });
      var lista = ordem.map(function (k) {
        var L = litos[k];
        L.massaOk = L.massa >= 100 - 1e-9;
        if (!L.massaOk) avisos.push("Litotipo " + k + ": " + fmt(L.massa, 0) + " kg coletados — a quantidade mínima por litotipo é de cerca de 100 kg a 130 kg (5.1).");
        if (!L.lam) avisos.push("Litotipo " + k + ": falta amostra de, no mínimo, um punho cerrado para lâmina delgada e análise petrográfica (5.1).");
        if (!L.pet.length) avisos.push("Litotipo " + k + ": sem análise petrográfica registrada (5.2, DNIT 435-PRO).");
        return L;
      });
      var nLito = lista.length;
      return { tab: { am: [], ens: [] }, resultados: { lista: lista, nLito: nLito, nAm: nAm, massaTot: massaTot, vE: vE, vR: vR, rel: rel, nEns: ens.length,
        ens: ens.map(function (e) { return { ensaio: e.ensaio || "", reg: e.reg || "", lito: e.lito || "", res: e.res || "" }; }),
        mapaOk: MAPA.filter(function (c) { return P[c[0]] === "sim"; }).length, mapaTot: MAPA.length,
        relOk: RELAT.filter(function (c) { return P[c[0]] === "sim"; }).length, relTot: RELAT.length }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' + cx(r.nLito + " / " + r.nAm, "Litotipos / amostras · " + fmt(r.massaTot, 0) + " kg") +
        cx(r.mapaOk + " / " + r.mapaTot, "Itens do mapeamento de superfície confirmados (4.3 a)", true) +
        cx(r.relOk + " / " + r.relTot, "Itens do relatório técnico confirmados (4.3 b)", true) +
        cx(ok(r.rel) ? fmt(r.rel, 2) : "—", "Relação estéril / rocha (" + fmt(r.vE, 0) + " / " + fmt(r.vR, 0) + " m³)", true) + "</div>";
      if (r.lista.length) h += '<table class="fe-resumo"><tr><th>Litotipo</th><th>Amostras</th><th>Massa (kg)</th><th>≈ 100–130 kg</th><th>Lâmina</th><th>Petrografia</th></tr>' +
        r.lista.map(function (L) {
          return "<tr><td>" + esc(L.nome) + "</td><td>" + L.n + "</td><td>" + fmt(L.massa, 0) + "</td><td>" + (L.massaOk ? '<span class="fe-ok">sim</span>' : '<span class="fe-nok">não</span>') +
            "</td><td>" + (L.lam ? '<span class="fe-ok">sim</span>' : '<span class="fe-nok">não</span>') + "</td><td>" + (L.pet.length ? esc(L.pet.join(", ")) : '<span class="fe-nok">pendente</span>') + "</td></tr>";
        }).join("") + "</table>";
      if (r.ens.length) h += '<table class="fe-resumo" style="margin-top:6px"><tr><th>Método</th><th>Registro</th><th>Material</th><th>Resultado</th></tr>' +
        r.ens.map(function (e) { return "<tr><td>" + esc(e.ensaio) + "</td><td>" + esc(e.reg) + "</td><td>" + esc(e.lito) + "</td><td>" + esc(e.res) + "</td></tr>"; }).join("") + "</table>";
      return h;
    },
    relatorio: {
      notas: "Mapeamento de superfície num raio de cerca de 1 km em torno do indício, coordenadas (UTM, com DATUM), elementos mínimos por ocorrência e planta com curvas de nível de 1,0 m (4.3 a); subsuperfície por sondagens rotativas (DNER-PRO 102) e geofísica integradas (4.3 b). Amostras representativas de cada litologia, retiradas do interior dos afloramentos e no mínimo 20 cm abaixo da superfície da rocha sã (ou testemunhos de sondagem), cerca de 100 kg a 130 kg por litotipo (verificado como mínimo de 100 kg), com amostra de, no mínimo, um punho cerrado para lâmina, etiquetadas, numeradas e com destinação indicada (5.1 e 5.3); análise petrográfica pela DNIT 435-PRO (5.2). Os ensaios tecnológicos não são fixados pela norma: os resultados listados são informativos e os limites vêm da especificação do serviço. Relação estéril/rocha = (área × espessura de estéril) / (área × espessura de rocha explorável).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        var anm = { dispensa: "Declaração de Dispensa de Título Minerário", requerimento: "em requerimento — bloqueio solicitado", titulo: "com título — negociação direta", livre: "área livre" }[P.anm];
        rows.push(["Situação legal (4.2)", anm || "não verificada"]);
        if (P.restricoes) rows.push(["Restrições à exploração (4.1)", P.restricoes]);
        rows.push(["Mapeamento de superfície (4.3 a)", "raio " + (P.raio || "—") + " km · DATUM " + (P.datum || "—") + " · escala " + (P.escala || "—") + " · curvas " + (P.curvas || "—") + " m · " + r.mapaOk + " de " + r.mapaTot + " itens confirmados"]);
        rows.push(["Subsuperfície (4.3 b)", (P.furos || "0") + " furo(s) de sondagem rotativa · geofísica " + (P.geofisica === "sim" ? "sim" : "não") + (P.deleterios ? " · deletérios: " + P.deleterios : "")]);
        if (ok(r.vR)) rows.push(["Volumes estimados", "estéril " + fmt(r.vE, 0) + " m³ · rocha explorável " + fmt(r.vR, 0) + " m³ · relação estéril/rocha " + fmt(r.rel, 2)]);
        r.lista.forEach(function (L) { rows.push(["Litotipo " + L.nome, L.n + " amostra(s), " + fmt(L.massa, 0) + " kg" + (L.massaOk ? "" : " (ABAIXO de ~100 kg)") + " · lâmina " + (L.lam ? "sim" : "NÃO") + " · petrografia " + (L.pet.length ? L.pet.join(", ") : "PENDENTE")]); });
        r.ens.forEach(function (e) { rows.push([e.ensaio + (e.reg ? " — " + e.reg : ""), (e.lito ? e.lito + ": " : "") + e.res]); });
        rows.push(["Relatório técnico (4.3 b)", r.relOk + " de " + r.relTot + " itens confirmados"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Pedreira em exploração — 2 litotipos amostrados, com petrografia e abrasão importadas", dados: function () {
        var p = { situacao: "exploracao", restricoes: "sem áreas protegidas no entorno; acesso por estrada vicinal de 3 km", anm: "titulo", ambiental: "sim", raio: "1,0", datum: "SIRGAS 2000, UTM fuso 23S",
          escala: "1:2 000", curvas: "1,0", furos: "4", geofisica: "nao", deleterios: "não identificados", area: "18000", espEst: "2,5", espRocha: "22" };
        MAPA.concat(RELAT).forEach(function (c) { p[c[0]] = "sim"; });
        p.ensaios = ["ex:dnit-435-2021-pro:0", "ex:dnit-451-2024-me:0"];
        return { ident: { registro: "EX-PD-001", obra: "Obra A", origem: "Pedreira X", local: "Frente 1", data: "2025-06-18" }, params: p,
          am: [{ etq: "PX-01", lito: "Granito", ponto: "P1 — frente 1", tipo: "B", prof: "35", massa: "65", lam: "S", dest: "petrografia, abrasão LA, esmagamento", pet: "" },
            { etq: "PX-02", lito: "Granito", ponto: "P2 — frente 1", tipo: "B", prof: "30", massa: "55", lam: "N", dest: "durabilidade, adesividade" },
            { etq: "PX-03", lito: "Diabásio", ponto: "SR-02, 12,0 a 14,5 m", tipo: "T", massa: "110", lam: "S", dest: "petrografia, abrasão LA", pet: "EX-PT-003" }],
          ens: [{ ensaio: "DNIT 435/2021-PRO", reg: "EX-PT-001", lito: "Granito", res: "Biotita granito · IA — Rocha sã · C1 — Muito coerente" },
            { ensaio: "DNIT 451/2024-ME", reg: "EX-LA-001", lito: "Granito", res: "LA 42 % (graduação C)" }] };
      } },
      { nome: "Pedreira virgem — amostra superficial, massa insuficiente e itens pendentes", dados: function () {
        return { ident: { registro: "EX-PD-002", obra: "Obra B", origem: "Pedreira Z", data: "2025-10-09" },
          params: { situacao: "virgem", anm: "", ambiental: "nao", raio: "0,5", curvas: "5", mLito: "sim", mContato: "sim", mAlter: "nao", mCoer: "sim", mDesc: "nao", mEsteril: "nao", mFotos: "sim", mTopo: "nao",
            furos: "0", area: "9000", espEst: "6", espRocha: "10", rLegal: "nao" },
          am: [{ etq: "PZ-01", lito: "Gnaisse", ponto: "afloramento A", tipo: "B", prof: "5", massa: "40", lam: "S" }, { lito: "Gnaisse", tipo: "B", prof: "25", massa: "35", lam: "N", dest: "abrasão LA" }],
          ens: [{}] };
      } },
    ],
  };
})();
