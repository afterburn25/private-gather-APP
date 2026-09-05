from pathlib import Path
import re


def replace(path, old, new, label):
    p=Path(path); s=p.read_text()
    if old not in s: raise SystemExit(f'NOT FOUND: {label} in {path}')
    p.write_text(s.replace(old,new,1))
    print('patched',label)


def regex_replace(path, pattern, repl, label, flags=0):
    p=Path(path); s=p.read_text(); out,n=re.subn(pattern,repl,s,count=1,flags=flags)
    if n!=1: raise SystemExit(f'NOT FOUND/AMBIGUOUS: {label} in {path} ({n})')
    p.write_text(out); print('patched',label)

# Main app becomes community-first and hands messaging/calls to the dedicated Messenger binary.
replace('App.tsx',
"import MessagesScreen from './src/screens/MessagesScreen';",
"import MessengerBridgeScreen from './src/messenger/MessengerBridgeScreen';\nimport {openMessenger} from './src/messenger/MessengerBridge';",
'main messenger imports')
replace('App.tsx',
"  async function startMessage(member:Member){try{const r=await post(`/conversations/with/${member.id}`,{});if(navRef.isReady())navRef.navigate('Conversation',{id:Number(r.conversation_id)});}catch(e:any){setFatal(String(e.message||e))}}",
"  async function startMessage(member:Member){await openMessenger({userId:Number(member.id)});}",
'main message handoff')
regex_replace('App.tsx',
 r"  async function startCall\(peer:any,mode:'voice'\|'video'\)\{.*?\n  \}\n\n  async function answerIncomingId",
 "  async function startCall(peer:any,mode:'voice'|'video'){\n    await openMessenger({\n      userId:Number(peer?.member_id||peer?.user_id||peer?.id||0)||undefined,\n      conversationId:Number(peer?.conversation_id||0)||undefined,\n      callMode:mode,\n    });\n  }\n\n  async function answerIncomingId",
 'main call handoff',re.S)
regex_replace('App.tsx',
 r'<Tabs.Screen name=\\?"Messages\\?">\{\(\)=> <MessagesScreen.*?</Tabs.Screen>',
 '<Tabs.Screen name="Messages">{()=> <MessengerBridgeScreen/>}</Tabs.Screen>',
 'messages tab bridge',re.S)
regex_replace('App.tsx',
 r'<Stack.Screen name=\\?"Conversation\\?">.*?</Stack.Screen>',
 '',
 'remove embedded conversation route',re.S)

# CallManager: correct product name and preserve incoming preview camera through Answer.
replace('src/calls/CallManager.ts',
"import {ReverbClient} from '../realtime/ReverbClient';",
"import {ReverbClient} from '../realtime/ReverbClient';\nimport {APP_FLAVOR} from '../config';",
'call manager flavor')
replace('src/calls/CallManager.ts',
"        await CallKeep.setup({ios:{appName:'Private Gather',supportsVideo:true,maximumCallsPerCallGroup:1,maximumCallGroups:1,displayCallReachabilityTimeout:15000},android:{alertTitle:'Enable Private Gather calling'",
"        const callAppName=APP_FLAVOR==='messenger'?'Private Gather Messenger':'Private Gather';\n        await CallKeep.setup({ios:{appName:callAppName,supportsVideo:true,maximumCallsPerCallGroup:1,maximumCallGroups:1,displayCallReachabilityTimeout:15000},android:{alertTitle:'Enable Private Gather calling'",
'callkeep product name')
replace('src/calls/CallManager.ts',
"    // Samsung and several Android camera stacks do not reliably allow a second\n    // getUserMedia request while the preview stream still owns the camera.\n    this.clearIncomingPreview();\n    if(preparedLocal){\n      this.local=preparedLocal;\n    }else{\n      this.local=await this.captureLocal(this.mode,true);\n    }",
"    // Messenger V2 promotes the already-running incoming preview into the live call.\n    // Only a microphone track is acquired, avoiding camera teardown/reopen blink.\n    let promotedPreview:MediaStream|undefined;\n    if(!preparedLocal&&this.mode==='video'&&this.preview&&this.previewCallId===callId){\n      promotedPreview=this.preview;this.preview=undefined;this.previewCallId=0;\n      try{\n        const mic=await this.captureLocal('voice',true);\n        for(const track of mic.getAudioTracks?.()||[])promotedPreview.addTrack(track);\n      }catch(e){\n        try{promotedPreview.getTracks().forEach(t=>t.stop())}catch{}\n        throw e;\n      }\n    }else{\n      this.clearIncomingPreview();\n    }\n    if(preparedLocal){\n      this.local=preparedLocal;\n    }else if(promotedPreview){\n      this.local=promotedPreview;\n    }else{\n      this.local=await this.captureLocal(this.mode,true);\n    }",
'promote incoming preview')

