export const alimentos = [
  // 🍚 ARROZ E GRÃOS (Expansão)
  { nome: "arroz branco", proteina: 2.5, carbo: 28, gordura: 0.3, calorias: 130 },
  { nome: "arroz branco cozido", proteina: 2.5, carbo: 28, gordura: 0.3, calorias: 130 },
  { nome: "arroz integral", proteina: 2.6, carbo: 23, gordura: 1, calorias: 111 },
  { nome: "arroz integral cozido", proteina: 2.6, carbo: 23, gordura: 1, calorias: 111 },
  { nome: "arroz com feijão", proteina: 6, carbo: 30, gordura: 1, calorias: 170 },
  { nome: "arroz à grega", proteina: 3, carbo: 32, gordura: 4, calorias: 175 },
  { nome: "quinoa cozida", proteina: 4.4, carbo: 21, gordura: 1.9, calorias: 120 },
  { nome: "aveia em flocos", proteina: 14, carbo: 67, gordura: 7, calorias: 390 },
  { nome: "milho cozido", proteina: 3.2, carbo: 19, gordura: 1.2, calorias: 96 },

  // 🍛 FEIJÕES E LEGUMINOSAS
  { nome: "feijão", proteina: 9, carbo: 14, gordura: 0.5, calorias: 127 },
  { nome: "feijão carioca", proteina: 9, carbo: 14, gordura: 0.5, calorias: 127 },
  { nome: "feijão preto", proteina: 8.9, carbo: 23, gordura: 0.5, calorias: 132 },
  { nome: "feijão fradinho", proteina: 8, carbo: 21, gordura: 0.6, calorias: 120 },
  { nome: "lentilha cozida", proteina: 9, carbo: 20, gordura: 0.4, calorias: 116 },
  { nome: "grão de bico cozido", proteina: 8.9, carbo: 27, gordura: 2.6, calorias: 164 },
  { nome: "ervilha cozida", proteina: 5, carbo: 14, gordura: 0.4, calorias: 81 },

  // 🥩 CARNES BOVINAS (Cortes Comuns)
  { nome: "carne", proteina: 26, carbo: 0, gordura: 15, calorias: 250 },
  { nome: "carne moída patinho", proteina: 35, carbo: 0, gordura: 7, calorias: 219 },
  { nome: "carne moída acém", proteina: 25, carbo: 0, gordura: 14, calorias: 240 },
  { nome: "picanha com gordura", proteina: 20, carbo: 0, gordura: 25, calorias: 310 },
  { nome: "picanha sem gordura", proteina: 28, carbo: 0, gordura: 8, calorias: 190 },
  { nome: "contra filé", proteina: 26, carbo: 0, gordura: 12, calorias: 212 },
  { nome: "alcatra", proteina: 28, carbo: 0, gordura: 6, calorias: 175 },
  { nome: "filé mignon", proteina: 32, carbo: 0, gordura: 6, calorias: 190 },
  { nome: "costela bovina", proteina: 18, carbo: 0, gordura: 30, calorias: 360 },
  { nome: "cupim", proteina: 18, carbo: 0, gordura: 28, calorias: 330 },
  { nome: "fígado bovino", proteina: 20, carbo: 4, gordura: 5, calorias: 145 },

  // 🍗 AVES
  { nome: "frango grelhado", proteina: 31, carbo: 0, gordura: 3.6, calorias: 165 },
  { nome: "peito de frango", proteina: 31, carbo: 0, gordura: 3.6, calorias: 165 },
  { nome: "sobrecoxa de frango", proteina: 24, carbo: 0, gordura: 11, calorias: 200 },
  { nome: "coxa de frango", proteina: 22, carbo: 0, gordura: 9, calorias: 175 },
  { nome: "coração de frango", proteina: 16, carbo: 1, gordura: 10, calorias: 160 },
  { nome: "peru fatiado", proteina: 22, carbo: 1, gordura: 2, calorias: 110 },

  // 🐷 SUÍNOS
  { nome: "lombo de porco", proteina: 28, carbo: 0, gordura: 6, calorias: 175 },
  { nome: "pernil", proteina: 26, carbo: 0, gordura: 11, calorias: 210 },
  { nome: "bacon fatiado", proteina: 37, carbo: 1, gordura: 42, calorias: 540 },
  { nome: "costelinha de porco", proteina: 20, carbo: 0, gordura: 22, calorias: 280 },

  // 🐟 PEIXES E FRUTOS DO MAR
  { nome: "tilápia grelhada", proteina: 26, carbo: 0, gordura: 2.7, calorias: 128 },
  { nome: "salmão grelhado", proteina: 25, carbo: 0, gordura: 13, calorias: 220 },
  { nome: "sardinha em lata", proteina: 24, carbo: 0, gordura: 12, calorias: 208 },
  { nome: "bacalhau cozido", proteina: 18, carbo: 0, gordura: 1, calorias: 82 },
  { nome: "camarão grelhado", proteina: 24, carbo: 1, gordura: 1, calorias: 110 },

  // 🍎 FRUTAS (Grande Variedade Brasil)
  { nome: "banana nanica", proteina: 1.4, carbo: 26, gordura: 0.1, calorias: 105, unidade: true },
  { nome: "banana terra", proteina: 1.5, carbo: 33, gordura: 0.4, calorias: 130 },
  { nome: "mamão papaia", proteina: 0.5, carbo: 11, gordura: 0.1, calorias: 45 },
  { nome: "mamão formosa", proteina: 0.5, carbo: 12, gordura: 0.1, calorias: 50 },
  { nome: "manga palmer", proteina: 0.8, carbo: 15, gordura: 0.3, calorias: 60 },
  { nome: "abacaxi", proteina: 0.5, carbo: 13, gordura: 0.1, calorias: 50 },
  { nome: "melancia", proteina: 0.6, carbo: 8, gordura: 0.2, calorias: 30 },
  { nome: "melão", proteina: 0.8, carbo: 8, gordura: 0.2, calorias: 34 },
  { nome: "uva", proteina: 0.7, carbo: 18, gordura: 0.2, calorias: 67 },
  { nome: "morango", proteina: 0.7, carbo: 8, gordura: 0.3, calorias: 32 },
  { nome: "limão", proteina: 1.1, carbo: 9, gordura: 0.3, calorias: 29 },
  { nome: "maracujá", proteina: 2.2, carbo: 23, gordura: 0.7, calorias: 97 },
  { nome: "goiaba", proteina: 2.6, carbo: 14, gordura: 1, calorias: 68 },
  { nome: "pera", proteina: 0.4, carbo: 15, gordura: 0.1, calorias: 57, unidade: true },
  { nome: "açai polpa", proteina: 0.8, carbo: 6, gordura: 5, calorias: 65 },
  { nome: "kiwi", proteina: 1.1, carbo: 15, gordura: 0.5, calorias: 61, unidade: true },
  { nome: "jabuticaba", proteina: 0.6, carbo: 15, gordura: 0.1, calorias: 58 },

  // 🥦 VEGETAIS E LEGUMES
  { nome: "abóbora cabotiá", proteina: 1, carbo: 12, gordura: 0.5, calorias: 48 },
  { nome: "abobrinha cozida", proteina: 1.1, carbo: 3.4, gordura: 0.1, calorias: 17 },
  { nome: "berinjela cozida", proteina: 0.8, carbo: 6, gordura: 0.2, calorias: 25 },
  { nome: "chuchu cozido", proteina: 0.6, carbo: 3.4, gordura: 0.1, calorias: 15 },
  { nome: "couve refogada", proteina: 2.5, carbo: 9, gordura: 4.5, calorias: 80 },
  { nome: "espinafre cozido", proteina: 3, carbo: 4, gordura: 0.5, calorias: 23 },
  { nome: "repolho picado", proteina: 1.3, carbo: 6, gordura: 0.1, calorias: 25 },
  { nome: "beterraba cozida", proteina: 1.7, carbo: 10, gordura: 0.2, calorias: 43 },
  { nome: "mandioca cozida", proteina: 1.3, carbo: 38, gordura: 0.3, calorias: 160 },

  // 🧀 LATICÍNIOS E SUBSTITUTOS
  { nome: "ovo de codorna", proteina: 1.2, carbo: 0.1, gordura: 1, calorias: 15, unidade: true },
  { nome: "iogurte natural", proteina: 3.5, carbo: 5, gordura: 3, calorias: 60 },
  { nome: "iogurte grego", proteina: 7, carbo: 4, gordura: 5, calorias: 90 },
  { nome: "queijo cottage", proteina: 11, carbo: 3.4, gordura: 4.3, calorias: 98 },
  { nome: "queijo minas frescal", proteina: 17, carbo: 3, gordura: 20, calorias: 260 },
  { nome: "queijo parmesão", proteina: 35, carbo: 4, gordura: 25, calorias: 400 },
  { nome: "manteiga", proteina: 0.9, carbo: 0.1, gordura: 81, calorias: 717 },
  { nome: "margarina", proteina: 0, carbo: 0, gordura: 80, calorias: 710 },

  // 🥯 LANCHES E PADARIA
  { nome: "pão de queijo", proteina: 5, carbo: 30, gordura: 12, calorias: 250, unidade: true },
  { nome: "coxinha de frango", proteina: 8, carbo: 35, gordura: 15, calorias: 310, unidade: true },
  { nome: "empada", proteina: 5, carbo: 25, gordura: 18, calorias: 280, unidade: true },
  { nome: "pastel de carne", proteina: 10, carbo: 40, gordura: 20, calorias: 380, unidade: true },
  { nome: "kibe frito", proteina: 12, carbo: 30, gordura: 15, calorias: 300, unidade: true },
  { nome: "bolacha salgada", proteina: 8, carbo: 70, gordura: 12, calorias: 430 },
  { nome: "bolacha recheada", proteina: 5, carbo: 70, gordura: 20, calorias: 480 },

  // 🥤 BEBIDAS
  { nome: "suco de laranja natural", proteina: 0.7, carbo: 10, gordura: 0.2, calorias: 45 },
  { nome: "suco de uva integral", proteina: 0, carbo: 14, gordura: 0, calorias: 60 },
  { nome: "café sem açúcar", proteina: 0, carbo: 0, gordura: 0, calorias: 1 },
  { nome: "refrigerante", proteina: 0, carbo: 10.5, gordura: 0, calorias: 42 },
  { nome: "cerveja", proteina: 0.5, carbo: 3.5, gordura: 0, calorias: 43 },
  { nome: "vinho tinto", proteina: 0.1, carbo: 2.6, gordura: 0, calorias: 85 },

  // 🥜 OLEAGINOSAS E GORDURAS
  { nome: "amendoim", proteina: 26, carbo: 16, gordura: 49, calorias: 567 },
  { nome: "castanha do pará", proteina: 14, carbo: 12, gordura: 66, calorias: 656 },
  { nome: "castanha de caju", proteina: 18, carbo: 30, gordura: 44, calorias: 553 },
  { nome: "azeite de oliva", proteina: 0, carbo: 0, gordura: 100, calorias: 884 },
  { nome: "creme de amendoim", proteina: 25, carbo: 20, gordura: 50, calorias: 590 },

  // 🍚 GRÃOS, FARINHAS E CEREAIS
  { nome: "arroz de carreteiro", proteina: 7, carbo: 35, gordura: 8, calorias: 240 },
  { nome: "feijão tropeiro", proteina: 12, carbo: 28, gordura: 15, calorias: 295 },
  { nome: "baião de dois", proteina: 8, carbo: 32, gordura: 6, calorias: 215 },
  { nome: "canjica / curau", proteina: 3, carbo: 38, gordura: 5, calorias: 210 },
  { nome: "farinha de mandioca", proteina: 1.1, carbo: 80, gordura: 0.3, calorias: 330 },
  { nome: "farinha de milho", proteina: 7, carbo: 78, gordura: 1, calorias: 350 },
  { nome: "granola", proteina: 10, carbo: 65, gordura: 12, calorias: 410 },

  // 🥩 CHURRASCO E CARNES ESPECÍFICAS
  { nome: "maminha", proteina: 25, carbo: 0, gordura: 10, calorias: 190 },
  { nome: "vazio / fraldinha", proteina: 24, carbo: 0, gordura: 14, calorias: 220 },
  { nome: "cupim assado", proteina: 18, carbo: 0, gordura: 25, calorias: 300 },
  { nome: "coração de galinha", proteina: 15, carbo: 1, gordura: 10, calorias: 155 },
  { nome: "língua bovina", proteina: 19, carbo: 0, gordura: 16, calorias: 225 },
  { nome: "carne de sol", proteina: 28, carbo: 0, gordura: 9, calorias: 200 },
  { nome: "charque", proteina: 22, carbo: 0, gordura: 15, calorias: 250 },

  // 🐟 PEIXES E FRUTOS DO MAR (BRASIL)
  { nome: "tucunaré", proteina: 19, carbo: 0, gordura: 1, calorias: 90 },
  { nome: "pintado / surubim", proteina: 18, carbo: 0, gordura: 4, calorias: 110 },
  { nome: "tambaqui", proteina: 17, carbo: 0, gordura: 8, calorias: 145 },
  { nome: "truta", proteina: 21, carbo: 0, gordura: 5, calorias: 130 },
  { nome: "caranguejo (carne)", proteina: 18, carbo: 0, gordura: 1, calorias: 85 },
  { nome: "lula cozida", proteina: 15, carbo: 3, gordura: 1, calorias: 90 },

  // 🍎 FRUTAS REGIONAIS E EXÓTICAS
  { nome: "caju", proteina: 1, carbo: 10, gordura: 0.3, calorias: 43, unidade: true },
  { nome: "acerola", proteina: 0.4, carbo: 8, gordura: 0.2, calorias: 32 },
  { nome: "pitaya", proteina: 1.2, carbo: 13, gordura: 0.4, calorias: 60, unidade: true },
  { nome: "carambola", proteina: 1, carbo: 7, gordura: 0.3, calorias: 31, unidade: true },
  { nome: "jabuticaba", proteina: 0.6, carbo: 15, gordura: 0.1, calorias: 55 },
  { nome: "graviola", proteina: 1, carbo: 17, gordura: 0.3, calorias: 66 },
  { nome: "cupuaçu", proteina: 0.8, carbo: 14, gordura: 1, calorias: 70 },
  { nome: "buriti", proteina: 3, carbo: 12, gordura: 10, calorias: 145 },

  // 🥦 VEGETAIS E PANCS
  { nome: "ora-pro-nóbis", proteina: 20, carbo: 5, gordura: 0, calorias: 100 }, // Desidratada/Pó (Fresco é menos)
  { nome: "taioba refogada", proteina: 2.5, carbo: 6, gordura: 0.4, calorias: 35 },
  { nome: "maxixe cozido", proteina: 1, carbo: 3, gordura: 0.1, calorias: 14 },
  { nome: "quiabo refogado", proteina: 2, carbo: 7, gordura: 0.2, calorias: 33 },
  { nome: "jiló frito", proteina: 1, carbo: 8, gordura: 12, calorias: 140 },
  { nome: "palmito em conserva", proteina: 1.8, carbo: 4, gordura: 0.2, calorias: 25 },

  // 🥐 PADARIA E LANCHES DE BOTECO
  { nome: "pão de batata", proteina: 6, carbo: 35, gordura: 8, calorias: 230, unidade: true },
  { nome: "sonho de creme", proteina: 5, carbo: 55, gordura: 18, calorias: 400, unidade: true },
  { nome: "quibe assado", proteina: 14, carbo: 22, gordura: 8, calorias: 210 },
  { nome: "esfiha de carne", proteina: 8, carbo: 30, gordura: 10, calorias: 240, unidade: true },
  { nome: "bolinho de bacalhau", proteina: 8, carbo: 18, gordura: 15, calorias: 240, unidade: true },
  { nome: "torresmo", proteina: 30, carbo: 0, gordura: 50, calorias: 580 },
  { nome: "pamonha doce", proteina: 4, carbo: 50, gordura: 8, calorias: 290, unidade: true },

  // 🍳 COMIDAS PRONTAS / PRATOS DO DIA
  { nome: "estrogonofe de frango", proteina: 18, carbo: 10, gordura: 15, calorias: 245 },
  { nome: "estrogonofe de carne", proteina: 20, carbo: 10, gordura: 18, calorias: 280 },
  { nome: "lasanha à bolonhesa", proteina: 12, carbo: 30, gordura: 14, calorias: 290 },
  { nome: "nhoque ao sugo", proteina: 4, carbo: 35, gordura: 3, calorias: 185 },
  { nome: "yakisoba", proteina: 10, carbo: 25, gordura: 8, calorias: 210 },

  // 🍬 SOBREMESAS E DOCES TÍPICOS
  { nome: "goiabada", proteina: 0, carbo: 75, gordura: 0, calorias: 300 },
  { nome: "doce de leite", proteina: 6, carbo: 55, gordura: 7, calorias: 310 },
  { nome: "pudim de leite", proteina: 5, carbo: 30, gordura: 8, calorias: 210 },
  { nome: "paçoca", proteina: 12, carbo: 50, gordura: 28, calorias: 500, unidade: true },
  { nome: "pé de moleque", proteina: 10, carbo: 60, gordura: 22, calorias: 480 },
  { nome: "cocada", proteina: 3, carbo: 65, gordura: 15, calorias: 410 },

  // 🥤 BEBIDAS E SUPLEMENTOS
  { nome: "whey protein", proteina: 24, carbo: 3, gordura: 1.5, calorias: 120 },
  { nome: "creatina", proteina: 0, carbo: 0, gordura: 0, calorias: 0 },
  { nome: "caldo de cana", proteina: 0, carbo: 20, gordura: 0, calorias: 80 },
  { nome: "água de coco", proteina: 0, carbo: 5, gordura: 0, calorias: 20 },
  { nome: "chimarrão / tereré", proteina: 0, carbo: 0, gordura: 0, calorias: 1 }

];