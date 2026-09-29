/*
 * Ficha: DNIT 171/2016-PRO — Calibração dos sensores (geofones) do deflectógrafo Curviâmetro.
 * Registra-se em window.FE (usa FE.aceitacao para critérios e parecer).
 *
 * O que a PRO manda (seções do PDF):
 *   5       antes de cada jornada e sempre que houver variação considerável das condições climáticas.
 *   5.1     motor do caminhão desligado, gerador ligado; corrente e geofones como no levantamento; calibrador alinhado
 *           com a corrente, à frente do eixo traseiro, nivelado (bolha) e conectado; geofone 1 sobre o impulsor, livre.
 *   5.2 c–g simulador energizado (LEDs +15 V/−15 V); chave de sincronização no geofone; "Tamaño" = Pequeno; ajuste
 *           "DMOD" até a sintonia 0,000 do geofone.
 *   5.2 i–j gráfico do geofone bem definido e curvas (aceleração, velocidade, deflexão) do geofone coincidentes com as
 *           do calibrador; repetir "Calibrar" até coincidir; não coincidindo, trocar geofone e/ou modulador.
 *   5.2 k   A1 = 2,5 (± 1,5); A2 = 10,5 (± 1,5); A3 = 0,80 (± 1,5) — fora: verificar conexões, trocar moduladores/geofones.
 *   5.2 l   repetir para os geofones 2 e 3.
 * Observação: a tolerância de A3 (± 1,5 sobre 0,80) admite valores negativos (−0,70 a 2,30); a ficha aplica o texto.
 * Sintonia "0,000": a ficha exige |DMOD| < 0,0005 (valor mostrado com três casas).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dnit-171-2016-pro";
  var TOL = [["a1", "A1", 2.5, 1.5], ["a2", "A2", 10.5, 1.5], ["a3", "A3", 0.80, 1.5]];
  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];
  var CHECK = [["motor", "5.1 a", "Caminhão em local plano, motor desligado"], ["gerador", "5.1 b", "Gerador interno ligado (computação e calibrador)"],
    ["corrente", "5.1 c", "Corrente e geofones posicionados como no levantamento"], ["nivel", "5.1 d", "Calibrador alinhado com a corrente, à frente do eixo traseiro, nivelado e conectado"],
    ["impulsor", "5.1 e", "Geofone sobre o impulsor, livre para mover-se na vertical"], ["leds", "5.2 c", "Simulador energizado (LEDs vermelhos +15 V/−15 V acesos)"],
    ["tamano", "5.2 e", "\"Tamaño\" ajustado em \"Pequeno\""]];
  function sim(v) { return /^s/i.test(String(v || "").trim()); }
  function nao(v) { return /^n/i.test(String(v || "").trim()); }

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [], tab = [], feitos = 0;
    var G0 = "Posicionamento e preparação (5.1 / 5.2 c–e)", G1 = "Calibração dos geofones (5.2 f–l)";
    CHECK.forEach(function (c) {
      var v = P[c[0]], l = A.linha({ id: c[0], grupo: G0, criterio: c[2], secao: c[1], exigido: "sim", resultado: v === "sim" ? "sim" : v === "nao" ? "não" : "—", n: v ? 1 : 0 });
      if (v === "nao") A.marcar(l, "nao_conforme", "não atende"); else if (v !== "sim") A.marcar(l, "pendente", "não verificado");
      linhas.push(l);
    });
    (d.gf || []).forEach(function (c, i) {
      var o = {}, dm = num(c.dmod), vals = TOL.map(function (t) { return num(c[t[0]]); });
      TOL.forEach(function (t, j) { o["e" + t[0]] = ok(vals[j]) ? vals[j] - t[2] : NaN; });
      tab.push(o);
      if (!vals.some(ok) && !ok(dm) && !c.graf) return;
      feitos++;
      var l = A.linha({ id: "g" + i, grupo: G1, criterio: "Geofone " + (i + 1), secao: "5.2 g / i / k", n: vals.filter(ok).length,
        exigido: "DMOD 0,000; curvas coincidentes; A1 2,5 ± 1,5; A2 10,5 ± 1,5; A3 0,80 ± 1,5",
        resultado: "DMOD " + (ok(dm) ? fmt(dm, 3) : "—") + " · " + TOL.map(function (t, j) { return t[1] + " = " + (ok(vals[j]) ? fmt(vals[j], 2) : "—"); }).join(" · ") +
          (c.n ? " · " + c.n + " calibração(ões)" : "") });
      if (!ok(dm)) A.marcar(l, "pendente", "registre a sintonia DMOD");
      else if (Math.abs(dm) >= 0.0005) A.marcar(l, "nao_conforme", "sintonia DMOD " + fmt(dm, 3) + " ≠ 0,000 (5.2 g)");
      if (nao(c.graf)) A.marcar(l, "nao_conforme", "curvas do geofone não coincidem com as do calibrador: substituir geofone e/ou modulador (5.2 j)");
      else if (!sim(c.graf)) A.marcar(l, "pendente", "confirme a coincidência das curvas (5.2 i)");
      var fora = TOL.filter(function (t, j) { return ok(vals[j]) && Math.abs(vals[j] - t[2]) > t[3] + 1e-9; });
      if (fora.length) A.marcar(l, "nao_conforme", fora.map(function (t) { return t[1] + " fora de " + fmt(t[2], 2) + " ± " + fmt(t[3], 1); }).join("; ") + " — verificar conexões da corrente, trocar moduladores e/ou geofones (5.2 k)");
      if (vals.some(function (v) { return !ok(v); })) A.marcar(l, "pendente", "registre A1, A2 e A3");
      linhas.push(l);
    });
    if (feitos < 3) {
      var ln = A.linha({ id: "n", grupo: G1, criterio: "Geofones calibrados", secao: "5.2 l", exigido: "3 (geofones 1, 2 e 3)", resultado: feitos + " de 3", n: feitos });
      A.marcar(ln, feitos ? "pendente" : "sem_dados", "calibre os três geofones");
      linhas.push(ln);
    }
    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "CURVIÂMETRO CALIBRADO — PRONTO PARA O LEVANTAMENTO", texto: "Três geofones calibrados dentro das tolerâncias da DNIT 171/2016-PRO (5.2 m)." },
      RESSALVA: { titulo: "CURVIÂMETRO CALIBRADO COM RESSALVA", texto: "Tolerâncias atendidas; há pontos a documentar." },
      PENDENTE: { titulo: "CALIBRAÇÃO INCOMPLETA", texto: "Faltam geofones ou registros." },
      REJEITADO: { titulo: "CALIBRAÇÃO NÃO ACEITA", texto: "Sensor fora da tolerância ou preparação não conforme: verificar conexões, trocar modulador/geofone e calibrar de novo." } } });
    return { tab: { gf: tab }, resultados: { linhas: linhas, parecer: par, feitos: feitos }, avisos: avisos };
  }

  FE.FICHAS[ID] = {
    titulo: "Calibração dos sensores do Curviâmetro",
    lote: true,
    resumo: "Registro da calibração dos três geofones com o calibrador portátil: preparação (5.1), sintonia DMOD 0,000, coincidência das curvas geofone × calibrador e tolerâncias A1 = 2,5 ± 1,5, A2 = 10,5 ± 1,5, A3 = 0,80 ± 1,5 (5.2 k), antes de cada jornada.",
    rotuloImportar: function (r) { return r.parecer ? (r.parecer.parecer === "ACEITO" || r.parecer.parecer === "RESSALVA" ? "calibrado" : r.parecer.parecer.toLowerCase()) : "—"; },
    blocos: [],
    params: [
      { k: "equip", r: "Curviâmetro (identificação)", ph: "ex.: Curviâmetro A" },
      { k: "motivo", r: "Motivo", tipo: "select", opcoes: [["jornada", "Início da jornada de trabalho (5)"], ["clima", "Variação considerável das condições climáticas (5)"], ["troca", "Após troca de geofone/modulador (5.2 j/k)"]] },
      { k: "tecA", r: "Técnico A (cabine)" }, { k: "tecB", r: "Técnico B (pista)" },
    ].concat(CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN }; })),
    padrao: { motivo: "jornada" },
    tabelas: function () {
      return [{ chave: "gf", titulo: "Geofones (5.2 f–l)", rotulo: "Geofone", iniciais: 3, min: 3, fixo: true, nomes: ["Geofone 1", "Geofone 2", "Geofone 3"],
        dica: "valores da tela de calibração (Anexo D, Foto 8)",
        linhas: [{ k: "dmod", r: "Sintonia DMOD após o ajuste (5.2 g)", u: "", ph: "0,000" }, { k: "n", r: "Nº de vezes que \"Calibrar\" foi acionado (5.2 j)", u: "" },
          { k: "graf", r: "Curvas do geofone coincidem com as do calibrador? (S/N) (5.2 i)", texto: true },
          { k: "a1", r: "A1 (2,5 ± 1,5)", u: "" }, { k: "a2", r: "A2 (10,5 ± 1,5)", u: "" }, { k: "a3", r: "A3 (0,80 ± 1,5)", u: "" },
          { calc: "ea1", r: "A1 − 2,5", u: "", casas: 2 }, { calc: "ea2", r: "A2 − 10,5", u: "", casas: 2 }, { calc: "ea3", r: "A3 − 0,80", u: "", casas: 2 }] }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer) + A.htmlCriterios(r.linhas, { estilo: "resultado" }); },
    relatorio: {
      notas: "DNIT 171/2016-PRO, 5.2 k: A1 = 2,5 (± 1,5); A2 = 10,5 (± 1,5); A3 = 0,80 (± 1,5) — tolerâncias aplicadas como escritas (A3 admite de −0,70 a 2,30). Sintonia DMOD 0,000 (5.2 g) conferida como |DMOD| < 0,0005.",
      resultados: function (calc, d) { return [["Parecer", calc.resultados.parecer.titulo], ["Equipamento", (d.params || {}).equip || "—"], ["Geofones calibrados", calc.resultados.feitos + " de 3"]]; },
      extraHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer, { relat: true }) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" }); },
    },
    exemplos: [
      { nome: "Início da jornada — geofone 1 com os valores da Foto 8 do Anexo D (A1 2,70; A2 11,25; A3 0,87)", dados: function () {
        var P = { equip: "Curviâmetro A", motivo: "jornada", tecA: "Técnico A", tecB: "Técnico B" };
        CHECK.forEach(function (c) { P[c[0]] = "sim"; });
        return { ident: { registro: "CAL-CV-01", data: "2026-09-01", obra: "Obra A", trecho: "BR-000 — km 500 a 540" }, params: P,
          gf: [{ dmod: "0,000", n: "1", graf: "S", a1: "2,70", a2: "11,25", a3: "0,87" }, { dmod: "0,000", n: "2", graf: "S", a1: "2,41", a2: "10,62", a3: "0,79" },
            { dmod: "0,000", n: "1", graf: "S", a1: "2,95", a2: "10,18", a3: "0,93" }] };
      } },
      { nome: "Após chuva — geofone 3 com A2 fora e curvas sem coincidir", dados: function () {
        var P = { equip: "Curviâmetro A", motivo: "clima" };
        CHECK.forEach(function (c) { P[c[0]] = "sim"; });
        P.nivel = "";
        return { ident: { registro: "CAL-CV-02", data: "2026-09-03", obra: "Obra A" }, params: P,
          gf: [{ dmod: "0,000", n: "1", graf: "S", a1: "2,62", a2: "10,90", a3: "0,84" }, { dmod: "0,021", n: "1", graf: "S", a1: "2,38", a2: "10,41", a3: "0,77" },
            { dmod: "0,000", n: "4", graf: "N", a1: "4,30", a2: "12,60", a3: "1,10" }] };
      } },
    ],
  };
})();
