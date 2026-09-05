const {withDangerousMod}=require('@expo/config-plugins');
const fs=require('fs');
const path=require('path');

function addImport(text,anchor,line){if(text.includes(line))return text;if(!text.includes(anchor))throw new Error('Private Gather 1.2.1 missing import anchor: '+anchor);return text.replace(anchor,anchor+'\n'+line)}
module.exports=function withPrivateGatherMessenger121(config){
  const pkg=String(config.android?.package||'');if(!pkg.endsWith('.messenger'))return config;
  return withDangerousMod(config,['android',async c=>{
    const dir=path.join(c.modRequest.platformProjectRoot,'app','src','main','java',...pkg.split('.'));
    const accessPath=path.join(dir,'PrivateGatherCallAccessModule.kt');
    const activityPath=path.join(dir,'PrivateGatherIncomingCallActivity.kt');
    const servicePath=path.join(dir,'PrivateGatherFirebaseMessagingService.kt');
    for(const file of [accessPath,activityPath,servicePath])if(!fs.existsSync(file))throw new Error('Private Gather 1.2.1 missing generated native file: '+file);

    let access=fs.readFileSync(accessPath,'utf8');
    access=addImport(access,'import android.provider.Settings','import android.view.View');
    access=addImport(access,'import android.view.View','import android.view.WindowInsets');
    access=addImport(access,'import android.view.WindowInsets','import android.view.WindowInsetsController');
    access=addImport(access,'import android.view.WindowInsetsController','import android.view.WindowManager');
    if(!access.includes('PG_MESSENGER_121_IMMERSIVE')){
      const marker='  @ReactMethod fun cancelIncomingCallNotification';
      const methods=`  // PG_MESSENGER_121_IMMERSIVE\n  @ReactMethod fun enterImmersiveCallMode(promise: Promise){\n    val activity=reactContext.currentActivity;if(activity==null){promise.resolve(false);return}\n    activity.runOnUiThread{try{\n      if(Build.VERSION.SDK_INT>=30){activity.window.setDecorFitsSystemWindows(false);activity.window.insetsController?.let{it.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars());it.systemBarsBehavior=WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE}}\n      else{@Suppress(\"DEPRECATION\") activity.window.decorView.systemUiVisibility=(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_STABLE)}\n      activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);promise.resolve(true)\n    }catch(e:Throwable){promise.reject(\"PG_CALL_IMMERSIVE\",e)}}\n  }\n  @ReactMethod fun exitImmersiveCallMode(promise: Promise){\n    val activity=reactContext.currentActivity;if(activity==null){promise.resolve(false);return}\n    activity.runOnUiThread{try{\n      if(Build.VERSION.SDK_INT>=30)activity.window.insetsController?.show(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())\n      else{@Suppress(\"DEPRECATION\") activity.window.decorView.systemUiVisibility=(View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION)}\n      activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);promise.resolve(true)\n    }catch(e:Throwable){promise.reject(\"PG_CALL_IMMERSIVE_EXIT\",e)}}\n  }\n  @ReactMethod fun presentIncomingCall(callId: Double, mode: String, callerName: String, promise: Promise){\n    try{\n      val id=callId.toInt();val uri=Uri.parse(\"privategathermessenger://incoming-call?call_id=\"+Uri.encode(id.toString())+\"&mode=\"+Uri.encode(if(mode==\"video\")\"video\" else \"voice\")+\"&caller_name=\"+Uri.encode(callerName));\n      val clazz=Class.forName(reactContext.packageName+\".PrivateGatherIncomingCallActivity\");val intent=Intent(Intent.ACTION_VIEW,uri).setClass(reactContext,clazz);intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP);reactContext.startActivity(intent);promise.resolve(true)\n    }catch(e:Throwable){promise.reject(\"PG_PRESENT_INCOMING_CALL\",e)}\n  }\n`;
      if(!access.includes(marker))throw new Error('Private Gather 1.2.1 missing call access insertion point');access=access.replace(marker,methods+marker);
    }
    fs.writeFileSync(accessPath,access);

    let activity=fs.readFileSync(activityPath,'utf8');
    activity=addImport(activity,'import android.app.Activity','import android.app.NotificationManager');
    activity=addImport(activity,'import android.app.NotificationManager','import android.content.Context');
    activity=addImport(activity,'import android.hardware.Camera','import android.media.MediaPlayer');
    activity=addImport(activity,'import android.view.Gravity','import android.view.WindowInsets');
    activity=addImport(activity,'import android.view.WindowInsets','import android.view.WindowInsetsController');
    if(!activity.includes('PG_MESSENGER_121_NATIVE_RING')){
      activity=activity.replace('  private var previewBufferHeight=0',`  private var previewBufferHeight=0\n  private var ringer:MediaPlayer?=null\n  // PG_MESSENGER_121_NATIVE_RING\n  private fun enterImmersive(){\n    if(Build.VERSION.SDK_INT>=30){window.setDecorFitsSystemWindows(false);window.insetsController?.let{it.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars());it.systemBarsBehavior=WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE}}\n    else{@Suppress(\"DEPRECATION\") window.decorView.systemUiVisibility=(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_FULLSCREEN or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_STABLE)}\n  }\n  private fun cancelCallNotification(){try{val raw=intent?.data?.getQueryParameter(\"call_id\")?:return;val request=raw.toIntOrNull()?:raw.hashCode();(getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel(41000+(request and 0x0fff))}catch(_:Throwable){}}\n  private fun startRinging(){if(ringer!=null)return;try{val res=resources.getIdentifier(\"calling\",\"raw\",packageName);if(res!=0)ringer=MediaPlayer.create(this,res)?.apply{isLooping=true;start()}}catch(_:Throwable){ringer=null}}\n  private fun stopRinging(){try{ringer?.stop()}catch(_:Throwable){};try{ringer?.release()}catch(_:Throwable){};ringer=null}`);
      activity=activity.replace('    window.navigationBarColor=Color.BLACK','    window.navigationBarColor=Color.BLACK\n    enterImmersive();cancelCallNotification();startRinging()');
      activity=activity.replace('  override fun onResume(){super.onResume();if(::preview.isInitialized&&preview.isAvailable)startCamera()}','  override fun onResume(){super.onResume();enterImmersive();startRinging();if(::preview.isInitialized&&preview.isAvailable)startCamera()}\n  override fun onWindowFocusChanged(hasFocus:Boolean){super.onWindowFocusChanged(hasFocus);if(hasFocus)enterImmersive()}');
      activity=activity.replace('  override fun onDestroy(){stopCamera();super.onDestroy()}','  override fun onDestroy(){stopCamera();stopRinging();super.onDestroy()}');
      activity=activity.replace('  private fun openApp(action:String){\n    stopCamera()','  private fun openApp(action:String){\n    stopCamera();stopRinging()');
    }
    fs.writeFileSync(activityPath,activity);

    let service=fs.readFileSync(servicePath,'utf8');
    service=addImport(service,'import android.app.ActivityManager','import android.app.KeyguardManager');
    service=addImport(service,'import android.os.Build','import android.os.PowerManager');
    service=service.replace('pg-messenger-calls-v120','pg-messenger-calls-v121').replace('private-gather-messenger-call-alert-v120','private-gather-messenger-call-alert-v121');
    if(!service.includes('PG_MESSENGER_121_DIRECT_ACTIVITY')){
      const notify='    manager.notify(41000 + (requestCode and 0x0fff), notification)';
      const direct=`${notify}\n    // PG_MESSENGER_121_DIRECT_ACTIVITY: when Android allows it, promote the call immediately instead of leaving only a heads-up strip.\n    try{val power=getSystemService(Context.POWER_SERVICE) as PowerManager;val keyguard=getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager;if(power.isInteractive&&!keyguard.isKeyguardLocked)startActivity(Intent(launch).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP))}catch(_:Throwable){}`;
      if(!service.includes(notify))throw new Error('Private Gather 1.2.1 missing notification insertion point');service=service.replace(notify,direct);
    }
    fs.writeFileSync(servicePath,service);
    return c;
  }]);
};
