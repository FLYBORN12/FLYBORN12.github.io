// user-protection.js - Incluir al inicio de users.html
(function() {
    'use strict';
    
    function checkUserAccess() {
        try {
            const sessionData = sessionStorage.getItem('torneo_session');
            
            if (!sessionData) {
                redirectToLogin();
                return false;
            }
            
            const session = JSON.parse(sessionData);
            
            // Verificar que tenga una sesión válida (user o admin)
            if (!session.role || !['user', 'admin'].includes(session.role)) {
                redirectToLogin();
                return false;
            }
            
            // Si es admin, verificar token adicional
            if (session.role === 'admin') {
                const storedToken = localStorage.getItem('auth_token');
                if (!storedToken || !validateToken(storedToken) || session.token !== storedToken) {
                    redirectToLogin();
                    return false;
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('Error verificando acceso de usuario:', error);
            redirectToLogin();
            return false;
        }
    }
    
    function validateToken(token) {
        try {
            const decoded = atob(token);
            const [timestamp] = decoded.split('-');
            const now = Date.now();
            const tokenAge = now - parseInt(timestamp);
            return tokenAge < 86400000; // 24 horas
        } catch {
            return false;
        }
    }
    
    function redirectToLogin() {
        alert('Debes iniciar sesión para acceder');
        
        // Limpiar datos
        sessionStorage.removeItem('torneo_session');
        localStorage.removeItem('auth_token');
        
        // Redirigir
        window.location.href = '../index.html';
    }
    
    // Verificación al cargar
    document.addEventListener('DOMContentLoaded', () => {
        if (!checkUserAccess()) {
            document.body.innerHTML = '<div style="text-align:center;padding:50px;">Acceso denegado</div>';
            return;
        }
        
        console.log('Acceso de usuario verificado');
        
        // Mostrar información del usuario si es necesario
        const sessionData = JSON.parse(sessionStorage.getItem('torneo_session'));
        if (sessionData.role === 'admin') {
            console.log('Usuario admin accediendo como usuario');
        }
    });
    
    // Verificación inmediata
    if (document.readyState !== 'loading') {
        setTimeout(checkUserAccess, 0);
    }
    
})();

// Función de logout para usuarios
function userLogout() {
    if (confirm('¿Quieres cerrar sesión?')) {
        sessionStorage.removeItem('torneo_session');
        localStorage.removeItem('auth_token');
        window.location.href = '../index.html';
    }
}

const firebaseConfig = {
    apiKey: "AIzaSyA2BRSLAelEa5qPdHqqjkKNtU3bgal7h_c",
    authDomain: "torneodwh.firebaseapp.com",
    projectId: "torneodwh",
    storageBucket: "torneodwh.firebasestorage.app",
    messagingSenderId: "336157608486",
    appId: "1:336157608486:web:eb32c2c5852a12ba6534e7",
    measurementId: "G-1PZNK22XQ1"
};

// Cargar Firebase desde CDN
const script1 = document.createElement('script');
script1.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js';
document.head.appendChild(script1);

const script2 = document.createElement('script');
script2.src = 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js';
document.head.appendChild(script2);

let app, db;
const TOURNAMENT_ID = 'torneo-principal';
let players = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4', 'Jugador 5', 'Jugador 6',
    'Jugador 7', 'Jugador 8', 'Jugador 9', 'Jugador 10', 'Jugador 11', 'Jugador 12'];

// Esperar a que Firebase se cargue
script2.onload = function () {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('Firebase inicializado correctamente');

    // Inicializar la aplicación
    initializeApp();
};

async function initializeApp() {
    try {
        showStatus('Cargando datos del torneo...', 'loading');

        // Cargar datos desde Firebase
        await loadDataFromFirebase();

        // Configurar listener para actualizaciones en tiempo real
        setupRealtimeListener();

    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        showStatus('Error al cargar datos', 'error');
    }
}

async function loadDataFromFirebase() {
    try {
        const tournamentRef = db.collection('tournaments').doc(TOURNAMENT_ID);
        const docSnap = await tournamentRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();

            // Cargar nombres de jugadores
            if (data.players && Array.isArray(data.players) && data.players.length === 12) {
                players = data.players;
            }

            // Mostrar participantes
            displayParticipants();

            // Crear vista del calendario
            createMatchdaysView();

            // Cargar resultados de partidos
            if (data.matches) {
                displayMatchResults(data.matches);
                calculateStandings(data.matches);
            }

            // Mostrar última actualización
            if (data.lastUpdate) {
                const lastUpdateEl = document.getElementById('lastUpdate');
                const updateTime = data.lastUpdate.toDate();
                lastUpdateEl.textContent = `Última actualización: ${updateTime.toLocaleString('es-ES')}`;
            }

            showStatus('Datos cargados correctamente', 'success');
        } else {
            showStatus('No se encontraron datos del torneo', 'error');
        }

    } catch (error) {
        console.error('Error al cargar datos:', error);
        showStatus('Error al cargar datos', 'error');
    }
}

