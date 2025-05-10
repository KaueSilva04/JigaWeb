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

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
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
  console.log("📦 Lista de equipamentos:", boList);

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
    console.log(estadoAtual);
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









app.listen(port, () => {
  console.log(`Servidor Node.js rodando na porta ${port}`);
});





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
    const socket = new WebSocket(`ws://${jiga}.local/ws`);

    socket.onopen = function () {
      console.log("🔌 Conectado ao WebSocket.");
    };

    socket.onmessage = function (event) {
      console.log("📨 Mensagem recebida:", event.data);

      try {
        const data = JSON.parse(event.data);

        if (data.ind && Array.isArray(data.ind.bo)) {
          console.log("✅ Dados com 'bo' encontrados, processando...");

          const boDados = data.ind.bo;

          if (Array.isArray(boDados)) {
            boDados.forEach(equip => {
              if (equip?.id !== undefined && equip?.val !== undefined) {
                console.log(`🛠 Atualizando estadoAtual -> ID: ${equip.id}, VAL: ${equip.val}`);
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
          console.log("⚠️ Formato inesperado de dados ou sem 'bo', ignorando...");
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