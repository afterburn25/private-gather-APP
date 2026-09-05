package com.privoralabs.privategather

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