# Android native call plugin: package/flavor-safe generation, call notification dedupe, full-frame lock-screen preview.
p=Path('plugins/withPrivateGatherNativeCalling.js'); s=p.read_text()
def ps(old,new,label):
    global s
    if old not in s: raise SystemExit(f'NOT FOUND plugin: {label}')
    s=s.replace(old,new,1);print('patched plugin',label)
ps('import android.graphics.Color\nimport android.graphics.SurfaceTexture',
   'import android.graphics.Color\nimport android.graphics.Matrix\nimport android.graphics.RectF\nimport android.graphics.SurfaceTexture','preview matrix imports')
ps('private const val CHANNEL_ID = "pg-calls-v199"','private const val CHANNEL_ID = "pg-messenger-calls-v120"','messenger call channel')
ps('  private fun showIncomingCall(data: Map<String, String>) {\n    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager',
   '  private fun showIncomingCall(data: Map<String, String>) {\n    val callId = data["call_id"] ?: return\n    val now = System.currentTimeMillis()\n    val prefs = getSharedPreferences("private-gather-messenger-call-alert-v120", Context.MODE_PRIVATE)\n    val lastId = prefs.getString("last_call_id", "") ?: ""\n    val lastAt = prefs.getLong("last_call_at", 0L)\n    if(lastId == callId && now - lastAt < 120000L) return\n    prefs.edit().putString("last_call_id",callId).putLong("last_call_at",now).apply()\n    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager',
   'incoming notification dedupe')
# Remove the later duplicate callId declaration.
needle='    val callId = data["call_id"] ?: return\n'
first=s.find(needle); second=s.find(needle,first+len(needle))
if first<0 or second<0: raise SystemExit('NOT FOUND plugin: duplicate callId declaration')
s=s[:second]+s[second+len(needle):];print('patched plugin duplicate callId')
ps('      .setAutoCancel(false)\n      .setSound(sound)',
   '      .setAutoCancel(false)\n      .setOnlyAlertOnce(true)\n      .setSound(sound)','only alert once')
ps('"privategather://incoming-call?call_id="','"privategathermessenger://incoming-call?call_id="','messenger incoming scheme')
ps('  private var camera:Camera?=null\n  private lateinit var preview:TextureView\n  private var videoCall=false',
   '  private var camera:Camera?=null\n  private lateinit var preview:TextureView\n  private var videoCall=false\n  private var previewBufferWidth=0\n  private var previewBufferHeight=0','preview dimensions')
old_camera='''  private fun startCamera(){
    if(!videoCall||camera!=null||checkSelfPermission(Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED||!preview.isAvailable)return
    try{
      val id=frontCameraId();if(id<0)return
      val info=Camera.CameraInfo();Camera.getCameraInfo(id,info)
      val opened=Camera.open(id)
      val params=opened.parameters
      params.supportedPreviewSizes?.minByOrNull{abs((it.width*it.height)-(640*480))}?.let{params.setPreviewSize(it.width,it.height)}
      if(params.isZoomSupported)params.zoom=0
      opened.parameters=params
      val rotation=windowManager.defaultDisplay.rotation
      val degrees=when(rotation){Surface.ROTATION_90->90;Surface.ROTATION_180->180;Surface.ROTATION_270->270;else->0}
      var result=(info.orientation+degrees)%360;result=(360-result)%360
      opened.setDisplayOrientation(result)
      opened.setPreviewTexture(preview.surfaceTexture);opened.startPreview();camera=opened
    }catch(_:Throwable){stopCamera()}
  }'''
