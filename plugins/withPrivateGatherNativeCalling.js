const {
  withAndroidManifest,
  withInfoPlist,
  withAppDelegate,
  withAppBuildGradle,
  withMainApplication,
  AndroidConfig,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ANDROID_PERMISSIONS = [
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.VIBRATE',
  'android.permission.WAKE_LOCK',
  'android.permission.CALL_PHONE',
  'android.permission.READ_PHONE_STATE',
  'android.permission.READ_PHONE_NUMBERS',
  'android.permission.MANAGE_OWN_CALLS',
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_PHONE_CALL',
  'android.permission.FOREGROUND_SERVICE_MICROPHONE',
  'android.permission.FOREGROUND_SERVICE_CAMERA',
];

function ensureService(app, service) {
  app.service = app.service || [];
  const name = service.$['android:name'];
  const found = app.service.find((v) => v.$ && v.$['android:name'] === name);
  if (!found) app.service.push(service);
}

function patchSwift(contents) {
  if (contents.includes('PG_NATIVE_CALLING_V185')) return contents;
  contents = contents.replace('internal import Expo', `internal import Expo\nimport PushKit`);
  contents = contents.replace('class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, PKPushRegistryDelegate {');
  contents = contents.replace(
    'return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
    `RNVoipPushNotificationManager.voipRegistration()\n    return super.application(application, didFinishLaunchingWithOptions: launchOptions)`
  );
  const methods = `\n  // PG_NATIVE_CALLING_V185\n  public func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {\n    RNVoipPushNotificationManager.didUpdate(pushCredentials, forType: type.rawValue)\n  }\n\n  public func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {\n  }\n\n  public func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {\n    let data = payload.dictionaryPayload\n    let uuid = (data["uuid"] as? String) ?? UUID().uuidString.lowercased()\n    let callerName = (data["callerName"] as? String) ?? (data["caller_name"] as? String) ?? "Private Gather member"\n    let handle = (data["handle"] as? String) ?? String(describing: data["caller_id"] ?? "Private Gather")\n    let hasVideo = (data["hasVideo"] as? Bool) ?? ((data["mode"] as? String) == "video")\n    RNVoipPushNotificationManager.didReceiveIncomingPush(with: payload, forType: type.rawValue)\n    RNCallKeep.reportNewIncomingCall(uuid, handle: handle, handleType: "generic", hasVideo: hasVideo, localizedCallerName: callerName, supportsHolding: false, supportsDTMF: false, supportsGrouping: false, supportsUngrouping: false, fromPushKit: true, payload: data, withCompletionHandler: completion)\n  }\n`;
  return contents.replace('\n}\nclass ReactNativeDelegate', `${methods}\n}\nclass ReactNativeDelegate`);
}

const androidService = `package com.privoralabs.privategather

import android.app.ActivityManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.ExpoFirebaseMessagingService

class PrivateGatherFirebaseMessagingService : ExpoFirebaseMessagingService() {
  companion object {
    private const val CHANNEL_ID = "pg-calls-v199"
  }

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    val data = remoteMessage.data
    if (data["type"] == "incoming_call") {
      if (isAppForeground()) {
        super.onMessageReceived(remoteMessage)
      } else {
        showIncomingCall(data)
      }
      return
    }
    super.onMessageReceived(remoteMessage)
  }

  private fun isAppForeground(): Boolean {
    val info = ActivityManager.RunningAppProcessInfo()
    ActivityManager.getMyMemoryState(info)
    return info.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND ||
      info.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_VISIBLE
  }

  private fun showIncomingCall(data: Map<String, String>) {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val sound = Uri.parse("android.resource://$packageName/raw/calling")
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val attrs = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()
      val channel = NotificationChannel(CHANNEL_ID, "Private Gather incoming calls", NotificationManager.IMPORTANCE_HIGH)
      channel.description = "Full-screen Private Gather voice and video calls"
      channel.enableVibration(true)
      channel.vibrationPattern = longArrayOf(0,700,300,700,300,1100)
      channel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      channel.setSound(sound, attrs)
      manager.createNotificationChannel(channel)
    }

    val callId = data["call_id"] ?: return
    val caller = data["caller_name"] ?: "Private Gather member"
    val mode = if (data["mode"] == "video") "video" else "voice"
    val uri = Uri.parse(
      "privategather://incoming-call?call_id=" + Uri.encode(callId) +
      "&mode=" + Uri.encode(mode) +
      "&caller_id=" + Uri.encode(data["caller_id"] ?: "") +
      "&caller_name=" + Uri.encode(caller)
    )

    // Use a real ACTION_VIEW deep-link intent. Adding data to the package launcher
    // intent can open the app without delivering the URI to React Native Linking.
    val launch = Intent(Intent.ACTION_VIEW, uri, this, PrivateGatherIncomingCallActivity::class.java)
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    launch.putExtra("pg_incoming_call_id", callId)
    launch.putExtra("pg_incoming_call_mode", mode)
    launch.putExtra("pg_incoming_caller_name", caller)

    val requestCode = callId.toIntOrNull() ?: callId.hashCode()
    val pending = PendingIntent.getActivity(
      this,
      requestCode,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    val icon = resources.getIdentifier("notification_icon", "drawable", packageName).let {
      if (it != 0) it else applicationInfo.icon
    }

    val notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(icon)
      .setColor(Color.rgb(255,53,211))
      .setContentTitle("Incoming call from Private Gather")
      .setContentText("$caller · \${if (mode == "video") "Video" else "Voice"} call")
      .setCategory(NotificationCompat.CATEGORY_CALL)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setContentIntent(pending)
      .setFullScreenIntent(pending, true)
      .setOngoing(true)
      .setAutoCancel(false)
      .setSound(sound)
      .setVibrate(longArrayOf(0,700,300,700,300,1100))
      .setTimeoutAfter(120000L)
      .build()

    manager.notify(41000 + (requestCode and 0x0fff), notification)
  }
}
`;

const androidIncomingActivity = `package com.privoralabs.privategather

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.SurfaceTexture
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.hardware.Camera
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.Surface
import android.view.TextureView
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.math.abs

@Suppress("DEPRECATION")
class PrivateGatherIncomingCallActivity : Activity(), TextureView.SurfaceTextureListener {
  private var camera:Camera?=null
  private lateinit var preview:TextureView
  private var videoCall=false
  private fun dp(value:Int):Int=(value*resources.displayMetrics.density).toInt()
  private fun rounded(color:Int):GradientDrawable=GradientDrawable().apply{shape=GradientDrawable.RECTANGLE;setColor(color);cornerRadius=dp(32).toFloat()}

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    if(Build.VERSION.SDK_INT>=27){setShowWhenLocked(true);setTurnScreenOn(true)}
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or WindowManager.LayoutParams.FLAG_FULLSCREEN)
    window.navigationBarColor=Color.BLACK
    val caller=intent?.data?.getQueryParameter("caller_name") ?: "Private Gather member"
    val mode=if(intent?.data?.getQueryParameter("mode")=="video") "Video" else "Voice"
    videoCall=mode=="Video"

    val root=FrameLayout(this).apply{setBackgroundColor(Color.rgb(10,5,12))}
    preview=TextureView(this).apply{surfaceTextureListener=this@PrivateGatherIncomingCallActivity;visibility=if(videoCall) View.VISIBLE else View.GONE}
    root.addView(preview,FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT,FrameLayout.LayoutParams.MATCH_PARENT))
    val shade=View(this).apply{setBackgroundColor(Color.argb(if(videoCall)70 else 145,4,2,8))}
    root.addView(shade,FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT,FrameLayout.LayoutParams.MATCH_PARENT))

    val top=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;gravity=Gravity.CENTER_HORIZONTAL;setPadding(dp(18),dp(42),dp(18),dp(12))}
    top.addView(TextView(this).apply{text="PRIVATE GATHER";setTextColor(Color.rgb(255,72,205));textSize=14f;typeface=Typeface.DEFAULT_BOLD;gravity=Gravity.CENTER})
    top.addView(TextView(this).apply{text="Incoming call from Private Gather";setTextColor(Color.WHITE);textSize=23f;typeface=Typeface.DEFAULT_BOLD;gravity=Gravity.CENTER;setPadding(0,dp(18),0,dp(8))})
    top.addView(TextView(this).apply{text=caller;setTextColor(Color.WHITE);textSize=28f;typeface=Typeface.DEFAULT_BOLD;gravity=Gravity.CENTER;setPadding(0,dp(8),0,dp(4))})
    top.addView(TextView(this).apply{text=mode+" call";setTextColor(Color.rgb(205,219,235));textSize=14f;gravity=Gravity.CENTER})
    root.addView(top,FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT,FrameLayout.LayoutParams.WRAP_CONTENT,Gravity.TOP))

    val actions=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL;gravity=Gravity.CENTER;setPadding(dp(18),dp(10),dp(18),dp(56))}
    fun action(label:String,color:Int,action:String):TextView=TextView(this).apply{
      text=label;setTextColor(Color.WHITE);textSize=16f;typeface=Typeface.DEFAULT_BOLD;gravity=Gravity.CENTER;background=rounded(color);isClickable=true;isFocusable=true;minHeight=dp(64);setPadding(dp(12),0,dp(12),0);setOnClickListener{openApp(action)}
      layoutParams=LinearLayout.LayoutParams(0,dp(64),1f).apply{marginStart=dp(7);marginEnd=dp(7)}
    }
    actions.addView(action("Decline",Color.rgb(194,45,69),"decline"))
    actions.addView(action(if(videoCall) "Answer video" else "Answer",Color.rgb(24,164,97),"answer"))
    root.addView(actions,FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT,FrameLayout.LayoutParams.WRAP_CONTENT,Gravity.BOTTOM))
    setContentView(root)
  }

  private fun frontCameraId():Int{
    for(i in 0 until Camera.getNumberOfCameras()){val info=Camera.CameraInfo();Camera.getCameraInfo(i,info);if(info.facing==Camera.CameraInfo.CAMERA_FACING_FRONT)return i}
    return -1
  }
  private fun startCamera(){
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
  }
  private fun stopCamera(){try{camera?.stopPreview()}catch(_:Throwable){};try{camera?.release()}catch(_:Throwable){};camera=null}
  override fun onResume(){super.onResume();if(::preview.isInitialized&&preview.isAvailable)startCamera()}
  override fun onPause(){stopCamera();super.onPause()}
  override fun onDestroy(){stopCamera();super.onDestroy()}
  override fun onSurfaceTextureAvailable(surface:SurfaceTexture,width:Int,height:Int){startCamera()}
  override fun onSurfaceTextureSizeChanged(surface:SurfaceTexture,width:Int,height:Int){}
  override fun onSurfaceTextureDestroyed(surface:SurfaceTexture):Boolean{stopCamera();return true}
  override fun onSurfaceTextureUpdated(surface:SurfaceTexture){}

  private fun openApp(action:String){
    stopCamera()
    val source=intent?.data ?: return finish()
    val builder=source.buildUpon().clearQuery()
      .appendQueryParameter("call_id",source.getQueryParameter("call_id") ?: "")
      .appendQueryParameter("mode",source.getQueryParameter("mode") ?: "voice")
      .appendQueryParameter("caller_id",source.getQueryParameter("caller_id") ?: "")
      .appendQueryParameter("caller_name",source.getQueryParameter("caller_name") ?: "Private Gather member")
      .appendQueryParameter("action",action)
    val launch=Intent(Intent.ACTION_VIEW,builder.build(),this,MainActivity::class.java)
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    startActivity(launch);finish()
  }
  @Deprecated("Deprecated in Java") override fun onBackPressed() {}
}
`;


const androidCallAccessModule = `package com.privoralabs.privategather

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

class PrivateGatherCallAccessModule(private val reactContext: ReactApplicationContext): ReactContextBaseJavaModule(reactContext) {
  override fun getName()="PrivateGatherCallAccess"
  @ReactMethod fun canUseFullScreenIntent(promise: Promise){
    try{
      if(Build.VERSION.SDK_INT<34){promise.resolve(true);return}
      val manager=reactContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      promise.resolve(manager.canUseFullScreenIntent())
    }catch(e:Throwable){promise.reject("PG_FULL_SCREEN_CHECK",e)}
  }
  @ReactMethod fun openFullScreenIntentSettings(promise: Promise){
    try{
      if(Build.VERSION.SDK_INT>=34){
        val intent=Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:\${reactContext.packageName}"))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);reactContext.startActivity(intent)
      }
      promise.resolve(true)
    }catch(e:Throwable){promise.reject("PG_FULL_SCREEN_SETTINGS",e)}
  }
}
class PrivateGatherCallAccessPackage: ReactPackage {
  override fun createNativeModules(reactContext:ReactApplicationContext):List<NativeModule> = listOf(PrivateGatherCallAccessModule(reactContext))
  override fun createViewManagers(reactContext:ReactApplicationContext):List<ViewManager<*,*>> = emptyList()
}
`;

module.exports = function withPrivateGatherNativeCalling(config) {
  // PrivateGatherFirebaseMessagingService.kt directly references Firebase Messaging types.
  // expo-notifications keeps firebase-messaging as an implementation dependency of its
  // library module, which is intentionally not exposed on the app module compile classpath.
  // Add the exact SDK 57 Firebase Messaging version to the app module as well.
  config = withAppBuildGradle(config, (c) => {
    if (c.modResults.language !== 'groovy') return c;
    const dependency = "implementation 'com.google.firebase:firebase-messaging:25.0.1'";
    if (!c.modResults.contents.includes(dependency)) {
      const match = c.modResults.contents.match(/dependencies\s*\{/);
      if (!match || match.index == null) {
        throw new Error('Private Gather could not locate the Android app dependencies block.');
      }
      const insertAt = match.index + match[0].length;
      c.modResults.contents =
        c.modResults.contents.slice(0, insertAt) +
        `\n    ${dependency}` +
        c.modResults.contents.slice(insertAt);
    }
    return c;
  });

  config = withMainApplication(config, (c) => {
    if (c.modResults.language !== 'kt') return c;
    if (!c.modResults.contents.includes('PrivateGatherCallAccessPackage()')) {
      const marker = 'PackageList(this).packages.apply {';
      if (!c.modResults.contents.includes(marker)) throw new Error('Private Gather could not locate MainApplication package list.');
      c.modResults.contents = c.modResults.contents.replace(marker, marker + '\n              add(PrivateGatherCallAccessPackage())');
    }
    return c;
  });

  config = withInfoPlist(config, (c) => {
    const modes = new Set(c.modResults.UIBackgroundModes || []);
    ['audio', 'voip', 'remote-notification'].forEach((m) => modes.add(m));
    c.modResults.UIBackgroundModes = Array.from(modes);
    c.modResults.NSCameraUsageDescription ||= 'Private Gather uses the camera for private video calls and media you choose to share.';
    c.modResults.NSMicrophoneUsageDescription ||= 'Private Gather uses the microphone for private calls and voice messages.';
    return c;
  });

  config = withAndroidManifest(config, (c) => {
    c.modResults.manifest.$ = c.modResults.manifest.$ || {};
    c.modResults.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    c.modResults.manifest['uses-permission'] = c.modResults.manifest['uses-permission'] || [];
    const present = new Set(c.modResults.manifest['uses-permission'].map((p) => p.$ && p.$['android:name']).filter(Boolean));
    ANDROID_PERMISSIONS.forEach((name) => {
      if (!present.has(name)) c.modResults.manifest['uses-permission'].push({ $: { 'android:name': name } });
    });
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(c.modResults);
    app.service = app.service || [];
    if (!app.service.some(v => v.$?.['android:name'] === 'expo.modules.notifications.service.ExpoFirebaseMessagingService')) {
      app.service.push({$: {'android:name':'expo.modules.notifications.service.ExpoFirebaseMessagingService','tools:node':'remove'}});
    }
    ensureService(app, { $: {
      'android:name': 'com.privoralabs.privategather.PrivateGatherFirebaseMessagingService',
      'android:exported': 'false',
    }, 'intent-filter': [{ $: {'android:priority':'100'}, action: [{ $: { 'android:name': 'com.google.firebase.MESSAGING_EVENT' } }] }] });
    ensureService(app, { $: {
      'android:name': 'io.wazo.callkeep.VoiceConnectionService',
      'android:label': 'Private Gather Calls',
      'android:permission': 'android.permission.BIND_TELECOM_CONNECTION_SERVICE',
      'android:exported': 'true',
      'android:foregroundServiceType': 'phoneCall|camera|microphone',
    }, 'intent-filter': [{ action: [{ $: { 'android:name': 'android.telecom.ConnectionService' } }] }] });
    ensureService(app, { $: {
      'android:name': 'io.wazo.callkeep.RNCallKeepBackgroundMessagingService',
      'android:exported': 'false',
    }});
    const main = AndroidConfig.Manifest.getMainActivityOrThrow(c.modResults);
    main.$['android:showWhenLocked'] = 'true';
    main.$['android:turnScreenOn'] = 'true';
    app.activity = app.activity || [];
    if (!app.activity.some(v => v.$?.['android:name'] === 'com.privoralabs.privategather.PrivateGatherIncomingCallActivity')) {
      app.activity.push({$: {
        'android:name':'com.privoralabs.privategather.PrivateGatherIncomingCallActivity',
        'android:exported':'false','android:excludeFromRecents':'true','android:launchMode':'singleTop',
        'android:showWhenLocked':'true','android:turnScreenOn':'true','android:screenOrientation':'portrait'
      }});
    }
    return c;
  });

  config = withDangerousMod(config, ['android', async (c) => {
    const dir = path.join(c.modRequest.platformProjectRoot,'app','src','main','java','com','privoralabs','privategather');
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'PrivateGatherFirebaseMessagingService.kt'),androidService);
    fs.writeFileSync(path.join(dir,'PrivateGatherIncomingCallActivity.kt'),androidIncomingActivity);
    fs.writeFileSync(path.join(dir,'PrivateGatherCallAccessModule.kt'),androidCallAccessModule);
    return c;
  }]);

  config = withAppDelegate(config, (c) => {
    if (c.modResults.language === 'swift') c.modResults.contents = patchSwift(c.modResults.contents);
    return c;
  });

  config = withDangerousMod(config, ['ios', async (c) => {
    const root = c.modRequest.platformProjectRoot;
    const candidates = [];
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(root, entry.name);
      for (const name of fs.readdirSync(dir)) {
        if (name.endsWith('-Bridging-Header.h')) candidates.push(path.join(dir, name));
      }
    }
    const header = candidates[0];
    if (header) {
      let text = fs.readFileSync(header, 'utf8');
      for (const line of ['#import "RNCallKeep.h"', '#import "RNVoipPushNotificationManager.h"']) {
        if (!text.includes(line)) text += `\n${line}`;
      }
      fs.writeFileSync(header, text.trimEnd() + '\n');
    }
    return c;
  }]);
  return config;
};
