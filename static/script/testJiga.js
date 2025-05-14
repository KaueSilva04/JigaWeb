
        document.addEventListener('DOMContentLoaded', function () {
            // Dados mockados dos equipamentos por JIGA
            async function fetchEquipmentsForJiga(jiga) {
                try {
                    console.log(`Fetching data for JIGA: ${jiga}`);
                    const apiHost = window.location.hostname;
                    const response = await fetch(`http://${apiHost}:3000/api/equipaments/` + jiga);

                    if (!response.ok) {
                        throw new Error(`Erro ao buscar dados. Status: ${response.status}`);
                    }
                    const data = await response.json();
                    //console.log('Dados recebidos:', data);
                    await conectarWebSocket(jiga);
                    return data;
                } catch (error) {
                    console.error('Erro ao buscar dados:', error);
                    addLog(systemLog, `Erro ao buscar dados da JIGA ${jiga}: ${error.message}`, 'error');
                    return [];  // Retorna um array vazio para evitar quebras na aplicação
                }

            }

            // Ícones para tipos de equipamentos
            const equipmentIcons = {
                'relay': 'fa-toggle-on',
                'sensor': 'fa-thermometer-half',
                'motor': 'fa-cog',
                'valve': 'fa-tint',
                'switch': 'fa-exchange-alt'
            };

            // Configurações globais
            let config = {
                baseUrl: 'http://{jiga}.local/',
                timeout: 5000,
                retryCount: 3
            };

            // Estado dos testes
            let testingInProgress = false;
            let abortController = null;
            let currentTestIndex = 0;
            let totalTests = 0;
            const jigaEquipments = {};
            // Elementos DOM
            const tabs = document.querySelectorAll('.tab');
            const tabContents = document.querySelectorAll('.tab-content');
            const jigaSelect = document.getElementById('jiga-select');
            const jigaSelectIndividual = document.getElementById('jiga-select-individual');
            const equipmentSelect = document.getElementById('equipment-select');
            const allEquipmentResults = document.getElementById('all-equipment-results');
            const individualTestLog = document.getElementById('individual-test-log');
            const systemLog = document.getElementById('system-log');
            const baseUrlInput = document.getElementById('base-url');
            const timeoutInput = document.getElementById('timeout');
            const retryCountInput = document.getElementById('retry-count');
            const progressBar = document.getElementById('progress-value');
            const quickHelp = document.getElementById('quick-help');

            // Botões
            const btnTestAllOpen = document.getElementById('btn-test-all-open');
            const btnTestAllClose = document.getElementById('btn-test-all-close');
            const btnJiga = document.getElementById('btn-jiga');
            const btnTestIndividual = document.getElementById('btn-test-individual');
            const btnStopIndividual = document.getElementById('btn-stop-individual');
            const btnSaveAdvanced = document.getElementById('btn-save-advanced');
            const btnResetAdvanced = document.getElementById('btn-reset-advanced');

            // Funções de utilidade
            function addLog(container, message, type = 'info') {
                // Verificar se existe um estado vazio a ser removido
                const emptyState = container.querySelector('.empty-state');
                if (emptyState) {
                    container.removeChild(emptyState);
                }

                const logEntry = document.createElement('div');
                logEntry.className = `log-entry log-${type}`;

                const timestamp = document.createElement('span');
                timestamp.className = 'log-timestamp';
                timestamp.textContent = `[${new Date().toLocaleTimeString()}]`;

                const messageText = document.createElement('span');
                messageText.textContent = message;

                logEntry.appendChild(timestamp);
                logEntry.appendChild(messageText);
                container.appendChild(logEntry);
                container.scrollTop = container.scrollHeight;
            }

  
       
            async function populateEquipmentCards(jiga) {
                allEquipmentResults.innerHTML = '';

                const equipments = await fetchEquipmentsForJiga(jiga);

                if (!equipments || equipments.length === 0) {
                    allEquipmentResults.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="empty-state-message">Nenhum equipamento encontrado</div>
                <div class="empty-state-description">Esta JIGA não possui equipamentos cadastrados</div>
            </div>
        `;
                    return;
                }

                equipments.forEach(equipment => {
                    const card = createEquipmentCard(jiga, equipment);
                    allEquipmentResults.appendChild(card);
                });

                // Salvar equipamentos no cache local se necessário
                jigaEquipments[jiga] = equipments;
            }

            function atualizarTodosOsEquipamentos(boList) {

            }

            async function populateEquipmentOptions(jiga) {
                equipmentSelect.innerHTML = '';
                equipmentSelect.disabled = !jiga;

                if (!jiga) {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'Selecione a JIGA primeiro...';
                    equipmentSelect.appendChild(option);
                    return;
                }

                const equipments = await fetchEquipmentsForJiga(jiga);
                jigaEquipments[jiga] = equipments;

                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Selecione um equipamento...';
                equipmentSelect.appendChild(defaultOption);

                equipments.forEach(equipment => {
                    const option = document.createElement('option');
                    option.value = equipment.id;
                    option.textContent = equipment.name;
                    equipmentSelect.appendChild(option);
                });

                btnTestIndividual.disabled = true;
            }

            async function delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            async function enviarEquipamento(equipamento, jiga, val = 1) {
                try {
                    const apiHost = window.location.hostname;
                    const ip = await buscarIPdaJiga(jiga); // busca IP da jiga específica
                    const response = await fetch(`http://${apiHost}:3000/api/comutar`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ip,
                            id: equipamento.id,
                            tipo: equipamento.idTipo,
                            val
                        })
                    });
                    const data = await response.json();
                    return { success: true, data };
                } catch (err) {
                    console.error(`❌ Falha ao enviar para ID=${equipamento.id}:`, err);
                    return { success: false };
                }
            }

            async function runAllTests(jiga) {



            }
            // Event Listeners
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Remover classe ativa de todas as abas
                    tabs.forEach(t => t.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));

                    // Adicionar classe ativa à aba clicada
                    tab.classList.add('active');

                    // Mostrar conteúdo correspondente
                    const tabId = tab.getAttribute('data-tab');
                    document.getElementById(tabId).classList.add('active');
                });
            });

            jigaSelect.addEventListener('change', () => {
                const jiga = jigaSelect.value;
                populateEquipmentCards(jiga);
            });

            equipmentSelect.addEventListener('change', () => {
                btnTestIndividual.disabled = !equipmentSelect.value;
            });

            btnTestAllOpen.addEventListener('click', async () => {
                const jiga = jigaSelect.value.trim();

                if (!jiga) {
                    alert('Selecione uma JIGA primeiro.');
                    return;
                }

                try {
                    const apiHost = window.location.hostname;
                    const response = await fetch(`http://${apiHost}:3000/api/comutarAll`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ jiga, val: 1 })
                    });

                    const data = await response.json();
                    console.log(data);

                    if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Erro desconhecido na comutação.');
                    }

                    console.log('✅ Resultado da comutação em lote:', data);

                    addLog(systemLog, `Comutação concluída com sucesso para ${data.total} equipamentos da JIGA ${jiga}.`, 'success');

                    // Aqui você pode exibir o resultado na tela se quiser
                    // ou atualizar os cards

                } catch (error) {
                    console.error('❌ Erro ao executar comutação em lote:', error);
                    addLog(systemLog, `Erro ao comutar todos os equipamentos da JIGA ${jiga}: ${error.message}`, 'error');
                }
            });

            btnTestAllClose.addEventListener('click', async () => {
                const jiga = jigaSelect.value.trim();

                if (!jiga) {
                    alert('Selecione uma JIGA primeiro.');
                    return;
                }

                try {
                    const apiHost = window.location.hostname;
                    const response = await fetch(`http://${apiHost}:3000/api/comutarAll`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ jiga, val: 2 })
                    });

                    const data = await response.json();
                    console.log(data);

                    if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Erro desconhecido na comutação.');
                    }

                    console.log('✅ Resultado da comutação em lote:', data);

                    addLog(systemLog, `Comutação concluída com sucesso para ${data.total} equipamentos da JIGA ${jiga}.`, 'success');

                    // Aqui você pode exibir o resultado na tela se quiser
                    // ou atualizar os cards

                } catch (error) {
                    console.error('❌ Erro ao executar comutação em lote:', error);
                    addLog(systemLog, `Erro ao comutar todos os equipamentos da JIGA ${jiga}: ${error.message}`, 'error');
                }
            });

            btnJiga.addEventListener('change', () => {
                const jiga = jigaSelect.value;
                populateEquipmentCards(jiga);
            });
            
            btnStopIndividual.addEventListener('click', () => {
                if (abortController) {
                    abortController.abort();
                    addLog(individualTestLog, 'Teste individual interrompido.', 'warning');
                }
            });

            btnSaveAdvanced.addEventListener('click', () => {
                config.baseUrl = baseUrlInput.value;
                config.timeout = parseInt(timeoutInput.value);
                config.retryCount = parseInt(retryCountInput.value);

                addLog(systemLog, 'Configurações atualizadas com sucesso.', 'success');
            });

            btnResetAdvanced.addEventListener('click', () => {
                baseUrlInput.value = 'http://{jiga}.local/';
                timeoutInput.value = '5000';
                retryCountInput.value = '3';

                config.baseUrl = 'http://{jiga}.local/';
                config.timeout = 5000;
                config.retryCount = 3;

                addLog(systemLog, 'Configurações resetadas para os valores padrão.', 'info');
            });

            quickHelp.addEventListener('click', () => {
                alert('Sistema de Teste de JIGAs\n\n' +
                    'Este sistema permite realizar testes em equipamentos conectados às JIGAs.\n\n' +
                    '1. Teste em Lote: Selecione uma JIGA para testar todos os equipamentos.\n' +
                    '2. Teste Individual: Selecione uma JIGA e um equipamento específico para testar.\n' +
                    '3. Configurações: Ajuste parâmetros de conexão e comportamento do sistema.\n\n' +
                    'Para mais informações, consulte o manual do usuário.');
            });

            // Inicialização
            btnStopIndividual.disabled = true;



        });
    