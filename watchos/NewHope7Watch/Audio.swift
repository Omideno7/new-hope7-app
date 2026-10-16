import SwiftUI

// Intentionally no player/catalog/URL/session transport. Historical raw sermon URLs are unsafe.
struct WatchAudioAvailabilityView: View {
    let language: String
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    Image(systemName: "iphone").accessibilityHidden(true)
                    Text(WatchCopy.text("audioPhone", language))
                        .font(.body)
                        .multilineTextAlignment(.leading)
                }.padding()
            }
            .navigationTitle(WatchCopy.text("audio", language))
        }
    }
}
