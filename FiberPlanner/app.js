// Firebase Configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyDF40Ms9mvNvmq40l2okhoVlzRMMlGNum0",
  authDomain: "bd-engenhariacampo.firebaseapp.com",
  databaseURL: "https://bd-engenhariacampo-default-rtdb.firebaseio.com",
  projectId: "bd-engenhariacampo",
  storageBucket: "bd-engenhariacampo.firebasestorage.app",
  messagingSenderId: "596406239512",
  appId: "1:596406239512:web:9577db591f52f1c2311e6d",
  measurementId: "G-224E2X3Q2X"
};

// Initialize Firebase App and Database
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let tasks = [];
let currentView = 'geral'; 
let currentDisplayMode = 'list';
let currentFilter = 'all';

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    loadTheme();
    renderSidebarTeams();
    updateDateDisplay();
    listenForChanges(); // Boots up the Database observer instead of loadData
    
    const today = new Date().toISOString().split('T')[0];
    const taskDate = document.getElementById('taskDate');
    if (taskDate) taskDate.value = today;
}

function loadTheme() {
    if (localStorage.getItem('fiberPlannerTheme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
}

function toggleTheme() {
    if (document.body.getAttribute('data-theme') === 'dark') {
        document.body.removeAttribute('data-theme');
        localStorage.setItem('fiberPlannerTheme', 'light');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('fiberPlannerTheme', 'dark');
    }
}

// Global Firebase Realtime Listener
function listenForChanges() {
    db.ref('tasks').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            tasks = Object.values(data);
        } else {
            tasks = [];
        }
        // Force the app to naturally react to remote changes
        renderView();
    });
}

function renderSidebarTeams() {
    const list = document.getElementById('teamsNavList');
    const select = document.getElementById('taskTeam');
    
    if (!list || !select) return;
    
    list.innerHTML = '';
    select.innerHTML = '<option value="" disabled selected>Selecione a equipe</option>';
    
    initialTeams.forEach(team => {
        const btn = document.createElement('button');
        btn.className = 'nav-item';
        btn.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--primary); margin-right:4px;"></span> ${team.name}`;
        btn.onclick = (e) => switchView(team.id, btn);
        list.appendChild(btn);
        
        const opt = document.createElement('option');
        opt.value = team.id;
        opt.innerText = team.name;
        select.appendChild(opt);
    });
}

function switchView(viewId, element) {
    currentView = viewId;
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');
    
    const title = document.getElementById('viewTitle');
    const sub = document.getElementById('viewSubtitle');
    
    if (viewId === 'geral') {
        title.innerText = "Visão Geral";
        sub.innerText = "Cronograma de todas as equipes";
    } else {
        const team = initialTeams.find(t => t.id === viewId);
        title.innerText = team.name;
        sub.innerText = "Demandas e Status da " + team.name;
    }
    
    renderView();
}

function changeFilter(val) {
    currentFilter = val;
    renderView();
}

function switchDisplayMode(mode) {
    currentDisplayMode = mode;
    document.getElementById('btnListView').classList.remove('active');
    document.getElementById('btnCalendarView').classList.remove('active');
    const mapBtn = document.getElementById('btnMapView');
    if(mapBtn) mapBtn.classList.remove('active');
    const dashBtn = document.getElementById('btnDashView');
    if(dashBtn) dashBtn.classList.remove('active');
    
    if (mode === 'list') {
        document.getElementById('btnListView').classList.add('active');
    } else if (mode === 'calendar') {
        document.getElementById('btnCalendarView').classList.add('active');
    } else if (mode === 'map') {
        if(mapBtn) mapBtn.classList.add('active');
    } else {
        if(dashBtn) dashBtn.classList.add('active');
    }
    renderView();
}

function renderView() {
    const container = document.getElementById('viewContainer');
    
    let filteredTasks = tasks;
    if (currentView !== 'geral') {
        filteredTasks = tasks.filter(t => t.teamId === currentView);
    }
    
    if (currentFilter !== 'all') {
        filteredTasks = filteredTasks.filter(t => t.status === currentFilter);
    }
    
    filteredTasks.sort((a,b) => new Date(a.date) - new Date(b.date));
    
    if (currentDisplayMode === 'list') {
        renderListView(filteredTasks, container);
    } else if (currentDisplayMode === 'calendar') {
        renderCalendarView(filteredTasks, container);
    } else if (currentDisplayMode === 'map') {
        renderMapView(filteredTasks, container);
    } else {
        renderDashboardView(filteredTasks, container);
    }
}

