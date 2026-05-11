// Calls PL-Frontend's /api/v2/tracker/lookup as the fallback source after
// the Google Sheet lookup misses. The Sheet stays the 1st-priority source so
// existing campaigns keep working untouched while new campaigns gradually
// flow through Supabase via the campaign CSV upload.

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const fetchFromSupabase = async (email, campaign) => {
    if (!API_BASE) {
        return { found: false, reason: 'no_api_configured' };
    }
    if (!email || !campaign) {
        return { found: false, reason: 'missing_params' };
    }

    const url = `${API_BASE.replace(/\/$/, '')}/api/v2/tracker/lookup?email=${encodeURIComponent(email)}&campaign=${encodeURIComponent(campaign)}`;

    try {
        const res = await fetch(url, { method: 'GET' });

        if (res.ok) {
            const data = await res.json();
            return {
                found: true,
                trackingNo: data.tracking_number,
                campaignId: data.campaign_id,
                creatorName: data.creator?.nickname ?? null,
            };
        }

        const body = await res.json().catch(() => ({}));
        return { found: false, reason: body.reason || `http_${res.status}` };
    } catch (err) {
        console.error('[tracker] supabase lookup failed:', err);
        return { found: false, reason: 'network_error' };
    }
};