new_camera='''  private fun applyPreviewCenterCrop(){
    val viewWidth=preview.width;val viewHeight=preview.height
    if(viewWidth<=0||viewHeight<=0||previewBufferWidth<=0||previewBufferHeight<=0)return
    val centerX=viewWidth/2f;val centerY=viewHeight/2f
    val scale=kotlin.math.max(viewWidth.toFloat()/previewBufferWidth.toFloat(),viewHeight.toFloat()/previewBufferHeight.toFloat())
    val matrix=Matrix();matrix.setScale(scale,scale,centerX,centerY);preview.setTransform(matrix)
  }
  private fun startCamera(){
    if(!videoCall||camera!=null||checkSelfPermission(Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED||!preview.isAvailable)return
    try{
      val id=frontCameraId();if(id<0)return
      val info=Camera.CameraInfo();Camera.getCameraInfo(id,info)
      val opened=Camera.open(id);val params=opened.parameters
      val chosen=params.supportedPreviewSizes?.minByOrNull{abs((it.width.toFloat()/it.height.toFloat())-(16f/9f))*100000f + abs((it.width*it.height)-(1280*720)).toFloat()/1000f}
      if(chosen!=null)params.setPreviewSize(chosen.width,chosen.height)
      if(params.isZoomSupported)params.zoom=0
      opened.parameters=params
      val rotation=windowManager.defaultDisplay.rotation
      val degrees=when(rotation){Surface.ROTATION_90->90;Surface.ROTATION_180->180;Surface.ROTATION_270->270;else->0}
      var result=(info.orientation+degrees)%360;result=(360-result)%360
      opened.setDisplayOrientation(result)
      if(chosen!=null){previewBufferWidth=if(result==90||result==270)chosen.height else chosen.width;previewBufferHeight=if(result==90||result==270)chosen.width else chosen.height}
      opened.setPreviewTexture(preview.surfaceTexture);opened.startPreview();camera=opened;preview.post{applyPreviewCenterCrop()}
    }catch(_:Throwable){stopCamera()}
  }'''
ps(old_camera,new_camera,'full-frame incoming preview')
ps('  override fun onSurfaceTextureSizeChanged(surface:SurfaceTexture,width:Int,height:Int){}',
   '  override fun onSurfaceTextureSizeChanged(surface:SurfaceTexture,width:Int,height:Int){applyPreviewCenterCrop()}','preview resize crop')
# Dynamic package names in manifest and generated Kotlin output.
ps("  config = withAndroidManifest(config, (c) => {\n    c.modResults.manifest.$ = c.modResults.manifest.$ || {};",
   "  config = withAndroidManifest(config, (c) => {\n    const androidPackage = c.android?.package || config.android?.package || 'com.privoralabs.privategather.messenger';\n    c.modResults.manifest.$ = c.modResults.manifest.$ || {};",'manifest dynamic package')
s=s.replace("'android:name': 'com.privoralabs.privategather.PrivateGatherFirebaseMessagingService'","'android:name': `${androidPackage}.PrivateGatherFirebaseMessagingService`")
s=s.replace("v.$?.['android:name'] === 'com.privoralabs.privategather.PrivateGatherIncomingCallActivity'","v.$?.['android:name'] === `${androidPackage}.PrivateGatherIncomingCallActivity`")
s=s.replace("'android:name':'com.privoralabs.privategather.PrivateGatherIncomingCallActivity'","'android:name':`${androidPackage}.PrivateGatherIncomingCallActivity`")
old_danger="""  config = withDangerousMod(config, ['android', async (c) => {
    const dir = path.join(c.modRequest.platformProjectRoot,'app','src','main','java','com','privoralabs','privategather');
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'PrivateGatherFirebaseMessagingService.kt'),androidService);
    fs.writeFileSync(path.join(dir,'PrivateGatherIncomingCallActivity.kt'),androidIncomingActivity);
    fs.writeFileSync(path.join(dir,'PrivateGatherCallAccessModule.kt'),androidCallAccessModule);
    return c;
  }]);"""
new_danger="""  config = withDangerousMod(config, ['android', async (c) => {
    const androidPackage = c.android?.package || config.android?.package || 'com.privoralabs.privategather.messenger';
    const dir = path.join(c.modRequest.platformProjectRoot,'app','src','main','java',...androidPackage.split('.'));
    const withPackage=(source)=>source.replace('package com.privoralabs.privategather',`package ${androidPackage}`);
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'PrivateGatherFirebaseMessagingService.kt'),withPackage(androidService));
    fs.writeFileSync(path.join(dir,'PrivateGatherIncomingCallActivity.kt'),withPackage(androidIncomingActivity));
    fs.writeFileSync(path.join(dir,'PrivateGatherCallAccessModule.kt'),withPackage(androidCallAccessModule));
    return c;
  }]);"""
ps(old_danger,new_danger,'dynamic Kotlin package output')
p.write_text(s)

