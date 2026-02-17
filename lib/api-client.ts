export async function apiCall<T>(
    url: string,
    options?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string }> {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            credentials: 'include',
            cache: 'no-store',
        });

        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            return { ok: false, error: `Failed to parse response: ${response.statusText}` };
        }

        if (data.success !== undefined) {
            return {
                ok: data.success,
                data: data.success ? data.data || data : undefined,
                error: data.error
            };
        }

        if (response.ok) {
            return { ok: true, data, error: undefined };
        } else {
            return { ok: false, data: undefined, error: data.error || data.message || 'Request failed' };
        }
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'Network error'
        };
    }
}
