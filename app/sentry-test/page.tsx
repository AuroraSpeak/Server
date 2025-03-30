"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  const throwError = () => {
    throw new Error("Ein Test-Fehler wurde ausgelöst!");
  };

  const throwAsyncError = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    throw new Error("Ein asynchroner Test-Fehler wurde ausgelöst!");
  };

  const captureMessage = () => {
    Sentry.captureMessage("Eine Test-Nachricht wurde gesendet", "info");
  };

  const captureException = () => {
    try {
      throw new Error("Eine Exception wurde gefangen");
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8">Sentry Test-Seite</h1>
      
      <div className="space-y-4">
        <button
          onClick={throwError}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Synchronen Fehler auslösen
        </button>

        <button
          onClick={throwAsyncError}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors ml-4"
        >
          Asynchronen Fehler auslösen
        </button>

        <button
          onClick={captureMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ml-4"
        >
          Test-Nachricht senden
        </button>

        <button
          onClick={captureException}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors ml-4"
        >
          Exception fangen und senden
        </button>
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <p>Öffnen Sie die Sentry Issues-Seite:</p>
        <a 
          href="http://localhost:8000/organizations/auraspeak/issues/?project=1"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Sentry Dashboard öffnen
        </a>
      </div>
    </div>
  );
} 