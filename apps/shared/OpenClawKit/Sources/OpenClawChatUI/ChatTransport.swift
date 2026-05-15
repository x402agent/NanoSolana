import Foundation

public enum NanoClawdChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(NanoClawdChatEventPayload)
    case agent(NanoClawdAgentEventPayload)
    case seqGap
}

public protocol NanoClawdChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> NanoClawdChatHistoryPayload
    func listModels() async throws -> [NanoClawdChatModelChoice]
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [NanoClawdChatAttachmentPayload]) async throws -> NanoClawdChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> NanoClawdChatSessionsListResponse
    func setSessionModel(sessionKey: String, model: String?) async throws
    func setSessionThinking(sessionKey: String, thinkingLevel: String) async throws

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<NanoClawdChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
}

extension NanoClawdChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "NanoClawdChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> NanoClawdChatSessionsListResponse {
        throw NSError(
            domain: "NanoClawdChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }

    public func listModels() async throws -> [NanoClawdChatModelChoice] {
        throw NSError(
            domain: "NanoClawdChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "models.list not supported by this transport"])
    }

    public func setSessionModel(sessionKey _: String, model _: String?) async throws {
        throw NSError(
            domain: "NanoClawdChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.patch(model) not supported by this transport"])
    }

    public func setSessionThinking(sessionKey _: String, thinkingLevel _: String) async throws {
        throw NSError(
            domain: "NanoClawdChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.patch(thinkingLevel) not supported by this transport"])
    }
}
