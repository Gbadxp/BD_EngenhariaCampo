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
let initialTeams = []; // Transformed from static data.js into dynamic global array synced with Firebase
let initialManagers = []; // Dynamic array of Gestor Responsável
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

function getServiceColor(typeStr) {
    if (!typeStr) return "var(--primary)";
    const map = {
        "Rompimento de fibra": "#dc2626",
        "Manutenção de cto": "#f97316",
        "Manutenção de bakcbone": "#9333ea",
        "Virada de sinal": "#0ea5e9",
        "Montagem de CTO": "#16a34a",
        "Montagem de DIO": "#84cc16",
        "Caixa sem sinal": "#ca8a04",
        "Fibra atenuada": "#db2777"
    };
    return map[typeStr] || "var(--primary)";
}

// Global Firebase Realtime Listener
function listenForChanges() {
    // 1. Listen for Teams
    db.ref('teams').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            initialTeams = Object.values(data);
        } else {
            // Seed DB on the very first empty run with core 19 architecture
            const coreSeed = [
                { id: 1, name: "Marcos Ageu", group: "Linheiros - Porto Velho/RO" },
                { id: 2, name: "Anderson Aparecido", group: "Linheiros - Porto Velho/RO" },
                { id: 3, name: "Francisco Rocha", group: "Linheiros - Porto Velho/RO" },
                { id: 4, name: "Adrielyton Manoel", group: "Linheiros - Porto Velho/RO" },
                { id: 5, name: "André", group: "Linheiros - Porto Velho/RO" },
                { id: 6, name: "Albertino", group: "Linheiros - Porto Velho/RO" },
                { id: 7, name: "Huilian Wilkens", group: "Linheiros - Porto Velho/RO" },
                { id: 8, name: "Manoel Pinto", group: "Linheiros - Porto Velho/RO" },
                { id: 9, name: "Airton Freire", group: "Linheiros - Porto Velho/RO" },
                { id: 10, name: "Ronaldo", group: "Linheiros - Porto Velho/RO" },
                { id: 11, name: "Renan", group: "Linheiros - Porto Velho/RO" },
                { id: 12, name: "José Muniz / João Maidson", group: "Emendadores - Porto Velho/RO" },
                { id: 13, name: "Iury Lourran / Franciel Machado", group: "Emendadores - Porto Velho/RO" },
                { id: 14, name: "Emerson Pinto / Breno Luis", group: "Emendadores - Porto Velho/RO" },
                { id: 15, name: "Alecsandro Pantoja / Marcelo Lima", group: "Emendadores - Porto Velho/RO" },
                { id: 16, name: "Marcos Bitercout / Fabrício", group: "Emendadores - Porto Velho/RO" },
                { id: 17, name: "Antônio Carlos / Junior Pessoa", group: "Emendadores - Porto Velho/RO" },
                { id: 18, name: "Marcelo Augusto / Adenilson", group: "Emendadores - Extrema/RO" },
                { id: 19, name: "Italo Gabriel / Everson", group: "Emendadores - Nova Mamoré/RO" }
            ];
            coreSeed.forEach(t => db.ref('teams/' + t.id).set(t));
            initialTeams = coreSeed;
        }
        renderSidebarTeams();
        if(document.getElementById('teamManagerModal') && document.getElementById('teamManagerModal').classList.contains('active')){
            renderTeamManagerList();
        }
        // Force timeline re-render if team names changed
        renderView(); 
    });

    // 1b. Listen for Managers
    db.ref('managers').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            initialManagers = Object.values(data);
        } else {
            const seedManagers = [
                { id: "1", name: "GEORGE GOMES" },
                { id: "2", name: "ALEX ALVES" },
                { id: "3", name: "ANDERSON FREITAS" },
                { id: "4", name: "LUIS DIOGENES" },
                { id: "5", name: "DIEGO MATIAS" }
            ];
            seedManagers.forEach(m => db.ref('managers/' + m.id).set(m));
            initialManagers = seedManagers;
        }
        renderManagerOptions();
        if(document.getElementById('managerManagerModal') && document.getElementById('managerManagerModal').classList.contains('active')){
            renderManagerList();
        }
        renderView();
    });

    // 2. Listen for Tasks
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
    
    // Create grouped data
    const groups = {};
    initialTeams.forEach(team => {
        const gName = team.group || "Geral";
        if (!groups[gName]) groups[gName] = [];
        groups[gName].push(team);
    });
    
    for (const groupName in groups) {
        // Form OptGroup
        const optGroup = document.createElement('optgroup');
        optGroup.label = groupName;
        
        // Natively Retractable HTML5 container
        const details = document.createElement('details');
        details.style.marginBottom = '0.5rem';
        
        const summary = document.createElement('summary');
        summary.style.fontSize = '0.70rem';
        summary.style.fontWeight = '700';
        summary.style.color = 'var(--text-muted)';
        summary.style.textTransform = 'uppercase';
        summary.style.letterSpacing = '0.05em';
        summary.style.padding = '0.5rem 0';
        summary.style.cursor = 'pointer';
        summary.style.outline = 'none';
        summary.style.userSelect = 'none';
        summary.innerText = groupName;
        details.appendChild(summary);
        
        const navContainer = document.createElement('div');
        navContainer.style.display = 'flex';
        navContainer.style.flexDirection = 'column';
        navContainer.style.marginLeft = '0.5rem';
        navContainer.style.marginTop = '0.3rem';
        
        groups[groupName].forEach(team => {
            const btn = document.createElement('button');
            btn.className = 'nav-item';
            btn.innerHTML = `<span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--primary); margin-right:6px;"></span> ${team.name}`;
            btn.onclick = (e) => switchView(team.id, btn);
            navContainer.appendChild(btn);
            
            const opt = document.createElement('option');
            opt.value = team.id;
            opt.innerText = team.name;
            optGroup.appendChild(opt);
        });
        
        details.appendChild(navContainer);
        list.appendChild(details);
        select.appendChild(optGroup);
    }
}

