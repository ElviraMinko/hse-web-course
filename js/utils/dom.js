

const SVG_NS = 'http://www.w3.org/2000/svg';

export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  append(node, children);

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;

    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'dataset') {
      Object.assign(node.dataset, value);
    } else if (['className', 'value', 'checked', 'selected', 'disabled', 'textContent'].includes(key)) {

      node[key] = value;
    } else {
      node.setAttribute(key, value === true ? '' : value);
    }
  }
  return node;
}

export function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

export function replaceContent(parent, ...children) {
  parent.replaceChildren();
  return append(parent, children);
}

export function icon(name, size = '') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', size ? `icon icon-${size}` : 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#${name}`);
  svg.append(use);
  return svg;
}

export function qs(selector, root = document) {
  const node = root.querySelector(selector);
  if (!node) throw new Error(`Не найден элемент «${selector}»`);
  return node;
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

export function checkRadio(root, name, value) {
  const input = root.querySelector(`input[type="radio"][name="${name}"][value="${value}"]`);
  if (input) input.checked = true;
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
