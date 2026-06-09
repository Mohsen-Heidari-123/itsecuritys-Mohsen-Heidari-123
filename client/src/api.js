import { getApiUrl, logError } from './utils.js';
import { getAuthToken } from './auth.js';

async function request(endpoint, options = {}) {
    const url = `${getApiUrl()}${endpoint}`;
    const token = getAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'same-origin', 
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `Error: ${response.status}`);
        }

        return data;
    } catch (error) {
        logError('API Request', error);
        throw error;
    }
}

export async function login(username, password) {
    return request('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
}

export async function register(username, password) {
    return request('/api/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
}

export async function getCurrentUser() {
    return request('/api/user?action=ME');
}

export async function searchUsers(searchQuery) {
    return request(`/api/user?action=SEARCH&search=${searchQuery}`);
}

export async function getMessages() {
    return request('/api/message');
}

export async function sendMessage(from, to, message) {
    return request('/api/message', {
        method: 'POST',
        body: JSON.stringify({ from, to, message }),
    });
}