package ai.nanoclawd.app.node

import ai.nanoclawd.app.protocol.NanoClawdCalendarCommand
import ai.nanoclawd.app.protocol.NanoClawdCanvasA2UICommand
import ai.nanoclawd.app.protocol.NanoClawdCanvasCommand
import ai.nanoclawd.app.protocol.NanoClawdCameraCommand
import ai.nanoclawd.app.protocol.NanoClawdCapability
import ai.nanoclawd.app.protocol.NanoClawdContactsCommand
import ai.nanoclawd.app.protocol.NanoClawdDeviceCommand
import ai.nanoclawd.app.protocol.NanoClawdLocationCommand
import ai.nanoclawd.app.protocol.NanoClawdMotionCommand
import ai.nanoclawd.app.protocol.NanoClawdNotificationsCommand
import ai.nanoclawd.app.protocol.NanoClawdPhotosCommand
import ai.nanoclawd.app.protocol.NanoClawdSmsCommand
import ai.nanoclawd.app.protocol.NanoClawdSystemCommand

data class NodeRuntimeFlags(
  val cameraEnabled: Boolean,
  val locationEnabled: Boolean,
  val smsAvailable: Boolean,
  val voiceWakeEnabled: Boolean,
  val motionActivityAvailable: Boolean,
  val motionPedometerAvailable: Boolean,
  val debugBuild: Boolean,
)

enum class InvokeCommandAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  MotionActivityAvailable,
  MotionPedometerAvailable,
  DebugBuild,
}

enum class NodeCapabilityAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  VoiceWakeEnabled,
  MotionAvailable,
}

data class NodeCapabilitySpec(
  val name: String,
  val availability: NodeCapabilityAvailability = NodeCapabilityAvailability.Always,
)

data class InvokeCommandSpec(
  val name: String,
  val requiresForeground: Boolean = false,
  val availability: InvokeCommandAvailability = InvokeCommandAvailability.Always,
)

object InvokeCommandRegistry {
  val capabilityManifest: List<NodeCapabilitySpec> =
    listOf(
      NodeCapabilitySpec(name = NanoClawdCapability.Canvas.rawValue),
      NodeCapabilitySpec(name = NanoClawdCapability.Device.rawValue),
      NodeCapabilitySpec(name = NanoClawdCapability.Notifications.rawValue),
      NodeCapabilitySpec(name = NanoClawdCapability.System.rawValue),
      NodeCapabilitySpec(
        name = NanoClawdCapability.Camera.rawValue,
        availability = NodeCapabilityAvailability.CameraEnabled,
      ),
      NodeCapabilitySpec(
        name = NanoClawdCapability.Sms.rawValue,
        availability = NodeCapabilityAvailability.SmsAvailable,
      ),
      NodeCapabilitySpec(
        name = NanoClawdCapability.VoiceWake.rawValue,
        availability = NodeCapabilityAvailability.VoiceWakeEnabled,
      ),
      NodeCapabilitySpec(
        name = NanoClawdCapability.Location.rawValue,
        availability = NodeCapabilityAvailability.LocationEnabled,
      ),
      NodeCapabilitySpec(name = NanoClawdCapability.Photos.rawValue),
      NodeCapabilitySpec(name = NanoClawdCapability.Contacts.rawValue),
      NodeCapabilitySpec(name = NanoClawdCapability.Calendar.rawValue),
      NodeCapabilitySpec(
        name = NanoClawdCapability.Motion.rawValue,
        availability = NodeCapabilityAvailability.MotionAvailable,
      ),
    )

  val all: List<InvokeCommandSpec> =
    listOf(
      InvokeCommandSpec(
        name = NanoClawdCanvasCommand.Present.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoClawdCanvasCommand.Hide.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoClawdCanvasCommand.Navigate.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoClawdCanvasCommand.Eval.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoClawdCanvasCommand.Snapshot.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoClawdCanvasA2UICommand.Push.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoClawdCanvasA2UICommand.PushJSONL.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoClawdCanvasA2UICommand.Reset.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NanoClawdSystemCommand.Notify.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoClawdCameraCommand.List.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = NanoClawdCameraCommand.Snap.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = NanoClawdCameraCommand.Clip.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = NanoClawdLocationCommand.Get.rawValue,
        availability = InvokeCommandAvailability.LocationEnabled,
      ),
      InvokeCommandSpec(
        name = NanoClawdDeviceCommand.Status.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoClawdDeviceCommand.Info.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoClawdDeviceCommand.Permissions.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoClawdDeviceCommand.Health.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoClawdNotificationsCommand.List.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoClawdNotificationsCommand.Actions.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoClawdPhotosCommand.Latest.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoClawdContactsCommand.Search.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoClawdContactsCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoClawdCalendarCommand.Events.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoClawdCalendarCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = NanoClawdMotionCommand.Activity.rawValue,
        availability = InvokeCommandAvailability.MotionActivityAvailable,
      ),
      InvokeCommandSpec(
        name = NanoClawdMotionCommand.Pedometer.rawValue,
        availability = InvokeCommandAvailability.MotionPedometerAvailable,
      ),
      InvokeCommandSpec(
        name = NanoClawdSmsCommand.Send.rawValue,
        availability = InvokeCommandAvailability.SmsAvailable,
      ),
      InvokeCommandSpec(
        name = "debug.logs",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
      InvokeCommandSpec(
        name = "debug.ed25519",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
    )

  private val byNameInternal: Map<String, InvokeCommandSpec> = all.associateBy { it.name }

  fun find(command: String): InvokeCommandSpec? = byNameInternal[command]

  fun advertisedCapabilities(flags: NodeRuntimeFlags): List<String> {
    return capabilityManifest
      .filter { spec ->
        when (spec.availability) {
          NodeCapabilityAvailability.Always -> true
          NodeCapabilityAvailability.CameraEnabled -> flags.cameraEnabled
          NodeCapabilityAvailability.LocationEnabled -> flags.locationEnabled
          NodeCapabilityAvailability.SmsAvailable -> flags.smsAvailable
          NodeCapabilityAvailability.VoiceWakeEnabled -> flags.voiceWakeEnabled
          NodeCapabilityAvailability.MotionAvailable -> flags.motionActivityAvailable || flags.motionPedometerAvailable
        }
      }
      .map { it.name }
  }

  fun advertisedCommands(flags: NodeRuntimeFlags): List<String> {
    return all
      .filter { spec ->
        when (spec.availability) {
          InvokeCommandAvailability.Always -> true
          InvokeCommandAvailability.CameraEnabled -> flags.cameraEnabled
          InvokeCommandAvailability.LocationEnabled -> flags.locationEnabled
          InvokeCommandAvailability.SmsAvailable -> flags.smsAvailable
          InvokeCommandAvailability.MotionActivityAvailable -> flags.motionActivityAvailable
          InvokeCommandAvailability.MotionPedometerAvailable -> flags.motionPedometerAvailable
          InvokeCommandAvailability.DebugBuild -> flags.debugBuild
        }
      }
      .map { it.name }
  }
}
