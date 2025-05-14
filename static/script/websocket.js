
 async function buscarIPdaJiga(jiga) {
    try {
        const apiHost = window.location.hostname;
        const response = await fetch(`http://${apiHost}:3000/api/jigaJson`);
        const jigaInfoList = await response.json();


        const jigaInfo = jigaInfoList.find(item => item.id === `${jiga}.local`);
        if (!jigaInfo) {
            console.error(`❌ JIGA ${jiga} não encontrada no JSON.`);
            return null;
        }

        // Remove ":" do final do IP se houver
        const ip = jigaInfo.ip.replace(/:$/, '');
        return ip;

    } catch (error) {
        console.error('Erro ao buscar IP da JIGA:', error);
        return null;
    }
}





async function conectarWebSocket(jiga) {
    const ipJiga = await buscarIPdaJiga(jiga);
  
    const socket = new WebSocket(`ws://${ipJiga}/ws`);  // Conectando ao WebSocket

    socket.onopen = function () {
        console.log("🔌 Conectado ao WebSocket.");
    };

    socket.onmessage = function (event) {
        //console.log("📨 Mensagem recebida:", event.data);
        try {
            const data = JSON.parse(event.data);

            // Se a mensagem contiver dados de 'bo', vamos atualizar os modais
            if (data.ind.bo && Array.isArray(data.ind.bo)) {
                //console.log("✅ Dados de 'bo' recebidos, atualizando modais...");
                //console.log(data.ind.bo);
                const todosItens = document.querySelectorAll('.equipment-item');
                //console.log(todosItens);
                data.ind.bo.forEach(io => {
                    todosItens.forEach(item => {
                        const spans = item.querySelectorAll('span');
                        const spanIdBO = spans[0]?.textContent.trim();
                        const spanTipo = spans[1]?.textContent.trim();
                      


                        if (spanIdBO == io.id) {
                            const statusTextElement = item.querySelector('.status-text');
                            const statusLedElement = item.querySelector('.status-led');
                            let statusClass;
                            let statusText;
                            if (spanTipo == "djmono" || spanTipo == "secc") {
                                statusText = io.val == 0 ? 'fechado' : 'aberto';
                                statusClass = io.val == 1 ? 'status-led-green' : 'status-led-red';
                            } else {
                                statusText = io.val == 1 ? 'fechado' : 'aberto';
                                statusClass = io.val == 0 ? 'status-led-green' : 'status-led-red';
                            }

                            if (statusTextElement) {
                                statusTextElement.textContent = statusText;
                            }

                            if (statusLedElement) {
                                statusLedElement.classList.remove('status-led-green', 'status-led-red');
                                statusLedElement.classList.add(statusClass);
                            }
                        }
                    });
                });
                // Função que vai atualizar os modais com os dados recebidos

            } else {
                console.warn("⚠️ Dados recebidos não são válidos ou não contêm 'bo'");
            }
        } catch (error) {
            console.error("❌ Erro ao processar mensagem WebSocket:", error);
        }
    };

    socket.onerror = function (error) {
        console.error("❗ Erro no WebSocket:", error);
    };

    socket.onclose = function () {
        console.warn("🔌 Conexão WebSocket encerrada.");
    };
}
