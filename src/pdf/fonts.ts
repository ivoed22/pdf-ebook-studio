import { Font } from "@react-pdf/renderer";

import playfair400 from "../assets/fonts/playfair-display-400.ttf?url";
import playfair400i from "../assets/fonts/playfair-display-400-italic.ttf?url";
import playfair600 from "../assets/fonts/playfair-display-600.ttf?url";
import playfair700 from "../assets/fonts/playfair-display-700.ttf?url";
import inter400 from "../assets/fonts/inter-400.ttf?url";
import inter400i from "../assets/fonts/inter-400-italic.ttf?url";
import inter500 from "../assets/fonts/inter-500.ttf?url";
import inter600 from "../assets/fonts/inter-600.ttf?url";
import inter700 from "../assets/fonts/inter-700.ttf?url";
import cormorant400 from "../assets/fonts/cormorant-garamond-400.ttf?url";
import cormorant400i from "../assets/fonts/cormorant-garamond-400-italic.ttf?url";
import cormorant500 from "../assets/fonts/cormorant-garamond-500.ttf?url";
import cormorant600 from "../assets/fonts/cormorant-garamond-600.ttf?url";
import cormorant700 from "../assets/fonts/cormorant-garamond-700.ttf?url";

let registered = false;

export function registerFonts(): void {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Playfair Display",
    fonts: [
      { src: playfair400, fontWeight: 400 },
      { src: playfair400i, fontWeight: 400, fontStyle: "italic" },
      { src: playfair600, fontWeight: 600 },
      { src: playfair700, fontWeight: 700 },
    ],
  });
  Font.register({
    family: "Inter",
    fonts: [
      { src: inter400, fontWeight: 400 },
      { src: inter400i, fontWeight: 400, fontStyle: "italic" },
      { src: inter500, fontWeight: 500 },
      { src: inter600, fontWeight: 600 },
      { src: inter700, fontWeight: 700 },
    ],
  });
  Font.register({
    family: "Cormorant Garamond",
    fonts: [
      { src: cormorant400, fontWeight: 400 },
      { src: cormorant400i, fontWeight: 400, fontStyle: "italic" },
      { src: cormorant500, fontWeight: 500 },
      { src: cormorant600, fontWeight: 600 },
      { src: cormorant700, fontWeight: 700 },
    ],
  });

  // Keep words whole — hyphenated breaks look cheap in premium layouts.
  Font.registerHyphenationCallback((word) => [word]);
}
