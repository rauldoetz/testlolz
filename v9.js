/* ============================================================
   0. Web Audio API (sons do jogo)
   ============================================================ */
(function (global) {
  'use strict';
  var CHAVE_SOM = 'chefclicker_som_v1';
  var ctx = null;
  var ligado = true;

  try {
    var salvo = window.localStorage.getItem(CHAVE_SOM);
    if (salvo === '0') { ligado = false; }
  } catch (e) {}

  function garantirCtx() {
    if (!ctx) {
      var AudioCtx = global.AudioContext || global.webkitAudioContext;
      if (AudioCtx) { ctx = new AudioCtx(); }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  function tocarNota(opts) {
    if (!ligado) { return; }
    var c = garantirCtx();
    if (!c) { return; }

    var agora = c.currentTime;
    var osc = c.createOscillator();
    var gain = c.createGain();
    var freq = opts.freq || 440;
    var dur = opts.dur || 0.09;
    var pico = opts.pico || 0.11;

    osc.type = opts.tipo || 'sine';
    osc.frequency.setValueAtTime(freq, agora);
    if (opts.fimFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, opts.fimFreq), agora + dur);
    }

    gain.gain.setValueAtTime(0.0001, agora);
    gain.gain.linearRampToValueAtTime(pico, agora + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, agora + dur);

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(agora);
    osc.stop(agora + dur + 0.02);
  }

  global.ChefSom = {
    estaLigado: function () { return ligado; },
    alternar: function () {
      ligado = !ligado;
      try { window.localStorage.setItem(CHAVE_SOM, ligado ? '1' : '0'); } catch (e) {}
      if (ligado) { garantirCtx(); this.clique(); }
      return ligado;
    },
    clique: function () {
      tocarNota({ freq: 540, fimFreq: 720, tipo: 'triangle', dur: 0.055, pico: 0.08 });
    },
    cozinhar: function (streak, critico) {
      var base = critico ? 660 : 390;
      var elevacao = Math.min(streak || 0, 20) * 14;
      tocarNota({
        freq: base + elevacao,
        fimFreq: (base + elevacao) * (critico ? 1.45 : 1.18),
        tipo: critico ? 'sawtooth' : 'sine',
        dur: critico ? 0.14 : 0.08,
        pico: critico ? 0.11 : 0.09
      });
    },
    comprar: function () {
      tocarNota({ freq: 480, fimFreq: 760, tipo: 'triangle', dur: 0.11, pico: 0.1 });
    },
    erro: function () {
      tocarNota({ freq: 185, fimFreq: 85, tipo: 'sawtooth', dur: 0.16, pico: 0.11 });
    },
    conquista: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (n, idx) {
        setTimeout(function () {
          tocarNota({ freq: n, fimFreq: n * 1.02, tipo: 'triangle', dur: 0.11, pico: 0.09 });
        }, idx * 60);
      });
    },
    caixa: function (mitico) {
      var notas = mitico ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [440, 554.37, 659.25];
      notas.forEach(function (n, idx) {
        setTimeout(function () {
          tocarNota({ freq: n, fimFreq: n * 1.03, tipo: 'triangle', dur: 0.12, pico: 0.1 });
        }, idx * 70);
      });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ============================================================
   1. Itens: roupas + 12 mascotes originais de todas as raridades
   ============================================================ */
(function (global) {
  'use strict';
  var contador = 0;
  function uid() { contador += 1; return 'cc' + contador; }
  function rgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function paraHex(r, g, b) { return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
  function misturar(a, b, f) {
    var x = rgb(a), y = rgb(b);
    return paraHex(Math.round(x[0] + (y[0] - x[0]) * f), Math.round(x[1] + (y[1] - x[1]) * f), Math.round(x[2] + (y[2] - x[2]) * f));
  }
  function escurecer(h, f) { return misturar(h, '#000000', f); }
  function clarear(h, f) { return misturar(h, '#ffffff', f); }
  function lista(pares) { return pares.map(function (p) { return { nome: p[0], hex: p[1] }; }); }
  function sub(pal, n, off) {
    var r = [];
    for (var i = 0; i < n; i++) { r.push(pal[((off || 0) + i) % pal.length]); }
    return r;
  }

  function tr(d, w, cor) { return '<path d="' + d + '" fill="none" stroke="' + cor + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
  function pa(d, cor, extra) { return '<path d="' + d + '" fill="' + cor + '"' + (extra || '') + '/>'; }
  function ci(x, y, r, cor, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + cor + '"' + (extra || '') + '/>'; }
  function re(x, y, w, h, cor, rx, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 0) + '" fill="' + cor + '"' + (extra || '') + '/>'; }
  function el(x, y, rx, ry, cor, extra) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + cor + '"' + (extra || '') + '/>'; }
  function estrela(cx, cy, R, r, cor) {
    var p = [];
    for (var i = 0; i < 10; i++) {
      var ang = -Math.PI / 2 + i * Math.PI / 5;
      var rad = i % 2 === 0 ? R : r;
      p.push((cx + Math.cos(ang) * rad).toFixed(1) + ',' + (cy + Math.sin(ang) * rad).toFixed(1));
    }
    return '<polygon points="' + p.join(' ') + '" fill="' + cor + '"/>';
  }
  function recorte(d, conteudo) {
    var id = uid();
    return '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath><g clip-path="url(#' + id + ')">' + conteudo + '</g>';
  }
  function degrade(c1, c2) {
    var id = uid();
    return '<defs><linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="-20" x2="0" y2="280"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' + re(-100, -100, 400, 500, 'url(#' + id + ')');
  }
  function fundoBase(cor) { return re(-100, -100, 400, 500, cor); }

  var ROUPA = lista([['Branco', '#f5f5f0'], ['Preto', '#25272b'], ['Cinza', '#8b929a'], ['Vermelho', '#d64545'], ['Laranja', '#ee8a2b'], ['Amarelo', '#f2c230'], ['Verde-limão', '#8ccf3f'], ['Verde', '#2e9d57'], ['Verde-escuro', '#1f6b3a'], ['Turquesa', '#22b3a6'], ['Azul-claro', '#4da6e8'], ['Azul', '#2f5fd0'], ['Marinho', '#1f2f6b'], ['Roxo', '#7c4dc7'], ['Rosa', '#e8629b'], ['Marrom', '#7a4a2b'], ['Bege', '#d9c3a0'], ['Vinho', '#7a1f3a']]);
  var CABELO = lista([['Preto', '#1c1a1a'], ['Castanho-escuro', '#3b2418'], ['Castanho', '#6a4128'], ['Loiro-escuro', '#a9792f'], ['Loiro', '#e0be5a'], ['Ruivo', '#b5461f'], ['Grisalho', '#a8a8a8'], ['Branco', '#f0f0f0'], ['Azul', '#2f6bd6'], ['Rosa', '#e8629b'], ['Verde', '#2e9d57'], ['Roxo', '#7c4dc7'], ['Laranja-vivo', '#f08a1c'], ['Prata', '#c9ced6']]);
  var PELE = lista([['Clara', '#fbe2cf'], ['Rosada', '#f5cba7'], ['Dourada', '#e8b48a'], ['Morena-clara', '#d49a6a'], ['Morena', '#b9794a'], ['Canela', '#9a5f38'], ['Escura', '#7b4627'], ['Retinta', '#5c321d'], ['Ébano', '#3f2214'], ['Oliva', '#c9a66b']]);
  var FOGO_GELO = lista([['Fogo', '#ff6a13'], ['Gelo', '#35c6ff']]);
  var OURO_PRATA = lista([['Ouro', '#e6b422'], ['Prata', '#c9ced6']]);

  var RARIDADES = [
    { id: 'comum', nome: 'Comum', estrelas: 1, peso: 62, valor: 50, bonus: 0.01, regra: '10 ou mais cores' },
    { id: 'incomum', nome: 'Incomum', estrelas: 2, peso: 23, valor: 150, bonus: 0.02, regra: '7 a 9 cores' },
    { id: 'raro', nome: 'Raro', estrelas: 3, peso: 10.5, valor: 500, bonus: 0.04, regra: '5 ou 6 cores' },
    { id: 'epico', nome: 'Épico', estrelas: 4, peso: 4.0, valor: 2000, bonus: 0.08, regra: '3 ou 4 cores' },
    { id: 'lendario', nome: 'Lendário', estrelas: 5, peso: 0.45, valor: 10000, bonus: 0.15, regra: '2 cores' },
    { id: 'mitico', nome: 'Mítico', estrelas: 6, peso: 0.05, valor: 100000, bonus: 0.30, regra: '1 cor (modelo único)' }
  ];
  function raridadePorCores(n) {
    if (n >= 10) { return 0; }
    if (n >= 7) { return 1; }
    if (n >= 5) { return 2; }
    if (n >= 3) { return 3; }
    if (n === 2) { return 4; }
    return 5;
  }

  /* ---------- 12 MASCOTES ORIGINAIS DA COZINHA (2 POR RARIDADE) ---------- */
  var MASCOTES = [
    /* COMUM (0) */
    {
      id: 'masc_rosquinha_morango',
      nome: 'Rosquinha Estrelada de Morango',
      raridade: 0,
      tema: 'Confeitaria',
      bonusTipo: 'clique',
      bonusValor: 0.08,
      bonusDesc: '+8% de ganho por toque (+16% quando equipada)',
      desc: 'Massa fofinha com cobertura de morango, confeitos coloridos e aroma doce de padaria.',
      svg: function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
          re(0, 0, 120, 120, '#fef3c7') +
          ci(60, 62, 42, '#d97706') +
          pa('M22 58 Q30 30 60 24 Q90 30 98 58 Q92 70 82 64 Q72 74 60 66 Q48 74 38 64 Q28 70 22 58Z', '#f472b6') +
          ci(60, 62, 14, '#fef3c7') +
          re(38, 36, 8, 3, '#38bdf8', 1.5) +
          re(66, 33, 8, 3, '#facc15', 1.5) +
          re(78, 48, 8, 3, '#4ade80', 1.5) +
          re(34, 52, 8, 3, '#ffffff', 1.5) +
          estrela(92, 30, 8, 3.5, '#f59e0b') +
          '</svg>';
      }
    },
    {
      id: 'masc_cubo_dourado',
      nome: 'Cubo Dourado da Sorte',
      raridade: 0,
      tema: 'Tesouro',
      bonusTipo: 'passivo',
      bonusValor: 0.08,
      bonusDesc: '+8% de ganho por segundo (+16% quando equipado)',
      desc: 'Cofre artesanal flutuante que vibra de alegria toda vez que você prepara uma receita.',
      svg: function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
          re(0, 0, 120, 120, '#dbeafe') +
          re(22, 22, 76, 76, '#f59e0b', 12, ' stroke="#78350f" stroke-width="4"') +
          ci(32, 32, 3, '#78350f') + ci(88, 32, 3, '#78350f') +
          ci(32, 88, 3, '#78350f') + ci(88, 88, 3, '#78350f') +
          estrela(60, 60, 22, 9, '#fffbeb') +
          '</svg>';
      }
    },

    /* INCOMUM (1) */
    {
      id: 'masc_gota_hortela',
      nome: 'Gota Gelada de Hortelã',
      raridade: 1,
      tema: 'Gelateria',
      bonusTipo: 'passivo',
      bonusValor: 0.14,
      bonusDesc: '+14% de ganho por segundo (+28% quando equipada)',
      desc: 'Uma gotinha refrescante que mantém a cozinha sempre na temperatura ideal.',
      svg: function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
          re(0, 0, 120, 120, '#ecfdf5') +
          pa('M60 16 Q64 36 88 52 Q104 64 98 84 Q90 100 60 100 Q30 100 22 84 Q16 64 32 52 Q56 36 60 16Z', '#0ea5e9') +
          ci(47, 66, 8, '#ffffff') + ci(73, 66, 8, '#ffffff') +
          ci(47, 66, 4, '#0f172a') + ci(73, 66, 4, '#0f172a') +
          pa('M42 80 Q60 94 78 80', 'none', ' stroke="#fef08a" stroke-width="4" stroke-linecap="round"') +
          '</svg>';
      }
    },
    {
      id: 'masc_hamburguer_sorridente',
      nome: 'Mini-Hambúrguer Sorridente',
      raridade: 1,
      tema: 'Chapa Quente',
      bonusTipo: 'clique',
      bonusValor: 0.14,
      bonusDesc: '+14% de ganho por toque (+28% quando equipado)',
      desc: 'Pão brioche dourado, queijo derretido e muita simpatia para animar o balcão.',
      svg: function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
          re(0, 0, 120, 120, '#fef9c3') +
          pa('M24 52 Q24 24 60 24 Q96 24 96 52Z', '#d97706') +
          pa('M20 56 Q35 48 50 56 Q65 48 80 56 Q95 48 100 56 L96 64 L24 64Z', '#22c55e') +
          pa('M24 64 L96 64 L84 74 L60 66 L36 74Z', '#facc15') +
          re(22, 68, 76, 14, '#78350f', 7) +
          re(26, 84, 68, 14, '#d97706', 6) +
          ci(48, 40, 3.5, '#1f2937') + ci(72, 40, 3.5, '#1f2937') +
          pa('M54 44 Q60 49 66 44', 'none', ' stroke="#1f2937" stroke-width="2.5" stroke-linecap="round"') +
          '</svg>';
      }
    },

    /* RARO (2) */
    {
      id: 'masc_genio_espatula',
      nome: 'Gênio Azul da Espátula',
      raridade: 2,
      tema: 'Magia Culinária',
      bonusTipo: 'tudo',
      bonusValor: 0.18,
      bonusDesc: '+18% em todos os ganhos (+36% quando equipado)',
      desc: 'Aparece numa nuvem de vapor aromático para virar panquecas no ar com perfeição.',
      svg: function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
          re(0, 0, 120, 120, '#e0f2fe') +
          ci(60, 64, 38, '#38bdf8') +
          pa('M48 26 Q54 12 60 24 Q66 12 72 26', 'none', ' stroke="#f59e0b" stroke-width="4" stroke-linecap="round"') +
          ci(47, 56, 7, '#ffffff') + ci(73, 56, 7, '#ffffff') +
          ci(47, 56, 2.5, '#0f172a') + ci(73, 56, 2.5, '#0f172a') +
          pa('M40 72 Q60 92 80 72', 'none', ' stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"') +
          '</svg>';
      }
    },
    {
      id: 'masc_cubo_carinho',
      nome: 'Cubo Carinhoso de Açúcar',
      raridade: 2,
      tema: 'Confeitaria',
      bonusTipo: 'sorte',
      bonusValor: 0.12,
      bonusDesc: '+12% de sorte nas caixas (+24% quando equipado)',
      desc: 'Um torrão de açúcar encantado com coração rosado que atrai ingredientes raros.',
      svg: function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
          re(0, 0, 120, 120, '#f1f5f9') +
          re(22, 22, 76, 76, '#94a3b8', 12, ' stroke="#334155" stroke-width="4"') +
          re(34, 34, 52, 52, '#cbd5e1', 8) +
          ci(60, 60, 18, '#f8fafc') +
          pa('M60 69 L50 59 A6 6 0 0 1 60 52 A6 6 0 0 1 70 59Z', '#ec4899') +
          '</svg>';
      }
    },

    /* ÉPICO (3) */
    {
      id: 'masc_robo_assador',
      nome: 'Robô Assador Inox',
      raridade: 3,
      tema: 'Tecnologia',
      bonusTipo: 'tudo',
      bonusValor: 0.30,
      bonusDesc: '+30% em todos os ganhos (+60% quando equipado)',
      desc: 'Forjado em aço inoxidável polido! Calcula o ponto exato de cada assado em milissegundos.',
      svg: function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
          re(0, 0, 120, 120, '#ede9fe') +
          re(57, 10, 6, 18, '#64748b', 3) +
          ci(60, 10, 5, '#f59e0b') +
          re(34, 26, 52, 72, '#94a3b8', 22, ' stroke="#334155" stroke-width="3"') +
          re(38, 44, 44, 18, '#1e293b', 9) +
          ci(49, 53, 7, '#fef08a') + ci(71, 53, 7, '#fef08a') +
          re(48, 51, 3, 4, '#0f172a') + re(70, 51, 3, 4, '#0f172a') +
          re(42, 70, 36, 14, '#f8fafc', 4, ' stroke="#334155" stroke-width="2"') +
          tr('M51 70 L51 84 M60 70 L60 84 M69 70 L69 84 M42 77 L78 77', 1.8, '#334155') +
          '</svg>';
      }
    },
    {
      id: 'masc_mestre_caldeirao',
      nome: 'Mestre do Caldeirão Solar',
      raridade: 3,
      tema: 'Alquimia',
      bonusTipo: 'clique',
      bonusValor: 0.40,
      bonusDesc: '+40% de ganho por toque (+80% quando equipado)',
      desc: 'Com sorriso radiante e energia solar, transforma cada toque em pura perfeição culinária.',
      svg: function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
          re(0, 0, 120, 120, '#dcfce7') +
          ci(60, 60, 42, '#166534') +
          ci(60, 62, 26, '#fde68a') +
          pa('M36 52 Q44 30 68 32 Q84 34 84 50 Q66 42 36 52Z', '#facc15') +
          ci(52, 58, 3, '#14532d') + ci(68, 58, 3, '#14532d') +
          pa('M48 68 Q60 80 72 68', 'none', ' stroke="#14532d" stroke-width="3" stroke-linecap="round"') +
          '</svg>';
      }
    },

    /* LENDÁRIO (4) */
    {
      id: 'masc_pepino_alquimista',
      nome: 'Pepino Alquimista da Horta',
      raridade: 4,
      tema: 'Horta Mística',
      bonusTipo: 'tudo',
      bonusValor: 0.55,
      bonusDesc: '+55% em todos os ganhos (+110% quando equipado)',
      desc: 'O ingrediente mais genial da horta! Cria temperos ácidos que multiplicam o sabor de qualquer prato.',
      svg: function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
          re(0, 0, 120, 120, '#fef3c7') +
          re(42, 14, 36, 92, '#15803d', 18, ' stroke="#052e16" stroke-width="3"') +
          ci(48, 30, 3, '#166534') + ci(72, 82, 3.5, '#166534') + ci(48, 90, 2.5, '#166534') +
          tr('M46 38 Q60 42 74 38', 4, '#67e8f9') +
          ci(52, 48, 6, '#ffffff') + ci(68, 48, 6, '#ffffff') +
          ci(52, 48, 2.5, '#0f172a') + ci(68, 48, 2.5, '#0f172a') +
          pa('M48 68 Q60 78 72 68', 'none', ' stroke="#fef08a" stroke-width="3" stroke-linecap="round"') +
          '</svg>';
      }
    },
    {
      id: 'masc_passaro_especiarias',
      nome: 'Pássaro Dourado das Especiarias',
      raridade: 4,
      tema: 'Expresso',
      bonusTipo: 'passivo',
      bonusValor: 0.70,
      bonusDesc: '+70% de ganho por segundo (+140% quando equipado)',
      desc: 'Voa entre as mesas num piscar de olhos entregando pedidos quentes sem atraso.',
      svg: function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
          re(0, 0, 120, 120, '#fffbeb') +
          pa('M44 34 L34 14 L52 26 L60 10 L68 26 L86 14 L76 34Z', '#facc15') +
          ci(60, 62, 32, '#facc15', ' stroke="#b45309" stroke-width="3"') +
          ci(48, 56, 5, '#1e3a8a') + ci(72, 56, 5, '#1e3a8a') +
          pa('M48 68 L60 82 L72 68 Q60 62 48 68Z', '#f97316') +
          '</svg>';
      }
    },

    /* MÍTICO (5) */
    {
      id: 'masc_porquinho_acrobata',
      nome: 'Porquinho Acrobata da Cozinha',
      raridade: 5,
      tema: 'Lenda do Salão',
      bonusTipo: 'tudo',
      bonusValor: 1.00,
      bonusDesc: '+100% em todos os ganhos (+200% quando equipado)',
      desc: 'Faz acrobacias incríveis equilibrando bandejas inteiras e multiplica banquetes míticos!',
      svg: function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
          re(0, 0, 120, 120, '#ffe4e6') +
          tr('M20 20 L100 100 M100 20 L20 100 M60 10 L60 110', 1.5, '#fda4af') +
          ci(60, 64, 34, '#f472b6', ' stroke="#be123c" stroke-width="3"') +
          pa('M34 40 L28 22 L48 34Z M86 40 L92 22 L72 34Z', '#f472b6') +
          el(60, 72, 13, 9, '#fb7185') +
          ci(55, 72, 2.5, '#881337') + ci(65, 72, 2.5, '#881337') +
          ci(47, 54, 4, '#1f2937') + ci(73, 54, 4, '#1f2937') +
          '</svg>';
      }
    },
    {
      id: 'masc_triade_sabor',
      nome: 'Tríade Dourada do Sabor',
      raridade: 5,
      tema: 'Relíquia Suprema',
      bonusTipo: 'tudo',
      bonusValor: 1.25,
      bonusDesc: '+125% em todos os ganhos (+250% quando equipado)',
      desc: 'Três prismas sagrados de Aroma, Textura e Tempero forjados para o Chef Supremo.',
      svg: function () {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">' +
          re(0, 0, 120, 120, '#1e1b4b') +
          ci(60, 62, 46, '#facc15', ' fill-opacity="0.18"') +
          '<polygon points="60,20 40,56 80,56" fill="#facc15" stroke="#fef08a" stroke-width="2"/>' +
          '<polygon points="40,56 20,92 60,92" fill="#eab308" stroke="#fef08a" stroke-width="2"/>' +
          '<polygon points="80,56 60,92 100,92" fill="#eab308" stroke="#fef08a" stroke-width="2"/>' +
          '</svg>';
      }
    }
  ];

  function obterMascote(id) {
    return MASCOTES.filter(function (m) { return m.id === id; })[0] || null;
  }

  function corpo(s) {
    var sd = escurecer(s, 0.14);
    return {
      pernas: re(63, 200, 34, 68, s, 12) + re(103, 200, 34, 68, s, 12),
      sapatos: el(80, 270, 19, 8, '#2b2420') + el(120, 270, 19, 8, '#2b2420'),
      bracos: re(36, 128, 18, 64, s, 9) + re(146, 128, 18, 64, s, 9) + ci(45, 196, 10, s) + ci(155, 196, 10, s),
      pescoco: re(89, 104, 22, 24, sd, 8),
      peito: pa('M56 126 Q100 114 144 126 L148 194 L52 194Z', s)
    };
  }

  function olhos(t) {
    var c = '#1f1a17';
    if (t === 'feliz') { return tr('M81 77 Q87 69 93 77', 3.2, c) + tr('M107 77 Q113 69 119 77', 3.2, c); }
    if (t === 'sono') { return tr('M81 76 Q87 80 93 76', 3, c) + tr('M107 76 Q113 80 119 76', 3, c); }
    if (t === 'estrela') { return estrela(87, 75, 7, 3, '#e6b422') + estrela(113, 75, 7, 3, '#e6b422'); }
    if (t === 'alquimista') {
      return ci(87, 75, 6.5, '#ffffff', ' stroke="#1f1a17" stroke-width="1.5"') +
             ci(113, 75, 6.5, '#ffffff', ' stroke="#1f1a17" stroke-width="1.5"') +
             ci(87, 75, 2.5, '#0d9488') +
             ci(113, 75, 2.5, '#0d9488');
    }
    var aberto = ci(87, 75, 3.6, c) + ci(88.2, 73.8, 1.1, '#fff');
    var aberto2 = ci(113, 75, 3.6, c) + ci(114.2, 73.8, 1.1, '#fff');
    if (t === 'piscada') { return aberto + tr('M107 77 Q113 70 119 77', 3.2, c); }
    return aberto + aberto2;
  }
  function boca(t) {
    var c = '#7a2b2b';
    if (t === 'sorrisao') { return pa('M85 92 Q100 114 115 92Z', '#8a2f2f') + pa('M89 93 Q100 98 111 93 L110 96 Q100 100 90 96Z', '#ffffff'); }
    if (t === 'serio') { return tr('M91 98 L109 98', 3, c); }
    if (t === 'bocejo') { return el(100, 99, 7, 8, '#8a2f2f'); }
    if (t === 'empolgado') { return pa('M87 93 Q100 108 113 93Z', '#8a2f2f'); }
    return tr('M87 93 Q100 105 113 93', 3, c);
  }
  function cabeca(s) {
    var sd = escurecer(s, 0.14);
    return el(66, 80, 6.5, 9, sd) + el(134, 80, 6.5, 9, sd) + el(100, 76, 34, 38, s) + tr('M100 79 Q96 86 101 87', 1.8, escurecer(s, 0.28));
  }
  function tracos(s, cfg) {
    var o = '';
    if (cfg.barba) { o += pa('M67 80 Q66 120 100 122 Q134 120 133 80 Q126 104 100 105 Q74 104 67 80Z', cfg.barba); }
    o += olhos(cfg.olhos);
    if (cfg.sobrancelhas) { o += tr('M80 66 Q87 62 94 66', 3.6, cfg.sobrancelhas) + tr('M106 66 Q113 62 120 66', 3.6, cfg.sobrancelhas); }
    o += boca(cfg.boca);
    if (cfg.bigode) { o += pa('M100 92 Q92 86 83 91 Q79 95 75 91 Q81 101 92 98 Q97 96 100 95 Q103 96 108 98 Q119 101 125 91 Q121 95 117 91 Q108 86 100 92Z', cfg.bigode); }
    if (cfg.bigodeFino) { o += tr('M86 91 Q100 97 114 91', 2.4, cfg.bigodeFino) + tr('M86 91 Q80 91 78 86', 2.4, cfg.bigodeFino) + tr('M114 91 Q120 91 122 86', 2.4, cfg.bigodeFino); }
    if (cfg.oculos) { o += '<circle cx="87" cy="75" r="9.5" fill="#ffffff" fill-opacity="0.22" stroke="#2b2420" stroke-width="2.4"/><circle cx="113" cy="75" r="9.5" fill="#ffffff" fill-opacity="0.22" stroke="#2b2420" stroke-width="2.4"/>' + tr('M96.5 74 Q100 71 103.5 74', 2.4, '#2b2420'); }
    if (cfg.bochechas) { var r = cfg.grande ? 9 : 6; o += ci(77, 91, r, '#ff6b81', ' fill-opacity="0.35"') + ci(123, 91, r, '#ff6b81', ' fill-opacity="0.35"'); }
    return o;
  }
  function rosto(id, nome, cores, cfg) {
    return { id: id, nome: nome, cores: cores, desenho: function (pele) { return { cabeca: cabeca(pele), tracos: tracos(pele, cfg) }; } };
  }
  var ROSTOS = [
    rosto('sorridente', 'Rosto Sorridente', sub(PELE, 10, 0), { olhos: 'normal', boca: 'sorriso', bochechas: true }),
    rosto('tranquilo', 'Rosto Tranquilo', sub(PELE, 10, 3), { olhos: 'normal', boca: 'serio', sobrancelhas: '#3b2418' }),
    rosto('alegre', 'Rosto Alegre', sub(PELE, 9, 1), { olhos: 'feliz', boca: 'sorrisao', bochechas: true }),
    rosto('bigodudo', 'Rosto Bigodudo', sub(PELE, 8, 2), { olhos: 'normal', boca: 'sorriso', bigode: '#2b1d14', sobrancelhas: '#2b1d14' }),
    rosto('intelectual', 'Rosto de Óculos', sub(PELE, 7, 4), { olhos: 'normal', boca: 'serio', oculos: true, sobrancelhas: '#3b2418' }),
    rosto('barbudo', 'Rosto Barbudo', sub(PELE, 6, 1), { olhos: 'normal', boca: 'sorriso', barba: '#4a3020' }),
    rosto('sonolento', 'Rosto Sonolento', sub(PELE, 5, 5), { olhos: 'sono', boca: 'bocejo' }),
    rosto('piscadinha', 'Rosto Piscadinha', sub(PELE, 4, 2), { olhos: 'piscada', boca: 'sorrisao', bochechas: true }),
    rosto('vovo', 'Vovô Simpático', sub(PELE, 3, 6), { olhos: 'feliz', boca: 'sorriso', bigode: '#f0f0f0', oculos: true, sobrancelhas: '#d8d8d8' }),
    rosto('estrelado', 'Chef Estrelado', [PELE[2], PELE[5]], { olhos: 'estrela', boca: 'sorrisao', bochechas: true }),
    rosto('mestre', 'Mestre Cuca Bonachão', [{ nome: 'Rosado', hex: '#f2b894' }], { olhos: 'feliz', boca: 'sorriso', bigodeFino: '#4a3020', sobrancelhas: '#8f8f8f', bochechas: true, grande: true }),
    rosto('alquimista', 'Rosto do Alquimista Culinário', [{ nome: 'Clara', hex: '#fbe2cf' }], { olhos: 'alquimista', boca: 'empolgado', sobrancelhas: '#0d9488' })
  ];

  var TOPO = 'M65 72 Q62 32 100 30 Q138 32 135 72 Q126 54 100 52 Q74 54 65 72Z';
  function cacheado(h) {
    var s = escurecer(h, 0.15), atras = '';
    [[56, 62, 15], [144, 62, 15], [68, 38, 17], [132, 38, 17], [100, 26, 19], [54, 90, 11], [146, 90, 11]].forEach(function (c) {
      atras += ci(c[0], c[1], c[2], h, ' stroke="' + s + '" stroke-width="1.5"');
    });
    return { atras: atras, frente: pa('M68 66 Q70 46 100 44 Q130 46 132 66 Q120 55 100 55 Q80 55 68 66Z', h) };
  }
  function cabelo(id, nome, cores, fn) { return { id: id, nome: nome, cores: cores, desenho: fn }; }
  var CABELOS = [
    cabelo('curto', 'Cabelo Curto', sub(CABELO, 14, 1), function (h) { return { atras: '', frente: pa(TOPO, h) + tr('M78 46 Q96 38 118 44', 2, clarear(h, 0.35)) }; }),
    cabelo('topete', 'Cabelo com Topete', sub(CABELO, 13, 3), function (h) { return { atras: '', frente: pa(TOPO, h) + pa('M80 38 Q92 10 120 24 Q130 30 124 42 Q108 30 80 38Z', h) }; }),
    cabelo('ondulado', 'Cabelo Ondulado', sub(CABELO, 12, 0), function (h) {
      return { atras: pa('M64 74 Q60 30 100 28 Q140 30 136 74 Q142 100 132 120 Q124 110 118 112 L82 112 Q76 110 68 120 Q58 100 64 74Z', escurecer(h, 0.12)), frente: pa('M65 72 Q62 32 100 30 Q138 32 135 72 Q128 56 112 50 Q100 60 88 50 Q72 56 65 72Z', h) };
    }),
    cabelo('longo', 'Cabelo Longo Liso', sub(CABELO, 11, 4), function (h) {
      return { atras: pa('M62 76 Q60 28 100 26 Q140 28 138 76 L142 150 Q140 158 130 156 L124 118 L76 118 L70 156 Q60 158 58 150Z', escurecer(h, 0.12)), frente: pa('M65 72 Q62 32 100 30 Q138 32 135 72 Q120 50 104 46 Q88 50 65 72Z', h) };
    }),
    cabelo('cacheado', 'Cabelo Cacheado', sub(CABELO, 10, 2), cacheado),
    cabelo('laterais', 'Careca com Laterais', sub(CABELO, 9, 5), function (h) {
      return { atras: '', frente: pa('M65 76 Q63 52 72 46 L76 52 Q70 62 71 78Z', h) + pa('M135 76 Q137 52 128 46 L124 52 Q130 62 129 78Z', h) };
    }),
    cabelo('rabo', 'Rabo de Cavalo', sub(CABELO, 8, 6), function (h) {
      return { atras: pa('M128 56 Q166 60 160 108 Q158 128 150 140 Q146 118 140 104 Q150 80 128 70Z', escurecer(h, 0.12)), frente: pa(TOPO, h) + ci(132, 58, 5, escurecer(h, 0.35)) };
    }),
    cabelo('coque', 'Cabelo de Coque', sub(CABELO, 7, 7), function (h) {
      return { atras: '', frente: pa(TOPO, h) + ci(100, 24, 15, h, ' stroke="' + escurecer(h, 0.2) + '" stroke-width="1.5"') + re(88, 34, 24, 6, escurecer(h, 0.3), 3) };
    }),
    cabelo('trancas', 'Cabelo de Tranças', sub(CABELO, 6, 8), function (h) {
      var a = '';
      for (var i = 0; i < 4; i++) { a += ci(62, 108 + i * 14, 8, h, ' stroke="' + escurecer(h, 0.25) + '" stroke-width="1.5"') + ci(138, 108 + i * 14, 8, h, ' stroke="' + escurecer(h, 0.25) + '" stroke-width="1.5"'); }
      return { atras: a, frente: pa(TOPO, h) };
    }),
    cabelo('chanel', 'Corte Chanel', sub(CABELO, 5, 9), function (h) {
      return { atras: pa('M62 76 Q60 28 100 26 Q140 28 138 76 L140 118 Q130 124 122 114 L78 114 Q70 124 60 118Z', escurecer(h, 0.12)), frente: pa('M65 72 Q62 32 100 30 Q138 32 135 72 L135 60 Q100 52 65 60Z', h) };
    }),
    cabelo('moicano', 'Moicano', sub(CABELO, 4, 10), function (h) {
      return { atras: '', frente: pa('M68 64 Q70 54 90 54 L90 58 Q74 60 68 64Z', escurecer(h, 0.25)) + pa('M132 64 Q130 54 110 54 L110 58 Q126 60 132 64Z', escurecer(h, 0.25)) + pa('M90 56 L88 12 Q100 2 112 12 L110 56Z', h) };
    }),
    cabelo('algodao', 'Cabelo Algodão-doce', lista([['Rosa-bebê', '#f7a8d0'], ['Azul-bebê', '#9bd0ff'], ['Lilás', '#cdb2ff']]), cacheado),
    cabelo('chamas', 'Cabelo de Chamas', FOGO_GELO, function (h) {
      return { atras: '', frente: pa('M64 74 Q60 40 72 34 Q70 14 84 28 Q88 4 100 22 Q112 4 116 28 Q130 14 128 34 Q140 40 136 74 Q124 54 100 52 Q76 54 64 74Z', h) + pa('M80 46 Q84 28 92 36 Q100 14 108 36 Q116 28 120 46 Q100 40 80 46Z', clarear(h, 0.5)) };
    }),
    cabelo('prateado', 'Fios Prateados do Mestre', [{ nome: 'Prata', hex: '#d7dbe0' }], function (h) {
      return { atras: pa('M66 70 Q60 100 70 112 Q74 96 78 86Z', h) + pa('M134 70 Q140 100 130 112 Q126 96 122 86Z', h), frente: pa('M65 80 Q58 50 76 40 Q70 60 76 84Z', h) + pa('M135 80 Q142 50 124 40 Q130 60 124 84Z', h) + pa('M90 42 Q100 26 110 42 Q100 36 90 42Z', h) };
    }),
    cabelo('espetado_turquesa', 'Cabelo Espetado Astral', [{ nome: 'Turquesa', hex: '#2dd4bf' }], function (h) {
      var s = escurecer(h, 0.25);
      return {
        atras: pa('M62 66 L36 52 L58 40 L44 16 L74 28 L82 -4 L100 20 L118 -4 L126 28 L156 16 L142 40 L164 52 L138 66Z', h, ' stroke="' + s + '" stroke-width="1.5"'),
        frente: pa('M66 66 Q70 46 100 44 Q130 46 134 66 Q120 55 100 55 Q80 55 66 66Z', h)
      };
    })
  ];

  function chapeu(id, nome, cores, fn) { return { id: id, nome: nome, cores: cores, desenho: fn }; }
  var CHAPEUS = [
    chapeu('bone', 'Boné', sub(ROUPA, 14, 3), function (c) {
      return pa('M64 54 Q64 20 100 20 Q136 20 136 54Z', c) + re(64, 49, 72, 7, escurecer(c, 0.25), 3) + pa('M96 52 Q132 46 160 58 Q150 66 96 60Z', escurecer(c, 0.15)) + ci(100, 20, 3.5, escurecer(c, 0.3));
    }),
    chapeu('gorro', 'Gorro de Lã', sub(ROUPA, 12, 5), function (c) {
      return pa('M64 56 Q62 22 100 20 Q138 22 136 56Z', c) + re(62, 46, 76, 14, escurecer(c, 0.18), 6) + ci(100, 14, 10, clarear(c, 0.3)) + tr('M72 48 L72 58 M84 48 L84 58 M96 48 L96 58 M108 48 L108 58 M120 48 L120 58 M130 48 L130 58', 1.5, escurecer(c, 0.35));
    }),
    chapeu('bandana', 'Bandana', sub(ROUPA, 11, 1), function (c) {
      return pa('M64 52 Q100 36 136 52 L136 62 Q100 46 64 62Z', c) + pa('M64 54 L48 46 L50 66Z', escurecer(c, 0.15)) + ci(82, 52, 1.8, clarear(c, 0.7)) + ci(100, 49, 1.8, clarear(c, 0.7)) + ci(118, 52, 1.8, clarear(c, 0.7));
    }),
    chapeu('viseira', 'Viseira', sub(ROUPA, 10, 6), function (c) {
      return pa('M64 50 Q100 38 136 50 L136 56 Q100 44 64 56Z', escurecer(c, 0.12)) + pa('M66 54 Q100 46 134 54 Q142 68 100 66 Q58 68 66 54Z', c);
    }),
    chapeu('boina', 'Boina', sub(ROUPA, 8, 12), function (c) {
      return el(96, 34, 40, 16, c, ' transform="rotate(-8 96 34)"') + re(66, 42, 68, 8, escurecer(c, 0.25), 4) + re(93, 12, 5, 10, escurecer(c, 0.3), 2);
    }),
    chapeu('touca', 'Touca Descartável', sub(ROUPA, 7, 0), function (c) {
      return el(100, 38, 42, 20, c) + tr('M62 52 Q100 62 138 52', 3, escurecer(c, 0.25)) + tr('M80 30 Q100 24 120 30', 2, escurecer(c, 0.12));
    }),
    chapeu('palha', 'Chapéu de Palha', sub(ROUPA, 6, 16), function (c) {
      return el(100, 50, 62, 14, c) + pa('M70 50 Q70 18 100 18 Q130 18 130 50Z', clarear(c, 0.12)) + re(70, 40, 60, 9, escurecer(c, 0.35)) + tr('M76 28 L124 28 M72 34 L128 34', 1.4, escurecer(c, 0.2));
    }),
    chapeu('toque', 'Touca de Chef', sub(ROUPA, 5, 0), function (c) {
      return pa('M64 38 Q48 12 72 8 Q86 -6 100 6 Q114 -6 128 8 Q152 12 136 38Z', c, ' stroke="' + escurecer(c, 0.2) + '" stroke-width="1.5"') + re(68, 34, 64, 18, c, 4, ' stroke="' + escurecer(c, 0.2) + '" stroke-width="1.5"') + tr('M86 36 L84 16 M100 34 L100 12 M114 36 L116 16', 1.6, escurecer(c, 0.18));
    }),
    chapeu('cartola', 'Cartola', sub(ROUPA, 4, 1), function (c) {
      return re(76, -14, 48, 56, c, 4) + re(76, 28, 48, 9, '#d64545') + el(100, 44, 50, 9, escurecer(c, 0.1));
    }),
    chapeu('toquealto', 'Touca Alta Gourmet', [ROUPA[0], ROUPA[1], ROUPA[17]], function (c) {
      return pa('M66 34 Q48 4 72 -4 Q86 -18 100 -6 Q114 -18 128 -4 Q152 4 134 34Z', c, ' stroke="' + escurecer(c, 0.2) + '" stroke-width="1.5"') + re(70, 30, 60, 22, c, 4, ' stroke="' + escurecer(c, 0.2) + '" stroke-width="1.5"') + tr('M86 32 L84 8 M100 30 L100 4 M114 32 L116 8', 1.6, escurecer(c, 0.18));
    }),
    chapeu('coroa', 'Coroa Real', OURO_PRATA, function (c) {
      return pa('M68 46 L72 14 L86 30 L100 8 L114 30 L128 14 L132 46Z', c, ' stroke="' + escurecer(c, 0.3) + '" stroke-width="1.5" stroke-linejoin="round"') + re(68, 42, 64, 8, escurecer(c, 0.2), 2) + ci(100, 14, 3.5, '#d64545') + ci(72, 18, 3, '#2f5fd0') + ci(128, 18, 3, '#2e9d57');
    }),
    chapeu('ratinho', 'Toque do Pequeno Chef', [{ nome: 'Branco', hex: '#fbfbf6' }], function (c) {
      var rato = '#8e9097';
      return pa('M66 34 Q48 4 72 -4 Q86 -18 100 -6 Q114 -18 128 -4 Q152 4 134 34Z', c, ' stroke="#d4d4cc" stroke-width="1.5"') + re(70, 30, 60, 22, c, 4, ' stroke="#d4d4cc" stroke-width="1.5"') +
        ci(88, -9, 6, rato) + ci(112, -9, 6, rato) + ci(88, -9, 3, '#f4a6b8') + ci(112, -9, 3, '#f4a6b8') +
        el(100, 0, 13, 11, rato) + ci(94, -2, 1.8, '#1f1a17') + ci(106, -2, 1.8, '#1f1a17') + ci(100, 4, 2.4, '#f4a6b8') +
        tr('M96 6 L84 4 M96 8 L84 10 M104 6 L116 4 M104 8 L116 10', 0.9, '#5b5d63') +
        ci(90, 10, 3.5, '#a5a7ad') + ci(110, 10, 3.5, '#a5a7ad');
    }),
    chapeu('elmo_estelar', 'Elmo do Guardião Estelar', [{ nome: 'Esmeralda', hex: '#15803d' }], function (c) {
      return pa('M62 64 Q60 16 100 16 Q140 16 138 64 L132 82 L122 68 L78 68 L68 82Z', c, ' stroke="#052e16" stroke-width="2"') +
             pa('M74 44 L126 44 L122 58 L78 58Z', '#0f172a') +
             pa('M76 46 L124 46 L120 55 L80 55Z', '#38bdf8', ' fill-opacity="0.7"') +
             re(136, 22, 5, 34, '#94a3b8', 2) + ci(138.5, 20, 4, '#facc15');
    })
  ];

  var TORSO = 'M56 126 Q100 114 144 126 L148 194 L52 194Z';
  var MC = 'M58 124 L34 132 L36 160 L56 158Z M142 124 L166 132 L164 160 L144 158Z';
  var ML = 'M58 124 L34 132 L35 188 L55 188 L56 150Z M142 124 L166 132 L165 188 L145 188 L144 150Z';
  function forma(d, c) { return pa(d, c, ' stroke="' + escurecer(c, 0.25) + '" stroke-width="1.4" stroke-linejoin="round"'); }
  function decote(s) { return pa('M84 124 Q100 142 116 124Z', escurecer(s, 0.14)); }
  function camisa(id, nome, cores, fn) { return { id: id, nome: nome, cores: cores, desenho: fn }; }
  var BRANCO = '#f5f5f0';
  var CAMISAS = [
    camisa('camiseta', 'Camiseta', sub(ROUPA, 14, 0), function (c, s) { return forma(MC, c) + forma(TORSO, c) + decote(s); }),
    camisa('regata', 'Regata', sub(ROUPA, 12, 4), function (c) { return forma('M66 126 L80 124 Q100 150 120 124 L134 126 L138 150 L146 194 L54 194 L62 150Z', c); }),
    camisa('social', 'Camisa Social', sub(ROUPA, 11, 9), function (c) {
      var b = clarear(c, 0.6);
      return forma(ML, c) + forma(TORSO, c) + pa('M84 122 L100 140 L116 122 L108 117 L100 126 L92 117Z', clarear(c, 0.75)) + ci(100, 152, 2.2, b) + ci(100, 166, 2.2, b) + ci(100, 180, 2.2, b) + re(35, 180, 20, 7, escurecer(c, 0.15), 2) + re(145, 180, 20, 7, escurecer(c, 0.15), 2);
    }),
    camisa('polo', 'Camisa Polo', sub(ROUPA, 10, 2), function (c) {
      return forma(MC, c) + forma(TORSO, c) + pa('M84 122 L100 134 L116 122 L110 117 L100 124 L90 117Z', clarear(c, 0.6)) + re(97, 130, 6, 22, escurecer(c, 0.12), 1) + ci(100, 138, 1.8, clarear(c, 0.7)) + ci(100, 146, 1.8, clarear(c, 0.7));
    }),
    camisa('golaalta', 'Blusa de Gola Alta', sub(ROUPA, 9, 10), function (c) {
      return forma(ML, c) + forma(TORSO, c) + re(86, 106, 28, 22, c, 7, ' stroke="' + escurecer(c, 0.25) + '" stroke-width="1.4"') + tr('M88 114 L112 114 M88 120 L112 120', 1.4, escurecer(c, 0.25));
    }),
    camisa('moletom', 'Moletom', sub(ROUPA, 8, 13), function (c) {
      return pa('M74 120 Q100 104 126 120 L122 132 Q100 142 78 132Z', escurecer(c, 0.18)) + forma(ML, c) + forma(TORSO, c) + pa('M74 120 Q100 104 126 120 L122 130 Q100 140 78 130Z', escurecer(c, 0.1)) + tr('M94 134 L94 150 M106 134 L106 150', 2, clarear(c, 0.6)) + pa('M70 168 L130 168 L136 190 L64 190Z', escurecer(c, 0.1), ' stroke="' + escurecer(c, 0.3) + '" stroke-width="1.2"');
    }),
    camisa('listrada', 'Camiseta Listrada', sub(ROUPA, 7, 1), function (c, s) {
      var l = '';
      for (var y = 128; y < 196; y += 14) { l += re(30, y, 140, 6, '#f5f5f0'); }
      return forma(MC, c) + forma(TORSO, c) + recorte(TORSO + ' ' + MC, l) + decote(s);
    }),
    camisa('xadrez', 'Camisa Xadrez', sub(ROUPA, 6, 3), function (c) {
      var l = '';
      for (var x = 38; x < 166; x += 14) { l += re(x, 120, 6, 80, '#ffffff', 0, ' fill-opacity="0.4"'); }
      for (var y = 128; y < 192; y += 14) { l += re(30, y, 140, 6, '#000000', 0, ' fill-opacity="0.25"'); }
      return forma(ML, c) + forma(TORSO, c) + recorte(TORSO + ' ' + ML, l) + pa('M84 122 L100 138 L116 122 L108 117 L100 126 L92 117Z', clarear(c, 0.5)) + ci(100, 152, 2, '#ffffff') + ci(100, 168, 2, '#ffffff');
    }),
    camisa('colete', 'Colete de Cozinha', sub(ROUPA, 5, 7), function (c) {
      return forma(ML, BRANCO) + forma(TORSO, BRANCO) + pa('M58 126 L84 122 L100 162 L116 122 L142 126 L146 194 L54 194Z', c, ' stroke="' + escurecer(c, 0.3) + '" stroke-width="1.4"') + ci(100, 172, 2.2, clarear(c, 0.6)) + ci(100, 184, 2.2, clarear(c, 0.6));
    }),
    camisa('avental', 'Camiseta com Avental', sub(ROUPA, 4, 3), function (c, s) {
      return forma(MC, BRANCO) + forma(TORSO, BRANCO) + decote(s) + tr('M84 126 L100 116 L116 126', 3.5, c) + pa('M80 130 L120 130 L124 160 L146 160 L148 194 L52 194 L54 160 L76 160Z', c, ' stroke="' + escurecer(c, 0.3) + '" stroke-width="1.4"') + re(88, 166, 24, 16, escurecer(c, 0.15), 3);
    }),
    camisa('havaiana', 'Camisa Tropical', sub(ROUPA, 3, 9), function (c) {
      var f = '';
      [[70, 144], [96, 160], [126, 146], [76, 180], [118, 182], [44, 142], [156, 144]].forEach(function (p) { f += ci(p[0], p[1], 5, '#fff3b0') + ci(p[0], p[1], 2, '#e8629b'); });
      return forma(MC, c) + forma(TORSO, c) + recorte(TORSO + ' ' + MC, f) + pa('M84 122 L100 140 L116 122 L108 117 L100 126 L92 117Z', clarear(c, 0.5));
    }),
    camisa('jaqueta', 'Jaqueta Estrelada', [ROUPA[12], ROUPA[17]], function (c) {
      var e = '';
      [[74, 150], [126, 150], [100, 168], [74, 182], [126, 182], [44, 160], [156, 160]].forEach(function (p) { e += estrela(p[0], p[1], 6, 2.6, '#e6b422'); });
      return forma(ML, c) + forma(TORSO, c) + tr('M100 126 L100 194', 2, '#e6b422') + recorte(TORSO + ' ' + ML, e) + pa('M80 122 L100 134 L120 122 L116 116 L100 124 L84 116Z', escurecer(c, 0.15));
    }),
    camisa('dolma', 'Dólmã do Chef Mestre', [{ nome: 'Branco', hex: '#fbfbf6' }], function (c) {
      var o = '#e6b422', bt = '';
      [144, 160, 176].forEach(function (y) { bt += ci(88, y, 3.6, o) + ci(112, y, 3.6, o); });
      return forma(ML, c) + forma(TORSO, c) + pa('M100 124 L146 130 L148 194 L100 194Z', '#f0f0e6', ' stroke="#d4d4cc" stroke-width="1.2"') + bt + re(35, 180, 20, 7, '#e8e8de', 2) + re(145, 180, 20, 7, '#e8e8de', 2) + pa('M84 122 L100 150 L116 122 L108 117 L100 126 L92 117Z', '#d64545') + pa('M92 118 L100 126 L108 118Z', '#b3261e');
    }),
    camisa('jaleco_alquimista', 'Jaleco do Alquimista Gastronômico', [{ nome: 'Branco-puro', hex: '#f8fafc' }], function (c) {
      return forma(ML, c) + forma(TORSO, c) +
             pa('M86 122 L114 122 L110 194 L90 194Z', '#2dd4bf') +
             pa('M78 122 L90 155 L90 122Z', '#e2e8f0') +
             pa('M122 122 L110 155 L110 122Z', '#e2e8f0') +
             re(114, 158, 18, 22, '#e2e8f0', 2) +
             re(118, 152, 4, 8, '#22c55e', 1) +
             re(124, 150, 4, 10, '#a855f7', 1);
    })
  ];

  function formaCalca(fim) { return 'M60 184 H140 V218 H138 V' + fim + ' H102 V218 H98 V' + fim + ' H62 V218 H60Z'; }
  function calcaBase(c, fim) {
    return pa(formaCalca(fim), c, ' stroke="' + c + '" stroke-width="2" stroke-linejoin="round"') + re(60, 184, 80, 7, escurecer(c, 0.25), 1);
  }
  function calca(id, nome, cores, fn) { return { id: id, nome: nome, cores: cores, desenho: fn }; }
  var CAMUFLADO = lista([['Oliva', '#5b6b3a'], ['Deserto', '#b99a64'], ['Urbano', '#5d6b7a'], ['Cinza', '#8b929a'], ['Rosa', '#c97b9b']]);
  var CALCAS = [
    calca('reta', 'Calça Reta', sub(ROUPA, 14, 12), function (c) { return calcaBase(c, 262) + tr('M100 191 L100 216', 1.4, escurecer(c, 0.3)); }),
    calca('shorts', 'Shorts', sub(ROUPA, 14, 3), function (c) { return calcaBase(c, 228); }),
    calca('bermuda', 'Bermuda', sub(ROUPA, 12, 8), function (c) { return calcaBase(c, 246) + tr('M66 204 L84 204 M116 204 L134 204', 1.6, escurecer(c, 0.3)); }),
    calca('jeans', 'Calça Jeans', sub(ROUPA, 11, 7), function (c) {
      var p = escurecer(c, 0.35);
      return calcaBase(c, 262) + tr('M64 192 Q74 206 84 192 M116 192 Q126 206 136 192', 1.4, clarear(c, 0.5)) + tr('M82 224 L82 258 M118 224 L118 258', 1.2, p) + ci(100, 187, 2, '#d9c3a0');
    }),
    calca('jogger', 'Calça Jogger', sub(ROUPA, 10, 1), function (c) {
      return calcaBase(c, 262) + re(62, 250, 36, 12, escurecer(c, 0.22), 4) + re(102, 250, 36, 12, escurecer(c, 0.22), 4) + tr('M92 193 Q100 204 108 193', 2, '#ffffff');
    }),
    calca('shortlistrado', 'Short Listrado', sub(ROUPA, 9, 5), function (c) { return calcaBase(c, 228) + re(61, 192, 5, 36, '#f5f5f0') + re(134, 192, 5, 36, '#f5f5f0'); }),
    calca('cargo', 'Calça Cargo', sub(ROUPA, 8, 14), function (c) {
      var d = escurecer(c, 0.18);
      return calcaBase(c, 262) + re(63, 224, 22, 24, d, 3) + re(115, 224, 22, 24, d, 3) + re(63, 224, 22, 6, escurecer(c, 0.3), 2) + re(115, 224, 22, 6, escurecer(c, 0.3), 2);
    }),
    calca('social', 'Calça Social', sub(ROUPA, 7, 12), function (c) {
      return calcaBase(c, 262) + tr('M80 216 L80 260 M120 216 L120 260', 1.2, escurecer(c, 0.3)) + re(94, 184, 12, 7, '#d4b24c', 1);
    }),
    calca('xadrezc', 'Calça Xadrez', sub(ROUPA, 6, 3), function (c) {
      var l = '';
      for (var x = 62; x < 140; x += 12) { l += re(x, 184, 5, 80, '#ffffff', 0, ' fill-opacity="0.4"'); }
      for (var y = 190; y < 262; y += 12) { l += re(58, y, 84, 5, '#000000', 0, ' fill-opacity="0.22"'); }
      return calcaBase(c, 262) + recorte(formaCalca(262), l);
    }),
    calca('camuflada', 'Calça Camuflada', CAMUFLADO, function (c) {
      var m = '';
      [[70, 200, 9], [92, 232, 8], [112, 206, 10], [128, 246, 8], [74, 252, 9], [118, 230, 7], [86, 198, 6]].forEach(function (p, i) { m += ci(p[0], p[1], p[2], i % 2 ? escurecer(c, 0.35) : clarear(c, 0.25), ' fill-opacity="0.9"'); });
      return calcaBase(c, 262) + recorte(formaCalca(262), m);
    }),
    calca('couro', 'Calça de Couro', [ROUPA[1], ROUPA[15], ROUPA[17], ROUPA[12]], function (c) {
      return calcaBase(c, 262) + tr('M72 196 L72 256 M128 196 L128 256', 3, clarear(c, 0.3)) + tr('M64 218 L96 218 M104 218 L136 218', 1.2, clarear(c, 0.25));
    }),
    calca('shorthavaiano', 'Short Florido', [ROUPA[3], ROUPA[10], ROUPA[7]], function (c) {
      var f = '';
      [[70, 200], [92, 214], [112, 202], [128, 218], [78, 222], [100, 196]].forEach(function (p) { f += ci(p[0], p[1], 4.5, '#fff3b0') + ci(p[0], p[1], 1.8, '#e8629b'); });
      return calcaBase(c, 232) + recorte(formaCalca(232), f);
    }),
    calca('estrelada', 'Calça Estrelada', [ROUPA[12], ROUPA[1]], function (c) {
      var e = '';
      [[72, 202], [90, 230], [74, 252], [112, 206], [128, 236], [118, 256]].forEach(function (p) { e += estrela(p[0], p[1], 5.5, 2.4, '#e6b422'); });
      return calcaBase(c, 262) + recorte(formaCalca(262), e);
    }),
    calca('pied', 'Calça Xadrez do Chef', [{ nome: 'Preto e Branco', hex: '#25272b' }], function () {
      var q = '';
      for (var y = 184, r = 0; y < 264; y += 6, r++) {
        for (var x = 60, k = 0; x < 140; x += 6, k++) {
          if ((r + k) % 2 === 0) { q += re(x, y, 6, 6, '#25272b'); }
        }
      }
      return pa(formaCalca(262), '#f5f5f0') + recorte(formaCalca(262), q + tr('M60 187 L140 187', 1, '#000000')) + re(60, 184, 80, 7, '#14161a', 1);
    })
  ];

  function fundo(id, nome, cores, fn) { return { id: id, nome: nome, cores: cores, desenho: fn }; }
  var ESTRELAS = [[20, 0], [170, -10], [40, 60], [160, 70], [15, 140], [180, 150], [30, 230], [170, 220], [100, -8], [60, 20], [140, 30], [10, 80], [190, 110]];
  function estrelinhas() { var o = ''; ESTRELAS.forEach(function (p) { o += ci(p[0], p[1], 1.6, '#ffffff'); }); return o; }
  var FUNDOS = [
    fundo('liso', 'Fundo Liso', sub(ROUPA, 14, 7), function (c) { return fundoBase(clarear(c, 0.55)); }),
    fundo('degrade', 'Fundo Degradê', sub(ROUPA, 12, 3), function (c) { return degrade(clarear(c, 0.75), c); }),
    fundo('listras', 'Fundo Listrado', sub(ROUPA, 11, 9), function (c) {
      var o = fundoBase(clarear(c, 0.6));
      for (var x = -20; x < 220; x += 40) { o += re(x, -100, 20, 500, c, 0, ' fill-opacity="0.3"'); }
      return o;
    }),
    fundo('bolinhas', 'Fundo de Bolinhas', sub(ROUPA, 10, 1), function (c) {
      var o = fundoBase(clarear(c, 0.65));
      for (var y = -10, r = 0; y < 300; y += 30, r++) { for (var x = 0; x < 220; x += 30) { o += ci(x + (r % 2) * 15, y, 7, c, ' fill-opacity="0.35"'); } }
      return o;
    }),
    fundo('toalha', 'Fundo Toalha Xadrez', sub(ROUPA, 9, 4), function (c) {
      var o = fundoBase(clarear(c, 0.75));
      for (var r = 0; r < 13; r++) { for (var k = 0; k < 8; k++) { if ((r + k) % 2 === 0) { o += re(k * 25, -25 + r * 25, 25, 25, c, 0, ' fill-opacity="0.3"'); } } }
      return o;
    }),
    fundo('raios', 'Fundo Raios de Sol', sub(ROUPA, 8, 5), function (c) {
      var o = fundoBase(clarear(c, 0.55)), n = 14;
      for (var i = 0; i < n; i++) {
        var a1 = (i * 2 * Math.PI) / n, a2 = ((i + 0.5) * 2 * Math.PI) / n;
        o += '<polygon points="100,110 ' + (100 + Math.cos(a1) * 400).toFixed(0) + ',' + (110 + Math.sin(a1) * 400).toFixed(0) + ' ' + (100 + Math.cos(a2) * 400).toFixed(0) + ',' + (110 + Math.sin(a2) * 400).toFixed(0) + '" fill="' + clarear(c, 0.85) + '" fill-opacity="0.8"/>';
      }
      return o;
    }),
    fundo('azulejos', 'Fundo de Azulejos', sub(ROUPA, 6, 9), function (c) {
      var o = fundoBase(clarear(c, 0.8));
      for (var x = 0; x <= 200; x += 40) { o += tr('M' + x + ' -20 L' + x + ' 280', 2, c).replace('stroke-linecap="round"', 'stroke-opacity="0.5" stroke-linecap="round"'); }
      for (var y = -20; y <= 280; y += 40) { o += tr('M0 ' + y + ' L200 ' + y, 2, c).replace('stroke-linecap="round"', 'stroke-opacity="0.5" stroke-linecap="round"'); }
      for (var yy = 0; yy < 280; yy += 40) { for (var xx = 20; xx < 200; xx += 40) { o += '<polygon points="' + xx + ',' + (yy - 6) + ' ' + (xx + 6) + ',' + yy + ' ' + xx + ',' + (yy + 6) + ' ' + (xx - 6) + ',' + yy + '" fill="' + c + '" fill-opacity="0.35"/>'; } }
      return o;
    }),
    fundo('estrelado', 'Fundo Céu Estrelado', sub(ROUPA, 5, 10), function (c) {
      return degrade(escurecer(c, 0.62), escurecer(c, 0.85)) + estrelinhas() + ci(165, 22, 13, '#fff6c9') + ci(171, 17, 12, escurecer(c, 0.66));
    }),
    fundo('prateleiras', 'Fundo Prateleiras', sub(ROUPA, 4, 13), function (c) {
      var o = fundoBase(clarear(c, 0.7));
      [60, 150, 240].forEach(function (y, i) {
        o += re(0, y, 200, 6, '#8a5a3a');
        [[10, 14], [30, 18], [164, 18], [184, 14]].forEach(function (j, k) { o += re(j[0], y - j[1] - 8, 14, j[1] + 8, ROUPA[(i * 4 + k * 3 + 3) % ROUPA.length].hex, 3) + re(j[0] + 2, y - j[1] - 12, 10, 4, '#8a5a3a', 1); });
      });
      return o;
    }),
    fundo('aconchegante', 'Cozinha Aconchegante', sub(ROUPA, 3, 5), function (c) {
      var o = fundoBase(clarear(c, 0.65)) + re(126, 6, 62, 70, '#cfe8ff', 4, ' stroke="#8a5a3a" stroke-width="4"') + tr('M157 6 L157 76 M126 41 L188 41', 3, '#8a5a3a');
      o += tr('M8 22 L112 22', 3, '#6b6b6b');
      [[22, 40, 10], [52, 44, 12], [88, 38, 9]].forEach(function (p) { o += tr('M' + p[0] + ' 22 L' + p[0] + ' ' + (p[1] - p[2]), 1.5, '#6b6b6b') + ci(p[0], p[1], p[2], '#9aa0a6') + re(p[0] - p[2], p[1] - 2, p[2] * 2, 3, '#6b6b6b'); });
      o += re(-10, 250, 220, 40, escurecer(c, 0.3));
      for (var x = -10; x < 210; x += 28) { o += '<polygon points="' + x + ',280 ' + (x + 14) + ',250 ' + (x + 28) + ',280" fill="' + clarear(c, 0.3) + '" fill-opacity="0.5"/>'; }
      return o;
    }),
    fundo('fogao', 'Fogão em Chamas', FOGO_GELO.map(function (x) { return { nome: x.nome, hex: x.hex }; }), function (c) {
      var o = degrade('#2a1208', '#5a1d0a');
      for (var x = -10; x < 210; x += 25) {
        o += pa('M' + x + ' 280 Q' + (x + 6) + ' 236 ' + (x + 12) + ' 262 Q' + (x + 14) + ' 212 ' + (x + 22) + ' 250 Q' + (x + 28) + ' 262 ' + (x + 25) + ' 280Z', c);
        o += pa('M' + (x + 6) + ' 280 Q' + (x + 10) + ' 256 ' + (x + 13) + ' 270 Q' + (x + 16) + ' 250 ' + (x + 19) + ' 280Z', clarear(c, 0.55));
      }
      return o;
    }),
    fundo('paris', 'Noite em Paris', [{ nome: 'Noite', hex: '#141a4d' }], function () {
      var o = degrade('#141a4d', '#7a3f84') + estrelinhas() + ci(30, 24, 12, '#fff6c9') + ci(36, 20, 11, '#1a1f58');
      o += '<g transform="translate(112,60)"><g transform="scale(0.55)">' + pa('M100 50 L96 110 L88 112 L84 170 L78 172 L70 280 L90 280 L96 230 L104 230 L110 280 L130 280 L122 172 L116 170 L112 112 L104 110Z', '#0d0f2b') + '</g></g>';
      o += pa('M0 280 L0 236 L18 226 L36 236 L36 218 L62 218 L62 238 L84 228 L108 238 L108 222 L136 222 L136 240 L160 230 L184 240 L200 232 L200 280Z', '#0d0f2b');
      [[44, 226], [118, 230], [168, 242], [10, 246]].forEach(function (p) { o += re(p[0], p[1], 5, 6, '#ffd75e'); });
      o += re(12, 214, 10, 16, '#0d0f2b') + el(17, 210, 6, 4.5, '#8e9097') + ci(13, 206, 2.6, '#8e9097') + ci(21, 206, 2.6, '#8e9097') + re(12, 196, 10, 8, '#fbfbf6', 2) + ci(17, 195, 6, '#fbfbf6');
      return o;
    }),
    fundo('portal_verde', 'Portal Esmeralda', [{ nome: 'Esmeralda', hex: '#22c55e' }], function () {
      return degrade('#052e16', '#020617') +
             ci(100, 130, 88, '#15803d', ' fill-opacity="0.45"') +
             ci(100, 130, 70, '#22c55e', ' fill-opacity="0.65"') +
             ci(100, 130, 50, '#86efac', ' fill-opacity="0.8"') +
             ci(100, 130, 32, '#fef08a', ' fill-opacity="0.9"') +
             tr('M40 80 Q100 30 160 90 Q175 160 110 205 Q45 190 40 80', 4, '#4ade80');
    })
  ];

  var CATEGORIAS = [
    { id: 'rosto', nome: 'Rosto', plural: 'Rostos' },
    { id: 'cabelo', nome: 'Cabelo', plural: 'Cabelos' },
    { id: 'chapeu', nome: 'Chapéu', plural: 'Chapéus' },
    { id: 'camisa', nome: 'Camisa', plural: 'Camisas' },
    { id: 'calca', nome: 'Calça ou short', plural: 'Calças e shorts' },
    { id: 'fundo', nome: 'Fundo', plural: 'Fundos' }
  ];
  var MODELOS = { rosto: ROSTOS, cabelo: CABELOS, chapeu: CHAPEUS, camisa: CAMISAS, calca: CALCAS, fundo: FUNDOS };
  var PORID = {};
  CATEGORIAS.forEach(function (c) {
    PORID[c.id] = {};
    MODELOS[c.id].forEach(function (m) { m.cat = c.id; m.raridade = raridadePorCores(m.cores.length); PORID[c.id][m.id] = m; });
  });

  function chave(cat, modeloId, indice) { return cat + '|' + modeloId + '|' + indice; }
  function obter(k) {
    if (!k) { return null; }
    var p = String(k).split('|');
    if (p[0] === 'mascote') {
      var msc = obterMascote(p[1]);
      if (!msc) { return null; }
      return { chave: k, cat: 'mascote', mascote: msc, raridade: msc.raridade, nome: msc.nome };
    }
    var m = PORID[p[0]] && PORID[p[0]][p[1]];
    var i = parseInt(p[2], 10);
    if (!m || !m.cores[i]) { return null; }
    var cor = m.cores[i];
    var nome = m.cores.length === 1 ? m.nome : m.nome + ' ' + cor.nome.toLowerCase();
    if (p[0] === 'rosto' && m.cores.length > 1) { nome = m.nome + ' (pele ' + cor.nome.toLowerCase() + ')'; }
    return { chave: k, cat: p[0], modelo: m, cor: cor, indice: i, raridade: m.raridade, nome: nome };
  }
  function total() {
    var t = MASCOTES.length;
    CATEGORIAS.forEach(function (c) { MODELOS[c.id].forEach(function (m) { t += m.cores.length; }); });
    return t;
  }
  function totalDaCategoria(cat) { var t = 0; MODELOS[cat].forEach(function (m) { t += m.cores.length; }); return t; }

  var INICIAIS = {
    rosto: chave('rosto', 'sorridente', 2),
    cabelo: chave('cabelo', 'curto', 0),
    chapeu: null,
    camisa: chave('camisa', 'camiseta', 0),
    calca: chave('calca', 'reta', 0),
    fundo: chave('fundo', 'liso', 0)
  };

  var CORTE = {
    rosto: '38 18 124 112', cabelo: '28 -6 144 136', chapeu: '28 -26 144 112',
    camisa: '26 104 148 100', calca: '46 176 108 108', fundo: '0 -20 200 300'
  };
  function avatarSVG(eq, op) {
    op = op || {}; eq = eq || {};
    var r = obter(eq.rosto) || obter(INICIAIS.rosto);
    var cab = obter(eq.cabelo), cha = obter(eq.chapeu);
    var cam = obter(eq.camisa) || obter(INICIAIS.camisa);
    var cal = obter(eq.calca) || obter(INICIAIS.calca);
    var fun = obter(eq.fundo);
    var pele = r.cor.hex, c = corpo(pele);
    var cd = cab ? cab.modelo.desenho(cab.cor.hex) : null;
    var f = r.modelo.desenho(pele);
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (op.viewBox || '0 -20 200 300') + '" focusable="false" aria-hidden="true">';
    s += fun ? fun.modelo.desenho(fun.cor.hex) : fundoBase('#e6efe6');
    if (cd) { s += cd.atras; }
    s += c.pernas + cal.modelo.desenho(cal.cor.hex) + c.sapatos + c.bracos + c.pescoco + c.peito;
    s += cam.modelo.desenho(cam.cor.hex, pele);
    s += f.cabeca + f.tracos;
    if (cd) { s += cd.frente; }
    if (cha) { s += cha.modelo.desenho(cha.cor.hex); }
    return s + '</svg>';
  }
  function miniaturaSVG(cat, modeloId, indice) {
    if (cat === 'mascote') {
      var msc = obterMascote(modeloId);
      return msc ? msc.svg() : '';
    }
    var eq = { rosto: INICIAIS.rosto, cabelo: (cat === 'chapeu' || cat === 'fundo') ? INICIAIS.cabelo : null, chapeu: null, camisa: INICIAIS.camisa, calca: INICIAIS.calca, fundo: null };
    eq[cat] = chave(cat, modeloId, indice);
    return avatarSVG(eq, { viewBox: CORTE[cat] });
  }

  var CONJUNTOS = [
    { id: 'set_mitico_alquimista', tier: 'Mítico', nome: 'Alquimista do Portal Verde', desc: 'Rosto do Alquimista Culinário + Cabelo Espetado Astral + Jaleco do Alquimista + Portal Esmeralda.', bonus: 1.50, req: { rosto: 'alquimista', cabelo: 'espetado_turquesa', camisa: 'jaleco_alquimista', fundo: 'portal_verde' } },
    { id: 'set_mitico_ratinho', tier: 'Mítico', nome: 'Pequeno Chef de Paris', desc: 'Toque do Pequeno Chef + Dólmã do Chef Mestre + Calça Xadrez do Chef + Noite em Paris.', bonus: 1.35, req: { chapeu: 'ratinho', camisa: 'dolma', calca: 'pied', fundo: 'paris' } },
    { id: 'set_mitico_guardiao', tier: 'Mítico', nome: 'Guardião Estelar da Cozinha', desc: 'Elmo do Guardião Estelar + Mestre Cuca Bonachão + Fios Prateados do Mestre.', bonus: 1.25, req: { chapeu: 'elmo_estelar', rosto: 'mestre', cabelo: 'prateado' } },
    { id: 'set_lendario_realeza', tier: 'Lendário', nome: 'Monarca da Alta Gastronomia', desc: 'Coroa Real + Jaqueta Estrelada + Calça Estrelada.', bonus: 0.75, req: { chapeu: 'coroa', camisa: 'jaqueta', calca: 'estrelada' } },
    { id: 'set_lendario_inferno', tier: 'Lendário', nome: 'Mestre das Chamas Vivas', desc: 'Cabelo de Chamas + Fogão em Chamas + Chef Estrelado.', bonus: 0.70, req: { cabelo: 'chamas', fundo: 'fogao', rosto: 'estrelado' } },
    { id: 'set_lendario_gourmet', tier: 'Lendário', nome: 'Estrela Dourada Suprema', desc: 'Touca Alta Gourmet + Dólmã do Chef Mestre + Calça Xadrez do Chef.', bonus: 0.65, req: { chapeu: 'toquealto', camisa: 'dolma', calca: 'pied' } },
    { id: 'set_lendario_tropical', tier: 'Lendário', nome: 'Rei do Luau Gastronômico', desc: 'Chapéu de Palha + Camisa Tropical + Short Florido.', bonus: 0.55, req: { chapeu: 'palha', camisa: 'havaiana', calca: 'shorthavaiano' } },
    { id: 'set_extra_bistro', tier: 'Épico', nome: 'Clássico de Bistrô', desc: 'Boina + Camiseta Listrada + Calça Social.', bonus: 0.30, req: { chapeu: 'boina', camisa: 'listrada', calca: 'social' } },
    { id: 'set_extra_churrasco', tier: 'Raro', nome: 'Mestre do Churrasco', desc: 'Bandana + Camisa Xadrez + Calça Jeans.', bonus: 0.20, req: { chapeu: 'bandana', camisa: 'xadrez', calca: 'jeans' } }
  ];

  global.ChefItens = {
    CATEGORIAS: CATEGORIAS, RARIDADES: RARIDADES, MODELOS: MODELOS, INICIAIS: INICIAIS, CONJUNTOS: CONJUNTOS,
    MASCOTES: MASCOTES, obterMascote: obterMascote,
    chave: chave, obter: obter, total: total, totalDaCategoria: totalDaCategoria,
    avatarSVG: avatarSVG, miniaturaSVG: miniaturaSVG
  };
})(typeof window !== 'undefined' ? window : globalThis);

