export class Content {
  constructor({ id, title, description, categoryId, year, rating, imageUrl, type, runtimeMinutes, cast, tagline, trailerUrl }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.categoryId = categoryId;
    this.year = year;
    this.rating = rating;
    this.imageUrl = imageUrl;
    this.type = type; // movie | series
    this.runtimeMinutes = runtimeMinutes ?? null;
    this.cast = Array.isArray(cast) ? cast : [];
    this.tagline = tagline ?? "";
    this.trailerUrl = trailerUrl ?? null;
  }
}