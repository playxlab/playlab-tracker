import { useState, useEffect } from 'react';
import { fetchDeliveryData } from '../services/sheet';

export const useDeliveryTracker = () => {
    const [status, setStatus] = useState('IDLE'); // IDLE, LOADING, SUCCESS, ERROR
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [error, setError] = useState(null);
    const [campaign, setCampaign] = useState(null);

    useEffect(() => {
        const init = async () => {
            // 1. URL Parameter Extraction
            const params = new URLSearchParams(window.location.search);
            const emailParam = params.get('email');
            const campaignParam = params.get('campaign');

            if (!emailParam) {
                setStatus('IDLE');
                return;
            }

            if (campaignParam) {
                setCampaign(campaignParam);
            }

            setStatus('LOADING');

            // 2. Data Fetching
            try {
                const data = await fetchDeliveryData();

                if (!data || data.length === 0) {
                    throw new Error("No data received from Google Sheets.");
                }

                // 3. Matching Logic
                const targetEmail = emailParam.trim().toLowerCase();
                const targetCampaign = campaignParam ? campaignParam.trim().toLowerCase() : null;

                const matched = data.find(row => {
                    // Match Email
                    // Keys handling: Find key 'Email' and 'Campaign_ID' case-insensitively
                    const keys = Object.keys(row);
                    const emailKey = keys.find(k => k.toLowerCase() === 'email');
                    const campaignKey = keys.find(k => k.replace(/_/g, '').toLowerCase().includes('campaign')); // Campaign_ID or CampaignID

                    const rowEmail = emailKey ? row[emailKey] : '';
                    const rowCampaign = campaignKey ? row[campaignKey] : '';

                    const emailMatch = rowEmail && rowEmail.trim().toLowerCase() === targetEmail;

                    // If targetCampaign is provided, check it. If not, maybe we should still require it?
                    // PRD Update says: "URL parameters ... read both ... Match Email AND Campaign_ID"
                    // If URL param has campaign, we must match it.
                    // If URL param doesn't have campaign? The request implies we added a feature for multi-campaign.
                    // Let's assume if campaign is missing in URL, we strictly can't distinguish if user is in multiple campaigns.
                    // But for backward compatibility or simple logic:
                    // If Campaign param exists, match it. If not, maybe just match Email (or fail?).
                    // Let's strictly follow requirement: "Match [Email] and [Campaign_ID]".

                    if (targetCampaign) {
                        const campaignMatch = rowCampaign && rowCampaign.trim().toLowerCase() === targetCampaign;
                        return emailMatch && campaignMatch;
                    }

                    // If no campaign param, fallback to just email?
                    // User Request: "Must match both".
                    // However, if user forgets ?campaign=..., we should probably tell them "Campaign info missing" or just fail to find specific row if duplicates exist.
                    // Let's return emailMatch only if no campaign param is present (Legacy support), 
                    // BUT the requirement implies new standard. 
                    // Let's stick to: if param exists, match it.
                    return emailMatch;
                });

                if (matched) {
                    // Check Campaign mismatch specifically if email matched but row didn't (Complex without filter).
                    // Simplification: We found a match?

                    const keys = Object.keys(matched);
                    const trackingKey = keys.find(k => k.toLowerCase().includes('tracking') || k.toLowerCase().includes('운송장'));
                    const campaignKey = keys.find(k => k.replace(/_/g, '').toLowerCase().includes('campaign'));

                    if (trackingKey && matched[trackingKey]) {
                        setTrackingInfo({
                            ...matched,
                            trackingNo: matched[trackingKey],
                            campaignId: campaignKey ? matched[campaignKey] : null
                        });
                        setStatus('SUCCESS');
                    } else {
                        setError("Tracking number not found in the record.");
                        setStatus('ERROR');
                    }
                } else {
                    // Specific error message logic
                    // If we didn't find a match, check if email exists at all?
                    const emailExists = data.some(row => {
                        const keys = Object.keys(row);
                        const emailKey = keys.find(k => k.toLowerCase() === 'email');
                        return row[emailKey] && row[emailKey].trim().toLowerCase() === targetEmail;
                    });

                    if (emailExists && targetCampaign) {
                        setError(`No shipping history found for campaign '${targetCampaign}'`);
                    } else {
                        setError("No shipping history found");
                    }
                    setStatus('ERROR');
                }

            } catch (err) {
                console.error(err);
                setError("An error occurred while loading data.");
                setStatus('ERROR');
            }
        };

        init();
    }, []);

    return { status, trackingInfo, error, campaign };
};
