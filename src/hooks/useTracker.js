import { useState, useEffect } from 'react';
import { fetchDeliveryData } from '../services/sheet';
import { fetchFromSupabase } from '../services/tracker';

/**
 * Match a parsed sheet row by (email, campaign).
 * Sheet header keys are case-insensitive ('Email', 'Campaign_ID', etc.) so we
 * resolve them per row. Returns the matched row plus the resolved keys so the
 * caller can read tracking_number without redoing the search.
 */
export const matchSheetRow = (data, targetEmail, targetCampaign) => {
    if (!Array.isArray(data) || !targetEmail) return null;

    for (const row of data) {
        const keys = Object.keys(row);
        const emailKey = keys.find((k) => k.toLowerCase() === 'email');
        const campaignKey = keys.find((k) =>
            k.replace(/_/g, '').toLowerCase().includes('campaign'),
        );
        const trackingKey = keys.find(
            (k) => k.toLowerCase().includes('tracking') || k.toLowerCase().includes('운송장'),
        );

        const rowEmail = emailKey ? String(row[emailKey] ?? '').trim().toLowerCase() : '';
        const rowCampaign = campaignKey ? String(row[campaignKey] ?? '').trim().toLowerCase() : '';

        if (rowEmail !== targetEmail) continue;

        if (targetCampaign && rowCampaign !== targetCampaign) continue;

        const trackingNo = trackingKey ? row[trackingKey] : null;
        if (!trackingNo) continue;

        return {
            row,
            trackingNo,
            campaignId: campaignKey ? row[campaignKey] : null,
        };
    }

    return null;
};

export const useDeliveryTracker = () => {
    const [status, setStatus] = useState('IDLE'); // IDLE, LOADING, SUCCESS, ERROR
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [error, setError] = useState(null);
    const [campaign, setCampaign] = useState(null);

    useEffect(() => {
        const init = async () => {
            const params = new URLSearchParams(window.location.search);
            const emailParam = params.get('email');
            const campaignParam = params.get('campaign');

            if (!emailParam) {
                setStatus('IDLE');
                return;
            }

            if (campaignParam) setCampaign(campaignParam);
            setStatus('LOADING');

            const targetEmail = emailParam.trim().toLowerCase();
            const targetCampaign = campaignParam ? campaignParam.trim().toLowerCase() : null;

            // 1) Google Sheet — 1순위 (기존 데이터 호환)
            let sheetMatch = null;
            let sheetData = null;
            try {
                sheetData = await fetchDeliveryData();
                sheetMatch = matchSheetRow(sheetData, targetEmail, targetCampaign);
            } catch (err) {
                console.warn('[tracker] sheet lookup failed, falling back to supabase:', err);
            }

            if (sheetMatch) {
                setTrackingInfo({
                    ...sheetMatch.row,
                    trackingNo: sheetMatch.trackingNo,
                    campaignId: sheetMatch.campaignId,
                });
                setStatus('SUCCESS');
                return;
            }

            // 2) Supabase — fallback (campaignParam이 UUID일 때만 의미 있음)
            const supabaseResult = await fetchFromSupabase(emailParam.trim(), campaignParam);
            if (supabaseResult.found) {
                setTrackingInfo({
                    Name: supabaseResult.creatorName,
                    trackingNo: supabaseResult.trackingNo,
                    campaignId: supabaseResult.campaignId,
                });
                setStatus('SUCCESS');
                return;
            }

            // 3) 둘 다 실패 → ERROR 메시지 결정
            const emailExistsInSheet =
                sheetData?.some((row) => {
                    const keys = Object.keys(row);
                    const emailKey = keys.find((k) => k.toLowerCase() === 'email');
                    return emailKey && String(row[emailKey] ?? '').trim().toLowerCase() === targetEmail;
                }) ?? false;

            if (emailExistsInSheet && targetCampaign) {
                setError(`No shipping history found for campaign '${targetCampaign}'`);
            } else {
                setError('No shipping history found');
            }
            setStatus('ERROR');
        };

        init();
    }, []);

    return { status, trackingInfo, error, campaign };
};