/* ============================================================
   2. Upgrades e caixas
   ============================================================ */
(function (global) {
  'use strict';

  var GRUPOS = [
    { id: 'maos', nome: 'Cliques', ajuda: 'Cada nível aumenta as moedas ganhas em cada toque.' },
    { id: 'ajudantes', nome: 'Ajudantes', ajuda: 'Eles cozinham sozinhos e rendem moedas a cada segundo.' },
    { id: 'bonus', nome: 'Bônus', ajuda: 'Compras únicas que multiplicam seus ganhos.' },
    { id: 'sorte', nome: 'Sorte e caixas', ajuda: 'Deixam as caixas mais baratas e mais generosas.' },
    { id: 'especiais', nome: 'Especiais', ajuda: 'Vantagens extras para a sua cozinha.' }
  ];

  function u(id, grupo, nome, desc, efeito, custo, cresc, max) {
    return { id: id, grupo: grupo, nome: nome, desc: desc, efeito: efeito, custo: custo, cresc: cresc, max: max || 0 };
  }

  var UPGRADES = [
    u('faca', 'maos', 'Faca Afiada', '+1 moeda em cada toque, por nível.', { tipo: 'clique', valor: 1 }, 15, 1.15),
    u('tabua', 'maos', 'Tábua de Corte', '+3 moedas em cada toque, por nível.', { tipo: 'clique', valor: 3 }, 100, 1.15),
    u('frigideira', 'maos', 'Frigideira Boa', '+10 moedas em cada toque, por nível.', { tipo: 'clique', valor: 10 }, 600, 1.15),
    u('pressao', 'maos', 'Panela de Pressão', '+40 moedas em cada toque, por nível.', { tipo: 'clique', valor: 40 }, 3500, 1.15),
    u('batedeira', 'maos', 'Batedeira', '+150 moedas em cada toque, por nível.', { tipo: 'clique', valor: 150 }, 20000, 1.15),
    u('forno', 'maos', 'Forno Turbo', '+600 moedas em cada toque, por nível.', { tipo: 'clique', valor: 600 }, 130000, 1.15),
    u('liquidificador', 'maos', 'Liquidificador Profissional', '+2.500 moedas em cada toque, por nível.', { tipo: 'clique', valor: 2500 }, 900000, 1.15),
    u('industrial', 'maos', 'Cozinha Industrial', '+12.000 moedas em cada toque, por nível.', { tipo: 'clique', valor: 12000 }, 6e6, 1.15),
    u('fogaoouro', 'maos', 'Fogão de Ouro', '+60.000 moedas em cada toque, por nível.', { tipo: 'clique', valor: 60000 }, 4.5e7, 1.15),
    u('michelin', 'maos', 'Estrela Dourada da Alta Cozinha', '+300.000 moedas em cada toque, por nível.', { tipo: 'clique', valor: 300000 }, 4e8, 1.15),

    u('aprendiz', 'ajudantes', 'Aprendiz', '+1 moeda por segundo, por nível.', { tipo: 'passivo', valor: 1 }, 50, 1.15),
    u('ajudante', 'ajudantes', 'Ajudante de Cozinha', '+5 moedas por segundo, por nível.', { tipo: 'passivo', valor: 5 }, 300, 1.15),
    u('vovo', 'ajudantes', 'Cozinheira da Vovó', '+20 moedas por segundo, por nível.', { tipo: 'passivo', valor: 20 }, 2000, 1.15),
    u('padeiro', 'ajudantes', 'Padeiro', '+80 moedas por segundo, por nível.', { tipo: 'passivo', valor: 80 }, 12000, 1.15),
    u('confeiteira', 'ajudantes', 'Confeiteira', '+350 moedas por segundo, por nível.', { tipo: 'passivo', valor: 350 }, 80000, 1.15),
    u('churrasqueiro', 'ajudantes', 'Churrasqueiro', '+1.500 moedas por segundo, por nível.', { tipo: 'passivo', valor: 1500 }, 550000, 1.15),
    u('massas', 'ajudantes', 'Chef de Massas', '+7.000 moedas por segundo, por nível.', { tipo: 'passivo', valor: 7000 }, 4e6, 1.15),
    u('executivo', 'ajudantes', 'Chef Executivo', '+35.000 moedas por segundo, por nível.', { tipo: 'passivo', valor: 35000 }, 3e7, 1.15),
    u('filial', 'ajudantes', 'Restaurante Filial', '+180.000 moedas por segundo, por nível.', { tipo: 'passivo', valor: 180000 }, 2.5e8, 1.15),
    u('rede', 'ajudantes', 'Rede de Restaurantes', '+1 milhão de moedas por segundo, por nível.', { tipo: 'passivo', valor: 1e6 }, 2e9, 1.15),

    u('livro', 'bonus', 'Livro de Receitas da Família', 'Multiplica todos os seus ganhos por 1,5.', { tipo: 'mult', alvo: 'tudo', fator: 1.5 }, 5000, 1, 1),
    u('tempero', 'bonus', 'Tempero Secreto', 'Multiplica as moedas de cada toque por 2.', { tipo: 'mult', alvo: 'clique', fator: 2 }, 25000, 1, 1),
    u('avental', 'bonus', 'Avental Reforçado', 'Multiplica as moedas por segundo por 1,5.', { tipo: 'mult', alvo: 'passivo', fator: 1.5 }, 100000, 1, 1),
    u('cardapio', 'bonus', 'Cardápio do Dia', 'Multiplica todos os seus ganhos por 2.', { tipo: 'mult', alvo: 'tudo', fator: 2 }, 2e6, 1, 1),
    u('selo', 'bonus', 'Selo de Qualidade', 'Multiplica as moedas de cada toque por 2.', { tipo: 'mult', alvo: 'clique', fator: 2 }, 5e7, 1, 1),
    u('critico', 'bonus', 'Crítico Gastronômico Amigo', 'Multiplica as moedas por segundo por 2.', { tipo: 'mult', alvo: 'passivo', fator: 2 }, 3e8, 1, 1),
    u('internacional', 'bonus', 'Reconhecimento Internacional', 'Multiplica todos os seus ganhos por 3.', { tipo: 'mult', alvo: 'tudo', fator: 3 }, 1e10, 1, 1),

    u('desconto', 'sorte', 'Cupom de Desconto', 'Caixas 5% mais baratas, por nível.', { tipo: 'desconto', valor: 0.05 }, 1000, 1.6, 10),
    u('faro', 'sorte', 'Faro para Raridades', 'Aumenta a sorte nas caixas em 4%, por nível.', { tipo: 'sorte', valor: 0.04 }, 5000, 1.7, 10),
    u('dupla', 'sorte', 'Caixa Dupla', '3% de chance de vir um item a mais, por nível.', { tipo: 'caixaExtra', valor: 0.03 }, 20000, 1.7, 10),
    u('reciclagem', 'sorte', 'Reciclagem de Repetidos', 'Repetidos rendem 10% mais moedas, por nível.', { tipo: 'refund', valor: 0.10 }, 8000, 1.6, 10),

    u('perfeito', 'especiais', 'Prato Perfeito', '2% de chance de um toque render 7 vezes mais, por nível.', { tipo: 'critico', valor: 0.02 }, 15000, 1.5, 15),
    u('noturna', 'especiais', 'Cozinha Noturna', 'Rende mais 5% enquanto você está fora, por nível.', { tipo: 'offline', valor: 0.05 }, 30000, 1.6, 10),
    u('maosrapidas', 'especiais', 'Mãos Rápidas', 'Cozinha sozinho 0,5 toque por segundo, por nível.', { tipo: 'auto', valor: 0.5 }, 40000, 1.6, 10),
    u('gorjeta', 'especiais', 'Gorjeta Generosa', 'Todos os ganhos aumentam 3%, por nível.', { tipo: 'gorjeta', valor: 0.03 }, 60000, 1.5, 20),
    u('frescos', 'especiais', 'Ingredientes Frescos', 'Os ajudantes rendem 10% mais, por nível.', { tipo: 'frescos', valor: 0.10 }, 90000, 1.55, 10)
  ];

  var CAIXAS = [
    { id: 'madeira', nome: 'Caixa de Madeira', custo: 250, sorte: 0, minimo: 0, cor: '#8a5a3a', desc: 'A caixa mais simples. Boa para começar a sua coleção e achar mascotes Comuns.' },
    { id: 'prata', nome: 'Caixa de Prata', custo: 3000, sorte: 0.10, minimo: 0, cor: '#7b8794', desc: 'Mais sorte para achar itens e mascotes Incomuns e Raros.' },
    { id: 'ouro', nome: 'Caixa de Ouro', custo: 40000, sorte: 0.20, minimo: 1, cor: '#b8860b', desc: 'Nunca vem item Comum. Alta chance de mascotes Épicos e Lendários.' },
    { id: 'chef', nome: 'Caixa do Chef', custo: 600000, sorte: 0.30, minimo: 2, cor: '#0f3d22', desc: 'A melhor caixa. Só vêm itens Raros, Épicos, Lendários ou Míticos.' }
  ];

  global.ChefUpgrades = { GRUPOS: GRUPOS, UPGRADES: UPGRADES, CAIXAS: CAIXAS };
})(typeof window !== 'undefined' ? window : globalThis);

