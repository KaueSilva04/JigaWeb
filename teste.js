const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3001 });
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;


app.use(cors());
app.use(express.json());




// Rota para servir o JSON
app.get('/api/estadoJson', (req, res) => {
  try {

    // Convertendo o Map para um array de objetos {id, val}
    const estadoAtualArray = Array.from(estadoAtual, ([id, val]) => ({ id, val }));

    // Convertendo o array para JSON
    //const estadoAtualJson = JSON.stringify(estadoAtualArray, null, 2);

    res.json(estadoAtualArray);
  } catch (err) {
    console.error('Erro ao carregar estados:', err);
    res.status(500).json({ error: 'Erro ao carregar estados' });
  }
});


// Rota para servir o JSON
app.get('/api/jigaJson', (req, res) => {
  try {
    const data = carregarListaJigas();
    res.json(data);
  } catch (err) {
    console.error('Erro ao carregar jigas:', err);
    res.status(500).json({ error: 'Erro ao carregar jigas' });
  }
});



app.post("/api/comutar", async (req, res) => {
  let { ip, id, val, tipo } = req.body;

  if (!ip || typeof id !== "number" || typeof val !== "number") {
    return res.status(400).json({ success: false, error: "Dados inválidos." });
  }

  //console.log(ip,id,val,tipo)
  try {
    // Realiza a comutação


    const resultado = await enviarComutacao(ip, id, val, tipo);

    // Se o resultado não for válido ou não contiver as informações esperadas
    if (!resultado) {
      return res.status(500).json({ success: false, error: "Erro interno no servidor." });
    }

    // Resposta de sucesso com os dados da comutação
    res.json({ success: true, data: resultado });
  } catch (error) {
    console.error("Erro ao processar a comutação:", error);
    res.status(500).json({ success: false, error: "Erro no servidor ao processar a comutação." });
  }



});

app.post("/api/comutarAll", async (req, res) => {

  const { jiga , val} = req.body;

  if (!jiga) {
    return res.status(400).json({ success: false, error: "Nome da JIGA não fornecido." });
  }

  try {
    const jigaInfoList = carregarListaJigas();
    const jigaInfo = jigaInfoList.find(item => item.id === `${jiga}.local`);
    if (!jigaInfo) {
      return res.status(404).json({ success: false, error: `JIGA ${jiga} não encontrada.` });
    }

    const ip = jigaInfo.ip.replace(/:$/, '');
    const url = `http://${ip}/getconfig`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(500).json({ success: false, error: "Erro ao buscar configuração da JIGA." });
    }

    const data = await response.json();
    const equipamentos = data?.cfg?.eqp;
    console.log(equipamentos)
    if (!equipamentos || !Array.isArray(equipamentos)) {
      return res.status(500).json({ success: false, error: "Lista de equipamentos inválida ou ausente." });
    }
    // ou qualquer outra lógica de comutação
    // Executa comutação para cada equipamento
    const resultados = [];

    for (let equipamento of equipamentos) {
      const { id, idTipo } = equipamento;

      if (!id || !idTipo) continue;


      const resultado = await enviarComutacao(ip, id, val, idTipo);
      // Alterna valor entre 1 e 2, se desejar
     
      resultados.push({
        id,
        idTipo,
        sucesso: resultado?.success !== false,
        resposta: resultado,
      });


    }

    res.json({ success: true, jiga, total: resultados.length, resultados });

  } catch (error) {
    console.error("❌ Erro no comutarAll:", error);
    res.status(500).json({ success: false, error: "Erro interno ao executar comutarAll." });
  }
});



app.get('/api/equipaments/:jiga', async (req, res) => {
  const { jiga } = req.params;
  try {
    const data = await getDadosReaisDaJiga(jiga); // Já está agrupado
    if (!data) {
      throw new Error(`Nenhum dado encontrado para a JIGA: ${jiga}`);
    }
    res.json(data); // Envia direto
  } catch (error) {
    console.error(`Erro ao buscar dados para a JIGA ${jiga}:`, error);
    res.status(500).json({ error: "Erro ao obter dados reais da JIGA", details: error.message });
  }
});




const endpointMap = {
  alm: "setalm",
  djtri: "setdjtri",
  secc: "setsecc",
  djmono: "setdjmono",
  comut: "setcomut",
};

const estadoAtual = new Map(); // chave: ID (ex: 11), valor: val (ex: 1)


function carregarListaJigas() {
  const filePath = path.join(__dirname, 'jigas_data.json'); // nome do arquivo
  const rawData = fs.readFileSync(filePath);
  return JSON.parse(rawData);
}


async function comitarAll(jiga) {
  const jigaInfoList = carregarListaJigas();
  const jigaInfo = jigaInfoList.find(item => item.id === `${jiga}.local`);
  if (!jigaInfo) {
    console.error(`❌ JIGA ${jiga} não encontrada no JSON.`);
    return null;
  }

  const ip = jigaInfo.ip.replace(/:$/, '');
  const url = `http://${ip}/getconfig`;
  const response = await fetch(url);
  await conectarWebSocket(jiga);
  if (!response.ok) {
    throw new Error(`Falha ao obter dados para a JIGA: ${jiga}`);
  }

  let val;
  eqps.forEach(e => {

    val = 1;

    enviarComutacao(ip, e.id, val, e.idTipo)

    val = val === 1 ? 2 : 1;


  });
}


