import Foundation

public enum NanoClawdDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum NanoClawdBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum NanoClawdThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum NanoClawdNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum NanoClawdNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct NanoClawdBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: NanoClawdBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: NanoClawdBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct NanoClawdThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: NanoClawdThermalState

    public init(state: NanoClawdThermalState) {
        self.state = state
    }
}

public struct NanoClawdStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct NanoClawdNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: NanoClawdNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [NanoClawdNetworkInterfaceType]

    public init(
        status: NanoClawdNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [NanoClawdNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct NanoClawdDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: NanoClawdBatteryStatusPayload
    public var thermal: NanoClawdThermalStatusPayload
    public var storage: NanoClawdStorageStatusPayload
    public var network: NanoClawdNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: NanoClawdBatteryStatusPayload,
        thermal: NanoClawdThermalStatusPayload,
        storage: NanoClawdStorageStatusPayload,
        network: NanoClawdNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct NanoClawdDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
