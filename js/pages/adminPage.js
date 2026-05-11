import { SeedService } from "../services/seedService.js";
import { StorageService } from "../services/storageService.js";
import { AuthService } from "../services/authService.js";
import { wireLogout } from "./logoutWireup.js";
import { el, clear } from "../ui/dom.js";
import { Category } from "../models/category.js";
import { Content } from "../models/content.js";
import { IdService } from "../services/idService.js";

SeedService.ensure();
wireLogout();

const host = document.getElementById("adminHost");
let contentDraftId = null;
let categoryDraftId = null;

function render() {
  const db = StorageService.load();
  const session = AuthService.getSession();
  const profile = db.profiles.find(item => item.id === session.activeProfileId) ?? db.profiles.find(item => item.userId === session.userId);
  const user = db.users.find(item => item.id === session.userId);
  const isAdmin = profile?.role === "ADMIN";

  clear(host);

  if (!user || !profile) {
    host.appendChild(el("section", { className: "card notice" }, [
      el("p", { className: "eyebrow", text: "Admin" }),
      el("h1", { text: "Sign in with an admin profile." }),
      el("p", { className: "hero-text", text: "This section manages local catalog data and requires an active admin profile." }),
      el("div", { className: "hero-actions" }, [
        el("a", { className: "btn primary", href: "login.html" }, ["Sign in"]),
        el("a", { className: "btn ghost", href: "profiles.html" }, ["Choose profile"])
      ])
    ]));
    return;
  }

  if (!isAdmin) {
    host.appendChild(el("section", { className: "card notice" }, [
      el("p", { className: "eyebrow", text: "Access denied" }),
      el("h1", { text: "This profile cannot open admin." }),
      el("p", { className: "hero-text", text: "Switch to the admin profile to manage categories and content." }),
      el("div", { className: "hero-actions" }, [
        el("a", { className: "btn primary", href: "profiles.html" }, ["Switch profile"]),
        el("a", { className: "btn ghost", href: "home.html" }, ["Back to browse"])
      ])
    ]));
    return;
  }

  const message = el("p", { className: "msg" });
  const categoryFormState = buildCategoryForm(db);
  const contentForm = buildContentForm(db);

  const shell = el("section", { className: "card admin-shell" }, [
    el("div", { className: "hero" }, [
      el("div", {}, [
        el("p", { className: "eyebrow", text: "Management" }),
        el("h1", { text: "Admin console." }),
        el("p", { className: "hero-text", text: "Manage the local catalog directly from the browser while the project remains data-driven and offline-first." })
      ]),
      el("aside", { className: "hero-panel" }, [
        el("p", { className: "panel-label", text: "Signed in as" }),
        el("h2", { text: profile.name }),
        el("p", { className: "muted", text: user.email })
      ])
    ]),
    el("div", { className: "admin-summary" }, [
      el("div", { className: "kpi" }, [el("span", { className: "eyebrow", text: "Users" }), el("span", { className: "value", text: String(db.users.length) })]),
      el("div", { className: "kpi" }, [el("span", { className: "eyebrow", text: "Profiles" }), el("span", { className: "value", text: String(db.profiles.length) })]),
      el("div", { className: "kpi" }, [el("span", { className: "eyebrow", text: "Titles" }), el("span", { className: "value", text: String(db.contents.length) })]),
      el("div", { className: "kpi" }, [el("span", { className: "eyebrow", text: "Categories" }), el("span", { className: "value", text: String(db.categories.length) })])
    ]),
    el("div", { className: "split-panel" }, [
      el("section", { className: "card" }, [
        el("h2", { text: "Categories" }),
        categoryFormState.form,
        categoryFormState.message,
        renderCategoryTable(db)
      ]),
      el("section", { className: "card" }, [
        el("h2", { text: "Content" }),
        contentForm.form,
        contentForm.message,
        renderContentTable(db)
      ])
    ])
  ]);

  host.appendChild(shell);

  const categoryDeleteButtons = host.querySelectorAll("[data-category-delete]");
  categoryDeleteButtons.forEach(button => {
    button.addEventListener("click", () => {
      const categoryId = Number(button.getAttribute("data-category-delete"));
      const inUse = db.contents.some(content => content.categoryId === categoryId);
      if (inUse) {
        setMessage("Remove the titles in this category first.", true);
        return;
      }
      db.categories = db.categories.filter(category => category.id !== categoryId);
      StorageService.save(db);
      render();
    });
  });

  const categoryEditButtons = host.querySelectorAll("[data-category-edit]");
  categoryEditButtons.forEach(button => {
    button.addEventListener("click", () => {
      categoryDraftId = Number(button.getAttribute("data-category-edit"));
      render();
    });
  });

  const contentDeleteButtons = host.querySelectorAll("[data-content-delete]");
  contentDeleteButtons.forEach(button => {
    button.addEventListener("click", () => {
      const contentId = Number(button.getAttribute("data-content-delete"));
      db.contents = db.contents.filter(content => content.id !== contentId);
      if (contentDraftId === contentId) contentDraftId = null;
      StorageService.save(db);
      render();
    });
  });

  const contentEditButtons = host.querySelectorAll("[data-content-edit]");
  contentEditButtons.forEach(button => {
    button.addEventListener("click", () => {
      contentDraftId = Number(button.getAttribute("data-content-edit"));
      render();
    });
  });

  function setMessage(text, isError = false) {
    message.className = isError ? "msg error" : "msg ok";
    message.textContent = text;
  }

  function renderCategoryTable(currentDb) {
    return el("div", { className: "table-wrap" }, [
      el("table", { className: "table compact" }, [
        el("thead", {}, [el("tr", {}, [
          el("th", { text: "Id" }),
          el("th", { text: "Name" }),
          el("th", { text: "Actions" })
        ])]),
        el("tbody", {}, currentDb.categories.map(category => el("tr", {}, [
          el("td", { text: String(category.id) }),
          el("td", { text: category.name }),
          el("td", {}, [
            el("div", { className: "hero-actions" }, [
              el("button", { className: "btn ghost compact", type: "button", "data-category-edit": String(category.id) }, ["Edit"]),
              el("button", { className: "btn danger compact", type: "button", "data-category-delete": String(category.id) }, ["Delete"])
            ])
          ])
        ])))
      ])
    ]);
  }

  function renderContentTable(currentDb) {
    const categoriesById = new Map(currentDb.categories.map(c => [c.id, c]));
    return el("div", { className: "table-wrap" }, [
      el("table", { className: "table compact" }, [
        el("thead", {}, [el("tr", {}, [
          el("th", { text: "Id" }),
          el("th", { text: "Title" }),
          el("th", { text: "Genre" }),
          el("th", { text: "Year" }),
          el("th", { text: "Rating" }),
          el("th", { text: "Type" }),
          el("th", { text: "Actions" })
        ])]),
        el("tbody", {}, currentDb.contents.map(content => el("tr", {}, [
          el("td", { text: String(content.id) }),
          el("td", { text: content.title }),
          el("td", { text: categoriesById.get(content.categoryId)?.name ?? "—" }),
          el("td", { text: String(content.year) }),
          el("td", { text: content.rating.toFixed(1) }),
          el("td", { text: content.type }),
          el("td", {}, [
            el("div", { className: "hero-actions" }, [
              el("button", { className: "btn ghost compact", type: "button", "data-content-edit": String(content.id) }, ["Edit"]),
              el("button", { className: "btn danger compact", type: "button", "data-content-delete": String(content.id) }, ["Delete"])
            ])
          ])
        ])))
      ])
    ]);
  }

  function buildContentForm(currentDb) {
    const editingContent = currentDb.contents.find(content => content.id === contentDraftId) ?? null;
    const titleInput = el("input", { type: "text", placeholder: "Title" });
    const descriptionInput = el("input", { type: "text", placeholder: "Short description" });
    const categorySelect = el("select");
    const yearInput = el("input", { type: "number", placeholder: "2026" });
    const ratingInput = el("input", { type: "number", placeholder: "4.5" });
    ratingInput.step = "0.1";
    ratingInput.min = "0";
    ratingInput.max = "5";
    const imageUrlInput = el("input", { type: "url", placeholder: "https://..." });
    const typeSelect = el("select");

    currentDb.categories.forEach(category => {
      categorySelect.appendChild(el("option", { value: String(category.id), text: category.name }));
    });
    ["movie", "series"].forEach(type => {
      typeSelect.appendChild(el("option", { value: type, text: type }));
    });

    if (editingContent) {
      titleInput.value = editingContent.title;
      descriptionInput.value = editingContent.description;
      categorySelect.value = String(editingContent.categoryId);
      yearInput.value = String(editingContent.year);
      ratingInput.value = String(editingContent.rating);
      imageUrlInput.value = editingContent.imageUrl;
      typeSelect.value = editingContent.type;
    } else if (currentDb.categories[0]) {
      categorySelect.value = String(currentDb.categories[0].id);
      typeSelect.value = "movie";
    }

    const formMessage = el("p", { className: "msg" });

    const form = el("form", { className: "stack" }, [
      el("p", { className: "eyebrow", text: editingContent ? "Edit title" : "Create title" }),
      el("div", { className: "grid-2" }, [
        el("label", { className: "field-label" }, ["Title", titleInput]),
        el("label", { className: "field-label" }, ["Description", descriptionInput]),
        el("label", { className: "field-label" }, ["Category", categorySelect]),
        el("label", { className: "field-label" }, ["Type", typeSelect]),
        el("label", { className: "field-label" }, ["Year", yearInput]),
        el("label", { className: "field-label" }, ["Rating", ratingInput]),
        el("label", { className: "field-label" }, ["Image URL", imageUrlInput])
      ]),
      el("div", { className: "hero-actions" }, [
        el("button", { className: "btn primary", type: "submit" }, [editingContent ? "Save changes" : "Create title"]),
        editingContent ? el("button", { className: "btn ghost", type: "button" }, ["Cancel edit"]) : null
      ])
    ]);

    const cancelButton = editingContent ? form.querySelector("button.btn.ghost") : null;
    cancelButton?.addEventListener("click", () => {
      contentDraftId = null;
      render();
    });

    form.addEventListener("submit", event => {
      event.preventDefault();
      const title = titleInput.value.trim();
      const description = descriptionInput.value.trim();
      const categoryId = Number(categorySelect.value);
      const year = Number(yearInput.value);
      const rating = Number(ratingInput.value);
      const imageUrl = imageUrlInput.value.trim();
      const type = typeSelect.value;

      if (!title || !description || !imageUrl || !Number.isFinite(categoryId)) {
        formMessage.className = "msg error";
        formMessage.textContent = "Fill in the required title fields.";
        return;
      }

      const duplicate = currentDb.contents.find(c =>
        c.title.toLowerCase() === title.toLowerCase() && c.id !== editingContent?.id
      );
      if (duplicate) {
        formMessage.className = "msg error";
        formMessage.textContent = "A title with that name already exists.";
        return;
      }

      const updatedContent = {
        title,
        description,
        categoryId,
        year: Number.isFinite(year) ? year : new Date().getFullYear(),
        rating: Number.isFinite(rating) ? rating : 4,
        imageUrl,
        type
      };

      if (editingContent) {
        Object.assign(editingContent, updatedContent);
      } else {
        currentDb.contents.push(new Content({
          id: IdService.next(currentDb, "content"),
          ...updatedContent
        }));
      }

      StorageService.save(currentDb);
      contentDraftId = null;
      render();
    });

    return { form, message: formMessage };
  }

  function buildCategoryForm(currentDb) {
    const editingCategory = currentDb.categories.find(category => category.id === categoryDraftId) ?? null;
    const categoryNameInput = el("input", { type: "text", placeholder: "New category" });
    const formMessage = el("p", { className: "msg" });

    if (editingCategory) {
      categoryNameInput.value = editingCategory.name;
    }

    const form = el("form", { className: "stack" }, [
      el("p", { className: "eyebrow", text: editingCategory ? "Edit category" : "Add category" }),
      el("label", { className: "field-label" }, ["Name", categoryNameInput]),
      el("div", { className: "hero-actions" }, [
        el("button", { className: "btn primary", type: "submit" }, [editingCategory ? "Save changes" : "Create category"]),
        editingCategory ? el("button", { className: "btn ghost", type: "button" }, ["Cancel edit"]) : null
      ])
    ]);

    const cancelButton = editingCategory ? form.querySelector("button.btn.ghost") : null;
    cancelButton?.addEventListener("click", () => {
      categoryDraftId = null;
      render();
    });

    form.addEventListener("submit", event => {
      event.preventDefault();
      const name = categoryNameInput.value.trim();
      if (!name) {
        formMessage.className = "msg error";
        formMessage.textContent = "Category name is required.";
        return;
      }

      const duplicate = currentDb.categories.find(category => category.name.toLowerCase() === name.toLowerCase() && category.id !== editingCategory?.id);
      if (duplicate) {
        formMessage.className = "msg error";
        formMessage.textContent = "That category already exists.";
        return;
      }

      if (editingCategory) {
        editingCategory.name = name;
      } else {
        currentDb.categories.push(new Category({ id: IdService.next(currentDb, "category"), name }));
      }

      StorageService.save(currentDb);
      categoryDraftId = null;
      render();
    });

    return { form, message: formMessage };
  }
}

render();