import fs from 'node:fs';
import path from 'node:path';

const target=path.join(process.cwd(),'node_modules','react-native-callkeep','android','src','main','java','io','wazo','callkeep','RNCallKeepModule.java');
if(!fs.existsSync(target)){
  console.warn('[Private Gather] CallKeep source not found; skipping compatibility patch.');
  process.exit(0);
}
let source=fs.readFileSync(target,'utf8');
const before=source;
source=source.replace(/@ReactMethod\s+public void displayIncomingCall\(String uuid, String number, String callerName\)/g,'public void displayIncomingCall(String uuid, String number, String callerName)');
source=source.replace(/@ReactMethod\s+public void startCall\(String uuid, String number, String callerName\)/g,'public void startCall(String uuid, String number, String callerName)');
if(source!==before){
  fs.writeFileSync(target,source,'utf8');
  console.log('[Private Gather] Applied React Native 0.86 CallKeep overload compatibility patch.');
}else{
  console.log('[Private Gather] CallKeep compatibility patch already applied or not required.');
}
