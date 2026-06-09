import { getMessages, sendMessage, searchUsers } from './api.js';
import { getCurrentUser, isAuthenticated } from './auth.js';
import { logError, sanitizeHtml, validateLength } from './utils.js';

// [POINT 5] Max length for a message
const MAX_MESSAGE_LENGTH = 1000; // Define a reasonable max length for messages to prevent abuse
const MAX_SEARCH_LENGTH = 50; // Max length for user search input to prevent abuse

let selectedUserId = null;
let selectedUserName = null;

export async function renderDashboard(container) {
    if (!isAuthenticated()) {
        window.location.hash = '/login';
        return;
    }

    const currentUser = getCurrentUser();

    container.innerHTML = `
        <div class="dashboard">
            <div class="card">
                <h3>Hitta användare</h3>
                <div class="search-bar">
                    <input type="text" id="user-search" placeholder="Sök användare..." autocomplete="off" maxlength="${MAX_SEARCH_LENGTH}">
                    <button id="search-btn" class="btn btn-secondary">Sök</button>
                </div>
                <div id="user-results" class="user-list"></div>
            </div>
            
            <div class="card">
                <h3>Skicka meddelande</h3>
                <div id="selected-user-info" style="margin-bottom: 1rem; color: #666;">
                    Välj en användare för att skicka meddelande
                </div>
                <form id="send-message-form" class="send-message-form">
                    <textarea 
                        id="message-text" 
                        placeholder="Skriv ditt meddelande här..."
                        required
                        maxlength="${MAX_MESSAGE_LENGTH}"
                    ></textarea>
                    <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;" id="send-btn" disabled>
                        Skicka
                    </button>
                </form>
            </div>
            
            <div class="card full-width">
                <h3>Dina meddelanden</h3>
                <div id="loading-messages" class="loading">Laddar meddelanden...</div>
                <div id="message-list" class="message-list"></div>
            </div>
        </div>
    `;

    document.getElementById('search-btn').addEventListener('click', handleUserSearch);
    
    let searchTimeout;
    document.getElementById('user-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleUserSearch, 500);
    });

    document.getElementById('send-message-form').addEventListener('submit', handleSendMessage);

    await loadMessages();
}

async function handleUserSearch() {
    const searchInput = document.getElementById('user-search');
    const resultsDiv = document.getElementById('user-results');
    const searchTerm = searchInput.value.trim();

    if (searchTerm.length < 1) {
        resultsDiv.innerHTML = '<p style="color: #666;">Skriv minst 1 tecken för att söka</p>';
        return;
    }

    // [POINT 5] Enforce max length on search input
    if (!validateLength(searchTerm, MAX_SEARCH_LENGTH)) { // added 
        resultsDiv.innerHTML = '<p style="color: #e74c3c;">Söktermen är för lång.</p>';
        return;
    }

    resultsDiv.innerHTML = '<div class="loading" style="padding: 1rem;">Söker...</div>';

    try {
        const response = await searchUsers(searchTerm);

        if (response.users && response.users.length > 0) {
            // [POINT 4] Only display id and username — ignore any extra fields returned by API
            // [POINT 5] Sanitize username before inserting into HTML
            resultsDiv.innerHTML = response.users.map(user => {
                const safeUsername = sanitizeHtml(user.username); // from utils.js
                const userId = parseInt(user.id, 10);
                return `
                    <div class="user-item">
                        <span>${safeUsername}</span>
                        <button class="btn btn-secondary"
                                data-user-id="${userId}"
                                data-username="${safeUsername}">
                            Välj
                        </button>
                    </div>
                `;

                /**
                  resultsDiv.innerHTML = response.users.map(user => `
                    <div class="user-item">
                        <span>${user.username}</span>
                        <button class="btn btn-secondary"
                                onclick="selectUser(${user.id}, '${user.username}')">
                            Välj
                        </button>
                    </div>
                    `).join('');
                 */
            }).join('');

            // [POINT 5] Use event delegation instead of inline onclick to avoid injection via username
            resultsDiv.querySelectorAll('button[data-user-id]').forEach(btn => {
                btn.addEventListener('click', () => {
                    selectUser(btn.dataset.userId, btn.dataset.username);
                });
            });
        } else {
            resultsDiv.innerHTML = '<p style="color: #666;">Inga användare hittades</p>';
        }
    } catch (error) {
        resultsDiv.innerHTML = '<p style="color: #e74c3c;">Sökning misslyckades. Försök igen.</p>';
        logError('User Search', error);
    }
}

