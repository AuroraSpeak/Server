import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "http://75499a7326cc4ae3bdfefd7f7185d16d@localhost:8000/1",

  // Add optional integrations for additional features
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Define how likely Replay events are sampled.
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 1.0,

  // Enable environment tracking
  environment: process.env.NODE_ENV,

  // Configure CORS and allowed origins
  allowUrls: [
    /^https:\/\/auraspeak\.com/,
    /^http:\/\/localhost/,
  ],

  // Filter out blocked requests
  beforeSend(event) {
    if (event.exception?.values?.[0]?.value?.includes('ERR_BLOCKED_BY_CLIENT')) {
      return null;
    }
    return event;
  },
}); 