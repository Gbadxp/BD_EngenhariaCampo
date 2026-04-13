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
let initialManagers = []; // Dynamic array of Analista Responsável
let currentView = 'geral'; 
let currentDisplayMode = 'list';
let activeStatusFilters = ['pending', 'progress', 'done'];

let globalDateStart = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
})();
let globalDateEnd = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
})();

function updateDateFilter() {
    const startObj = document.getElementById('globalDateStart');
    const endObj = document.getElementById('globalDateEnd');
    if (startObj && startObj.value) globalDateStart = startObj.value;
    if (endObj && endObj.value) globalDateEnd = endObj.value;
    renderView();
}

let currentOnCall = null;
let onCallSchedules = [];

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    loadTheme();
    renderSidebarTeams();
    updateDateDisplay();
    listenForChanges(); // Boots up the Database observer instead of loadData

    const startInput = document.getElementById('globalDateStart');
    const endInput = document.getElementById('globalDateEnd');
    if(startInput) startInput.value = globalDateStart;
    if(endInput) endInput.value = globalDateEnd;
    
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
        "Fibra atenuada": "#db2777",
        "FIBERDOCS": "#0284c7",
        "GEOSITE": "#7c3aed",
        "Lançamento de fibra": "#14b8a6",
        "Caixa lotada": "#ea580c"
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
            
            // Clean up duplicates if the user or sync process created them
            let nameRegistry = new Set();
            let toRemove = [];
            let deduplicatedTeams = [];
            
            initialTeams.forEach(t => {
                const normName = t.name ? t.name.trim().toLowerCase() : "";
                if (normName && nameRegistry.has(normName)) {
                    toRemove.push(t.id);
                } else {
                    if (normName) nameRegistry.add(normName);
                    deduplicatedTeams.push(t);
                }
            });
            
            toRemove.forEach(id => {
                db.ref('teams/' + id).remove();
            });
            
            initialTeams = deduplicatedTeams;
            
            // Sync new Multskill team members if they haven't been added yet
            const multskillSeed = [
                { id: 20, name: "Railton Kley", group: "Multskill" },
                { id: 21, name: "Jhonatan Renan", group: "Multskill" },
                { id: 22, name: "Arthur Queiroz", group: "Multskill" }
            ];
            
            let changed = false;
            multskillSeed.forEach(t => {
                const normName = t.name.trim().toLowerCase();
                if (!initialTeams.find(existing => existing.id == t.id || (existing.name && existing.name.trim().toLowerCase() === normName))) {
                    db.ref('teams/' + t.id).set(t);
                    initialTeams.push(t);
                    changed = true;
                }
            });
            
            if (changed || toRemove.length > 0) {
                renderSidebarTeams();
                if(document.getElementById('teamManagerModal') && document.getElementById('teamManagerModal').classList.contains('active')){
                    if(typeof renderTeamManagerList === 'function') renderTeamManagerList();
                }
                renderView();
            }
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
                { id: 19, name: "Italo Gabriel / Everson", group: "Emendadores - Nova Mamoré/RO" },
                { id: 20, name: "Railton Kley", group: "Multskill" },
                { id: 21, name: "Jhonatan Renan", group: "Multskill" },
                { id: 22, name: "Arthur Queiroz", group: "Multskill" }
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

    // 3. Listen for On-Calls
    db.ref('onCalls').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            onCallSchedules = Object.values(data);
        } else {
            onCallSchedules = [];
        }
        if(document.getElementById('onCallManagerModal') && document.getElementById('onCallManagerModal').classList.contains('active')){
            if(typeof renderOnCallList === 'function') renderOnCallList();
        }
    });
}

function renderSidebarTeams() {
    const list = document.getElementById('teamsNavList');
    const select = document.getElementById('taskTeam');
    const eventSelect = document.getElementById('eventTeam');
    
    if (!list || !select) return;
    
    list.innerHTML = '';
    select.innerHTML = '<option value="" disabled selected>Selecione a equipe</option>';
    if (eventSelect) eventSelect.innerHTML = '<option value="all" selected>Todas as Equipes</option>';
    
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
        if (eventSelect) eventSelect.appendChild(optGroup.cloneNode(true));
    }
}

function renderManagerOptions() {
    const select = document.getElementById('taskManager');
    if (!select) return;
    
    // Store current selection if any
    const currentVal = select.value;
    
    select.innerHTML = '<option value="" disabled selected>Selecione o Analista</option>';
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
        title.innerHTML = 'Fiber<span class="highlight">Planner</span>';
        sub.innerText = "Cronograma de todas as equipes";
        
        currentDisplayMode = 'list';
        activeStatusFilters = ['pending', 'progress', 'done'];
        
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        globalDateStart = start;
        globalDateEnd = end;
        if (document.getElementById('globalDateStart')) document.getElementById('globalDateStart').value = start;
        if (document.getElementById('globalDateEnd')) document.getElementById('globalDateEnd').value = end;
        
        document.querySelectorAll('.view-toggles .toggle-btn').forEach(btn => btn.classList.remove('active'));
        const btnList = document.getElementById('btnListView');
        if (btnList) btnList.classList.add('active');
        
        document.querySelectorAll('.status-filters .toggle-btn').forEach(btn => btn.classList.add('active'));
    } else {
        const team = initialTeams.find(t => t.id === viewId);
        title.innerText = team.name;
        sub.innerText = "Demandas e Status da " + team.name;
    }
    
    renderView();
}

