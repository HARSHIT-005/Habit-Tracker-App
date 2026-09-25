let accessToken = localStorage.getItem('access_token');

export function setAccessToken(token) {
    accessToken = token;
    if (token) {
        localStorage.setItem('access_token', token);
    } else {
        localStorage.removeItem('access_token');
    }
}

async function refreshAccessToken() {
    const response = await fetch('/refresh', {
        method: 'POST',
        credentials: 'same-origin'
    });

    if (!response.ok) {
        setAccessToken(null);
        return false;
    }

    const data = await response.json();
    setAccessToken(data.access_token);
    return true;
}

export async function apiFetch(url, options = {}, hasRetried = false) {
    const headers = new Headers(options.headers || {});
    if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin'
    });

    if (response.status === 401 && !hasRetried && await refreshAccessToken()) {
        return apiFetch(url, options, true);
    }

    return response;
}

export async function logout() {
    await fetch('/logout', {
        method: 'POST',
        credentials: 'same-origin'
    });
    setAccessToken(null);
}
