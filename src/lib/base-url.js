export const withBaseUrl = (path) => {
  const value = String(path ?? "").trim();
  if (!value) return import.meta.env.BASE_URL;
  if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }

  const baseUrl = import.meta.env.BASE_URL || "/";
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const baseWithoutLeadingSlash = normalizedBase.replace(/^\/+/, "");
  let normalizedPath = value.replace(/^\.?\//, "").replace(/^\/+/, "");

  while (
    baseWithoutLeadingSlash &&
    normalizedPath.startsWith(baseWithoutLeadingSlash)
  ) {
    normalizedPath = normalizedPath
      .slice(baseWithoutLeadingSlash.length)
      .replace(/^\/+/, "");
  }

  return `${normalizedBase}${normalizedPath}`;
};
