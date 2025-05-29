// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA2BRSLAelEa5qPdHqqjkKNtU3bgal7h_c",
    authDomain: "torneodwh.firebaseapp.com",
    projectId: "torneodwh",
    storageBucket: "torneodwh.firebasestorage.app",
    messagingSenderId: "336157608486",
    appId: "1:336157608486:web:eb32c2c5852a12ba6534e7",
    measurementId: "G-1PZNK22XQ1"
};

// Inicializar Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ID del documento del torneo (puedes cambiarlo si quieres múltiples torneos)
const TOURNAMENT_ID = 'torneo-principal';

let players = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4', 'Jugador 5', 'Jugador 6',
    'Jugador 7', 'Jugador 8', 'Jugador 9', 'Jugador 10', 'Jugador 11', 'Jugador 12'];

let isLoading = false;

function createMatchdays() {
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

        // Generar enfrentamientos para esta jornada usando algoritmo round-robin
        const matches = generateMatchesForRound(matchday - 1, false);

        matches.forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.className = 'match';

            const teamsDiv = document.createElement('div');
            teamsDiv.className = 'match-teams';
            teamsDiv.textContent = `${players[match.home]} vs ${players[match.away]}`;

            const inputDiv = document.createElement('div');
            const input = document.createElement('input');
            input.className = 'match-input';
            input.type = 'text';
            input.placeholder = '0-0';
            input.id = `match_${match.home}_${match.away}_ida`;

            // Agregar evento para guardar datos automáticamente
            input.addEventListener('input', debounce(saveDataToFirebase, 1000));

            inputDiv.appendChild(input);
            matchDiv.appendChild(teamsDiv);
            matchDiv.appendChild(inputDiv);
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

            const inputDiv = document.createElement('div');
            const input = document.createElement('input');
            input.className = 'match-input';
            input.type = 'text';
            input.placeholder = '0-0';
            input.id = `match_${match.home}_${match.away}_vuelta`;

            // Agregar evento para guardar datos automáticamente
            input.addEventListener('input', debounce(saveDataToFirebase, 1000));

            inputDiv.appendChild(input);
            matchDiv.appendChild(teamsDiv);
            matchDiv.appendChild(inputDiv);
            matchesGrid.appendChild(matchDiv);
        });

        matchdayDiv.appendChild(header);
        matchdayDiv.appendChild(matchesGrid);
        container.appendChild(matchdayDiv);
    }
}

// Función debounce para evitar demasiadas escrituras a Firebase
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Función para guardar datos en Firebase
async function saveDataToFirebase() {
    if (isLoading) return; // Evitar guardar mientras se están cargando datos
    
    try {
        showStatus('Guardando...', 'loading');
        
        // Recopilar resultados de partidos
        const matchResults = {};
        const matchInputs = document.querySelectorAll('.match-input');
        
        matchInputs.forEach(input => {
            if (input.value.trim()) {
                matchResults[input.id] = input.value.trim();
            }
        });

        // Guardar en Firebase
        const tournamentRef = doc(db, 'tournaments', TOURNAMENT_ID);
        await updateDoc(tournamentRef, {
            players: players,
            matches: matchResults,
            lastUpdate: new Date()
        });

        showStatus('Guardado ✓', 'success');
        
    } catch (error) {
        console.error('Error al guardar datos:', error);
        showStatus('Error al guardar', 'error');
        
        // Si el documento no existe, créalo
        if (error.code === 'not-found') {
            try {
                const tournamentRef = doc(db, 'tournaments', TOURNAMENT_ID);
                await setDoc(tournamentRef, {
                    players: players,
                    matches: {},
                    lastUpdate: new Date(),
                    createdAt: new Date()
                });
                showStatus('Torneo creado ✓', 'success');
            } catch (createError) {
                console.error('Error al crear documento:', createError);
                showStatus('Error al crear torneo', 'error');
            }
        }
    }
}

