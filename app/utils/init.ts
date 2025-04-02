import { startScheduler } from './scheduler';

// Start the scheduler when the application initializes
if (process.env.NODE_ENV === 'production') {
  startScheduler();
} 