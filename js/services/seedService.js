import { StorageService } from "./storageService.js";
import { IdService } from "./idService.js";
import { hashPassword } from "./credentialService.js";

import { User } from "../models/user.js";
import { Profile } from "../models/profile.js";
import { Category } from "../models/category.js";
import { Content } from "../models/content.js";

function ensureCounter(db, entity, items) {
  const maxId = items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  db.counters[entity] = Math.max(db.counters[entity] ?? 1, maxId + 1);
}

function ensureEntity(db, entity, list, predicate, create) {
  if (list.some(predicate)) return;
  ensureCounter(db, entity, list);
  list.push(create());
}

export class SeedService {
  static ensure() {
    const db = StorageService.load();

    db.counters ??= { user: 1, profile: 1, category: 1, content: 1 };
    db.users ??= [];
    db.profiles ??= [];
    db.categories ??= [];
    db.contents ??= [];
    db.favorites ??= [];
    db.history ??= [];
    db.session ??= { userId: null, activeProfileId: null, rememberMe: false };

    ensureCounter(db, "user", db.users);
    ensureCounter(db, "profile", db.profiles);
    ensureCounter(db, "category", db.categories);
    ensureCounter(db, "content", db.contents);

    ensureEntity(db, "user", db.users, u => u.email === "admin@estflix.test", () => new User({
      id: IdService.next(db, "user"),
      email: "admin@estflix.test",
      passwordHash: hashPassword("admin")
    }));

    ensureEntity(db, "user", db.users, u => u.email === "viewer@estflix.test", () => new User({
      id: IdService.next(db, "user"),
      email: "viewer@estflix.test",
      passwordHash: hashPassword("viewer")
    }));

    const adminUser  = db.users.find(u => u.email === "admin@estflix.test");
    const viewerUser = db.users.find(u => u.email === "viewer@estflix.test");

    ensureEntity(db, "profile", db.profiles, p => p.userId === adminUser?.id && p.name === "Admin", () => new Profile({
      id: IdService.next(db, "profile"), userId: adminUser.id, name: "Admin", role: "ADMIN", avatarUrl: ""
    }));
    ensureEntity(db, "profile", db.profiles, p => p.userId === adminUser?.id && p.name === "Cinephile", () => new Profile({
      id: IdService.next(db, "profile"), userId: adminUser.id, name: "Cinephile", role: "USER", avatarUrl: ""
    }));
    ensureEntity(db, "profile", db.profiles, p => p.userId === viewerUser?.id && p.name === "Viewer", () => new Profile({
      id: IdService.next(db, "profile"), userId: viewerUser.id, name: "Viewer", role: "USER", avatarUrl: ""
    }));

    ensureEntity(db, "category", db.categories, c => c.name === "Action",  () => new Category({ id: IdService.next(db, "category"), name: "Action" }));
    ensureEntity(db, "category", db.categories, c => c.name === "Drama",   () => new Category({ id: IdService.next(db, "category"), name: "Drama" }));
    ensureEntity(db, "category", db.categories, c => c.name === "Comedy",  () => new Category({ id: IdService.next(db, "category"), name: "Comedy" }));
    ensureEntity(db, "category", db.categories, c => c.name === "Sci-Fi",  () => new Category({ id: IdService.next(db, "category"), name: "Sci-Fi" }));

    const action = db.categories.find(c => c.name === "Action");
    const drama  = db.categories.find(c => c.name === "Drama");
    const comedy = db.categories.find(c => c.name === "Comedy");
    const scifi  = db.categories.find(c => c.name === "Sci-Fi");

    const seedContents = [
      {
        title: "The Dark Knight",
        description: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague Gotham City.",
        tagline: "Why so serious?",
        categoryId: action.id,
        year: 2008,
        rating: 4.9,
        imageUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        type: "movie",
        runtimeMinutes: 152,
        cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"]
      },
      {
        title: "Inception",
        description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        tagline: "Your mind is the scene of the crime.",
        categoryId: scifi.id,
        year: 2010,
        rating: 4.8,
        imageUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
        type: "movie",
        runtimeMinutes: 148,
        cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"]
      },
      {
        title: "Interstellar",
        description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
        tagline: "Mankind was born on Earth. It was never meant to die here.",
        categoryId: scifi.id,
        year: 2014,
        rating: 4.7,
        imageUrl: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        type: "movie",
        runtimeMinutes: 169,
        cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"]
      },
      {
        title: "The Matrix",
        description: "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth — the life he knows is the elaborate deception of an evil cyber-intelligence.",
        tagline: "Free your mind.",
        categoryId: scifi.id,
        year: 1999,
        rating: 4.8,
        imageUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
        type: "movie",
        runtimeMinutes: 136,
        cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"]
      },
      {
        title: "Joker",
        description: "In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral of revolution and bloody crime.",
        tagline: "Put on a happy face.",
        categoryId: drama.id,
        year: 2019,
        rating: 4.5,
        imageUrl: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
        type: "movie",
        runtimeMinutes: 122,
        cast: ["Joaquin Phoenix", "Robert De Niro", "Zazie Beetz"]
      },
      {
        title: "Parasite",
        description: "All unemployed, Ki-taek's family takes a peculiar interest in the wealthy and well-educated Park family, as they begin to infiltrate their household one by one.",
        tagline: "Act like you own the place.",
        categoryId: drama.id,
        year: 2019,
        rating: 4.6,
        imageUrl: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
        type: "movie",
        runtimeMinutes: 132,
        cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong"]
      },
      {
        title: "The Grand Budapest Hotel",
        description: "The adventures of Gustave H, a legendary concierge at a famous hotel between the wars, and Zero Moustafa, the lobby boy who becomes his most trusted friend.",
        tagline: "A world that no longer exists.",
        categoryId: comedy.id,
        year: 2014,
        rating: 4.4,
        imageUrl: "https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg",
        type: "movie",
        runtimeMinutes: 99,
        cast: ["Ralph Fiennes", "Tony Revolori", "Tilda Swinton"]
      },
      {
        title: "Breaking Bad",
        description: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
        tagline: "All bad things must come to an end.",
        categoryId: drama.id,
        year: 2008,
        rating: 4.9,
        imageUrl: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
        type: "series",
        runtimeMinutes: 47,
        cast: ["Bryan Cranston", "Aaron Paul", "Anna Gunn"]
      },
      {
        title: "Stranger Things",
        description: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.",
        tagline: "The world is turning upside down.",
        categoryId: scifi.id,
        year: 2016,
        rating: 4.7,
        imageUrl: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
        type: "series",
        runtimeMinutes: 51,
        cast: ["Millie Bobby Brown", "Finn Wolfhard", "Winona Ryder"]
      },
      {
        title: "The Office",
        description: "A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium.",
        tagline: "Work is hell. This is its documentary.",
        categoryId: comedy.id,
        year: 2005,
        rating: 4.6,
        imageUrl: "https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
        type: "series",
        runtimeMinutes: 22,
        cast: ["Steve Carell", "John Krasinski", "Jenna Fischer"]
      }
    ];

    for (const content of seedContents) {
      ensureEntity(db, "content", db.contents, item => item.title === content.title, () => new Content({
        id: IdService.next(db, "content"),
        ...content
      }));
    }

    StorageService.save(db);
  }
}
