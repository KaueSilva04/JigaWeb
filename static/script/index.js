
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
                            `;
                tableBody.appendChild(row);
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
            setInterval(fetchJigasData, 5000);  // 1 segundos

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
 