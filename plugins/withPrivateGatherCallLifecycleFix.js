const {withDangerousMod}=require('@expo/config-plugins');
const fs=require('fs');
const path=require('path');

module.exports=function withPrivateGatherCallLifecycleFix(config){
  return withDangerousMod(config,['android',async config=>{
    const androidPackage=config.android?.package||'com.privoralabs.privategather';
    const javaDir=path.join(
      config.modRequest.projectRoot,
      'android','app','src','main','java',...androidPackage.split('.')
    );
    const servicePath=path.join(javaDir,'PrivateGatherFirebaseMessagingService.kt');
    const activityPath=path.join(javaDir,'PrivateGatherIncomingCallActivity.kt');

    if(!fs.existsSync(servicePath))throw new Error(`Private Gather call service missing at ${servicePath}`);
    if(!fs.existsSync(activityPath))throw new Error(`Private Gather incoming call activity missing at ${activityPath}`);

    let service=fs.readFileSync(servicePath,'utf8');
    service=service.replace(
      'private const val CHANNEL_ID = "pg-calls-v199"',
      'private const val CHANNEL_ID = "pg-calls-v200"'
    );
    if(!service.includes('.setOnlyAlertOnce(true)')){
      const marker='      .setAutoCancel(false)';
      if(!service.includes(marker))throw new Error('Private Gather notification builder marker not found');
      service=service.replace(marker,`${marker}\n      .setOnlyAlertOnce(true)`);
    }
    fs.writeFileSync(servicePath,service);

    let activity=fs.readFileSync(activityPath,'utf8');
    if(!activity.includes('import android.app.NotificationManager')){
      activity=activity.replace('import android.app.Activity','import android.app.Activity\nimport android.app.NotificationManager');
    }
    if(!activity.includes('import android.content.Context')){
      activity=activity.replace('import android.content.Intent','import android.content.Context\nimport android.content.Intent');
    }
    if(!activity.includes('PG_CANCEL_CALL_NOTIFICATION_REV5')){
      const marker='  private fun openApp(action:String){\n    stopCamera()\n    val source=intent?.data ?: return finish()';
      if(!activity.includes(marker))throw new Error('Private Gather incoming activity openApp marker not found');
      const replacement=`  private fun openApp(action:String){\n    stopCamera()\n    val source=intent?.data ?: return finish()\n    // PG_CANCEL_CALL_NOTIFICATION_REV5 — stop the native ringtone/notification\n    // before handing Answer or Decline back to React Native.\n    try {\n      val callId=source.getQueryParameter("call_id") ?: ""\n      val requestCode=callId.toIntOrNull() ?: callId.hashCode()\n      val manager=getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager\n      manager.cancel(41000 + (requestCode and 0x0fff))\n    } catch (_:Throwable) {}`;
      activity=activity.replace(marker,replacement);
    }
    fs.writeFileSync(activityPath,activity);
    return config;
  }]);
};
