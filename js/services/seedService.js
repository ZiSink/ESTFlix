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

    ensureEntity(db, "user", db.users, user => user.email === "admin@estflix.test", () => new User({
      id: IdService.next(db, "user"),
      email: "admin@estflix.test",
      passwordHash: hashPassword("admin")
    }));

    ensureEntity(db, "user", db.users, user => user.email === "viewer@estflix.test", () => new User({
      id: IdService.next(db, "user"),
      email: "viewer@estflix.test",
      passwordHash: hashPassword("viewer")
    }));

    const adminUser = db.users.find(user => user.email === "admin@estflix.test");
    const viewerUser = db.users.find(user => user.email === "viewer@estflix.test");

    ensureEntity(db, "profile", db.profiles, profile => profile.userId === adminUser?.id && profile.name === "Admin", () => new Profile({
      id: IdService.next(db, "profile"),
      userId: adminUser.id,
      name: "Admin",
      role: "ADMIN",
      avatarUrl: ""
    }));

    ensureEntity(db, "profile", db.profiles, profile => profile.userId === adminUser?.id && profile.name === "Cinephile", () => new Profile({
      id: IdService.next(db, "profile"),
      userId: adminUser.id,
      name: "Cinephile",
      role: "USER",
      avatarUrl: ""
    }));

    ensureEntity(db, "profile", db.profiles, profile => profile.userId === adminUser?.id && profile.name === "Kids", () => new Profile({
      id: IdService.next(db, "profile"),
      userId: adminUser.id,
      name: "Kids",
      role: "USER",
      avatarUrl: ""
    }));

    ensureEntity(db, "profile", db.profiles, profile => profile.userId === viewerUser?.id && profile.name === "Viewer", () => new Profile({
      id: IdService.next(db, "profile"),
      userId: viewerUser.id,
      name: "Viewer",
      role: "USER",
      avatarUrl: ""
    }));

    // categories
    ensureEntity(db, "category", db.categories, category => category.name === "Action", () => new Category({ id: IdService.next(db, "category"), name: "Action" }));
    ensureEntity(db, "category", db.categories, category => category.name === "Drama", () => new Category({ id: IdService.next(db, "category"), name: "Drama" }));
    ensureEntity(db, "category", db.categories, category => category.name === "Comedy", () => new Category({ id: IdService.next(db, "category"), name: "Comedy" }));
    ensureEntity(db, "category", db.categories, category => category.name === "Sci-Fi", () => new Category({ id: IdService.next(db, "category"), name: "Sci-Fi" }));

    const action = db.categories.find(category => category.name === "Action");
    const drama = db.categories.find(category => category.name === "Drama");
    const comedy = db.categories.find(category => category.name === "Comedy");
    const scifi = db.categories.find(category => category.name === "Sci-Fi");

    const seedContents = [
      {
        title: "Inception",
        description: "A thief who steals secrets through dream-sharing technology.",
        tagline: "Your mind is the scene.",
        categoryId: drama.id,
        year: 2010,
        rating: 4.8,
        imageUrl: "https://picsum.photos/seed/inception/600/900",
        type: "movie",
        runtimeMinutes: 148,
        cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"]
      },
      {
        title: "Joker",
        description: "A failed comedian descends into madness.",
        tagline: "Put on a happy face.",
        categoryId: drama.id,
        year: 2019,
        rating: 4.5,
        imageUrl: "https://picsum.photos/seed/joker/600/900",
        type: "movie",
        runtimeMinutes: 122,
        cast: ["Joaquin Phoenix", "Robert De Niro", "Zazie Beetz"]
      },
      {
        title: "Fast Lane",
        description: "High-speed action and adrenaline.",
        tagline: "No brakes. No mercy.",
        categoryId: action.id,
        year: 2021,
        rating: 4.1,
        imageUrl: "https://picsum.photos/seed/fastlane/600/900",
        type: "movie",
        runtimeMinutes: 109,
        cast: ["Ava Stone", "Mason Reed", "Noah Vega"]
      },
      {
        title: "Office Days",
        description: "A light comedy about daily life at work.",
        tagline: "Every meeting has a plot twist.",
        categoryId: comedy.id,
        year: 2020,
        rating: 3.9,
        imageUrl: "https://picsum.photos/seed/officedays/600/900",
        type: "series",
        runtimeMinutes: 28,
        cast: ["Maya Cole", "Terry Lewis", "Iris Park"]
      },
      {
        title: "Afterlight",
        description: "A survival story set after a planetary blackout.",
        tagline: "When the lights go out, the hunt begins.",
        categoryId: scifi.id,
        year: 2024,
        rating: 4.7,
        imageUrl: "https://picsum.photos/seed/afterlight/600/900",
        type: "series",
        runtimeMinutes: 42,
        cast: ["Nina Torres", "Owen Hale", "Lena Cross"]
      },
      {
        title: "Velocity Run",
        description: "A chase thriller built around a city-wide race.",
        tagline: "The finish line is only the beginning.",
        categoryId: action.id,
        year: 2022,
        rating: 4.3,
        imageUrl: "https://picsum.photos/seed/velocityrun/600/900",
        type: "movie",
        runtimeMinutes: 116,
        cast: ["Jordan Blake", "Mia Hart", "Cole Bennett"]
      },
      {
        title: "Quiet Harbor",
        description: "A family drama about rebuilding after a long absence.",
        tagline: "Some returns change everything.",
        categoryId: drama.id,
        year: 2023,
        rating: 4.0,
        imageUrl: "https://picsum.photos/seed/quietharbor/600/900",
        type: "series",
        runtimeMinutes: 51,
        cast: ["Anna Miller", "Evan Brooks", "Sofia Quinn"]
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