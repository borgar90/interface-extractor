const fs = require("fs");
const path = require("path");
const { parse } = require("@babel/parser");
const generate = require("@babel/generator").default;
const { default: traverse } = require("@babel/traverse");

const directories = ["pages", "components", "layout"];
const typesDir = "./types";

// Ensure types directory exists
if (!fs.existsSync(typesDir)) {
  fs.mkdirSync(typesDir);
}

// Function to recursively process files in a directory
function processDirectory(directory) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach((dirent) => {
    const fullPath = path.join(directory, dirent.name);
    if (dirent.isDirectory()) {
      processDirectory(fullPath);
    } else if (
      dirent.isFile() &&
      (dirent.name.endsWith(".ts") || dirent.name.endsWith(".tsx"))
    ) {
      processFile(fullPath);
    }
  });
}

// Process a single file
function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const ast = parse(content, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  traverse(ast, {
    TSInterfaceDeclaration(nodePath) {
      const interfaceName = nodePath.node.id.name;
      const newFilePath = path.join(typesDir, `${interfaceName}.ts`);

      // Use Babel's generator to convert AST back to string, preserving formatting
      const { code } = generate(nodePath.node, {
        retainLines: true,
        concise: false,
      });
      // Manually trim excessive line breaks
      const trimmedCode = code.replace(/\n\s*\n/g, "\n");
      const fileContent = `export default ${trimmedCode}`;
      fs.writeFileSync(newFilePath, fileContent);
    },
  });
}

// Process each directory
directories.forEach(processDirectory);

console.log("Interfaces have been extracted.");