function renderListView(filteredTasks, container) {
    if (filteredTasks.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 4rem; color:var(--text-muted); background:var(--bg-card); border-radius:12px; border:1px dashed var(--border-color);">
                <h3>Nenhuma demanda encontrada.</h3>
                <p style="margin-top:0.5rem;">Ajuste os filtros ou clique em "+ Nova Demanda".</p>
            </div>
        `;
        return;
    }
    
    let html = `<div style="display:grid; gap:1.5rem; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">`;
    
    filteredTasks.forEach(task => {
        const team = initialTeams.find(t => t.id === task.teamId);
        const dateObj = new Date(task.date + 'T12:00:00');
        const dateStr = dateObj.toLocaleDateString('pt-BR');
        
        let statusColor = "var(--status-pending)";
        let statusText = "Pendente";
        if (task.status === 'progress') { statusColor = "var(--status-progress)"; statusText = "Em Andamento"; }
        if (task.status === 'done') { statusColor = "var(--status-done)"; statusText = "Concluído"; }
        
        html += `
            <div style="background:var(--bg-card); border-radius:12px; border:1px solid var(--border-color); padding:1.5rem; box-shadow:0 2px 4px rgba(0,0,0,0.02); display:flex; flex-direction:column; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                    <div>
                        <span style="font-size:0.75rem; font-weight:700; color:${statusColor}; text-transform:uppercase; letter-spacing:0.05em; display:flex; align-items:center; gap:0.3rem;">
                            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${statusColor};"></span>
                            ${statusText}
                        </span>
                        <h4 style="font-size:1.1rem; font-weight:600; margin-top:0.4rem; color:var(--text-main);">${task.location}</h4>
                        ${(task.contact || task.coordinates) ? `
                            <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.4rem; display:flex; flex-wrap:wrap; gap:0.8rem;">
                                ${task.contact ? `<span title="Contato do Cliente">📞 ${task.contact}</span>` : ''}
                                ${task.coordinates ? `<a href="https://www.google.com/maps/search/${encodeURIComponent(task.coordinates)}" target="_blank" style="color:var(--primary); text-decoration:none;" title="Ver Coordenadas no Mapa">📍 Ver no Mapa</a>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <p style="font-size:0.95rem; color:var(--text-muted); margin-bottom:1.5rem; flex:1;">${task.description}</p>
                
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--border-color); padding-top:1rem; margin-bottom: 1rem;">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <span style="font-size:0.85rem; font-weight:600; background:var(--bg-main); padding:0.2rem 0.6rem; border-radius:4px; color:var(--text-main);">${team.name}</span>
                    </div>
                    <span style="font-size:0.85rem; color:var(--text-muted); font-weight:500;">📅 ${dateStr}</span>
                </div>

                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-secondary w-full" style="font-size:0.85rem; padding:0.4rem;" onclick="cycleStatus('${task.id}')">
                        ↻ Status
                    </button>
                    <button class="btn btn-secondary w-full" style="font-size:0.85rem; padding:0.4rem;" onclick="openEditTaskModal('${task.id}')">
                        ✏️ Editar
                    </button>
                    <button class="btn w-full" style="background:#fee2e2; color:#ef4444; border:none; padding:0.4rem; font-size:0.85rem;" onclick="deleteTask('${task.id}')">
                        ✕ Excluir
                    </button>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

function renderCalendarView(filteredTasks, container) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    let html = `
        <div style="margin-bottom: 1.5rem; display: flex; justify-content:space-between; align-items:center;">
            <h2 style="font-size: 1.4rem; display:flex; align-items:center; gap:0.6rem;">
                <span style="display:block; width:6px; height:1.4rem; background:var(--primary); border-radius:4px;"></span>
                ${monthNames[month]} de ${year}
            </h2>
        </div>
        <div class="calendar-grid">
            <div class="calendar-header-day">Dom</div>
            <div class="calendar-header-day">Seg</div>
            <div class="calendar-header-day">Ter</div>
            <div class="calendar-header-day">Qua</div>
            <div class="calendar-header-day">Qui</div>
            <div class="calendar-header-day">Sex</div>
            <div class="calendar-header-day">Sáb</div>
    `;
    
    // empty blocks
    for(let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-cell empty"></div>`;
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    for(let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const isToday = (dateStr === todayStr) ? 'today' : '';
        
        let cellTasks = filteredTasks.filter(t => t.date === dateStr);
        let chipsHtml = '';
        
        cellTasks.forEach(task => {
            const team = initialTeams.find(t => t.id === task.teamId);
            let sColor = "var(--status-pending)";
            if (task.status === 'progress') sColor = "var(--status-progress)";
            if (task.status === 'done') sColor = "var(--status-done)";
            
            // Opens Detail Modal; event.stopPropagation prevents the DayModal cell click from triggering
            chipsHtml += `<div class="cal-task-chip" style="border-left-color: ${sColor};" title="Clique para ver detalhes" onclick="event.stopPropagation(); openTaskDetails('${task.id}')">E${team.id}: ${task.location}</div>`;
        });
        
        html += `
            <div class="calendar-cell ${isToday}" onclick="openDayModal('${dateStr}')" style="cursor:pointer;" title="Clique para expandir agenda do dia">
                <span class="day-number">${d}</span>
                ${chipsHtml}
            </div>
        `;
    }
    
    const totalCells = firstDay + daysInMonth;
    const remainder = totalCells % 7;
    if(remainder !== 0) {
        for(let j = 0; j < (7 - remainder); j++) {
            html += `<div class="calendar-cell empty"></div>`;
        }
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

let mapInstance = null;

function parseGeoCoordinate(coordStr) {
    if (!coordStr) return null;
    
    // Try to match typical DMS (Degrees Minutes Seconds) like 8°45'39.5"S 63°50'54.1"W
    const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+(\d+(?:\.\d+)?)["\s]*([NSnsEWew])/gi;
    let matches = [...coordStr.matchAll(dmsRegex)];
    
    if (matches.length === 2) {
        let coords = {lat: null, lng: null};
        matches.forEach(m => {
            let val = parseInt(m[1]) + parseInt(m[2])/60 + parseFloat(m[3])/3600;
            let dir = m[4].toUpperCase();
            if (dir === 'S' || dir === 'W') val = -val;
            
            if (dir === 'N' || dir === 'S') coords.lat = val;
            if (dir === 'E' || dir === 'W') coords.lng = val;
        });
        if (coords.lat !== null && coords.lng !== null) return coords;
    }
    
    // Fallback: Default decimal coordinate parsing (-8.76, -63.84)
    const cleanCoords = coordStr.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    const parts = cleanCoords.split(' ');
    if (parts.length >= 2) {
        let lat = parseFloat(parts[0]);
        let lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return {lat, lng};
        }
    }
    
    return null;
}

function renderMapView(filteredTasks, container) {
    container.innerHTML = `<div id="map-container"></div>`;
    
    if (mapInstance) {
        mapInstance.off();
        mapInstance.remove();
        mapInstance = null;
    }
    
    // Fix Leaflet default icon paths when using CDN directly
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
    
    // Support robust parsing of coordinates
    const validCoordsTasks = filteredTasks.filter(t => t.coordinates && t.coordinates.trim() !== "");
    
    // Prevent rendering map if DOM is not fully painted
    setTimeout(() => {
        mapInstance = L.map('map-container');
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        }).addTo(mapInstance);
        
        let bounds = [];
        
        validCoordsTasks.forEach(task => {
            const parsedMeta = parseGeoCoordinate(task.coordinates);
            if (!parsedMeta) return; 
            
            const lat = parsedMeta.lat;
            const lng = parsedMeta.lng;
            
            bounds.push([lat, lng]);
            
            const team = initialTeams.find(t => t.id === task.teamId);
            let sText = "Pendente"; let sColor = "var(--status-pending)";
            if (task.status === 'progress') { sText = "Em Andamento"; sColor = "var(--status-progress)"; }
            if (task.status === 'done') { sText = "Concluído"; sColor = "var(--status-done)"; }
            
            const popupContent = `
                <div style="min-width: 200px; font-family: 'Inter', sans-serif;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;">
                        <span style="font-size:10px; font-weight:700; color:${sColor}; border:1px solid ${sColor}; padding:2px 6px; border-radius:12px; background:rgba(0,0,0,0.05);">${sText}</span>
                    </div>
                    <h4 style="margin:0 0 5px 0; font-size:14px; color:var(--text-main);">${task.location}</h4>
                    <p style="margin:0 0 5px 0; font-size:12px; color:var(--text-muted);">Equipe: ${team.name}</p>
                    ${task.contact ? `<p style="margin:0 0 8px 0; font-size:12px; color:var(--text-muted);">📞 ${task.contact}</p>` : ''}
                    <button onclick="openTaskDetails('${task.id}')" style="background:var(--primary); color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px; width:100%; font-weight:600; margin-top:5px;">Abrir Detalhes</button>
                </div>
            `;
            
            L.marker([lat, lng]).addTo(mapInstance).bindPopup(popupContent);
        });
        
        if (bounds.length > 0) {
            mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        } else {
            mapInstance.setView([-14.2350, -51.9253], 4); // Default center if no pins
        }
        
        mapInstance.invalidateSize(); // Force resize calculation
    }, 150);
}

// -------------------- //
// EXPORT & DASHBOARD   //
// -------------------- //

function exportToCSV() {
    if (tasks.length === 0) {
        alert("Não há demandas salvas para exportar.");
        return;
    }
    
    const csvRows = [];
    const headers = ['ID', 'Equipe', 'Data', 'Local/Endereço', 'Status', 'Cliente/Contato', 'Coordenadas(GPS)', 'Descrição'];
    csvRows.push(headers.join(';'));
    
    tasks.forEach(t => {
        const team = initialTeams.find(teamObj => teamObj.id === t.teamId);
        const teamName = team ? team.name : 'Sem Equipe';
        
        let statusStr = "Pendente";
        if (t.status === 'progress') statusStr = "Em Andamento";
        if (t.status === 'done') statusStr = "Concluído";
        
        const escapeCSV = (str) => {
            if (!str) return '""';
            const safeStr = String(str).replace(/"/g, '""').replace(/\n/g, ' ');
            return `"${safeStr}"`;
        };
        
        const row = [
            t.id,
            escapeCSV(teamName),
            t.date,
            escapeCSV(t.location),
            statusStr,
            escapeCSV(t.contact),
            escapeCSV(t.coordinates),
            escapeCSV(t.description)
        ].join(';');
        
        csvRows.push(row);
    });
    
    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel UTF-8 compatibility
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `Demandas_Equipes_Fibra.csv`;
    link.style.display = "none";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function renderDashboardView(filteredTasks, container) {
    const total = filteredTasks.length;
    const pending = filteredTasks.filter(t => t.status === 'pending').length;
    const progress = filteredTasks.filter(t => t.status === 'progress').length;
    const done = filteredTasks.filter(t => t.status === 'done').length;
    
    let teamStatsHtml = '';
    
    initialTeams.forEach(team => {
        const tTasks = filteredTasks.filter(t => t.teamId === team.id);
        const tTotal = tTasks.length;
        
        // Hide empty teams if on general view to save UI space
        if (tTotal === 0 && currentView === 'geral') return;
        // Hide wrong teams if on specific team view
        if (currentView !== 'geral' && currentView !== team.id) return;
        
        const tDone = tTasks.filter(t => t.status === 'done').length;
        const pct = tTotal === 0 ? 0 : Math.round((tDone / tTotal) * 100);
        
        teamStatsHtml += `
            <div class="team-perf-row">
                <div class="team-perf-header">
                    <span>${team.name} <span style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">(${tTotal} obras)</span></span>
                    <span style="color:var(--status-done);">${tDone}/${tTotal} Concluídas (${pct}%)</span>
                </div>
                <div class="team-bar-container">
                    <div class="team-bar-fill" style="width: ${pct}%; background: var(--status-done);"></div>
                </div>
            </div>
        `;
    });
    
    if (teamStatsHtml === '') {
        teamStatsHtml = `<p style="color:var(--text-muted); text-align:center; margin-top:1rem;">Nenhum dado produtivo para exibir agora.</p>`;
    }
    
    const html = `
        <div style="animation: fadeIn 0.3s ease;">
            <div class="dashboard-grid">
                <div class="stat-card" style="border-top: 4px solid var(--primary);">
                    <h3>Total Demandas</h3>
                    <div class="stat-number" style="color: var(--primary);">${total}</div>
                </div>
                <div class="stat-card" style="border-top: 4px solid var(--status-pending);">
                    <h3>Pendentes</h3>
                    <div class="stat-number" style="color: var(--status-pending);">${pending}</div>
                </div>
                <div class="stat-card" style="border-top: 4px solid var(--status-progress);">
                    <h3>Em Andamento</h3>
                    <div class="stat-number" style="color: var(--status-progress);">${progress}</div>
                </div>
                <div class="stat-card" style="border-top: 4px solid var(--status-done);">
                    <h3>Concluídas</h3>
                    <div class="stat-number" style="color: var(--status-done);">${done}</div>
                </div>
            </div>
            
            <div class="perf-section">
                <h3 style="margin-bottom: 2rem; color: var(--text-main); font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.8rem;">Desempenho por Equipes</h3>
                ${teamStatsHtml}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// -------------------- //
// API STATUS/ACTIONS   //
// -------------------- //
function cycleStatus(taskId) {
    if (window.event) window.event.stopPropagation(); // Avoid triggering openTaskDetails randomly
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    let nextStatus = 'pending';
    if (task.status === 'pending') nextStatus = 'progress';
    else if (task.status === 'progress') nextStatus = 'done';
    
    db.ref('tasks/' + taskId).update({ status: nextStatus }).catch(err => alert("Erro ao sincronizar status: " + err.message));
}

function deleteTask(taskId) {
    if (confirm("Tem certeza que deseja excluir esta demanda permanentemente?")) {
        db.ref('tasks/' + taskId).remove().catch(err => alert("Erro ao excluir: " + err.message));
    }
}

// -------------------- //
// MODAL CONTROLS       //
// -------------------- //

// Task Creation Modals 
function openNewTaskModal() {
    const modal = document.getElementById('taskModal');
    if (modal) modal.classList.add('active');
    
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    
    document.querySelector('#taskModal .modal-header h3').innerText = 'Agendar Nova Demanda';
    document.querySelector('#taskModal button[type="submit"]').innerText = 'Salvar Demanda';
    
    const teamSelect = document.getElementById('taskTeam');
    if (currentView !== 'geral' && teamSelect) {
        teamSelect.value = currentView;
    } else if (teamSelect) {
        teamSelect.value = '';
    }
    
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('taskDate');
    if (dateInput) dateInput.value = today;
}

function openEditTaskModal(idStr) {
    const task = tasks.find(t => t.id === idStr);
    if (!task) return;
    
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTeam').value = task.teamId;
    document.getElementById('taskDate').value = task.date;
    document.getElementById('taskLocation').value = task.location;
    document.getElementById('taskCoordinates').value = task.coordinates || '';
    document.getElementById('taskContact').value = task.contact || '';
    document.getElementById('taskDescription').value = task.description;
    
    document.querySelector('#taskModal .modal-header h3').innerText = 'Editar Demanda';
    document.querySelector('#taskModal button[type="submit"]').innerText = 'Atualizar Demanda';
    
    closeDetailsModal();
    closeDayModal();
    
    document.getElementById('taskModal').classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('taskModal');
    if (modal) modal.classList.remove('active');
    
    const form = document.getElementById('taskForm');
    if (form) form.reset();
    document.getElementById('taskId').value = '';
    
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('taskDate');
    if (dateInput) dateInput.value = today;
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    const teamId = parseInt(document.getElementById('taskTeam').value);
    const date = document.getElementById('taskDate').value;
    const location = document.getElementById('taskLocation').value;
    const coordinates = document.getElementById('taskCoordinates').value;
    const contact = document.getElementById('taskContact').value;
    const description = document.getElementById('taskDescription').value;
    
    const editingId = document.getElementById('taskId').value;
    
    if (editingId) {
        // Update existing task via Firebase
        db.ref('tasks/' + editingId).update({
            teamId, date, location, coordinates, contact, description
        }).then(() => closeModal()).catch(err => alert("Erro ao editar: " + err.message));
    } else {
        // Create new task via Firebase
        const newId = Date.now().toString() + Math.random().toString(36).substring(2, 6);
        const newTask = {
            id: newId,
            teamId,
            date,
            location,
            coordinates,
            contact,
            description,
            status: 'pending'
        };
        
        db.ref('tasks/' + newId).set(newTask)
            .then(() => closeModal())
            .catch(err => alert("Erro ao cadastrar: " + err.message));
    }
}

// Calendar Task Details Modal
function openTaskDetails(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const team = initialTeams.find(t => t.id === task.teamId);
    
    const db = document.getElementById('detailsModalBody');
    const dateObj = new Date(task.date + 'T12:00:00');
    const dateStr = dateObj.toLocaleDateString('pt-BR');
    
    let statusColor = "var(--status-pending)";
    let statusText = "Pendente";
    if (task.status === 'progress') { statusColor = "var(--status-progress)"; statusText = "Em Andamento"; }
    if (task.status === 'done') { statusColor = "var(--status-done)"; statusText = "Concluído"; }
    
    db.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <span style="font-size:0.8rem; font-weight:700; color:${statusColor}; text-transform:uppercase; display:flex; align-items:center; gap:0.3rem;">
                <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${statusColor};"></span>
                ${statusText}
            </span>
            <h4 style="font-size:1.2rem; font-weight:600; margin-top:0.5rem; color:var(--text-main);">${task.location}</h4>
            ${(task.contact || task.coordinates) ? `
                <div style="font-size:0.95rem; color:var(--text-muted); margin-top:0.6rem; display:flex; flex-direction:column; gap:0.4rem; background:rgba(0,0,0,0.03); padding:0.8rem; border-radius:6px;">
                    ${task.contact ? `<span><strong>📞 Contato:</strong> <a href="tel:${task.contact}" style="color:var(--primary); text-decoration:none;">${task.contact}</a></span>` : ''}
                    ${task.coordinates ? `<span><strong>📍 GPS:</strong> <a href="https://www.google.com/maps/search/${encodeURIComponent(task.coordinates)}" target="_blank" style="color:var(--primary); text-decoration:none;">${task.coordinates}</a></span>` : ''}
                </div>
            ` : ''}
            <p style="font-size:1rem; color:var(--text-muted); margin-top:0.8rem; line-height:1.5;">${task.description}</p>
        </div>
        <div style="margin-bottom: 1.5rem; display:flex; justify-content:space-between; border-top:1px dashed var(--border-color); padding-top:1rem;">
            <span style="font-size:0.9rem; font-weight:600; background:var(--bg-main); padding:0.3rem 0.8rem; border-radius:6px; color:var(--text-main);">${team.name}</span>
            <span style="font-size:0.9rem; color:var(--text-muted); font-weight:500;">📅 ${dateStr}</span>
        </div>
        <div class="form-actions" style="margin-top:0; display:flex; gap:0.5rem; justify-content:flex-end;">
            <button class="btn btn-secondary w-full" style="flex:1;" onclick="cycleStatusAndRefreshDetails('${task.id}')">↻ Alternar Status</button>
            <button class="btn btn-secondary w-full" style="flex:1;" onclick="openEditTaskModal('${task.id}')">✏️ Editar Obra</button>
            <button class="btn w-full" style="flex:1; background:#fee2e2; color:#ef4444; border:none;" onclick="deleteTaskAndCloseDetails('${task.id}')">✕ Excluir Obra</button>
        </div>
    `;
    
    document.getElementById('detailsModal').classList.add('active');
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.remove('active');
}

function cycleStatusAndRefreshDetails(taskId) {
    cycleStatus(taskId); 
    openTaskDetails(taskId);
}

function deleteTaskAndCloseDetails(taskId) {
    if (confirm("Tem certeza que deseja excluir esta demanda permanentemente?")) {
        db.ref('tasks/' + taskId).remove().then(() => {
            closeDetailsModal();
            // Also refresh the Day Modal actively
            const dayModal = document.getElementById('dayModal');
            if(dayModal && dayModal.classList.contains('active')){
               const currentDayAttr = dayModal.getAttribute('data-current-date');
               // Small timeout due to async Firebase snapshot pushing back
               if(currentDayAttr) setTimeout(() => openDayModal(currentDayAttr), 100);
            }
        }).catch(err => alert("Erro ao excluir: " + err.message));
    }
}

// -------------------- //
// DAY EXPANSION MODAL  //
// -------------------- //
function openDayModal(dateStr) {
    let dayTasks = tasks.filter(t => t.date === dateStr);
    
    if (currentView !== 'geral') {
        dayTasks = dayTasks.filter(t => t.teamId === currentView);
    }
    if (currentFilter !== 'all') {
        dayTasks = dayTasks.filter(t => t.status === currentFilter);
    }
    
    const db = document.getElementById('dayModalBody');
    const title = document.getElementById('dayModalTitle');
    const dayModal = document.getElementById('dayModal');
    
    // Save current date on modal for refresh ability
    dayModal.setAttribute('data-current-date', dateStr);
    
    const dateObj = new Date(dateStr + 'T12:00:00');
    title.innerText = "Agenda: " + dateObj.toLocaleDateString('pt-BR');
    
    if (dayTasks.length === 0) {
        db.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:2rem;">Nenhuma obra marcada para este dia específico.</p>`;
    } else {
        let html = `<div style="display:flex; flex-direction:column; gap:1rem;">`;
        dayTasks.forEach(task => {
            const team = initialTeams.find(t => t.id === task.teamId);
            let sColor = "var(--status-pending)"; let sText = "Pendente";
            if(task.status==='progress'){sColor="var(--status-progress)"; sText="Em Andamento";}
            if(task.status==='done'){sColor="var(--status-done)"; sText="Concluído";}
            
            html += `
                <div style="border:1px solid var(--border-color); border-radius:8px; padding:1.2rem; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='var(--bg-main)'" onmouseout="this.style.background='transparent'" onclick="openTaskDetails('${task.id}')">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.8rem; align-items:center;">
                        <span style="font-weight:700; color:var(--text-main); font-size:1.1rem;">${task.location}</span>
                        <span style="font-size:0.75rem; font-weight:700; color:${sColor}; padding:0.3rem 0.6rem; border-radius:12px; border:1px solid ${sColor}; background:rgba(255,255,255,0.05);">${sText}</span>
                    </div>
                    ${(task.contact || task.coordinates) ? `
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.6rem; display:flex; gap:1rem;">
                            ${task.contact ? `<span>📞 ${task.contact}</span>` : ''}
                            ${task.coordinates ? `<span>📍 GPS Salvo</span>` : ''}
                        </div>
                    ` : ''}
                    <p style="font-size:0.95rem; color:var(--text-muted); margin-bottom: 1rem;">${task.description}</p>
                    <div style="display:flex; justify-content:space-between; border-top:1px dashed var(--border-color); padding-top:0.8rem;">
                        <span style="font-size:0.85rem; font-weight:600; color:var(--text-main); background:var(--bg-main); padding:0.2rem 0.6rem; border-radius:4px;">${team.name}</span>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        db.innerHTML = html;
    }
    
    dayModal.classList.add('active');
}

function closeDayModal() {
    document.getElementById('dayModal').classList.remove('active');
}

// -------------------- //
// COLLAPSIBLE SIDEBAR  //
// -------------------- //
function toggleSection(listId, iconId) {
    const list = document.getElementById(listId);
    const icon = document.getElementById(iconId);
    
    // Check if collapsed via max-height inline style
    if (list.style.maxHeight === '0px' || list.style.display === 'none') {
        list.style.maxHeight = '1000px';
        list.style.display = 'flex';
        icon.style.transform = 'rotate(0deg)';
    } else {
        list.style.maxHeight = '0px';
        icon.style.transform = 'rotate(-180deg)';
        setTimeout(() => { if (list.style.maxHeight === '0px') list.style.display = 'none'; }, 300); // 300ms transition duration
    }
}

function updateDateDisplay() {
    const display = document.getElementById('currentDateDisplay');
    if (!display) return;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('pt-BR', options);
    display.innerText = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
}
