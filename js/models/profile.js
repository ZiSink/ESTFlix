export class Profile {
  constructor({ id, userId, name, avatarUrl, role }) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.avatarUrl = avatarUrl ?? "";
    this.role = role ?? "USER"; // USER | ADMIN
  }
}