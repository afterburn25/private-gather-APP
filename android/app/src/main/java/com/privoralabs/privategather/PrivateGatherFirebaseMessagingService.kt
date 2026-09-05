package com.privoralabs.privategather

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
      .setContentText("$caller · ${if (mode == "video") "Video" else "Voice"} call")
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
