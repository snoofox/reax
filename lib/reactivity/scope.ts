export type Cleanup = () => void;
export type ErrorHandler = (err: unknown) => void;

let _activeCleanups: Cleanup[] | null = null;
let _activeErrorHandler: ErrorHandler | null = null;

export function getActiveCleanups(): Cleanup[] | null {
  return _activeCleanups;
}

export function setActiveCleanups(cleanups: Cleanup[] | null): void {
  _activeCleanups = cleanups;
}

export function registerCleanup(fn: Cleanup): void {
  if (_activeCleanups) _activeCleanups.push(fn);
}

export function getActiveErrorHandler(): ErrorHandler | null {
  return _activeErrorHandler;
}

export function setActiveErrorHandler(handler: ErrorHandler | null): void {
  _activeErrorHandler = handler;
}
