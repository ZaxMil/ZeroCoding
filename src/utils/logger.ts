// Production-safe logging utility with error tracking
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors to console, even in production
    console.error(...args);
    
    // Track error in analytics if available
    if (typeof window !== 'undefined' && (window as any).trackError) {
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      (window as any).trackError(
        'application_error',
        errorMessage,
        new Error().stack
      );
    }
  },
  warn: (...args: any[]) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (!isProduction) {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (!isProduction) {
      console.debug(...args);
    }
  }
};

// Remove all console.log statements in production
if (isProduction) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}