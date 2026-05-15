// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "NanoClawdKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "NanoClawdProtocol", targets: ["NanoClawdProtocol"]),
        .library(name: "NanoClawdKit", targets: ["NanoClawdKit"]),
        .library(name: "NanoClawdChatUI", targets: ["NanoClawdChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "NanoClawdProtocol",
            path: "Sources/NanoClawdProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "NanoClawdKit",
            dependencies: [
                "NanoClawdProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/NanoClawdKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "NanoClawdChatUI",
            dependencies: [
                "NanoClawdKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/NanoClawdChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "NanoClawdKitTests",
            dependencies: ["NanoClawdKit", "NanoClawdChatUI"],
            path: "Tests/NanoClawdKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
