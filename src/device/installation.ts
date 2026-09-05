import * as Keychain from 'react-native-keychain';
const SERVICE='privategather.native.installation';
function makeId(){return `pg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;}
export async function installationId(){const current=await Keychain.getGenericPassword({service:SERVICE});if(current)return current.password;const id=makeId();await Keychain.setGenericPassword('installation',id,{service:SERVICE});return id;}
