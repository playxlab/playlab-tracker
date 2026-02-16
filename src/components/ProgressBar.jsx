import React, { useEffect, useState } from 'react';

const ProgressBar = ({ duration = 1500 }) => {
    const [width, setWidth] = useState(0);

    useEffect(() => {
        // Start animation on mount
        const timer = setTimeout(() => setWidth(100), 50); // slight delay to ensure transition works
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden mt-4">
            <div
                className="h-full bg-blue-600 transition-all ease-linear"
                style={{
                    width: `${width}%`,
                    transitionDuration: `${duration}ms`
                }}
            />
        </div>
    );
};

export default ProgressBar;