async function getDadosReaisDaJiga(jiga) {
  const jigaInfoList = carregarListaJigas();
  const jigaInfo = jigaInfoList.find(item => item.id === `${jiga}.local`);
  if (!jigaInfo) {
    console.error(`❌ JIGA ${jiga} não encontrada no JSON.`);
    return null;
  }


  const ip = jigaInfo.ip.replace(/:$/, '');
  const url = `http://${ip}/getconfig`;
  const response = await fetch(url);
  await conectarWebSocket(jiga);
  if (!response.ok) {
    throw new Error(`Falha ao obter dados para a JIGA: ${jiga}`);
  }

  const data = await response.json();
  const eqps = data.cfg.eqp;
  const boList = eqps.map(item => item.bo).filter(Boolean).flat();


  const equipamentosPorGrupo = {};

  eqps.forEach(e => {
    const prefixo = e.name.trim().split(" ")[0];

    if (!equipamentosPorGrupo[prefixo]) {
      equipamentosPorGrupo[prefixo] = [];
    }



    let entradaId;

    switch (e.idTipo) {
      case "alm":
        entradaId = e.bo?.[0];
        break;
      case "djmono":
      case "djtrip":
        entradaId = e.boAbt?.[0];
        break;
      case "secc":
        const abt = e.boAbt?.[0];
        const fch = e.boFch?.[0];
        if (typeof abt === "number" && typeof fch === "number") {
          entradaId = abt; // Ou combine os dois, depende do seu modelo
        }
        break;
      case "comut":
        entradaId = null;
        break;
      default:
        entradaId = null;
    }
    const estado = entradaId != null ? estadoAtual.get(entradaId) : "indefinido";

    equipamentosPorGrupo[prefixo].push({
      id: e.id,
      idBO: entradaId,
      idTipo: e.idTipo,
      name: e.name.trim(),
      estado
    });
  });

  const resultado = Object.entries(equipamentosPorGrupo).map(([grupo, equipamentos]) => ({
    grupo,
    equipamentos
  }));

  return resultado;
}


function agruparEquipamentosPorGrupo(data) {
  const equipamentosPorGrupo = {};

  data.cfg.eqp.forEach(e => {
    const prefixo = e.name.split(" ")[0];
    if (!equipamentosPorGrupo[prefixo]) {
      equipamentosPorGrupo[prefixo] = [];
    }
    equipamentosPorGrupo[prefixo].push({
      id: e.id,
      idTipo: e.idTipo,
      name: e.name,

      estado: estadoAtual.get(estado)
    });
  });

  return equipamentosPorGrupo;

}


const novosDados = [];


async function conectarWebSocket(jiga) {
  return new Promise((resolve, reject) => {
    const jigaInfoList = carregarListaJigas();
    const jigaInfo = jigaInfoList.find(item => item.id === `${jiga}.local`);
    if (!jigaInfo) {
      console.error(`❌ JIGA ${jiga} não encontrada no JSON.`);
      return null;
    }
    const ip = jigaInfo.ip.replace(/:$/, '');
    const socket = new WebSocket(`ws://${ip}/ws`);

    socket.onopen = function () {
      // console.log("🔌 Conectado ao WebSocket.");
    };

    socket.onmessage = function (event) {


      try {
        const data = JSON.parse(event.data);

        if (data.ind && Array.isArray(data.ind.bo)) {
          //console.log("✅ Dados com 'bo' encontrados, processando...");

          const boDados = data.ind.bo;

          if (Array.isArray(boDados)) {
            boDados.forEach(equip => {
              if (equip?.id !== undefined && equip?.val !== undefined) {
                //console.log(`🛠 Atualizando estadoAtual -> ID: ${equip.id}, VAL: ${equip.val}`);
                estadoAtual.set(Number(equip.id), Number(equip.val)); // Atualiza o estadoAtual

              } else {
                console.warn("⚠️ Dados incompletos recebidos:", equip);
              }
            });

            // Após a atualização do estado, resolvemos a promise
            resolve();
          } else {
            console.error("❌ Erro: 'bo' não é uma array válida.");
          }
        } else {
          //console.log("⚠️ Formato inesperado de dados ou sem 'bo', ignorando...");
        }
      } catch (error) {
        console.error("❌ Erro ao processar mensagem WebSocket:", error);
      }
    };

    socket.onerror = function (error) {
      console.error("❗ Erro no WebSocket:", error);
      reject(error); // Rejeita a promise em caso de erro no WebSocket
    };

    socket.onclose = function () {
      console.warn("🔌 Conexão WebSocket encerrada.");
    };
  });
}

// Para Node 18+ já tem fetch embutido
// Se estiver usando versão mais antiga, use: const fetch = require('node-fetch');

async function enviarComutacao(ip, id, val, idTipo) {
  try {
    // Construindo a URL dinâmica
    const url = `http://${ip}/set${idTipo}`;

    // Configurando os headers da requisição
    const headers = {
      'accept': 'application/json',
      'content-type': 'application/json',
    };

    // Configurando o corpo da requisição
    const body = JSON.stringify({ id, val });
    // console.log(body)
    // Fazendo a requisição com os dados configurados
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    // Verificando o status da resposta e logando o corpo
    //console.log(`Status da resposta: ${response.status}`);
    const bodyText = await response.text();  // Lê o corpo como texto
    //console.log(`Corpo da resposta: ${bodyText}`);

    // Se o status da resposta for OK, tenta fazer o parse da resposta
    if (response.ok) {
      const result = bodyText ? JSON.parse(bodyText) : {};
      //console.log("✅ Resultado da comutação:", result);
      return result;
    } else {
      console.error(`❌ Erro na requisição: ${response.status}`);
      return { success: false, error: `Erro na requisição: ${response.status}` };
    }

  } catch (error) {
    console.error('❌ Erro ao enviar comutação:', error);
    return { success: false, error: error.message };
  }
}


app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor Node.js rodando na porta ${port}`);
});



