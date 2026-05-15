package ai.nanoclawd.app.voice

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class VoiceWakeCommandExtractorTest {
  @Test
  fun extractsCommandAfterTriggerWord() {
    val res = VoiceWakeCommandExtractor.extractCommand("Clawd take a photo", listOf("nanoclawd", "clawd"))
    assertEquals("take a photo", res)
  }

  @Test
  fun extractsCommandWithPunctuation() {
    val res = VoiceWakeCommandExtractor.extractCommand("hey nanoclawd, what's the weather?", listOf("nanoclawd"))
    assertEquals("what's the weather?", res)
  }

  @Test
  fun returnsNullWhenNoCommandProvided() {
    assertNull(VoiceWakeCommandExtractor.extractCommand("clawd", listOf("clawd")))
    assertNull(VoiceWakeCommandExtractor.extractCommand("hey clawd!", listOf("clawd")))
  }
}
