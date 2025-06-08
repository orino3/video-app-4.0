import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  environment: process.env.NODE_ENV,
  
  // Filter out expected errors
  beforeSend(event, hint) {
    // Don't log auth errors as they're expected
    if (event.exception?.values?.[0]?.value?.includes('Invalid auth')) {
      return null;
    }
    return event;
  },
});