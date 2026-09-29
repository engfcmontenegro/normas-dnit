/*
 * Ficha: DNIT 380/2022-PRO — Utilização de geossintéticos em aterros sobre solos moles para obras viárias.
 * Resistência à tração de projeto do reforço (5.1.3): T_ref = T_max / FR_fl (eq. 3, sem ensaios de fluência),
 * T_disp = T_ref / (FR_dm · FR_amb) (eq. 2), T_proj = T_disp / FS (eq. 1, FS ≥ 1,2), com os valores mínimos de
 * FR_fl (Tabela A1), FR_dm de geotêxteis (Tabela A2) e de geogrelhas (Tabela A3) e FR_amb ≥ 1,10 (5.1.3.1 d), comparada
 * com o esforço de tração requerido pela análise de estabilidade (DNIT 381); rigidez requerida J = T / ε de
 * compatibilidade (5.1.4); condições geométricas e do reforço de aterros sobre estacas (5.3.5), colunas encamisadas
 * (5.4), lançamento do aterro e instalação (6.4 a 6.5), plano de instalação (7) e acompanhamento técnico (8).
 * Usa FE.aceitacao para critérios e parecer. Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dnit-380-2022-pro";
  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];
  // Tabela A1 — FR_fl mínimo por polímero (sem ensaios de fluência)
  var FRFL = { PVA: 2.0, PA: 2.2, PET: 2.2, PE: 4.0, PP: 4.5 };
  var ATERROS = [["pedras", "Pedras (grão máx. < 200 mm)"], ["pedregulhos", "Pedregulhos (< 100 mm)"], ["areias", "Areias (< 4 mm na Tabela A2; < 2 mm na A3)"], ["finos", "Siltes e argilas (< 0,06 mm)"]];
  // Tabela A2 — geotêxteis: [140 < MA ≤ 200, 200 < MA ≤ 400, MA > 400 g/m²]
  var FRDM_GT = { pedras: [1.50, 1.45, 1.40], pedregulhos: [1.35, 1.30, 1.25], areias: [1.30, 1.25, 1.20], finos: [1.20, 1.15, 1.10] };
  // Tabela A3 — geogrelhas: faixas [mín, máx] para T_max ≤ 50 kN/m e > 50 kN/m
  var FRDM_GG = { pedras: [[1.20, 1.70], [1.10, 1.50]], pedregulhos: [[1.15, 1.50], [1.15, 1.25]], areias: [[1.10, 1.25], [1.05, 1.20]], finos: [[1.05, 1.15], [1.05, 1.10]] };
  var APL = [["base", "Reforço de base de aterro (5.1)"], ["estacas", "Aterro sobre estacas (5.3)"], ["colunas", "Colunas granulares encamisadas (5.4)"]];
  var ATO = [["a8a", "a) identificação do geossintético (ABNT NBR ISO 10320)"], ["a8b", "b) conformidade: amostras e ensaios de laboratório"], ["a8c", "c) preparo do solo-base"],
    ["a8d", "d) orientação e disposição das mantas"], ["a8e", "e) qualidade das uniões"], ["a8f", "f) posicionamento das mantas / ancoragem"], ["a8g", "g) integridade das mantas"], ["a8h", "h) lançamento de materiais"]];
  var PLANO = [["p7a", "a) disposição das mantas (direção, sentido, ordem)"], ["p7b", "b) tipo de união (sobreposição: comprimento, direção, fixação)"], ["p7c", "c) preparo do solo-base, sobrelarguras, engastes, lançamento, estocagem"]];
  function P_(d) { return d.params || {}; }
  function apl(d) { return P_(d).aplicacao || "base"; }
  function polimero(s) { var m = String(s || "").toUpperCase().match(/PVA|PET|PA|PE|PP/); return m ? m[0] : ""; }
  function produto(s) { var t = String(s || "").toLowerCase(); return /grelha|^gg/.test(t) ? "GG" : /t[êe]xtil|^gt/.test(t) ? "GT" : /c[ée]lula/.test(t) ? "GC" : /comp/.test(t) ? "GCO" : ""; }

  function reforcos(d) {
    var P = P_(d), at = P.aterro || "areias";
    return (d.ref || []).map(function (x) {
      var o = { nome: x.nome || "", prod: produto(x.prod), prodTxt: x.prod || "", pol: polimero(x.pol), MA: num(x.MA), Tmax: num(x.Tmax), TrefE: num(x.TrefE),
        FRfl: num(x.FRfl), FRdm: num(x.FRdm), FRamb: num(x.FRamb), FS: num(x.FS), Treq: num(x.Treq), J: num(x.J), eps: num(x.eps), erup: num(x.erup), adot: [] };
      // valores adotados quando em branco (mínimos da norma)
      o.frflMin = FRFL[o.pol];
      if (!ok(o.TrefE) && !ok(o.FRfl) && ok(o.frflMin)) { o.FRfl = o.frflMin; o.adot.push("FR_fl = " + fmt(o.frflMin, 1) + " (Tabela A1)"); }
      if (o.prod === "GT") {
        var col = !ok(o.MA) ? -1 : o.MA > 400 ? 2 : o.MA > 200 ? 1 : o.MA > 140 ? 0 : -1;
        o.frdmMin = col >= 0 ? FRDM_GT[at][col] : NaN;
        o.frdmTxt = col >= 0 ? "≥ " + fmt(o.frdmMin, 2) + " (Tabela A2)" : ok(o.MA) ? "M_A ≤ 140 g/m² fora da Tabela A2" : "informe M_A (Tabela A2)";
      } else if (o.prod === "GG") {
        var fx = ok(o.Tmax) ? FRDM_GG[at][o.Tmax > 50 ? 1 : 0] : null;
        o.frdmMin = fx ? fx[0] : NaN; o.frdmMax = fx ? fx[1] : NaN;
        o.frdmTxt = fx ? fmt(fx[0], 2) + " a " + fmt(fx[1], 2) + " (Tabela A3; maior severidade → maior valor)" : "informe T_max (Tabela A3)";
      } else { o.frdmMin = NaN; o.frdmTxt = "valor do fabricante (NOTA 1) — tabelas só para geotêxteis e geogrelhas"; }
      if (!ok(o.FRdm)) {
        var ad = o.prod === "GG" ? o.frdmMax : o.frdmMin;
        if (ok(ad)) { o.FRdm = ad; o.adot.push("FR_dm = " + fmt(ad, 2) + (o.prod === "GG" ? " (limite superior da Tabela A3)" : " (Tabela A2)")); }
      }
      if (!ok(o.FRamb)) { o.FRamb = 1.10; o.adot.push("FR_amb = 1,10 (mínimo, 5.1.3.1 d)"); }
      if (!ok(o.FS)) { o.FS = 1.2; o.adot.push("FS = 1,2 (mínimo, eq. 1)"); }
      o.Tref = ok(o.TrefE) ? o.TrefE : ok(o.Tmax) && ok(o.FRfl) && o.FRfl > 0 ? o.Tmax / o.FRfl : NaN;       // eq. 3
      o.Tdisp = ok(o.Tref) && ok(o.FRdm) && ok(o.FRamb) ? o.Tref / (o.FRdm * o.FRamb) : NaN;                    // eq. 2
      o.Tproj = ok(o.Tdisp) && ok(o.FS) && o.FS > 0 ? o.Tdisp / o.FS : NaN;                                     // eq. 1
      o.FRtot = ok(o.Tmax) && ok(o.Tproj) && o.Tproj > 0 ? o.Tmax / o.Tproj : NaN;
      o.razao = ok(o.Tproj) && ok(o.Treq) && o.Treq > 0 ? o.Tproj / o.Treq : NaN;
      o.Jreq = ok(o.Treq) && ok(o.eps) && o.eps > 0 ? o.Treq / (o.eps / 100) : NaN;                            // 5.1.4
      return o;
    });
  }

  function calcular(d) {
    var P = P_(d), ap = apl(d), avisos = [], L = [], rs = reforcos(d).filter(function (o) { return o.nome || ok(o.Tmax) || ok(o.TrefE); });
    var G1 = "Resistência à tração de projeto (5.1.3; Anexo A)", G2 = "Rigidez (5.1.4)", G3 = ap === "estacas" ? "Aterro sobre estacas (5.3.5)" : ap === "colunas" ? "Colunas encamisadas (5.4)" : "Reforço de base (5.1.5)",
      G4 = "Instalação (6)", G5 = "Plano de instalação (7) e ATO (8)";
    if (!rs.length) L.push(A.linha({ grupo: G1, criterio: "Reforço geossintético", secao: "5.1.3", situacao: "sem_dados", motivo: "cadastre ao menos um reforço" }));
    rs.forEach(function (o, i) {
      var nm = o.nome || "Reforço " + (i + 1);
      if (ap !== "colunas") {
        var lt = A.linha({ grupo: G1, criterio: nm + ": T_proj ≥ T requerida", secao: "eq. 1 a 3", exigido: ok(o.Treq) ? "≥ " + fmt(o.Treq, 1) + " kN/m" : "T requerida (análise de estabilidade)",
          resultado: "T_proj = " + fmt(o.Tproj, 1) + " kN/m" + (ok(o.razao) ? " (" + fmt(o.razao, 2) + " × T req.)" : "") });
        if (!ok(o.Tproj)) A.marcar(lt, "sem_dados", "informe T_max e o polímero (ou T_ref de ensaio de fluência)");
        else if (!ok(o.Treq)) A.marcar(lt, "pendente", "informe o esforço de tração requerido pela análise de estabilidade (DNIT 381; 5.1.5)");
        else if (o.Tproj < o.Treq) A.marcar(lt, "nao_conforme", "resistência de projeto insuficiente: " + fmt(o.Tproj, 1) + " < " + fmt(o.Treq, 1) + " kN/m");
        L.push(lt);
      }
      // fatores
      var lf = A.linha({ grupo: G1, criterio: nm + ": fatores de redução e FS", secao: "5.1.3; Tabelas A1 a A3",
        exigido: "FR_fl ≥ Tab. A1" + (ok(o.frflMin) ? " (" + fmt(o.frflMin, 1) + ")" : "") + "; FR_dm " + o.frdmTxt + "; FR_amb ≥ 1,10; FS ≥ 1,2",
        resultado: (ok(o.TrefE) ? "T_ref de ensaio " + fmt(o.TrefE, 1) : "FR_fl " + fmt(o.FRfl, 2)) + " · FR_dm " + fmt(o.FRdm, 2) + " · FR_amb " + fmt(o.FRamb, 2) + " · FS " + fmt(o.FS, 2) });
      if (o.adot.length) lf.resultado += " · adotado: " + o.adot.join("; ");
      if (!ok(o.TrefE)) {
        if (!o.pol) A.marcar(lf, "pendente", "informe o polímero (PVA, PA, PET, PE, PP) para a Tabela A1");
        else if (o.FRfl < o.frflMin - 1e-9) A.marcar(lf, "nao_conforme", "FR_fl " + fmt(o.FRfl, 2) + " < mínimo " + fmt(o.frflMin, 1) + " para " + o.pol + " sem ensaios de fluência (Tabela A1)");
      }
      if (ok(o.frdmMin) && ok(o.FRdm) && o.FRdm < o.frdmMin - 1e-9) A.marcar(lf, "nao_conforme", "FR_dm " + fmt(o.FRdm, 2) + " abaixo do mínimo " + fmt(o.frdmMin, 2) + " (" + (o.prod === "GG" ? "Tabela A3" : "Tabela A2") + ")");
      if (o.prod === "GT" && ok(o.MA) && o.MA <= 140) A.marcar(lf, "pendente", "M_A ≤ 140 g/m²: a Tabela A2 não fornece FR_dm — use valor de fabricante (NOTA 1)");
      if (!o.prod) A.marcar(lf, "ressalva", "FR_dm de produto sem tabela: valor do fabricante com confiabilidade > 95 % (NOTA 1)");
      if (ok(o.FRamb) && o.FRamb < 1.10 - 1e-9) A.marcar(lf, "nao_conforme", "FR_amb mínimo 1,10 (5.1.3.1 d)");
      if (ok(o.FS) && o.FS < 1.2 - 1e-9) A.marcar(lf, "nao_conforme", "FS mínimo 1,2 (eq. 1)");
      L.push(lf);
      // rigidez
      if (ok(o.Jreq) || ok(o.J)) {
        var lj = A.linha({ grupo: G2, criterio: nm + ": rigidez à tração J", secao: ap === "colunas" ? "5.4.1 a" : "5.1.4",
          exigido: ap === "colunas" ? "tipicamente > 700 kN/m" : ok(o.Jreq) ? "≥ T req. / ε compatib. = " + fmt(o.Jreq, 0) + " kN/m (tipicamente ≥ 800)" : "tipicamente ≥ 800 kN/m (J2% ou J5%)",
          resultado: ok(o.J) ? fmt(o.J, 0) + " kN/m" : "—" });
        if (!ok(o.J)) A.marcar(lj, "pendente", "informe J (J2% ou J5%, faixa larga)");
        else if (ok(o.Jreq) && o.J < o.Jreq) A.marcar(lj, "nao_conforme", "J insuficiente para mobilizar a força estabilizadora na deformação de compatibilidade");
        else if (ap === "colunas" && o.J <= 700) A.marcar(lj, "ressalva", "abaixo do valor típico de 700 kN/m (5.4.1 a)");
        else if (ap !== "colunas" && o.J < 800) A.marcar(lj, "ressalva", "abaixo do valor típico de 800 kN/m (5.1.4) — justificar");
        L.push(lj);
      }
      if (ap === "estacas") {
        var le = A.linha({ grupo: G3, criterio: nm + ": resistência de dimensionamento e deformação na ruptura", secao: "5.3.5 e", exigido: "≥ 30 kN/m e ε_rup ≤ 12 %",
          resultado: fmt(o.Tproj, 1) + " kN/m · ε_rup " + (ok(o.erup) ? fmt(o.erup, 1) + " %" : "—") });
        if (ok(o.Tproj) && o.Tproj < 30) A.marcar(le, "nao_conforme", "resistência de dimensionamento < 30 kN/m");
        if (!ok(o.erup)) A.marcar(le, "pendente", "informe a deformação na ruptura"); else if (o.erup > 12) A.marcar(le, "nao_conforme", "deformação na ruptura > 12 %");
        L.push(le);
      }
      if (ap === "colunas" && o.pol && o.pol !== "PVA" && o.pol !== "PET") avisos.push(nm + ": colunas encamisadas usam geotêxteis de PVA ou PET (5.4.2).");
      if (ap !== "colunas" && /n[ãa]o.?tecido/i.test(o.prodTxt)) avisos.push(nm + ": geotêxteis não tecidos típicos não têm resistência e rigidez suficientes para reforço (5.1.5).");
    });
    // aplicação
    var B = num(P.B), D = num(P.Dmole), su = num(P.su);
    if (ap === "base") {
      if (ok(B) && ok(D) && D > 0.7 * B) avisos.push("Camada mole com espessura " + fmt(D, 1) + " m > 0,7 B = " + fmt(0.7 * B, 1) + " m: influência do reforço na estabilidade tende a ser pouco significativa (5.1.5).");
      var lem = A.linha({ grupo: G3, criterio: "Sem emendas ao longo do eixo longitudinal nem perpendiculares à direção mais solicitada", secao: "5.1.5; Figura B3", exigido: "sim",
        resultado: P.emendas === "sim" ? "atende" : P.emendas === "nao" ? "há emendas vedadas" : "—" });
      if (P.emendas === "nao") A.marcar(lem, "nao_conforme", "emenda em direção vedada"); else if (P.emendas !== "sim") A.marcar(lem, "pendente", "informe");
      L.push(lem);
      var lx = A.linha({ grupo: G3, criterio: "Verificações de ruptura dentro do aterro e de expulsão do solo mole", secao: "5.1.5", exigido: "analisadas",
        resultado: P.expulsao === "sim" ? "analisadas" : P.expulsao === "nao" ? "não analisadas" : "—" });
      if (P.expulsao === "nao") A.marcar(lx, "nao_conforme", "devem ser analisadas"); else if (P.expulsao !== "sim") A.marcar(lx, "pendente", "informe");
      L.push(lx);
    }
    if (ap === "estacas") {
      var s = num(P.s), dd = num(P.dEst), ac = num(P.capitel), sx = num(P.sx), sy = num(P.sy), h = num(P.hAt), hg = num(P.hGr), mov = P.cargas === "moveis";
      if (!ok(dd) && ok(ac)) dd = Math.sqrt(4 * ac * ac / Math.PI);          // diâmetro equivalente do capitel quadrado
      if (!ok(s) && ok(sx) && ok(sy)) s = Math.max(sx, sy);
      var vao = ok(s) && ok(dd) ? s - dd : NaN;
      function geo(crit, sec, val, cond, exig, casas) {
        var l = A.linha({ grupo: G3, criterio: crit, secao: sec, exigido: exig, resultado: ok(val) ? fmt(val, casas === undefined ? 2 : casas) : "—" });
        if (!ok(val)) A.marcar(l, "pendente", "informe a geometria"); else if (!cond(val)) A.marcar(l, "nao_conforme", "não atende");
        L.push(l);
      }
      geo("s − d" + (mov ? " (elevadas cargas móveis)" : " (cargas estáticas)"), "5.3.5 " + (mov ? "b" : "a"), vao, function (v) { return v <= (mov ? 2.5 : 3) + 1e-9; }, "≤ " + (mov ? "2,5" : "3") + " m");
      geo("d/s", "5.3.5 c", ok(s) && ok(dd) ? dd / s : NaN, function (v) { return v >= 0.15 - 1e-9; }, "≥ 0,15");
      geo("h/(s − d)", "5.3.5 " + (mov ? "d, f" : "d"), ok(h) && ok(vao) && vao > 0 ? h / vao : NaN, function (v) { return v > (mov ? 2 : 0.8); }, "> " + (mov ? "2" : "0,8"));
      geo("h* (material granular acima do capitel) − (s − d)", "5.3.5 e", ok(hg) && ok(vao) ? hg - vao : NaN, function (v) { return v >= -1e-9; }, "h* ≥ s − d");
      geo("sx/sy", "5.3.5 g", ok(sx) && ok(sy) && sy > 0 ? sx / sy : NaN, function (v) { return v > 0.5 && v < 2; }, "0,5 < sx/sy < 2,0");
      var kr = num(P.ksRel);
      if (P.soloMole === "sim") geo("k_s,p / k_s,w (estaca / solo mole)", "5.3.5", kr, function (v) { return v > 75; }, "> 75", 0);
      var nc = num(P.nCam), z = num(P.z), ec = num(P.espCam);
      geo("Nº de camadas de reforço", "5.3.5 a", nc, function (v) { return v <= 2; }, "≤ 2", 0);
      geo("z — distância do reforço inferior ao topo da estaca/capitel", "5.3.5 " + (nc === 2 ? "c" : "b"), z, function (v) { return v <= (nc === 2 ? 0.3 : 0.15) + 1e-9; }, "≤ " + (nc === 2 ? "0,30" : "0,15") + " m");
      if (nc === 2) geo("Espaçamento entre as duas camadas", "5.3.5 d", ec, function (v) { return v >= 0.15 - 1e-9 && v <= 0.30 + 1e-9; }, "0,15 a 0,30 m");
      var e0 = num(P.eIni), ef = num(P.eFl), es = num(P.eServ);
      geo("Deformação de tração máxima inicial no reforço", "5.3.5", e0, function (v) { return v <= 5 + 1e-9; }, "≤ 5 %", 1);
      geo("Deformação adicional por fluência na vida útil", "5.3.5", ef, function (v) { return v < 2; }, "< 2 %", 1);
      if (P.incerteza === "sim") geo("Deformação máxima de serviço (incertezas na superfície)", "5.3.5", es, function (v) { return v <= 3 + 1e-9; }, "≤ 3 %", 1);
      var ls = num(P.sobrep);
      if (ok(ls) && ok(dd)) { var lso = A.linha({ grupo: G3, criterio: "Sobreposição (só sobre estacas, direção secundária)", secao: "5.3.5 f", exigido: "≥ d = " + fmt(dd, 2) + " m", resultado: fmt(ls, 2) + " m" }); if (ls < dd) A.marcar(lso, "nao_conforme", "comprimento de sobreposição menor que d"); L.push(lso); }
    }
    if (ap === "colunas") {
      var dc = num(P.dCol);
      if (ok(dc) && (dc < 0.5 || dc > 1.5)) avisos.push("Diâmetro de " + fmt(dc, 2) + " m fora dos usuais 0,5 m a 1,5 m (5.4.2).");
    }
    // instalação (6)
    var pe = num(P.pe);
    if (ap !== "colunas") {
      var lpe = A.linha({ grupo: G4, criterio: "Geossintético ultrapassando o pé do aterro", secao: "6.5.6 f", exigido: "≥ 50 cm", resultado: ok(pe) ? fmt(pe, 0) + " cm" : "—" });
      if (!ok(pe)) A.marcar(lpe, "pendente", "informe"); else if (pe < 50) A.marcar(lpe, "nao_conforme", "largura deve ultrapassar o pé do aterro em pelo menos 50 cm");
      L.push(lpe);
    }
    var c1 = num(P.cam1), firme = P.soloBase === "firme";
    var lc1 = A.linha({ grupo: G4, criterio: "Primeira camada de aterro sobre o geossintético (tráfego de equipamentos)", secao: firme ? "6.5.6 b" : "6.5.6 c", exigido: firme ? "≥ 30 cm" : "≥ 50 cm (solo-base mole)", resultado: ok(c1) ? fmt(c1, 0) + " cm" : "—" });
    if (!ok(c1)) A.marcar(lc1, "pendente", "informe"); else if (c1 < (firme ? 30 : 50)) A.marcar(lc1, firme ? "nao_conforme" : "ressalva", "abaixo do recomendado");
    L.push(lc1);
    if (P.equipSobre === "sim") L.push(A.marcar(A.linha({ grupo: G4, criterio: "Equipamentos sobre o geossintético", secao: "6.5.6 a", exigido: "não devem andar diretamente sobre ele", resultado: "andaram" }), "nao_conforme", "vedado"));
    if (ok(su) && ap !== "colunas") {
      var mod = su < 20 ? "bordas avançadas em relação ao centro" : "cunha, com a parte central avançada";
      var llan = A.linha({ grupo: G4, criterio: "Lançamento do aterro (S_u = " + fmt(su, 0) + " kPa)", secao: "5.1.5; 6.5.6 d, e", exigido: mod,
        resultado: P.lanc === "bordas" ? "bordas avançadas" : P.lanc === "centro" ? "centro avançado" : "—" });
      if (P.lanc && ((su < 20 && P.lanc !== "bordas") || (su > 20 && P.lanc !== "centro"))) A.marcar(llan, "ressalva", "sequência de lançamento diferente da recomendada: " + mod);
      else if (!P.lanc) A.marcar(llan, "pendente", "informe a sequência de lançamento");
      L.push(llan);
    }
    var gr = num(P.grao), qd = num(P.queda);
    if ((ok(gr) && gr > 10) || (ok(qd) && qd > 2)) {
      var lam = A.linha({ grupo: G4, criterio: "Camada granular amortecedora (grãos > 10 cm e/ou queda > 2 m)", secao: "6.5.7", exigido: "forrar o geossintético", resultado: P.amortec === "sim" ? "sim" : P.amortec === "nao" ? "não" : "—" });
      if (P.amortec === "nao") A.marcar(lam, "nao_conforme", "risco de perfurações e rasgos"); else if (P.amortec !== "sim") A.marcar(lam, "pendente", "informe");
      L.push(lam);
    }
    var rc = num(P.rasgoC), rl = num(P.rasgoL), man = null;
    if (ok(rc)) { man = [(ok(rl) ? rl : 0) + 60, rc + 60]; avisos.push("Reparo (6.4 b): manchão mínimo indicativo de " + fmt(man[0], 0) + " cm × " + fmt(man[1], 0) + " cm (traspasse de 30 cm além da área afetada em todas as direções), ou o comprimento de sobreposição do plano de instalação."); }
    if (P.costura === "sim") avisos.push("União por costura: perda de 10 % a 60 % da resistência — quantificar por ensaio de tração de faixa larga das emendas (6.5.1.4; ABNT NBR ISO 10321).");
    // plano e ATO
    function lista(itens, crit, sec) {
      var falt = itens.filter(function (x) { return P[x[0]] === "nao"; }), sem = itens.filter(function (x) { return !P[x[0]]; });
      var l = A.linha({ grupo: G5, criterio: crit, secao: sec, exigido: itens.length + " itens", resultado: (itens.length - falt.length - sem.length) + " de " + itens.length });
      if (falt.length) A.marcar(l, "nao_conforme", "faltam: " + falt.map(function (x) { return x[1].split(")")[0] + ")"; }).join(", "));
      if (sem.length) A.marcar(l, "pendente", "não informados: " + sem.map(function (x) { return x[1].split(")")[0] + ")"; }).join(", "));
      L.push(l);
    }
    lista(PLANO, "Plano de instalação do geossintético", "7");
    if (P.fase === "obra") lista(ATO, "Acompanhamento técnico de obra", "8");
    var par = A.parecer(L, [], { textos: {
      ACEITO: { titulo: "REFORÇO ATENDE À DNIT 380/2022-PRO", texto: "Resistência de projeto ≥ requerida e condições da PRO atendidas." },
      RESSALVA: { titulo: "ATENDE COM RESSALVAS", texto: "Nenhuma verificação reprovada; há pontos a justificar." },
      PENDENTE: { titulo: "VERIFICAÇÃO INCOMPLETA", texto: "Faltam dados para concluir as verificações da PRO." },
      REJEITADO: { titulo: "NÃO ATENDE À DNIT 380/2022-PRO", texto: "Há verificação reprovada: rever o produto, os fatores ou a geometria." } } });
    return { tab: { ref: reforcos(d) }, resultados: { linhas: L, parecer: par, rs: rs, manchao: man }, avisos: avisos };
  }

  function tabRef(r, relat) {
    if (!r.rs.length) return "";
    return '<table class="' + (relat ? "gr" : "fe-resumo") + '"><thead><tr><th style="text-align:left">Reforço</th><th>T_max</th><th>T_ref</th><th>T_disp</th><th>T_proj</th><th>T req.</th><th>T_proj/T req.</th><th>FR total</th><th>J / J req.</th></tr></thead><tbody>' +
      r.rs.map(function (o, i) {
        return '<tr><td style="text-align:left">' + esc(o.nome || "Reforço " + (i + 1)) + " " + esc([o.prodTxt, o.pol].filter(Boolean).join(" · ")) + "</td><td>" + fmt(o.Tmax, 1) + "</td><td>" + fmt(o.Tref, 1) + "</td><td>" + fmt(o.Tdisp, 1) +
          "</td><td><b>" + fmt(o.Tproj, 1) + "</b></td><td>" + fmt(o.Treq, 1) + "</td><td>" + fmt(o.razao, 2) + "</td><td>" + fmt(o.FRtot, 2) + "</td><td>" + fmt(o.J, 0) + " / " + fmt(o.Jreq, 0) + "</td></tr>";
      }).join("") + '</tbody></table><p class="nota" style="font-size:.9em;opacity:.8">Resistências em kN/m; J em kN/m. T_ref = T_max/FR_fl (eq. 3) ou ensaio de fluência; T_disp = T_ref/(FR_dm·FR_amb) (eq. 2); T_proj = T_disp/FS (eq. 1).</p>';
  }
  function grafico(calc, d, opt) {
    var rs = calc.resultados.rs.filter(function (o) { return ok(o.Tmax) || ok(o.Tref); }), imp = opt.imprimir;
    if (!rs.length) return '<div class="fe-graf-vazio">O gráfico aparece com T_max dos reforços.</div>';
    var txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var W = 620, H = 60 + rs.length * 78, L = 150, vmax = 0;
    rs.forEach(function (o) { [o.Tmax, o.Tref, o.Treq].forEach(function (v) { if (ok(v)) vmax = Math.max(vmax, v); }); });
    vmax = Math.ceil(vmax * 1.1 / 50) * 50 || 50;
    function X(v) { return L + v / vmax * (W - L - 20); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">';
    s += '<text x="' + (W / 2) + '" y="13" text-anchor="middle" fill="' + txt + '">Da resistência máxima à de projeto (kN/m) — linha vermelha: T requerida</text>';
    for (var i = 0; i <= 5; i++) { var v = vmax * i / 5; s += '<line x1="' + X(v) + '" y1="22" x2="' + X(v) + '" y2="' + (H - 18) + '" stroke="' + grade + '"/><text x="' + X(v) + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + txt + '">' + fmt(v, 0) + "</text>"; }
    var cores = [["Tmax", "T_max", "#9aa5b1"], ["Tref", "T_ref", "#4f8cff"], ["Tdisp", "T_disp", "#2a9bb0"], ["Tproj", "T_proj", "#34c38f"]];
    rs.forEach(function (o, k) {
      var y0 = 28 + k * 78;
      s += '<text x="4" y="' + (y0 + 10) + '" fill="' + txt + '" font-weight="bold">' + esc((o.nome || "Reforço " + (k + 1)).slice(0, 22)) + "</text>";
      cores.forEach(function (c, j) {
        var y = y0 + j * 16, v = o[c[0]];
        s += '<text x="' + (L - 6) + '" y="' + (y + 11) + '" text-anchor="end" fill="' + txt + '">' + c[1] + "</text>";
        if (ok(v)) s += '<rect x="' + L + '" y="' + (y + 2) + '" width="' + (X(v) - L) + '" height="12" fill="' + (c[0] === "Tproj" && ok(o.Treq) && v < o.Treq ? "#e5534b" : c[2]) + '"/><text x="' + (X(v) + 4) + '" y="' + (y + 12) + '" fill="' + txt + '">' + fmt(v, 1) + "</text>";
      });
      if (ok(o.Treq)) s += '<line x1="' + X(o.Treq) + '" y1="' + (y0 - 2) + '" x2="' + X(o.Treq) + '" y2="' + (y0 + 66) + '" stroke="#e5534b" stroke-width="2" stroke-dasharray="5 3"/>';
    });
    return s + "</svg>";
  }

  function se(k, v) { return function (d) { return (v ? apl(d) === v : true) && (!k || P_(d)[k]); }; }
  var params = [
    { k: "aplicacao", r: "Aplicação (5)", tipo: "select", recarrega: true, opcoes: APL },
    { k: "fase", r: "Fase", tipo: "select", recarrega: true, opcoes: [["projeto", "Projeto"], ["obra", "Obra (acompanhamento técnico, 8)"]] },
    { k: "aterro", r: "Material de aterro em contato com o reforço (Tabelas A2 e A3)", tipo: "select", opcoes: ATERROS },
    { k: "su", r: "Resistência não drenada do solo de fundação S_u, kPa" },
    { k: "B", r: "Largura da base do aterro B, m (5.1.5)", se: se(null, "base") },
    { k: "Dmole", r: "Espessura da camada mole, m (5.1.5: > 0,7 B → influência pequena)", se: se(null, "base") },
    { k: "emendas", r: "Sem emendas longitudinais nem perpendiculares à direção mais solicitada? (5.1.5)", tipo: "select", opcoes: SN, se: se(null, "base") },
    { k: "expulsao", r: "Ruptura no aterro e expulsão do solo mole analisadas? (5.1.5)", tipo: "select", opcoes: SN, se: se(null, "base") },
    { k: "cargas", r: "Solicitação (5.3.5)", tipo: "select", opcoes: [["estaticas", "Cargas estáticas"], ["moveis", "Elevadas cargas móveis"]], se: se(null, "estacas") },
    { k: "s", r: "Distância entre centros das estacas s, m", se: se(null, "estacas") },
    { k: "sx", r: "Espaçamento sx, m", se: se(null, "estacas") }, { k: "sy", r: "Espaçamento sy, m", se: se(null, "estacas") },
    { k: "dEst", r: "Diâmetro da estaca ou equivalente do capitel d, m", se: se(null, "estacas") },
    { k: "capitel", r: "ou lado do capitel quadrado, m (d = diâmetro do círculo de mesma área)", se: se(null, "estacas") },
    { k: "hAt", r: "Altura total de aterro acima do capitel h, m", se: se(null, "estacas") },
    { k: "hGr", r: "Altura de material granular acima do capitel h*, m", se: se(null, "estacas") },
    { k: "soloMole", r: "Solo mole considerado no projeto? (k_s,p/k_s,w > 75)", tipo: "select", opcoes: SN, se: se(null, "estacas") },
    { k: "ksRel", r: "k_s,p / k_s,w", se: se("soloMole", "estacas") },
    { k: "nCam", r: "Nº de camadas de reforço (≤ 2)", se: se(null, "estacas") },
    { k: "z", r: "z — reforço inferior ao topo da estaca/capitel, m", se: se(null, "estacas") },
    { k: "espCam", r: "Espaçamento entre as camadas, m (0,15 a 0,30)", se: se(null, "estacas") },
    { k: "sobrep", r: "Comprimento de sobreposição, m (≥ d)", se: se(null, "estacas") },
    { k: "eIni", r: "Deformação inicial máxima no reforço, % (≤ 5)", se: se(null, "estacas") },
    { k: "eFl", r: "Deformação adicional por fluência, % (< 2)", se: se(null, "estacas") },
    { k: "incerteza", r: "Incertezas quanto a deformações na superfície?", tipo: "select", opcoes: SN, se: se(null, "estacas") },
    { k: "eServ", r: "Deformação máxima de serviço, % (≤ 3)", se: se("incerteza", "estacas") },
    { k: "dCol", r: "Diâmetro das colunas encamisadas, m (usual 0,5 a 1,5)", se: se(null, "colunas") },
    { k: "soloBase", r: "Solo-base sob o geossintético (6.5.6)", tipo: "select", opcoes: [["mole", "Mole"], ["firme", "Firme"]] },
    { k: "pe", r: "Geossintético além do pé do aterro, cm (≥ 50)" },
    { k: "cam1", r: "Espessura da primeira camada de aterro, cm" },
    { k: "equipSobre", r: "Equipamentos andaram diretamente sobre o geossintético?", tipo: "select", opcoes: SN },
    { k: "lanc", r: "Sequência de lançamento do aterro", tipo: "select", opcoes: [["", "—"], ["bordas", "Bordas avançadas"], ["centro", "Centro avançado (cunha)"]] },
    { k: "grao", r: "Maior grão do agregado lançado, cm" }, { k: "queda", r: "Altura de lançamento, m" },
    { k: "amortec", r: "Camada granular amortecedora executada? (6.5.7)", tipo: "select", opcoes: SN },
    { k: "costura", r: "União por costura?", tipo: "select", opcoes: SN },
    { k: "rasgoC", r: "Reparo: comprimento do rasgo/furo, cm (6.4)" }, { k: "rasgoL", r: "Reparo: largura do rasgo/furo, cm" },
  ].concat(PLANO.map(function (x) { return { k: x[0], r: "Plano de instalação (7) " + x[1], tipo: "select", opcoes: SN }; }))
    .concat(ATO.map(function (x) { return { k: x[0], r: "ATO (8) " + x[1], tipo: "select", opcoes: SN, se: function (d) { return P_(d).fase === "obra"; } }; }));

  FE.FICHAS[ID] = {
    titulo: "Geossintéticos em aterros sobre solos moles — resistência de projeto do reforço",
    lote: true,
    resumo: "T_proj = T_max / (FR_fl · FR_dm · FR_amb · FS) (eq. 1 a 3; FS ≥ 1,2; FR_amb ≥ 1,10; FR_fl da Tabela A1; FR_dm das Tabelas A2 e A3) × esforço requerido pela estabilidade; rigidez J = T/ε de compatibilidade (5.1.4); condições dos aterros sobre estacas (5.3.5) e colunas encamisadas (5.4); instalação (6), plano (7) e acompanhamento técnico (8), com parecer.",
    rotuloImportar: function (r) { var o = (r.rs || [])[0]; return o ? "T_proj " + fmt(o.Tproj, 1) + " kN/m" : "—"; },
    params: params,
    padrao: { aplicacao: "base", fase: "projeto", aterro: "areias", soloBase: "mole", cargas: "estaticas" },
    tabelas: function () {
      return [{ chave: "ref", titulo: "Reforços geossintéticos (5.1.3; Anexo A)", rotulo: "Reforço", iniciais: 2, min: 1, dica: "uma coluna por produto/direção/camada; campos de FR e FS em branco = mínimos da norma",
        linhas: [{ k: "nome", r: "Identificação (camada / direção)", texto: true }, { k: "prod", r: "Produto (geotêxtil tecido, geogrelha, geocomposto…)", texto: true },
          { k: "pol", r: "Polímero (PVA, PA, PET, PE, PP)", texto: true }, { k: "MA", r: "Massa por unidade de área M_A (geotêxtil)", u: "g/m²" },
          { k: "Tmax", r: "Resistência à tração máxima T_max (característica, faixa larga)", u: "kN/m" }, { k: "TrefE", r: "T_ref de ensaios de fluência (se houver)", u: "kN/m" },
          { k: "FRfl", r: "FR_fl — fluência (Tabela A1)", u: "" }, { k: "FRdm", r: "FR_dm — danos mecânicos (Tabelas A2/A3)", u: "" }, { k: "FRamb", r: "FR_amb — ambiente (≥ 1,10)", u: "" },
          { k: "FS", r: "FS (≥ 1,2)", u: "" }, { calc: "Tref", r: "T_ref = T_max / FR_fl (eq. 3)", u: "kN/m", casas: 1 }, { calc: "Tdisp", r: "T_disp = T_ref / (FR_dm · FR_amb) (eq. 2)", u: "kN/m", casas: 1 },
          { calc: "Tproj", r: "T_proj = T_disp / FS (eq. 1)", u: "kN/m", casas: 1, destaque: true }, { k: "Treq", r: "Esforço de tração requerido (análise de estabilidade)", u: "kN/m" },
          { calc: "razao", r: "T_proj / T requerida", u: "", casas: 2 }, { k: "J", r: "Rigidez J2% ou J5%", u: "kN/m" }, { k: "eps", r: "Deformação de compatibilidade", u: "%" },
          { calc: "Jreq", r: "J requerida = T req. / ε", u: "kN/m", casas: 0 }, { k: "erup", r: "Deformação na ruptura", u: "%" }] }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer) + tabRef(r) + A.htmlCriterios(r.linhas, { estilo: "resultado" });
    },
    graficos: function (calc, d, opt) { return [grafico(calc, d, opt || {})]; },
    relatorio: {
      notas: "DNIT 380/2022-PRO, 5.1.3: T_proj = T_disp/FS (FS ≥ 1,2), T_disp = T_ref/(FR_dm·FR_amb), T_ref = T_max/FR_fl na falta de ensaios de fluência; FR_fl mínimo da Tabela A1; FR_dm mínimo da Tabela A2 (geotêxteis) ou faixa da Tabela A3 (geogrelhas; em branco, a ficha adota o limite superior da faixa); FR_amb ≥ 1,10. O esforço requerido vem da análise de estabilidade (DNIT 381/2022-PRO), que a PRO não fecha em fórmula. J requerida = T requerida / deformação de compatibilidade (leitura de 5.1.4).",
      resultados: function (calc) {
        var r = calc.resultados, rows = [["Parecer", r.parecer.titulo]];
        r.rs.forEach(function (o, i) { rows.push([(o.nome || "Reforço " + (i + 1)), "T_proj = " + fmt(o.Tproj, 1) + " kN/m" + (ok(o.Treq) ? " × requerida " + fmt(o.Treq, 1) + " kN/m" : "")]); });
        if (r.manchao) rows.push(["Manchão de reparo (6.4 b)", fmt(r.manchao[0], 0) + " × " + fmt(r.manchao[1], 0) + " cm"]);
        return rows;
      },
      extraHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer, { relat: true }) + tabRef(r, true) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" }); },
    },
    exemplos: [
      { nome: "Reforço de base — geotêxtil tecido PET, duas direções — atende", dados: function () {
        return { ident: { registro: "GS-01", data: "2026-05-20", obra: "Obra A — BR-000", trecho: "Aterro sobre várzea, km 12", responsavel: "Engenheiro A" },
          params: { aplicacao: "base", fase: "projeto", aterro: "areias", su: "14", B: "32", Dmole: "8", emendas: "sim", expulsao: "sim", soloBase: "mole", pe: "80", cam1: "60",
            equipSobre: "nao", lanc: "bordas", grao: "5", queda: "1,5", costura: "nao", p7a: "sim", p7b: "sim", p7c: "sim" },
          ref: [{ nome: "Camada 1 — transversal", prod: "Geotêxtil tecido", pol: "PET", MA: "620", Tmax: "400", FRdm: "", FRamb: "", FS: "1,3", Treq: "95", J: "2600", eps: "5", erup: "10" },
            { nome: "Camada 1 — longitudinal", prod: "Geotêxtil tecido", pol: "PET", MA: "620", Tmax: "100", Treq: "25", J: "900", eps: "5" }] };
      } },
      { nome: "Aterro sobre estacas — geogrelha PP com FR_fl baixo e geometria fora dos limites", dados: function () {
        return { ident: { registro: "GS-02", data: "2026-07-02", obra: "Obra B — BR-000", trecho: "Encontro E2" },
          params: { aplicacao: "estacas", fase: "obra", aterro: "pedregulhos", su: "25", cargas: "moveis", s: "3,2", sx: "3,2", sy: "2,6", capitel: "0,6", hAt: "5,0", hGr: "2,4",
            soloMole: "sim", ksRel: "60", nCam: "2", z: "0,35", espCam: "0,20", sobrep: "0,5", eIni: "6", eFl: "1,5", incerteza: "nao", soloBase: "mole", pe: "40", cam1: "40",
            equipSobre: "nao", lanc: "bordas", grao: "15", queda: "1", amortec: "nao", costura: "sim", rasgoC: "40", rasgoL: "", p7a: "sim", p7b: "sim", p7c: "nao",
            a8a: "sim", a8b: "nao", a8c: "sim", a8d: "sim", a8e: "sim", a8f: "sim", a8g: "sim", a8h: "" },
          ref: [{ nome: "Camada inferior", prod: "Geogrelha", pol: "PP", Tmax: "150", FRfl: "3,0", FRdm: "1,10", FRamb: "1,05", FS: "1,2", Treq: "35", J: "700", eps: "5", erup: "14" },
            { nome: "Camada superior", prod: "Geogrelha", pol: "PET", Tmax: "200", FRdm: "", Treq: "35", J: "1500", eps: "5", erup: "10" }] };
      } },
    ],
  };
})();
