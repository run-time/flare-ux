// A palette color by name, for components that take a `color` attribute
// (fx-count-badge, fx-tag, fx-split-button's options):
//
//   paletteColor("teal")         a family -- its 60 step, white text
//   paletteColor("red-80")       a family and step -- 10-50 take the
//                                family's darkest text, 60-100 white
//   paletteColor("#7c3aed")      anything else: null (not a palette name)
//
// Returns { family, step, fill, on, tint, ink } as CSS values, or null:
//   fill / on    a solid surface and the text on it
//   tint / ink   a pale surface of the family and its deep text

const NAME = /^([a-z]+(?:-gray)?)(?:-(10|20|30|40|50|60|70|80|90|100))?$/;

export function paletteColor(value) {
  const match = NAME.exec(String(value ?? "").trim().toLowerCase());
  if (!match) return null;
  const [, family, given] = match;
  const step = given ?? "60";
  return {
    family,
    step: Number(step),
    explicitStep: Boolean(given),
    fill: `var(--fx-color-${family}-${step})`,
    on: Number(step) >= 60 ? "var(--fx-color-white)" : `var(--fx-color-${family}-100)`,
    tint: `color-mix(in srgb, var(--fx-color-${family}-50) 16%, var(--fx-layer))`,
    ink: `var(--fx-color-${family}-70)`,
  };
}
