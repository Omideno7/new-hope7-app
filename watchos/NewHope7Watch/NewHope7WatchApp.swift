import SwiftUI

// Local language preference only. No account/session/URL/token or personal cache on Watch.
@main
struct NewHope7WatchApp: App {
    @AppStorage("nh7WatchLanguage") private var selectedLanguage = "fa"
    private var language: String { ["fa", "en", "hr"].contains(selectedLanguage) ? selectedLanguage : "en" }
    var body: some Scene {
        WindowGroup {
            TabView {
                BibleRootView(language: language)
                WatchAudioAvailabilityView(language: language)
                NavigationStack {
                    Form {
                        Picker(WatchCopy.text("language", language), selection: $selectedLanguage) {
                            Text("فارسی").tag("fa")
                            Text("English").tag("en")
                            Text("Hrvatski").tag("hr")
                        }
                        .accessibilityLabel(WatchCopy.text("language", language))
                    }
                    .navigationTitle(WatchCopy.text("settings", language))
                }
            }
            .tabViewStyle(.verticalPage)
            .environment(\.layoutDirection, language == "fa" ? .rightToLeft : .leftToRight)
            .environment(\.locale, Locale(identifier: language))
        }
    }
}

enum WatchCopy {
    static let values: [String: [String]] = [
        "bible": ["کتاب مقدس", "Bible", "Biblija"],
        "language": ["زبان", "Language", "Jezik"],
        "settings": ["تنظیمات", "Settings", "Postavke"],
        "chapter": ["باب", "Chapter", "Poglavlje"],
        "unavailable": ["متن در دسترس نیست", "Reading unavailable", "Čitanje nije dostupno"],
        "retry": ["تلاش دوباره", "Try again", "Pokušaj ponovno"],
        "resources": ["متن آفلاین این نسخه در دسترس نیست.", "This build's offline text is unavailable.", "Izvanmrežni tekst ove verzije nije dostupan."],
        "audio": ["پیام‌های صوتی", "Audio messages", "Audio poruke"],
        "audioPhone": ["پیام‌های صوتی را در برنامهٔ New Hope 7 روی آیفون باز کنید. پخش روی ساعت هنوز در دسترس نیست.", "Open audio in New Hope 7 on your iPhone. Watch playback is not available yet.", "Otvorite audio u aplikaciji New Hope 7 na iPhoneu. Reprodukcija na satu još nije dostupna."]
    ]
    static func text(_ key: String, _ language: String) -> String {
        let index = language == "fa" ? 0 : language == "hr" ? 2 : 1
        return values[key]?[index] ?? "New Hope 7"
    }
}