// Función para cargar datos desde Firebase
async function loadDataFromFirebase() {
    try {
        isLoading = true;
        showStatus('Cargando datos...', 'loading');
        
        const tournamentRef = doc(db, 'tournaments', TOURNAMENT_ID);
        const docSnap = await getDoc(tournamentRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Cargar nombres de jugadores
            if (data.players && Array.isArray(data.players) && data.players.length === 12) {
                players = data.players;
                
                // Actualizar inputs de nombres de jugadores
                for (let i = 1; i <= 12; i++) {
                    const input = document.getElementById(`player${i}`);
                    if (input) {
                        input.value = players[i - 1];
                    }
                }
            }

            // Cargar resultados de partidos
            if (data.matches) {
                setTimeout(() => {
                    Object.keys(data.matches).forEach(matchId => {
                        const input = document.getElementById(matchId);
                        if (input) {
                            input.value = data.matches[matchId];
                        }
                    });
                    
                    // Calcular tabla automáticamente si hay resultados
                    if (Object.keys(data.matches).length > 0) {
                        calculateStandings();
                    }
                    
                    isLoading = false;
                    showStatus('Datos cargados ✓', 'success');
                }, 100);
            } else {
                isLoading = false;
                showStatus('Listo', 'success');
            }

        } else {
            // Crear documento inicial
            const tournamentRef = doc(db, 'tournaments', TOURNAMENT_ID);
            await setDoc(tournamentRef, {
                players: players,
                matches: {},
                lastUpdate: new Date(),
                createdAt: new Date()
            });
            
            isLoading = false;
            showStatus('Torneo inicializado ✓', 'success');
        }

    } catch (error) {
        console.error('Error al cargar datos:', error);
        isLoading = false;
        showStatus('Error al cargar datos', 'error');
    }
}

// Función para mostrar estado de la aplicación
function showStatus(message, type) {
    // Crear elemento de estado si no existe
    let statusEl = document.getElementById('firebase-status');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'firebase-status';
        statusEl.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(statusEl);
    }

    // Aplicar estilos según el tipo
    const styles = {
        loading: 'background: #2196F3; color: white;',
        success: 'background: #4CAF50; color: white;',
        error: 'background: #f44336; color: white;'
    };

    statusEl.textContent = message;
    statusEl.style.cssText += styles[type] || styles.success;

    // Auto-ocultar después de 3 segundos (excepto loading)
    if (type !== 'loading') {
        setTimeout(() => {
            if (statusEl.textContent === message) {
                statusEl.style.opacity = '0';
                setTimeout(() => {
                    if (statusEl.style.opacity === '0') {
                        statusEl.remove();
                    }
                }, 300);
            }
        }, 3000);
    }
}