function displayParticipants() {
    const grid = document.getElementById('participantsGrid');
    grid.innerHTML = '';

    players.forEach((player, index) => {
        const card = document.createElement('div');
        card.className = 'participant-card';
        card.textContent = `${index + 1}. ${player}`;
        grid.appendChild(card);
    });
}

function createMatchdaysView() {
    const container = document.getElementById('matchdayContainer');
    container.innerHTML = '';

    // Fase de ida
    const idaHeader = document.createElement('div');
    idaHeader.className = 'phase-header';
    idaHeader.textContent = '🏁 FASE DE IDA';
    container.appendChild(idaHeader);

    // Generar jornadas de ida (11 jornadas)
    for (let matchday = 1; matchday <= 11; matchday++) {
        const matchdayDiv = document.createElement('div');
        matchdayDiv.className = 'matchday';

        const header = document.createElement('div');
        header.className = 'matchday-header';
        header.textContent = `Jornada ${matchday} - Ida`;

        const matchesGrid = document.createElement('div');
        matchesGrid.className = 'matches-grid';

        // Generar enfrentamientos para esta jornada
        const matches = generateMatchesForRound(matchday - 1, false);

        matches.forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.className = 'match';

            const teamsDiv = document.createElement('div');
            teamsDiv.className = 'match-teams';
            teamsDiv.textContent = `${players[match.home]} vs ${players[match.away]}`;

            const resultDiv = document.createElement('div');
            resultDiv.className = 'match-result pending';
            resultDiv.textContent = 'Pendiente';
            resultDiv.id = `result_${match.home}_${match.away}_ida`;

            matchDiv.appendChild(teamsDiv);
            matchDiv.appendChild(resultDiv);
            matchesGrid.appendChild(matchDiv);
        });

        matchdayDiv.appendChild(header);
        matchdayDiv.appendChild(matchesGrid);
        container.appendChild(matchdayDiv);
    }

    // Fase de vuelta
    const vueltaHeader = document.createElement('div');
    vueltaHeader.className = 'phase-header';
    vueltaHeader.textContent = '🔄 FASE DE VUELTA';
    container.appendChild(vueltaHeader);

    // Generar jornadas de vuelta (11 jornadas)
    for (let matchday = 1; matchday <= 11; matchday++) {
        const matchdayDiv = document.createElement('div');
        matchdayDiv.className = 'matchday';

        const header = document.createElement('div');
        header.className = 'matchday-header';
        header.textContent = `Jornada ${matchday + 11} - Vuelta`;

        const matchesGrid = document.createElement('div');
        matchesGrid.className = 'matches-grid';

        // Generar enfrentamientos para esta jornada (invertidos)
        const matches = generateMatchesForRound(matchday - 1, true);

        matches.forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.className = 'match';

            const teamsDiv = document.createElement('div');
            teamsDiv.className = 'match-teams';
            teamsDiv.textContent = `${players[match.home]} vs ${players[match.away]}`;

            const resultDiv = document.createElement('div');
            resultDiv.className = 'match-result pending';
            resultDiv.textContent = 'Pendiente';
            resultDiv.id = `result_${match.home}_${match.away}_vuelta`;

            matchDiv.appendChild(teamsDiv);
            matchDiv.appendChild(resultDiv);
            matchesGrid.appendChild(matchDiv);
        });

        matchdayDiv.appendChild(header);
        matchdayDiv.appendChild(matchesGrid);
        container.appendChild(matchdayDiv);
    }
}

function displayMatchResults(matches) {
    Object.keys(matches).forEach(matchId => {
        const resultId = matchId.replace('match_', 'result_');
        const resultEl = document.getElementById(resultId);
        if (resultEl) {
            resultEl.textContent = matches[matchId];
            resultEl.className = 'match-result';
        }
    });
}

