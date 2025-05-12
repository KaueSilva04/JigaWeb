
async function buscarEstado(jigaId) {
    try {
        // Faz a requisição para buscar o JSON
        const response = await fetch('http://127.0.0.1:3000/api/estadoJson');
        const jigaInfoList = await response.json();


        // Garantir que jigaId seja um número
        const jigaIdNum = Number(jigaId);

        // Procurando o item com o ID correspondente ao 'jigaId'
        const estado = jigaInfoList.find(item => Number(item.id) == Number(jigaIdNum));


        // Se não encontrar o ID, retorna uma mensagem de erro
        if (!estado) {
            console.error(`❌ ID ${jigaId} não encontrado no JSON.`);
            return null;
        }

        // Se encontrado, retorna o 'val' associado a esse ID
        return estado.val;

    } catch (error) {
        console.error('Erro ao buscar o estado:', error);
        return null;
    }
}




function createEquipmentCard(jiga, equipment) {
    const card = document.createElement('div');
    card.classList.add('equipment-card'); // Classe de estilo

    // Título do grupo
    const titulo = document.createElement('h3');
    titulo.textContent = equipment.grupo;
    card.appendChild(titulo);

    // Tipo
    const tipo = document.createElement('p');
    const strongTipo = document.createElement('strong');
    strongTipo.textContent = 'Tipo: ';
    tipo.appendChild(strongTipo);
    tipo.appendChild(document.createTextNode(equipment.equipamentos[0].idTipo));
    card.appendChild(tipo);

    // JIGA
    const jigainfo = document.createElement('p');
    const strongJiga = document.createElement('strong');
    strongJiga.textContent = 'JIGA: ';
    jigainfo.appendChild(strongJiga);
    jigainfo.appendChild(document.createTextNode(jiga));
    card.appendChild(jigainfo);

    // Botão de teste
    const button = document.createElement('button');
    button.textContent = "Testar";
    button.addEventListener('click', () => {
        openModal(jiga, equipment); // Abre o modal passando o equipment
    });
    card.appendChild(button);

    return card;
}

