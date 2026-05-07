export class IdService {
  static next(db, entity) {
    const n = db.counters[entity] ?? 1;
    db.counters[entity] = n + 1;
    return n;
  }
}