/* ============================================================
   3. Motor do jogo (v9.0)
   ============================================================ */
(function () {
  'use strict';

  var I = window.ChefItens;
  var U = window.ChefUpgrades;
  var Som = window.ChefSom;
  var CHAVE_SALVO = 'chefclicker_v1';
  var CHAVE_BACKUP = 'chefclicker_backup_anterior_v9';
  var CHAVE_TEMA = 'chefclicker_tema_v1';
  var CHANCE_TOKEN = 1 / 1000000000;
  var CONJUNTO_MITICO = 0.25;
  var BONUS_ESTRELA_PRESTIGIO = 0.15;
  var META_BASE_PRESTIGIO = 1e6;
  var SEGREDO_DEBUG = 'chefdebug';
  var PITY_LIMITE = 15;

  var estado, S = {};
  var ui = {
    aba: 'cozinhar',
    navGrupo: 'jogar',
    grupo: 'maos',
    qtd: 1,
    cat: 'rosto',
    modelo: null,
    buscaReceita: '',
    filtroCatReceita: 'todas',
    filtroConq: 'todas',
    filtroMascote: 'todas',
    autoCompra: false
  };
  var ultimoTick = Date.now();
  var focoAnterior = null;
  var toastTimer = null;

  /* Ritmo, Combo, Risco, Frenesi, Minigame, Boss Fight, Evento Aleatório */
  var streakToques = 0;
  var ultimoToqueMs = 0;
  var pedidoRelampagoAtivo = false;
  var pedidoExpiraMs = 0;
  var frenesiExpiraMs = 0;
  var frenesiMult = 1;
  var pontoCarneAtivo = false;
  var pontoCarneMult = 1;
  var minigameTimer = null;
  var douradoTimer = null;
  var bossAtivo = null;
  var modoDesafioAtivo = null;
  var eventoAleatorioAtivo = null;
  var eventoAleatorioTimer = null;
  var ultimoMinutoAmostra = 0;

  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var SUFIXOS = ['', 'mil', 'mi', 'bi', 'tri', 'quad', 'quin', 'sext', 'sept', 'oct', 'non', 'dec', 'undec', 'duodec'];
  function fmt(n) {
    if (!isFinite(n)) { return '∞'; }
    if (n < 10 && n % 1 !== 0) { return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 }); }
    if (n < 1e6) { return Math.floor(n).toLocaleString('pt-BR'); }
    var i = 0;
    while (n >= 1000 && i < SUFIXOS.length - 1) { n /= 1000; i++; }
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' ' + SUFIXOS[i];
  }
  function pct(n) { return (n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%'; }

  /* ---------- TUTORIAL INICIAL GUIADO ---------- */
  var PASSOS_TUTORIAL = [
    { titulo: 'Passo 1 de 4: Prepare seu primeiro prato', desc: 'Clique no botão verde "Cozinhar!" (ou aperte Espaço) para ganhar suas primeiras moedas.', ok: function () { return estado.cliques >= 5; } },
    { titulo: 'Passo 2 de 4: Compre uma melhoria', desc: 'Vá em Gerenciar > Melhorias e compre uma "Faca Afiada" (ou clique em Comprar Mais Barata).', ok: function () { return (estado.upgrades.faca || 0) >= 1 || totalNiveisMelhorias() >= 1; } },
    { titulo: 'Passo 3 de 4: Abra uma Caixa de Surpresa', desc: 'Vá em Chef, Mascotes & Caixas > Caixas e abra uma Caixa de Madeira para ganhar um item ou mascote!', ok: function () { return estado.caixasAbertas >= 1; } },
    { titulo: 'Passo 4 de 4: Atenda um cliente no salão', desc: 'Na tela Cozinhar, clique em "Servir Pedido Agora" em qualquer cliente para ganhar gorjeta e reputação!', ok: function () { return (estado.clientesAtendidos || 0) >= 1; } }
  ];

  function renderTutorial() {
    var box = $('cc-tutorial-banner');
    if (!box) { return; }
    if (estado.tutorialConcluido) {
      box.hidden = true;
      return;
    }
    var idx = estado.tutorialPasso || 0;
    while (idx < PASSOS_TUTORIAL.length && PASSOS_TUTORIAL[idx].ok()) {
      idx += 1;
      estado.tutorialPasso = idx;
    }
    if (idx >= PASSOS_TUTORIAL.length) {
      estado.tutorialConcluido = true;
      box.hidden = true;
      mostrarToast('🎓 Tutorial concluído! Bônus de boas-vindas: +500 moedas!');
      estado.moedas += 500;
      estado.totalGanho += 500;
      salvar();
      return;
    }
    var p = PASSOS_TUTORIAL[idx];
    box.hidden = false;
    box.innerHTML =
      '<div>' +
        '<strong><i class="fa-solid fa-graduation-cap"></i> ' + esc(p.titulo) + '</strong>' +
        '<p style="margin:4px 0 0; font-size:0.9rem; color:var(--texto-suave);">' + esc(p.desc) + '</p>' +
      '</div>' +
      '<button type="button" id="cc-pular-tutorial-btn" class="cc-btn cc-btn-claro cc-btn-pequeno" style="margin:0;">Pular Guia</button>';
  }

  /* ---------- EVENTOS ALEATÓRIOS NA COZINHA ---------- */
  var EVENTOS_ALEATORIOS = [
    {
      id: 'ev_influencer',
      titulo: '📸 Criador de Conteúdo Gastronômico na Porta!',
      desc: 'Um criador famoso quer gravar um vídeo sobre seu prato principal.',
      opA: { texto: 'Preparar Degustação VIP (-15% moedas)', acao: function () {
        var custo = Math.floor(estado.moedas * 0.15);
        estado.moedas = Math.max(0, estado.moedas - custo);
        alterarReputacao(0.35, 'Vídeo viral de degustação (+0.35★)');
        ativarFrenesi(20, 2.5);
        mostrarToast('🌟 Sucesso viral! +0.35★ de Reputação e Frenesi 2.5x por 20s!');
      }},
      opB: { texto: 'Oferecer Mesa Normal (Grátis)', acao: function () {
        alterarReputacao(0.12, 'Visita simpática do criador (+0.12★)');
        var ganho = Math.max(200, S.porSegundo * 15 + S.porClique * 25);
        estado.moedas += ganho;
        estado.totalGanho += ganho;
        mostrarToast('👍 Boa avaliação! +' + fmt(ganho) + ' moedas e +0.12★!');
      }}
    },
    {
      id: 'ev_inspecao',
      titulo: '📋 Inspeção Surpresa de Qualidade!',
      desc: 'Um fiscal de qualidade chegou para avaliar a higiene e organização da cozinha.',
      opA: { texto: 'Apresentar Padrão Ouro', acao: function () {
        var bonus = Math.max(500, S.porSegundo * 25 + S.porClique * 40);
        estado.moedas += bonus;
        estado.totalGanho += bonus;
        alterarReputacao(0.20, 'Selo de Excelência na Inspeção (+0.20★)');
        mostrarToast('🏅 Inspeção aprovada com louvor! +' + fmt(bonus) + ' moedas e +0.20★!');
      }},
      opB: { texto: 'Focar no Atendimento Rápido', acao: function () {
        ativarFrenesi(15, 2.0);
        mostrarToast('⚡ Ritmo acelerado! Frenesi 2x por 15 segundos!');
      }}
    },
    {
      id: 'ev_fornecedor_relampago',
      titulo: '🚚 Carga Extra de Ingredientes Frescos!',
      desc: 'Um produtor parceiro tem uma sobra de insumos frescos na região.',
      opA: { texto: 'Abastecer Despensa Agora', acao: function () {
        FORNECEDORES.forEach(function (f) {
          estado.ingredientes[f.ingId] = qtdIngrediente(f.ingId) + 3;
        });
        mostrarToast('🧺 +3 unidades de TODOS os ingredientes adicionadas à despensa!');
      }},
      opB: { texto: 'Converter em Bônus de Caixa', acao: function () {
        estado.fragmentosFusao = (estado.fragmentosFusao || 0) + 2;
        mostrarToast('✨ +2 Fragmentos de Fusão obtidos para forjar itens!');
      }}
    }
  ];

  function dispararEventoAleatorio() {
    if (eventoAleatorioAtivo || bossAtivo || modoDesafioAtivo) { return; }
    var ev = EVENTOS_ALEATORIOS[Math.floor(Math.random() * EVENTOS_ALEATORIOS.length)];
    eventoAleatorioAtivo = ev;
    var box = $('cc-evento-aleatorio-banner');
    if (!box) { return; }
    box.hidden = false;
    box.innerHTML =
      '<div>' +
        '<strong>' + esc(ev.titulo) + '</strong>' +
        '<p style="margin:3px 0 0; font-size:0.9rem;">' + esc(ev.desc) + '</p>' +
      '</div>' +
      '<div style="display:flex; flex-wrap:wrap; gap:8px;">' +
        '<button type="button" class="cc-btn cc-btn-ouro cc-btn-pequeno" data-ev-opcao="A" style="margin:0;">' + esc(ev.opA.texto) + '</button>' +
        '<button type="button" class="cc-btn cc-btn-claro cc-btn-pequeno" data-ev-opcao="B" style="margin:0;">' + esc(ev.opB.texto) + '</button>' +
      '</div>';
    clearTimeout(eventoAleatorioTimer);
    eventoAleatorioTimer = setTimeout(function () {
      eventoAleatorioAtivo = null;
      if (box) { box.hidden = true; }
    }, 25000);
  }

  function resolverEventoAleatorio(opcao) {
    if (!eventoAleatorioAtivo) { return; }
    var ev = eventoAleatorioAtivo;
    eventoAleatorioAtivo = null;
    clearTimeout(eventoAleatorioTimer);
    $('cc-evento-aleatorio-banner').hidden = true;
    if (Som) { Som.comprar(); }
    if (opcao === 'A') { ev.opA.acao(); } else { ev.opB.acao(); }
    calcular();
    renderTudo();
    salvar();
  }

  /* ---------- 1. EXPANSÃO DO RESTAURANTE & ESPECIALIZAÇÕES ---------- */
  var ESTABELECIMENTOS = [
    { id: 'barraca', indice: 0, nome: 'Barraca de Comida', icone: 'fa-store', custo: 0, reqMoedasTotal: 0, reqRep: 1.0, reqPratos: 0, bonusGlobal: 0, desc: 'Começo simples na calçada, mas com muito tempero.', libera: 'Receitas iniciais (Café da Manhã, Lanches e Massas) e Ajudantes.' },
    { id: 'lanchonete', indice: 1, nome: 'Lanchonete Fixa', icone: 'fa-burger', custo: 15000, reqMoedasTotal: 25000, reqRep: 1.5, reqPratos: 5, bonusGlobal: 0.25, desc: 'Seu primeiro ponto comercial organizado com balcão e chapa quente.', libera: '+25% ganhos, Especializações, Comida Japonesa, Cozinheiro e Garçom.' },
    { id: 'familiar', indice: 2, nome: 'Restaurante Familiar', icone: 'fa-utensils', custo: 350000, reqMoedasTotal: 600000, reqRep: 2.3, reqPratos: 18, bonusGlobal: 0.60, desc: 'Mesas cheias nos fins de semana e brigada sincronizada.', libera: '+60% ganhos, Carnes & Sobremesas, Sous-chef e Gerente.' },
    { id: 'sofisticado', indice: 3, nome: 'Restaurante Sofisticado', icone: 'fa-wine-glass', custo: 12000000, reqMoedasTotal: 20000000, reqRep: 3.2, reqPratos: 40, bonusGlobal: 1.20, desc: 'Alta gastronomia com apresentação impecável e clientes exigentes.', libera: '+120% ganhos, Pratos Sofisticados e Chefs Especialistas.' },
    { id: 'cinco_estrelas', indice: 4, nome: 'Restaurante Cinco Estrelas', icone: 'fa-crown', custo: 450000000, reqMoedasTotal: 800000000, reqRep: 4.2, reqPratos: 80, bonusGlobal: 2.50, desc: 'Referência nacional de excelência e lista de espera.', libera: '+250% ganhos e +15% no valor de todas as receitas.' },
    { id: 'imperio', indice: 5, nome: 'Império Gastronômico', icone: 'fa-globe', custo: 25000000000, reqMoedasTotal: 50000000000, reqRep: 4.8, reqPratos: 140, bonusGlobal: 5.00, desc: 'Uma rede lendária reconhecida nos quatro cantos do mundo.', libera: '+500% ganhos, +35% receitas e Franquias Globais de Endgame!' }
  ];

  var ESPECIALIZACOES = [
    { id: 'nenhuma', nome: 'Cozinha Versátil (Padrão)', icone: 'fa-compass', custoTroca: 0, desc: 'Equilíbrio geral sem foco específico.', bonusTxt: 'Sem modificador especializado.' },
    { id: 'alta_gastronomia', nome: 'Alta Gastronomia', icone: 'fa-champagne-glasses', custoTroca: 25000, desc: 'Foco em pratos sofisticados, críticos e prestígio.', bonusTxt: '+50% em Pratos Sofisticados e Carnes; +25% ganho de Reputação.' },
    { id: 'familiar', nome: 'Restaurante Familiar', icone: 'fa-house-chimney', custoTroca: 25000, desc: 'Atendimento acolhedor, alta demanda e renda constante.', bonusTxt: '+40% na renda passiva por segundo e clientes chegam mais rápido.' },
    { id: 'oriental', nome: 'Culinária Oriental', icone: 'fa-bowl-rice', custoTroca: 25000, desc: 'Tradição asiática com sinergia com especialistas.', bonusTxt: '+60% em Comida Japonesa e Massas; +25% eficiência de Especialistas.' },
    { id: 'lanchonete_premium', nome: 'Lanchonete Premium', icone: 'fa-burger', custoTroca: 25000, desc: 'Velocidade máxima na chapa, toques e combos explosivos.', bonusTxt: '+45% no ganho por toque, +50% em Lanches e +0.5x no teto de Combo.' }
  ];

  function specAtualObj() {
    var id = estado.especializacao || 'nenhuma';
    return ESPECIALIZACOES.filter(function (s) { return s.id === id; })[0] || ESPECIALIZACOES[0];
  }

  function escolherEspecializacao(id) {
    if (estabIndiceAtual() < 1 && !acessoTotal()) {
      if (Som) { Som.erro(); }
      aviso('Expanda primeiro para a Lanchonete Fixa para escolher uma Especialização!');
      return;
    }
    var alvo = ESPECIALIZACOES.filter(function (s) { return s.id === id; })[0];
    if (!alvo || estado.especializacao === id) { return; }
    var custoTroca = (estado.especializacao === 'nenhuma' || acessoTotal()) ? 0 : alvo.custoTroca;
    if (estado.moedas < custoTroca) {
      if (Som) { Som.erro(); }
      aviso('Você precisa de ' + fmt(custoTroca) + ' moedas para reestruturar a especialização.');
      return;
    }
    estado.moedas -= custoTroca;
    estado.especializacao = id;
    if (Som) { Som.comprar(); }
    calcular();
    verificarConquistas();
    renderTudo();
    salvar();
    mostrarToast('🧭 Especialização definida: ' + alvo.nome + '!');
  }

  function estabAtualObj() {
    var id = estado.estabelecimento || 'barraca';
    return ESTABELECIMENTOS.filter(function (e) { return e.id === id; })[0] || ESTABELECIMENTOS[0];
  }
  function estabIndiceAtual() { return estabAtualObj().indice; }

  function expandirRestaurante(id) {
    var alvo = ESTABELECIMENTOS.filter(function (e) { return e.id === id; })[0];
    if (!alvo) { return; }
    var atualIdx = estabIndiceAtual();
    if (alvo.indice !== atualIdx + 1) { return; }

    var okMetas = (estado.totalGanho >= alvo.reqMoedasTotal) &&
                  ((estado.reputacao || 1) >= alvo.reqRep) &&
                  ((estado.pratosConcluidos || 0) >= alvo.reqPratos);
    if (!okMetas && !acessoTotal()) {
      if (Som) { Som.erro(); }
      aviso('Você ainda não atingiu todos os requisitos de carreira para esta expansão.');
      return;
    }
    if (estado.moedas < alvo.custo && !acessoTotal()) {
      if (Som) { Som.erro(); }
      aviso('Moedas insuficientes para financiar a obra de expansão!');
      return;
    }
    if (!acessoTotal()) { estado.moedas -= alvo.custo; }
    estado.estabelecimento = alvo.id;
    document.body.setAttribute('data-cc-estab', alvo.id);
    if (Som) { Som.caixa(true); }
    dispararShake();
    calcular();
    verificarConquistas();
    renderTudo();
    salvar();
    mostrarToast('🏛️ Restaurante expandido para: ' + alvo.nome + '!');
  }

  function renderRestaurante() {
    var atual = estabAtualObj();
    var spec = specAtualObj();
    $('cc-restaurante-resumo').textContent = 'Estabelecimento: ' + atual.nome + ' (+' + pct(atual.bonusGlobal) + ') • Identidade: ' + spec.nome + '.';

    var liberadoSpec = estabIndiceAtual() >= 1 || acessoTotal();
    $('cc-especializacoes-lista').innerHTML = ESPECIALIZACOES.map(function (s) {
      var ativa = (estado.especializacao || 'nenhuma') === s.id;
      var custoTroca = (estado.especializacao === 'nenhuma' || acessoTotal()) ? 0 : s.custoTroca;
      return '<article class="cc-card-gestao' + (ativa ? ' atual-estab' : (!liberadoSpec ? ' bloqueado' : '')) + '">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
            '<h4 style="margin:0; font-size:1.05rem;"><i class="fa-solid ' + s.icone + '"></i> ' + esc(s.nome) + '</h4>' +
            '<span class="cc-tag-pill">' + (ativa ? 'Ativa ✔' : 'Opção') + '</span>' +
          '</div>' +
          '<p style="margin:6px 0; font-size:0.9rem; color:var(--texto-suave);">' + esc(s.desc) + '</p>' +
          '<small style="font-weight:700; color:var(--verde-900);">' + esc(s.bonusTxt) + '</small>' +
        '</div>' +
        '<div>' +
          (!liberadoSpec
            ? '<button type="button" class="cc-btn cc-btn-pequeno" disabled>Requer Lanchonete Fixa</button>'
            : (ativa
                ? '<button type="button" class="cc-btn cc-btn-pequeno" disabled>Em vigor</button>'
                : '<button type="button" class="cc-btn cc-btn-claro cc-btn-pequeno" data-spec="' + s.id + '"' + (estado.moedas >= custoTroca ? '' : ' disabled') + '>' +
                  (custoTroca === 0 ? 'Escolher Grátis' : 'Trocar (' + fmt(custoTroca) + ' moedas)') + '</button>')) +
        '</div>' +
      '</article>';
    }).join('');

    $('cc-lista-estabelecimentos').innerHTML = ESTABELECIMENTOS.map(function (e) {
      var jaTem = e.indice <= atual.indice;
      var ehAtual = e.id === atual.id;
      var ehProximo = e.indice === atual.indice + 1;

      var okMoedasHist = estado.totalGanho >= e.reqMoedasTotal;
      var okRep = (estado.reputacao || 1) >= e.reqRep;
      var okPratos = (estado.pratosConcluidos || 0) >= e.reqPratos;
      var podeComprar = ehProximo && (acessoTotal() || (okMoedasHist && okRep && okPratos && estado.moedas >= e.custo));

      var cls = 'cc-card-gestao' + (ehAtual ? ' atual-estab' : (jaTem ? ' ativo' : (!ehProximo ? ' bloqueado' : '')));
      var statusPill = ehAtual ? 'Estabelecimento Atual' : (jaTem ? 'Concluído ✔' : (ehProximo ? 'Próxima Expansão' : 'Bloqueado'));

      var reqHtml = e.indice === 0 ? '<small>Ponto de partida da sua jornada.</small>' :
        '<div style="font-size:0.86rem; color:var(--texto-suave); display:grid; gap:3px;">' +
          '<span>' + (okMoedasHist ? '✔' : '•') + ' Histórico: ' + fmt(e.reqMoedasTotal) + ' moedas</span>' +
          '<span>' + (okRep ? '✔' : '•') + ' Reputação mínima: ' + e.reqRep.toFixed(1) + '★</span>' +
          '<span>' + (okPratos ? '✔' : '•') + ' Receitas preparadas: ' + e.reqPratos + '</span>' +
        '</div>';

      var btnHtml = '';
      if (ehProximo) {
        btnHtml = '<button type="button" class="cc-btn cc-btn-ouro cc-btn-pequeno" data-expandir="' + e.id + '"' + (podeComprar ? '' : ' disabled') + '>' +
          'Expandir (' + (acessoTotal() ? 'Grátis' : fmt(e.custo) + ' moedas') + ')</button>';
      }

      return '<article class="' + cls + '">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">' +
            '<h3 style="margin:0; font-size:1.12rem;"><i class="fa-solid ' + e.icone + '"></i> ' + esc(e.nome) + '</h3>' +
            '<span class="cc-tag-pill">' + statusPill + '</span>' +
          '</div>' +
          '<p style="margin:0 0 6px; font-size:0.92rem; color:var(--texto-suave);">' + esc(e.desc) + '</p>' +
          '<p style="margin:0 0 6px; font-size:0.9rem; font-weight:700; color:var(--verde-900);">Libera: ' + esc(e.libera) + '</p>' +
          reqHtml +
        '</div>' +
        btnHtml +
      '</article>';
    }).join('');
  }

  /* ---------- 2. FRANQUIAS GLOBAIS (ENDGAME) ---------- */
  var FRANQUIAS_ENDGAME = [
    { id: 'franq_paris', nome: 'Bistrô Torre de Cristal (Paris)', icone: 'fa-wine-glass', custoBase: 5e10, cresc: 1.65, passivoBase: 1.5e7, multGlobal: 0.35, desc: 'Filial sofisticada às margens do Sena, famosa por seus suflês e sobremesas.' },
    { id: 'franq_toquio', nome: 'Mercado Izakaya Luminoso (Tóquio)', icone: 'fa-torii-gate', custoBase: 2.5e11, cresc: 1.70, passivoBase: 8e7, multGlobal: 0.50, desc: 'Operação 24 horas em Tóquio servindo ramen e sushis de alta precisão.' },
    { id: 'franq_ny', nome: 'Skyline Burger Tower (Nova York)', icone: 'fa-city', custoBase: 1.5e12, cresc: 1.75, passivoBase: 4.5e8, multGlobal: 0.75, desc: 'Arranha-céu gastronômico em Manhattan com fila que dá a volta no quarteirão.' },
    { id: 'franq_roma', nome: 'Palazzo della Pasta (Roma)', icone: 'fa-landmark', custoBase: 1e13, cresc: 1.80, passivoBase: 2.5e9, multGlobal: 1.10, desc: 'Tradição centenária em massas artesanais e trufas brancas.' },
    { id: 'franq_dubai', nome: 'Oásis Dourado Submarino (Dubai)', icone: 'fa-gem', custoBase: 8e13, cresc: 1.85, passivoBase: 1.5e10, multGlobal: 1.60, desc: 'Restaurante de luxo subaquático onde cada prato leva folha de ouro comestível.' },
    { id: 'franq_orbital', nome: 'Estação Gourmet Orbital (Órbita Baixa)', icone: 'fa-shuttle-space', custoBase: 1e15, cresc: 1.95, passivoBase: 1.2e11, multGlobal: 2.50, desc: 'O ápice absoluto da culinária: banquetes em gravidade zero para viajantes espaciais!' }
  ];

  function franquiaNivel(id) {
    return (estado.franquias && estado.franquias[id]) || 0;
  }
  function franquiaCusto(f) {
    var nv = franquiaNivel(f.id);
    return Math.floor(f.custoBase * Math.pow(f.cresc, nv));
  }
  function totalFranquiasAbertas() {
    var soma = 0;
    FRANQUIAS_ENDGAME.forEach(function (f) { soma += franquiaNivel(f.id); });
    return soma;
  }
  function franquiasLiberadas() {
    return estabIndiceAtual() >= 5 || (estado.prestigios || 0) >= 3 || totalFranquiasAbertas() > 0 || acessoTotal();
  }

  function comprarFranquia(id) {
    if (!franquiasLiberadas()) {
      if (Som) { Som.erro(); }
      aviso('Alcance o Império Gastronômico (ou 3 Prestígios) para abrir Franquias Globais!');
      return;
    }
    var f = FRANQUIAS_ENDGAME.filter(function (x) { return x.id === id; })[0];
    if (!f) { return; }
    var custo = acessoTotal() ? 0 : franquiaCusto(f);
    if (estado.moedas < custo) {
      if (Som) { Som.erro(); }
      aviso('Você precisa de ' + fmt(custo) + ' moedas para expandir esta franquia.');
      return;
    }
    estado.moedas -= custo;
    estado.franquias[id] = franquiaNivel(id) + 1;
    if (Som) { Som.caixa(true); }
    dispararShake();
    calcular();
    verificarConquistas();
    renderTudo();
    salvar();
    mostrarToast('🌍 Franquia expandida: ' + f.nome + ' (Nível ' + estado.franquias[id] + ')!');
  }

  function renderFranquias() {
    var liberado = franquiasLiberadas();
    var tot = totalFranquiasAbertas();
    $('cc-franquias-resumo').textContent = liberado
      ? ('Franquias ativas no mundo: ' + tot + ' • Bônus global acumulado: +' + pct(S.bonusFranquiasMult || 0) + ' • Renda extra: +' + fmt(S.passivoFranquias || 0) + '/s')
      : '🔒 Bloqueado: Expanda seu restaurante até o estágio "Império Gastronômico" (ou complete 3 Prestígios) para desbloquear as Franquias Globais!';

    $('cc-franquias-lista').innerHTML = FRANQUIAS_ENDGAME.map(function (f) {
      var nv = franquiaNivel(f.id);
      var custo = franquiaCusto(f);
      var pode = liberado && (acessoTotal() || estado.moedas >= custo);
      return '<article class="cc-card-gestao' + (nv > 0 ? ' atual-estab' : (!liberado ? ' bloqueado' : '')) + '">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
            '<h3 style="margin:0; font-size:1.08rem;"><i class="fa-solid ' + f.icone + '"></i> ' + esc(f.nome) + '</h3>' +
            '<span class="cc-tag-pill">Nível ' + nv + '</span>' +
          '</div>' +
          '<p style="margin:6px 0; font-size:0.9rem; color:var(--texto-suave);">' + esc(f.desc) + '</p>' +
          '<div style="font-size:0.86rem; font-weight:700; color:var(--verde-900);">' +
            '<div>• Renda base: +' + fmt(f.passivoBase) + ' moedas/s por nível</div>' +
            '<div>• Multiplicador global: +' + pct(f.multGlobal) + ' por nível</div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="cc-btn cc-btn-ouro cc-btn-pequeno" data-franquia="' + f.id + '"' + (pode ? '' : ' disabled') + '>' +
          (!liberado ? 'Requer Império Gastronômico' : (nv === 0 ? 'Inaugurar (' : 'Expandir (') + (acessoTotal() ? 'Grátis' : fmt(custo)) + ')') +
        '</button>' +
      '</article>';
    }).join('');
  }

  /* ---------- 3. DECORAÇÃO & TEMAS VISUAIS INDEPENDENTES ---------- */
  var DECORACOES = [
    { id: 'classico', nome: 'Salão Clássico Acolhedor', icone: 'fa-chair', custo: 0, reqEstab: 0, desc: 'Toalhas limpas, luz quente e aroma de tempero caseiro.' },
    { id: 'retro_salon', nome: 'Lanchonete Retrô Anos 50', icone: 'fa-record-vinyl', custo: 8000, reqEstab: 1, desc: 'Bancos cromados, luz azulada e milk-shakes clássicos.' },
    { id: 'industrial', nome: 'Cozinha Aberta Industrial', icone: 'fa-fire-burner', custo: 45000, reqEstab: 1, desc: 'Aço escovado, tijolos aparentes e chapa à vista dos clientes.' },
    { id: 'japones', nome: 'Izakaya Tradicional Japonês', icone: 'fa-torii-gate', custo: 180000, reqEstab: 2, desc: 'Lanternas vermelhas, madeira de cedro e balcão de sushi.' },
    { id: 'moderno', nome: 'Bistrô Contemporâneo', icone: 'fa-leaf', custo: 1200000, reqEstab: 2, desc: 'Design minimalista com jardim vertical e iluminação suave.' },
    { id: 'luxuoso', nome: 'Salão Imperial Dourado', icone: 'fa-gem', custo: 25000000, reqEstab: 3, desc: 'Lustres de cristal, mármore e detalhes em ouro polido.' }
  ];

  function aplicarDecoracaoVisual() {
    var d = estado.decoracaoAtiva || 'classico';
    document.body.setAttribute('data-cc-decor', d);
  }

  function comprarOuEquiparDecoracao(id) {
    var dec = DECORACOES.filter(function (x) { return x.id === id; })[0];
    if (!dec) { return; }
    var desbloqueadas = estado.decoracoesDesbloqueadas || ['classico'];
    if (desbloqueadas.indexOf(id) >= 0 || acessoTotal()) {
      estado.decoracaoAtiva = id;
      aplicarDecoracaoVisual();
      if (Som) { Som.clique(); }
      renderDecoracao();
      salvar();
      mostrarToast('🎨 Visual equipado: ' + dec.nome);
      return;
    }
    if (estabIndiceAtual() < dec.reqEstab) {
      if (Som) { Som.erro(); }
      aviso('Expanda seu restaurante primeiro para liberar este estilo!');
      return;
    }
    if (estado.moedas < dec.custo) {
      if (Som) { Som.erro(); }
      aviso('Moedas insuficientes para adquirir esta decoração.');
      return;
    }
    estado.moedas -= dec.custo;
    desbloqueadas.push(id);
    estado.decoracoesDesbloqueadas = desbloqueadas;
    estado.decoracaoAtiva = id;
    aplicarDecoracaoVisual();
    if (Som) { Som.comprar(); }
    verificarConquistas();
    renderTudo();
    salvar();
    mostrarToast('✨ Decoração desbloqueada e equipada: ' + dec.nome + '!');
  }

  function renderDecoracao() {
    var desb = estado.decoracoesDesbloqueadas || ['classico'];
    var ativa = estado.decoracaoAtiva || 'classico';
    var atualObj = DECORACOES.filter(function (d) { return d.id === ativa; })[0] || DECORACOES[0];
    $('cc-decoracao-resumo').textContent = 'Visual equipado: ' + atualObj.nome + ' • Coleção: ' + desb.length + '/' + DECORACOES.length + ' estilos (+5% Reputação por estilo desbloqueado).';

    $('cc-decoracao-lista').innerHTML = DECORACOES.map(function (d) {
      var tem = desb.indexOf(d.id) >= 0 || acessoTotal();
      var emUso = ativa === d.id;
      var reqOk = estabIndiceAtual() >= d.reqEstab || acessoTotal();
      return '<article class="cc-card-gestao' + (emUso ? ' atual-estab' : (tem ? ' ativo' : (!reqOk ? ' bloqueado' : ''))) + '">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
            '<h3 style="margin:0; font-size:1.08rem;"><i class="fa-solid ' + d.icone + '"></i> ' + esc(d.nome) + '</h3>' +
            '<span class="cc-tag-pill">' + (emUso ? 'Equipado ✔' : (tem ? 'Adquirido' : 'Bloqueado')) + '</span>' +
          '</div>' +
          '<p style="margin:6px 0; font-size:0.9rem; color:var(--texto-suave);">' + esc(d.desc) + '</p>' +
        '</div>' +
        (emUso
          ? '<button type="button" class="cc-btn cc-btn-pequeno" disabled>Visual Ativo</button>'
          : (tem
              ? '<button type="button" class="cc-btn cc-btn-claro cc-btn-pequeno" data-decor="' + d.id + '">Equipar Visual</button>'
              : '<button type="button" class="cc-btn cc-btn-ouro cc-btn-pequeno" data-decor="' + d.id + '"' + ((reqOk && estado.moedas >= d.custo) ? '' : ' disabled') + '>' +
                (reqOk ? 'Comprar (' + fmt(d.custo) + ')' : 'Requer ' + ESTABELECIMENTOS[d.reqEstab].nome) + '</button>')) +
      '</article>';
    }).join('');
  }

  /* ---------- 4. EQUIPAMENTOS APRIMORÁVEIS ---------- */
  var EQUIPAMENTOS = [
    { id: 'fogao', nome: 'Fogão de Alta Chama', icone: 'fa-fire', custoBase: 4000, cresc: 1.85, max: 15, desc: '+15% no valor de receitas de Lanches e Carnes por nível.' },
    { id: 'forno', nome: 'Forno Combinado', icone: 'fa-temperature-high', custoBase: 6500, cresc: 1.85, max: 15, desc: '+15% no valor de Massas, Café da Manhã e Sobremesas por nível.' },
    { id: 'geladeira', nome: 'Câmara Fria & Geladeira', icone: 'fa-snowflake', custoBase: 9000, cresc: 1.9, max: 12, desc: '+12% de rendimento ao comprar ingredientes nos Fornecedores.' },
    { id: 'bancada', nome: 'Bancada Ergonômica', icone: 'fa-table-cells-large', custoBase: 12000, cresc: 1.9, max: 12, desc: 'Reduz em 4% os toques necessários para concluir pratos por nível.' },
    { id: 'utensilios', nome: 'Kit de Utensílios de Precisão', icone: 'fa-kitchen-set', custoBase: 15000, cresc: 1.95, max: 12, desc: '+1.5% de chance de Prato Perfeito (Crítico) por nível.' }
  ];

  function equipNivel(id) { return (estado.equipamentos && estado.equipamentos[id]) || 0; }
  function equipCusto(eq) { return Math.floor(eq.custoBase * Math.pow(eq.cresc, equipNivel(eq.id))); }

  function aprimorarEquipamento(id) {
    var eq = EQUIPAMENTOS.filter(function (e) { return e.id === id; })[0];
    if (!eq) { return; }
    var nv = equipNivel(id);
    if (nv >= eq.max) { return; }
    var custo = acessoTotal() ? 0 : equipCusto(eq);
    if (estado.moedas < custo) {
      if (Som) { Som.erro(); }
      aviso('Moedas insuficientes para aprimorar ' + eq.nome + '.');
      return;
    }
    estado.moedas -= custo;
    estado.equipamentos[id] = nv + 1;
    if (Som) { Som.comprar(); }
    calcular();
    verificarConquistas();
    renderTudo();
    salvar();
    mostrarToast('🔧 ' + eq.nome + ' aprimorado para Nível ' + (nv + 1) + '!');
  }

  function renderEquipamentos() {
    $('cc-equipamentos-lista').innerHTML = EQUIPAMENTOS.map(function (eq) {
      var nv = equipNivel(eq.id);
      var cheio = nv >= eq.max;
      var custo = equipCusto(eq);
      var pode = !cheio && (acessoTotal() || estado.moedas >= custo);
      return '<article class="cc-card-gestao' + (nv > 0 ? ' ativo' : '') + '">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
            '<h4 style="margin:0; font-size:1.05rem;"><i class="fa-solid ' + eq.icone + '"></i> ' + esc(eq.nome) + '</h4>' +
            '<span class="cc-tag-pill">Nível ' + nv + '/' + eq.max + '</span>' +
          '</div>' +
          '<p style="margin:6px 0; font-size:0.9rem; color:var(--texto-suave);">' + esc(eq.desc) + '</p>' +
        '</div>' +
        (cheio
          ? '<button type="button" class="cc-btn cc-btn-pequeno" disabled>Equipamento no Máximo</button>'
          : '<button type="button" class="cc-btn cc-btn-claro cc-btn-pequeno" data-equip="' + eq.id + '"' + (pode ? '' : ' disabled') + '>Aprimorar (' + (acessoTotal() ? 'Grátis' : fmt(custo)) + ')</button>') +
      '</article>';
    }).join('');
  }

  /* ---------- 5. FORNECEDORES & INGREDIENTES ---------- */
  var FORNECEDORES = [
    { id: 'fazenda', nome: 'Fazenda Horta Viva', ingId: 'organicos', ingNome: 'Vegetais & Ervas Frescas', icone: 'fa-carrot', custoLote: 1200, loteQtd: 5, bonusDesc: 'Cada unidade usada dá +50% de valor no prato concluído.' },
    { id: 'acougue', nome: 'Açougue Corte Nobre', ingId: 'carnes_nobres', ingNome: 'Cortes Selecionados', icone: 'fa-drumstick-bite', custoLote: 6500, loteQtd: 5, bonusDesc: 'Potencializa Carnes e Lanches (+80% no prato).' },
    { id: 'peixaria', nome: 'Peixaria Maré Alta', ingId: 'frutos_mar', ingNome: 'Peixes & Frutos do Mar', icone: 'fa-fish', custoLote: 18000, loteQtd: 4, bonusDesc: 'Essencial para Comida Japonesa e Pratos Sofisticados (+100%).' },
    { id: 'oriental_mkt', nome: 'Empório do Oriente', ingId: 'especiarias', ingNome: 'Especiarias & Caldos Raros', icone: 'fa-pepper-hot', custoLote: 45000, loteQtd: 4, bonusDesc: 'Multiplica combos e pratos orientais (+120%).' },
    { id: 'confeitaria_fina', nome: 'Atelier do Cacau & Trufas', ingId: 'trufas', ingNome: 'Trufas & Baunilha Pura', icone: 'fa-gem', custoLote: 150000, loteQtd: 3, bonusDesc: 'Ingrediente de elite para Sobremesas e Alta Gastronomia (+160%).' }
  ];

  function qtdIngrediente(ingId) { return (estado.ingredientes && estado.ingredientes[ingId]) || 0; }
  function nivelFornecedor(id) { return (estado.fornecedoresNivel && estado.fornecedoresNivel[id]) || 1; }

  function comprarInsumoFornecedor(id) {
    var forn = FORNECEDORES.filter(function (f) { return f.id === id; })[0];
    if (!forn) { return; }
    var nv = nivelFornecedor(id);
    var custo = acessoTotal() ? 0 : Math.floor(forn.custoLote * (1 + (nv - 1) * 0.25));
    if (estado.moedas < custo) {
      if (Som) { Som.erro(); }
      aviso('Moedas insuficientes para encomendar de ' + forn.nome + '.');
      return;
    }
    estado.moedas -= custo;
    var multGeladeira = 1 + equipNivel('geladeira') * 0.12;
    var ganhoQtd = Math.max(1, Math.round(forn.loteQtd * multGeladeira * (1 + (nv - 1) * 0.2)));
    estado.ingredientes[forn.ingId] = qtdIngrediente(forn.ingId) + ganhoQtd;
    estado.fornecedorCompras = estado.fornecedorCompras || {};
    estado.fornecedorCompras[id] = (estado.fornecedorCompras[id] || 0) + 1;
    if (estado.fornecedorCompras[id] % 5 === 0) {
      estado.fornecedoresNivel[id] = nv + 1;
      mostrarToast('🚚 ' + forn.nome + ' subiu para Nível ' + (nv + 1) + '!');
    } else {
      mostrarToast('🧺 +' + ganhoQtd + ' ' + forn.ingNome + ' na despensa!');
    }
    if (Som) { Som.comprar(); }
    renderFornecedores();
    salvar();
  }

  function renderFornecedores() {
    var totalItens = 0;
    FORNECEDORES.forEach(function (f) { totalItens += qtdIngrediente(f.ingId); });
    $('cc-despensa-resumo').innerHTML = '<span><i class="fa-solid fa-boxes-stacked"></i> Estoque Total na Despensa: <strong>' + totalItens + ' ingredientes</strong> (consumidos automaticamente 1 por prato para turbinar os ganhos!)</span>';

    $('cc-fornecedores-lista').innerHTML = FORNECEDORES.map(function (f) {
      var nv = nivelFornecedor(f.id);
      var estoque = qtdIngrediente(f.ingId);
      var custo = Math.floor(f.custoLote * (1 + (nv - 1) * 0.25));
      var multGeladeira = 1 + equipNivel('geladeira') * 0.12;
      var ganhoQtd = Math.max(1, Math.round(f.loteQtd * multGeladeira * (1 + (nv - 1) * 0.2)));
      var pode = acessoTotal() || estado.moedas >= custo;

      return '<article class="cc-card-gestao' + (estoque > 0 ? ' ativo' : '') + '">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
            '<h3 style="margin:0; font-size:1.08rem;"><i class="fa-solid ' + f.icone + '"></i> ' + esc(f.nome) + '</h3>' +
            '<span class="cc-tag-pill">Parceria Nv.' + nv + '</span>' +
          '</div>' +
          '<p style="margin:6px 0; font-weight:700; color:var(--verde-900);">Insumo: ' + esc(f.ingNome) + ' (Estoque: ' + estoque + ')</p>' +
          '<p style="margin:0; font-size:0.9rem; color:var(--texto-suave);">' + esc(f.bonusDesc) + '</p>' +
        '</div>' +
        '<button type="button" class="cc-btn cc-btn-claro cc-btn-pequeno" data-fornecedor="' + f.id + '"' + (pode ? '' : ' disabled') + '>' +
          'Encomendar +' + ganhoQtd + ' (' + (acessoTotal() ? 'Grátis' : fmt(custo)) + ')' +
        '</button>' +
      '</article>';
    }).join('');
  }

  /* ---------- 6. EQUIPE & SINERGIAS ---------- */
  var FUNCIONARIOS = [
    { id: 'ajudante_brigada', nome: 'Ajudante de Praça', icone: 'fa-hands-bubbles', reqEstab: 0, custoBase: 500, cresc: 1.45, max: 25, desc: '+8% no ganho por toque e +4% na velocidade de preparo por nível.' },
    { id: 'cozinheiro', nome: 'Cozinheiro de Linha', icone: 'fa-fire-burner', reqEstab: 1, custoBase: 8000, cresc: 1.5, max: 25, desc: '+12% de ganho passivo por segundo por nível.' },
    { id: 'garcom', nome: 'Garçom Atencioso', icone: 'fa-bell-concierge', reqEstab: 1, custoBase: 12000, cresc: 1.55, max: 20, desc: '+10% de gorjeta, +0.08★ Reputação e atende clientes do salão automaticamente!' },
    { id: 'sous_chef', nome: 'Sous-chef Executivo', icone: 'fa-user-tie', reqEstab: 2, custoBase: 150000, cresc: 1.6, max: 20, desc: '+18% em TODOS os ganhos e acelera o progresso das receitas.' },
    { id: 'gerente', nome: 'Gerente de Salão', icone: 'fa-clipboard-user', reqEstab: 2, custoBase: 400000, cresc: 1.65, max: 15, desc: '+20% de eficiência da equipe e +12% de renda offline por nível.' },
    { id: 'especialista', nome: 'Chef Especialista', icone: 'fa-award', reqEstab: 3, custoBase: 5000000, cresc: 1.75, max: 15, desc: '+25% no valor de pratos concluídos e +1.5% de chance de crítico.' }
  ];

  var SINERGIAS_EQUIPE = [
    { id: 'sin_linha_quente', nome: 'Linha Quente Sincronizada', req: { ajudante_brigada: 3, cozinheiro: 2 }, desc: '3+ Ajudantes e 2+ Cozinheiros: +25% em todos os ganhos da cozinha!' },
    { id: 'sin_salao_impecavel', nome: 'Salão Impecável', req: { garcom: 3, gerente: 1 }, desc: '3+ Garçons e 1+ Gerente: +40% de gorjetas e clientes 30% mais pacientes!' },
    { id: 'sin_comando_elite', nome: 'Comando de Alta Cozinha', req: { cozinheiro: 5, sous_chef: 2 }, desc: '5+ Cozinheiros e 2+ Sous-chefs: +45% de produção passiva por segundo!' },
    { id: 'sin_academia_estrelada', nome: 'Brigada Estrelada Completa', req: { sous_chef: 3, gerente: 2, especialista: 2 }, desc: '3+ Sous-chefs, 2+ Gerentes e 2+ Especialistas: +80% no valor de todas as receitas!' }
  ];

  function sinergiaAtiva(sin) {
    if (acessoTotal()) { return true; }
    return Object.keys(sin.req).every(function (k) { return equipeNivel(k) >= sin.req[k]; });
  }

  function equipeNivel(id) { return (estado.equipe && estado.equipe[id]) || 0; }
  function equipeCusto(f) { return Math.floor(f.custoBase * Math.pow(f.cresc, equipeNivel(f.id))); }

  function contratarEquipe(id) {
    var f = FUNCIONARIOS.filter(function (x) { return x.id === id; })[0];
    if (!f) { return; }
    if (estabIndiceAtual() < f.reqEstab && !acessoTotal()) {
      if (Som) { Som.erro(); }
      aviso('Expanda o restaurante para "' + ESTABELECIMENTOS[f.reqEstab].nome + '" para contratar este cargo.');
      return;
    }
    var nv = equipeNivel(id);
    if (nv >= f.max) { return; }
    var custo = acessoTotal() ? 0 : equipeCusto(f);
    if (estado.moedas < custo) {
      if (Som) { Som.erro(); }
      aviso('Moedas insuficientes para contratar ' + f.nome + '.');
      return;
    }
    estado.moedas -= custo;
    estado.equipe[id] = nv + 1;
    if (f.id === 'garcom') {
      alterarReputacao(0.08, 'Contratação de Garçom Atencioso (+0.08★)');
    }
    if (Som) { Som.comprar(); }
    calcular();
    verificarConquistas();
    renderTudo();
    salvar();
    mostrarToast('👨‍🍳 ' + f.nome + ' contratado (Nível ' + (nv + 1) + ')!');
  }

  function renderEquipe() {
    var totalFunc = 0;
    FUNCIONARIOS.forEach(function (f) { totalFunc += equipeNivel(f.id); });
    var sinAtivas = SINERGIAS_EQUIPE.filter(sinergiaAtiva).length;
    $('cc-equipe-resumo').textContent = 'Brigada total: ' + totalFunc + ' profissionais • Sinergias ativas: ' + sinAtivas + '/' + SINERGIAS_EQUIPE.length + ' • Eficiência da equipe: +' + pct(S.bonusEquipeMult || 0) + '.';

    $('cc-sinergias-lista').innerHTML = SINERGIAS_EQUIPE.map(function (sin) {
      var ok = sinergiaAtiva(sin);
      return '<article class="cc-card-gestao' + (ok ? ' atual-estab' : ' bloqueado') + '">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">' +
            '<h4 style="margin:0; font-size:1rem;">' + esc(sin.nome) + '</h4>' +
            '<span class="cc-tag-pill">' + (ok ? 'Ativa ✔' : 'Inativa') + '</span>' +
          '</div>' +
          '<p style="margin:6px 0 0; font-size:0.88rem; color:var(--texto-suave);">' + esc(sin.desc) + '</p>' +
        '</div>' +
      '</article>';
    }).join('');

    $('cc-lista-equipe').innerHTML = FUNCIONARIOS.map(function (f) {
      var nv = equipeNivel(f.id);
      var liberado = estabIndiceAtual() >= f.reqEstab || acessoTotal();
      var cheio = nv >= f.max;
      var custo = equipeCusto(f);
      var pode = liberado && !cheio && (acessoTotal() || estado.moedas >= custo);
      var cls = 'cc-card-gestao' + (nv > 0 ? ' ativo' : (!liberado ? ' bloqueado' : ''));

      return '<article class="' + cls + '">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:6px;">' +
            '<h3 style="margin:0; font-size:1.1rem;"><i class="fa-solid ' + f.icone + '"></i> ' + esc(f.nome) + '</h3>' +
            '<span class="cc-tag-pill">Nível ' + nv + '/' + f.max + '</span>' +
          '</div>' +
          '<p style="margin:0 0 6px; font-size:0.9rem; color:var(--texto-suave);">' + esc(f.desc) + '</p>' +
          (!liberado ? '<small style="color:var(--erro-texto); font-weight:700;">Requer: ' + esc(ESTABELECIMENTOS[f.reqEstab].nome) + '</small>' : '') +
        '</div>' +
        (cheio
          ? '<button type="button" class="cc-btn cc-btn-pequeno" disabled>Equipe no Máximo</button>'
          : '<button type="button" class="cc-btn cc-btn-claro cc-btn-pequeno" data-contratar="' + f.id + '"' + (pode ? '' : ' disabled') + '>' +
            (!liberado ? 'Bloqueado' : 'Contratar (' + (acessoTotal() ? 'Grátis' : fmt(custo)) + ')') + '</button>') +
      '</article>';
    }).join('');
  }

  /* ---------- 7. RECEITAS EXPANDIDAS (18 PRATOS), SECRETAS & MAESTRIAS ---------- */
  var CATEGORIAS_PRATO = [
    { id: 'cafe', nome: 'Café da Manhã', icone: 'fa-mug-hot' },
    { id: 'lanches', nome: 'Lanches', icone: 'fa-burger' },
    { id: 'massas', nome: 'Massas', icone: 'fa-bowl-food' },
    { id: 'japonesa', nome: 'Comida Japonesa', icone: 'fa-fish' },
    { id: 'carnes', nome: 'Carnes', icone: 'fa-drumstick-bite' },
    { id: 'sobremesas', nome: 'Sobremesas', icone: 'fa-ice-cream' },
    { id: 'sofisticados', nome: 'Pratos Sofisticados', icone: 'fa-wine-glass' }
  ];

  var PRATOS = [
    { id: 'torrada', cat: 'cafe', reqEstab: 0, nome: 'Torrada com Manteiga Dourada', icone: 'fa-bread-slice', toques: 6, multRecompensa: 2.5, desc: 'Simples, crocante e pronta num instante.' },
    { id: 'panqueca', cat: 'cafe', reqEstab: 0, nome: 'Panqueca Americana com Mel', icone: 'fa-pancakes', toques: 12, multRecompensa: 5.5, desc: 'Massa fofinha empilhada com calda quente.' },
    { id: 'croissant_queijo', cat: 'cafe', reqEstab: 0, nome: 'Croissant Folhado com Queijo Brie', icone: 'fa-bread-slice', toques: 15, multRecompensa: 7.2, desc: 'Massa folhada amanteigada assada na hora.' },
    { id: 'hamburguer', cat: 'lanches', reqEstab: 0, nome: 'Hambúrguer Artesanal da Casa', icone: 'fa-burger', toques: 18, multRecompensa: 9.0, desc: 'Pão brioche selado, queijo derretido e molho especial.' },
    { id: 'sanduiche_club', cat: 'lanches', reqEstab: 1, nome: 'Sanduíche Club Triplo', icone: 'fa-burger', toques: 22, multRecompensa: 11.5, desc: 'Três camadas crocantes com frango grelhado e ervas.' },
    { id: 'espaguete', cat: 'massas', reqEstab: 0, nome: 'Espaguete ao Sugo da Nonna', icone: 'fa-bowl-food', toques: 25, multRecompensa: 14.0, desc: 'Tomates frescos cozidos lentamente com manjericão.' },
    { id: 'nhoque_pesto', cat: 'massas', reqEstab: 1, nome: 'Nhoque Artesanal ao Pesto Genovês', icone: 'fa-bowl-food', toques: 28, multRecompensa: 17.0, desc: 'Nhoque leve de batata salteado com manjericão e pinoli.' },
    { id: 'combo_sushi', cat: 'japonesa', reqEstab: 1, nome: 'Combinado Salmão Fresco', icone: 'fa-fish', toques: 32, multRecompensa: 20.0, desc: 'Cortes precisos de salmão, nigiris e uramakis.' },
    { id: 'ramen', cat: 'japonesa', reqEstab: 1, nome: 'Ramen Tonkotsu Especial', icone: 'fa-bowl-rice', toques: 40, multRecompensa: 28.0, desc: 'Caldo rico de 12 horas, ovo marinado e chashu.' },
    { id: 'picanha', cat: 'carnes', reqEstab: 2, nome: 'Picanha na Brasa com Alho', icone: 'fa-drumstick-bite', toques: 50, multRecompensa: 38.0, desc: 'Selada no ponto perfeito com crosta dourada.' },
    { id: 'costela_defumada', cat: 'carnes', reqEstab: 2, nome: 'Costela Suína Glaceada', icone: 'fa-drumstick-bite', toques: 56, multRecompensa: 44.0, desc: 'Assada lentamente por 6 horas com molho agridoce.' },
    { id: 'petit_gateau', cat: 'sobremesas', reqEstab: 2, nome: 'Petit Gâteau de Cacau Belga', icone: 'fa-ice-cream', toques: 60, multRecompensa: 50.0, desc: 'Bolinho quente de chocolate cremoso com sorvete de baunilha.' },
    { id: 'risoto_trufas', cat: 'sofisticados', reqEstab: 3, nome: 'Risoto de Trufas Negras', icone: 'fa-plate-wheat', toques: 75, multRecompensa: 70.0, desc: 'Arroz arbóreo cremoso finalizado com lascas de trufa.' },
    { id: 'wellington', cat: 'sofisticados', reqEstab: 3, nome: 'Filé Wellington Imperial', icone: 'fa-crown', toques: 95, multRecompensa: 100.0, desc: 'O ápice da alta gastronomia em massa folhada dourada.' },

    /* Receitas Secretas */
    { id: 'sec_omelete_ouro', secreta: true, cat: 'cafe', reqEstab: 0, nome: 'Omelete Dourado do Alvorecer', icone: 'fa-sun', toques: 15, multRecompensa: 18.0, dica: 'Desbloqueada ao alcançar Combo 25+ ou 50 receitas preparadas.', cond: function () { return (estado.maiorCombo || 0) >= 25 || (estado.pratosConcluidos || 0) >= 50; }, desc: 'Receita Secreta: ovos cremosos batidos com ervas raras.' },
    { id: 'sec_ramen_dragao', secreta: true, cat: 'japonesa', reqEstab: 1, nome: 'Ramen do Dragão Imperial', icone: 'fa-dragon', toques: 35, multRecompensa: 48.0, dica: 'Desbloqueada ao atingir Reputação 3.0★ ou 10 clientes atendidos no salão.', cond: function () { return (estado.reputacao || 1) >= 3.0 || (estado.clientesAtendidos || 0) >= 10; }, desc: 'Receita Secreta: caldo picante lendário com especiarias do Oriente.' },
    { id: 'sec_sufle_celestial', secreta: true, cat: 'sobremesas', reqEstab: 2, nome: 'Suflê Celestial de Trufas', icone: 'fa-wand-magic-sparkles', toques: 55, multRecompensa: 95.0, dica: 'Desbloqueada ao possuir 3+ decorações ou 3+ equipamentos aprimorados.', cond: function () { return ((estado.decoracoesDesbloqueadas || []).length >= 3) || (Object.keys(estado.equipamentos || {}).length >= 3); }, desc: 'Receita Secreta: nuvem doce que derrete na boca com toque de ouro.' },
    { id: 'sec_banquete_campeao', secreta: true, cat: 'sofisticados', reqEstab: 3, nome: 'Banquete Secreto do Campeão', icone: 'fa-trophy', toques: 80, multRecompensa: 180.0, dica: 'Desbloqueada ao vencer um Rival Gastronômico ou o Campeonato!', cond: function () { return ((estado.rivaisVencidos || []).length >= 1) || ((estado.campeonatoEtapa || 0) >= 1); }, desc: 'Receita Secreta: degustação exclusiva servida apenas pelos mestres campeões.' }
  ];

  function pratoDesbloqueado(p) {
    if (acessoTotal()) { return true; }
    if (p.secreta) {
      if (estado.receitasSecretasDesb && estado.receitasSecretasDesb.indexOf(p.id) >= 0) { return true; }
      if (p.cond && p.cond()) {
        estado.receitasSecretasDesb = estado.receitasSecretasDesb || [];
        estado.receitasSecretasDesb.push(p.id);
        return true;
      }
      return false;
    }
    return estabIndiceAtual() >= p.reqEstab;
  }

  function pratoAtualObj() {
    var id = estado.pratoAtual || 'torrada';
    var p = PRATOS.filter(function (x) { return x.id === id; })[0] || PRATOS[0];
    if (!pratoDesbloqueado(p)) { return PRATOS[0]; }
    return p;
  }

  function maestriaInfo(vezes) {
    if (vezes >= 25) { return { nivel: 3, nome: 'Ouro', cls: 'maestria-ouro', bonus: 0.50, prox: null }; }
    if (vezes >= 10) { return { nivel: 2, nome: 'Prata', cls: 'maestria-prata', bonus: 0.25, prox: 25 }; }
    if (vezes >= 3) { return { nivel: 1, nome: 'Bronze', cls: 'maestria-bronze', bonus: 0.10, prox: 10 }; }
    return { nivel: 0, nome: 'Aprendiz', cls: '', bonus: 0, prox: 3 };
  }

  function renderPainelPrato() {
    var sel = $('cc-prato-select');
    var atual = pratoAtualObj();
    var disp = PRATOS.filter(pratoDesbloqueado);
    var htmlOpts = disp.map(function (p) {
      var vezes = (estado.pratosFeitos && estado.pratosFeitos[p.id]) || 0;
      var m = maestriaInfo(vezes);
      return '<option value="' + p.id + '"' + (p.id === atual.id ? ' selected' : '') + '>' +
        (p.secreta ? '✨ ' : '') + esc(p.nome) + ' [' + m.nome + '] (' + p.toques + ' toques)</option>';
    }).join('');
    if (sel.innerHTML !== htmlOpts) {
      sel.innerHTML = htmlOpts;
    }
    sel.value = atual.id;

    var vezesAtual = (estado.pratosFeitos && estado.pratosFeitos[atual.id]) || 0;
    var mAtual = maestriaInfo(vezesAtual);
    var toquesReq = Math.max(3, Math.round(atual.toques * (1 - Math.min(0.48, equipNivel('bancada') * 0.04))));
    var prog = Math.min(toquesReq, estado.pratoProgresso || 0);
    var pctPrato = Math.min(100, Math.round((prog / toquesReq) * 100));

    $('cc-prato-desc').textContent = atual.desc + ' • Maestria ' + mAtual.nome + ' (+' + pct(mAtual.bonus) + ') • Progresso: ' + prog + '/' + toquesReq + ' toques.';
    $('cc-prato-barra').style.width = pctPrato + '%';
    $('cc-prato-barra').parentNode.setAttribute('aria-valuenow', String(pctPrato));
  }

  /* ---------- 8. SALÃO DE CLIENTES ATIVOS ---------- */
  var PERFIS_CLIENTE = [
    { tipo: 'comum', nome: 'Cliente Local', icone: 'fa-user', paciencia: 45, multMoeda: 1.4, repGanho: 0.03, desc: 'Aprecia uma boa refeição caseira.' },
    { tipo: 'apressado', nome: 'Executivo Apressado', icone: 'fa-bolt', paciencia: 24, multMoeda: 2.2, repGanho: 0.05, desc: 'Tem pouco tempo, mas paga gorjeta generosa!' },
    { tipo: 'exigente', nome: 'Gourmet Exigente', icone: 'fa-glasses', paciencia: 40, multMoeda: 2.6, repGanho: 0.07, desc: 'Exige prato preparado com carinho e alta qualidade.' },
    { tipo: 'recorrente', nome: 'Freguês Fiel', icone: 'fa-heart', paciencia: 55, multMoeda: 1.9, repGanho: 0.06, desc: 'Sempre volta quando é bem atendido!' },
    { tipo: 'vip', nome: 'Celebridade VIP', icone: 'fa-crown', paciencia: 35, multMoeda: 4.5, repGanho: 0.12, desc: 'Gasta fortunas e espalha fama pela cidade!' },
    { tipo: 'critico', nome: 'Crítico Gastronômico', icone: 'fa-pen-nib', paciencia: 38, multMoeda: 3.5, repGanho: 0.25, desc: 'Avalia seu restaurante para o guia oficial!' }
  ];

  var NOMES_CLIENTES = ['Lucas', 'Mariana', 'Sr. Alberto', 'Beatriz', 'Chef Gastão', 'Dona Helena', 'Rafael', 'Camila', 'Tio Chico', 'Valentina', 'Arthur', 'Sofia'];

  function gerarClienteAleatorio() {
    var dispPratos = PRATOS.filter(pratoDesbloqueado);
    var prato = dispPratos[Math.floor(Math.random() * dispPratos.length)] || PRATOS[0];
    var perfil = PERFIS_CLIENTE[Math.floor(Math.random() * PERFIS_CLIENTE.length)];
    var nome = NOMES_CLIENTES[Math.floor(Math.random() * NOMES_CLIENTES.length)];
    var bonusPaciencia = sinergiaAtiva(SINERGIAS_EQUIPE[1]) ? 1.3 : 1.0;
    var pacMax = Math.round(perfil.paciencia * bonusPaciencia);
    return {
      uid: 'cli_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
      nome: nome,
      perfil: perfil.tipo,
      perfilNome: perfil.nome,
      icone: perfil.icone,
      pratoId: prato.id,
      pratoNome: prato.nome,
      pacienciaMax: pacMax,
      pacienciaAtual: pacMax,
      multMoeda: perfil.multMoeda,
      repGanho: perfil.repGanho
    };
  }

  function garantirClientesSalao(forcarNovo) {
    estado.clientesSalao = estado.clientesSalao || [];
    var maxMesas = Math.min(4, 2 + Math.floor(estabIndiceAtual() / 2));
    if (forcarNovo) {
      if (estado.clientesSalao.length >= maxMesas) {
        mostrarToast('🪑 Todas as ' + maxMesas + ' mesas estão ocupadas no momento!');
        return;
      }
      estado.clientesSalao.push(gerarClienteAleatorio());
      if (Som) { Som.clique(); }
      renderSalaoClientes();
      return;
    }
    while (estado.clientesSalao.length < 2) {
      estado.clientesSalao.push(gerarClienteAleatorio());
    }
  }

  function atenderCliente(uid, automatico) {
    estado.clientesSalao = estado.clientesSalao || [];
    var idx = -1;
    for (var i = 0; i < estado.clientesSalao.length; i++) {
      if (estado.clientesSalao[i].uid === uid) { idx = i; break; }
    }
    if (idx < 0) { return; }
    var cli = estado.clientesSalao[idx];
    estado.clientesSalao.splice(idx, 1);

    var baseRecompensa = Math.max(25, (S.porClique * 12 + S.porSegundo * 4) * cli.multMoeda);
    estado.moedas += baseRecompensa;
    estado.totalGanho += baseRecompensa;
    estado.clientesAtendidos = (estado.clientesAtendidos || 0) + 1;
    alterarReputacao(cli.repGanho, 'Atendeu ' + cli.nome + ' (' + cli.perfilNome + ')');

    if (estado.pedidoEspecialAtivo && estado.pedidoEspecialAtivo.tipo === 'clientes') {
      estado.pedidoEspecialAtivo.prog = (estado.pedidoEspecialAtivo.prog || 0) + 1;
    }
    avancarMissaoDiaria('clientes', 1);

    if (!automatico) {
      if (Som) { Som.comprar(); }
      mostrarToast('🍽️ ' + cli.nome + ' atendido! +' + fmt(baseRecompensa) + ' moedas e +' + cli.repGanho.toFixed(2) + '★!');
    }
    garantirClientesSalao(false);
    verificarConquistas();
    renderTudo();
  }

  function atualizarSalaoTick(dt) {
    estado.clientesSalao = estado.clientesSalao || [];
    garantirClientesSalao(false);
    var garcons = equipeNivel('garcom');
    var mudou = false;

    for (var i = estado.clientesSalao.length - 1; i >= 0; i--) {
      var c = estado.clientesSalao[i];
      c.pacienciaAtual -= dt;
      if (garcons > 0 && c.pacienciaAtual <= c.pacienciaMax * 0.45 && Math.random() < (0.18 * garcons * dt)) {
        atenderCliente(c.uid, true);
        mudou = true;
        continue;
      }
      if (c.pacienciaAtual <= 0) {
        estado.clientesSalao.splice(i, 1);
        estado.clientesSalao.push(gerarClienteAleatorio());
        mudou = true;
      }
    }
    if (mudou && ui.aba === 'cozinhar') {
      renderSalaoClientes();
    }
  }

  function renderSalaoClientes() {
    var cont = $('cc-salao-clientes');
    if (!cont) { return; }
    var listaCli = estado.clientesSalao || [];
    cont.innerHTML = listaCli.map(function (c) {
      var pctPac = Math.max(0, Math.min(100, Math.round((c.pacienciaAtual / c.pacienciaMax) * 100)));
      var corBarra = pctPac < 30 ? '#dc2626' : (pctPac < 60 ? '#d97706' : 'var(--verde-700)');
      var est = Math.max(25, (S.porClique * 12 + S.porSegundo * 4) * c.multMoeda);
      return '<article class="cc-cliente-card ' + esc(c.perfil) + '">' +
        '<div>' +
          '<div class="cc-cliente-topo">' +
            '<strong><i class="fa-solid ' + c.icone + '"></i> ' + esc(c.nome) + '</strong>' +
            '<span class="cc-tag-pill">' + esc(c.perfilNome) + '</span>' +
          '</div>' +
          '<p style="margin:6px 0 4px; font-size:0.9rem;">Deseja: <strong>' + esc(c.pratoNome) + '</strong></p>' +
          '<small style="color:var(--texto-suave);">Gorjeta est.: +' + fmt(est) + ' | +' + c.repGanho.toFixed(2) + '★</small>' +
          '<div class="cc-paciencia-barra" title="Paciência do cliente">' +
            '<div class="cc-paciencia-fill" style="width:' + pctPac + '%; background:' + corBarra + ';"></div>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="cc-btn cc-btn-pequeno" data-atender-cliente="' + c.uid + '">Servir Pedido Agora</button>' +
      '</article>';
    }).join('');
  }

  /* ---------- 9. PEDIDOS ESPECIAIS, 3 MISSÕES DIÁRIAS & MODO DESAFIO ---------- */
  var CATALOGO_PEDIDOS_ESPECIAIS = [
    { id: 'pe_combo_20', titulo: 'Maratona de Ritmo', desc: 'Alcance um combo de toques seguidos sem quebrar.', tipo: 'combo', metas: [15, 30, 50], recompensaBase: 5000 },
    { id: 'pe_pratos_12', titulo: 'Banquete da Casa', desc: 'Prepare receitas completas na cozinha.', tipo: 'pratos', metas: [5, 12, 25], recompensaBase: 8000 },
    { id: 'pe_clientes_8', titulo: 'Hospitalidade Cinco Estrelas', desc: 'Atenda clientes satisfeitos no salão.', tipo: 'clientes', metas: [3, 7, 15], recompensaBase: 10000 }
  ];

  function garantirPedidoEspecial() {
    if (!estado.pedidoEspecialAtivo) {
      var escPed = CATALOGO_PEDIDOS_ESPECIAIS[Math.floor(Math.random() * CATALOGO_PEDIDOS_ESPECIAIS.length)];
      estado.pedidoEspecialAtivo = { id: escPed.id, tipo: escPed.tipo, prog: 0 };
    }
  }

  function resgatarPedidoEspecial() {
    garantirPedidoEspecial();
    var at = estado.pedidoEspecialAtivo;
    var def = CATALOGO_PEDIDOS_ESPECIAIS.filter(function (x) { return x.id === at.id; })[0] || CATALOGO_PEDIDOS_ESPECIAIS[0];
    var prog = at.prog || 0;
    var tier = prog >= def.metas[2] ? 3 : (prog >= def.metas[1] ? 2 : (prog >= def.metas[0] ? 1 : 0));
    if (tier === 0) {
      if (Som) { Som.erro(); }
      aviso('Alcance pelo menos a meta Bronze (' + def.metas[0] + ') para resgatar!');
      return;
    }
    var nomesTier = ['', 'Bronze', 'Prata', 'Ouro'];
    var multTier = [0, 1, 2.5, 6][tier];
    var premioMoedas = Math.max(def.recompensaBase * multTier, (S.porSegundo * 30 + S.porClique * 40) * multTier);
    estado.moedas += premioMoedas;
    estado.totalGanho += premioMoedas;
    estado.pedidosEspeciaisConcluidos = (estado.pedidosEspeciaisConcluidos || 0) + 1;
    alterarReputacao(0.10 * tier, 'Pedido Especial (' + nomesTier[tier] + ')');

    if (tier === 3) {
      estado.estrelas = (estado.estrelas || 0) + 1;
    }
    estado.pedidoEspecialAtivo = null;
    garantirPedidoEspecial();
    if (Som) { Som.caixa(tier === 3); }
    calcular();
    verificarConquistas();
    renderTudo();
    salvar();
    mostrarToast('🏅 Pedido Especial (' + nomesTier[tier] + ') resgatado! +' + fmt(premioMoedas) + ' moedas' + (tier === 3 ? ' e +1★!' : '!'));
  }

  /* 3 Missões Diárias */
  function dataHojeChave() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function garantirMissoesDiarias() {
    var hoje = dataHojeChave();
    if (!estado.missoesDiarias || estado.missoesDiarias.data !== hoje || !Array.isArray(estado.missoesDiarias.lista)) {
      estado.missoesDiarias = {
        data: hoje,
        lista: [
          { id: 'md_toques', titulo: 'Ritmo Matinal', desc: 'Cozinhe 80 vezes hoje.', tipo: 'toques', meta: 80, prog: 0, resgatado: false, premioEstrelas: 1 },
          { id: 'md_pratos', titulo: 'Cardápio do Dia', desc: 'Conclua 6 receitas completas hoje.', tipo: 'pratos', meta: 6, prog: 0, resgatado: false, premioEstrelas: 1 },
          { id: 'md_clientes', titulo: 'Salão Acolhedor', desc: 'Atenda 4 clientes no salão hoje.', tipo: 'clientes', meta: 4, prog: 0, resgatado: false, premioEstrelas: 2 }
        ]
      };
    }
  }

  function avancarMissaoDiaria(tipo, qtd) {
    garantirMissoesDiarias();
    estado.missoesDiarias.lista.forEach(function (m) {
      if (m.tipo === tipo && !m.resgatado) {
        m.prog = Math.min(m.meta, (m.prog || 0) + qtd);
      }
    });
  }

  function resgatarMissaoDiaria(id) {
    garantirMissoesDiarias();
    var m = estado.missoesDiarias.lista.filter(function (x) { return x.id === id; })[0];
    if (!m || m.resgatado || (m.prog || 0) < m.meta) { return; }
    m.resgatado = true;
    var premio = Math.max(8000, S.porSegundo * 40 + S.porClique * 60);
    estado.moedas += premio;
    estado.totalGanho += premio;
    estado.estrelas = (estado.estrelas || 0) + (m.premioEstrelas || 1);
    estado.fragmentosFusao = (estado.fragmentosFusao || 0) + 1;
    alterarReputacao(0.12, 'Missão Diária: ' + m.titulo);
    if (Som) { Som.caixa(true); }
    calcular();
    verificarConquistas();
    renderTudo();
    salvar();
    mostrarToast('📅 Missão "' + m.titulo + '" concluída! +' + fmt(premio) + ' moedas, +' + m.premioEstrelas + '★ e +1 Fragmento!');
  }

  var MODOS_DESAFIO = [
    { id: 'des_maos_fogo', nome: 'Mãos de Fogo (60s)', regra: 'Apenas ganhos por toque contam (produção passiva zerada por 60s), mas toques valem 3x!', meta: 50 },
    { id: 'des_sem_equipe', nome: 'Chef Solitário (60s)', regra: 'Bônus de equipe e ajudantes desativados por 60s. Mostre sua habilidade pura!', meta: 40 },
    { id: 'des_critico_extremo', nome: 'Precisão Cirúrgica (60s)', regra: 'Apenas toques críticos e pratos concluídos pontuam durante 60 segundos!', meta: 25 }
  ];

  function iniciarModoDesafio(id) {
    if (modoDesafioAtivo) {
      aviso('Já existe uma partida de Modo Desafio em andamento!');
      return;
    }
    var m = MODOS_DESAFIO.filter(function (x) { return x.id === id; })[0];
    if (!m) { return; }
    modoDesafioAtivo = { id: m.id, nome: m.nome, expiraMs: Date.now() + 60000, pontos: 0, meta: m.meta };
    calcular();
    mudarAba('cozinhar');
    if (Som) { Som.caixa(false); }
    mostrarToast('⏱️ Modo Desafio iniciado: ' + m.nome + '!');
  }

  function finalizarModoDesafio() {
    if (!modoDesafioAtivo) { return; }
    var d = modoDesafioAtivo;
    modoDesafioAtivo = null;
    $('cc-desafio-ativo-banner').hidden = true;
    calcular();

    estado.recordesDesafio = estado.recordesDesafio || {};
    var ant = estado.recordesDesafio[d.id] || 0;
    if (d.pontos > ant) { estado.recordesDesafio[d.id] = d.pontos; }

    if (d.pontos >= d.meta) {
      estado.desafiosVencidos = (estado.desafiosVencidos || 0) + 1;
      var premio = Math.max(25000, S.porSegundo * 60 + S.porClique * 100);
      estado.moedas += premio;
      estado.totalGanho += premio;
      alterarReputacao(0.20, 'Vitória no Modo Desafio: ' + d.nome);
      if (Som) { Som.caixa(true); }
      mostrarToast('🏆 Vitória no Modo Desafio (' + d.pontos + ' pts)! +' + fmt(premio) + ' moedas e +0.20★!');
    } else {
      if (Som) { Som.erro(); }
      mostrarToast('⏱️ Tempo esgotado no Modo Desafio (' + d.pontos + '/' + d.meta + ' pts). Tente novamente!');
    }
    renderTudo();
    salvar();
  }

  function renderPedidosEDesafios() {
    garantirPedidoEspecial();
    var at = estado.pedidoEspecialAtivo;
    var def = CATALOGO_PEDIDOS_ESPECIAIS.filter(function (x) { return x.id === at.id; })[0] || CATALOGO_PEDIDOS_ESPECIAIS[0];
    var prog = at.prog || 0;
    var tier = prog >= def.metas[2] ? 'Ouro 🥇' : (prog >= def.metas[1] ? 'Prata 🥈' : (prog >= def.metas[0] ? 'Bronze 🥉' : 'Em andamento'));

    $('cc-pedidos-especiais-lista').innerHTML =
      '<article class="cc-card-gestao atual-estab">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
            '<h4 style="margin:0; font-size:1.1rem;">' + esc(def.titulo) + '</h4>' +
            '<span class="cc-tag-pill">' + tier + '</span>' +
          '</div>' +
          '<p style="margin:6px 0; font-size:0.9rem; color:var(--texto-suave);">' + esc(def.desc) + '</p>' +
          '<p style="margin:0; font-weight:700;">Progresso: ' + prog + ' (Metas: Bronze ' + def.metas[0] + ' | Prata ' + def.metas[1] + ' | Ouro ' + def.metas[2] + ')</p>' +
        '</div>' +
        '<button type="button" id="cc-resgatar-pedido-esp" class="cc-btn cc-btn-ouro cc-btn-pequeno"' + (prog >= def.metas[0] ? '' : ' disabled') + '>Resgatar Recompensa</button>' +
      '</article>';

    garantirMissoesDiarias();
    $('cc-desafios-diarios-lista').innerHTML = estado.missoesDiarias.lista.map(function (md) {
      var pronto = (md.prog || 0) >= md.meta;
      return '<article class="cc-card-gestao' + (md.resgatado ? ' ativo' : (pronto ? ' atual-estab' : '')) + '">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
            '<h4 style="margin:0; font-size:1.05rem;">' + esc(md.titulo) + '</h4>' +
            '<span class="cc-tag-pill">' + (md.resgatado ? 'Concluído ✔' : (md.prog + '/' + md.meta)) + '</span>' +
          '</div>' +
          '<p style="margin:6px 0; font-size:0.9rem; color:var(--texto-suave);">' + esc(md.desc) + '</p>' +
          '<small style="font-weight:700; color:var(--estrela);">Recompensa: Moedas + ' + md.premioEstrelas + '★ + 1 Fragmento</small>' +
        '</div>' +
        '<button type="button" class="cc-btn cc-btn-pequeno" data-resgatar-diaria="' + md.id + '"' + ((pronto && !md.resgatado) ? '' : ' disabled') + '>' +
          (md.resgatado ? 'Resgatado' : (pronto ? 'Resgatar Missão' : 'Em Progresso')) + '</button>' +
      '</article>';
    }).join('');

    $('cc-modo-desafio-lista').innerHTML = MODOS_DESAFIO.map(function (m) {
      var rec = (estado.recordesDesafio && estado.recordesDesafio[m.id]) || 0;
      return '<article class="cc-card-gestao">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
            '<h4 style="margin:0; font-size:1.05rem;">' + esc(m.nome) + '</h4>' +
            '<span class="cc-tag-pill">Recorde: ' + rec + ' pts</span>' +
          '</div>' +
          '<p style="margin:6px 0; font-size:0.9rem; color:var(--texto-suave);">' + esc(m.regra) + '</p>' +
          '<small style="font-weight:700;">Meta de vitória: ' + m.meta + ' pontos</small>' +
        '</div>' +
        '<button type="button" class="cc-btn cc-btn-claro cc-btn-pequeno" data-iniciar-desafio="' + m.id + '"' + (modoDesafioAtivo ? ' disabled' : '') + '>Iniciar Partida (60s)</button>' +
      '</article>';
    }).join('');
  }

  /* ---------- 10. CAMPEONATOS & CONCORRENTES GASTRONÔMICOS ---------- */
  var ETAPAS_CAMPEONATO = [
    { etapa: 0, nome: 'Etapa 1: Classificatórias Regionais', reqRep: 1.8, reqPratos: 15, metaPontos: 40, premioEstrelas: 3, desc: 'Mostre consistência e agilidade para avançar à semifinal.' },
    { etapa: 1, nome: 'Etapa 2: Semifinal Nacional', reqRep: 3.0, reqPratos: 45, metaPontos: 80, premioEstrelas: 8, desc: 'Apenas os restaurantes mais bem avaliados chegam aqui.' },
    { etapa: 2, nome: 'Etapa 3: Grande Final Suprema', reqRep: 4.3, reqPratos: 100, metaPontos: 140, premioEstrelas: 20, desc: 'Conquiste o Troféu de Campeão Supremo (+35% global permanente)!' }
  ];

  var RIVAIS = [
    { id: 'riv_nonna', nome: 'Trattoria della Nonna', especialidade: 'Massas', reqRep: 1.6, metaPontos: 30, repPremio: 0.25, desc: 'Rival tradicional famoso pelo molho secreto de família.' },
    { id: 'riv_kyoto', nome: 'Kyoto Sushi Lab', especialidade: 'Comida Japonesa', reqRep: 2.5, metaPontos: 55, repPremio: 0.35, desc: 'Mestres do corte preciso e apresentação minimalista.' },
    { id: 'riv_brasa', nome: 'Casa Brasa Real', especialidade: 'Carnes', reqRep: 3.4, metaPontos: 90, repPremio: 0.45, desc: 'Churrascaria premiada com fila todos os dias.' },
    { id: 'riv_etoile', nome: 'Le Petit Étoile', especialidade: 'Alta Gastronomia', reqRep: 4.4, metaPontos: 135, repPremio: 0.60, desc: 'O restaurante mais sofisticado da capital.' }
  ];

  function iniciarDueloCampeonato(tipo, idAlvo, metaPontos, titulo, recompensaObj) {
    if (bossAtivo) {
      aviso('Já existe um duelo ou desafio em andamento!');
      return;
    }
    bossAtivo = {
      tipo: tipo,
      idAlvo: idAlvo,
      titulo: titulo,
      expiraMs: Date.now() + 30000,
      pontos: 0,
      meta: metaPontos,
      recompensa: recompensaObj
    };
    mudarAba('cozinhar');
    if (Som) { Som.caixa(false); }
    mostrarToast('⚔️ Duelo iniciado: ' + titulo + '! Cozinhe rápido por 30s!');
  }

  function renderCampeonatos() {
    var etapaAtual = estado.campeonatoEtapa || 0;
    var boxCamp = $('cc-campeonato-box');
    if (etapaAtual >= ETAPAS_CAMPEONATO.length) {
      boxCamp.innerHTML =
        '<h3 style="margin-top:0; color:var(--estrela);"><i class="fa-solid fa-crown"></i> Campeão Gastronômico Consagrado!</h3>' +
        '<p class="cc-texto">Você venceu todas as 3 etapas do Campeonato Gastronômico e possui o bônus permanente de <strong>+35% em todos os ganhos</strong>!</p>';
    } else {
      var et = ETAPAS_CAMPEONATO[etapaAtual];
      var okRep = (estado.reputacao || 1) >= et.reqRep;
      var okPratos = (estado.pratosConcluidos || 0) >= et.reqPratos;
      var pode = acessoTotal() || (okRep && okPratos);
      boxCamp.innerHTML =
        '<h3 style="margin-top:0;">' + esc(et.nome) + '</h3>' +
        '<p class="cc-texto">' + esc(et.desc) + '</p>' +
        '<p style="font-weight:700; font-size:0.92rem;">Requisitos: ' + (okRep ? '✔' : '•') + ' Reputação ' + et.reqRep.toFixed(1) + '★ | ' + (okPratos ? '✔' : '•') + ' ' + et.reqPratos + ' receitas preparadas.</p>' +
        '<button type="button" id="cc-btn-disputar-camp" class="cc-btn cc-btn-ouro"' + (pode ? '' : ' disabled') + '>Disputar Etapa (' + et.metaPontos + ' pts em 30s)</button>';
    }

    var vencidos = estado.rivaisVencidos || [];
    $('cc-rivais-lista').innerHTML = RIVAIS.map(function (r) {
      var jaVenceu = vencidos.indexOf(r.id) >= 0;
      var okRep = (estado.reputacao || 1) >= r.reqRep || acessoTotal();
      return '<article class="cc-card-gestao' + (jaVenceu ? ' atual-estab' : (!okRep ? ' bloqueado' : '')) + '">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
            '<h4 style="margin:0; font-size:1.08rem;">' + esc(r.nome) + '</h4>' +
            '<span class="cc-tag-pill">' + (jaVenceu ? 'Vencido ✔' : esc(r.especialidade)) + '</span>' +
          '</div>' +
          '<p style="margin:6px 0; font-size:0.9rem; color:var(--texto-suave);">' + esc(r.desc) + '</p>' +
          '<small style="font-weight:700;">Requer Reputação ' + r.reqRep.toFixed(1) + '★ • Prêmio: +' + r.repPremio.toFixed(2) + '★ & Moedas</small>' +
        '</div>' +
        '<button type="button" class="cc-btn cc-btn-claro cc-btn-pequeno" data-desafiar-rival="' + r.id + '"' + (okRep ? '' : ' disabled') + '>' +
          (jaVenceu ? 'Desafiar Novamente' : 'Desafiar Rival (' + r.metaPontos + ' pts)') + '</button>' +
      '</article>';
    }).join('');
  }

  /* ---------- 11. EVENTOS SAZONAIS, TEMPORADA & HISTÓRIA AMPLIADA ---------- */
  var EVENTOS_SAZONAIS = [
    { id: 'festival_primavera', nome: 'Festival da Primavera & Ervas Frescas', icone: 'fa-seedling', bonusClique: 0.25, bonusPassivo: 0.25, desc: 'Todos os ganhos da cozinha recebem +25% de bônus sazonal!' },
    { id: 'semana_gourmet', nome: 'Semana da Alta Gastronomia', icone: 'fa-wine-glass', bonusClique: 0.40, bonusPassivo: 0.15, desc: '+40% nos ganhos por toque e +15% na renda passiva!' },
    { id: 'feira_noturna', nome: 'Feira Gastronômica Noturna', icone: 'fa-moon', bonusClique: 0.15, bonusPassivo: 0.45, desc: '+45% na produção passiva de ajudantes e equipes!' },
    { id: 'copa_chefs', nome: 'Copa Mundial dos Chefs', icone: 'fa-trophy', bonusClique: 0.30, bonusPassivo: 0.30, desc: '+30% global em toda a cozinha durante o torneio!' }
  ];

  function eventoSazonalAtual() {
    var semana = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    return EVENTOS_SAZONAIS[semana % EVENTOS_SAZONAIS.length];
  }

  var TRILHA_TEMPORADA = [
    { id: 'temp_1', nivel: 1, nome: 'Primeiros Passos da Temporada', desc: 'Prepare 10 receitas completas.', meta: function () { return (estado.pratosConcluidos || 0) >= 10; }, premioTxt: '+2.500 moedas e +1★' },
    { id: 'temp_2', nivel: 2, nome: 'Salão Movimentado', desc: 'Atenda 8 clientes no salão.', meta: function () { return (estado.clientesAtendidos || 0) >= 8; }, premioTxt: '+15.000 moedas e +0.20★ Reputação' },
    { id: 'temp_3', nivel: 3, nome: 'Colecionador de Surpresas', desc: 'Abra 10 caixas de surpresa.', meta: function () { return (estado.caixasAbertas || 0) >= 10; }, premioTxt: '+75.000 moedas e +2★' },
    { id: 'temp_4', nivel: 4, nome: 'Expansão Comercial', desc: 'Alcance o estágio Restaurante Familiar.', meta: function () { return estabIndiceAtual() >= 2; }, premioTxt: '+500.000 moedas e +3★' },
    { id: 'temp_5', nivel: 5, nome: 'Mestre da Temporada', desc: 'Alcance Reputação 3.5★ e 50 receitas preparadas.', meta: function () { return (estado.reputacao || 1) >= 3.5 && (estado.pratosConcluidos || 0) >= 50; }, premioTxt: '+5.000.000 moedas e +5★' }
  ];

  function resgatarTemporada(id) {
    var item = TRILHA_TEMPORADA.filter(function (x) { return x.id === id; })[0];
    if (!item || !item.meta()) { return; }
    estado.temporadaResgatados = estado.temporadaResgatados || [];
    if (estado.temporadaResgatados.indexOf(id) >= 0) { return; }
    estado.temporadaResgatados.push(id);

    var idx = item.nivel;
    var moedasPremio = 2500 * Math.pow(6, idx - 1);
    estado.moedas += moedasPremio;
    estado.totalGanho += moedasPremio;
    estado.estrelas = (estado.estrelas || 0) + idx;
    alterarReputacao(0.15, 'Recompensa da Temporada: ' + item.nome);
    if (Som) { Som.caixa(true); }
    calcular();
    renderTudo();
    salvar();
    mostrarToast('🌟 Recompensa da Temporada resgatada: ' + item.premioTxt + '!');
  }

  function renderTemporada() {
    var ev = eventoSazonalAtual();
    $('cc-evento-detalhe').innerHTML =
      '<h3 style="margin-top:0;"><i class="fa-solid ' + ev.icone + '"></i> Evento Ativo: ' + esc(ev.nome) + '</h3>' +
      '<p class="cc-texto" style="margin-bottom:0;">' + esc(ev.desc) + '</p>';

    var resg = estado.temporadaResgatados || [];
    $('cc-lista-temporada').innerHTML = TRILHA_TEMPORADA.map(function (t) {
      var feito = t.meta();
      var ja = resg.indexOf(t.id) >= 0;
      return '<article class="cc-card-gestao' + (ja ? ' ativo' : (feito ? ' atual-estab' : '')) + '">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
            '<h4 style="margin:0; font-size:1.05rem;">Nível ' + t.nivel + ': ' + esc(t.nome) + '</h4>' +
            '<span class="cc-tag-pill">' + (ja ? 'Resgatado ✔' : (feito ? 'Pronto!' : 'Em andamento')) + '</span>' +
          '</div>' +
          '<p style="margin:6px 0; font-size:0.9rem; color:var(--texto-suave);">' + esc(t.desc) + '</p>' +
          '<small style="font-weight:700; color:var(--estrela);">Prêmio: ' + esc(t.premioTxt) + '</small>' +
        '</div>' +
        '<button type="button" class="cc-btn cc-btn-ouro cc-btn-pequeno" data-temp-resg="' + t.id + '"' + ((feito && !ja) ? '' : ' disabled') + '>' +
          (ja ? 'Concluído' : (feito ? 'Resgatar Prêmio' : 'Bloqueado')) + '</button>' +
      '</article>';
    }).join('');
  }

  /* 8 Capítulos de História */
  var CAPITULOS_HISTORIA = [
    { id: 'cap1', titulo: 'Capítulo 1: O Aroma da Calçada', req: function () { return true; }, texto: 'Tudo começou com uma pequena barraca, uma chapa quente e a vontade de servir comida feita com alma.' },
    { id: 'cap2', titulo: 'Capítulo 2: As Primeiras Portas', req: function () { return estabIndiceAtual() >= 1 || acessoTotal(); }, texto: 'Com os elogios dos primeiros clientes fiéis, você conquistou sua Lanchonete Fixa e formou sua primeira brigada.' },
    { id: 'cap3', titulo: 'Capítulo 3: Tradição em Família', req: function () { return estabIndiceAtual() >= 2 || acessoTotal(); }, texto: 'O Restaurante Familiar tornou-se o ponto de encontro favorito do bairro nos fins de semana.' },
    { id: 'cap4', titulo: 'Capítulo 4: O Brilho da Alta Cozinha', req: function () { return estabIndiceAtual() >= 3 || acessoTotal(); }, texto: 'Críticos renomados passaram a elogiar sua técnica refinada, elevando o restaurante ao patamar sofisticado.' },
    { id: 'cap5', titulo: 'Capítulo 5: Lenda Cinco Estrelas', req: function () { return estabIndiceAtual() >= 4 || acessoTotal(); }, texto: 'Hoje seu nome é sinônimo de excelência culinária, inspirando uma nova geração de chefs.' },
    { id: 'cap6', titulo: 'Capítulo 6: Companheiros da Cozinha', req: function () { return totalMascotesDesbloqueados() >= 4 || acessoTotal(); }, texto: 'Criaturas mágicas e mascotes encantados adotaram sua cozinha como lar, trazendo sorte e energia a cada receita.' },
    { id: 'cap7', titulo: 'Capítulo 7: Sabores Sem Fronteiras', req: function () { return totalFranquiasAbertas() >= 1 || acessoTotal(); }, texto: 'De Paris a Tóquio, suas franquias internacionais levam o tempero da sua cozinha aos quatro cantos do planeta.' },
    { id: 'cap8', titulo: 'Capítulo 8: Banquete entre as Estrelas', req: function () { return franquiaNivel('franq_orbital') >= 1 || (estado.prestigios || 0) >= 5 || acessoTotal(); }, texto: 'Com a Estação Gourmet Orbital em funcionamento, sua culinária transcendeu a Terra e conquistou o universo!' }
  ];

  /* ---------- 12. REPUTAÇÃO & HISTÓRICO ---------- */
  function alterarReputacao(delta, motivo) {
    var bonusSpec = (estado.especializacao === 'alta_gastronomia' && delta > 0) ? 1.25 : 1.0;
    var bonusTalento = 1 + (talentoComprado('rep_mestre') ? 0.30 : 0);
    var realDelta = delta * bonusSpec * bonusTalento;
    estado.reputacao = Math.max(1.0, Math.min(5.0, (estado.reputacao || 1.0) + realDelta));
    estado.historicoReputacao = estado.historicoReputacao || [];
    estado.historicoReputacao.unshift({
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      motivo: motivo,
      valor: estado.reputacao.toFixed(2) + '★'
    });
    if (estado.historicoReputacao.length > 15) {
      estado.historicoReputacao.length = 15;
    }
  }

  /* ---------- 13. PRESTÍGIO & ÁRVORE DE TALENTOS ---------- */
  var MARCOS_PRESTIGIO = [
    { id: 'mp_1', req: 1, nome: '1º Prestígio: Veterano', desc: 'Concede +10% permanente em todos os ganhos.' },
    { id: 'mp_3', req: 3, nome: '3º Prestígio: Mestre Renomado', desc: 'Concede +25% permanente e libera Franquias Globais.' },
    { id: 'mp_5', req: 5, nome: '5º Prestígio: Ícone da Gastronomia', desc: 'Concede +50% permanente e +15% de sorte nas caixas.' },
    { id: 'mp_10', req: 10, nome: '10º Prestígio: Lenda Imortal', desc: 'Dobra (+100%) todos os ganhos da cozinha para sempre!' }
  ];

  var ARVORE_TALENTOS = [
    { id: 'clq_1', ramo: 'maos', tier: 1, nome: 'Toque Ágil', desc: '+40% de moedas por clique.', custo: 1, req: null },
    { id: 'clq_2', ramo: 'maos', tier: 2, nome: 'Lâmina Dourada', desc: '+80% de moedas por clique.', custo: 3, req: 'clq_1' },
    { id: 'clq_3', ramo: 'maos', tier: 3, nome: 'Combo Infinito', desc: 'O multiplicador de combo cresce 2x mais rápido.', custo: 6, req: 'clq_2' },
    { id: 'clq_4', ramo: 'maos', tier: 4, nome: 'Crítico Devastador', desc: 'Prato Perfeito rende 12x em vez de 7x.', custo: 12, req: 'clq_3' },
    { id: 'clq_5', ramo: 'maos', tier: 5, nome: 'Mãos Divinas', desc: 'Multiplica o ganho por clique por 3x.', custo: 25, req: 'clq_4' },

    { id: 'aut_1', ramo: 'automacao', tier: 1, nome: 'Turnos Dobrados', desc: '+40% de moedas por segundo.', custo: 1, req: null },
    { id: 'aut_2', ramo: 'automacao', tier: 2, nome: 'Cozinha 24 Horas', desc: '+50% de ganho offline.', custo: 3, req: 'aut_1' },
    { id: 'aut_3', ramo: 'automacao', tier: 3, nome: 'Brigada Sincronizada', desc: '+100% de moedas por segundo.', custo: 6, req: 'aut_2' },
    { id: 'aut_4', ramo: 'automacao', tier: 4, nome: 'Chef Robótico', desc: '+3 toques automáticos por segundo.', custo: 12, req: 'aut_3' },
    { id: 'aut_5', ramo: 'automacao', tier: 5, nome: 'Império Automático', desc: 'Multiplica moedas por segundo por 3x.', custo: 25, req: 'aut_4' },

    { id: 'srt_1', ramo: 'sorte', tier: 1, nome: 'Olho Clínico', desc: '+15% de sorte nas caixas.', custo: 1, req: null },
    { id: 'srt_2', ramo: 'sorte', tier: 2, nome: 'Fornecedor VIP', desc: 'Caixas 15% mais baratas.', custo: 3, req: 'srt_1' },
    { id: 'srt_3', ramo: 'sorte', tier: 3, nome: 'Chuva Dourada', desc: 'Ingredientes Dourados aparecem com o dobro de frequência.', custo: 6, req: 'srt_2' },
    { id: 'srt_4', ramo: 'sorte', tier: 4, nome: 'Frenesi Prolongado', desc: 'Frenesi dura +10 segundos extras.', custo: 12, req: 'srt_3' },
    { id: 'srt_5', ramo: 'sorte', tier: 5, nome: 'Bênção Mítica', desc: 'Dobra a chance de itens Míticos e Lendários.', custo: 25, req: 'srt_4' },

    { id: 'imp_1', ramo: 'imperio', tier: 1, nome: 'Herança Inicial', desc: 'Começa cada Prestígio com 2.500 moedas.', custo: 2, req: null },
    { id: 'imp_2', ramo: 'imperio', tier: 2, nome: 'Brilho Estrelado', desc: 'Estrelas não gastas dão +25% em vez de +15%.', custo: 4, req: 'imp_1' },
    { id: 'imp_3', ramo: 'imperio', tier: 3, nome: 'Cardápio de Gala', desc: 'Receitas concluídas rendem o dobro.', custo: 8, req: 'imp_2' },
    { id: 'imp_4', ramo: 'imperio', tier: 4, nome: 'Fama Internacional', desc: '+30% no ganho de Reputação.', custo: 15, req: 'imp_3' },
    { id: 'rep_mestre', ramo: 'imperio', tier: 5, nome: 'Lenda Suprema', desc: 'Multiplica TODOS os ganhos por 2.5x.', custo: 30, req: 'imp_4' }
  ];

  var NOMES_RAMOS = {
    maos: { titulo: 'Mãos de Ouro', icone: 'fa-hand-sparkles' },
    automacao: { titulo: 'Automação', icone: 'fa-gears' },
    sorte: { titulo: 'Sorte & Eventos', icone: 'fa-clover' },
    imperio: { titulo: 'Império & Fama', icone: 'fa-crown' }
  };

  function talentoComprado(id) {
    if (acessoTotal()) { return true; }
    return estado.talentos && estado.talentos.indexOf(id) >= 0;
  }

  function comprarTalento(id) {
    var t = ARVORE_TALENTOS.filter(function (x) { return x.id === id; })[0];
    if (!t || talentoComprado(id)) { return; }
    if (t.req && !talentoComprado(t.req)) {
      if (Som) { Som.erro(); }
      aviso('Desbloqueie o talento anterior deste ramo primeiro!');
      return;
    }
    if ((estado.estrelas || 0) < t.custo) {
      if (Som) { Som.erro(); }
      aviso('Estrelas de Prestígio insuficientes!');
      return;
    }
    estado.estrelas -= t.custo;
    estado.talentos = estado.talentos || [];
    estado.talentos.push(id);
    if (Som) { Som.caixa(true); }
    calcular();
    verificarConquistas();
    renderTudo();
    salvar();
    mostrarToast('⭐ Talento desbloqueado: ' + t.nome + '!');
  }

  function estrelasAoPrestigiar() {
    var base = estado.totalGanhoNaRun || 0;
    if (base < META_BASE_PRESTIGIO) { return 0; }
    return Math.floor(Math.sqrt(base / META_BASE_PRESTIGIO));
  }

  function executarPrestigio() {
    var ganho = estrelasAoPrestigiar();
    if (ganho <= 0) {
      if (Som) { Som.erro(); }
      aviso('Acumule pelo menos ' + fmt(META_BASE_PRESTIGIO) + ' moedas nesta temporada para prestigiar.');
      return;
    }
    if (!window.confirm('Deseja fazer Prestígio agora?\n\nVocê ganhará +' + ganho + ' Estrelas de Prestígio!\nSuas moedas atuais e melhorias comuns serão reiniciadas, mas você manterá seu restaurante, franquias, mascotes, equipe, roupas, maestrias, reputação e árvore estrelada.')) {
      return;
    }
    estado.estrelas = (estado.estrelas || 0) + ganho;
    estado.prestigios = (estado.prestigios || 0) + 1;
    estado.totalGanhoNaRun = 0;
    estado.moedas = talentoComprado('imp_1') ? 2500 : 0;
    estado.upgrades = {};
    estado.pratoProgresso = 0;
    streakToques = 0;
    pedidoRelampagoAtivo = false;
    frenesiExpiraMs = 0;
    frenesiMult = 1;
    bossAtivo = null;
    modoDesafioAtivo = null;
    $('cc-boss-banner').hidden = true;
    $('cc-desafio-ativo-banner').hidden = true;

    if (Som) { Som.caixa(true); }
    dispararShake();
    calcular();
    verificarConquistas();
    renderTudo();
    salvar();
    mostrarToast('⭐ Prestígio realizado! Você ganhou +' + ganho + ' Estrelas!');
  }

  /* ---------- 14. MASCOTES & CONJUNTOS ---------- */
  function mascoteDesbloqueado(id) {
    if (acessoTotal()) { return true; }
    return estado.itens && estado.itens.indexOf('mascote|' + id) >= 0;
  }

  function totalMascotesDesbloqueados() {
    var c = 0;
    I.MASCOTES.forEach(function (m) { if (mascoteDesbloqueado(m.id)) { c++; } });
    return c;
  }

  function equiparMascote(id) {
    if (id && !mascoteDesbloqueado(id)) {
      if (Som) { Som.erro(); }
      aviso('Abra caixas para desbloquear este mascote primeiro!');
      return;
    }
    estado.mascoteEquipado = (estado.mascoteEquipado === id) ? null : id;
    if (Som) { Som.clique(); }
    calcular();
    renderTudo();
    salvar();
    if (estado.mascoteEquipado) {
      var m = I.obterMascote(estado.mascoteEquipado);
      mostrarToast('🐾 Mascote equipado no salão: ' + m.nome + '!');
    } else {
      mostrarToast('🐾 Mascote guardado na coleção.');
    }
  }

  function renderMascotes() {
    var tot = totalMascotesDesbloqueados();
    var eqObj = estado.mascoteEquipado ? I.obterMascote(estado.mascoteEquipado) : null;
    $('cc-mascotes-resumo').textContent = 'Mascotes colecionados: ' + tot + ' de ' + I.MASCOTES.length +
      (eqObj ? (' • Equipado no salão (bônus 2x): ' + eqObj.nome) : ' • Nenhum mascote equipado no momento.');

    var filtro = ui.filtroMascote || 'todas';
    var listaFiltrada = I.MASCOTES.filter(function (m) {
      if (filtro === 'todas') { return true; }
      return I.RARIDADES[m.raridade].id === filtro;
    });

    $('cc-lista-mascotes').innerHTML = listaFiltrada.map(function (m) {
      var rar = I.RARIDADES[m.raridade];
      var tem = mascoteDesbloqueado(m.id);
      var equipado = estado.mascoteEquipado === m.id;
      return '<article class="cc-mascote-card rar-' + rar.id + (tem ? '' : ' trancado') + (equipado ? ' equipado' : '') + '">' +
        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; gap:6px; margin-bottom:8px;">' +
            '<span class="cc-badge">' + rar.nome + '</span>' +
            '<span class="cc-tag-pill">' + esc(m.tema) + '</span>' +
          '</div>' +
          '<div class="cc-mascote-arte">' + m.svg() + '</div>' +
          '<h3 style="margin:10px 0 4px; font-size:1.05rem; text-align:center;">' + (tem ? esc(m.nome) : '??? (Mascote Oculto)') + '</h3>' +
          '<p style="margin:0 0 6px; font-size:0.86rem; color:var(--texto-suave); text-align:center;">' + (tem ? esc(m.desc) : 'Encontre este mascote abrindo caixas de surpresa!') + '</p>' +
          '<p style="margin:0; font-size:0.85rem; font-weight:800; color:var(--verde-900); text-align:center;">' + esc(m.bonusDesc) + '</p>' +
        '</div>' +
        '<button type="button" class="cc-btn cc-btn-pequeno' + (equipado ? ' cc-btn-ouro' : '') + '" data-equipar-mascote="' + m.id + '"' + (tem ? '' : ' disabled') + '>' +
          (!tem ? 'Bloqueado (Abra Caixas)' : (equipado ? 'Equipado no Salão ✔ (Guardar)' : 'Equipar no Salão (2x Bônus)')) +
        '</button>' +
      '</article>';
    }).join('');
  }

  function conjuntosAtivos() {
    var eq = estado.equipado || {};
    return I.CONJUNTOS.filter(function (c) {
      return Object.keys(c.req).every(function (cat) {
        if (!eq[cat]) { return false; }
        var p = String(eq[cat]).split('|');
        return p[1] === c.req[cat];
      });
    });
  }

  /* ---------- 15. LOJA DIÁRIA ROTATIVA ---------- */
  function obterItensLojaDiaria() {
    var hoje = dataHojeChave();
    if (!estado.lojaDiaria || estado.lojaDiaria.data !== hoje) {
      var candidatos = [];
      I.CATEGORIAS.forEach(function (c) {
        I.MODELOS[c.id].forEach(function (m) {
          m.cores.forEach(function (_, idx) {
            var k = I.chave(c.id, m.id, idx);
            if (!tem(k)) { candidatos.push(k); }
          });
        });
      });
      I.MASCOTES.forEach(function (msc) {
        var k = 'mascote|' + msc.id;
        if (!tem(k)) { candidatos.push(k); }
      });
      var escolhidos = [];
      while (escolhidos.length < 2 && candidatos.length > 0) {
        var rIdx = Math.floor(Math.random() * candidatos.length);
        escolhidos.push(candidatos.splice(rIdx, 1)[0]);
      }
      estado.lojaDiaria = { data: hoje, itens: escolhidos };
    }
    return estado.lojaDiaria.itens || [];
  }

  function comprarItemLojaDiaria(k) {
    var it = I.obter(k);
    if (!it || tem(k)) { return; }
    var preco = I.RARIDADES[it.raridade].valor * 12;
    if (acessoTotal()) { preco = 0; }
    if (estado.moedas < preco) {
      if (Som) { Som.erro(); }
      aviso('Você precisa de ' + fmt(preco) + ' moedas para adquirir este item na vitrine!');
      return;
    }
    estado.moedas -= preco;
    estado.itens.push(k);
    if (Som) { Som.caixa(it.raridade >= 4); }
    calcular();
    verificarConquistas();
    renderTudo();
    salvar();
    mostrarToast('🛍️ Item adquirido na Vitrine Diária: ' + it.nome + '!');
  }

  function renderLojaDiaria() {
    var cont = $('cc-loja-diaria-lista');
    if (!cont) { return; }
    var itens = obterItensLojaDiaria();
    if (!itens.length) {
      cont.innerHTML = '<p class="cc-texto">🎉 Parabéns! Você já possui todos os itens da coleção!</p>';
      return;
    }
    cont.innerHTML = itens.map(function (k) {
      var it = I.obter(k);
      if (!it) { return ''; }
      var rar = I.RARIDADES[it.raridade];
      var jaTem = tem(k);
      var preco = rar.valor * 12;
      var mini = it.cat === 'mascote' ? it.mascote.svg() : I.miniaturaSVG(it.cat, it.modelo.id, it.indice);
      return '<article class="cc-card-gestao rar-' + rar.id + (jaTem ? ' ativo' : '') + '" style="border-color:var(--rar);">' +
        '<div style="display:flex; align-items:center; gap:10px;">' +
          '<div class="cc-mini" style="width:56px; flex-shrink:0;">' + mini + '</div>' +
          '<div>' +
            '<span class="cc-badge">' + rar.nome + '</span>' +
            '<h4 style="margin:4px 0 0; font-size:0.98rem;">' + esc(it.nome) + '</h4>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="cc-btn cc-btn-ouro cc-btn-pequeno" data-comprar-vitrine="' + esc(k) + '"' + ((jaTem || (!acessoTotal() && estado.moedas < preco)) ? ' disabled' : '') + '>' +
          (jaTem ? 'Adquirido ✔' : 'Comprar (' + (acessoTotal() ? 'Grátis' : fmt(preco)) + ')') +
        '</button>' +
      '</article>';
    }).join('');
  }

  /* ---------- 16. CONQUISTAS EXPANDIDAS (36 CONQUISTAS) ---------- */
  var CONQUISTAS = [
    { id: 'c_toque1', nome: 'Primeiro Prato', desc: 'Cozinhe pela primeira vez.', icone: 'fa-utensils', ok: function () { return estado.cliques >= 1; } },
    { id: 'c_toque100', nome: 'Mão na Massa', desc: 'Cozinhe 100 vezes.', icone: 'fa-fire-burner', ok: function () { return estado.cliques >= 100; } },
    { id: 'c_toque1000', nome: 'Chef Incansável', desc: 'Cozinhe 1.000 vezes.', icone: 'fa-bolt', ok: function () { return estado.cliques >= 1000; } },
    { id: 'c_toque10k', nome: 'Mestre da Velocidade', desc: 'Cozinhe 10.000 vezes.', icone: 'fa-gauge-high', ok: function () { return estado.cliques >= 10000; } },
    { id: 'c_moeda1k', nome: 'Primeira Economia', desc: 'Acumule 1.000 moedas no total.', icone: 'fa-coins', ok: function () { return estado.totalGanho >= 1000; } },
    { id: 'c_moeda1m', nome: 'Milionário do Sabor', desc: 'Acumule 1 milhão de moedas no total.', icone: 'fa-sack-dollar', ok: function () { return estado.totalGanho >= 1e6; } },
    { id: 'c_moeda1b', nome: 'Bilionário Gastronômico', desc: 'Acumule 1 bilhão de moedas no total.', icone: 'fa-gem', ok: function () { return estado.totalGanho >= 1e9; } },
    { id: 'c_moeda1t', nome: 'Trilionário Imperial', desc: 'Acumule 1 trilhão de moedas no total.', icone: 'fa-crown', ok: function () { return estado.totalGanho >= 1e12; } },
    { id: 'c_upg1', nome: 'Primeiro Investimento', desc: 'Compre sua primeira melhoria.', icone: 'fa-cart-plus', ok: function () { return totalNiveisMelhorias() >= 1; } },
    { id: 'c_upg50', nome: 'Cozinha Equipada', desc: 'Tenha 50 níveis de melhorias.', icone: 'fa-kitchen-set', ok: function () { return totalNiveisMelhorias() >= 50; } },
    { id: 'c_upg250', nome: 'Fábrica Culinária', desc: 'Tenha 250 níveis de melhorias.', icone: 'fa-industry', ok: function () { return totalNiveisMelhorias() >= 250; } },
    { id: 'c_caixa1', nome: 'Surpresa na Cozinha', desc: 'Abra sua primeira caixa.', icone: 'fa-box-open', ok: function () { return estado.caixasAbertas >= 1; } },
    { id: 'c_caixa25', nome: 'Caçador de Caixas', desc: 'Abra 25 caixas de surpresa.', icone: 'fa-gifts', ok: function () { return estado.caixasAbertas >= 25; } },
    { id: 'c_caixa100', nome: 'Colecionador Compulsivo', desc: 'Abra 100 caixas de surpresa.', icone: 'fa-boxes-stacked', ok: function () { return estado.caixasAbertas >= 100; } },
    { id: 'c_fusao1', nome: 'Alquimia de Fragmentos', desc: 'Realize sua primeira fusão de repetidos.', icone: 'fa-wand-magic-sparkles', ok: function () { return (estado.fusoesRealizadas || 0) >= 1; } },
    { id: 'c_mascote1', nome: 'Amigo da Cozinha', desc: 'Desbloqueie seu primeiro Mascote.', icone: 'fa-paw', ok: function () { return totalMascotesDesbloqueados() >= 1; } },
    { id: 'c_mascote6', nome: 'Treinador de Mascotes', desc: 'Colecione 6 Mascotes diferentes.', icone: 'fa-shield-cat', ok: function () { return totalMascotesDesbloqueados() >= 6; } },
    { id: 'c_mascote12', nome: 'Zoo Gastronômico Completo', desc: 'Colecione todos os 12 Mascotes da Cozinha!', icone: 'fa-dragon', ok: function () { return totalMascotesDesbloqueados() >= I.MASCOTES.length; } },
    { id: 'c_franquia1', nome: 'Expansão Internacional', desc: 'Abra sua primeira Franquia Global de Endgame.', icone: 'fa-earth-americas', ok: function () { return totalFranquiasAbertas() >= 1; } },
    { id: 'c_franquia10', nome: 'Magnata das Franquias', desc: 'Alcance 10 níveis totais em Franquias Globais.', icone: 'fa-globe', ok: function () { return totalFranquiasAbertas() >= 10; } },
    { id: 'c_orbital', nome: 'Chef Espacial', desc: 'Inaugure a Estação Gourmet Orbital.', icone: 'fa-shuttle-space', ok: function () { return franquiaNivel('franq_orbital') >= 1; } },
    { id: 'c_estab_lanchonete', nome: 'Ponto Fixo', desc: 'Expanda para a Lanchonete Fixa.', icone: 'fa-burger', ok: function () { return estabIndiceAtual() >= 1; } },
    { id: 'c_estab_familiar', nome: 'Sucesso do Bairro', desc: 'Expanda para o Restaurante Familiar.', icone: 'fa-utensils', ok: function () { return estabIndiceAtual() >= 2; } },
    { id: 'c_estab_imperio', nome: 'Império Gastronômico', desc: 'Alcance o nível máximo de estabelecimento.', icone: 'fa-building-columns', ok: function () { return estabIndiceAtual() >= 5; } },
    { id: 'c_clientes15', nome: 'Anfitrião Exemplar', desc: 'Atenda 15 clientes no salão.', icone: 'fa-people-group', ok: function () { return (estado.clientesAtendidos || 0) >= 15; } },
    { id: 'c_clientes100', nome: 'Hospitalidade Lendária', desc: 'Atenda 100 clientes no salão.', icone: 'fa-heart', ok: function () { return (estado.clientesAtendidos || 0) >= 100; } },
    { id: 'c_rep4', nome: 'Estrela da Crítica', desc: 'Alcance 4.0★ de Reputação.', icone: 'fa-star', ok: function () { return (estado.reputacao || 1) >= 4.0; } },
    { id: 'c_rep5', nome: 'Perfeição Cinco Estrelas', desc: 'Alcance o máximo de 5.0★ de Reputação.', icone: 'fa-award', ok: function () { return (estado.reputacao || 1) >= 4.99; } },
    { id: 'c_rival1', nome: 'Vitória no Duelo', desc: 'Derrote um Restaurante Rival.', icone: 'fa-trophy', ok: function () { return (estado.rivaisVencidos || []).length >= 1; } },
    { id: 'c_camp_final', nome: 'Campeão Supremo', desc: 'Vença todas as 3 etapas do Campeonato.', icone: 'fa-medal', ok: function () { return (estado.campeonatoEtapa || 0) >= 3; } },
    { id: 'c_prest1', nome: 'Renascimento Culinário', desc: 'Realize seu primeiro Prestígio.', icone: 'fa-rotate', ok: function () { return (estado.prestigios || 0) >= 1; } },
    { id: 'c_prest5', nome: 'Lenda Eterna', desc: 'Realize 5 Prestígios.', icone: 'fa-infinity', ok: function () { return (estado.prestigios || 0) >= 5; } },
    { id: 'c_secreta1', nome: 'Receita Secreta!', desc: 'Descubra sua primeira Receita Secreta.', icone: 'fa-user-secret', ok: function () { return (estado.receitasSecretasDesb || []).length >= 1; } },
    { id: 'c_sinergia1', nome: 'Trabalho em Equipe', desc: 'Ative uma Sinergia de Equipe.', icone: 'fa-link', ok: function () { return SINERGIAS_EQUIPE.some(sinergiaAtiva); } },
    { id: 'c_combo30', nome: 'Mestre do Ritmo', desc: 'Alcance um combo de 30 toques seguidos.', icone: 'fa-bolt-lightning', ok: function () { return (estado.maiorCombo || 0) >= 30; } },
    { id: 'c_boss1', nome: 'Crítico Satisfeito', desc: 'Vença o Desafio do Crítico Gastronômico.', icone: 'fa-gavel', ok: function () { return (estado.bossVencidos || 0) >= 1; } }
  ];

  function totalNiveisMelhorias() {
    var soma = 0;
    U.UPGRADES.forEach(function (u) { soma += (estado.upgrades[u.id] || 0); });
    return soma;
  }

  function mostrarToast(texto) {
    var el = $('cc-toast');
    if (!el) { return; }
    el.textContent = texto;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 3800);
  }

  function verificarConquistas() {
    if (!estado) { return; }
    estado.conquistas = estado.conquistas || [];
    var novas = [];
    CONQUISTAS.forEach(function (c) {
      if (estado.conquistas.indexOf(c.id) < 0 && c.ok()) {
        estado.conquistas.push(c.id);
        novas.push(c);
      }
    });
    if (novas.length > 0) {
      if (Som) { Som.conquista(); }
      mostrarToast('🏆 Conquista desbloqueada: ' + novas[0].nome + (novas.length > 1 ? ' (+' + (novas.length - 1) + ')' : ''));
    }
  }

  /* ---------- 17. INICIALIZAÇÃO & CARREGAMENTO ---------- */
  function criarEstadoNovo() {
    return {
      moedas: 0, totalGanho: 0, totalGanhoNaRun: 0, cliques: 0, caixasAbertas: 0,
      upgrades: {}, itens: [],
      equipado: {
        rosto: I.INICIAIS.rosto, cabelo: I.INICIAIS.cabelo, chapeu: null,
        camisa: I.INICIAIS.camisa, calca: I.INICIAIS.calca, fundo: I.INICIAIS.fundo
      },
      mascoteEquipado: null,
      franquias: {},
      token: false, debugLiberado: false, debugAtivo: false, ultimoSalvo: Date.now(),
      conquistas: [], estrelas: 0, prestigios: 0, talentos: [],
      pratoAtual: 'torrada', pratoProgresso: 0, pratosFeitos: {}, pratosConcluidos: 0,
      maiorCombo: 0, bossVencidos: 0,
      estabelecimento: 'barraca',
      especializacao: 'nenhuma',
      decoracaoAtiva: 'classico',
      decoracoesDesbloqueadas: ['classico'],
      equipamentos: {},
      ingredientes: {},
      fornecedoresNivel: {},
      fornecedorCompras: {},
      equipe: {},
      reputacao: 1.0,
      historicoReputacao: [],
      clientesSalao: [],
      clientesAtendidos: 0,
      pedidoEspecialAtivo: null,
      pedidosEspeciaisConcluidos: 0,
      missoesDiarias: null,
      recordesDesafio: {},
      desafiosVencidos: 0,
      campeonatoEtapa: 0,
      rivaisVencidos: [],
      receitasSecretasDesb: [],
      temporadaResgatados: [],
      pityContador: 0,
      fragmentosFusao: 0,
      fusoesRealizadas: 0,
      tutorialPasso: 0,
      tutorialConcluido: false,
      lojaDiaria: null,
      historicoProducao: []
    };
  }

  function carregar() {
    var base = criarEstadoNovo();
    try {
      var bruto = window.localStorage.getItem(CHAVE_SALVO);
      if (bruto) {
        var s = JSON.parse(bruto);
        Object.keys(base).forEach(function (k) {
          if (s[k] !== undefined && s[k] !== null) { base[k] = s[k]; }
        });
        if (s.totalGanhoNaRun === undefined) { base.totalGanhoNaRun = base.totalGanho || 0; }
        Object.keys(I.INICIAIS).forEach(function (cat) {
          if (base.equipado[cat] === undefined) { base.equipado[cat] = I.INICIAIS[cat]; }
        });
      }
    } catch (e) {}
    estado = base;
    garantirClientesSalao(false);
    garantirPedidoEspecial();
    garantirMissoesDiarias();
    obterItensLojaDiaria();
  }

  function salvar() {
    try {
      estado.ultimoSalvo = Date.now();
      window.localStorage.setItem(CHAVE_SALVO, JSON.stringify(estado));
    } catch (e) {}
  }

  function acessoTotal() { return !!(estado.debugLiberado && estado.debugAtivo); }
  function nivel(id) { return estado.upgrades[id] || 0; }
  function tem(k) {
    if (!k) { return true; }
    if (acessoTotal()) { return true; }
    var p = String(k).split('|');
    if (p[0] === 'mascote') {
      return estado.itens.indexOf(k) >= 0;
    }
    return k === I.INICIAIS[p[0]] || estado.itens.indexOf(k) >= 0;
  }

  /* ---------- 18. CÁLCULOS DE PRODUÇÃO & MULTIPLICADORES ---------- */
  function calcular() {
    var cBase = 1, pBase = 0, mTudo = 1, mClique = 1, mPass = 1;
    var desc = 0, sorte = 0, caixaExtra = 0, refund = 0, crit = 0, off = 0, auto = 0, gorj = 0, fres = 0;

    U.UPGRADES.forEach(function (u) {
      var n = nivel(u.id);
      if (!n) { return; }
      var e = u.efeito;
      if (e.tipo === 'clique') { cBase += e.valor * n; }
      if (e.tipo === 'passivo') { pBase += e.valor * n; }
      if (e.tipo === 'mult') {
        if (e.alvo === 'tudo') { mTudo *= e.fator; }
        if (e.alvo === 'clique') { mClique *= e.fator; }
        if (e.alvo === 'passivo') { mPass *= e.fator; }
      }
      if (e.tipo === 'desconto') { desc += e.valor * n; }
      if (e.tipo === 'sorte') { sorte += e.valor * n; }
      if (e.tipo === 'caixaExtra') { caixaExtra += e.valor * n; }
      if (e.tipo === 'refund') { refund += e.valor * n; }
      if (e.tipo === 'critico') { crit += e.valor * n; }
      if (e.tipo === 'offline') { off += e.valor * n; }
      if (e.tipo === 'auto') { auto += e.valor * n; }
      if (e.tipo === 'gorjeta') { gorj += e.valor * n; }
      if (e.tipo === 'frescos') { fres += e.valor * n; }
    });

    /* Bônus de Mascotes */
    var bonusMascoteClique = 0;
    var bonusMascotePassivo = 0;
    var bonusMascoteSorte = 0;
    I.MASCOTES.forEach(function (m) {
      if (mascoteDesbloqueado(m.id)) {
        var multEq = (estado.mascoteEquipado === m.id) ? 2.0 : 1.0;
        var val = m.bonusValor * multEq;
        if (m.bonusTipo === 'clique' || m.bonusTipo === 'tudo') { bonusMascoteClique += val; }
        if (m.bonusTipo === 'passivo' || m.bonusTipo === 'tudo') { bonusMascotePassivo += val; }
        if (m.bonusTipo === 'sorte') { bonusMascoteSorte += val; }
      }
    });

    /* Bônus de Franquias Endgame */
    var passivoFranquias = 0;
    var bonusFranquiasMult = 0;
    FRANQUIAS_ENDGAME.forEach(function (f) {
      var nv = franquiaNivel(f.id);
      if (nv > 0) {
        passivoFranquias += f.passivoBase * nv;
        bonusFranquiasMult += f.multGlobal * nv;
      }
    });

    var bonusItens = 0;
    Object.keys(estado.equipado).forEach(function (cat) {
      var it = I.obter(estado.equipado[cat]);
      if (it) { bonusItens += I.RARIDADES[it.raridade].bonus; }
    });

    var sets = conjuntosAtivos();
    var bonusConjunto = 0;
    sets.forEach(function (s) { bonusConjunto += s.bonus; });
    if (estado.token) { bonusConjunto += CONJUNTO_MITICO; }

    /* Prestígio e Marcos */
    var bonusPorEstrela = talentoComprado('imp_2') ? 0.25 : BONUS_ESTRELA_PRESTIGIO;
    var bonusPrestigio = (estado.estrelas || 0) * bonusPorEstrela;
    var pCount = estado.prestigios || 0;
    var bonusMarcos = 0;
    if (pCount >= 1) { bonusMarcos += 0.10; }
    if (pCount >= 3) { bonusMarcos += 0.25; }
    if (pCount >= 5) { bonusMarcos += 0.50; sortBonusMarco(); }
    if (pCount >= 10) { bonusMarcos += 1.00; }
    function sortBonusMarco() { sorte += 0.15; }

    /* Estabelecimento, Especialização, Reputação e Campeonato */
    var bonusEstab = estabAtualObj().bonusGlobal || 0;
    var rep = estado.reputacao || 1.0;
    var bonusRep = Math.max(0, (rep - 1.0) * 0.25);
    var bonusCamp = (estado.campeonatoEtapa || 0) >= 3 ? 0.35 : 0;

    var spec = estado.especializacao || 'nenhuma';
    var multSpecClique = (spec === 'lanchonete_premium') ? 1.45 : 1.0;
    var multSpecPassivo = (spec === 'familiar') ? 1.40 : 1.0;

    /* Equipe e Sinergias */
    var gerenteMult = 1 + equipeNivel('gerente') * 0.20;
    var specOrientalMult = (spec === 'oriental') ? 1.25 : 1.0;
    var bonusEquipeClique = equipeNivel('ajudante_brigada') * 0.08 * gerenteMult;
    var bonusEquipePassivo = equipeNivel('cozinheiro') * 0.12 * gerenteMult;
    var bonusEquipeGlobal = equipeNivel('sous_chef') * 0.18 * gerenteMult;
    var bonusEquipeGorjeta = equipeNivel('garcom') * 0.10 * gerenteMult;

    if (sinergiaAtiva(SINERGIAS_EQUIPE[0])) { bonusEquipeGlobal += 0.25; }
    if (sinergiaAtiva(SINERGIAS_EQUIPE[1])) { bonusEquipeGorjeta += 0.40; }
    if (sinergiaAtiva(SINERGIAS_EQUIPE[2])) { bonusEquipePassivo += 0.45; }

    /* Talentos */
    if (talentoComprado('clq_1')) { mClique *= 1.4; }
    if (talentoComprado('clq_2')) { mClique *= 1.8; }
    if (talentoComprado('clq_5')) { mClique *= 3.0; }

    if (talentoComprado('aut_1')) { mPass *= 1.4; }
    if (talentoComprado('aut_3')) { mPass *= 2.0; }
    if (talentoComprado('aut_4')) { auto += 3.0; }
    if (talentoComprado('aut_5')) { mPass *= 3.0; }

    if (talentoComprado('srt_1')) { sorte += 0.15; }
    if (talentoComprado('srt_2')) { desc += 0.15; }
    if (talentoComprado('aut_2')) { off += 0.50; }
    if (talentoComprado('rep_mestre')) { mTudo *= 2.5; }

    crit += equipNivel('utensilios') * 0.015 + equipeNivel('especialista') * 0.015 * specOrientalMult;
    off += equipeNivel('gerente') * 0.12;
    gorj += bonusEquipeGorjeta + bonusRep;

    /* Evento Sazonal */
    var ev = eventoSazonalAtual();

    /* Modificadores do Modo Desafio */
    if (modoDesafioAtivo && modoDesafioAtivo.id === 'des_sem_equipe') {
      pBase = 0; bonusEquipeClique = 0; bonusEquipePassivo = 0; bonusEquipeGlobal = 0;
    }

    var globalMult = mTudo *
      (1 + bonusItens + bonusConjunto) *
      (1 + bonusPrestigio + bonusMarcos) *
      (1 + gorj) *
      (1 + bonusEstab + bonusCamp + bonusEquipeGlobal + bonusFranquiasMult);

    var cliqueMult = mClique * (1 + ev.bonusClique + bonusEquipeClique + bonusMascoteClique) * multSpecClique;
    if (modoDesafioAtivo && modoDesafioAtivo.id === 'des_maos_fogo') { cliqueMult *= 3.0; }

    var passivoMult = mPass * (1 + fres + ev.bonusPassivo + bonusEquipePassivo + bonusMascotePassivo) * multSpecPassivo;

    var porClique = cBase * cliqueMult * globalMult;
    var porSegundo = (pBase + passivoFranquias) * passivoMult * globalMult;
    if (modoDesafioAtivo && modoDesafioAtivo.id === 'des_maos_fogo') { porSegundo = 0; }

    S = {
      porClique: porClique,
      porSegundo: porSegundo,
      bonusItens: bonusItens, bonusConjunto: bonusConjunto,
      bonusPrestigio: bonusPrestigio,
      bonusEstab: bonusEstab,
      bonusRep: bonusRep,
      bonusEquipeMult: bonusEquipeGlobal + bonusEquipeClique + bonusEquipePassivo,
      bonusMascoteClique: bonusMascoteClique,
      bonusMascotePassivo: bonusMascotePassivo,
      bonusFranquiasMult: bonusFranquiasMult,
      passivoFranquias: passivoFranquias,
      conjuntosAtivos: sets,
      desconto: Math.min(0.75, desc), sorte: sorte + bonusMascoteSorte, caixaExtra: caixaExtra,
      refund: refund, critico: Math.min(0.85, crit), offline: off, auto: auto
    };
  }

  function custoUnitario(u, n) { return Math.floor(u.custo * Math.pow(u.cresc, n)); }
  function maximoCom(u, n, moedas) {
    if (u.max && n >= u.max) { return 0; }
    var lim = u.max ? u.max - n : 10000;
    if (acessoTotal()) { return u.max ? lim : 100; }
    var k = 0, g = 0;
    while (k < lim) {
      var c = custoUnitario(u, n + k);
      if (g + c > moedas) { break; }
      g += c; k++;
    }
    return k;
  }
  function plano(u) {
    var n = nivel(u.id), lim = u.max ? u.max - n : Infinity;
    if (lim <= 0) { return { qtd: 0, custo: 0 }; }
    var q = ui.qtd === 'max' ? Math.max(1, maximoCom(u, n, estado.moedas)) : Math.min(ui.qtd, lim);
    if (acessoTotal()) { return { qtd: q, custo: 0 }; }
    var c = 0;
    for (var i = 0; i < q; i++) { c += custoUnitario(u, n + i); }
    return { qtd: q, custo: c };
  }
  function planoFixo(u, qtdFixa) {
    var n = nivel(u.id), lim = u.max ? u.max - n : Infinity;
    if (lim <= 0) { return { qtd: 0, custo: 0 }; }
    var q = qtdFixa === 'max' ? Math.max(1, maximoCom(u, n, estado.moedas)) : Math.min(qtdFixa, lim);
    if (acessoTotal()) { return { qtd: q, custo: 0 }; }
    var c = 0;
    for (var i = 0; i < q; i++) { c += custoUnitario(u, n + i); }
    return { qtd: q, custo: c };
  }
  function custoCaixa(cx) { return acessoTotal() ? 0 : Math.max(1, Math.floor(cx.custo * (1 - S.desconto))); }

  /* ---------- 19. RITMO, FRENESI, PONTO DA CARNE & INGREDIENTE DOURADO ---------- */
  function fatorCombo() {
    var bonusBase = talentoComprado('clq_3') ? 0.06 : 0.03;
    var teto = (estado.especializacao === 'lanchonete_premium') ? 2.5 : 2.0;
    return Math.min(teto, 1 + Math.floor(streakToques / 3) * bonusBase);
  }

  function dispararShake() {
    if (document.body.classList.contains('cc-sem-animacoes')) { return; }
    var el = $('aba-cozinhar');
    if (!el) { return; }
    el.classList.remove('cc-shake');
    void el.offsetWidth;
    el.classList.add('cc-shake');
  }

  function ativarFrenesi(segundos, mult) {
    var extra = talentoComprado('srt_4') ? 10 : 0;
    frenesiMult = mult;
    frenesiExpiraMs = Date.now() + (segundos + extra) * 1000;
    dispararShake();
    if (Som) { Som.caixa(true); }
    mostrarToast('🔥 FRENESI NA COZINHA! Ganhos ' + mult + 'x por ' + (segundos + extra) + 's!');
  }

  function invocarIngredienteDourado() {
    if (document.querySelector('.cc-dourado-flutuante')) { return; }
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cc-dourado-flutuante';
    btn.innerHTML = '<i class="fa-solid fa-star"></i> Ingrediente Dourado!';
    btn.setAttribute('aria-label', 'Coletar Ingrediente Dourado Bônus');

    var topPct = 18 + Math.floor(Math.random() * 55);
    var leftPct = 10 + Math.floor(Math.random() * 65);
    btn.style.top = topPct + '%';
    btn.style.left = leftPct + '%';

    btn.addEventListener('click', function () {
      if (btn.parentNode) { btn.parentNode.removeChild(btn); }
      var roleta = Math.random();
      if (roleta < 0.45) {
        ativarFrenesi(20, 3);
      } else if (roleta < 0.85) {
        var premio = Math.max(250, (S.porSegundo * 45) + (S.porClique * 60));
        estado.moedas += premio;
        estado.totalGanho += premio;
        estado.totalGanhoNaRun = (estado.totalGanhoNaRun || 0) + premio;
        if (Som) { Som.conquista(); }
        mostrarToast('✨ Ingrediente Dourado coletado! +' + fmt(premio) + ' moedas!');
      } else {
        estado.estrelas = (estado.estrelas || 0) + 1;
        if (Som) { Som.caixa(true); }
        mostrarToast('⭐ Ingrediente Dourado Raro! +1 Estrela de Prestígio!');
      }
      calcular();
      renderTudo();
      salvar();
    });

    document.body.appendChild(btn);
    setTimeout(function () {
      if (btn.parentNode) { btn.parentNode.removeChild(btn); }
    }, 12000);
  }

  function agendarProximoDourado() {
    clearTimeout(douradoTimer);
    var baseMs = talentoComprado('srt_3') ? 35000 : 65000;
    var atraso = baseMs + Math.floor(Math.random() * 35000);
    douradoTimer = setTimeout(function () {
      invocarIngredienteDourado();
      agendarProximoDourado();
    }, atraso);
  }

  function abrirMinigamePontoCarne() {
    clearInterval(minigameTimer);
    var zonaInicio = 34 + Math.floor(Math.random() * 24);
    var zonaLargura = 18;
    var pos = 0;
    var dir = 1;

    var html =
      '<p class="cc-texto">Pare o marcador exatamente dentro da <strong>zona verde</strong> para acertar o ponto perfeito e ganhar <strong>5x moedas</strong> no próximo toque!</p>' +
      '<div class="cc-minigame-pista">' +
        '<div class="cc-minigame-zona" style="left:' + zonaInicio + '%; width:' + zonaLargura + '%;"></div>' +
        '<div id="cc-mg-agulha" class="cc-minigame-agulha"></div>' +
      '</div>' +
      '<div style="text-align:center;">' +
        '<button type="button" id="cc-mg-parar" class="cc-btn cc-btn-ouro" style="min-width:210px; font-size:1.1rem;">' +
          '<i class="fa-solid fa-hand"></i> Parar Agora!' +
        '</button>' +
      '</div>';

    abrirModal('Ponto da Carne (Minigame 5x)', html, false);

    minigameTimer = setInterval(function () {
      pos += dir * 2.4;
      if (pos >= 98) { pos = 98; dir = -1; }
      if (pos <= 0) { pos = 0; dir = 1; }
      var ag = $('cc-mg-agulha');
      if (ag) { ag.style.left = pos + '%'; }
    }, 22);

    var btnParar = $('cc-mg-parar');
    if (btnParar) {
      btnParar.addEventListener('click', function () {
        clearInterval(minigameTimer);
        fecharModal();
        if (pos >= zonaInicio && pos <= (zonaInicio + zonaLargura)) {
          pontoCarneAtivo = true;
          pontoCarneMult = 5;
          if (Som) { Som.conquista(); }
          aviso('🥩 Ponto perfeito! Seu próximo toque vale 5x!');
          mostrarToast('🥩 Ponto da Carne acertado! Próximo toque vale 5x!');
        } else {
          pontoCarneAtivo = false;
          pontoCarneMult = 1;
          if (Som) { Som.erro(); }
          aviso('Passou do ponto! Tente novamente.');
        }
      });
    }
  }

  function iniciarBossCritico() {
    if (bossAtivo) {
      aviso('O Crítico Gastronômico já está avaliando você!');
      return;
    }
    var metaToques = 45 + (estado.bossVencidos || 0) * 12;
    bossAtivo = {
      tipo: 'critico',
      titulo: 'DESAFIO DO CRÍTICO GASTRONÔMICO!',
      expiraMs: Date.now() + 30000,
      pontos: 0,
      meta: metaToques
    };
    if (Som) { Som.caixa(false); }
    mostrarToast('⚔️ O Crítico chegou! Cozinhe ' + metaToques + ' vezes em 30 segundos!');
  }

  function finalizarBoss(vitoria) {
    if (!bossAtivo) { return; }
    var b = bossAtivo;
    bossAtivo = null;
    $('cc-boss-banner').hidden = true;

    if (b.tipo === 'campeonato') {
      if (vitoria) {
        estado.campeonatoEtapa = (estado.campeonatoEtapa || 0) + 1;
        estado.estrelas = (estado.estrelas || 0) + b.recompensa.premioEstrelas;
        alterarReputacao(0.30, 'Vitória no Campeonato: ' + b.titulo);
        if (Som) { Som.caixa(true); }
        dispararShake();
        mostrarToast('🏆 Etapa do Campeonato vencida! +' + b.recompensa.premioEstrelas + '★ e +0.30★ Reputação!');
      } else {
        if (Som) { Som.erro(); }
        mostrarToast('⏰ Tempo esgotado no Campeonato! Melhore sua equipe e tente de novo.');
      }
      calcular();
      verificarConquistas();
      renderTudo();
      salvar();
      return;
    }

    if (b.tipo === 'rival') {
      if (vitoria) {
        estado.rivaisVencidos = estado.rivaisVencidos || [];
        if (estado.rivaisVencidos.indexOf(b.idAlvo) < 0) {
          estado.rivaisVencidos.push(b.idAlvo);
        }
        var premioRival = Math.max(15000, S.porSegundo * 55 + S.porClique * 90);
        estado.moedas += premioRival;
        estado.totalGanho += premioRival;
        alterarReputacao(b.recompensa.repPremio, 'Venceu rival: ' + b.titulo);
        if (Som) { Som.caixa(true); }
        dispararShake();
        mostrarToast('🥇 Rival derrotado! +' + fmt(premioRival) + ' moedas e +' + b.recompensa.repPremio.toFixed(2) + '★!');
      } else {
        if (Som) { Som.erro(); }
        mostrarToast('⏰ O rival levou a melhor desta vez. Tente novamente!');
      }
      calcular();
      verificarConquistas();
      renderTudo();
      salvar();
      return;
    }

    if (vitoria) {
      estado.bossVencidos = (estado.bossVencidos || 0) + 1;
      var premio = Math.max(2000, (S.porSegundo * 60) + (S.porClique * 100));
      estado.moedas += premio;
      estado.totalGanho += premio;
      estado.totalGanhoNaRun = (estado.totalGanhoNaRun || 0) + premio;
      estado.estrelas = (estado.estrelas || 0) + 2;
      alterarReputacao(0.25, 'Venceu o Desafio do Crítico Gastronômico');
      if (Som) { Som.caixa(true); }
      dispararShake();
      aviso('🏆 Crítico impressionado! +' + fmt(premio) + ' moedas, +2★ e +0.25★ Reputação!');
      mostrarToast('🏆 Vitória contra o Crítico! +' + fmt(premio) + ' moedas e +2★!');
    } else {
      if (Som) { Som.erro(); }
      aviso('⏰ O tempo acabou! O Crítico foi embora. Tente novamente!');
      mostrarToast('⏰ Tempo esgotado no Desafio do Crítico.');
    }
    verificarConquistas();
    renderTudo();
    salvar();
  }

  /* ---------- 20. AÇÕES DO JOGO ---------- */
  function aviso(t) { $('cc-aviso').textContent = t; }
  function flutuante(valor, critico) {
    if (document.body.classList.contains('cc-sem-animacoes')) { return; }
    var c = $('cc-flutuantes');
    if (!c) { return; }
    var s = document.createElement('span');
    s.className = 'cc-flutua' + (critico ? ' cc-flutua-critico' : '');
    s.textContent = '+' + fmt(valor) + (critico ? '!' : '');
    s.style.left = (25 + Math.random() * 50) + '%';
    c.appendChild(s);
    setTimeout(function () { if (s.parentNode) { s.parentNode.removeChild(s); } }, 950);

    var qtdPart = critico ? 8 : 4;
    for (var i = 0; i < qtdPart; i++) {
      var p = document.createElement('span');
      p.className = 'cc-particula';
      p.style.left = (35 + Math.random() * 30) + '%';
      p.style.top = '45%';
      var ang = Math.random() * Math.PI * 2;
      var dist = 35 + Math.random() * 55;
      p.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
      p.style.setProperty('--dy', (Math.sin(ang) * dist - 20).toFixed(1) + 'px');
      c.appendChild(p);
      (function (elPart) {
        setTimeout(function () { if (elPart.parentNode) { elPart.parentNode.removeChild(elPart); } }, 600);
      })(p);
    }
  }

  function avancarPrato(toquesGanhos, valorBaseToque) {
    var prato = pratoAtualObj();
    var speedBonus = 1 + equipeNivel('ajudante_brigada') * 0.04 + equipeNivel('sous_chef') * 0.05;
    estado.pratoProgresso = (estado.pratoProgresso || 0) + (toquesGanhos * speedBonus);
    var toquesReq = Math.max(3, Math.round(prato.toques * (1 - Math.min(0.48, equipNivel('bancada') * 0.04))));

    if (estado.pratoProgresso >= toquesReq) {
      estado.pratoProgresso = 0;
      estado.pratosConcluidos = (estado.pratosConcluidos || 0) + 1;
      estado.pratosFeitos = estado.pratosFeitos || {};
      var ant = estado.pratosFeitos[prato.id] || 0;
      var novo = ant + 1;
      estado.pratosFeitos[prato.id] = novo;

      var mAnt = maestriaInfo(ant);
      var mNovo = maestriaInfo(novo);
      if (mNovo.nivel > mAnt.nivel) {
        mostrarToast('🎖️ Maestria ' + mNovo.nome + ' alcançada em ' + prato.nome + '!');
      }

      /* Bônus de equipamento, especialização, ingredientes e maestria */
      var multEquipPrato = 1;
      if (prato.cat === 'lanches' || prato.cat === 'carnes') { multEquipPrato += equipNivel('fogao') * 0.15; }
      if (prato.cat === 'massas' || prato.cat === 'cafe' || prato.cat === 'sobremesas') { multEquipPrato += equipNivel('forno') * 0.15; }

      var spec = estado.especializacao || 'nenhuma';
      if (spec === 'alta_gastronomia' && (prato.cat === 'sofisticados' || prato.cat === 'carnes')) { multEquipPrato += 0.50; }
      if (spec === 'oriental' && (prato.cat === 'japonesa' || prato.cat === 'massas')) { multEquipPrato += 0.60; }
      if (spec === 'lanchonete_premium' && prato.cat === 'lanches') { multEquipPrato += 0.50; }

      var multEstabPrato = estabIndiceAtual() >= 5 ? 1.35 : (estabIndiceAtual() >= 4 ? 1.15 : 1.0);
      var multEspec = 1 + equipeNivel('especialista') * 0.25;
      if (sinergiaAtiva(SINERGIAS_EQUIPE[3])) { multEspec += 0.80; }

      /* Consome 1 ingrediente da despensa se houver */
      var bonusIng = 1.0;
      for (var fi = 0; fi < FORNECEDORES.length; fi++) {
        var forn = FORNECEDORES[fi];
        if (qtdIngrediente(forn.ingId) > 0) {
          estado.ingredientes[forn.ingId] -= 1;
          bonusIng += 0.50 + fi * 0.25;
          break;
        }
      }

      var multTalento = talentoComprado('imp_3') ? 2 : 1;
      var bonusPrato = valorBaseToque * prato.multRecompensa * (1 + mNovo.bonus) * multEquipPrato * multEstabPrato * multEspec * bonusIng * multTalento;
      estado.moedas += bonusPrato;
      estado.totalGanho += bonusPrato;
      estado.totalGanhoNaRun = (estado.totalGanhoNaRun || 0) + bonusPrato;

      if (estado.pedidoEspecialAtivo && estado.pedidoEspecialAtivo.tipo === 'pratos') {
        estado.pedidoEspecialAtivo.prog = (estado.pedidoEspecialAtivo.prog || 0) + 1;
      }
      avancarMissaoDiaria('pratos', 1);

      if (modoDesafioAtivo && modoDesafioAtivo.id === 'des_critico_extremo') {
        modoDesafioAtivo.pontos += 5;
      }

      /* Verifica se algum cliente no salão pediu exatamente este prato */
      var cliMatch = null;
      (estado.clientesSalao || []).forEach(function (c) {
        if (!cliMatch && c.pratoId === prato.id) { cliMatch = c; }
      });
      if (cliMatch) {
        atenderCliente(cliMatch.uid, false);
      } else {
        aviso('🍽️ ' + prato.nome + ' concluído! Bônus de +' + fmt(bonusPrato) + ' moedas!');
      }
    }
  }

  function cozinhar() {
    var agora = Date.now();
    if (agora - ultimoToqueMs <= 1600) {
      streakToques += 1;
    } else {
      streakToques = 1;
    }
    ultimoToqueMs = agora;
    if (streakToques > (estado.maiorCombo || 0)) {
      estado.maiorCombo = streakToques;
    }

    if (estado.pedidoEspecialAtivo && estado.pedidoEspecialAtivo.tipo === 'combo') {
      if (streakToques > (estado.pedidoEspecialAtivo.prog || 0)) {
        estado.pedidoEspecialAtivo.prog = streakToques;
      }
    }

    var crit = Math.random() < S.critico;
    var multCrit = talentoComprado('clq_4') ? 12 : 7;
    var ganho = S.porClique * (crit ? multCrit : 1) * fatorCombo();

    if (agora < frenesiExpiraMs) {
      ganho *= frenesiMult;
    }

    if (pontoCarneAtivo) {
      ganho *= pontoCarneMult;
      pontoCarneAtivo = false;
      pontoCarneMult = 1;
    }

    if (pedidoRelampagoAtivo) {
      if (agora <= pedidoExpiraMs) {
        ganho *= 3;
      }
      pedidoRelampagoAtivo = false;
      $('cc-risco-btn').disabled = false;
    }

    if (modoDesafioAtivo && modoDesafioAtivo.id === 'des_critico_extremo' && !crit) {
      ganho = 0;
    }

    estado.moedas += ganho;
    estado.totalGanho += ganho;
    estado.totalGanhoNaRun = (estado.totalGanhoNaRun || 0) + ganho;
    estado.cliques += 1;
    avancarMissaoDiaria('toques', 1);

    if (Som) { Som.cozinhar(streakToques, crit); }

    if (crit) {
      dispararShake();
      aviso('Prato perfeito! +' + fmt(ganho) + ' moedas!');
    } else if (streakToques >= 3) {
      aviso('Combo ' + fatorCombo().toFixed(2) + 'x! +' + fmt(ganho) + ' moedas.');
    } else if ($('cc-aviso').textContent.indexOf('fora') >= 0) {
      aviso('');
    }

    if (bossAtivo) {
      bossAtivo.pontos += 1;
      if (bossAtivo.pontos >= bossAtivo.meta) {
        finalizarBoss(true);
      }
    }

    if (modoDesafioAtivo) {
      if (modoDesafioAtivo.id !== 'des_critico_extremo' || crit) {
        modoDesafioAtivo.pontos += crit ? 3 : 1;
      }
    }

    avancarPrato(1, S.porClique);
    flutuante(ganho, crit);
    verificarConquistas();
    renderPlacar();
    renderTutorial();
    if (ui.aba === 'cozinhar') {
      renderRitmo();
      renderPainelPrato();
    }
    if (ui.aba === 'melhorias') { renderListaMelhorias(); }
  }

  function ativarPedidoRelampago() {
    if (pedidoRelampagoAtivo) { return; }
    pedidoRelampagoAtivo = true;
    pedidoExpiraMs = Date.now() + 3000;
    $('cc-risco-btn').disabled = true;
    if (Som) { Som.clique(); }
    aviso('⚡ Pedido Relâmpago ativo! Toque em Cozinhar nos próximos 3 segundos!');
    setTimeout(function () {
      if (pedidoRelampagoAtivo) {
        pedidoRelampagoAtivo = false;
        $('cc-risco-btn').disabled = false;
        aviso('Pedido Relâmpago expirou.');
      }
    }, 3100);
  }

  function comprar(id, qtdForcada) {
    var u = U.UPGRADES.filter(function (x) { return x.id === id; })[0];
    if (!u) { return; }
    var p = (qtdForcada !== undefined) ? planoFixo(u, qtdForcada) : plano(u);
    if (!p.qtd) { return; }
    if (estado.moedas < p.custo) {
      if (Som) { Som.erro(); }
      aviso('Moedas insuficientes para ' + u.nome + '.');
      return;
    }
    estado.moedas -= p.custo;
    estado.upgrades[u.id] = nivel(u.id) + p.qtd;
    if (Som) { Som.comprar(); }
    calcular();
    verificarConquistas();
    renderTudo();
    salvar();
    if (qtdForcada === 'max' && p.qtd > 1) {
      mostrarToast('🚀 Compra MAX: +' + p.qtd + ' níveis de ' + u.nome + '!');
    }
  }

  function comprarMelhoriaMaisBarata(silencioso) {
    var melhor = null;
    var menorCusto = Infinity;
    U.UPGRADES.forEach(function (u) {
      var n = nivel(u.id);
      if (u.max && n >= u.max) { return; }
      var c = acessoTotal() ? 0 : custoUnitario(u, n);
      if (estado.moedas >= c && c < menorCusto) {
        menorCusto = c;
        melhor = u;
      }
    });
    if (!melhor) {
      if (!silencioso) {
        if (Som) { Som.erro(); }
        aviso('Nenhuma melhoria acessível no momento.');
      }
      return false;
    }
    estado.moedas -= menorCusto;
    estado.upgrades[melhor.id] = nivel(melhor.id) + 1;
    calcular();
    verificarConquistas();
    if (!silencioso) {
      if (Som) { Som.comprar(); }
      renderTudo();
      salvar();
      mostrarToast('⚡ Melhoria comprada: ' + melhor.nome + '!');
    }
    return true;
  }

  /* ---------- 21. CAIXAS, PITY TIMER & FUSÃO DE REPETIDOS ---------- */
  function sortearRaridade(cx) {
    /* Pity Timer: garante Raro (2) ou superior após PITY_LIMITE caixas sem sorte */
    if ((estado.pityContador || 0) >= PITY_LIMITE) {
      return Math.max(2, cx.minimo);
    }
    var multMitico = talentoComprado('srt_5') ? 2.0 : 1.0;
    var pesos = I.RARIDADES.map(function (r, i) {
      if (i < cx.minimo) { return 0; }
      var w = r.peso * Math.pow(1 + cx.sorte + S.sorte, i);
      if (i >= 4) { w *= multMitico; }
      return w;
    });
    var soma = pesos.reduce(function (a, b) { return a + b; }, 0);
    var t = Math.random() * soma;
    for (var i = 0; i < pesos.length; i++) { t -= pesos[i]; if (t <= 0) { return i; } }
    return cx.minimo;
  }

  function sortearItem(rar) {
    var opcoes = [];
    I.CATEGORIAS.forEach(function (c) {
      I.MODELOS[c.id].forEach(function (m) {
        if (m.raridade === rar) {
          m.cores.forEach(function (_, i) { opcoes.push({ cat: c.id, modelo: m, indice: i, chave: I.chave(c.id, m.id, i) }); });
        }
      });
    });
    I.MASCOTES.forEach(function (msc) {
      if (msc.raridade === rar) {
        opcoes.push({ cat: 'mascote', mascote: msc, chave: 'mascote|' + msc.id });
      }
    });
    var faltam = opcoes.filter(function (o) { return !tem(o.chave); });
    var pool = (faltam.length && Math.random() < 0.7) ? faltam : opcoes;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function abrirCaixa(id, qtd) {
    var cx = U.CAIXAS.filter(function (x) { return x.id === id; })[0];
    if (!cx) { return; }
    var unit = custoCaixa(cx), total = unit * qtd;
    if (estado.moedas < total) {
      if (Som) { Som.erro(); }
      aviso('Moedas insuficientes.');
      return;
    }
    estado.moedas -= total;
    var ganhos = [], devolvido = 0, novidades = 0, temMitico = false, ganhoToken = false, fragsGanhos = 0;

    for (var i = 0; i < qtd; i++) {
      estado.caixasAbertas += 1;
      var n = Math.random() < S.caixaExtra ? 2 : 1;
      for (var k = 0; k < n; k++) {
        var rar = sortearRaridade(cx);
        if (rar >= 2) {
          estado.pityContador = 0;
        } else {
          estado.pityContador = (estado.pityContador || 0) + 1;
        }
        var it = sortearItem(rar);
        if (!it) { continue; }
        var novo = !tem(it.chave);
        if (novo) {
          estado.itens.push(it.chave);
          novidades += 1;
        } else {
          var volta = Math.floor(I.RARIDADES[rar].valor * (1 + S.refund));
          estado.moedas += volta;
          devolvido += volta;
          estado.fragmentosFusao = (estado.fragmentosFusao || 0) + 1;
          fragsGanhos += 1;
        }
        if (rar === 5) { temMitico = true; }
        ganhos.push({ rar: rar, it: it, novo: novo });
      }
      if (!estado.token && Math.random() < CHANCE_TOKEN) {
        estado.token = true;
        ganhoToken = true;
      }
    }

    if (Som) { Som.caixa(temMitico || ganhoToken); }
    if (temMitico || ganhoToken) { dispararShake(); }

    calcular();
    verificarConquistas();
    renderTudo();
    salvar();

    var resumo = ganhos.length + ' ' + (ganhos.length === 1 ? 'item' : 'itens') + ' — ' + novidades + (novidades === 1 ? ' novo' : ' novos') + '.';
    if (devolvido) { resumo += ' Repetidos renderam +' + fmt(devolvido) + ' moedas e +' + fragsGanhos + ' Fragmentos.'; }
    var html = '<p class="cc-resumo">' + esc(resumo) + '</p>';
    if (temMitico) { html += '<p class="cc-mitico-aviso">Item Mítico! Parabéns!</p>'; }
    html += '<div class="cc-grade-itens">';
    ganhos.forEach(function (g) {
      var r = I.RARIDADES[g.rar];
      var nomeItem, miniSvg;
      if (g.it.cat === 'mascote') {
        nomeItem = '🐾 ' + g.it.mascote.nome;
        miniSvg = g.it.mascote.svg();
      } else {
        nomeItem = g.it.modelo.cores.length === 1 ? g.it.modelo.nome : g.it.modelo.nome + ' ' + g.it.modelo.cores[g.it.indice].nome.toLowerCase();
        miniSvg = I.miniaturaSVG(g.it.cat, g.it.modelo.id, g.it.indice);
      }
      html += '<article class="cc-item rar-' + r.id + (g.rar === 5 ? ' cc-item-mitico' : '') + '">' +
        '<div class="cc-mini">' + miniSvg + '</div>' +
        '<h3>' + esc(nomeItem) + '</h3>' +
        '<p><span class="cc-badge">' + r.nome + '</span></p>' +
        '<p class="' + (g.novo ? 'cc-novo' : 'cc-repetido') + '">' + (g.novo ? 'Novo!' : 'Repetido (+1 Frag.)') + '</p></article>';
    });
    html += '</div>';
    if (ganhoToken) {
      html += '<p class="cc-token-grande">Você achou o Token Dourado! Bônus permanente de +25% em todos os ganhos.</p>';
    }
    abrirModal(qtd === 1 ? cx.nome : qtd + 'x ' + cx.nome, html, temMitico || ganhoToken);
  }

  function fundirFragmentosRepetidos() {
    var frags = estado.fragmentosFusao || 0;
    if (frags < 5) {
      if (Som) { Som.erro(); }
      aviso('Você precisa de pelo menos 5 Fragmentos de Fusão.');
      return;
    }
    var faltamTodos = [];
    I.CATEGORIAS.forEach(function (c) {
      I.MODELOS[c.id].forEach(function (m) {
        m.cores.forEach(function (_, idx) {
          var k = I.chave(c.id, m.id, idx);
          if (!tem(k)) { faltamTodos.push(k); }
        });
      });
    });
    I.MASCOTES.forEach(function (msc) {
      var k = 'mascote|' + msc.id;
      if (!tem(k)) { faltamTodos.push(k); }
    });

    if (!faltamTodos.length) {
      aviso('Você já possui todos os itens e mascotes da coleção!');
      return;
    }

    estado.fragmentosFusao = frags - 5;
    estado.fusoesRealizadas = (estado.fusoesRealizadas || 0) + 1;
    var escolhido = faltamTodos[Math.floor(Math.random() * faltamTodos.length)];
    estado.itens.push(escolhido);
    var obj = I.obter(escolhido);
    var rar = I.RARIDADES[obj.raridade];

    if (Som) { Som.caixa(obj.raridade >= 4); }
    dispararShake();
    calcular();
    verificarConquistas();
    renderTudo();
    salvar();

    var mini = obj.cat === 'mascote' ? obj.mascote.svg() : I.miniaturaSVG(obj.cat, obj.modelo.id, obj.indice);
    var html =
      '<p class="cc-resumo">Você fundiu <strong>5 Fragmentos de Repetidos</strong> e forjou um item inédito garantido!</p>' +
      '<div class="cc-grade-itens" style="grid-template-columns: minmax(180px, 240px); justify-content:center;">' +
        '<article class="cc-item rar-' + rar.id + (obj.raridade === 5 ? ' cc-item-mitico' : '') + '">' +
          '<div class="cc-mini">' + mini + '</div>' +
          '<h3>' + esc(obj.nome) + '</h3>' +
          '<p><span class="cc-badge">' + rar.nome + '</span></p>' +
          '<p class="cc-novo">Forjado com Sucesso!</p>' +
        '</article>' +
      '</div>';
    abrirModal('Forja de Fusão Concluída!', html, obj.raridade >= 4);
  }

  function vestir(k) {
    var it = I.obter(k);
    if (!it || !tem(k)) { return; }
    estado.equipado[it.cat] = k;
    if (Som) { Som.clique(); }
    calcular();
    renderTudo();
    salvar();
  }
  function tirarChapeu() {
    estado.equipado.chapeu = null;
    if (Som) { Som.clique(); }
    calcular();
    renderTudo();
    salvar();
  }

  /* ---------- 22. EXPORTAÇÃO E IMPORTAÇÃO DE SAVE ---------- */
  function codificarSaveBase64(obj) {
    var json = JSON.stringify(obj);
    return window.btoa(unescape(encodeURIComponent(json)));
  }

  function decodificarSave(texto) {
    var limpo = texto.trim();
    if (!limpo) { throw new Error('Cole um código de save válido.'); }
    var jsonStr = limpo;
    if (limpo.charAt(0) !== '{') {
      jsonStr = decodeURIComponent(escape(window.atob(limpo)));
    }
    var dados = JSON.parse(jsonStr);
    if (!dados || typeof dados !== 'object' || typeof dados.moedas !== 'number') {
      throw new Error('Formato de save inválido ou corrompido.');
    }
    return dados;
  }

  function exportarSave() {
    salvar();
    var codigo = codificarSaveBase64(estado);
    var campo = $('cc-save-texto');
    campo.value = codigo;
    campo.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(codigo).then(function () {
        $('cc-save-status').textContent = 'Save exportado e copiado para a área de transferência!';
        mostrarToast('📋 Save copiado!');
      }).catch(function () {
        $('cc-save-status').textContent = 'Save gerado acima! Copie o texto manualmente.';
      });
    } else {
      $('cc-save-status').textContent = 'Save gerado acima! Copie o texto manualmente.';
    }
  }

  function baixarSaveArquivo() {
    salvar();
    var codigo = codificarSaveBase64(estado);
    var blob = new Blob([codigo], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'cozinha-do-chef-v9-save.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    $('cc-save-status').textContent = 'Arquivo cozinha-do-chef-v9-save.txt baixado com sucesso!';
  }

  function importarSave() {
    var campo = $('cc-save-texto');
    try {
      var dados = decodificarSave(campo.value);
      if (!window.confirm('Tem certeza que deseja importar este save? Um backup automático do seu progresso atual será salvo antes de substituir.')) {
        return;
      }
      var atual = window.localStorage.getItem(CHAVE_SALVO);
      if (atual) {
        window.localStorage.setItem(CHAVE_BACKUP, atual);
      }
      var base = criarEstadoNovo();
      Object.keys(base).forEach(function (k) {
        if (dados[k] !== undefined && dados[k] !== null) { base[k] = dados[k]; }
      });
      estado = base;
      salvar();
      calcular();
      verificarConquistas();
      renderTudo();
      if (Som) { Som.conquista(); }
      $('cc-save-status').textContent = 'Save importado com sucesso! Backup anterior guardado.';
      mostrarToast('✅ Save carregado!');
    } catch (e) {
      if (Som) { Som.erro(); }
      $('cc-save-status').textContent = 'Erro ao importar: ' + e.message;
    }
  }

  function restaurarBackupSave() {
    try {
      var bkp = window.localStorage.getItem(CHAVE_BACKUP);
      if (!bkp) {
        $('cc-save-status').textContent = 'Nenhum backup anterior encontrado neste navegador.';
        return;
      }
      if (!window.confirm('Deseja restaurar o backup anterior?')) { return; }
      window.localStorage.setItem(CHAVE_SALVO, bkp);
      carregar();
      calcular();
      renderTudo();
      $('cc-save-status').textContent = 'Backup anterior restaurado com sucesso!';
      mostrarToast('⏪ Backup restaurado!');
    } catch (e) {
      $('cc-save-status').textContent = 'Não foi possível restaurar o backup.';
    }
  }

  /* ---------- 23. RENDERIZAÇÃO ---------- */
  function renderPlacar() {
    $('cc-moedas').textContent = fmt(estado.moedas);
    $('cc-clique').textContent = fmt(S.porClique);
    $('cc-segundo').textContent = fmt(S.porSegundo);
    var rep = estado.reputacao || 1.0;
    $('cc-reputacao-placar').textContent = rep.toFixed(1) + ' ★ (+' + pct(S.bonusRep || 0) + ')';
    $('cc-estrelas-placar').textContent = fmt(estado.estrelas || 0) + ' ★';

    var est = estabAtualObj();
    var spec = specAtualObj();
    var franqTot = totalFranquiasAbertas();
    $('cc-estab-header').innerHTML = '<i class="fa-solid ' + est.icone + '"></i> ' + esc(est.nome);
    $('cc-spec-header').innerHTML = '<i class="fa-solid ' + spec.icone + '"></i> ' + esc(spec.nome);
    $('cc-franquia-header').innerHTML = '<i class="fa-solid fa-earth-americas"></i> ' + franqTot + (franqTot === 1 ? ' Franquia' : ' Franquias');

    var barato = Infinity, prox = null;
    U.UPGRADES.forEach(function (u) {
      var n = nivel(u.id);
      if (u.max && n >= u.max) { return; }
      var c = custoUnitario(u, n);
      if (c < barato) { barato = c; prox = u; }
    });
    if (!prox) {
      $('cc-meta-texto').textContent = 'Todas as melhorias limitadas já estão no máximo.';
      $('cc-meta-barra').style.width = '100%';
      $('cc-meta-barra').parentNode.setAttribute('aria-valuenow', '100');
    } else {
      var p = Math.min(100, Math.round((estado.moedas / barato) * 100));
      $('cc-meta-texto').textContent = 'Melhoria mais barata: ' + prox.nome + ' (' + fmt(barato) + ' moedas)';
      $('cc-meta-barra').style.width = p + '%';
      $('cc-meta-barra').parentNode.setAttribute('aria-valuenow', String(p));
    }

    var btnBarato1 = $('cc-comprar-barato-btn');
    var btnBarato2 = $('cc-comprar-barato-upg-btn');
    var podeBarato = !!prox && (acessoTotal() || estado.moedas >= barato);
    if (btnBarato1) { btnBarato1.disabled = !podeBarato; }
    if (btnBarato2) { btnBarato2.disabled = !podeBarato; }
  }

  function renderRitmo() {
    var f = fatorCombo();
    $('cc-combo-texto').textContent = 'x' + f.toFixed(2) + ' (' + streakToques + ' seguidos)';

    var bannerFrenesi = $('cc-frenesi-banner');
    var agora = Date.now();
    if (agora < frenesiExpiraMs) {
      var rest = ((frenesiExpiraMs - agora) / 1000).toFixed(1);
      bannerFrenesi.hidden = false;
      bannerFrenesi.innerHTML = '<i class="fa-solid fa-fire"></i> FRENESI ATIVO (' + frenesiMult + 'x MOEDAS) — Restam ' + rest + 's!';
    } else {
      bannerFrenesi.hidden = true;
    }

    var bannerBoss = $('cc-boss-banner');
    if (bossAtivo) {
      var restBoss = Math.max(0, (bossAtivo.expiraMs - agora) / 1000);
      if (restBoss <= 0) {
        finalizarBoss(false);
      } else {
        bannerBoss.hidden = false;
        $('cc-boss-titulo').innerHTML = '<i class="fa-solid fa-skull"></i> ' + esc(bossAtivo.titulo);
        $('cc-boss-tempo').textContent = restBoss.toFixed(1) + 's';
        $('cc-boss-desc').textContent = 'Progresso: ' + bossAtivo.pontos + ' / ' + bossAtivo.meta + ' toques!';
        var pctBoss = Math.min(100, Math.round((bossAtivo.pontos / bossAtivo.meta) * 100));
        $('cc-boss-barra-cheia').style.width = pctBoss + '%';
      }
    } else {
      bannerBoss.hidden = true;
    }

    var bannerDesafio = $('cc-desafio-ativo-banner');
    if (modoDesafioAtivo) {
      var restDes = Math.max(0, (modoDesafioAtivo.expiraMs - agora) / 1000);
      if (restDes <= 0) {
        finalizarModoDesafio();
      } else {
        bannerDesafio.hidden = false;
        bannerDesafio.innerHTML = '<span><i class="fa-solid fa-stopwatch"></i> ' + esc(modoDesafioAtivo.nome) + ' — Pontos: ' + modoDesafioAtivo.pontos + '/' + modoDesafioAtivo.meta + '</span><span>' + restDes.toFixed(1) + 's</span>';
      }
    } else {
      bannerDesafio.hidden = true;
    }
  }

  function renderEventoBanner() {
    var ev = eventoSazonalAtual();
    var resg = (estado.temporadaResgatados || []).length;
    $('cc-evento-banner').innerHTML =
      '<span><i class="fa-solid ' + ev.icone + '"></i> <strong>Evento:</strong> ' + esc(ev.nome) + ' — ' + esc(ev.desc) + '</span>' +
      '<span><strong>Temporada:</strong> ' + resg + '/' + TRILHA_TEMPORADA.length + ' marcos</span>';
  }

  function renderAvatares() {
    var svg = I.avatarSVG(estado.equipado);
    $('cc-avatar-palco').innerHTML = svg;
    $('cc-avatar-grande').innerHTML = svg;

    /* Mascote equipado no palco */
    var mBox = $('cc-mascote-palco-box');
    var mEq = estado.mascoteEquipado ? I.obterMascote(estado.mascoteEquipado) : null;
    if (mEq) {
      var rar = I.RARIDADES[mEq.raridade];
      mBox.innerHTML =
        '<div class="cc-mascote-palco-badge rar-' + rar.id + '">' +
          '<div class="cc-mascote-palco-mini">' + mEq.svg() + '</div>' +
          '<div style="font-size:0.86rem;">' +
            '<strong>🐾 ' + esc(mEq.nome) + '</strong>' +
            '<div style="color:var(--texto-suave);">' + esc(mEq.bonusDesc) + '</div>' +
          '</div>' +
        '</div>';
    } else {
      mBox.innerHTML =
        '<div class="cc-mascote-palco-badge" style="justify-content:space-between;">' +
          '<span style="font-size:0.86rem; color:var(--texto-suave);">🐾 Nenhum mascote equipado no salão.</span>' +
          '<button type="button" class="cc-btn cc-btn-claro cc-btn-pequeno" data-ir-mascotes="1" style="margin:0;">Escolher</button>' +
        '</div>';
    }

    var b = 'Bônus das roupas: +' + pct(S.bonusItens);
    if (S.bonusConjunto > 0) { b += ' | Conjuntos/Token: +' + pct(S.bonusConjunto); }
    $('cc-bonus-palco').textContent = b;
    $('cc-bonus-chef').textContent = b;

    var sets = S.conjuntosAtivos || [];
    $('cc-set-palco').textContent = sets.length
      ? '✨ Conjuntos ativos: ' + sets.map(function (s) { return s.nome; }).join(', ')
      : '';

    var colecao = 'Coleção total: ' + contados() + ' de ' + I.total() + ' itens e mascotes.';
    $('cc-colecao-chef').textContent = colecao;
    $('cc-colecao').textContent = colecao;
  }

  function contados() {
    var c = 0;
    I.CATEGORIAS.forEach(function (cat) {
      I.MODELOS[cat.id].forEach(function (m) {
        m.cores.forEach(function (_, i) { if (tem(I.chave(cat.id, m.id, i))) { c++; } });
      });
    });
    I.MASCOTES.forEach(function (m) {
      if (mascoteDesbloqueado(m.id)) { c++; }
    });
    return c;
  }

  function renderSets() {
    var ativos = S.conjuntosAtivos || [];
    var idsAtivos = ativos.map(function (s) { return s.id; });
    $('cc-sets-lista').innerHTML = I.CONJUNTOS.map(function (s) {
      var ok = idsAtivos.indexOf(s.id) >= 0;
      return '<div class="cc-set-card' + (ok ? ' set-ativo' : '') + '">' +
        '<strong>' + (ok ? '✔ ' : '') + '[' + s.tier + '] ' + esc(s.nome) + ' (+' + pct(s.bonus) + ')</strong><br>' +
        '<span>' + esc(s.desc) + '</span></div>';
    }).join('');
  }

  function renderGrupos() {
    $('cc-grupos').innerHTML = U.GRUPOS.map(function (g) {
      return '<button type="button" class="cc-filtro" data-grupo="' + g.id + '" aria-pressed="' + (g.id === ui.grupo) + '">' + esc(g.nome) + '</button>';
    }).join('');
    var g = U.GRUPOS.filter(function (x) { return x.id === ui.grupo; })[0];
    $('cc-grupo-ajuda').textContent = g ? g.ajuda : '';
    document.querySelectorAll('[data-qtd-compra]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-qtd-compra') === String(ui.qtd)));
    });
    var btnAuto = $('cc-autocompra-btn');
    if (btnAuto) {
      btnAuto.setAttribute('aria-pressed', String(ui.autoCompra));
      btnAuto.innerHTML = 'Auto-compra: ' + (ui.autoCompra ? 'Ligada ✔' : 'Desligada') + ' <span class="cc-kbd">A</span>';
    }
  }

  function calcularMelhorRetornoId() {
    var melhorId = null;
    var melhorScore = 0;
    U.UPGRADES.forEach(function (u) {
      var n = nivel(u.id);
      if (u.max && n >= u.max) { return; }
      var c = custoUnitario(u, n);
      if (c <= 0) { return; }
      var e = u.efeito;
      var ganhoEst = 0;
      if (e.tipo === 'clique') { ganhoEst = e.valor * 2.5; }
      else if (e.tipo === 'passivo') { ganhoEst = e.valor * 1.5; }
      else if (e.tipo === 'mult') { ganhoEst = (S.porClique + S.porSegundo) * (e.fator - 1) * 0.6; }
      else { ganhoEst = (S.porClique + S.porSegundo) * 0.05; }
      var score = ganhoEst / c;
      if (score > melhorScore) {
        melhorScore = score;
        melhorId = u.id;
      }
    });
    return melhorId;
  }

  function renderListaMelhorias() {
    var itens = U.UPGRADES.filter(function (u) { return u.grupo === ui.grupo; });
    var melhorId = calcularMelhorRetornoId();
    $('cc-lista-upg').innerHTML = itens.map(function (u) {
      var n = nivel(u.id), cheio = u.max && n >= u.max;
      var p = plano(u);
      var pMax = planoFixo(u, 'max');
      var maxAcessivel = maximoCom(u, n, estado.moedas);
      var rotuloNivel = u.max ? 'Nível ' + n + ' de ' + u.max : 'Nível ' + n;
      var ehMelhor = !cheio && u.id === melhorId;
      var right;
      if (cheio) {
        right = '<p class="cc-preco">No máximo</p>';
      } else {
        var pode = acessoTotal() || estado.moedas >= p.custo;
        var podeMax = acessoTotal() || maxAcessivel >= 1;
        var textoBtn = acessoTotal() ? 'Pegar grátis (' + p.qtd + ')' : 'Comprar ' + p.qtd + ' — ' + fmt(p.custo);
        var textoBtnMax = acessoTotal() ? 'MAX (+100)' : 'MAX (' + pMax.qtd + ') — ' + fmt(pMax.custo);
        right = '<p class="cc-preco">' + (acessoTotal() ? 'Grátis (depuração)' : fmt(custoUnitario(u, n)) + ' moedas') + '</p>' +
          '<div class="cc-upg-btns">' +
            '<button type="button" class="cc-btn cc-btn-pequeno" data-comprar="' + u.id + '"' + (pode ? '' : ' disabled') + '>' + textoBtn + '</button>' +
            (ui.qtd !== 'max' ? '<button type="button" class="cc-btn cc-btn-claro cc-btn-pequeno" data-comprar-max="' + u.id + '"' + (podeMax ? '' : ' disabled') + '>' + textoBtnMax + '</button>' : '') +
          '</div>';
      }
      return '<article class="cc-upg' + (cheio ? ' cc-upg-cheio' : '') + (ehMelhor ? ' cc-upg-melhor-valor' : '') + '">' +
        '<div>' +
          '<h3>' + esc(u.nome) + ' <span class="cc-nivel">' + rotuloNivel + '</span>' + (ehMelhor ? ' <span class="cc-selo-valor">★ Vale a pena</span>' : '') + '</h3>' +
          '<p class="cc-upg-efeito">' + esc(u.desc) + '</p>' +
        '</div>' +
        '<div class="cc-upg-compra">' + right + '</div></article>';
    }).join('');
  }

  function renderBestiario() {
    var totalPratos = PRATOS.length;
    var desb = PRATOS.filter(pratoDesbloqueado);
    var feitos = 0;
    PRATOS.forEach(function (p) {
      if ((estado.pratosFeitos && estado.pratosFeitos[p.id]) > 0) { feitos += 1; }
    });
    $('cc-bestiario-resumo').textContent = 'Pratos descobertos: ' + desb.length + ' de ' + totalPratos + ' • Já preparados: ' + feitos + ' • Total de receitas concluídas: ' + fmt(estado.pratosConcluidos || 0) + '.';

    $('cc-categorias-resumo').innerHTML = CATEGORIAS_PRATO.map(function (cat) {
      var pratosCat = PRATOS.filter(function (p) { return p.cat === cat.id; });
      var concluidosCat = 0;
      pratosCat.forEach(function (p) {
        if ((estado.pratosFeitos && estado.pratosFeitos[p.id]) > 0) { concluidosCat++; }
      });
      return '<div class="cc-card-gestao">' +
        '<strong><i class="fa-solid ' + cat.icone + '"></i> ' + esc(cat.nome) + '</strong>' +
        '<span>Pratos dominados: ' + concluidosCat + '/' + pratosCat.length + '</span>' +
      '</div>';
    }).join('');

    var termo = (ui.buscaReceita || '').toLowerCase().trim();
    var listaFiltrada = PRATOS.filter(function (p) {
      if (ui.filtroCatReceita === 'secretas' && !p.secreta) { return false; }
      if (termo && p.nome.toLowerCase().indexOf(termo) < 0 && p.desc.toLowerCase().indexOf(termo) < 0) { return false; }
      return true;
    });

    $('cc-lista-bestiario').innerHTML = listaFiltrada.map(function (p) {
      var ok = pratoDesbloqueado(p);
      if (!ok) {
        return '<article class="cc-best-card" style="opacity:0.75;">' +
          '<div class="cc-best-topo">' +
            '<div style="display:flex; align-items:center; gap:10px;">' +
              '<div class="cc-best-icone" style="background:var(--borda-forte);"><i class="fa-solid fa-lock"></i></div>' +
              '<div><h3 style="margin:0; font-size:1.05rem;">' + (p.secreta ? 'Receita Secreta 🔒' : esc(p.nome)) + '</h3></div>' +
            '</div>' +
          '</div>' +
          '<p style="margin:0; font-size:0.9rem; color:var(--texto-suave);">' + (p.secreta ? esc(p.dica) : ('Libera ao expandir para: ' + esc(ESTABELECIMENTOS[p.reqEstab].nome))) + '</p>' +
        '</article>';
      }

      var vezes = (estado.pratosFeitos && estado.pratosFeitos[p.id]) || 0;
      var m = maestriaInfo(vezes);
      var progInfo = m.prox ? ('Próxima maestria em ' + m.prox + ' preparos') : 'Maestria máxima alcançada!';
      return '<article class="cc-best-card ' + m.cls + '">' +
        '<div class="cc-best-topo">' +
          '<div style="display:flex; align-items:center; gap:10px;">' +
            '<div class="cc-best-icone"><i class="fa-solid ' + p.icone + '"></i></div>' +
            '<div>' +
              '<h3 style="margin:0; font-size:1.05rem;">' + (p.secreta ? '✨ ' : '') + esc(p.nome) + '</h3>' +
              '<small style="color:var(--texto-suave);">Preparado ' + vezes + 'x</small>' +
            '</div>' +
          '</div>' +
          '<span class="cc-best-selo">' + m.nome + '</span>' +
        '</div>' +
        '<p style="margin:0; font-size:0.9rem; color:var(--texto-suave);">' + esc(p.desc) + '</p>' +
        '<p style="margin:0; font-size:0.86rem; font-weight:700; color:var(--verde-900);">Bônus de maestria: +' + pct(m.bonus) + ' (' + progInfo + ')</p>' +
      '</article>';
    }).join('');
  }

  function renderPrestigio() {
    var atuais = estado.estrelas || 0;
    var ganho = estrelasAoPrestigiar();
    $('cc-prest-atuais').textContent = fmt(atuais) + ' ★';
    $('cc-prest-bonus').textContent = '+' + pct(S.bonusPrestigio || 0);
    $('cc-prest-ganhar').textContent = '+' + fmt(ganho) + ' ★';

    var btn = $('cc-btn-prestigiar');
    if (ganho > 0) {
      btn.disabled = false;
      $('cc-prest-requisito').textContent = 'Você já pode prestigiar agora e ganhar +' + fmt(ganho) + ' Estrelas!';
    } else {
      btn.disabled = true;
      var falta = Math.max(0, META_BASE_PRESTIGIO - (estado.totalGanhoNaRun || 0));
      $('cc-prest-requisito').textContent = 'Ganhe mais ' + fmt(falta) + ' moedas nesta temporada para liberar sua primeira Estrela.';
    }

    var pCount = estado.prestigios || 0;
    $('cc-marcos-prestigio').innerHTML = MARCOS_PRESTIGIO.map(function (m) {
      var ok = pCount >= m.req || acessoTotal();
      return '<article class="cc-card-gestao' + (ok ? ' atual-estab' : ' bloqueado') + '">' +
        '<div>' +
          '<h4 style="margin:0 0 4px;">' + esc(m.nome) + '</h4>' +
          '<p style="margin:0; font-size:0.9rem; color:var(--texto-suave);">' + esc(m.desc) + '</p>' +
        '</div>' +
        '<span class="cc-tag-pill">' + (ok ? 'Desbloqueado ✔' : 'Requer ' + m.req + ' prestígios') + '</span>' +
      '</article>';
    }).join('');

    var ramosKeys = ['maos', 'automacao', 'sorte', 'imperio'];
    $('cc-arvore-ramos').innerHTML = ramosKeys.map(function (rKey) {
      var info = NOMES_RAMOS[rKey];
      var nodes = ARVORE_TALENTOS.filter(function (t) { return t.ramo === rKey; });
      var nodesHtml = nodes.map(function (t) {
        var jaTem = talentoComprado(t.id);
        var reqOk = !t.req || talentoComprado(t.req);
        var podeComprar = !jaTem && reqOk && (atuais >= t.custo);
        var cls = 'cc-node-card' + (jaTem ? ' node-comprado' : (!reqOk ? ' node-bloqueado' : ''));
        var btnHtml = jaTem
          ? '<button type="button" class="cc-node-btn" disabled>Desbloqueado ✔</button>'
          : '<button type="button" class="cc-node-btn" data-talento="' + t.id + '"' + (podeComprar ? '' : ' disabled') + '>' +
              (reqOk ? ('Ativar (' + t.custo + ' ★)') : 'Bloqueado') +
            '</button>';

        return '<div class="' + cls + '">' +
          '<div class="cc-node-topo">' +
            '<strong>' + esc(t.nome) + '</strong>' +
            '<span class="cc-node-tier">Nível ' + t.tier + '</span>' +
          '</div>' +
          '<p class="cc-node-desc">' + esc(t.desc) + '</p>' +
          btnHtml +
        '</div>';
      }).join('');

      return '<div class="cc-ramo-coluna">' +
        '<h4 class="cc-ramo-titulo"><i class="fa-solid ' + info.icone + '"></i> ' + esc(info.titulo) + '</h4>' +
        nodesHtml +
      '</div>';
    }).join('');
  }

  function renderConquistas() {
    var lista = estado.conquistas || [];
    $('cc-conquistas-resumo').textContent = 'Concluídas: ' + lista.length + ' de ' + CONQUISTAS.length + ' conquistas.';

    var filtradas = CONQUISTAS.filter(function (c) {
      var ok = lista.indexOf(c.id) >= 0;
      if (ui.filtroConq === 'concluidas' && !ok) { return false; }
      if (ui.filtroConq === 'pendentes' && ok) { return false; }
      return true;
    });

    $('cc-lista-conquistas').innerHTML = filtradas.map(function (c) {
      var ok = lista.indexOf(c.id) >= 0;
      return '<article class="cc-conquista' + (ok ? ' cc-conquista-ok' : '') + '">' +
        '<div class="cc-conquista-topo">' +
          '<div class="cc-conquista-icone"><i class="fa-solid ' + c.icone + '"></i></div>' +
          '<div><h3>' + esc(c.nome) + '</h3></div>' +
        '</div>' +
        '<p>' + esc(c.desc) + '</p>' +
        '<span class="cc-conquista-status">' + (ok ? '✔ Concluída' : 'Bloqueada') + '</span>' +
      '</article>';
    }).join('');
  }

  function renderEstatisticas() {
    var talentosAtivos = (estado.talentos || []).length;
    var dados = [
      { rotulo: 'Estabelecimento Atual', valor: estabAtualObj().nome },
      { rotulo: 'Franquias Globais Ativas', valor: fmt(totalFranquiasAbertas()) },
      { rotulo: 'Mascotes Colecionados', valor: totalMascotesDesbloqueados() + ' / ' + I.MASCOTES.length },
      { rotulo: 'Reputação Atual', valor: (estado.reputacao || 1).toFixed(2) + ' ★' },
      { rotulo: 'Total de moedas ganhas', valor: fmt(estado.totalGanho) },
      { rotulo: 'Moedas nesta temporada', valor: fmt(estado.totalGanhoNaRun || 0) },
      { rotulo: 'Toques em Cozinhar', valor: fmt(estado.cliques) },
      { rotulo: 'Receitas concluídas', valor: fmt(estado.pratosConcluidos || 0) },
      { rotulo: 'Clientes atendidos', valor: fmt(estado.clientesAtendidos || 0) },
      { rotulo: 'Maior combo seguido', valor: fmt(estado.maiorCombo || 0) + 'x' },
      { rotulo: 'Níveis de melhorias', valor: fmt(totalNiveisMelhorias()) },
      { rotulo: 'Caixas abertas & Fusões', valor: fmt(estado.caixasAbertas) + ' / ' + fmt(estado.fusoesRealizadas || 0) },
      { rotulo: 'Prestígios & Talentos', valor: fmt(estado.prestigios || 0) + ' (' + talentosAtivos + '/' + ARVORE_TALENTOS.length + ')' },
      { rotulo: 'Conquistas concluídas', valor: (estado.conquistas || []).length + ' / ' + CONQUISTAS.length }
    ];
    $('cc-stats-grid').innerHTML = dados.map(function (d) {
      return '<div class="cc-stat-box"><span>' + esc(d.rotulo) + '</span><strong>' + esc(d.valor) + '</strong></div>';
    }).join('');

    /* Gráfico de Produção Recente */
    var histProd = estado.historicoProducao || [];
    var grafBox = $('cc-grafico-producao');
    if (grafBox) {
      if (!histProd.length) {
        grafBox.innerHTML = '<p class="cc-texto" style="margin:0;">O gráfico de moedas por segundo será preenchido automaticamente conforme você joga!</p>';
      } else {
        var maxVal = Math.max.apply(null, histProd.map(function (x) { return x.valor; }).concat([1]));
        grafBox.innerHTML =
          '<p class="cc-texto" style="margin-top:0;">Evolução da renda passiva (moedas/s) nas últimas amostras:</p>' +
          '<div class="cc-grafico-barras">' +
            histProd.map(function (p) {
              var hPct = Math.max(8, Math.round((p.valor / maxVal) * 100));
              return '<div class="cc-barra-col" title="' + esc(p.hora) + ': ' + fmt(p.valor) + '/s">' +
                '<small style="font-size:0.72rem; font-weight:700;">' + fmt(p.valor) + '</small>' +
                '<div class="cc-barra-col-fill" style="height:' + hPct + '%;"></div>' +
                '<small style="font-size:0.72rem; color:var(--texto-suave);">' + esc(p.hora) + '</small>' +
              '</div>';
            }).join('') +
          '</div>';
      }
    }

    $('cc-historia-lista').innerHTML = CAPITULOS_HISTORIA.map(function (cap) {
      var ok = cap.req();
      return '<article class="cc-card-gestao' + (ok ? ' atual-estab' : ' bloqueado') + '">' +
        '<h4 style="margin:0 0 6px;">' + (ok ? '📖 ' : '🔒 ') + esc(cap.titulo) + '</h4>' +
        '<p style="margin:0; font-size:0.92rem; color:var(--texto-suave);">' + (ok ? esc(cap.texto) : 'Continue expandindo seu restaurante para desbloquear este capítulo.') + '</p>' +
      '</article>';
    }).join('');

    var hist = estado.historicoReputacao || [];
    $('cc-historico-rep-lista').innerHTML = hist.length
      ? hist.map(function (h) { return '<li><strong>[' + esc(h.hora) + ']</strong> ' + esc(h.motivo) + ' → <strong>' + esc(h.valor) + '</strong></li>'; }).join('')
      : '<li>Nenhuma alteração recente registrada ainda.</li>';
  }

  function renderChef() {
    renderLojaDiaria();
    $('cc-cats').innerHTML = I.CATEGORIAS.map(function (c) {
      var tenho = 0;
      I.MODELOS[c.id].forEach(function (m) { m.cores.forEach(function (_, i) { if (tem(I.chave(c.id, m.id, i))) { tenho++; } }); });
      return '<button type="button" class="cc-filtro" data-cat="' + c.id + '" aria-pressed="' + (c.id === ui.cat) + '">' +
        esc(c.nome) + ' <small>(' + tenho + '/' + I.totalDaCategoria(c.id) + ')</small></button>';
    }).join('');

    var modelos = I.MODELOS[ui.cat];
    if (!ui.modelo || !modelos.some(function (m) { return m.id === ui.modelo; })) {
      var eq = estado.equipado[ui.cat];
      ui.modelo = eq ? eq.split('|')[1] : modelos[0].id;
    }

    $('cc-modelos').innerHTML = modelos.map(function (m) {
      var tenho = m.cores.filter(function (_, i) { return tem(I.chave(ui.cat, m.id, i)); }).length;
      var rar = I.RARIDADES[m.raridade];
      var eq = estado.equipado[ui.cat];
      var usando = eq && eq.split('|')[1] === m.id;
      var iDisp = 0;
      for (var i = 0; i < m.cores.length; i++) { if (tem(I.chave(ui.cat, m.id, i))) { iDisp = i; break; } }
      var info = m.cores.length === 1 ? (tenho ? 'Disponível' : 'Ainda não tem') : tenho + ' de ' + m.cores.length + ' cores';
      return '<button type="button" class="cc-modelo rar-' + rar.id + (tenho ? '' : ' cc-trancado') + '" data-modelo="' + m.id + '" aria-pressed="' + (m.id === ui.modelo) + '">' +
        '<span class="cc-mini">' + I.miniaturaSVG(ui.cat, m.id, iDisp) + '</span>' +
        '<span class="cc-modelo-nome">' + esc(m.nome) + '</span>' +
        '<span class="cc-badge">' + rar.nome + '</span>' +
        '<span class="cc-modelo-info">' + info + '</span>' +
        (usando ? '<span class="cc-usando">Em uso</span>' : '') + '</button>';
    }).join('');

    var m = modelos.filter(function (x) { return x.id === ui.modelo; })[0];
    var eq = estado.equipado[ui.cat];
    var h = '<h3>' + esc(m.nome) + ' <span class="cc-badge rar-' + I.RARIDADES[m.raridade].id + '">' + I.RARIDADES[m.raridade].nome + '</span></h3><div class="cc-grade-cores">';
    m.cores.forEach(function (c, i) {
      var k = I.chave(ui.cat, m.id, i), ok = tem(k), uso = eq === k;
      h += '<button type="button" class="cc-cor' + (uso ? ' cc-cor-uso' : '') + '" data-vestir="' + k + '"' + (ok ? '' : ' disabled') + '>' +
        '<span class="cc-bolinha" style="background:' + c.hex + '"></span>' +
        '<span>' + esc(c.nome) + '</span>' +
        '<small>' + (uso ? 'Em uso' : (ok ? 'Disponível' : 'Trancado')) + '</small></button>';
    });
    h += '</div>';
    if (ui.cat === 'chapeu' && eq) {
      h += '<button type="button" class="cc-btn cc-btn-claro" id="cc-tirar-chapeu">Tirar chapéu</button>';
    }
    $('cc-cores-bloco').innerHTML = h;
  }

  function renderCaixas() {
    var frags = estado.fragmentosFusao || 0;
    var pity = estado.pityContador || 0;
    var faltaPity = Math.max(1, PITY_LIMITE - pity);
    $('cc-pity-status').innerHTML =
      'Fragmentos de Fusão acumulados: <strong>' + frags + '/5</strong> • ' +
      'Proteção Pity: <strong>' + pity + '/' + PITY_LIMITE + '</strong> (Item Raro+ garantido em ' + faltaPity + ' ' + (faltaPity === 1 ? 'abertura' : 'aberturas') + ').';

    var btnFundir = $('cc-btn-fundir');
    if (btnFundir) {
      btnFundir.disabled = frags < 5;
    }

    $('cc-lista-caixas').innerHTML = U.CAIXAS.map(function (cx) {
      var u = custoCaixa(cx);
      var b1 = acessoTotal() || estado.moedas >= u;
      var b10 = acessoTotal() || estado.moedas >= u * 10;
      var t1 = acessoTotal() ? 'Abrir 1 (grátis)' : 'Abrir 1 — ' + fmt(u);
      var t10 = acessoTotal() ? 'Abrir 10 (grátis)' : 'Abrir 10 — ' + fmt(u * 10);
      return '<article class="cc-caixa" style="--caixa:' + cx.cor + '">' +
        '<h3>' + esc(cx.nome) + '</h3>' +
        '<div class="cc-caixa-arte" aria-hidden="true"><i class="fa-solid fa-box-open"></i></div>' +
        '<p class="cc-texto">' + esc(cx.desc) + '</p>' +
        '<div class="cc-caixa-botoes">' +
          '<button type="button" class="cc-btn" data-caixa="' + cx.id + '" data-qtd="1"' + (b1 ? '' : ' disabled') + '>' + t1 + '</button>' +
          '<button type="button" class="cc-btn cc-btn-claro" data-caixa="' + cx.id + '" data-qtd="10"' + (b10 ? '' : ' disabled') + '>' + t10 + '</button>' +
        '</div>' +
        '<details><summary>Ver chances desta caixa</summary>' + tabelaChances(cx) + '</details></article>';
    }).join('');
  }

  function tabelaChances(cx) {
    var pesos = I.RARIDADES.map(function (r, i) { return i < cx.minimo ? 0 : r.peso * Math.pow(1 + cx.sorte + S.sorte, i); });
    var soma = pesos.reduce(function (a, b) { return a + b; }, 0);
    return '<table class="cc-tabela"><thead><tr><th>Raridade</th><th>Chance</th></tr></thead><tbody>' +
      I.RARIDADES.map(function (r, i) { return '<tr class="rar-' + r.id + '"><th>' + r.nome + '</th><td>' + pct(pesos[i] / soma) + '</td></tr>'; }).join('') +
      '</tbody></table>';
  }

  function renderAjuda() {
    $('cc-tabela-raridades').innerHTML = '<table class="cc-tabela"><thead><tr><th>Raridade</th><th>Quando ganha</th><th>Bônus ao usar</th><th>Valor repetido</th></tr></thead><tbody>' +
      I.RARIDADES.map(function (r) {
        return '<tr class="rar-' + r.id + '"><th>' + r.nome + '</th><td>' + r.regra + '</td><td>+' + pct(r.bonus) + '</td><td>' + fmt(Math.floor(r.valor * (1 + S.refund))) + ' moedas</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function renderTudo() {
    renderTutorial();
    renderPlacar();
    renderRitmo();
    renderEventoBanner();
    renderPainelPrato();
    renderSalaoClientes();
    renderAvatares();
    renderSets();
    renderMascotes();
    renderPedidosEDesafios();
    renderCampeonatos();
    renderRestaurante();
    renderFranquias();
    renderEquipe();
    renderFornecedores();
    renderDecoracao();
    renderEquipamentos();
    renderGrupos();
    renderListaMelhorias();
    renderBestiario();
    renderTemporada();
    renderPrestigio();
    renderConquistas();
    renderEstatisticas();
    renderChef();
    renderCaixas();
    renderAjuda();
  }

  /* ---------- 24. NAVEGAÇÃO HIERÁRQUICA & SUB-ABAS ---------- */
  function selecionarGrupoNav(grupo) {
    ui.navGrupo = grupo;
    document.querySelectorAll('[data-nav-grupo]').forEach(function (btn) {
      btn.setAttribute('aria-expanded', String(btn.getAttribute('data-nav-grupo') === grupo));
    });
    var primeiraAbaDoGrupo = null;
    document.querySelectorAll('.cc-aba[data-grupo-pai]').forEach(function (tab) {
      var pertence = tab.getAttribute('data-grupo-pai') === grupo;
      tab.hidden = !pertence;
      if (pertence && !primeiraAbaDoGrupo) {
        primeiraAbaDoGrupo = tab.id.replace('tab-', '');
      }
    });
    var abaAtualEl = $('tab-' + ui.aba);
    if (!abaAtualEl || abaAtualEl.hidden) {
      if (primeiraAbaDoGrupo) { mudarAba(primeiraAbaDoGrupo); }
    }
  }

  function mudarAba(aba) {
    var targetTab = $('tab-' + aba);
    if (!targetTab) { return; }
    var grupoPai = targetTab.getAttribute('data-grupo-pai');
    if (grupoPai && ui.navGrupo !== grupoPai) {
      ui.navGrupo = grupoPai;
      document.querySelectorAll('[data-nav-grupo]').forEach(function (btn) {
        btn.setAttribute('aria-expanded', String(btn.getAttribute('data-nav-grupo') === grupoPai));
      });
      document.querySelectorAll('.cc-aba[data-grupo-pai]').forEach(function (tab) {
        tab.hidden = tab.getAttribute('data-grupo-pai') !== grupoPai;
      });
    }

    ui.aba = aba;
    document.querySelectorAll('.cc-aba').forEach(function (t) {
      var on = t.id === 'tab-' + aba;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('.cc-painel').forEach(function (p) { p.hidden = p.id !== 'aba-' + aba; });
    document.querySelectorAll('.cc-mob-btn').forEach(function (m) {
      m.classList.toggle('ativo', m.getAttribute('data-mob-aba') === aba);
    });
  }

  function mudarSubAbaAjuda(sub) {
    var ehGuia = sub === 'guia';
    $('subtab-guia').setAttribute('aria-selected', String(ehGuia));
    $('subtab-patchnotes').setAttribute('aria-selected', String(!ehGuia));
    $('subpainel-guia').hidden = !ehGuia;
    $('subpainel-patchnotes').hidden = ehGuia;
  }

  /* ---------- 25. MODAL ---------- */
  function abrirModal(titulo, html, ouro, mostrarBotaoPadrao) {
    var modal = $('cc-modal');
    focoAnterior = document.activeElement;
    modal.classList.toggle('cc-modal-ouro', Boolean(ouro));
    $('cc-modal-titulo').textContent = titulo;
    $('cc-modal-corpo').innerHTML = html;
    $('cc-modal-fechar').hidden = (mostrarBotaoPadrao === false);
    modal.hidden = false;
    document.body.classList.add('cc-sem-rolagem');
    if (mostrarBotaoPadrao !== false) {
      $('cc-modal-fechar').focus();
    }
  }
  function fecharModal() {
    clearInterval(minigameTimer);
    $('cc-modal').hidden = true;
    document.body.classList.remove('cc-sem-rolagem');
    if (focoAnterior && focoAnterior.focus) { focoAnterior.focus(); }
  }

  /* ---------- 26. DEPURAÇÃO E TEMA ---------- */
  function abrirDebug() { $('cc-debug').hidden = false; $('cc-debug-fechar-foco').focus(); }
  function fecharDebug() { $('cc-debug').hidden = true; }
  function acaoDebug(a) {
    if (a === 'fechar') { fecharDebug(); return; }
    if (a === 'tudo') { estado.debugAtivo = true; }
    if (a === 'bloquear') { estado.debugAtivo = false; }
    if (a === 'moedas') { estado.moedas += 1e11; estado.totalGanho += 1e11; estado.totalGanhoNaRun = (estado.totalGanhoNaRun || 0) + 1e11; }
    if (a === 'estrelas') { estado.estrelas = (estado.estrelas || 0) + 500; }
    if (a === 'reputacao') { alterarReputacao(5.0, 'Depuração: Reputação Máxima'); }
    if (a === 'ingredientes') {
      FORNECEDORES.forEach(function (f) { estado.ingredientes[f.ingId] = qtdIngrediente(f.ingId) + 50; });
    }
    if (a === 'fragmentos') { estado.fragmentosFusao = (estado.fragmentosFusao || 0) + 15; }
    if (a === 'dourado') { invocarIngredienteDourado(); }
    if (a === 'maximizar') { U.UPGRADES.forEach(function (u) { estado.upgrades[u.id] = u.max || 100; }); }
    if (a === 'caixas') { var livre = estado.debugAtivo; estado.debugAtivo = true; abrirCaixa('chef', 10); estado.debugAtivo = livre; return; }
    if (a === 'token') { estado.token = true; }
    if (a === 'resetar') {
      var l = estado.debugLiberado;
      estado = criarEstadoNovo();
      estado.debugLiberado = l;
      document.body.setAttribute('data-cc-estab', 'barraca');
      aplicarDecoracaoVisual();
    }
    calcular();
    verificarConquistas();
    renderTudo();
    salvar();
  }

  function aplicarTema(tema) {
    var validos = { claro: 1, noturno: 1, retro: 1 };
    var t = validos[tema] ? tema : 'claro';
    document.body.setAttribute('data-cc-tema', t);
    var sel = $('cc-tema');
    if (sel) { sel.value = t; }
    try { window.localStorage.setItem(CHAVE_TEMA, t); } catch (e) {}
  }

  function atualizarBotaoSom() {
    var btn = $('cc-som-btn');
    if (!btn || !Som) { return; }
    var on = Som.estaLigado();
    btn.setAttribute('aria-pressed', String(on));
    btn.innerHTML = on
      ? '<i class="fa-solid fa-volume-high" aria-hidden="true"></i> Som: Ligado'
      : '<i class="fa-solid fa-volume-xmark" aria-hidden="true"></i> Som: Mudo';
  }

  function alternarAnimacoes() {
    var sem = document.body.classList.toggle('cc-sem-animacoes');
    var btn = $('cc-anim-btn');
    btn.setAttribute('aria-pressed', String(!sem));
    btn.innerHTML = !sem
      ? '<i class="fa-solid fa-wand-sparkles" aria-hidden="true"></i> Efeitos: On'
      : '<i class="fa-solid fa-ban" aria-hidden="true"></i> Efeitos: Off';
  }

  /* ---------- 27. LOOP EM TEMPO REAL ---------- */
  function tick() {
    var agora = Date.now(), dt = Math.min((agora - ultimoTick) / 1000, 1);
    ultimoTick = agora;

    var multFrenesi = agora < frenesiExpiraMs ? frenesiMult : 1;
    var ganho = S.porSegundo * dt * multFrenesi;

    if (S.auto > 0) {
      var autoVal = S.porClique * S.auto * dt * multFrenesi;
      ganho += autoVal;
      avancarPrato(S.auto * dt, S.porClique);
    }

    if (ganho > 0) {
      estado.moedas += ganho;
      estado.totalGanho += ganho;
      estado.totalGanhoNaRun = (estado.totalGanhoNaRun || 0) + ganho;
    }

    if (streakToques > 0 && agora - ultimoToqueMs > 1600) {
      streakToques = 0;
    }

    atualizarSalaoTick(dt);
    renderPlacar();
    if (ui.aba === 'cozinhar') {
      renderRitmo();
      renderPainelPrato();
    }
    if (ui.aba === 'melhorias') { renderListaMelhorias(); }
  }

  /* ---------- 28. EVENTOS & ATALHOS DE TECLADO ---------- */
  var toquesLogo = 0, timerLogo, digitado = '';
  document.addEventListener('click', function (e) {
    var t = e.target;

    var grpBtn = t.closest('[data-nav-grupo]');
    if (grpBtn) {
      if (Som) { Som.clique(); }
      selecionarGrupoNav(grpBtn.getAttribute('data-nav-grupo'));
      return;
    }

    var mobBtn = t.closest('[data-mob-aba]');
    if (mobBtn) {
      if (Som) { Som.clique(); }
      mudarAba(mobBtn.getAttribute('data-mob-aba'));
      return;
    }

    var tab = t.closest('.cc-aba');
    if (tab) {
      if (Som) { Som.clique(); }
      mudarAba(tab.id.replace('tab-', ''));
      return;
    }

    if (t.closest('#subtab-guia')) {
      if (Som) { Som.clique(); }
      mudarSubAbaAjuda('guia');
      return;
    }
    if (t.closest('#subtab-patchnotes')) {
      if (Som) { Som.clique(); }
      mudarSubAbaAjuda('patchnotes');
      return;
    }

    if (t.closest('#cc-pular-tutorial-btn')) {
      estado.tutorialConcluido = true;
      $('cc-tutorial-banner').hidden = true;
      salvar();
      return;
    }

    var evOp = t.closest('[data-ev-opcao]');
    if (evOp) {
      resolverEventoAleatorio(evOp.getAttribute('data-ev-opcao'));
      return;
    }

    if (t.closest('#cc-comprar-barato-btn') || t.closest('#cc-comprar-barato-upg-btn')) {
      comprarMelhoriaMaisBarata(false);
      return;
    }

    if (t.closest('#cc-autocompra-btn')) {
      ui.autoCompra = !ui.autoCompra;
      if (Som) { Som.clique(); }
      renderGrupos();
      mostrarToast(ui.autoCompra ? '🤖 Auto-compra Inteligente ativada!' : '🤖 Auto-compra desligada.');
      return;
    }

    if (t.closest('#cc-btn-fundir')) {
      fundirFragmentosRepetidos();
      return;
    }

    var vit = t.closest('[data-comprar-vitrine]');
    if (vit) {
      comprarItemLojaDiaria(vit.getAttribute('data-comprar-vitrine'));
      return;
    }

    if (t.closest('[data-ir-mascotes]')) {
      if (Som) { Som.clique(); }
      mudarAba('mascotes');
      return;
    }

    var eqMasc = t.closest('[data-equipar-mascote]');
    if (eqMasc) {
      equiparMascote(eqMasc.getAttribute('data-equipar-mascote'));
      return;
    }

    var franqBtn = t.closest('[data-franquia]');
    if (franqBtn) {
      comprarFranquia(franqBtn.getAttribute('data-franquia'));
      return;
    }

    if (t.closest('#cc-cozinhar')) { cozinhar(); return; }
    if (t.closest('#cc-risco-btn')) { ativarPedidoRelampago(); return; }
    if (t.closest('#cc-ponto-btn')) { abrirMinigamePontoCarne(); return; }
    if (t.closest('#cc-boss-btn')) { iniciarBossCritico(); return; }
    if (t.closest('#cc-chamar-cliente-btn')) { garantirClientesSalao(true); return; }

    var cliBtn = t.closest('[data-atender-cliente]');
    if (cliBtn) { atenderCliente(cliBtn.getAttribute('data-atender-cliente'), false); return; }

    if (t.closest('#cc-resgatar-pedido-esp')) { resgatarPedidoEspecial(); return; }
    var resgDiariaBtn = t.closest('[data-resgatar-diaria]');
    if (resgDiariaBtn) { resgatarMissaoDiaria(resgDiariaBtn.getAttribute('data-resgatar-diaria')); return; }

    var desBtn = t.closest('[data-iniciar-desafio]');
    if (desBtn) { iniciarModoDesafio(desBtn.getAttribute('data-iniciar-desafio')); return; }

    if (t.closest('#cc-btn-disputar-camp')) {
      var et = ETAPAS_CAMPEONATO[estado.campeonatoEtapa || 0];
      if (et) { iniciarDueloCampeonato('campeonato', et.etapa, et.metaPontos, et.nome, et); }
      return;
    }
    var rivBtn = t.closest('[data-desafiar-rival]');
    if (rivBtn) {
      var riv = RIVAIS.filter(function (x) { return x.id === rivBtn.getAttribute('data-desafiar-rival'); })[0];
      if (riv) { iniciarDueloCampeonato('rival', riv.id, riv.metaPontos, 'Duelo vs ' + riv.nome, riv); }
      return;
    }

    var tempBtn = t.closest('[data-temp-resg]');
    if (tempBtn) { resgatarTemporada(tempBtn.getAttribute('data-temp-resg')); return; }

    var expBtn = t.closest('[data-expandir]');
    if (expBtn) { expandirRestaurante(expBtn.getAttribute('data-expandir')); return; }

    var specBtn = t.closest('[data-spec]');
    if (specBtn) { escolherEspecializacao(specBtn.getAttribute('data-spec')); return; }

    var decBtn = t.closest('[data-decor]');
    if (decBtn) { comprarOuEquiparDecoracao(decBtn.getAttribute('data-decor')); return; }

    var eqpBtn = t.closest('[data-equip]');
    if (eqpBtn) { aprimorarEquipamento(eqpBtn.getAttribute('data-equip')); return; }

    var fornBtn = t.closest('[data-fornecedor]');
    if (fornBtn) { comprarInsumoFornecedor(fornBtn.getAttribute('data-fornecedor')); return; }

    var contBtn = t.closest('[data-contratar]');
    if (contBtn) { contratarEquipe(contBtn.getAttribute('data-contratar')); return; }

    var grp = t.closest('[data-grupo]');
    if (grp) { ui.grupo = grp.getAttribute('data-grupo'); if (Som) { Som.clique(); } renderGrupos(); renderListaMelhorias(); return; }

    var q = t.closest('[data-qtd-compra]');
    if (q) { var v = q.getAttribute('data-qtd-compra'); ui.qtd = v === 'max' ? 'max' : parseInt(v, 10); if (Som) { Som.clique(); } renderGrupos(); renderListaMelhorias(); return; }

    var cMax = t.closest('[data-comprar-max]');
    if (cMax) { comprar(cMax.getAttribute('data-comprar-max'), 'max'); return; }

    var c = t.closest('[data-comprar]');
    if (c) { comprar(c.getAttribute('data-comprar')); return; }

    var cat = t.closest('[data-cat]');
    if (cat) { ui.cat = cat.getAttribute('data-cat'); ui.modelo = null; if (Som) { Som.clique(); } renderChef(); return; }

    var mod = t.closest('[data-modelo]');
    if (mod) { ui.modelo = mod.getAttribute('data-modelo'); if (Som) { Som.clique(); } renderChef(); return; }

    var ves = t.closest('[data-vestir]');
    if (ves) { vestir(ves.getAttribute('data-vestir')); return; }

    if (t.closest('#cc-tirar-chapeu')) { tirarChapeu(); return; }

    var cx = t.closest('[data-caixa]');
    if (cx) { abrirCaixa(cx.getAttribute('data-caixa'), parseInt(cx.getAttribute('data-qtd'), 10)); return; }

    if (t.closest('#cc-btn-prestigiar')) { executarPrestigio(); return; }
    var tal = t.closest('[data-talento]');
    if (tal) { comprarTalento(tal.getAttribute('data-talento')); return; }

    var fCat = t.closest('[data-filtro-cat]');
    if (fCat) {
      ui.filtroCatReceita = fCat.getAttribute('data-filtro-cat');
      document.querySelectorAll('[data-filtro-cat]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === fCat));
      });
      renderBestiario();
      return;
    }

    var fConq = t.closest('[data-filtro-conq]');
    if (fConq) {
      ui.filtroConq = fConq.getAttribute('data-filtro-conq');
      document.querySelectorAll('[data-filtro-conq]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === fConq));
      });
      renderConquistas();
      return;
    }

    var fMasc = t.closest('[data-filtro-masc]');
    if (fMasc) {
      ui.filtroMascote = fMasc.getAttribute('data-filtro-masc');
      document.querySelectorAll('[data-filtro-masc]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === fMasc));
      });
      renderMascotes();
      return;
    }

    if (t.closest('#cc-btn-exportar')) { exportarSave(); return; }
    if (t.closest('#cc-btn-baixar-save')) { baixarSaveArquivo(); return; }
    if (t.closest('#cc-btn-importar')) { importarSave(); return; }
    if (t.closest('#cc-btn-restaurar-backup')) { restaurarBackupSave(); return; }

    if (t.closest('#cc-modal-fechar') || t === $('cc-modal')) { fecharModal(); return; }

    if (t.closest('#cc-som-btn')) {
      if (Som) { Som.alternar(); atualizarBotaoSom(); }
      return;
    }

    if (t.closest('#cc-anim-btn')) {
      alternarAnimacoes();
      return;
    }

    if (t.closest('#cc-resetar')) {
      if (window.confirm('Tem certeza de que quer apagar todo o progresso?')) {
        estado = criarEstadoNovo();
        document.body.setAttribute('data-cc-estab', 'barraca');
        aplicarDecoracaoVisual();
        salvar(); calcular(); renderTudo();
      }
      return;
    }

    if (t.closest('.header-logo-selo')) {
      toquesLogo += 1;
      clearTimeout(timerLogo);
      timerLogo = setTimeout(function () { toquesLogo = 0; }, 1500);
      if (toquesLogo >= 5) { toquesLogo = 0; estado.debugLiberado = true; salvar(); abrirDebug(); }
      return;
    }

    var dbg = t.closest('[data-dbg]');
    if (dbg) { acaoDebug(dbg.getAttribute('data-dbg')); }
  });

  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'cc-tema') {
      aplicarTema(e.target.value);
    }
    if (e.target && e.target.id === 'cc-prato-select') {
      estado.pratoAtual = e.target.value;
      estado.pratoProgresso = 0;
      if (Som) { Som.clique(); }
      renderPainelPrato();
      salvar();
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'cc-busca-receita') {
      ui.buscaReceita = e.target.value;
      renderBestiario();
    }
  });

  document.addEventListener('keydown', function (e) {
    var tag = e.target && e.target.tagName;
    var emCampoTexto = tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT';

    if (e.key === 'Escape') {
      if (!$('cc-modal').hidden) { fecharModal(); }
      if (!$('cc-debug').hidden) { fecharDebug(); }
      return;
    }

    if (emCampoTexto) { return; }

    if (e.key === ' ' || e.key === 'c' || e.key === 'C') {
      if (!$('cc-modal').hidden) { return; }
      if (document.activeElement && document.activeElement.id === 'cc-cozinhar' && e.key === ' ') {
        return;
      }
      e.preventDefault();
      cozinhar();
      return;
    }

    if (e.key === 'v' || e.key === 'V') {
      e.preventDefault();
      comprarMelhoriaMaisBarata(false);
      return;
    }

    if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      ui.autoCompra = !ui.autoCompra;
      if (Som) { Som.clique(); }
      renderGrupos();
      mostrarToast(ui.autoCompra ? '🤖 Auto-compra Inteligente ativada!' : '🤖 Auto-compra desligada.');
      return;
    }

    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      fundirFragmentosRepetidos();
      return;
    }

    if (e.key === 'r' || e.key === 'R') {
      if (ui.aba !== 'cozinhar') { mudarAba('cozinhar'); }
      ativarPedidoRelampago();
      return;
    }

    if (e.key === 'p' || e.key === 'P') {
      if ($('cc-modal').hidden) { abrirMinigamePontoCarne(); }
      return;
    }

    if (e.key === 'b' || e.key === 'B') {
      if (ui.aba !== 'cozinhar') { mudarAba('cozinhar'); }
      iniciarBossCritico();
      return;
    }

    if (e.key === 'n' || e.key === 'N') {
      if (ui.aba !== 'cozinhar') { mudarAba('cozinhar'); }
      garantirClientesSalao(true);
      return;
    }

    if (e.key === 'm' || e.key === 'M') {
      ui.qtd = ui.qtd === 'max' ? 1 : 'max';
      if (ui.aba !== 'melhorias') { mudarAba('melhorias'); }
      renderGrupos();
      renderListaMelhorias();
      mostrarToast('Modo de compra: ' + (ui.qtd === 'max' ? 'Máximo (MAX)' : '1 nível'));
      return;
    }

    if (e.key === '1') { selecionarGrupoNav('jogar'); return; }
    if (e.key === '2') { selecionarGrupoNav('gerenciar'); return; }
    if (e.key === '3') { selecionarGrupoNav('progressao'); return; }
    if (e.key === '4') { selecionarGrupoNav('colecao'); return; }
    if (e.key === '5') { selecionarGrupoNav('sistema'); return; }

    if (e.key && e.key.length === 1) {
      digitado = (digitado + e.key.toLowerCase()).slice(-SEGREDO_DEBUG.length);
      if (digitado === SEGREDO_DEBUG) { digitado = ''; estado.debugLiberado = true; salvar(); abrirDebug(); }
    }
  });

  function iniciar() {
    try {
      var temaSalvo = window.localStorage.getItem(CHAVE_TEMA) || 'claro';
      aplicarTema(temaSalvo);
    } catch (e) {}

    atualizarBotaoSom();
    carregar();
    document.body.setAttribute('data-cc-estab', estado.estabelecimento || 'barraca');
    aplicarDecoracaoVisual();
    calcular();

    var seg = Math.min(Math.floor((Date.now() - estado.ultimoSalvo) / 1000), 8 * 3600);
    if (seg >= 10 && S.porSegundo > 0) {
      var ganho = S.porSegundo * seg * (1 + S.offline);
      estado.moedas += ganho;
      estado.totalGanho += ganho;
      estado.totalGanhoNaRun = (estado.totalGanhoNaRun || 0) + ganho;
      aviso('Enquanto você estava fora, sua cozinha preparou +' + fmt(ganho) + ' moedas!');
    }

    verificarConquistas();
    selecionarGrupoNav('jogar');
    renderTudo();
    agendarProximoDourado();
    setInterval(tick, 200);
    setInterval(function () {
      if (ui.autoCompra) {
        if (comprarMelhoriaMaisBarata(true)) {
          renderPlacar();
          if (ui.aba === 'melhorias') { renderListaMelhorias(); }
        }
      }
      /* Registra amostra de produção para o gráfico */
      var minAtual = Math.floor(Date.now() / 60000);
      if (minAtual !== ultimoMinutoAmostra) {
        ultimoMinutoAmostra = minAtual;
        estado.historicoProducao = estado.historicoProducao || [];
        estado.historicoProducao.push({
          hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          valor: Math.round(S.porSegundo)
        });
        if (estado.historicoProducao.length > 8) {
          estado.historicoProducao.shift();
        }
      }
    }, 1000);
    setInterval(function () {
      if (Math.random() < 0.35) {
        dispararEventoAleatorio();
      }
    }, 90000);
    setInterval(salvar, 5000);
    window.addEventListener('beforeunload', salvar);
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();