# Readiness gate: version truth + both app flavors + Messenger V2 architecture.
p=Path('scripts/check-ready.mjs'); s=p.read_text()
s=s.replace("const resolvedConfig = appConfigFactory({ config: {} });",
"const originalFlavor=process.env.PG_APP_FLAVOR;\nprocess.env.PG_APP_FLAVOR='main';\nconst mainResolvedConfig=appConfigFactory({config:{}});\nprocess.env.PG_APP_FLAVOR='messenger';\nconst messengerResolvedConfig=appConfigFactory({config:{}});\nif(originalFlavor===undefined)delete process.env.PG_APP_FLAVOR;else process.env.PG_APP_FLAVOR=originalFlavor;\nconst resolvedConfig=(String(originalFlavor||'main').toLowerCase()==='messenger'?messengerResolvedConfig:mainResolvedConfig);")
s=s.replace("const expected='1.1.200';","const expected='1.2.0';")
s=s.replace("APP_VERSION=String(Constants.expoConfig?.version||'1.1.200')","APP_VERSION=String(Constants.expoConfig?.version||'1.2.0')")
s=s.replace("source APP_VERSION fallback 1.1.200","source APP_VERSION fallback 1.2.0").replace("source APP_VERSION fallback is not 1.1.200","source APP_VERSION fallback is not 1.2.0")
s=s.replace("Private Gather · Native 1.1.200","Private Gather · Native 1.2.0").replace("visible login version 1.1.200","visible login version 1.2.0").replace("visible login version is not 1.1.200","visible login version is not 1.2.0")
s=s.replace("[['expo-font','~57.0.3'],['expo-asset','~57.0.16']]","[['expo-font','~57.0.3'],['expo-asset','~57.0.16'],['expo-sqlite','~57.0.2']]")
insert="""
const messengerRootSource=fs.readFileSync(path.join(root,'MessengerApp.tsx'),'utf8');
const messengerEngineSource=fs.readFileSync(path.join(root,'src','messenger','v2','MessengerEngine.ts'),'utf8');
const messengerStoreSource=fs.readFileSync(path.join(root,'src','messenger','v2','MessengerStore.ts'),'utf8');
const messengerRingerSource=fs.readFileSync(path.join(root,'src','messenger','v2','calls','MessengerRinger.ts'),'utf8');
const messengerCallSource=fs.readFileSync(path.join(root,'src','messenger','v2','screens','MessengerCallScreen.tsx'),'utf8');
"""
s=s.replace("const nativeCallPluginSource = fs.readFileSync(path.join(root,'plugins','withPrivateGatherNativeCalling.js'),'utf8');", "const nativeCallPluginSource = fs.readFileSync(path.join(root,'plugins','withPrivateGatherNativeCalling.js'),'utf8');\n"+insert)
flavor_checks="""
mainResolvedConfig.android?.package === 'com.privoralabs.privategather' ? ok('main Android application id') : fail('main Android application id mismatch');
mainResolvedConfig.ios?.bundleIdentifier === 'com.privoralabs.privategather' ? ok('main iOS bundle identifier') : fail('main iOS bundle identifier mismatch');
mainResolvedConfig.scheme === 'privategather' ? ok('main deep-link scheme') : fail('main deep-link scheme mismatch');
messengerResolvedConfig.android?.package === 'com.privoralabs.privategather.messenger' ? ok('Messenger Android application id') : fail('Messenger Android application id mismatch');
messengerResolvedConfig.ios?.bundleIdentifier === 'com.privoralabs.privategather.messenger' ? ok('Messenger iOS bundle identifier') : fail('Messenger iOS bundle identifier mismatch');
messengerResolvedConfig.scheme === 'privategathermessenger' ? ok('Messenger deep-link scheme') : fail('Messenger deep-link scheme mismatch');
messengerStoreSource.includes('journal_mode = WAL') && messengerStoreSource.includes('CREATE TABLE IF NOT EXISTS outbox') ? ok('Messenger persistent WAL cache and outbox') : fail('Messenger persistent store/outbox missing');
messengerEngineSource.includes('flushOutbox') && messengerEngineSource.includes('ReverbClient') && messengerEngineSource.includes('setTyping') ? ok('Messenger durable realtime engine') : fail('Messenger realtime/outbox engine missing');
messengerRootSource.includes('MessengerEngine') && messengerRootSource.includes('privategathermessenger://') ? ok('dedicated Messenger native root') : fail('Messenger root/handoff missing');
messengerRingerSource.includes('COMPLETE_CLIP_MS=8500') && messengerRingerSource.includes('player.loop=false') && !messengerRingerSource.includes('didJustFinish') ? ok('Messenger ringtone completes full clip before restart') : fail('Messenger ringtone cycle guard missing');
messengerCallSource.includes('objectFit=\"cover\"') && messengerCallSource.includes('useWindowDimensions') ? ok('Messenger full-window cover video') : fail('Messenger full-window video contract missing');
nativeCallPluginSource.includes('private-gather-messenger-call-alert-v120') && nativeCallPluginSource.includes('setOnlyAlertOnce(true)') ? ok('Android incoming call dedupe') : fail('Android incoming call dedupe missing');
"""
s=s.replace("const api = process.env.EXPO_PUBLIC_PG_API_BASE || 'https://member.privategather.com/api/v1/native';",flavor_checks+"\nconst api = process.env.EXPO_PUBLIC_PG_API_BASE || 'https://member.privategather.com/api/v1/native';")
p.write_text(s);print('patched readiness gate')

