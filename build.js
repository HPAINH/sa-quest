const fs = require('fs');
const path = require('path');
const root = __dirname;
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="((?!https?:)[^"]+)">/g, (m, href) => '<style>\n' + fs.readFileSync(path.join(root, href), 'utf8') + '\n</style>');
html = html.replace(/<script src="((?!https?:)[^"]+)"><\/script>/g, (m, src) => '<script>\n' + fs.readFileSync(path.join(root, src), 'utf8').replace(/<\/script>/gi, '<\\/script>') + '\n</script>');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html);
console.log('dist/index.html', Math.round(html.length / 1024) + ' KB');
