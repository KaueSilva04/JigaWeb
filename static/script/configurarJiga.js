
document.addEventListener('DOMContentLoaded', function () {
    // Elementos do DOM
    const jigasTableBody = document.getElementById('jigasTableBody');
    const totalJigasElement = document.getElementById('totalJigas');
    const activeJigasElement = document.getElementById('activeJigas');
    const maintenanceJigasElement = document.getElementById('maintenanceJigas');
    const offlineJigasElement = document.getElementById('offlineJigas');
    const loadingElement = document.getElementById('loading');
    const lastUpdateElement = document.getElementById('lastUpdate');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const refreshButton = document.getElementById('refreshButton');
    const editModal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    const editForm = document.getElementById('editForm');

    // Dados das jigas
    let jigasData = [];

    // Formatar data para exibição
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    }

    // Carregar dados
    function loadJigasData() {
        loadingElement.style.display = 'block';

        // Simulando uma chamada de API (substituir por fetch real)
        setTimeout(() => {
            // Aqui você faria um fetch real para carregar os dados
            // fetch('/api/jigas').then(response => response.json())...

            // Por enquanto, vamos usar dados estáticos
            jigasData = [
                {
                    "id": "jiga102.local",
                    "ip": "192.168.0.11",
                    "status": "active",
                    "lastCheck": "2025-05-09 14:13:26"
                },
                {
                    "id": "jiga106.local",
                    "ip": "192.168.3.128",
                    "status": "active",
                    "lastCheck": "2025-05-09 14:13:26"
                },
                {
                    "id": "jiga112.local",
                    "ip": "192.168.3.165",
                    "status": "active",
                    "lastCheck": "2025-05-09 14:13:26"
                },
                {
                    "id": "jiga128.local",
                    "ip": "192.168.3.133",
                    "status": "active",
                    "lastCheck": "2025-05-09 14:13:26"
                },
                {
                    "id": "jiga144.local",
                    "ip": "192.168.3.163",
                    "status": "maintenance",
                    "lastCheck": "2025-05-09 14:13:26"
                },
                {
                    "id": "jiga146.local",
                    "ip": "192.168.1.225",
                    "status": "active",
                    "lastCheck": "2025-05-09 14:13:26"
                },
                {
                    "id": "jiga177.local",
                    "ip": "192.168.1.103",
                    "status": "offline",
                    "lastCheck": "2025-05-09 16:55:18"
                },
                {
                    "id": "jiga178.local",
                    "ip": "192.168.0.18",
                    "status": "maintenance",
                    "lastCheck": "2025-05-12 09:02:21"
                }
            ];

            updateTable(jigasData);
            updateStats(jigasData);
            updateLastCheck();
            loadingElement.style.display = 'none';
        }, 500);
    }

    // Atualizar tabela
    function updateTable(data) {
        jigasTableBody.innerHTML = '';

        data.forEach(jiga => {
            const row = document.createElement('tr');

            // Define a classe de status para estilização
            const statusClass = `status-${jiga.status}`;
            const statusText = getStatusText(jiga.status);

            row.innerHTML = `
                        <td>${jiga.id}</td>
                        <td>${jiga.ip}</td>
                        <td class="${statusClass}">${statusText}</td>
                        <td>${formatDate(jiga.lastCheck)}</td>
                        <td>
                            <button class="action-btn edit-btn" data-id="${jiga.id}">✏️ Editar</button>
                        </td>
                    `;

            jigasTableBody.appendChild(row);
        });

        // Adicionar os ouvintes de eventos para os botões de edição
        attachEditButtonListeners();
    }

    // Converter status para texto em português
    function getStatusText(status) {
        switch (status) {
            case 'active':
                return 'Ativo';
            case 'maintenance':
                return 'Em Manutenção';
            case 'offline':
                return 'Offline';
            default:
                return status;
        }
    }

    // Atualizar estatísticas
    function updateStats(data) {
        const total = data.length;
        const active = data.filter(jiga => jiga.status === 'active').length;
        const maintenance = data.filter(jiga => jiga.status === 'maintenance').length;
        const offline = data.filter(jiga => jiga.status === 'offline').length;

        totalJigasElement.textContent = total;
        activeJigasElement.textContent = active;
        maintenanceJigasElement.textContent = maintenance;
        offlineJigasElement.textContent = offline;
    }

    // Atualizar última verificação
    function updateLastCheck() {
        const now = new Date();
        lastUpdateElement.textContent = `Última atualização: ${now.toLocaleString('pt-BR')}`;
    }

    // Pesquisar jigas
    function searchJigas() {
        const searchTerm = searchInput.value.toLowerCase();

        if (searchTerm === '') {
            updateTable(jigasData);
            return;
        }

        const filteredData = jigasData.filter(jiga =>
            jiga.id.toLowerCase().includes(searchTerm) ||
            jiga.ip.toLowerCase().includes(searchTerm) ||
            getStatusText(jiga.status).toLowerCase().includes(searchTerm)
        );

        updateTable(filteredData);
    }

    // Adicionar ouvintes de eventos para os botões de edição
    function attachEditButtonListeners() {
        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', function () {
                const jigaId = this.getAttribute('data-id');
                openEditModal(jigaId);
            });
        });
    }

    // Abrir modal de edição
    function openEditModal(jigaId) {
        const jiga = jigasData.find(j => j.id === jigaId);

        if (jiga) {
            document.getElementById('jigaId').value = jiga.id;
            document.getElementById('jigaName').value = jiga.id;
            document.getElementById('jigaIp').value = jiga.ip;
            document.getElementById('jigaStatus').value = jiga.status;

            editModal.style.display = 'block';
        }
    }

    // Fechar modal
    function closeEditModal() {
        editModal.style.display = 'none';
    }

    // Salvar alterações
   


    // Event Listeners
    searchButton.addEventListener('click', searchJigas);
    searchInput.addEventListener('keyup', function (e) {
        if (e.key === 'Enter') {
            searchJigas();
        }
    });

    refreshButton.addEventListener('click', loadJigasData);

    closeModal.addEventListener('click', closeEditModal);
    cancelEdit.addEventListener('click', closeEditModal);
    editForm.addEventListener('submit', saveChanges);

    // Carregar dados ao iniciar
    loadJigasData();
});
