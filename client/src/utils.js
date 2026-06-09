//export const API_BASE_URL = 'https://localhost:8443';
export const API_BASE_URL = 'http://localhost:8080';

export function getApiUrl() {
    return API_BASE_URL;
}

// [POINT 5] Sanitize HTML by escaping all user-supplied strings before DOM insertion
export function sanitizeHtml(input) {
    if (typeof input !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

export function logError(context, error) {
    // [POINT 4] Strip sensitive detail from error messages logged to console
    const safeMessage = error?.message || 'Unknown error';
    console.error(`[${context}]`, safeMessage);
}

export function setupSecurityHeaders() {

}

// [POINT 5] Validate input length against a given maximum
export function validateLength(value, max) {
    return typeof value === 'string' && value.length > 0 && value.length <= max;
}