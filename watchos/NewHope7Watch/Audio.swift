import SwiftUI
import Foundation
import AVFoundation

struct WatchSermon: Codable, Identifiable {
    let id: UUID
    let title_fa: String?
    let title_en: String?
    let title_hr: String?
    let audio_url: String?
    let duration_seconds: Double?
    let duration_minutes: Double?

    func title(_ language: String) -> String {
        if language == "fa", let v = title_fa, !v.isEmpty { return v }
        if language == "hr", let v = title_hr, !v.isEmpty { return v }
        return title_en ?? title_fa ?? title_hr ?? "Audio"
    }
}

@MainActor
final class WatchAudioStore: ObservableObject {
    @Published var sermons: [WatchSermon] = []
    @Published var loading = false
    @Published var error: String?
    @Published var currentID: UUID?
    @Published var isPlaying = false

    private var player: AVPlayer?
    private let base = "https://gpzcwffxnddhaeaogdyo.supabase.co"
    private let publishableKey = "sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37"

    func refresh() async {
        guard !loading else { return }
        loading = true
        error = nil
        defer { loading = false }

        do {
            var parts = URLComponents(string: base + "/rest/v1/sermons")!
            parts.queryItems = [
                URLQueryItem(name: "select", value: "id,title_fa,title_en,title_hr,audio_url,duration_seconds,duration_minutes"),
                URLQueryItem(name: "is_published", value: "eq.true"),
                URLQueryItem(name: "order", value: "published_at.desc"),
                URLQueryItem(name: "limit", value: "100")
            ]
            var request = URLRequest(url: parts.url!)
            request.setValue(publishableKey, forHTTPHeaderField: "apikey")
            request.cachePolicy = .reloadIgnoringLocalCacheData
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                throw URLError(.badServerResponse)
            }
            sermons = try JSONDecoder().decode([WatchSermon].self, from: data)
        } catch {
            self.error = error.localizedDescription
        }
    }

    func toggle(_ sermon: WatchSermon) async {
        if currentID == sermon.id, let player {
            if isPlaying { player.pause(); isPlaying = false }
            else { player.play(); isPlaying = true }
            return
        }
        guard let raw = sermon.audio_url, let url = URL(string: raw) else {
            error = "Audio URL unavailable"
            return
        }
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, policy: .longFormAudio)
            try await session.activate()
            let next = AVPlayer(url: url)
            player = next
            currentID = sermon.id
            next.play()
            isPlaying = true
        } catch {
            self.error = error.localizedDescription
        }
    }

    func stop() {
        player?.pause()
        isPlaying = false
    }
}

struct AudioRootView: View {
    @Binding var language: String
    @StateObject private var store = WatchAudioStore()

    private var title: String {
        language == "fa" ? "پیام‌های صوتی" : (language == "hr" ? "Audio poruke" : "Audio")
    }

    var body: some View {
        NavigationStack {
            Group {
                if store.loading && store.sermons.isEmpty {
                    ProgressView()
                } else if let error = store.error, store.sermons.isEmpty {
                    ContentUnavailableView(title, systemImage: "waveform", description: Text(error))
                } else {
                    List(store.sermons) { sermon in
                        Button {
                            Task { await store.toggle(sermon) }
                        } label: {
                            HStack {
                                Image(systemName: store.currentID == sermon.id && store.isPlaying ? "pause.fill" : "play.fill")
                                Text(sermon.title(language)).lineLimit(2)
                            }
                        }
                    }
                }
            }
            .navigationTitle(title)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { Task { await store.refresh() } } label: { Image(systemName: "arrow.clockwise") }
                }
            }
        }
        .task { await store.refresh() }
    }
}
