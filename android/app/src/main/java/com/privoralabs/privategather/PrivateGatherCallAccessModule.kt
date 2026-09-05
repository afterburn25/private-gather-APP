package com.privoralabs.privategather

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
        val intent=Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${reactContext.packageName}"))
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
