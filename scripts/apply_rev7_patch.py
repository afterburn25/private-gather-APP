from pathlib import Path


def rep(path: str, old: str, new: str, label: str) -> None:
    p = Path(path)
    s = p.read_text()
    if old not in s:
        raise SystemExit(f"NOT FOUND: {label}")
    p.write_text(s.replace(old, new, 1))
    print("patched", label)


rep(
    "App.tsx",
    "    setCall(prev=>prev?.id&&prev.id!==id?prev:{id,mode,peer,status:'incoming',photoUrl,incoming:true});",
    "    setCall(prev=>prev?.id&&prev.id!==id?prev:{...prev,id,mode,peer,status:'incoming',photoUrl,incoming:true});",
    "preserve incoming preview state",
)

rep(
    "src/screens/CallScreen.tsx",
    "import {Pressable,StatusBar,StyleSheet,Text,View} from 'react-native';",
    "import {Pressable,StatusBar,StyleSheet,Text,useWindowDimensions,View} from 'react-native';",
    "window dimensions import",
)
rep(
    "src/screens/CallScreen.tsx",
    " const insets=useSafeAreaInsets();\n const [muted,setMuted]=useState(false);const [videoOn,setVideoOn]=useState(call.mode==='video');",
    " const insets=useSafeAreaInsets();\n const {width,height}=useWindowDimensions();\n const [muted,setMuted]=useState(false);const [videoOn,setVideoOn]=useState(call.mode==='video');",
    "window dimensions hook",
)
rep(
    "src/screens/CallScreen.tsx",
    ' return <View style={s.page}><StatusBar hidden barStyle="light-content"/>',
    ' return <View style={[s.page,{width,height}]}><StatusBar hidden barStyle="light-content"/>',
    "full window root",
)
rep(
    "src/screens/CallScreen.tsx",
    " page:{...StyleSheet.absoluteFill,backgroundColor:'#02050a',overflow:'hidden'},",
    " page:{flex:1,width:'100%',height:'100%',backgroundColor:'#02050a',overflow:'hidden'},",
    "flex call page",
)

rep(
    "src/calls/CallManager.ts",
    "    // Samsung and several Android camera stacks do not reliably allow a second\n"
    "    // getUserMedia request while the preview stream still owns the camera.\n"
    "    this.clearIncomingPreview();\n"
    "    if(preparedLocal){\n"
    "      this.local=preparedLocal;\n"
    "    }else{\n"
    "      this.local=await this.captureLocal(this.mode,true);\n"
    "    }",
    "    // Rev7: transfer the already-running incoming video preview into the live\n"
    "    // call instead of stopping/reopening the camera. Add only a microphone track.\n"
    "    let promotedPreview:MediaStream|undefined;\n"
    "    if(!preparedLocal&&this.mode==='video'&&this.preview&&this.previewCallId===callId){\n"
    "      promotedPreview=this.preview;this.preview=undefined;this.previewCallId=0;\n"
    "      try{\n"
    "        const mic=await this.captureLocal('voice',true);\n"
    "        for(const track of mic.getAudioTracks?.()||[])promotedPreview.addTrack(track);\n"
    "      }catch(e){\n"
    "        try{promotedPreview.getTracks().forEach(t=>t.stop())}catch{}\n"
    "        throw e;\n"
    "      }\n"
    "    }else{\n"
    "      this.clearIncomingPreview();\n"
    "    }\n"
    "    if(preparedLocal){\n"
    "      this.local=preparedLocal;\n"
    "    }else if(promotedPreview){\n"
    "      this.local=promotedPreview;\n"
    "    }else{\n"
    "      this.local=await this.captureLocal(this.mode,true);\n"
    "    }",
    "promote incoming preview",
)

plugin = Path("plugins/withPrivateGatherNativeCalling.js")
s = plugin.read_text()


def ps(old: str, new: str, label: str) -> None:
    global s
    if old not in s:
        raise SystemExit(f"NOT FOUND plugin: {label}")
    s = s.replace(old, new, 1)
    print("patched plugin", label)


ps(
    "import android.graphics.Color\nimport android.graphics.SurfaceTexture",
    "import android.graphics.Color\nimport android.graphics.Matrix\nimport android.graphics.RectF\nimport android.graphics.SurfaceTexture",
    "matrix imports",
)
ps("pg-calls-v199", "pg-calls-v202", "new notification channel")

# Remove the original callId declaration before inserting the dedupe guard.
ps(
    r'''    val callId = data[\"call_id\"] ?: return
    val caller = data[\"caller_name\"] ?: \"Private Gather member\"''',
    r'''    val caller = data[\"caller_name\"] ?: \"Private Gather member\"''',
    "move callId declaration",
)

