package ai.nanoclawd.app.node

import ai.nanoclawd.app.protocol.NanoClawdCalendarCommand
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
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class InvokeCommandRegistryTest {
  private val coreCapabilities =
    setOf(
      NanoClawdCapability.Canvas.rawValue,
      NanoClawdCapability.Device.rawValue,
      NanoClawdCapability.Notifications.rawValue,
      NanoClawdCapability.System.rawValue,
      NanoClawdCapability.Photos.rawValue,
      NanoClawdCapability.Contacts.rawValue,
      NanoClawdCapability.Calendar.rawValue,
    )

  private val optionalCapabilities =
    setOf(
      NanoClawdCapability.Camera.rawValue,
      NanoClawdCapability.Location.rawValue,
      NanoClawdCapability.Sms.rawValue,
      NanoClawdCapability.VoiceWake.rawValue,
      NanoClawdCapability.Motion.rawValue,
    )

  private val coreCommands =
    setOf(
      NanoClawdDeviceCommand.Status.rawValue,
      NanoClawdDeviceCommand.Info.rawValue,
      NanoClawdDeviceCommand.Permissions.rawValue,
      NanoClawdDeviceCommand.Health.rawValue,
      NanoClawdNotificationsCommand.List.rawValue,
      NanoClawdNotificationsCommand.Actions.rawValue,
      NanoClawdSystemCommand.Notify.rawValue,
      NanoClawdPhotosCommand.Latest.rawValue,
      NanoClawdContactsCommand.Search.rawValue,
      NanoClawdContactsCommand.Add.rawValue,
      NanoClawdCalendarCommand.Events.rawValue,
      NanoClawdCalendarCommand.Add.rawValue,
    )

  private val optionalCommands =
    setOf(
      NanoClawdCameraCommand.Snap.rawValue,
      NanoClawdCameraCommand.Clip.rawValue,
      NanoClawdCameraCommand.List.rawValue,
      NanoClawdLocationCommand.Get.rawValue,
      NanoClawdMotionCommand.Activity.rawValue,
      NanoClawdMotionCommand.Pedometer.rawValue,
      NanoClawdSmsCommand.Send.rawValue,
    )

  private val debugCommands = setOf("debug.logs", "debug.ed25519")

  @Test
  fun advertisedCapabilities_respectsFeatureAvailability() {
    val capabilities = InvokeCommandRegistry.advertisedCapabilities(defaultFlags())

    assertContainsAll(capabilities, coreCapabilities)
    assertMissingAll(capabilities, optionalCapabilities)
  }

  @Test
  fun advertisedCapabilities_includesFeatureCapabilitiesWhenEnabled() {
    val capabilities =
      InvokeCommandRegistry.advertisedCapabilities(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          voiceWakeEnabled = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
        ),
      )

    assertContainsAll(capabilities, coreCapabilities + optionalCapabilities)
  }

  @Test
  fun advertisedCommands_respectsFeatureAvailability() {
    val commands = InvokeCommandRegistry.advertisedCommands(defaultFlags())

    assertContainsAll(commands, coreCommands)
    assertMissingAll(commands, optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_includesFeatureCommandsWhenEnabled() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        defaultFlags(
          cameraEnabled = true,
          locationEnabled = true,
          smsAvailable = true,
          motionActivityAvailable = true,
          motionPedometerAvailable = true,
          debugBuild = true,
        ),
      )

    assertContainsAll(commands, coreCommands + optionalCommands + debugCommands)
  }

  @Test
  fun advertisedCommands_onlyIncludesSupportedMotionCommands() {
    val commands =
      InvokeCommandRegistry.advertisedCommands(
        NodeRuntimeFlags(
          cameraEnabled = false,
          locationEnabled = false,
          smsAvailable = false,
          voiceWakeEnabled = false,
          motionActivityAvailable = true,
          motionPedometerAvailable = false,
          debugBuild = false,
        ),
      )

    assertTrue(commands.contains(NanoClawdMotionCommand.Activity.rawValue))
    assertFalse(commands.contains(NanoClawdMotionCommand.Pedometer.rawValue))
  }

  private fun defaultFlags(
    cameraEnabled: Boolean = false,
    locationEnabled: Boolean = false,
    smsAvailable: Boolean = false,
    voiceWakeEnabled: Boolean = false,
    motionActivityAvailable: Boolean = false,
    motionPedometerAvailable: Boolean = false,
    debugBuild: Boolean = false,
  ): NodeRuntimeFlags =
    NodeRuntimeFlags(
      cameraEnabled = cameraEnabled,
      locationEnabled = locationEnabled,
      smsAvailable = smsAvailable,
      voiceWakeEnabled = voiceWakeEnabled,
      motionActivityAvailable = motionActivityAvailable,
      motionPedometerAvailable = motionPedometerAvailable,
      debugBuild = debugBuild,
    )

  private fun assertContainsAll(actual: List<String>, expected: Set<String>) {
    expected.forEach { value -> assertTrue(actual.contains(value)) }
  }

  private fun assertMissingAll(actual: List<String>, forbidden: Set<String>) {
    forbidden.forEach { value -> assertFalse(actual.contains(value)) }
  }
}
