import Constants from 'expo-constants';
const configured=String(Constants.expoConfig?.extra?.privateGatherApiBase||'https://member.privategather.com/api/v1/native').replace(/\/$/,'');
export const API_BASE=configured;
export const LOGIN_URL=`${API_BASE}/login`;
export const RUNTIME_VERSION=String(Constants.expoConfig?.runtimeVersion||'pg-native-1');
export const APP_VERSION=String(Constants.expoConfig?.version||'1.1.199');
