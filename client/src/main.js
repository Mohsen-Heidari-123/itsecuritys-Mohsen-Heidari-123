import { initNavigation, handleLogout } from './auth.js';
import { renderLoginPage } from './login.js';
import { renderRegisterPage } from './register.js';
import { renderDashboard } from './dashboard.js';

var thnw = handleLogout;

function handleRoute() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    const pageContainer = document.getElementById('page-container');

    switch (hash) {
        case '/login':
            renderLoginPage(pageContainer);
            break;
        case '/register':
            renderRegisterPage(pageContainer);
            break;
        case '/dashboard':
            renderDashboard(pageContainer);
            break;
        default:
            pageContainer.innerHTML = `
                <div class="not-found">
                    <h2>404</h2>
                    <p>Sidan hittades inte</p>
                    <a href="#/dashboard">Gå till dashboard</a>
                </div>
            `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    handleRoute();
});

window.addEventListener('hashchange', () => {
    handleRoute();
    initNavigation();
});
