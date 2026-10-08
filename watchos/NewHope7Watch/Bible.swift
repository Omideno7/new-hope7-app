import SwiftUI
import Foundation

struct WatchBibleBook: Codable, Identifiable, Hashable {
    let id: String
    let order: Int
    let testament: String
    let names: [String: String]
    let chapters: Int

    func title(_ language: String) -> String {
        names[language] ?? names["en"] ?? id
    }
}

struct WatchBibleVerse: Codable, Identifiable {
    let verse: Int
    let text: [String: String]
    var id: Int { verse }

    func body(_ language: String) -> String {
        text[language] ?? text["en"] ?? ""
    }
}

@MainActor
final class WatchBibleStore: ObservableObject {
    @Published var books: [WatchBibleBook] = []
    @Published var error: String?

    func loadBooks() {
        guard books.isEmpty else { return }
        do {
            let url = try resourceURL("bible_books")
            let data = try Data(contentsOf: url)
            books = try JSONDecoder().decode([WatchBibleBook].self, from: data)
                .sorted { $0.order < $1.order }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func loadChapter(book: String, chapter: Int) throws -> [WatchBibleVerse] {
        let url = try resourceURL("bible_\(book)_\(chapter)")
        return try JSONDecoder().decode([WatchBibleVerse].self, from: Data(contentsOf: url))
    }

    private func resourceURL(_ name: String) throws -> URL {
        if let url = Bundle.main.url(forResource: name, withExtension: "json") { return url }
        throw NSError(domain: "NewHope7Watch.Bible", code: 404, userInfo: [NSLocalizedDescriptionKey: "Bible resource not found"])
    }
}

struct BibleRootView: View {
    @Binding var language: String
    @StateObject private var store = WatchBibleStore()

    private var title: String {
        language == "fa" ? "کتاب‌مقدس" : (language == "hr" ? "Biblija" : "Bible")
    }

    var body: some View {
        NavigationStack {
            Group {
                if let error = store.error {
                    ContentUnavailableView(title, systemImage: "book.closed", description: Text(error))
                } else {
                    List(store.books) { book in
                        NavigationLink(book.title(language)) {
                            ChapterListView(book: book, language: $language, store: store)
                        }
                    }
                }
            }
            .navigationTitle(title)
        }
        .task { store.loadBooks() }
    }
}

struct ChapterListView: View {
    let book: WatchBibleBook
    @Binding var language: String
    @ObservedObject var store: WatchBibleStore

    var body: some View {
        List(1...max(1, book.chapters), id: \.self) { chapter in
            NavigationLink(chapterLabel(chapter)) {
                BibleChapterView(book: book, chapter: chapter, language: $language, store: store)
            }
        }
        .navigationTitle(book.title(language))
    }

    private func chapterLabel(_ chapter: Int) -> String {
        language == "fa" ? "باب \(chapter)" : (language == "hr" ? "Poglavlje \(chapter)" : "Chapter \(chapter)")
    }
}

struct BibleChapterView: View {
    let book: WatchBibleBook
    let chapter: Int
    @Binding var language: String
    @ObservedObject var store: WatchBibleStore
    @State private var verses: [WatchBibleVerse] = []
    @State private var error: String?

    var body: some View {
        Group {
            if let error {
                ContentUnavailableView("Bible", systemImage: "exclamationmark.triangle", description: Text(error))
            } else {
                ScrollView {
                    LazyVStack(alignment: language == "fa" ? .trailing : .leading, spacing: 8) {
                        ForEach(verses) { verse in
                            HStack(alignment: .top, spacing: 5) {
                                if language != "fa" { Text("\(verse.verse)").font(.caption2).foregroundStyle(.secondary) }
                                Text(verse.body(language)).font(.footnote)
                                    .multilineTextAlignment(language == "fa" ? .trailing : .leading)
                                if language == "fa" { Text("\(verse.verse)").font(.caption2).foregroundStyle(.secondary) }
                            }
                            .frame(maxWidth: .infinity, alignment: language == "fa" ? .trailing : .leading)
                        }
                    }
                }
            }
        }
        .navigationTitle("\(book.title(language)) \(chapter)")
        .task {
            do { verses = try store.loadChapter(book: book.id, chapter: chapter) }
            catch { self.error = error.localizedDescription }
        }
    }
}
