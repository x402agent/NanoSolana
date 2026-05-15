import Foundation

public enum NanoClawdCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum NanoClawdCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum NanoClawdCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum NanoClawdCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct NanoClawdCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: NanoClawdCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: NanoClawdCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: NanoClawdCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: NanoClawdCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct NanoClawdCameraClipParams: Codable, Sendable, Equatable {
    public var facing: NanoClawdCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: NanoClawdCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: NanoClawdCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: NanoClawdCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
