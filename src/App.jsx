import React, { useEffect } from 'react';
import { useDeliveryTracker } from './hooks/useTracker';
import ProgressBar from './components/ProgressBar';

function App() {
  const { status, trackingInfo, error, campaign } = useDeliveryTracker();

  useEffect(() => {
    if (status === 'SUCCESS' && trackingInfo?.trackingNo) {
      const timer = setTimeout(() => {
        // Redirection
        window.location.href = `https://t.17track.net/en#nums=${trackingInfo.trackingNo}`;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, trackingInfo]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">
      <main className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">
            PlayLab Tracker
          </h1>
        </header>

        <div className="min-h-[200px] flex flex-col justify-center items-center text-center">
          {status === 'IDLE' && (
            <div className="text-gray-500 dark:text-gray-400">
              <p className="mb-4">No email parameter detected.</p>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-mono break-all">
                https://tracker.playlab.com/?email=your@email.com&campaign=C001
              </div>
            </div>
          )}

          {status === 'LOADING' && (
            <div className="flex flex-col items-center animate-pulse space-y-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full mb-2"></div>
              {campaign && (
                <div className="text-sm text-blue-500 font-medium mb-1">
                  Target Campaign: {campaign}
                </div>
              )}
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          )}

          {status === 'SUCCESS' && trackingInfo && (
            <div className="w-full animate-fade-in">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-3xl">
                  📦
                </div>
              </div>

              {trackingInfo.campaignId && (
                <div className="mb-2 text-xs font-bold text-indigo-500 uppercase tracking-wide border border-indigo-200 dark:border-indigo-800 inline-block px-2 py-0.5 rounded-full">
                  {trackingInfo.campaignId}
                </div>
              )}

              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Tracking Found
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Retrieving shipping info for <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {trackingInfo.Name || 'User'}
                </span>.
              </p>

              <ProgressBar duration={1500} />

              <p className="text-xs text-gray-400 mt-6">
                If not redirected automatically, click <a href={`https://t.17track.net/en#nums=${trackingInfo.trackingNo}`} className="underline hover:text-blue-500">here</a>.
              </p>
            </div>
          )}

          {status === 'ERROR' && (
            <div className="space-y-4 animate-bounce-short">
              <div className="mb-4 flex justify-center">
                {/* Placeholder for Logo - User to place file at /logo.png */}
                <img src={`/logo.png?t=${Date.now()}`} alt="PlayLab Logo" className="h-20 w-auto object-contain mb-4" onError={(e) => { console.error('Image Load Failed'); e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
                <div className="hidden text-5xl">⚠️</div>
              </div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                No shipping history found
              </h2>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500 dark:text-red-400 font-medium text-sm">
                {error}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                If you think this is an error, please contact <a href="mailto:team@creator.playxlab.com" className="underline hover:text-blue-500">team@creator.playxlab.com</a>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
