package ai.nanoclawd.app.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class NanoClawdProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", NanoClawdCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", NanoClawdCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", NanoClawdCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", NanoClawdCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", NanoClawdCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", NanoClawdCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", NanoClawdCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", NanoClawdCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", NanoClawdCapability.Canvas.rawValue)
    assertEquals("camera", NanoClawdCapability.Camera.rawValue)
    assertEquals("voiceWake", NanoClawdCapability.VoiceWake.rawValue)
    assertEquals("location", NanoClawdCapability.Location.rawValue)
    assertEquals("sms", NanoClawdCapability.Sms.rawValue)
    assertEquals("device", NanoClawdCapability.Device.rawValue)
    assertEquals("notifications", NanoClawdCapability.Notifications.rawValue)
    assertEquals("system", NanoClawdCapability.System.rawValue)
    assertEquals("photos", NanoClawdCapability.Photos.rawValue)
    assertEquals("contacts", NanoClawdCapability.Contacts.rawValue)
    assertEquals("calendar", NanoClawdCapability.Calendar.rawValue)
    assertEquals("motion", NanoClawdCapability.Motion.rawValue)
  }

  @Test
  fun cameraCommandsUseStableStrings() {
    assertEquals("camera.list", NanoClawdCameraCommand.List.rawValue)
    assertEquals("camera.snap", NanoClawdCameraCommand.Snap.rawValue)
    assertEquals("camera.clip", NanoClawdCameraCommand.Clip.rawValue)
  }

  @Test
  fun notificationsCommandsUseStableStrings() {
    assertEquals("notifications.list", NanoClawdNotificationsCommand.List.rawValue)
    assertEquals("notifications.actions", NanoClawdNotificationsCommand.Actions.rawValue)
  }

  @Test
  fun deviceCommandsUseStableStrings() {
    assertEquals("device.status", NanoClawdDeviceCommand.Status.rawValue)
    assertEquals("device.info", NanoClawdDeviceCommand.Info.rawValue)
    assertEquals("device.permissions", NanoClawdDeviceCommand.Permissions.rawValue)
    assertEquals("device.health", NanoClawdDeviceCommand.Health.rawValue)
  }

  @Test
  fun systemCommandsUseStableStrings() {
    assertEquals("system.notify", NanoClawdSystemCommand.Notify.rawValue)
  }

  @Test
  fun photosCommandsUseStableStrings() {
    assertEquals("photos.latest", NanoClawdPhotosCommand.Latest.rawValue)
  }

  @Test
  fun contactsCommandsUseStableStrings() {
    assertEquals("contacts.search", NanoClawdContactsCommand.Search.rawValue)
    assertEquals("contacts.add", NanoClawdContactsCommand.Add.rawValue)
  }

  @Test
  fun calendarCommandsUseStableStrings() {
    assertEquals("calendar.events", NanoClawdCalendarCommand.Events.rawValue)
    assertEquals("calendar.add", NanoClawdCalendarCommand.Add.rawValue)
  }

  @Test
  fun motionCommandsUseStableStrings() {
    assertEquals("motion.activity", NanoClawdMotionCommand.Activity.rawValue)
    assertEquals("motion.pedometer", NanoClawdMotionCommand.Pedometer.rawValue)
  }
}
