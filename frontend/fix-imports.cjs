const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Components that use default export
const defaultExports = [
  'Button',
  'Badge',
  'Card',
  'Input',
  'LoadingScreen',
  'ScrollToTop'
];

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixImports(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      
      // Fix default export imports
      defaultExports.forEach(exportName => {
        // Match: import { Button } from './Button';
        const regex1 = new RegExp(`import\\s+\\{\\s*${exportName}\\s*\\}\\s+from\\s+['"](.+?)['"];`, 'g');
        content = content.replace(regex1, `import ${exportName} from '$1';`);
        
        // Match: import { Button, ... } from './Button';
        const regex2 = new RegExp(`import\\s+\\{\\s*${exportName}\\s*,\\s*([^}]+)\\s*\\}\\s+from\\s+['"](.+?)['"];`, 'g');
        content = content.replace(regex2, `import ${exportName}, { $1 } from '$2';`);
      });
      
      if (content !== fs.readFileSync(filePath, 'utf8')) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${filePath}`);
      }
    }
  }
}

fixImports(srcDir);
console.log('Import fixing complete!');