show = "  private fun showIncomingCall(data: Map<String, String>) {\n"
insert = r'''    val callId = data[\"call_id\"] ?: return
    val now = System.currentTimeMillis()
    val prefs = getSharedPreferences(\"private-gather-call-alert-v202\", Context.MODE_PRIVATE)
    val lastId = prefs.getString(\"last_call_id\", \"\") ?: \"\"
    val lastAt = prefs.getLong(\"last_call_at\", 0L)
    if (lastId == callId && now - lastAt < 120000L) return
    prefs.edit().putString(\"last_call_id\", callId).putLong(\"last_call_at\", now).apply()
'''
ps(show, show + insert, "incoming notification dedupe")

ps(
    "      .setAutoCancel(false)\n      .setSound(sound)",
    "      .setAutoCancel(false)\n      .setOnlyAlertOnce(true)\n      .setSound(sound)",
    "only alert once",
)
ps(
    "  private var camera:Camera?=null\n  private lateinit var preview:TextureView\n  private var videoCall=false",
    "  private var camera:Camera?=null\n  private lateinit var preview:TextureView\n  private var videoCall=false\n  private var previewBufferWidth=0\n  private var previewBufferHeight=0",
    "preview dimensions",
)

old_camera = """  private fun startCamera(){
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
  }"""
new_camera = """  private fun applyPreviewCenterCrop(){
    val viewWidth=preview.width;val viewHeight=preview.height
    if(viewWidth<=0||viewHeight<=0||previewBufferWidth<=0||previewBufferHeight<=0)return
    val viewRect=RectF(0f,0f,viewWidth.toFloat(),viewHeight.toFloat())
    val bufferRect=RectF(0f,0f,previewBufferWidth.toFloat(),previewBufferHeight.toFloat())
    val centerX=viewRect.centerX();val centerY=viewRect.centerY()
    bufferRect.offset(centerX-bufferRect.centerX(),centerY-bufferRect.centerY())
    val matrix=Matrix()
    matrix.setRectToRect(viewRect,bufferRect,Matrix.ScaleToFit.FILL)
    val scale=kotlin.math.max(viewWidth.toFloat()/previewBufferWidth.toFloat(),viewHeight.toFloat()/previewBufferHeight.toFloat())
    matrix.postScale(scale,scale,centerX,centerY)
    preview.setTransform(matrix)
  }
  private fun startCamera(){
    if(!videoCall||camera!=null||checkSelfPermission(Manifest.permission.CAMERA)!=PackageManager.PERMISSION_GRANTED||!preview.isAvailable)return
    try{
      val id=frontCameraId();if(id<0)return
      val info=Camera.CameraInfo();Camera.getCameraInfo(id,info)
      val opened=Camera.open(id)
      val params=opened.parameters
      val chosen=params.supportedPreviewSizes?.filter{it.width>=640&&it.height>=360}?.minByOrNull{
        abs((it.width.toFloat()/it.height.toFloat())-(16f/9f))*100000f + abs((it.width*it.height)-(1280*720)).toFloat()/1000f
      } ?: params.supportedPreviewSizes?.firstOrNull()
      if(chosen!=null)params.setPreviewSize(chosen.width,chosen.height)
      if(params.isZoomSupported)params.zoom=0
      opened.parameters=params
      val rotation=windowManager.defaultDisplay.rotation
      val degrees=when(rotation){Surface.ROTATION_90->90;Surface.ROTATION_180->180;Surface.ROTATION_270->270;else->0}
      var result=(info.orientation+degrees)%360;result=(360-result)%360
      opened.setDisplayOrientation(result)
      if(chosen!=null){
        previewBufferWidth=if(result==90||result==270)chosen.height else chosen.width
        previewBufferHeight=if(result==90||result==270)chosen.width else chosen.height
      }
      opened.setPreviewTexture(preview.surfaceTexture);opened.startPreview();camera=opened
      preview.post{applyPreviewCenterCrop()}
    }catch(_:Throwable){stopCamera()}
  }"""
ps(old_camera, new_camera, "center crop camera")
ps(
    "  override fun onSurfaceTextureSizeChanged(surface:SurfaceTexture,width:Int,height:Int){}",
    "  override fun onSurfaceTextureSizeChanged(surface:SurfaceTexture,width:Int,height:Int){applyPreviewCenterCrop()}",
    "resize center crop",
)
plugin.write_text(s)

Path("RELEASE-1.1.200-REV7.md").write_text(
    "# Private Gather Native 1.1.200 Rev7 — Video Surface & Incoming Ringer Stability Hotfix\n\n"
    "Prepared after physical-device Rev6 testing. Semantic app version remains 1.1.200.\n\n"
    "- Preserve incoming preview state across duplicate incoming-call events.\n"
    "- Promote the pre-answer video stream into the answered call; acquire microphone only.\n"
    "- Explicit full-window React RTC call surface.\n"
    "- Deduplicate repeated Android incoming-call notifications for the same call.\n"
    "- setOnlyAlertOnce and new call notification channel.\n"
    "- 16:9 native preview selection plus center-crop transform.\n\n"
    "Prepared candidate only until physical-device acceptance.\n"
)