function toggleStatusFilter(val, btnElement) {
    if (activeStatusFilters.includes(val)) {
        activeStatusFilters = activeStatusFilters.filter(f => f !== val);
        btnElement.classList.remove('active');
    } else {
        activeStatusFilters.push(val);
        btnElement.classList.add('active');
    }
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
        filteredTasks = tasks.filter(t => t.teamId === currentView || (t.isEvent === true && (t.teamId === 'all' || t.teamId == currentView)));
    }
    
    filteredTasks = filteredTasks.filter(t => activeStatusFilters.includes(t.status) || t.isEvent === true);
    
    if (globalDateStart && globalDateEnd) {
        filteredTasks = filteredTasks.filter(t => {
            const end = t.dateEnd || t.date;
            return t.date <= globalDateEnd && end >= globalDateStart;
        });
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
        if (task.isEvent) {
            const dateObj = new Date(task.date + 'T12:00:00');
            const dateStr = dateObj.toLocaleDateString('pt-BR');
            let teamStr = task.teamId === 'all' ? 'Todas as Equipes' : (initialTeams.find(t => t.id == task.teamId)?.name || 'Geral');
            html += `
                <div style="background:#fee2e2; border-radius:10px; border:1px solid #f87171; padding:1rem; box-shadow:0 2px 4px rgba(0,0,0,0.02); display:flex; flex-direction:column; cursor:pointer;" onclick="openEventDetails('${task.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                        <span style="font-size:0.85rem; font-weight:800; color:#dc2626; text-transform:uppercase; letter-spacing:0.05em;">🗓️ Evento</span>
                    </div>
                    <div style="font-size:1.1rem; color:#dc2626; font-weight:800; margin-bottom:0.4rem;">
                        ${task.taskType}
                    </div>
                    ${task.description ? `<p style="font-size:0.85rem; color:#991b1b; margin-bottom:0.8rem; line-height:1.4;">${task.description}</p>` : ''}
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px dashed #f87171; padding-top:0.8rem; margin-top: auto;">
                        <div style="display:flex; flex-direction:column; gap:0.2rem;">
                            <span style="font-size:0.8rem; color:#dc2626; font-weight:500;">Aplicar a: ${teamStr}</span>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end; text-align:right;">
                            <span style="font-size:0.8rem; color:#dc2626; font-weight:500;">📅 ${dateStr}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:0.5rem; margin-top:1rem;" onclick="event.stopPropagation()">
                        <button class="btn btn-secondary w-full" style="font-size:0.8rem; padding:0.3rem;" onclick="openEditEventModal('${task.id}')">✏️ Editar</button>
                        <button class="btn w-full" style="background:#fca5a5; color:#991b1b; border:none; padding:0.3rem; font-size:0.8rem;" onclick="deleteTask('${task.id}')">✕ Excluir</button>
                    </div>
                </div>
            `;
            return;
        }

        const team = initialTeams.find(t => t.id === task.teamId);
        const dateObj = new Date(task.date + 'T12:00:00');
        const dateStr = dateObj.toLocaleDateString('pt-BR');
        
        let statusColor = "var(--status-pending)";
        let statusText = "Pendente";
        if (task.status === 'progress') { statusColor = "var(--status-progress)"; statusText = "Em Andamento"; }
        if (task.status === 'done') { statusColor = "var(--status-done)"; statusText = "Concluído"; }
        
        html += `
            <div style="background:var(--bg-card); border-radius:10px; border:1px solid var(--border-color); padding:1rem; box-shadow:0 2px 4px rgba(0,0,0,0.02); display:flex; flex-direction:column; cursor:pointer; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.02)';" onclick="openTaskDetails('${task.id}')">
                
                <!-- 1. Status -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <span style="font-size:0.85rem; font-weight:800; color:${statusColor}; text-transform:uppercase; letter-spacing:0.05em; display:flex; align-items:center; gap:0.4rem;">
                        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${statusColor};"></span>
                        ${statusText}
                    </span>
                </div>
                
                <!-- 2. Tipo de Serviço -->
                <div style="font-size:0.85rem; color:${getServiceColor(task.taskType)}; font-weight:800; margin-bottom:0.4rem;">
                    🛠️ ${task.taskType || 'Outros'}
                </div>
                
                <!-- 3. Endereço com Coordenadas -->
                <h4 style="font-size:0.8rem; font-weight:500; color:var(--text-muted); margin-bottom:0.2rem;">${task.location}</h4>
                ${task.coordinates ? `
                <div style="font-size:0.8rem; margin-bottom:0.6rem;">
                    <a href="https://www.google.com/maps/search/${encodeURIComponent(task.coordinates)}" target="_blank" onclick="event.stopPropagation()" style="color:var(--primary); text-decoration:none;" title="Ver Coordenadas no Mapa">📍 GPS ${task.coordinates}</a>
                </div>
                ` : '<div style="margin-bottom:0.6rem;"></div>'}
                
                <!-- 4. Equipe & 5. Data e horário -->
                <div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px dashed var(--border-color); padding-top:0.8rem; margin-top: auto;">
                    <div style="display:flex; flex-direction:column; gap:0.2rem;">
                        <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">Equipe: ${team.name}</span>
                        <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">Analista: ${task.manager || 'Não Definido'}</span>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; align-items:flex-end; text-align:right;">
                        <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">📅 ${dateStr}</span>
                        ${task.timeStart ? `<span style="font-size:0.8rem; color:var(--primary); font-weight:600;">⏰ ${task.timeStart} ${task.timeEnd ? ' às '+task.timeEnd : ''}</span>` : ''}
                    </div>
                </div>

                <div style="display:flex; gap:0.5rem; margin-top:1rem;" onclick="event.stopPropagation()">
                    <button class="btn btn-secondary w-full" style="font-size:0.8rem; padding:0.3rem;" onclick="openStatusPopover('${task.id}', event)">↻ Status</button>
                    <button class="btn btn-secondary w-full" style="font-size:0.8rem; padding:0.3rem;" onclick="openEditTaskModal('${task.id}')">✏️ Editar</button>
                    <button class="btn w-full" style="background:#fee2e2; color:#ef4444; border:none; padding:0.3rem; font-size:0.8rem;" onclick="deleteTask('${task.id}')">✕ Excluir</button>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
}

function renderCalendarView(filteredTasks, container) {
    let startDate = new Date();
    let endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    
    if (globalDateStart) startDate = new Date(globalDateStart + 'T12:00:00');
    if (globalDateEnd) endDate = new Date(globalDateEnd + 'T12:00:00');
    
    if (startDate > endDate) {
        let temp = startDate;
        startDate = endDate;
        endDate = temp;
    }
    
    const timeDiff = endDate.getTime() - startDate.getTime();
    const totalDays = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1;
    let firstDayOfWeek = startDate.getDay();
    let subtitle = `De ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`;
    
    let html = `
        <div style="margin-bottom: 1.5rem; display: flex; justify-content:space-between; align-items:center;">
            <h2 style="font-size: 1.4rem; display:flex; align-items:center; gap:0.6rem;">
                <span style="display:block; width:6px; height:1.4rem; background:var(--primary); border-radius:4px;"></span>
                Período: ${subtitle}
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
    
    for(let i = 0; i < firstDayOfWeek; i++) {
        html += `<div class="calendar-cell empty"></div>`;
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    for(let i = 0; i < totalDays; i++) {
        const currentDate = new Date(startDate.getTime() + i * 24*3600*1000);
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${d}`;
        const isToday = (dateStr === todayStr) ? 'today' : '';
        
        let cellTasks = filteredTasks.filter(t => {
            const end = t.dateEnd || t.date;
            return dateStr >= t.date && dateStr <= end;
        });
        
        let chipsHtml = '';
        cellTasks.forEach(task => {
            if (task.isEvent) {
                let eventTitle = task.taskType || 'Evento';
                let teamStr = task.teamId === 'all' ? 'Geral' : (initialTeams.find(t => t.id == task.teamId)?.name || 'Equipe');
                let chipText = task.teamId === 'all' ? `🗓️ ${eventTitle}` : `🗓️ ${eventTitle} (${teamStr})`;
                chipsHtml += `<div class="cal-task-chip" style="border-left-color: #dc2626; background-color: #fee2e2; color: #dc2626;" title="${eventTitle}" onclick="event.stopPropagation(); openEventDetails('${task.id}')">${chipText}</div>`;
            } else {
                const team = initialTeams.find(t => t.id === task.teamId) || {id: '?', name: 'Desconhecida'};
                let statusChar = "🟡";
                if (task.status === 'progress') statusChar = "🔵";
                if (task.status === 'done') statusChar = "🟢";
                let sColor = getServiceColor(task.taskType);
                chipsHtml += `<div class="cal-task-chip" style="border-left-color: ${sColor};" title="${task.taskType || 'Serviço'}" onclick="event.stopPropagation(); openTaskDetails('${task.id}')"><span style="font-size:9px; margin-right:4px;">${statusChar}</span>E${team.id}: ${task.location}</div>`;
            }
        });
        
        html += `
            <div class="calendar-cell ${isToday}" onclick="openDayModal('${dateStr}')" style="cursor:pointer;" title="Clique para expandir agenda do dia">
                <span class="day-number">${d}</span>
                ${chipsHtml}
            </div>
        `;
    }
    
    const totalCells = firstDayOfWeek + totalDays;
    const remainder = totalCells % 7;
    if(remainder !== 0) {
        for(let j = 0; j < (7 - remainder); j++) {
            html += `<div class="calendar-cell empty"></div>`;
        }
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

// changeCalendarMonth removed in favor of globalDateStart


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
    const headers = ['ID', 'Equipe', 'Analista', 'Tipo Serviço', 'Data', 'Início Previsto', 'Término Previsto', 'Local/Endereço', 'Status', 'Cliente/Contato', 'Coordenadas(GPS)', 'Descrição'];
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

function openWhatsappExportModal() {
    document.getElementById('whatsappExportModal').classList.add('active');
    document.getElementById('whatsappExportDate').value = new Date().toISOString().split('T')[0];
}

function closeWhatsappExportModal() {
    document.getElementById('whatsappExportModal').classList.remove('active');
}

function executeWhatsAppExport() {
    const selectedDate = document.getElementById('whatsappExportDate').value;
    if (!selectedDate) {
        alert('Por favor, selecione uma data.');
        return;
    }

    let filteredTasks = tasks.filter(t => {
        const end = t.dateEnd || t.date;
        return selectedDate >= t.date && selectedDate <= end;
    });

    if (currentView !== 'geral') {
        filteredTasks = filteredTasks.filter(t => t.teamId === currentView);
    }
    
    filteredTasks = filteredTasks.filter(t => activeStatusFilters.includes(t.status));
    
    if (filteredTasks.length === 0) {
        alert("Não há demandas para copiar nesta data combinada aos filtros atuais.");
        closeWhatsappExportModal();
        return;
    }

    filteredTasks.sort((a,b) => new Date(a.date) - new Date(b.date));

    // Exibir dia, mes e ano legível
    const dateObjFormat = new Date(selectedDate + 'T12:00:00');
    const displayDate = dateObjFormat.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year:'numeric' });

    let textToCopy = `📋 *RESUMO DE DEMANDAS*\n*Data:* ${displayDate.charAt(0).toUpperCase() + displayDate.slice(1)}\n\n`;

    filteredTasks.forEach((t, index) => {
        const team = initialTeams.find(teamObj => teamObj.id === t.teamId);
        const teamName = team ? team.name : 'Sem Equipe';
        
        let statusStr = "Pendente";
        if (t.status === 'progress') statusStr = "Em Andamento";
        if (t.status === 'done') statusStr = "Concluído";
        
        textToCopy += `*${index + 1}. ${t.taskType || 'Outros'}*\n`;
        textToCopy += `📊 Status: ${statusStr}\n`;
        textToCopy += `📍 Endereço: ${t.location}\n`;
        if (t.coordinates) textToCopy += `🌍 GPS: https://www.google.com/maps/search/${encodeURIComponent(t.coordinates)}\n`;
        textToCopy += `👷 Equipe: ${teamName}\n`;
        if (t.timeStart) textToCopy += `⏰ Horário: ${t.timeStart}${t.timeEnd ? ' às ' + t.timeEnd : ''}\n`;
        textToCopy += `📝 Descrição: ${t.description}\n`;
        if (t.manager) textToCopy += `👤 Analista: ${t.manager}\n`;
        textToCopy += `\n`;
    });

    navigator.clipboard.writeText(textToCopy).then(() => {
        alert(`Sucesso! ${filteredTasks.length} demandas do dia ${selectedDate.split('-').reverse().join('/')} foram copiadas.`);
        closeWhatsappExportModal();
    }).catch(err => {
        alert("Erro ao copiar: " + err);
    });
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
    
    // Status Pie Data
    const statusData = [pending, progress, done];
    
    // Type Pie Data (Top 5 Types)
    const typeCount = {};
    filteredTasks.forEach(t => {
        const type = t.taskType || 'Outros';
        typeCount[type] = (typeCount[type] || 0) + 1;
    });
    let sortedTypes = Object.entries(typeCount).sort((a,b) => b[1] - a[1]);
    
    if (sortedTypes.length > 5) {
        const othersCount = sortedTypes.slice(5).reduce((acc, curr) => acc + curr[1], 0);
        sortedTypes = sortedTypes.slice(0, 5);
        sortedTypes.push(['Outros', othersCount]);
    }
    
    const typeLabels = sortedTypes.map(x => x[0]);
    const typeData = sortedTypes.map(x => x[1]);
    const typeColors = typeLabels.map(t => getServiceColor(t));
    
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
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div class="perf-section" style="display:flex; flex-direction:column; align-items:center;">
                    <h3 style="margin-bottom: 1rem; width:100%; color: var(--text-main); font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.8rem;">Demandas por Status</h3>
                    <div style="position: relative; height:250px; width:100%;">
                        <canvas id="chartStatus"></canvas>
                    </div>
                </div>
                <div class="perf-section" style="display:flex; flex-direction:column; align-items:center;">
                    <h3 style="margin-bottom: 1rem; width:100%; color: var(--text-main); font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.8rem;">Demandas por Tipo</h3>
                    <div style="position: relative; height:250px; width:100%;">
                        <canvas id="chartTypes"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="perf-section">
                <h3 style="margin-bottom: 2rem; color: var(--text-main); font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.8rem;">Desempenho por Equipes</h3>
                ${teamStatsHtml}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    setTimeout(() => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (typeof Chart !== 'undefined') Chart.defaults.color = isDark ? '#94a3b8' : '#64748b';
        
        const ctxStatus = document.getElementById('chartStatus');
        if (ctxStatus && typeof Chart !== 'undefined') {
            new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Pendentes', 'Em Andamento', 'Concluídas'],
                    datasets: [{
                        data: statusData,
                        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
        
        const ctxTypes = document.getElementById('chartTypes');
        if (ctxTypes && typeof Chart !== 'undefined') {
            new Chart(ctxTypes, {
                type: 'pie',
                data: {
                    labels: typeLabels,
                    datasets: [{
                        data: typeData,
                        backgroundColor: typeColors,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
    }, 50);
}



// -------------------- //
// API STATUS/ACTIONS   //
// -------------------- //

let currentStatusTaskId = null;

function openStatusPopover(taskId, event) {
    if (event) event.stopPropagation();
    currentStatusTaskId = taskId;
    
    const popover = document.getElementById('statusPopover');
    if (!popover) return;
    
    popover.style.display = 'flex';
    
    const rect = event.currentTarget.getBoundingClientRect();
    
    let top = rect.bottom + window.scrollY + 5;
    let left = rect.left + window.scrollX;
    
    if (top + 150 > window.innerHeight + window.scrollY) {
        top = rect.top + window.scrollY - popover.offsetHeight - 5;
    }
    
    popover.style.top = top + 'px';
    popover.style.left = left + 'px';
}

function setStatusFromPopover(newStatus) {
    if (!currentStatusTaskId) return;
    
    db.ref('tasks/' + currentStatusTaskId).update({ status: newStatus }).then(() => {
        closeStatusPopover();
        
        if (document.getElementById('detailsModal') && document.getElementById('detailsModal').classList.contains('active')) {
            openTaskDetails(currentStatusTaskId);
        }
    }).catch(err => alert("Erro ao sincronizar status: " + err.message));
}

function closeStatusPopover() {
    const popover = document.getElementById('statusPopover');
    if (popover) popover.style.display = 'none';
    currentStatusTaskId = null;
}

document.addEventListener('click', (e) => {
    const popover = document.getElementById('statusPopover');
    if (popover && popover.style.display === 'flex' && !popover.contains(e.target) && !e.target.closest('button[onclick^="openStatusPopover"]')) {
        closeStatusPopover();
    }
});

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
    
    // Validation: Date end cannot be before Date start
    if (dateEnd && dateEnd < date) {
        alert("Erro: A data de término não pode ser menor que a data inicial.");
        return;
    }
    
    // Validation: If it ends on the same day, Time end cannot be before Time start
    if (dateEnd === date || !dateEnd) {
        if (timeStart && timeEnd && timeEnd < timeStart) {
            alert("Erro: O horário de término não pode ser menor que o horário inicial.");
            return;
        }
    }
    
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
            <span style="font-size:0.85rem; font-weight:800; color:${statusColor}; text-transform:uppercase; display:flex; align-items:center; gap:0.4rem; margin-bottom: 0.4rem;">
                <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${statusColor};"></span>
                ${statusText}
            </span>
            <span style="font-size:1rem; color:${getServiceColor(task.taskType)}; font-weight:800; display:block; margin-bottom: 0.8rem;">
                🛠️ ${task.taskType || 'Outros'}
            </span>
            
            <h4 style="font-size:1.2rem; font-weight:600; color:var(--text-main); margin-bottom:0.2rem;">${task.location}</h4>
            ${(task.contact || task.coordinates) ? `
                <div style="font-size:0.95rem; color:var(--text-muted); margin-top:0.6rem; display:flex; flex-direction:column; gap:0.4rem; background:rgba(0,0,0,0.03); padding:0.8rem; border-radius:6px;">
                    ${task.contact ? `<span><strong>📞 Contato:</strong> <a href="tel:${task.contact}" style="color:var(--primary); text-decoration:none;">${task.contact}</a></span>` : ''}
                    ${task.coordinates ? `<span><strong>📍 GPS:</strong> <a href="https://www.google.com/maps/search/${encodeURIComponent(task.coordinates)}" target="_blank" style="color:var(--primary); text-decoration:none;">${task.coordinates}</a></span>` : ''}
                </div>
            ` : ''}
            <p style="font-size:1rem; color:var(--text-muted); margin-top:0.8rem; line-height:1.5;">${task.description}</p>
        </div>
        <div style="margin-bottom: 1.5rem; display:flex; justify-content:space-between; align-items:flex-end; border-top:1px dashed var(--border-color); padding-top:1rem;">
            <div style="display:flex; flex-direction:column; gap:0.2rem;">
                <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">Equipe: ${team.name}</span>
                <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">Analista: ${task.manager || 'Não Definido'}</span>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end;">
                <span style="font-size:0.9rem; color:var(--text-muted); font-weight:500;">📅 ${dateStr} ${task.dateEnd && task.dateEnd !== task.date ? ' até ' + new Date(task.dateEnd+'T12:00:00').toLocaleDateString('pt-BR').substring(0,5) : ''}</span>
                ${task.timeStart ? `<span style="font-size:0.85rem; color:var(--primary); font-weight:600; margin-top:0.3rem;">⏰ ${task.timeStart} ${task.timeEnd ? ' às '+task.timeEnd : ''}</span>` : ''}
            </div>
        </div>
        <div class="form-actions" style="margin-top:0; display:flex; gap:0.5rem; justify-content:flex-end;">
            <button class="btn btn-secondary w-full" style="flex:1;" onclick="openStatusPopover('${task.id}', event)">↻ Alternar Status</button>
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
    if (activeStatusFilters.length < 3) {
        dayTasks = dayTasks.filter(t => activeStatusFilters.includes(t.status));
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
            if (task.isEvent) {
                const dateObjTask = new Date(task.date + 'T12:00:00');
                const dateStr = dateObjTask.toLocaleDateString('pt-BR');
                let teamStr = task.teamId === 'all' ? 'Todas as Equipes' : (initialTeams.find(t => t.id == task.teamId)?.name || 'Geral');
                html += `
                <div style="background:#fee2e2; border-radius:10px; border:1px solid #f87171; padding:1rem; box-shadow:0 2px 4px rgba(0,0,0,0.02); display:flex; flex-direction:column; cursor:pointer;" onclick="openEventDetails('${task.id}')">
                    <div style="font-size:0.85rem; font-weight:800; color:#dc2626; text-transform:uppercase; margin-bottom:0.4rem;">
                        🗓️ Evento
                    </div>
                    <h4 style="font-size:1.1rem; font-weight:800; color:#dc2626; margin-bottom:0.2rem;">${task.taskType}</h4>
                    ${task.description ? `<p style="font-size:0.85rem; color:#991b1b; margin-bottom:0.8rem; line-height:1.4;">${task.description}</p>` : ''}
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px dashed #f87171; padding-top:0.8rem; margin-top: auto;">
                        <span style="font-size:0.8rem; color:#dc2626; font-weight:500;">Aplicar a: ${teamStr}</span>
                        <span style="font-size:0.8rem; color:#dc2626; font-weight:500;">📅 ${dateStr}</span>
                    </div>
                    <div style="display:flex; gap:0.5rem; margin-top:1rem;" onclick="event.stopPropagation()">
                        <button class="btn btn-secondary w-full" style="font-size:0.8rem; padding:0.3rem;" onclick="openEditEventModal('${task.id}')">✏️ Editar</button>
                        <button class="btn w-full" style="background:#fca5a5; color:#991b1b; border:none; padding:0.3rem; font-size:0.8rem;" onclick="deleteTaskAndCloseDetails('${task.id}')">✕ Excluir</button>
                    </div>
                </div>
                `;
                return;
            }

            const team = initialTeams.find(t => t.id === task.teamId);
            const dateObjTask = new Date(task.date + 'T12:00:00');
            const dateStr = dateObjTask.toLocaleDateString('pt-BR');
            
            let statusColor = "var(--status-pending)";
            let statusText = "Pendente";
            if (task.status === 'progress') { statusColor = "var(--status-progress)"; statusText = "Em Andamento"; }
            if (task.status === 'done') { statusColor = "var(--status-done)"; statusText = "Concluído"; }
            
            html += `
            <div style="background:var(--bg-card); border-radius:10px; border:1px solid var(--border-color); padding:1rem; box-shadow:0 2px 4px rgba(0,0,0,0.02); display:flex; flex-direction:column; cursor:pointer; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.02)';" onclick="openTaskDetails('${task.id}')">
                
                <!-- 1. Status -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <span style="font-size:0.85rem; font-weight:800; color:${statusColor}; text-transform:uppercase; letter-spacing:0.05em; display:flex; align-items:center; gap:0.4rem;">
                        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${statusColor};"></span>
                        ${statusText}
                    </span>
                </div>
                
                <!-- 2. Tipo de Serviço -->
                <div style="font-size:0.85rem; color:${getServiceColor(task.taskType)}; font-weight:800; margin-bottom:0.4rem;">
                    🛠️ ${task.taskType || 'Outros'}
                </div>
                
                <!-- 3. Endereço com Coordenadas -->
                <h4 style="font-size:0.8rem; font-weight:500; color:var(--text-muted); margin-bottom:0.2rem;">${task.location}</h4>
                ${task.coordinates ? `
                <div style="font-size:0.8rem; margin-bottom:0.6rem;">
                    <a href="https://www.google.com/maps/search/${encodeURIComponent(task.coordinates)}" target="_blank" onclick="event.stopPropagation()" style="color:var(--primary); text-decoration:none;" title="Ver Coordenadas no Mapa">📍 GPS ${task.coordinates}</a>
                </div>
                ` : '<div style="margin-bottom:0.6rem;"></div>'}
                
                <!-- 4. Equipe & 5. Data e horário -->
                <div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px dashed var(--border-color); padding-top:0.8rem; margin-top: auto;">
                    <div style="display:flex; flex-direction:column; gap:0.2rem;">
                        <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">Equipe: ${team.name}</span>
                        <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">Analista: ${task.manager || 'Não Definido'}</span>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; align-items:flex-end; text-align:right;">
                        <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">📅 ${dateStr}</span>
                        ${task.timeStart ? `<span style="font-size:0.8rem; color:var(--primary); font-weight:600;">⏰ ${task.timeStart} ${task.timeEnd ? ' às '+task.timeEnd : ''}</span>` : ''}
                    </div>
                </div>

                <div style="display:flex; gap:0.5rem; margin-top:1rem;" onclick="event.stopPropagation()">
                    <button class="btn btn-secondary w-full" style="font-size:0.8rem; padding:0.3rem;" onclick="openStatusPopover('${task.id}', event)">↻ Status</button>
                    <button class="btn btn-secondary w-full" style="font-size:0.8rem; padding:0.3rem;" onclick="openEditTaskModal('${task.id}')">✏️ Editar</button>
                    <button class="btn w-full" style="background:#fee2e2; color:#ef4444; border:none; padding:0.3rem; font-size:0.8rem;" onclick="deleteTaskAndCloseDetails('${task.id}')">✕ Excluir</button>
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
// PER-DAY TEAMS MODAL  //
// -------------------- //
function openDayTeamsModal(dateStr) {
    let dayTasks = tasks.filter(t => {
        const end = t.dateEnd || t.date;
        return dateStr >= t.date && dateStr <= end;
    });
    
    if (currentView !== 'geral') {
        dayTasks = dayTasks.filter(t => t.teamId === currentView);
    }
    dayTasks = dayTasks.filter(t => activeStatusFilters.includes(t.status));

    const dateObj = new Date(dateStr + 'T12:00:00');
    document.getElementById('dayTeamsModalTitle').innerText = "Ocupação: " + dateObj.toLocaleDateString('pt-BR');

    let comDemandaGroups = {};
    let countComDemanda = 0;
    
    let semDemandaGroups = {};
    let countSemDemanda = 0;

    initialTeams.forEach(team => {
        if (currentView !== 'geral' && currentView !== team.id) return;
        
        const teamTasks = dayTasks.filter(t => t.teamId === team.id && t.status !== 'done');
        const groupName = team.group || 'GERAL';
        
        if (teamTasks.length > 0) {
            countComDemanda++;
            let servicesMap = new Set();
            teamTasks.forEach(t => servicesMap.add(t.taskType || 'Outros'));
            const servicesStr = Array.from(servicesMap).map(s => `
                <span style="display:inline-block; margin-top:0.4rem; margin-right:0.4rem; font-size:0.75rem; background:rgba(37,99,235,0.1); color:var(--primary); font-weight:600; padding:0.25rem 0.6rem; border-radius:12px;">
                    🛠️ ${s}
                </span>
            `).join('');

            if (!comDemandaGroups[groupName]) comDemandaGroups[groupName] = '';
            comDemandaGroups[groupName] += `
                <div style="background:var(--bg-card); border:1px solid var(--border-color); padding:1rem; border-radius:10px; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
                    <h4 style="font-size:1.05rem; font-weight:700; color:var(--text-main); margin-bottom:0.2rem;">${team.name}</h4>
                    <div>${servicesStr}</div>
                </div>
            `;
        } else {
            countSemDemanda++;
            if (!semDemandaGroups[groupName]) semDemandaGroups[groupName] = '';
            semDemandaGroups[groupName] += `
                <div style="background:var(--bg-card); border:1px solid var(--border-color); padding:0.8rem 1rem; border-radius:10px; display:flex; align-items:center; box-shadow:0 1px 3px rgba(0,0,0,0.02);">
                    <div style="width:10px; height:10px; border-radius:50%; background:var(--status-done); margin-right:0.8rem; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);"></div>
                    <h4 style="font-size:1rem; font-weight:600; color:var(--text-main); margin:0;">${team.name}</h4>
                </div>
            `;
        }
    });
    
    let comDemandaHtml = '';
    for (const group in comDemandaGroups) {
        comDemandaHtml += `
            <div style="margin-bottom:1.5rem;">
                <h5 style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.6rem; padding-left:0.5rem; border-left:3px solid var(--status-progress);">${group}</h5>
                <div style="display:flex; flex-direction:column; gap:0.8rem;">
                    ${comDemandaGroups[group]}
                </div>
            </div>
        `;
    }

    let semDemandaHtml = '';
    for (const group in semDemandaGroups) {
        semDemandaHtml += `
            <div style="margin-bottom:1.5rem;">
                <h5 style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.6rem; padding-left:0.5rem; border-left:3px solid var(--status-done);">${group}</h5>
                <div style="display:flex; flex-direction:column; gap:0.8rem;">
                    ${semDemandaGroups[group]}
                </div>
            </div>
        `;
    }

    if (comDemandaHtml === '') comDemandaHtml = '<p style="color:var(--text-muted); font-size:0.9rem; text-align:center; padding:1.5rem;">Nenhuma equipe com demanda pendente neste dia.</p>';
    if (semDemandaHtml === '') semDemandaHtml = '<p style="color:var(--text-muted); font-size:0.9rem; text-align:center; padding:1.5rem;">Todas as equipes estão com obras programadas.</p>';

    let sobreavisoHtml = '';
    
    let teamsOnCallToday = [];
    onCallSchedules.forEach(schedule => {
        if (dateStr >= schedule.startDate && dateStr <= schedule.endDate) {
            let selectedIds = Array.isArray(schedule.teamIds) ? schedule.teamIds : [schedule.teamId];
            teamsOnCallToday = teamsOnCallToday.concat(selectedIds);
        }
    });
    
    if (teamsOnCallToday.length > 0) {
        teamsOnCallToday = [...new Set(teamsOnCallToday)];
        const teamNames = teamsOnCallToday.map(id => {
            const teamObj = initialTeams.find(t => t.id && t.id.toString() === id.toString());
            return teamObj ? teamObj.name : "Desconhecida";
        });
        sobreavisoHtml = `
            <div style="background:#fee2e2; border:1px solid #ef4444; border-radius:12px; padding:1.2rem; margin-bottom: 1.5rem;">
                <h3 style="margin-bottom: 0.5rem; color:#ef4444; border-bottom:2px solid #ef4444; padding-bottom:0.6rem; display:flex; align-items:center;">
                    <span style="font-size:1.1rem; margin-right:0.4rem;">🚨</span> Equipes em Sobreaviso
                </h3>
                <p style="color:#b91c1c; font-weight: 600; font-size: 1rem; line-height: 1.5;">${teamNames.join(" | ")}</p>
            </div>
        `;
    }

    let html = `
        ${sobreavisoHtml}
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:1.5rem;">
            <div style="background:var(--bg-main); border-radius:12px; border:1px solid var(--border-color); padding:1.2rem;">
                <h3 style="margin-bottom: 1.2rem; color:var(--text-main); border-bottom:2px solid var(--status-progress); padding-bottom:0.6rem; display:flex; justify-content:space-between; align-items:center;">
                    <span><span style="font-size:1.1rem; margin-right:0.4rem;">👷</span> Com Demanda</span>
                    <span style="background:var(--status-progress); color:white; font-size:0.8rem; font-weight:700; padding:0.15rem 0.6rem; border-radius:20px;">${countComDemanda}</span>
                </h3>
                <div style="display:flex; flex-direction:column; gap:0.8rem;">
                    ${comDemandaHtml}
                </div>
            </div>
            <div style="background:var(--bg-main); border-radius:12px; border:1px solid var(--border-color); padding:1.2rem;">
                <h3 style="margin-bottom: 1.2rem; color:var(--text-main); border-bottom:2px solid var(--status-done); padding-bottom:0.6rem; display:flex; justify-content:space-between; align-items:center;">
                    <span><span style="font-size:1.1rem; margin-right:0.4rem;">✅</span> Equipas Livres</span>
                    <span style="background:var(--status-done); color:white; font-size:0.8rem; font-weight:700; padding:0.15rem 0.6rem; border-radius:20px;">${countSemDemanda}</span>
                </h3>
                <div style="display:flex; flex-direction:column; gap:0.8rem;">
                    ${semDemandaHtml}
                </div>
            </div>
        </div>
    `;

    document.getElementById('dayTeamsModalBody').innerHTML = html;
    document.getElementById('dayTeamsModal').classList.add('active');
}

function closeDayTeamsModal() {
    document.getElementById('dayTeamsModal').classList.remove('active');
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

// -------------------- //
// ON-CALL/SOBREAVISO   //
// -------------------- //

function renderOnCallBanner() {
    // Banner foi movido para o modal da agenda.
}

function openOnCallManager() {
    document.getElementById('onCallManagerModal').classList.add('active');
    renderOnCallList();
}

function closeOnCallManager() {
    document.getElementById('onCallManagerModal').classList.remove('active');
}

function renderOnCallList() {
    const list = document.getElementById('onCallListContainer');
    list.innerHTML = '';
    
    // sort chronologically
    const sorted = [...onCallSchedules].sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
    
    if (sorted.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Nenhuma escala de sobreaviso agendada.</p>';
        return;
    }
    
    sorted.forEach(schedule => {
        let selectedIds = Array.isArray(schedule.teamIds) ? schedule.teamIds : [];
        const teamNames = selectedIds.map(id => {
            const teamObj = initialTeams.find(t => t.id.toString() === id.toString());
            return teamObj ? teamObj.name : "Desconhecida";
        });
        
        let startFmt = new Date(schedule.startDate + 'T12:00:00').toLocaleDateString('pt-BR').substring(0,5);
        let endFmt = new Date(schedule.endDate + 'T12:00:00').toLocaleDateString('pt-BR').substring(0,5);
        
        list.innerHTML += `
            <div style="background:var(--bg-card); border:1px solid var(--border-color); padding:1rem; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div style="flex: 1;">
                    <h4 style="font-size:0.95rem; color:var(--text-main); margin-bottom:0.3rem;">${teamNames.join(', ')}</h4>
                    <span style="font-size:0.8rem; color:var(--primary); font-weight:700;">📅 ${startFmt} a ${endFmt}</span>
                </div>
                <div style="display:flex; gap:0.5rem; margin-left: 1rem;">
                    <button class="btn btn-secondary" style="padding:0.4rem; border:none; background:rgba(37,99,235,0.1); color:var(--primary);" onclick="openOnCallForm('${schedule.id}')">✏️</button>
                    <button class="btn" style="padding:0.4rem; border:none; background:#fee2e2; color:#ef4444;" onclick="deleteOnCall('${schedule.id}')">✕</button>
                </div>
            </div>
        `;
    });
}

function openOnCallForm(scheduleId = null) {
    document.getElementById('onCallFormModal').classList.add('active');
    document.getElementById('onCallForm').reset();
    document.getElementById('editOnCallId').value = '';
    document.getElementById('onCallFormTitle').innerText = 'Nova Escala de Sobreaviso';
    
    let selectedIds = [];
    let startD = new Date().toISOString().split('T')[0];
    let endD = new Date().toISOString().split('T')[0];
    
    if (scheduleId) {
        const schedule = onCallSchedules.find(s => s.id === scheduleId);
        if (schedule) {
            document.getElementById('editOnCallId').value = schedule.id;
            selectedIds = Array.isArray(schedule.teamIds) ? schedule.teamIds : [];
            startD = schedule.startDate || startD;
            endD = schedule.endDate || endD;
            document.getElementById('onCallFormTitle').innerText = 'Editar Escala de Sobreaviso';
        }
    }
    
    const startObj = document.getElementById('onCallDateStart');
    const endObj = document.getElementById('onCallDateEnd');
    if (startObj) startObj.value = startD;
    if (endObj) endObj.value = endD;
    
    const container = document.getElementById('onCallTeamButtons');
    container.innerHTML = '';
    
    initialTeams.forEach(t => {
        const isSelected = selectedIds.includes(t.id.toString()) || selectedIds.includes(t.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = isSelected ? 'btn btn-primary' : 'btn btn-secondary';
        btn.style.margin = '4px';
        btn.style.padding = '0.4rem 0.8rem';
        btn.style.fontSize = '0.85rem';
        btn.innerText = t.name;
        btn.onclick = () => {
             btn.classList.toggle('btn-primary');
             btn.classList.toggle('btn-secondary');
             if (btn.classList.contains('btn-primary')) {
                 btn.setAttribute('data-selected', 'true');
             } else {
                 btn.removeAttribute('data-selected');
             }
        };
        if (isSelected) btn.setAttribute('data-selected', 'true');
        btn.setAttribute('data-team-id', t.id);
        container.appendChild(btn);
    });
}

function closeOnCallForm() {
    document.getElementById('onCallFormModal').classList.remove('active');
}

function handleOnCallSubmit(e) {
    e.preventDefault();
    const idField = document.getElementById('editOnCallId').value;
    const container = document.getElementById('onCallTeamButtons');
    const selectedBtns = container.querySelectorAll('button[data-selected="true"]');
    const selectedOptions = Array.from(selectedBtns).map(btn => btn.getAttribute('data-team-id'));
    
    if (selectedOptions.length === 0) {
        alert("Selecione pelo menos uma equipe.");
        return;
    }
    
    const startDate = document.getElementById('onCallDateStart').value;
    const endDate = document.getElementById('onCallDateEnd').value;
    
    if (startDate && endDate && startDate > endDate) {
        alert("A data inicial não pode ser maior que a final.");
        return;
    }
    
    if (idField) {
        db.ref('onCalls/' + idField).update({ teamIds: selectedOptions, startDate, endDate })
          .then(() => closeOnCallForm())
          .catch(err => alert("Erro ao editar escala: " + err.message));
    } else {
        const newId = Date.now().toString() + Math.random().toString(36).substr(2,4);
        db.ref('onCalls/' + newId).set({ id: newId, teamIds: selectedOptions, startDate, endDate })
          .then(() => closeOnCallForm())
          .catch(err => alert("Erro ao salvar escala: " + err.message));
    }
}

function deleteOnCall(id) {
    if(confirm("Excluir esta escala de sobreaviso?")) {
        db.ref('onCalls/' + id).remove()
            .catch(err => alert("Erro ao deletar escala: " + err.message));
    }
}

// -------------------- //
// NEW: EVENTS LOGIC    //
// -------------------- //

function openNewEventModal(forcedDate = null) {
    document.getElementById('eventModal').classList.add('active');
    document.getElementById('eventForm').reset();
    document.getElementById('eventId').value = '';
    
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
        if(forcedDate) dateInput.value = forcedDate;
        else dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    const teamSelect = document.getElementById('eventTeam');
    if (currentView !== 'geral' && currentView !== 'all' && teamSelect) {
        teamSelect.value = currentView;
    } else if (teamSelect) {
        teamSelect.value = 'all';
    }
    
    document.getElementById('eventModalTitle').innerText = 'Agendar Novo Evento';
    closeDayModal();
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
}

function handleEventSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('eventTitle').value;
    const teamId = document.getElementById('eventTeam').value;
    const date = document.getElementById('eventDate').value;
    const dateEndEl = document.getElementById('eventDateEnd');
    const dateEnd = dateEndEl && dateEndEl.value ? dateEndEl.value : date;
    const description = document.getElementById('eventDescription').value;
    
    if (dateEnd && dateEnd < date) {
        alert("Erro: A data de término não pode ser menor que a data inicial.");
        return;
    }
    
    const editingId = document.getElementById('eventId').value;
    
    const eventData = {
        isEvent: true,
        taskType: title,
        teamId: teamId || 'all',
        date,
        dateEnd,
        description,
        status: 'done', // ensures it passes status filters and doesn't clutter pending logic
        location: title
    };

    if (editingId) {
        db.ref('tasks/' + editingId).update(eventData)
            .then(() => closeEventModal()).catch(err => alert("Erro ao editar evento: " + err.message));
    } else {
        const newId = Date.now().toString() + Math.random().toString(36).substring(2, 6);
        eventData.id = newId;
        db.ref('tasks/' + newId).set(eventData)
            .then(() => closeEventModal())
            .catch(err => alert("Erro ao cadastrar evento: " + err.message));
    }
}

function openEditEventModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    document.getElementById('eventId').value = task.id;
    document.getElementById('eventTitle').value = task.taskType || '';
    document.getElementById('eventTeam').value = task.teamId || 'all';
    document.getElementById('eventDate').value = task.date;
    document.getElementById('eventDateEnd').value = task.dateEnd || '';
    document.getElementById('eventDescription').value = task.description || '';
    
    document.getElementById('eventModalTitle').innerText = 'Editar Evento';
    
    closeDetailsModal();
    closeDayModal();
    
    document.getElementById('eventModal').classList.add('active');
}

function openEventDetails(eventId) {
    const task = tasks.find(t => t.id === eventId);
    if (!task) return;
    
    const dbContainer = document.getElementById('detailsModalBody');
    const dateObj = new Date(task.date + 'T12:00:00');
    const dateStr = dateObj.toLocaleDateString('pt-BR');
    let teamStr = task.teamId === 'all' ? 'Todas as Equipes' : (initialTeams.find(t => t.id == task.teamId)?.name || 'Geral');
    
    dbContainer.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <span style="font-size:0.85rem; font-weight:800; color:#dc2626; text-transform:uppercase; display:flex; align-items:center; gap:0.4rem; margin-bottom: 0.4rem;">
                🗓️ Evento no Calendário
            </span>
            <span style="font-size:1.2rem; color:var(--text-main); font-weight:800; display:block; margin-bottom: 0.8rem;">
                ${task.taskType}
            </span>
            
            ${task.description ? `<p style="font-size:1rem; color:var(--text-muted); margin-top:0.8rem; line-height:1.5;">${task.description}</p>` : ''}
        </div>
        <div style="margin-bottom: 1.5rem; display:flex; justify-content:space-between; align-items:flex-end; border-top:1px dashed var(--border-color); padding-top:1rem;">
            <div style="display:flex; flex-direction:column; gap:0.2rem;">
                <span style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">Aplicação: ${teamStr}</span>
            </div>
            <div style="display:flex; flex-direction:column; align-items:flex-end;">
                <span style="font-size:0.9rem; color:var(--text-muted); font-weight:500;">📅 ${dateStr} ${task.dateEnd && task.dateEnd !== task.date ? ' até ' + new Date(task.dateEnd+'T12:00:00').toLocaleDateString('pt-BR').substring(0,5) : ''}</span>
            </div>
        </div>
        <div class="form-actions" style="margin-top:0; display:flex; gap:0.5rem; justify-content:flex-end;">
            <button class="btn btn-secondary w-full" style="flex:1;" onclick="openEditEventModal('${task.id}')">✏️ Editar Evento</button>
            <button class="btn w-full" style="flex:1; background:#fee2e2; color:#ef4444; border:none;" onclick="deleteTaskAndCloseDetails('${task.id}')">✕ Excluir</button>
        </div>
    `;
    
    document.querySelector('#detailsModal .modal-header h3').innerText = "Detalhes do Evento";
    document.getElementById('detailsModal').classList.add('active');
}
