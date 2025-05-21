from flask import Flask, render_template, jsonify, request
import json
import subprocess
import threading
import os
from datetime import datetime
from flask_cors import CORS

DATA_FILE = 'jigas_data.json'

app = Flask(__name__)
CORS(app)  # Permite todas as origens
LOG_FILES = ["sucesso1.log", "sucesso2.log"]

DATA_FILE = 'jigas_data.json'

def carregar_jigas_salvas():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                # Caso o arquivo esteja vazio ou com formato inválido, retorna uma lista vazia
                return []
    return []

def salvar_jigas(jigas):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(jigas, f, ensure_ascii=False, indent=2)

# Executa o ping em uma thread separada
def executar_ping():
    subprocess.run(["pingScript.bat"], shell=True)

# Rota para renderizar a página
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/teste')
def testeJiga():
    return render_template('testJiga.html')

# Rota para iniciar o ping
@app.route('/api/ping', methods=['POST'])
def api_ping():
    threading.Thread(target=executar_ping).start()
    return jsonify({"status": "Ping iniciado"})

# Rota para buscar os dados das jigas (logs)
@app.route('/api/jigas')
def api_jigas():
    jigas_atuais = []
    ids_atuais = set()
    
    for arquivo in LOG_FILES:
        if os.path.exists(arquivo):
            with open(arquivo, 'r', encoding='utf-8') as f:
                for linha in f:
                    linha = linha.strip()
                    if linha:
                        partes = linha.split()
                        if len(partes) >= 3:
                            id_jiga = partes[0]
                            ip_jiga = partes[2]
                            ids_atuais.add(id_jiga)
                            jigas_atuais.append({
                                "id": id_jiga,
                                "ip": ip_jiga,
                                "status": "active",
                                "lastCheck": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            })

    # Carregar dados antigos
    jigas_salvas = carregar_jigas_salvas()
    ids_salvas = {j['id']: j for j in jigas_salvas}

    # Atualizar dados antigos: marcar como offline se não está mais no novo
    for jiga in jigas_salvas:
        for jiga_atual in jigas_atuais:
            if jiga['id'] == jiga_atual['id'] and jiga['ip'] != jiga_atual['ip']:
                jiga['ip'] = jiga_atual['ip']  # Atualiza o IP
                jiga['status'] = 'active'  # Garantir que está marcado como ativo
                break

    # Adicionar novas jigas (restante do map)
    for jiga_atual in jigas_atuais:
        if jiga_atual['id'] not in ids_salvas:
            jigas_salvas.append(jiga_atual)

    salvar_jigas(jigas_salvas)
    return jsonify(jigas_salvas)


@app.route('/api/jigas/modificar', methods=['PUT'])
def update_jiga():
    data = request.get_json()
    jigas_salvas = carregar_jigas_salvas()  # Função que lê o JSON salvo
    
    updated = False
    for jiga in jigas_salvas:
        if jiga['id'] == data.get('id', jiga.get('id')):
            jiga['ip'] = data.get('ip', jiga.get('ip'))
            jiga['status'] = data.get('status', jiga.get('status'))
            jiga['lastCheck'] = data.get('lastCheck', jiga.get('lastCheck'))
            updated = True
            break
    
    if not updated:
        return jsonify({'error': 'JIGA não encontrada'}), 404

    salvar_jigas(jigas_salvas)  # Função que grava o JSON atualizado

    return jsonify({'success': True})

@app.route('/api/jigas/adicionar', methods=['POST'])
def adicionar_jiga():
    data = request.get_json()

    if not data.get('id') or not data.get('ip') or not data.get('status'):
        return jsonify({'error': 'Campos obrigatórios faltando'}), 400

    jigas = carregar_jigas_salvas()

    # Verificar se já existe uma JIGA com esse ID
    if any(j['id'] == data['id'] for j in jigas):
        return jsonify({'error': 'JIGA já existe'}), 409

    nova_jiga = {
        'id': data['id'],
        'ip': data['ip'],
        'status': data['status'],
        'lastCheck': data.get('lastCheck') or datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

    jigas.append(nova_jiga)
    salvar_jigas(jigas)

    return jsonify({'success': True, 'jiga': nova_jiga})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)




