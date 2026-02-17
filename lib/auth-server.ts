
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation'; // Only works in Server Components or Server Actions
import { verifyAccessToken } from '@/lib/auth';

export async function getSession() {
    const cookieStore = await cookies(); // await cookies() for Next.js 15+ compat if needed, though 14 uses sync usually. standard is await now or soon. In Next 14 it's sync but can be awaited. Let's stick to standard usage.
    const accessToken = cookieStore.get('access-token')?.value;
    const refreshToken = cookieStore.get('refresh-token')?.value;

    verifyTokenOrRedirect(accessToken, refreshToken);

    // If we pass validation, we extract userId
    // verifyTokenOrRedirect handles the redirect if both are missing/invalid logic for basic protection

    let userId: string | undefined;

    if (accessToken) {
        const payload = verifyAccessToken(accessToken);
        if (payload) {
            userId = payload.userId;
        }
    }

    // If no accessToken but we had refreshToken, middleware should have handled rotation
    // But inside a Page, if we don't have userId yet, we can't really proceed.
    if (!userId) {
        redirect('/auth/login');
    }

    return { userId };
}

function verifyTokenOrRedirect(accessToken?: string, refreshToken?: string) {
    if (!accessToken && !refreshToken) {
        redirect('/auth/login');
    }
}
