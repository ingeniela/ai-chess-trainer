export const withBaseUrl = (path) => {
  const value = String(path ?? "").trim();
  if (!value) return import.meta.env.BASE_URL;
  if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }

  const baseUrl = import.meta.env.BASE_URL || "/";
  if (baseUrl !== "/" && value.startsWith(baseUrl)) {
    return value;
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = value.replace(/^\.?\//, "").replace(/^\/+/, "");
  return `${normalizedBase}${normalizedPath}`;
};