// Configurar listener para cambios en tiempo real
function setupRealtimeListener() {
    const tournamentRef = doc(db, 'tournaments', TOURNAMENT_ID);
    
    onSnapshot(tournamentRef, (doc) => {
        if (doc.exists() && !isLoading) {
            const data = doc.data();
            
            // Solo actualizar si hay cambios reales
            if (data.matches) {
                let hasChanges = false;
                
                Object.keys(data.matches).forEach(matchId => {
                    const input = document.getElementById(matchId);
                    if (input && input.value !== data.matches[matchId]) {
                        input.value = data.matches[matchId];
                        hasChanges = true;
                    }
                });
                
                if (hasChanges) {
                    calculateStandings();
                    showStatus('Actualizado en tiempo real ✓', 'success');
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar las jornadas al cargar la página
    createMatchdays();
    
    // Cargar datos desde Firebase
    await loadDataFromFirebase();
    
    // Configurar listener para cambios en tiempo real
    setupRealtimeListener();
});

async function updatePlayerNames() {
    for (let i = 1; i <= 12; i++) {
        const input = document.getElementById(`player${i}`);
        if (input.value.trim()) {
            players[i - 1] = input.value.trim();
        }
    }
    
    createMatchdays();
    
    // Recargar datos después de recrear las jornadas
    setTimeout(async () => {
        await loadDataFromFirebase();
    }, 100);
    
    // Guardar los nuevos nombres
    await saveDataToFirebase();
}

function calculateStandings() {
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

    // Recorrer todos los inputs del calendario de jornadas
    const matchInputs = document.querySelectorAll('.match-input');

    matchInputs.forEach(input => {
        const result = input.value.trim();
        if (result && result.includes('-')) {
            const id = input.id;

            // Extraer información del ID: match_home_away_fase
            const parts = id.split('_');
            if (parts.length === 4) {
                const homeIndex = parseInt(parts[1]);
                const awayIndex = parseInt(parts[2]);
                const phase = parts[3]; // 'ida' o 'vuelta'

                const goals = result.split('-').map(g => parseInt(g.trim()));
                if (goals.length === 2 && !isNaN(goals[0]) && !isNaN(goals[1])) {
                    const goalsHome = goals[0];
                    const goalsAway = goals[1];

                    // Actualizar estadísticas del equipo local
                    standings[homeIndex].played++;
                    standings[homeIndex].goalsFor += goalsHome;
                    standings[homeIndex].goalsAgainst += goalsAway;

                    // Actualizar estadísticas del equipo visitante
                    standings[awayIndex].played++;
                    standings[awayIndex].goalsFor += goalsAway;
                    standings[awayIndex].goalsAgainst += goalsHome;

                    // Determinar resultado y asignar puntos
                    if (goalsHome > goalsAway) {
                        // Gana el local
                        standings[homeIndex].won++;
                        standings[homeIndex].points += 3;
                        standings[awayIndex].lost++;
                    } else if (goalsHome === goalsAway) {
                        // Empate
                        standings[homeIndex].drawn++;
                        standings[homeIndex].points += 1;
                        standings[awayIndex].drawn++;
                        standings[awayIndex].points += 1;
                    } else {
                        // Gana el visitante
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

    // Ordenar por puntos, diferencia de goles y goles a favor
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

async function clearAllResults() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los resultados?')) {
        try {
            // Limpiar inputs del calendario de jornadas
            const matchInputs = document.querySelectorAll('.match-input');
            matchInputs.forEach(input => input.value = '');

            // Limpiar tabla de posiciones
            const tbody = document.getElementById('standingsBody');
            tbody.innerHTML = '<tr><td colspan="10">Ingresa los resultados y presiona "Calcular Tabla de Posiciones"</td></tr>';

            // Limpiar en Firebase
            const tournamentRef = doc(db, 'tournaments', TOURNAMENT_ID);
            await updateDoc(tournamentRef, {
                matches: {},
                lastUpdate: new Date()
            });

            showStatus('Resultados eliminados ✓', 'success');
        } catch (error) {
            console.error('Error al limpiar resultados:', error);
            showStatus('Error al limpiar', 'error');
        }
    }
}

async function clearAllData() {
    if (confirm('¿Estás seguro de que quieres eliminar TODOS los datos guardados (incluyendo nombres de jugadores)?')) {
        try {
            // Resetear nombres de jugadores
            players = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4', 'Jugador 5', 'Jugador 6',
                'Jugador 7', 'Jugador 8', 'Jugador 9', 'Jugador 10', 'Jugador 11', 'Jugador 12'];
            
            // Actualizar inputs de nombres
            for (let i = 1; i <= 12; i++) {
                const input = document.getElementById(`player${i}`);
                if (input) {
                    input.value = players[i - 1];
                }
            }
            
            // Recrear jornadas y limpiar resultados
            createMatchdays();
            
            // Limpiar tabla de posiciones
            const tbody = document.getElementById('standingsBody');
            tbody.innerHTML = '<tr><td colspan="10">Ingresa los resultados y presiona "Calcular Tabla de Posiciones"</td></tr>';
            
            // Reinicializar Firebase
            const tournamentRef = doc(db, 'tournaments', TOURNAMENT_ID);
            await setDoc(tournamentRef, {
                players: players,
                matches: {},
                lastUpdate: new Date(),
                createdAt: new Date()
            });

            showStatus('Todos los datos eliminados ✓', 'success');
        } catch (error) {
            console.error('Error al eliminar datos:', error);
            showStatus('Error al eliminar', 'error');
        }
    }
}

function generateMatchesForRound(round, isReturn) {
    // Algoritmo Round-Robin correcto para 12 equipos
    const matches = [];
    const numTeams = 12;

    // Crear lista de equipos (0-11)
    let teams = [];
    for (let i = 0; i < numTeams; i++) {
        teams.push(i);
    }

    // El último equipo (11) se queda fijo
    const fixedTeam = teams.pop();
    const rotatingTeams = teams; // equipos 0-10

    // Rotar los equipos según la jornada
    for (let r = 0; r < round; r++) {
        rotatingTeams.push(rotatingTeams.shift());
    }

    // Generar enfrentamientos para esta jornada
    const halfSize = rotatingTeams.length / 2;

    // Primer partido: equipo fijo vs primer equipo rotativo
    if (isReturn) {
        matches.push({ home: rotatingTeams[0], away: fixedTeam });
    } else {
        matches.push({ home: fixedTeam, away: rotatingTeams[0] });
    }

    // Resto de partidos: enfrentar equipos de ambos extremos
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