import SwiftUI
import Foundation

struct WatchBibleBook: Decodable, Identifiable {
    let id: String
    let order: Int
    let names: [String: String]
    let chapters: Int
    func title(_ language: String) -> String { names[language] ?? names["en"] ?? id }
}
struct WatchBibleVerse: Decodable, Identifiable {
    let verse: Int
    let text: [String: String]
    var id: Int { verse }
}

// Single small catalog and one active chapter. Immutable bundled text, no network/disk cache.
@MainActor
final class WatchBibleStore: ObservableObject {
    @Published private(set) var books: [WatchBibleBook] = []
    @Published private(set) var unavailable = false
    enum ResourceError: Error { case unavailable }
    private func read<T: Decodable>(_ name: String, limit: Int, as type: T.Type) throws -> T {
        guard let url = Bundle.main.url(forResource: name, withExtension: "json"),
              let size = try url.resourceValues(forKeys: [.fileSizeKey]).fileSize,
              size > 0, size <= limit else { throw ResourceError.unavailable }
        let data = try Data(contentsOf: url)
        guard data.count <= limit else { throw ResourceError.unavailable }
        return try JSONDecoder().decode(type, from: data)
    }
    func load() {
        guard books.isEmpty else { return }
        do {
            let rows = try read("bible_books", limit: 32768, as: [WatchBibleBook].self)
            guard rows.count == 66, Set(rows.map(\.id)).count == 66,
                  rows.allSatisfy({ $0.id.range(of: "^[A-Z0-9]{3}$", options: .regularExpression) != nil && (1...150).contains($0.chapters) }) else { throw ResourceError.unavailable }
            books = rows.sorted { $0.order < $1.order }
            unavailable = false
        } catch { books = []; unavailable = true }
    }
    func chapter(book: String, number: Int) throws -> [WatchBibleVerse] {
        guard let selected = books.first(where: { $0.id == book }),
              (1...selected.chapters).contains(number) else { throw ResourceError.unavailable }
        let rows = try read("bible_\(selected.id)_\(number)", limit: 262144, as: [WatchBibleVerse].self)
        guard !rows.isEmpty, rows.count <= 200, Set(rows.map(\.verse)).count == rows.count,
              rows.allSatisfy({ verse in verse.verse > 0 && ["fa", "en", "hr"].allSatisfy { language in !(verse.text[language]?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true) } }) else { throw ResourceError.unavailable }
        return rows.sorted { $0.verse < $1.verse }
    }
}

struct WatchReadingUnavailable: View {
    let language: String
    let retry: () -> Void
    var body: some View {
        VStack(spacing: 12) {
            Text(WatchCopy.text("unavailable", language)).font(.headline)
            Text(WatchCopy.text("resources", language)).font(.body)
            Button(WatchCopy.text("retry", language), action: retry)
        }
        .multilineTextAlignment(.leading)
        .padding()
    }
}
struct BibleRootView: View {
    let language: String
    @StateObject private var store = WatchBibleStore()
    var body: some View {
        NavigationStack {
            Group {
                if store.unavailable { WatchReadingUnavailable(language: language) { store.load() } }
                else {
                    List(store.books) { book in
                        NavigationLink(book.title(language)) {
                            List(1...book.chapters, id: \.self) { chapter in
                                NavigationLink("\(WatchCopy.text("chapter", language)) \(chapter)") {
                                    BibleChapterView(book: book, number: chapter, language: language, store: store)
                                }
                            }
                            .navigationTitle(book.title(language))
                        }
                    }
                }
            }
            .navigationTitle(WatchCopy.text("bible", language))
        }
        .task { store.load() }
    }
}
struct BibleChapterView: View {
    let book: WatchBibleBook
    let number: Int
    let language: String
    @ObservedObject var store: WatchBibleStore
    @State private var verses: [WatchBibleVerse] = []
    @State private var unavailable = false
    private func load() {
        do { verses = try store.chapter(book: book.id, number: number); unavailable = false }
        catch { verses = []; unavailable = true }
    }
    var body: some View {
        Group {
            if unavailable { WatchReadingUnavailable(language: language, retry: load) }
            else {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        ForEach(verses) { verse in
                            Text("\(verse.verse)  \(verse.text[language] ?? verse.text["en"] ?? "")")
                                .font(.body)
                                .multilineTextAlignment(.leading)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }.padding()
                }
            }
        }
        .navigationTitle("\(book.title(language)) \(number)")
        .task(id: "\(book.id):\(number)") { load() }
        .onDisappear { verses = [] }
    }
}
