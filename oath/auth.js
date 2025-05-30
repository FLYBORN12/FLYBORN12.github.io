// Configuración de Firebase (tu configuración actual)
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
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variables globales
let selectedUserType = null;
let isLoading = false;

// Referencias a elementos DOM
const userBtn = document.getElementById('userBtn');
const adminBtn = document.getElementById('adminBtn');
const adminForm = document.getElementById('adminForm');
const loginBtn = document.getElementById('loginBtn');
const loginText = document.getElementById('loginText');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// Event listeners
userBtn.addEventListener('click', () => selectUserType('user'));
adminBtn.addEventListener('click', () => selectUserType('admin'));
loginBtn.addEventListener('click', handleLogin);

// Permitir login con Enter
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && selectedUserType) {
        handleLogin();
    }
});

function selectUserType(type) {
    selectedUserType = type;

    // Resetear selección visual
    userBtn.classList.remove('selected');
    adminBtn.classList.remove('selected');

    // Seleccionar tipo actual
    if (type === 'user') {
        userBtn.classList.add('selected');
        adminForm.classList.remove('show');
        loginText.textContent = 'Entrar como Usuario';
    } else {
        adminBtn.classList.add('selected');
        adminForm.classList.add('show');
        loginText.textContent = 'Entrar como Administrador';
        setTimeout(() => usernameInput.focus(), 300);
    }

    hideMessages();
}

async function handleLogin() {
    if (!selectedUserType || isLoading) return;

    if (selectedUserType === 'user') {
        // Acceso directo para usuarios
        showStatus('Accediendo...', 'loading');
        setTimeout(() => {
            showSuccessMessage('¡Bienvenido! Redirigiendo...');
            setTimeout(() => {
                // Aquí redirigir a la página principal del torneo
                window.location.href = '../views/users.html'; // o la URL de tu aplicación principal
            }, 1500);
        }, 1000);

    } else if (selectedUserType === 'admin') {
        // Validar credenciales de administrador
        await handleAdminLogin();
    }
}

async function handleAdminLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showErrorMessage('Por favor, completa todos los campos');
        return;
    }

    setLoading(true);
    showStatus('Verificando credenciales...', 'loading');

    try {
        // Verificar credenciales con Firebase
        const isValid = await validateAdminCredentials(username, password);

        if (isValid) {
            showStatus('Acceso autorizado', 'success');
            showSuccessMessage('¡Bienvenido Administrador! Redirigiendo...');

            // Guardar sesión de admin (en memoria)
            sessionStorage.setItem('userRole', 'admin');
            sessionStorage.setItem('username', username);

            setTimeout(() => {
                // Redirigir a la página de administración
                window.location.href = '../views/admin.html'; // o la URL de administración
            }, 1500);

        } else {
            showErrorMessage('Usuario o contraseña incorrectos');
            showStatus('Acceso denegado', 'error');
        }

    } catch (error) {
        console.error('Error en login de admin:', error);
        showErrorMessage('Error de conexión. Intenta nuevamente.');
        showStatus('Error de conexión', 'error');
    } finally {
        setLoading(false);
    }
}

async function validateAdminCredentials(username, password) {
    try {
        // Primero, verificar si existe la configuración
        const configRef = doc(db, 'config', 'admin-settings');
        const configSnap = await getDoc(configRef);

        if (!configSnap.exists()) {
            // Crear configuración inicial si no existe
            await createInitialAdminConfig();
        }

        // Obtener configuración actualizada
        const updatedConfigSnap = await getDoc(configRef);
        const config = updatedConfigSnap.data();

        // Validar credenciales
        return config.adminCredentials.username === username &&
            config.adminCredentials.password === password;

    } catch (error) {
        console.error('Error validando credenciales:', error);
        return false;
    }
}

function setLoading(loading) {
    isLoading = loading;
    loginBtn.disabled = loading;

    if (loading) {
        loginText.innerHTML = '<span class="loading"></span> Cargando...';
    } else {
        loginText.textContent = selectedUserType === 'admin' ?
            'Entrar como Administrador' : 'Entrar como Usuario';
    }
}

function showErrorMessage(message) {
    hideMessages();
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function showSuccessMessage(message) {
    hideMessages();
    successMessage.textContent = message;
    successMessage.style.display = 'block';
}

function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

function showStatus(message, type) {
    // Remover indicador anterior si existe
    const existingStatus = document.querySelector('.status-indicator');
    if (existingStatus) {
        existingStatus.remove();
    }

    // Crear nuevo indicador
    const statusEl = document.createElement('div');
    statusEl.className = `status-indicator status-${type}`;
    statusEl.textContent = message;
    document.body.appendChild(statusEl);

    // Auto-remover después de 3 segundos (excepto loading)
    if (type !== 'loading') {
        setTimeout(() => {
            if (statusEl.parentNode) {
                statusEl.style.opacity = '0';
                setTimeout(() => statusEl.remove(), 300);
            }
        }, 3000);
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sistema de login inicializado');

    // Verificar si ya hay una sesión activa
    const existingRole = sessionStorage.getItem('userRole');
    if (existingRole === 'admin') {
        showStatus('Sesión activa detectada', 'success');
        setTimeout(() => {
            window.location.href = 'admin-torneo.html';
        }, 1000);
    }
});