function openModal(jiga, equipment) {
    // Verifica se já existe um modal e remove
    const existingModal = document.querySelector('.modal');
    if (existingModal) existingModal.remove();

    // Cria o modal e sua estrutura
    const modal = document.createElement('div');
    modal.classList.add('modal');

    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    const modalHeader = document.createElement('div');
    modalHeader.classList.add('modal-header');

    const titulo = document.createElement('h2');
    titulo.textContent = `Detalhes do Equipamento - ${equipment.grupo}`;
    modalHeader.appendChild(titulo);

    const equipmentInfo = document.createElement('div');
    equipmentInfo.classList.add('equipment-info');

    // Header da tabela
    const infoHeader = document.createElement('div');
    infoHeader.classList.add('info-header');

    ['ID', 'Tipo', 'Nome', 'Status', 'Ação'].forEach(text => {
        const span = document.createElement('span');
        span.textContent = text;
        infoHeader.appendChild(span);
    });

    equipmentInfo.appendChild(infoHeader);
    let idsEquipamento = [];
    let idsTipoEquipamento = [];
    let i = 0;
    let loop = 0;
    // Equipamentos individuais
    equipment.equipamentos.forEach(async io => {
        const item = document.createElement('div');
        item.classList.add('equipment-item');

        const spanId = document.createElement('span');
        spanId.textContent = io.idBO;

        const spanTipo = document.createElement('span');
        spanTipo.textContent = io.idTipo;

        const spanNome = document.createElement('span');
        spanNome.textContent = io.name;

        const statusContainer = document.createElement('span');
        statusContainer.classList.add('status-container');
        //console.log(buscarEstado(io.idBO));

        idsEquipamento[i] = io.id;
        idsTipoEquipamento[i] = io.idTipo;
        i++;

        let status;
        if (io.idTipo === "djmono" || io.idTipo === "secc") {
            status = await buscarEstado(io.idBO) == 0 ? 'fechado' : 'aberto';
        } else {
            status = await buscarEstado(io.idBO) == 1 ? 'fechado' : 'aberto';
        }

        const statusClass = status === 'aberto' ? 'status-led-green' : 'status-led-red';

        const statusLed = document.createElement('div');
        statusLed.classList.add('status-led', statusClass);
        statusLed.title = status;

        const statusText = document.createElement('span');
        statusText.classList.add('status-text');
        statusText.textContent = status;

        statusContainer.appendChild(statusLed);
        statusContainer.appendChild(statusText);

        const actionContainer = document.createElement('span');
        actionContainer.style.display = "flex";
        actionContainer.style.flexDirection = "row";

        const desButton = document.createElement('button');
        desButton.classList.add('test-button', 'des');
        desButton.textContent = "Fechar";
        desButton.dataset.id = io.id;

        const actButton = document.createElement('button');


        actButton.classList.add('test-button', 'act');
        actButton.textContent = "Abrir";
        actButton.dataset.id = io.id;

        let intervaloEnvio = null;

        desButton.addEventListener('click', async () => {
            if (checkbox.checked) {
                if (intervaloEnvio) {
                    console.log("⏳ Loop já está rodando...");
                    return; // evita criar múltiplos loops
                }
                let val = 2;
                intervaloEnvio = setInterval(async () => {

                    if (!checkbox.checked) {
                        clearInterval(intervaloEnvio);
                        intervaloEnvio = null;
                        console.log("⛔ Checkbox desmarcado — loop interrompido.");
                        return;
                    }

                    const id = io.id;
                    const tipo = io.idTipo;
                    if (val == 2) {
                        val = 1;
                    } else {
                        val = 2;
                    }

                    const ip = await buscarIPdaJiga(jiga);

                    try {
                        const response = await fetch("http://127.0.0.1:3000/api/comutar", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ ip, id, val, tipo })
                        });
                        const data = await response.json();
                        //console.log("🔁 Enviando comando:", data);
                    } catch (err) {
                        console.error("❌ Erro no envio:", err);
                    }

                }, 1000); // envia a cada 1 segundo
            } else {

                const id = io.id; // ou io.id se for o correto
                const tipo = io.idTipo;
                const val = 2;
                //console.log(tipo)
                const ip = await buscarIPdaJiga(jiga); // ou dinamicamente, se necessário

                await fetch("http://127.0.0.1:3000/api/comutar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ ip, id, val, tipo })
                })
                    .then(res => res.json())
                    .then(data => {
                        //console.log("🔻 Desativar:", data);
                        // Aqui você pode atualizar a UI (LED, texto etc)
                    })
                    .catch(err => console.error("❌ Erro ao desativar:", err));
            }
        });

        // Evento do botão Ativar
        actButton.addEventListener('click', async () => {
            if (checkbox.checked) {
                if (intervaloEnvio) {
                    console.log("⏳ Loop já está rodando...");
                    return; // evita criar múltiplos loops
                }
                let val = 2;
                intervaloEnvio = setInterval(async () => {

                    if (!checkbox.checked) {
                        clearInterval(intervaloEnvio);
                        intervaloEnvio = null;
                        console.log("⛔ Checkbox desmarcado — loop interrompido.");
                        return;
                    }

                    const id = io.id;
                    const tipo = io.idTipo;
                    if (val == 2) {
                        val = 1;
                    } else {
                        val = 2;
                    }

                    const ip = await buscarIPdaJiga(jiga);

                    try {
                        const response = await fetch("http://127.0.0.1:3000/api/comutar", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ ip, id, val, tipo })
                        });
                        const data = await response.json();
                        //console.log("🔁 Enviando comando:", data);
                    } catch (err) {
                        console.error("❌ Erro no envio:", err);
                    }

                }, 1000); // envia a cada 1 segundo
            } else {

                const id = io.id; // ou io.id se for o correto
                const tipo = io.idTipo;
                const val = 1;
                //console.log(tipo)
                const ip = await buscarIPdaJiga(jiga); // ou dinamicamente, se necessário

                await fetch("http://127.0.0.1:3000/api/comutar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ ip, id, val, tipo })
                })
                    .then(res => res.json())
                    .then(data => {
                        // console.log("🔻 Desativar:", data);
                        // Aqui você pode atualizar a UI (LED, texto etc)
                    })
                    .catch(err => console.error("❌ Erro ao desativar:", err));
            }
        });


        actionContainer.appendChild(desButton);
        actionContainer.appendChild(actButton);

        item.appendChild(spanId);
        item.appendChild(spanTipo);
        item.appendChild(spanNome);
        item.appendChild(statusContainer);
        item.appendChild(actionContainer);

        equipmentInfo.appendChild(item);
    });

    //console.log("ids dos equipamentos" + idsEquipamento);

    modalHeader.appendChild(equipmentInfo);
    modalContent.appendChild(modalHeader);

    // Rodapé do modal
    const modalFooter = document.createElement('div');
    modalFooter.classList.add('modal-footer');

    // Criar a div que vai conter o checkbox e o label
    const checkboxGroup = document.createElement('div');
    checkboxGroup.classList.add('checkbox-group');

    // Criar o input checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('checkbox-modal', 'input-modal');
    checkbox.id = 'meuCheckbox';

    // Criar o label associado ao checkbox
    const checkboxLabel = document.createElement('label');
    checkboxLabel.htmlFor = 'meuCheckbox';
    checkboxLabel.textContent = 'loop';

    checkboxGroup.appendChild(checkbox);
    checkboxGroup.appendChild(checkboxLabel);

    const testarEquipamentoAbrir = document.createElement('button');
    testarEquipamentoAbrir.classList.add('button-modal', 'testar-abrir');
    testarEquipamentoAbrir.textContent = "Equipamento Abrir";

    const testarEquipamentoFechar = document.createElement('button');
    testarEquipamentoFechar.classList.add('button-modal', 'testar-fechar');
    testarEquipamentoFechar.textContent = "Equipamento Fechar";

    const fecharButton = document.createElement('button');
    fecharButton.classList.add('button-modal', 'close-modal');
    fecharButton.textContent = "Fechar";

    modalFooter.appendChild(checkboxGroup);
    modalFooter.appendChild(testarEquipamentoAbrir);
    modalFooter.appendChild(testarEquipamentoFechar);
    modalFooter.appendChild(fecharButton);

    modalContent.appendChild(modalFooter);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Eventos
    fecharButton.addEventListener('click', () => modal.remove());

    let intervaloEnvioAbrir = null;

    testarEquipamentoAbrir.addEventListener('click', async () => {
        if (!checkbox.checked) {
            console.log("🔒 Checkbox não marcado — envio único apenas.");

            try {
                const ip = await buscarIPdaJiga(jiga);

                await Promise.all(
                    idsEquipamento.map(async (id, index) => {
                        const tipo = idsTipoEquipamento[index];
                        const val = 1;

                        const response = await fetch("http://127.0.0.1:3000/api/comutar", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ip, id, val, tipo })
                        });
                        const data = await response.json();
                        //console.log("🔻 Envio único paralelo:", data);
                    })
                );
            } catch (err) {
                console.error("❌ Erro no envio único paralelo:", err);
            }
        } else {

            if (intervaloEnvioAbrir) {
                console.log("⏳ Loop já está rodando...");
                return;
            }

            let val = 1;

            intervaloEnvioAbrir = setInterval(async () => {
                if (!checkbox.checked) {
                    clearInterval(intervaloEnvioAbrir);
                    intervaloEnvioAbrir = null;
                    console.log("⛔ Checkbox desmarcado — loop interrompido.");
                    return;
                }

                try {
                    const ip = await buscarIPdaJiga(jiga);

                    await Promise.all(
                        idsEquipamento.map(async (id, index) => {
                            const tipo = idsTipoEquipamento[index];

                            const response = await fetch("http://127.0.0.1:3000/api/comutar", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ ip, id, val, tipo })
                            });
                            const data = await response.json();
                            //console.log("🔁 Envio paralelo em loop:", data);
                        })
                    );
                } catch (err) {
                    console.error("❌ Erro no envio paralelo em loop:", err);
                }

                // Alterna valor se necessário
                val = val === 1 ? 2 : 1;

            }, 1000); // envia a cada 100ms
        }
    })

    testarEquipamentoFechar.addEventListener('click', async () => {
        for (let a = 0; a < i; a++) {
            const id = idsEquipamento[a]; // ou io.id se for o correto
            const tipo = idsTipoEquipamento[a];
            const val = 2;
            //console.log(tipo)
            const ip = await buscarIPdaJiga(jiga); // ou dinamicamente, se necessário

            await fetch("http://127.0.0.1:3000/api/comutar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ ip, id, val, tipo })
            })
                .then(res => res.json())
                .then(data => {
                    //console.log("🔻 Desativar:", data);
                    // Aqui você pode atualizar a UI (LED, texto etc)
                })
                .catch(err => console.error("❌ Erro ao desativar:", err));
        }
    })

    // Exemplo de ação: esconder um bloco de texto quando o usuário desmarca
    checkbox.addEventListener('change', (event) => {
        if (!checkbox.checked && intervaloEnvio) {
            clearInterval(intervaloEnvio);
            intervaloEnvio = null;
            //console.log("⛔ Loop de envio interrompido porque o checkbox foi desmarcado.");
        }
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.remove();
        }
    });

    document.addEventListener('keydown', function escListener(event) {
        if (event.key === 'Escape' && document.body.contains(modal)) {
            modal.remove();
            document.removeEventListener('keydown', escListener);
        }
    });

    // Eventos dos botões individuais
    modal.querySelectorAll('.test-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const equipmentId = event.target.dataset.id;
            testEquipment(equipmentId);
        });
    });
}


