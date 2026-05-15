import Foundation
import SwabbleKit
import Testing
@testable import NanoClawd

struct VoiceWakeRuntimeTests {
    @Test func `trims after trigger keeps post speech`() {
        let triggers = ["clawd", "nanoclawd"]
        let text = "hey Clawd how are you"
        #expect(VoiceWakeRuntime._testTrimmedAfterTrigger(text, triggers: triggers) == "how are you")
    }

    @Test func `trims after trigger returns original when no trigger`() {
        let triggers = ["clawd"]
        let text = "good morning friend"
        #expect(VoiceWakeRuntime._testTrimmedAfterTrigger(text, triggers: triggers) == text)
    }

    @Test func `trims after first matching trigger`() {
        let triggers = ["buddy", "clawd"]
        let text = "hello buddy this is after trigger clawd also here"
        #expect(VoiceWakeRuntime
            ._testTrimmedAfterTrigger(text, triggers: triggers) == "this is after trigger clawd also here")
    }

    @Test func `has content after trigger false when only trigger`() {
        let triggers = ["nanoclawd"]
        let text = "hey nanoclawd"
        #expect(!VoiceWakeRuntime._testHasContentAfterTrigger(text, triggers: triggers))
    }

    @Test func `has content after trigger true when speech continues`() {
        let triggers = ["clawd"]
        let text = "clawd write a note"
        #expect(VoiceWakeRuntime._testHasContentAfterTrigger(text, triggers: triggers))
    }

    @Test func `trims after chinese trigger keeps post speech`() {
        let triggers = ["小爪", "nanoclawd"]
        let text = "嘿 小爪 帮我打开设置"
        #expect(VoiceWakeRuntime._testTrimmedAfterTrigger(text, triggers: triggers) == "帮我打开设置")
    }

    @Test func `trims after trigger handles width insensitive forms`() {
        let triggers = ["nanoclawd"]
        let text = "ＯｐｅｎＣｌａｗ 请帮我"
        #expect(VoiceWakeRuntime._testTrimmedAfterTrigger(text, triggers: triggers) == "请帮我")
    }

    @Test func `gate requires gap between trigger and command`() {
        let transcript = "hey nanoclawd do thing"
        let segments = makeWakeWordSegments(
            transcript: transcript,
            words: [
                ("hey", 0.0, 0.1),
                ("nanoclawd", 0.2, 0.1),
                ("do", 0.35, 0.1),
                ("thing", 0.5, 0.1),
            ])
        let config = WakeWordGateConfig(triggers: ["nanoclawd"], minPostTriggerGap: 0.3)
        #expect(WakeWordGate.match(transcript: transcript, segments: segments, config: config) == nil)
    }

    @Test func `gate accepts gap and extracts command`() {
        let transcript = "hey nanoclawd do thing"
        let segments = makeWakeWordSegments(
            transcript: transcript,
            words: [
                ("hey", 0.0, 0.1),
                ("nanoclawd", 0.2, 0.1),
                ("do", 0.9, 0.1),
                ("thing", 1.1, 0.1),
            ])
        let config = WakeWordGateConfig(triggers: ["nanoclawd"], minPostTriggerGap: 0.3)
        #expect(WakeWordGate.match(transcript: transcript, segments: segments, config: config)?.command == "do thing")
    }
}
