document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const refreshButton = document.getElementById('refreshButton');
    const editModal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    const editForm = document.getElementById('editForm');
    const addModal = document.getElementById('addModal');


    closeModal.addEventListener('click', closeEditModal);
    cancelEdit.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', function (event) {
        if (event.target === editModal) {
            closeEditModal();
        }
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeEditModal();
        }
    });
    editForm.addEventListener('submit', saveChanges);

    addModal.addEventListener('click', function (event) {
        if (event.target === addModal) {
            addModal.style.display = 'none';
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            document.getElementById('addModal').style.display = 'none';
        }
    });



    document.getElementById('addJigaButton').addEventListener('click', function () {
        document.getElementById('addModal').style.display = 'block';
    });

    // Para fechar o modal de adição
    document.getElementById('closeAddModal').addEventListener('click', function () {
        document.getElementById('addModal').style.display = 'none';
    });

    document.getElementById('cancelAdd').addEventListener('click', function () {
        document.getElementById('addModal').style.display = 'none';
    });

    // Para o formulário de adicionar
    document.getElementById('addForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const jigaId = document.getElementById('newJigaId').value;
        const jigaIp = document.getElementById('newJigaIp').value;
        const jigaStatus = document.getElementById('newJigaStatus').value;

        fetch('/api/jigas/adicionar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: jigaId,
                ip: jigaIp,
                status: jigaStatus
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('JIGA adicionada com sucesso!');
                    document.getElementById('addModal').style.display = 'none';
                    fetchJigasData(); // atualiza a tabela
                } else {
                    alert('Erro ao adicionar: ' + (data.error || 'erro desconhecido'));
                }
            })
            .catch(error => {
                console.error('Erro ao adicionar JIGA:', error);
                alert('Erro de rede ao adicionar JIGA.');
            });

    })

});



function getStatusText(status) {
    switch (status) {
        case 'active': return 'Ativo';
        case 'maintenance': return 'Manutenção';
        case 'offline': return 'Offline';
        default: return 'Desconhecido';
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'active': return 'status-active';
        case 'maintenance': return 'status-maintenance';
        case 'offline': return 'status-offline';
        default: return '';
    }
}

function updateJigasTable(jigas) {
    const tableBody = document.getElementById('jigasTableBody');
    tableBody.innerHTML = '';

    jigas.forEach(jiga => {
        const row = document.createElement('tr');
        row.innerHTML = `
                                <td><a href="http://${encodeURIComponent(jiga.id)}" target="_blank">${jiga.id}</a></td>
                                <td><a href="http://${jiga.ip}" >${jiga.ip}</a></td>
                                <td><span class="status ${getStatusClass(jiga.status)}"></span> ${getStatusText(jiga.status)}</td>
                                <td>${jiga.lastCheck}</td>
                                <td>
                                    <button class="action-btn edit-btn" data-id="${jiga.id}">✏️ Editar</button>
                                </td>

                            `;
        tableBody.appendChild(row);

    });
    attachEditButtonListeners(jigas);
}

// Adicionar ouvintes de eventos para os botões de edição
function attachEditButtonListeners(jigas) {
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function () {
            const jigaId = this.getAttribute('data-id');
            openEditModal(jigaId, jigas);
        });
    });
}

// Abrir modal de edição
function openEditModal(jigaId, jigas) {
    const jiga = jigas.find(j => j.id === jigaId);
    console.log(jigas)
    console.log(jiga)

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

function saveChanges(e) {
    e.preventDefault();

    const jigaId = document.getElementById('jigaId').value;
    const jigaIp = document.getElementById('jigaIp').value;
    const jigaStatus = document.getElementById('jigaStatus').value;
    const lastCheck = new Date().toISOString().replace('T', ' ').substring(0, 19);

    fetch(`/api/jigas/modificar`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: jigaId,
            ip: jigaIp,
            status: jigaStatus,
            lastCheck: lastCheck
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao atualizar');
            }
            return response.json();
        })
        .then(data => {
            alert(`JIGA ${jigaId} atualizada com sucesso!`);
            fetchJigasData(); // atualiza a tabela
            closeEditModal();
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao salvar alterações.');
        });
}

function updateStats(jigas) {
    const total = jigas.length;
    const active = jigas.filter(j => j.status === 'active').length;
    const maintenance = jigas.filter(j => j.status === 'maintenance').length;
    const offline = jigas.filter(j => j.status === 'offline').length;

    document.getElementById('totalJigas').textContent = total;
    document.getElementById('activeJigas').textContent = active;
    document.getElementById('maintenanceJigas').textContent = maintenance;
    document.getElementById('offlineJigas').textContent = offline;

    const now = new Date();
    document.getElementById('lastUpdate').textContent = `Última atualização: ${now.toLocaleTimeString()}`;
}

function fetchJigasData() {
    document.getElementById('loading').style.display = 'block';

    fetch('/api/jigas')
        .then(response => response.json())
        .then(data => {
            updateJigasTable(data);
            updateStats(data);
            window.allJigas = data; // Salva para pesquisa
            document.getElementById('loading').style.display = 'none';
        })
        .catch(error => {
            console.error('Erro ao obter dados das jigas:', error);
            document.getElementById('loading').style.display = 'none';
        });
}

function updatefetchJigasData() {
    fetch('/api/ping', { method: 'POST' })  // Chama o endpoint de refresh
        .then(response => response.json())
        .then(() => {
            // Atualiza os dados após o ping
            fetchJigasData();
        });
}



document.addEventListener('DOMContentLoaded', function () {
    fetchJigasData();
    // Atualiza os dados a cada 1 segundos (por exemplo)
    setInterval(fetchJigasData, 50000);  // 1 segundos

    document.getElementById('refreshButton').addEventListener('click', function () {
        fetch('/api/ping', { method: 'POST' })  // Chama o endpoint de refresh
            .then(response => response.json())
            .then(() => {
                // Atualiza os dados após o ping
                fetchJigasData();
            });
    });

    document.getElementById('searchInput').addEventListener('keyup', function () {
        const searchTerm = this.value.toLowerCase();
        const filteredJigas = (window.allJigas || []).filter(jiga =>
            jiga.id.toLowerCase().includes(searchTerm)
        );
        updateJigasTable(filteredJigas);
    });

    document.getElementById('searchButton').addEventListener('click', function () {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filteredJigas = (window.allJigas || []).filter(jiga =>
            jiga.id.toLowerCase().includes(searchTerm)
        );
        updateJigasTable(filteredJigas);
    });
});




setInterval(updatefetchJigasData, 600000);
