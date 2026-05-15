import Foundation

public enum NanoClawdLocationMode: String, Codable, Sendable, CaseIterable {
    case off
    case whileUsing
    case always
}