# CI validates both independently generated native binaries.
Path('.github/workflows/native-validate.yml').write_text('''name: Native Validate

on:
  workflow_dispatch:
  pull_request:
    branches: [main]
    paths:
      - 'App.tsx'
      - 'MessengerApp.tsx'
      - 'index.ts'
      - 'app.json'
      - 'app.config.js'
      - 'package.json'
      - 'package-lock.json'
      - 'tsconfig.json'
      - '.gitignore'
      - '.github/workflows/native-validate.yml'
      - 'plugins/**'
      - 'src/**'
      - 'scripts/**'
  push:
    branches: [main]
    paths:
      - 'App.tsx'
      - 'MessengerApp.tsx'
      - 'index.ts'
      - 'app.json'
      - 'app.config.js'
      - 'package.json'
      - 'package-lock.json'
      - 'tsconfig.json'
      - '.gitignore'
      - '.github/workflows/native-validate.yml'
      - 'plugins/**'
      - 'src/**'
      - 'scripts/**'

concurrency:
  group: native-validate-${{ github.ref }}
  cancel-in-progress: true
permissions:
  contents: read

jobs:
  public-safety:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
        with: {fetch-depth: 0}
      - uses: actions/setup-node@v4
        with: {node-version: 22.23.2}
      - name: Public repository secret/file gate
        run: node scripts/ci-public-safety.mjs

  android:
    needs: public-safety
    runs-on: ubuntu-latest
    timeout-minutes: 50
    strategy:
      fail-fast: false
      matrix:
        flavor: [main, messenger]
    env:
      PG_APP_FLAVOR: ${{ matrix.flavor }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {node-version: 22.23.2, cache: npm}
      - uses: actions/setup-java@v5
        with: {distribution: temurin, java-version: '17'}
      - name: Install exact dependencies
        run: npm ci --no-audit --no-fund
      - name: Ready check
        run: npm run check:ready
      - name: Typecheck
        run: npm run typecheck
      - name: Expo config
        run: npx expo config --type public > /tmp/private-gather-${{ matrix.flavor }}-expo-config.txt
      - name: Generate Android project
        run: npx expo prebuild --clean --platform android
      - name: Kotlin compile gate
        working-directory: android
        run: ./gradlew :app:compileDebugKotlin --console=plain
      - name: Build debug APK
        working-directory: android
        run: ./gradlew assembleDebug --console=plain
      - uses: actions/upload-artifact@v4
        with:
          name: private-gather-${{ matrix.flavor }}-android-debug
          path: android/app/build/outputs/apk/debug/*.apk
          if-no-files-found: error
          retention-days: 7

  ios-prebuild:
    needs: public-safety
    runs-on: macos-latest
    timeout-minutes: 50
    strategy:
      fail-fast: false
      matrix:
        flavor: [main, messenger]
    env:
      PG_APP_FLAVOR: ${{ matrix.flavor }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {node-version: 22.23.2, cache: npm}
      - name: Install exact dependencies
        run: npm ci --no-audit --no-fund
      - name: Ready check
        run: npm run check:ready
      - name: Typecheck
        run: npm run typecheck
      - name: Generate iOS project
        run: npx expo prebuild --clean --platform ios
      - name: Install CocoaPods
        working-directory: ios
        run: pod install
      - name: Verify Xcode workspace
        run: |
          WORKSPACE=$(find ios -maxdepth 1 -name '*.xcworkspace' | head -1)
          test -n "$WORKSPACE"
          xcodebuild -list -workspace "$WORKSPACE"
''')
print('patched native validation workflow')
