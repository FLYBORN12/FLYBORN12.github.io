let players = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4', 'Jugador 5', 'Jugador 6',
    'Jugador 7', 'Jugador 8', 'Jugador 9', 'Jugador 10', 'Jugador 11', 'Jugador 12'];

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

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar las jornadas al cargar la página
    createMatchdays();
});


function updatePlayerNames() {
    for (let i = 1; i <= 12; i++) {
        const input = document.getElementById(`player${i}`);
        if (input.value.trim()) {
            players[i - 1] = input.value.trim();
        }
    }
    createMatchdays();
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
                        // El visitante no suma puntos pero sí se registra la derrota
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
                        // El local no suma puntos pero sí se registra la derrota
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

function clearAllResults() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los resultados?')) {
        // Limpiar inputs del calendario de jornadas
        const matchInputs = document.querySelectorAll('.match-input');
        matchInputs.forEach(input => input.value = '');

        // Limpiar tabla de posiciones
        const tbody = document.getElementById('standingsBody');
        tbody.innerHTML = '<tr><td colspan="10">Ingresa los resultados y presiona "Calcular Tabla de Posiciones"</td></tr>';
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