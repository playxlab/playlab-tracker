import Papa from 'papaparse';

const GOOGLE_SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL;

export const fetchDeliveryData = async () => {
    // Mock check removed. Using configured URL.
    if (!GOOGLE_SHEET_URL) {
        console.error("VITE_GOOGLE_SHEET_URL is not defined in .env");
        return Promise.reject("Configuration Error");
    }

    return new Promise((resolve, reject) => {
        Papa.parse(GOOGLE_SHEET_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(), // Trim headers
            complete: (results) => {
                resolve(results.data);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};
