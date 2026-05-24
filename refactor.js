const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(/\/\* window\._fb is loaded synchronously via firebase\.js .* \*\//g, '');
content = content.replace(/\/\/ .* auth is now Firebase Authentication\./g, '');
content = content.replace(/\/\/ Login calls window\._fb\.fbLogin.*/g, '');
content = content.replace(/\/\* ---- Admin session: Firebase Auth is the source of truth ---- \*\//g, '');
content = content.replace(/3\. STATE HELPERS  \(Firebase Firestore backed\)/g, '3. STATE HELPERS (Static JSON)');
content = content.replace(/localStorage\.removeItem\('pj_admin'\);.*legacy key\nlocalStorage\.removeItem\('pj_admin_tok'\);.*session token\n/g, '');

fs.writeFileSync('index.html', content);