function renderManagerOptions() {
    const select = document.getElementById('taskManager');
    if (!select) return;
    
    // Store current selection if any
    const currentVal = select.value;
    
    select.innerHTML = '<option value="" disabled selected>Selecione o Gestor</option>';
    initialManagers.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.name; // Keep saving by name for compatibility with old snapshot tasks!
        opt.innerText = m.name;
        select.appendChild(opt);
    });
    
    // Restore selection natively if available
    if (currentVal && initialManagers.find(m => m.name === currentVal)) {
        select.value = currentVal;
    }
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
                    <div style="display:flex; flex-direction:column; gap:0.4rem;">
                        <span style="font-size:0.85rem; font-weight:600; background:var(--bg-main); padding:0.2rem 0.6rem; border-radius:4px; color:var(--text-main); max-width:max-content;">${team.name}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">👤 Gestor: ${task.manager || 'Não Definido'}</span>
                        <span style="font-size:0.75rem; color:${getServiceColor(task.taskType)}; font-weight:700;">🛠️ ${task.taskType || 'Outros'}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end;">
                        <span style="font-size:0.85rem; color:var(--text-muted); font-weight:500;">📅 ${dateStr} ${task.dateEnd && task.dateEnd !== task.date ? ' até ' + new Date(task.dateEnd+'T12:00:00').toLocaleDateString('pt-BR').substring(0,5) : ''}</span>
                        ${task.timeStart ? `<span style="font-size:0.8rem; color:var(--primary); font-weight:600; margin-top:0.2rem;">⏰ ${task.timeStart} ${task.timeEnd ? ' às '+task.timeEnd : ''}</span>` : ''}
                    </div>
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
        
        // Match tasks that span strictly over the day
        let cellTasks = filteredTasks.filter(t => {
            const end = t.dateEnd || t.date;
            return dateStr >= t.date && dateStr <= end;
        });
        let chipsHtml = '';
        
        cellTasks.forEach(task => {
            const team = initialTeams.find(t => t.id === task.teamId);
            let statusChar = "🟡";
            if (task.status === 'progress') statusChar = "🔵";
            if (task.status === 'done') statusChar = "🟢";
            
            let sColor = getServiceColor(task.taskType);
            
            // Opens Detail Modal; event.stopPropagation prevents the DayModal cell click from triggering
            chipsHtml += `<div class="cal-task-chip" style="border-left-color: ${sColor};" title="${task.taskType || 'Serviço'}" onclick="event.stopPropagation(); openTaskDetails('${task.id}')"><span style="font-size:9px; margin-right:4px;">${statusChar}</span>E${team.id}: ${task.location}</div>`;
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
    const headers = ['ID', 'Equipe', 'Gestor', 'Tipo Serviço', 'Data', 'Início Previsto', 'Término Previsto', 'Local/Endereço', 'Status', 'Cliente/Contato', 'Coordenadas(GPS)', 'Descrição'];
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
            escapeCSV(t.manager),
            escapeCSV(t.taskType),
            t.date,
            escapeCSV(t.dateEnd),
            escapeCSV(t.timeStart),
            escapeCSV(t.timeEnd),
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
function openNewTaskModal(forcedDate = null) {
    const modal = document.getElementById('taskModal');
    if (modal) modal.classList.add('active');
    
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    if(document.getElementById('taskManager')) document.getElementById('taskManager').value = '';
    if(document.getElementById('taskType')) document.getElementById('taskType').value = '';
    
    // Check if new html inject works properly
    if(document.getElementById('taskTimeStart')) {
        document.getElementById('taskTimeStart').value = '';
        document.getElementById('taskTimeEnd').value = '';
        document.getElementById('taskDateEnd').value = '';
    }
    
    document.querySelector('#taskModal .modal-header h3').innerText = 'Agendar Nova Demanda';
    document.querySelector('#taskModal button[type="submit"]').innerText = 'Salvar Demanda';
    
    const teamSelect = document.getElementById('taskTeam');
    if (currentView !== 'geral' && teamSelect) {
        teamSelect.value = currentView;
    } else if (teamSelect) {
        teamSelect.value = '';
    }
    
    const dateInput = document.getElementById('taskDate');
    if (dateInput) {
        if(forcedDate) dateInput.value = forcedDate;
        else dateInput.value = new Date().toISOString().split('T')[0];
    }
    closeDayModal(); // Safely exit Day Modal to prioritize Form
}

function openEditTaskModal(idStr) {
    const task = tasks.find(t => t.id === idStr);
    if (!task) return;
    
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTeam').value = task.teamId;
    if(document.getElementById('taskManager')) document.getElementById('taskManager').value = task.manager || '';
    if(document.getElementById('taskType')) document.getElementById('taskType').value = task.taskType || '';
    document.getElementById('taskDate').value = task.date;
    if(document.getElementById('taskDateEnd')) document.getElementById('taskDateEnd').value = task.dateEnd || '';
    if(document.getElementById('taskTimeStart')) document.getElementById('taskTimeStart').value = task.timeStart || '';
    if(document.getElementById('taskTimeEnd')) document.getElementById('taskTimeEnd').value = task.timeEnd || '';
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
    if(document.getElementById('taskManager')) document.getElementById('taskManager').value = '';
    if(document.getElementById('taskType')) document.getElementById('taskType').value = '';
    if(document.getElementById('taskTimeStart')) {
        document.getElementById('taskTimeStart').value = '';
        document.getElementById('taskTimeEnd').value = '';
        document.getElementById('taskDateEnd').value = '';
    }
    
    const dateInput = document.getElementById('taskDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    const teamId = parseInt(document.getElementById('taskTeam').value);
    const date = document.getElementById('taskDate').value;
    
    const managerEl = document.getElementById('taskManager');
    const manager = managerEl ? managerEl.value : '';
    
    const taskTypeEl = document.getElementById('taskType');
    const taskType = taskTypeEl ? (taskTypeEl.value || 'Outros') : 'Outros';
    
    const dateEndEl = document.getElementById('taskDateEnd');
    const dateEnd = dateEndEl && dateEndEl.value ? dateEndEl.value : date;
    
    const timeStartEl = document.getElementById('taskTimeStart');
    const timeStart = timeStartEl ? timeStartEl.value : '';
    const timeEndEl = document.getElementById('taskTimeEnd');
    const timeEnd = timeEndEl ? timeEndEl.value : '';
    
    const location = document.getElementById('taskLocation').value;
    const coordinates = document.getElementById('taskCoordinates').value;
    const contact = document.getElementById('taskContact').value;
    const description = document.getElementById('taskDescription').value;
    
    const editingId = document.getElementById('taskId').value;
    
    if (editingId) {
        // Update existing task via Firebase
        db.ref('tasks/' + editingId).update({
            teamId, manager, taskType, date, dateEnd, timeStart, timeEnd, location, coordinates, contact, description
        }).then(() => closeModal()).catch(err => alert("Erro ao editar: " + err.message));
    } else {
        // Create new task via Firebase
        const newId = Date.now().toString() + Math.random().toString(36).substring(2, 6);
        const newTask = {
            id: newId, teamId, manager, taskType, date, dateEnd, timeStart, timeEnd,
            location, coordinates, contact, description, status: 'pending'
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
        <div style="margin-bottom: 1.5rem; display:flex; justify-content:space-between; align-items:flex-end; border-top:1px dashed var(--border-color); padding-top:1rem;">
            <div style="display:flex; flex-direction:column; gap:0.4rem;">
                <span style="font-size:0.9rem; font-weight:600; background:var(--bg-main); padding:0.3rem 0.8rem; border-radius:6px; color:var(--text-main); max-width:max-content;">${team.name}</span>
                <span style="font-size:0.8rem; color:var(--text-muted); font-weight:700;">Gestor: ${task.manager || 'Não Definido'}</span>
                <span style="font-size:0.8rem; color:${getServiceColor(task.taskType)}; font-weight:700;">🛠️ ${task.taskType || 'Outros'}</span>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end;">
                <span style="font-size:0.9rem; color:var(--text-muted); font-weight:500;">📅 ${dateStr} ${task.dateEnd && task.dateEnd !== task.date ? ' até ' + new Date(task.dateEnd+'T12:00:00').toLocaleDateString('pt-BR').substring(0,5) : ''}</span>
                ${task.timeStart ? `<span style="font-size:0.85rem; color:var(--primary); font-weight:600; margin-top:0.3rem;">⏰ ${task.timeStart} ${task.timeEnd ? ' às '+task.timeEnd : ''}</span>` : ''}
            </div>
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
    let dayTasks = tasks.filter(t => {
        const end = t.dateEnd || t.date;
        return dateStr >= t.date && dateStr <= end;
    });
    
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
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px dashed var(--border-color); padding-top:0.8rem;">
                        <div style="display:flex; flex-direction:column; gap:0.4rem;">
                            <span style="font-size:0.85rem; font-weight:600; color:var(--text-main); background:var(--bg-main); padding:0.2rem 0.6rem; border-radius:4px; max-width:max-content;">${team.name}</span>
                            <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">Gestor: ${task.manager || 'Não Definido'}</span>
                            <span style="font-size:0.75rem; color:${getServiceColor(task.taskType)}; font-weight:700;">🛠️ ${task.taskType || 'Outros'}</span>
                        </div>
                        <button class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="event.stopPropagation(); openEditTaskModal('${task.id}')">✏️ Editar</button>
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
        list.style.maxHeight = '4000px';
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
    const now = new Date();
    display.innerText = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// -------------------- //
// TEAM CRM DIRECTORIES //
// -------------------- //
function openTeamManager() {
    document.getElementById('teamManagerModal').classList.add('active');
    renderTeamManagerList();
}

function closeTeamManager() {
    document.getElementById('teamManagerModal').classList.remove('active');
}

function renderTeamManagerList() {
    const list = document.getElementById('teamsListContainer');
    list.innerHTML = '';
    
    initialTeams.forEach(team => {
        list.innerHTML += `
            <div style="background:var(--bg-card); border:1px solid var(--border-color); padding:1rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4 style="font-size:1rem; color:var(--text-main); margin-bottom:0.3rem;">${team.name}</h4>
                    <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700; background:var(--bg-main); padding:0.2rem 0.6rem; border-radius:12px;">${team.group || 'Geral'}</span>
                </div>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-secondary" style="padding:0.4rem; border:none; background:rgba(37,99,235,0.1); color:var(--primary);" onclick="openTeamForm('${team.id}')">✏️ Editar</button>
                    <button class="btn" style="padding:0.4rem; border:none; background:#fee2e2; color:#ef4444;" onclick="deleteTeam('${team.id}')">✕ Excluir</button>
                </div>
            </div>
        `;
    });
}

function openTeamForm(teamIdStr = null) {
    document.getElementById('teamFormModal').classList.add('active');
    document.getElementById('teamForm').reset();
    document.getElementById('editTeamId').value = '';
    document.getElementById('teamFormTitle').innerText = 'Nova Equipe';
    
    if (teamIdStr) {
        const team = initialTeams.find(t => t.id.toString() === teamIdStr.toString());
        if (team) {
            document.getElementById('editTeamId').value = team.id;
            document.getElementById('teamNameInput').value = team.name;
            document.getElementById('teamGroupInput').value = team.group || '';
            document.getElementById('teamFormTitle').innerText = 'Editar Equipe';
        }
    }
}

function closeTeamForm() {
    document.getElementById('teamFormModal').classList.remove('active');
}

function handleTeamSubmit(e) {
    e.preventDefault();
    const idField = document.getElementById('editTeamId').value;
    const name = document.getElementById('teamNameInput').value;
    const group = document.getElementById('teamGroupInput').value;
    
    if (idField) {
        db.ref('teams/' + idField).update({ name, group }).then(() => closeTeamForm());
    } else {
        const newId = Date.now().toString() + Math.random().toString(36).substr(2,4);
        db.ref('teams/' + newId).set({ id: newId, name, group }).then(() => closeTeamForm());
    }
}

function deleteTeam(id) {
    if(confirm("Excluir esta equipe permanentemente? (Ficará sem nome nas demandas antigas)")) {
        db.ref('teams/' + id).remove();
    }
}

// -------------------- //
// MANAGER CRM DIRECTORIES //
// -------------------- //
function openManagerManager() {
    document.getElementById('managerManagerModal').classList.add('active');
    renderManagerList();
}

function closeManagerManager() {
    document.getElementById('managerManagerModal').classList.remove('active');
}

function renderManagerList() {
    const list = document.getElementById('managersListContainer');
    list.innerHTML = '';
    
    initialManagers.forEach(manager => {
        list.innerHTML += `
            <div style="background:var(--bg-card); border:1px solid var(--border-color); padding:1rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <h4 style="font-size:1rem; color:var(--text-main); margin:0;">${manager.name}</h4>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-secondary" style="padding:0.4rem; border:none; background:rgba(37,99,235,0.1); color:var(--primary);" onclick="openManagerForm('${manager.id}')">✏️ Editar</button>
                    <button class="btn" style="padding:0.4rem; border:none; background:#fee2e2; color:#ef4444;" onclick="deleteManager('${manager.id}')">✕ Excluir</button>
                </div>
            </div>
        `;
    });
}

function openManagerForm(managerIdStr = null) {
    document.getElementById('managerFormModal').classList.add('active');
    document.getElementById('managerForm').reset();
    document.getElementById('editManagerId').value = '';
    document.getElementById('managerFormTitle').innerText = 'Novo Gestor';
    
    if (managerIdStr) {
        const manager = initialManagers.find(m => m.id.toString() === managerIdStr.toString());
        if (manager) {
            document.getElementById('editManagerId').value = manager.id;
            document.getElementById('managerNameInput').value = manager.name;
            document.getElementById('managerFormTitle').innerText = 'Editar Gestor';
        }
    }
}

function closeManagerForm() {
    document.getElementById('managerFormModal').classList.remove('active');
}

function handleManagerSubmit(e) {
    e.preventDefault();
    const idField = document.getElementById('editManagerId').value;
    const name = document.getElementById('managerNameInput').value;
    
    if (idField) {
        db.ref('managers/' + idField).update({ name }).then(() => closeManagerForm());
    } else {
        const newId = Date.now().toString() + Math.random().toString(36).substr(2,4);
        db.ref('managers/' + newId).set({ id: newId, name }).then(() => closeManagerForm());
    }
}

function deleteManager(id) {
    if(confirm("Excluir este gestor permanentemente? (Isso não alterará o nome nas demandas antigas já finalizadas)")) {
        db.ref('managers/' + id).remove();
    }
}
