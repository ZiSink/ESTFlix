import { SeedService } from "../services/seedService.js";

SeedService.ensure();

// Helpful for debugging in DevTools:
console.log("EstFlix seeded. Check localStorage key: estflix_db_v1");