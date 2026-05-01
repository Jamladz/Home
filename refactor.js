const fs = require('fs');
function processFile(file) {
  let code = fs.readFileSync(file, 'utf-8');
  if (!code.includes('tx(')) {
    code = code.replace(/const { t, language } = useLanguage\(\);/g, 'const { t, language, tx } = useLanguage();');
  }

  // Regex for `language === 'ar' ? "A" : "B"`
  // This is tricky because "A" and "B" can be fragments, strings, etc.
}
