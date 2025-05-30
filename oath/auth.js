// auth.js - Sistema de autenticación mejorado
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyA2BRSLAelEa5qPdHqqjkKNtU3bgal7h_c",
    authDomain: "torneodwh.firebaseapp.com",
    projectId: "torneodwh",
    storageBucket: "torneodwh.firebasestorage.app",
    messagingSenderId: "336157608486",
    appId: "1:336157608486:web:eb32c2c5852a12ba6534e7",
    measurementId: "G-1PZNK22XQ1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Clase para manejar autenticación y tokens
class AuthManager {
    constructor() {
        this.sessionKey = 'torneo_session';
        this.tokenKey = 'auth_token';
    }

    // Generar token único para la sesión
    generateToken() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const token = btoa(`${timestamp}-${random}`).replace(/[+/=]/g, '');
        return token;
    }

    // Validar token
    validateToken(token) {
        try {
            const decoded = atob(token);
            const [timestamp] = decoded.split('-');
            const now = Date.now();
            const tokenAge = now - parseInt(timestamp);
            
            // Token válido por 24 horas (86400000 ms)
            return tokenAge < 86400000;
        } catch {
            return false;
        }
    }

    // Crear sesión de administrador
    createAdminSession(username) {
        const token = this.generateToken();
        const sessionData = {
            role: 'admin',
            username: username,
            token: token,
            timestamp: Date.now(),
            expires: Date.now() + 86400000 // 24 horas
        };

        sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
        localStorage.setItem(this.tokenKey, token); // Token persistente
        
        return token;
    }

    // Crear sesión de usuario
    createUserSession() {
        const sessionData = {
            role: 'user',
            timestamp: Date.now()
        };

        sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
    }

    // Verificar sesión activa
    isValidSession() {
        try {
            const sessionData = sessionStorage.getItem(this.sessionKey);
            if (!sessionData) return false;

            const session = JSON.parse(sessionData);
            
            // Verificar expiración
            if (session.expires && Date.now() > session.expires) {
                this.clearSession();
                return false;
            }

            // Para admin, verificar token adicional
            if (session.role === 'admin') {
                const storedToken = localStorage.getItem(this.tokenKey);
                return storedToken && this.validateToken(storedToken) && storedToken === session.token;
            }

            return true;
        } catch {
            return false;
        }
    }

    // Obtener rol del usuario
    getUserRole() {
        try {
            const sessionData = sessionStorage.getItem(this.sessionKey);
            if (!sessionData) return null;
            
            const session = JSON.parse(sessionData);
            return this.isValidSession() ? session.role : null;
        } catch {
            return null;
        }
    }

    // Limpiar sesión
    clearSession() {
        sessionStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.tokenKey);
    }

    // Verificar acceso a página de admin
    requireAdminAccess() {
        const role = this.getUserRole();
        if (role !== 'admin') {
            alert('Acceso denegado. Redirigiendo al login.');
            window.location.href = '../index.html';
            return false;
        }
        return true;
    }

    // Verificar cualquier acceso autenticado
    requireAuth() {
        if (!this.isValidSession()) {
            alert('Sesión expirada. Redirigiendo al login.');
            window.location.href = '../index.html';
            return false;
        }
        return true;
    }
}

// Instancia global del manejador de autenticación
const authManager = new AuthManager();

// Variables globales del sistema de login
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
userBtn?.addEventListener('click', () => selectUserType('user'));
adminBtn?.addEventListener('click', () => selectUserType('admin'));
loginBtn?.addEventListener('click', handleLogin);

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
            authManager.createUserSession();
            showSuccessMessage('¡Bienvenido! Redirigiendo...');
            setTimeout(() => {
                window.location.href = '../views/users.html';
            }, 1500);
        }, 1000);

    } else if (selectedUserType === 'admin') {
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
        const isValid = await validateAdminCredentials(username, password);

        if (isValid) {
            // Crear sesión segura con token
            const token = authManager.createAdminSession(username);
            
            showStatus('Acceso autorizado', 'success');
            showSuccessMessage('¡Bienvenido Administrador! Redirigiendo...');

            setTimeout(() => {
                // Redirigir con parámetro de token (opcional, como verificación adicional)
                window.location.href = `../views/admin.html?t=${token}`;
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
        const configRef = doc(db, 'config', 'admin-settings');
        const configSnap = await getDoc(configRef);

        if (!configSnap.exists()) {
            await createInitialAdminConfig();
        }

        const updatedConfigSnap = await getDoc(configRef);
        const config = updatedConfigSnap.data();

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

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sistema de login inicializado');

    // Verificar sesión activa
    if (authManager.isValidSession()) {
        const role = authManager.getUserRole();
        if (role === 'admin') {
            showStatus('Sesión activa detectada', 'success');
            setTimeout(() => {
                window.location.href = '../views/admin.html';
            }, 1000);
        }
    }
});

// Exportar para uso en otras páginas
window.authManager = authManager;