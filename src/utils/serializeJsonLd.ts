/** Keep JSON data inside its script element, including literal </script> text. */
export function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