// [POINT 5] selectUser is no longer exposed on window — called via event listeners only
function selectUser(userId, username) {
    selectedUserId = userId;
    selectedUserName = username;
    
    const infoDiv = document.getElementById('selected-user-info');
    const sendBtn = document.getElementById('send-btn');
    
    // [POINT 5] username is already sanitized before reaching here
    infoDiv.innerHTML = `Skickar till: <strong>${username}</strong>`;
    sendBtn.disabled = false;
    
    document.getElementById('message-text').focus();
}

/**
 window.selectUser = function(userId, username) {
    selectedUserId = userId;
    selectedUserName = username;
    
    const infoDiv = document.getElementById('selected-user-info');
    const sendBtn = document.getElementById('send-btn');
    
    infoDiv.innerHTML = `Skickar till: <strong>${username}</strong>`;
    sendBtn.disabled = false;
    
    document.getElementById('message-text').focus();
};
 */

async function handleSendMessage(event) {
    event.preventDefault();

    const messageInput = document.getElementById('message-text');
    const sendBtn = document.getElementById('send-btn');
    const currentUser = getCurrentUser();

    if (!selectedUserId) {
        alert('Vänligen välj en mottagare först.');
        return;
    }

    const messageText = messageInput.value.trim();

    if (messageText.length === 0) {
        return;
    }

    // [POINT 5] Validate message length before sending
    if (!validateLength(messageText, MAX_MESSAGE_LENGTH)) {
        alert(`Meddelandet är för långt (max ${MAX_MESSAGE_LENGTH} tecken).`);
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Skickar...';

    try {
        const response = await sendMessage(currentUser.id, selectedUserId, messageText);

        if (response.status === 'SUCCESS') {
            messageInput.value = '';
            await loadMessages();
        } else {
            alert(response.message || 'Meddelandet kunde inte skickas.');
        }
    } catch (error) {
        alert('Ett fel uppstod vid skickandet av meddelandet.');
        logError('Send Message', error);
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Skicka';
    }
}

async function loadMessages() {
    const loadingDiv = document.getElementById('loading-messages');
    const messageListDiv = document.getElementById('message-list');
    const currentUser = getCurrentUser();

    try {
        const response = await getMessages();

        loadingDiv.style.display = 'none';

        if (!response.messages || response.messages.length === 0) {
            messageListDiv.innerHTML = '<p style="color: #666; text-align: center; padding: 1rem;">Inga meddelanden än.</p>';
            return;
        }

        messageListDiv.innerHTML = response.messages.map(msg => {
            const isOwnMessage = msg.from === currentUser.id;
            // [POINT 4] Use only necessary fields: from, fromUsername, message
            const senderName = isOwnMessage ? 'Du' : msg.fromUsername;

            // [POINT 5] Sanitize all message content and sender name before rendering
            const safeSender = sanitizeHtml(senderName);
            const safeMessage = sanitizeHtml(msg.message);
            
            return `
                <div class="message-item" style="${isOwnMessage ? 'border-left-color: #2ecc71;' : ''}">
                    <div class="sender">${safeSender} ${isOwnMessage ? '(du)' : ''}</div>
                    <div class="text">${safeMessage}</div>
                </div>
            `;
        }).reverse().join('');

    } catch (error) {
        loadingDiv.style.display = 'none';
        messageListDiv.innerHTML = '<p style="color: #e74c3c; text-align: center;">Kunde inte ladda meddelanden.</p>';
        logError('Load Messages', error);
    }
}