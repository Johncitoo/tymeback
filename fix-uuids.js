const fs = require('fs');
const path = require('path');

function fixUUIDs(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && file !== 'node_modules') {
      fixUUIDs(fullPath);
    } else if (file.endsWith('.dto.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // Reemplazar @IsUUID() por @Matches(...)
      if (content.includes('@IsUUID()')) {
        content = content.replace(/@IsUUID\(\)/g, '@Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)');
        changed = true;
      }
      
      // Reemplazar @IsUUID('4') por @Matches(...)
      if (content.includes("@IsUUID('4')")) {
        content = content.replace(/@IsUUID\('4'\)/g, '@Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)');
        changed = true;
      }
      
      // Reemplazar @IsUUID('4', { each: true })
      if (content.includes("@IsUUID('4', { each: true })")) {
        content = content.replace(/@IsUUID\('4', \{ each: true \}\)/g, '@Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, { each: true })');
        changed = true;
      }
      
      if (changed) {
        // Agregar Matches al import si no existe
        if (!content.includes('Matches')) {
          content = content.replace(
            /from 'class-validator';/,
            ", Matches from 'class-validator';"
          );
        }
        
        // Remover IsUUID del import si ya no se usa
        if (!content.includes('@IsUUID')) {
          content = content.replace(/,\s*IsUUID/g, '');
          content = content.replace(/IsUUID,\s*/g, '');
        }
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✓ Fixed: ${fullPath}`);
      }
    }
  }
}

console.log('Fixing all UUID validators...');
fixUUIDs('./src');
console.log('Done!');
