/**
 * Save an on-page SVG as a PNG, entirely in the browser: no upload, no server.
 *
 * The SVG is serialised, its `var(--…)` colours are resolved against the live
 * page (an image has no stylesheet to resolve them from), drawn onto a canvas
 * at the requested size and handed to the browser as a download.
 */

const resolveVars = (xml, from) => {
  const styles = getComputedStyle(from);
  return xml.replace(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g, (_, name, fallback) => styles.getPropertyValue(name).trim() || (fallback ?? "").trim() || "#000000");
};

export const svgToPngBlob = async (svg, { width, height }) => {
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // An offscreen source is hidden with inline CSS; the image must not inherit that.
  clone.removeAttribute("style");
  clone.removeAttribute("class");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  // Interaction chrome (focus and drag rings) is not part of the picture.
  clone.querySelectorAll("[data-export='skip']").forEach((node) => node.remove());
  const xml = resolveVars(new XMLSerializer().serializeToString(clone), svg);
  const image = new Image();
  image.decoding = "async";
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(image, 0, 0, width, height);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed"))), "image/png"));
};

export const downloadSvgAsPng = async (svg, { width, height, filename }) => {
  const blob = await svgToPngBlob(svg, { width, height });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
