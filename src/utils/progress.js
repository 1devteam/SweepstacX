import cliProgress from 'cli-progress';
import pc from 'picocolors';

let progressBar = null;
let isQuiet = false;

/**
 * Initialize progress bar
 * @param {number} total - Total items
 * @param {string} label - Progress label
 */
export function startProgress(total, label = 'Processing') {
  if (isQuiet || total === 0) return;
  
  progressBar = new cliProgress.SingleBar({
    format: `${pc.cyan(label)} |${pc.cyan('{bar}')}| {percentage}% | {value}/{total} files`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });
  
  progressBar.start(total, 0);
}

/**
 * Update progress
 * @param {number} current - Current progress
 */
export function updateProgress(current) {
  if (progressBar) {
    progressBar.update(current);
  }
}

/**
 * Increment progress by 1
 */
export function incrementProgress() {
  if (progressBar) {
    progressBar.increment();
  }
}

/**
 * Stop progress bar
 */
export function stopProgress() {
  if (progressBar) {
    progressBar.stop();
    progressBar = null;
  }
}

/**
 * Set quiet mode (no progress bars)
 * @param {boolean} quiet - Whether to be quiet
 */
export function setQuiet(quiet) {
  isQuiet = quiet;
}

/**
 * Show a spinner for indeterminate operations
 * @param {string} message - Message to show
 * @returns {Object} - Spinner control object
 */
export function showSpinner(message) {
  if (isQuiet) {
    return {
      update: () => {},
      stop: () => {},
    };
  }
  
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let currentFrame = 0;
  let intervalId = null;
  
  const update = (newMessage) => {
    if (newMessage) message = newMessage;
    process.stdout.write(`\r${pc.cyan(frames[currentFrame])} ${message}`);
    currentFrame = (currentFrame + 1) % frames.length;
  };
  
  const stop = (finalMessage) => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    process.stdout.write('\r\x1b[K'); // Clear line
    if (finalMessage) {
      console.log(pc.green('✓'), finalMessage);
    }
  };
  
  intervalId = setInterval(update, 80);
  
  return { update, stop };
}
