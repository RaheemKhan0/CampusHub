import degrees from "./degree.json";
import fs from "fs";
import path from "path";

try {
  const outputPath = path.join(__dirname, "output.json");

  const updated = {
    ...degrees,
    degrees: degrees.degrees.map((degree) => {
      const degree_name = degree.degree_title == "BSc (Hons) Computer Science" ? "bsc-hons-computer-science" : "bsc-maths";
      return {
        ...degree,
        modules: degree.modules.map((module) => ({
          ...module,
          degree_name,
        })),
      };
    }),
  };

  fs.writeFile(outputPath, JSON.stringify(updated, null, 2), "utf8", () => {
    console.log(`Data written to ${outputPath}`);
  });
} catch (error) {
  throw new Error(String(error));
}
