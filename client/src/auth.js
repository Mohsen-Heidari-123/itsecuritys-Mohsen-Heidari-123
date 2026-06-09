import { getApiUrl } from './utils.js';

// [POINT 1] Token is no longer stored in localStorage.
// Instead we rely on httpOnly cookies set by the server.
// In-memory variable holds the token only for the current page session.
let inMemoryToken = null;

// [POINT 1] Session timeout: auto-logout after 15 minutes of inactivity
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
let sessionTimer = null;

function resetSessionTimer() {
    clearTimeout(sessionTimer);
    // [POINT 1] Schedule automatic logout on inactivity timeout
    sessionTimer = setTimeout(() => {
        handleLogout();
    }, SESSION_TIMEOUT_MS);
}

/*
export function setAuthToken(token) {
    localStorage.setItem('authToken', token);
}
*/
export function setAuthToken(token) {
    // [POINT 1] Store token in memory only — never in localStorage/sessionStorage
    inMemoryToken = token;
    resetSessionTimer(); // Reset session timer on login
}

/*
export function getAuthToken() {
    return localStorage.getItem('authToken');
}
*/
export function getAuthToken() {
    // [POINT 1] Return in-memory token instead of reading from localStorage
    return inMemoryToken;
}

/**
 export function removeAuthToken() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
}
 */
export function removeAuthToken() {
    // [POINT 1] Clear in-memory token and cancel session timer
    inMemoryToken = null;
    clearTimeout(sessionTimer); // Stop session timeout timer on logout

    // [POINT 4] Clear all sensitive session data on logout
    sessionStorage.removeItem('currentUser');
}

/**
export function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}
 */
export function setCurrentUser(user) {
    // [POINT 4] Store only minimal necessary user fields — not the full object
    const minimalUser = {
        id: user.id,
        username: user.username,
    };
    // [POINT 4] Use sessionStorage (tab-scoped) instead of localStorage
    sessionStorage.setItem('currentUser', JSON.stringify(minimalUser));
}

/**
export function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
} 
 */
export function getCurrentUser() {
    // [POINT 4] Read from sessionStorage instead of localStorage
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

/**
export function isAuthenticated() {
    return getAuthToken() !== null;
}
 */
export function isAuthenticated() {
    return inMemoryToken !== null;
}

export function initNavigation() {
    const navMenu = document.getElementById('nav-menu');
    const currentUser = getCurrentUser();
    const token = getAuthToken();

    if (token) {

        /**
         navMenu.innerHTML = `
            <span>Välkommen, ${currentUser?.username || 'Användare'}!</span>
            <a href="#/dashboard">Dashboard</a>
            <button id="logout-btn">Logga ut</button>
        `;
         */
        // [POINT 5] Sanitize username before injecting into innerHTML
        const safeUsername = sanitizeText(currentUser?.username || 'Användare');
        navMenu.innerHTML = `
            <span>Välkommen, ${safeUsername}!</span>
            <a href="#/dashboard">Dashboard</a>
            <button id="logout-btn">Logga ut</button>
        `;
        
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
    } else {
        navMenu.innerHTML = `
            <a href="#/login">Logga in</a>
            <a href="#/register">Registrera</a>
        `;
    }
}

/**
 export async function handleLogout() {
    removeAuthToken();
    window.location.hash = '/login';
}
 */
export async function handleLogout() {
    removeAuthToken();
    // [POINT 4] Ensure all session data is wiped on logout
    sessionStorage.clear(); // Clear any remaining session data
    window.location.hash = '/login';
}

// [POINT 5] Helper: escape text before inserting into HTML contexts
function sanitizeText(str) { // used in function initNavigation
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}