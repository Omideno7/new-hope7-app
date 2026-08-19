# Build Notes

The iOS wrapper is intentionally isolated from production web files. GitHub Actions generates the Xcode project from the current repository state and performs unsigned simulator/device builds before any signing or TestFlight work.
