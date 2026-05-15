// swift-tools-version: 6.2
// Package manifest for the NanoClawd macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "NanoClawd",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "NanoClawdIPC", targets: ["NanoClawdIPC"]),
        .library(name: "NanoClawdDiscovery", targets: ["NanoClawdDiscovery"]),
        .executable(name: "NanoClawd", targets: ["NanoClawd"]),
        .executable(name: "nanoclawd-mac", targets: ["NanoClawdMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.3.0"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/NanoClawdKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "NanoClawdIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "NanoClawdDiscovery",
            dependencies: [
                .product(name: "NanoClawdKit", package: "NanoClawdKit"),
            ],
            path: "Sources/NanoClawdDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "NanoClawd",
            dependencies: [
                "NanoClawdIPC",
                "NanoClawdDiscovery",
                .product(name: "NanoClawdKit", package: "NanoClawdKit"),
                .product(name: "NanoClawdChatUI", package: "NanoClawdKit"),
                .product(name: "NanoClawdProtocol", package: "NanoClawdKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/NanoClawd.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "NanoClawdMacCLI",
            dependencies: [
                "NanoClawdDiscovery",
                .product(name: "NanoClawdKit", package: "NanoClawdKit"),
                .product(name: "NanoClawdProtocol", package: "NanoClawdKit"),
            ],
            path: "Sources/NanoClawdMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "NanoClawdIPCTests",
            dependencies: [
                "NanoClawdIPC",
                "NanoClawd",
                "NanoClawdDiscovery",
                .product(name: "NanoClawdProtocol", package: "NanoClawdKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
