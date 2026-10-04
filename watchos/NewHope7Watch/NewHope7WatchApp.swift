import SwiftUI

@main
struct NewHope7WatchApp: App {
    @AppStorage("nh7WatchLanguage") private var language = "fa"

    var body: some Scene {
        WindowGroup {
            RootView(language: $language)
        }
    }
}

struct RootView: View {
    @Binding var language: String

    var body: some View {
        TabView {
            BibleRootView(language: $language)
            AudioRootView(language: $language)
            SettingsView(language: $language)
        }
        .tabViewStyle(.verticalPage)
    }
}

struct SettingsView: View {
    @Binding var language: String

    var body: some View {
        NavigationStack {
            List {
                Picker("Language", selection: $language) {
                    Text("فارسی").tag("fa")
                    Text("English").tag("en")
                    Text("Hrvatski").tag("hr")
                }
            }
            .navigationTitle("New Hope 7")
        }
    }
}
