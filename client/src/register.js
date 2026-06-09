import { register } from './api.js';
import { logError, validateLength } from './utils.js';

// [POINT 5] Input length limits
const MAX_USERNAME_LENGTH = 50;
const MAX_PASSWORD_LENGTH = 128;

export function renderRegisterPage(container) {
    container.innerHTML = `
        <div class="auth-page">
            <h2>Registrera nytt konto</h2>
            <div id="register-error" class="error-message" style="display: none;"></div>
            <div id="register-success" class="success-message" style="display: none;"></div>
            <form id="register-form">
                <div class="form-group">
                    <label for="register-username">Användarnamn</label>
                    <input 
                        type="text" 
                        id="register-username" 
                        name="username" 
                        required 
                        minlength="3"
                        maxlength="${MAX_USERNAME_LENGTH}"
                        autocomplete="username"
                    >
                </div>
                <div class="form-group">
                    <label for="register-password">Lösenord</label>
                    <input 
                        type="password" 
                        id="register-password" 
                        name="password" 
                        required 
                        minlength="8"
                        maxlength="${MAX_PASSWORD_LENGTH}"
                        autocomplete="new-password"
                    >
                    <small style="color: #666;">Minst 8 tecken</small>
                </div>
                <div class="form-group">
                    <label for="register-confirm-password">Bekräfta lösenord</label>
                    <input 
                        type="password" 
                        id="register-confirm-password" 
                        name="confirmPassword" 
                        required 
                        maxlength="${MAX_PASSWORD_LENGTH}"
                        autocomplete="new-password"
                    >
                </div>
                <button type="submit" class="btn btn-primary">Registrera</button>
            </form>
            <div class="auth-link">
                <p>Redan har ett konto? <a href="#/login">Logga in</a></p>
            </div>
        </div>
    `;

    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

async function handleRegister(event) {
    event.preventDefault();

    const usernameInput = document.getElementById('register-username');
    const passwordInput = document.getElementById('register-password');
    const confirmPasswordInput = document.getElementById('register-confirm-password');
    const errorDiv = document.getElementById('register-error');
    const successDiv = document.getElementById('register-success');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // [POINT 5] Validate and enforce length limits before submission
    if (!validateLength(username, MAX_USERNAME_LENGTH) || username.length < 3) {
        showError(errorDiv, `Användarnamn måste vara 3–${MAX_USERNAME_LENGTH} tecken långt`);
        return;
    }

    // [POINT 5] Validate username — only allow alphanumeric and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showError(errorDiv, 'Användarnamn får bara innehålla bokstäver, siffror och understreck');
        return;
    }

    if (password.length < 8) {
        showError(errorDiv, 'Lösenord måste vara minst 8 tecken långt');
        return;
    }

    // [POINT 5] Enforce max password length
    if (!validateLength(password, MAX_PASSWORD_LENGTH)) {
        showError(errorDiv, `Lösenordet är för långt (max ${MAX_PASSWORD_LENGTH} tecken)`);
        return;
    }

    if (password !== confirmPassword) {
        showError(errorDiv, 'Lösenorden matchar inte');
        return;
    }

    try {
        const response = await register(username, password);

        if (response.status === 'SUCCESS') {
            showSuccess(successDiv, 'Konto skapat! Du kan nu logga in.');
            setTimeout(() => {
                window.location.hash = '/login';
            }, 2000);
        } else {
            showError(errorDiv, response.message || 'Registration misslyckades');
        }
    } catch (error) {
        showError(errorDiv, 'Något gick fel. Försök igen.');
        logError('Register', error);
    }
}

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    element.parentElement.querySelector('.success-message').style.display = 'none';
}

function showSuccess(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    element.parentElement.querySelector('.error-message').style.display = 'none';
}