import * as FileSystem from 'expo-file-system/legacy';
import { AppState } from 'react-native';

const LOG_FILE = `${FileSystem.documentDirectory}heartbeat.log`;
const HEARTBEAT_INTERVAL_MS = 5000;

async function appendLine(line: string) {
  const existing = await FileSystem.getInfoAsync(LOG_FILE);
  const timestamped = `${new Date().toISOString()} ${line}\n`;

  if (existing.exists) {
    const previous = await FileSystem.readAsStringAsync(LOG_FILE);
    await FileSystem.writeAsStringAsync(LOG_FILE, previous + timestamped);
  } else {
    await FileSystem.writeAsStringAsync(LOG_FILE, timestamped);
  }
}

export function startHeartbeatLogger() {
  appendLine('APP LAUNCHED');

  const interval = setInterval(() => {
    appendLine(`heartbeat, AppState=${AppState.currentState}`);
  }, HEARTBEAT_INTERVAL_MS);

  const subscription = AppState.addEventListener('change', (state) => {
    appendLine(`AppState changed to ${state}`);
  });

  return () => {
    clearInterval(interval);
    subscription.remove();
  };
}

export async function readHeartbeatLog(): Promise<string> {
  const existing = await FileSystem.getInfoAsync(LOG_FILE);
  if (!existing.exists) return '(no log file yet)';
  return FileSystem.readAsStringAsync(LOG_FILE);
}

export async function clearHeartbeatLog(): Promise<void> {
  const existing = await FileSystem.getInfoAsync(LOG_FILE);
  if (existing.exists) {
    await FileSystem.deleteAsync(LOG_FILE);
  }
}