function calculateStandings(matches) {
    const standings = players.map((player, index) => ({
        name: player,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
    }));

    // Procesar resultados
    Object.keys(matches).forEach(matchId => {
        const result = matches[matchId];
        if (result && result.includes('-')) {
            const parts = matchId.split('_');
            if (parts.length === 4) {
                const homeIndex = parseInt(parts[1]);
                const awayIndex = parseInt(parts[2]);

                const goals = result.split('-').map(g => parseInt(g.trim()));
                if (goals.length === 2 && !isNaN(goals[0]) && !isNaN(goals[1])) {
                    const goalsHome = goals[0];
                    const goalsAway = goals[1];

                    // Actualizar estadísticas
                    standings[homeIndex].played++;
                    standings[homeIndex].goalsFor += goalsHome;
                    standings[homeIndex].goalsAgainst += goalsAway;

                    standings[awayIndex].played++;
                    standings[awayIndex].goalsFor += goalsAway;
                    standings[awayIndex].goalsAgainst += goalsHome;

                    // Determinar resultado
                    if (goalsHome > goalsAway) {
                        standings[homeIndex].won++;
                        standings[homeIndex].points += 3;
                        standings[awayIndex].lost++;
                    } else if (goalsHome === goalsAway) {
                        standings[homeIndex].drawn++;
                        standings[homeIndex].points += 1;
                        standings[awayIndex].drawn++;
                        standings[awayIndex].points += 1;
                    } else {
                        standings[awayIndex].won++;
                        standings[awayIndex].points += 3;
                        standings[homeIndex].lost++;
                    }
                }
            }
        }
    });

    // Calcular diferencia de goles
    standings.forEach(team => {
        team.goalDifference = team.goalsFor - team.goalsAgainst;
    });

    // Ordenar tabla
    standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
    });

    // Mostrar tabla
    const tbody = document.getElementById('standingsBody');
    tbody.innerHTML = '';

    standings.forEach((team, index) => {
        const row = document.createElement('tr');
        if (index < 8) {
            row.classList.add('top-eight'); // Añadir clase especial a las primeras 8 filas
        }
        if (index == 8) {
            row.classList.add('playoffs'); // Añadir clase especial a las primeras 8 filas
        }
        row.innerHTML = `
            <td class="position">${index + 1}</td>
            <td>${team.name}</td>
            <td>${team.played}</td>
            <td>${team.won}</td>
            <td>${team.drawn}</td>
            <td>${team.lost}</td>
            <td>${team.goalsFor}</td>
            <td>${team.goalsAgainst}</td>
            <td>${team.goalDifference}</td>
            <td><strong>${team.points}</strong></td>
            `;
        tbody.appendChild(row);
    });
}

function setupRealtimeListener() {
    const tournamentRef = db.collection('tournaments').doc(TOURNAMENT_ID);

    tournamentRef.onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();

            // Actualizar nombres si han cambiado
            if (data.players && JSON.stringify(data.players) !== JSON.stringify(players)) {
                players = data.players;
                displayParticipants();
                createMatchdaysView();
            }

            // Actualizar resultados
            if (data.matches) {
                displayMatchResults(data.matches);
                calculateStandings(data.matches);
            }

            // Actualizar timestamp
            if (data.lastUpdate) {
                const lastUpdateEl = document.getElementById('lastUpdate');
                const updateTime = data.lastUpdate.toDate();
                lastUpdateEl.textContent = `Última actualización: ${updateTime.toLocaleString('es-ES')}`;
            }

            showStatus('Datos actualizados', 'success');
        }
    });
}

function generateMatchesForRound(round, isReturn) {
    const matches = [];
    const numTeams = 12;

    let teams = [];
    for (let i = 0; i < numTeams; i++) {
        teams.push(i);
    }

    const fixedTeam = teams.pop();
    const rotatingTeams = teams;

    for (let r = 0; r < round; r++) {
        rotatingTeams.push(rotatingTeams.shift());
    }

    const halfSize = rotatingTeams.length / 2;

    if (isReturn) {
        matches.push({ home: rotatingTeams[0], away: fixedTeam });
    } else {
        matches.push({ home: fixedTeam, away: rotatingTeams[0] });
    }

    for (let i = 1; i < halfSize; i++) {
        const team1 = rotatingTeams[i];
        const team2 = rotatingTeams[rotatingTeams.length - i];

        if (isReturn) {
            matches.push({ home: team2, away: team1 });
        } else {
            matches.push({ home: team1, away: team2 });
        }
    }

    return matches;
}

function showStatus(message, type) {
    const existingStatus = document.querySelector('.status-indicator');
    if (existingStatus) {
        existingStatus.remove();
    }

    const statusEl = document.createElement('div');
    statusEl.className = `status-indicator status-${type}`;
    statusEl.textContent = message;
    document.body.appendChild(statusEl);

    if (type !== 'loading') {
        setTimeout(() => {
            if (statusEl.parentNode) {
                statusEl.style.opacity = '0';
                setTimeout(() => statusEl.remove(), 300);
            }
        }, 3000);
    }
}