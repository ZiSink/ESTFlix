export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);

  for (const [k, v] of Object.entries(attrs)) {
    if (k === "className") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "value") node.value = v;
    else if (k === "href") node.setAttribute("href", v);
    else if (k === "src") node.setAttribute("src", v);
    else if (k === "type") node.setAttribute("type", v);
    else if (k === "placeholder") node.setAttribute("placeholder", v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, String(v));
  }

  for (const c of children) {
    if (c == null) continue;
    if (typeof c === "string") node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  }

  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}