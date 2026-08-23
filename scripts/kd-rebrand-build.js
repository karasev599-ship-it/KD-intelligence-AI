const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const replacements = [
  ['KriptoDanik AI · AI Коуч', 'KD Intelligence · AI Коуч'],
  ['KriptoDanik AI · AI Coach', 'KD Intelligence · AI Coach'],
  ['KRIPTODANIK AI • TRADING INTELLIGENCE', 'KD INTELLIGENCE • TRADING INTELLIGENCE'],
  ['KRIPTODANIK AI', 'KD INTELLIGENCE'],
  ['KriptoDanik AI', 'KD Intelligence'],
  ['KriptoDanik', 'KD Intelligence'],
  ['AI-проводник в трейдинге.', 'AI-интеллект для анализа, дисциплины и контроля риска.'],
  ['AI-проводник', 'AI-интеллект']
];

function replaceAll(value) {
  return replacements.reduce((out, [from, to]) => out.split(from).join(to), value);
}

const indexPath = path.join(root, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');
index = replaceAll(index);
index = index.replace(/\?v=1\.9\.1/g, '?v=1.9.0');
index = index.replace(/<meta name="application-version" content="[^"]*">/, '<meta name="application-version" content="1.9.0">');
index = index.replace(/<title>[^<]*<\/title>/, '<title>KD Intelligence — Trading Intelligence</title>');
index = index.replace(/<meta name="description" content="[^"]*">/, '<meta name="description" content="KD Intelligence — AI-интеллект для трейдинга. Анализ сделок, журнал, контроль риска и развитие торговой дисциплины.">');
index = index.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="KD Intelligence — Trading Intelligence">');
index = index.replace(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="AI-powered trading intelligence for disciplined traders.">');
index = index.replace(/<meta property="og:image:alt" content="[^"]*">/, '<meta property="og:image:alt" content="KD Intelligence">');
index = index.replace(/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="KD Intelligence — Trading Intelligence">');
index = index.replace(/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="AI-powered trading intelligence for disciplined traders.">');
index = index.replace(/AI v\d+\.\d+\.\d+/, 'AI v1.9.0');
index = index.replace(/(<div class="info-row"><span>Версия<\/span><span>)v\d+\.\d+(?:\.\d+)?(<\/span>)/, '$1v1.9.0$2');
index = index.replace(/const BUILD = '[^']*';/, "const BUILD = '1.9.0';");
fs.writeFileSync(indexPath, index);

const manifestPath = path.join(root, 'manifest.webmanifest');
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  manifest = manifest.replace(/"name"\s*:\s*"[^"]*"/, '"name": "KD Intelligence — Trading Intelligence"');
  manifest = manifest.replace(/"short_name"\s*:\s*"[^"]*"/, '"short_name": "KD Intelligence"');
  manifest = manifest.replace(/"description"\s*:\s*"[^"]*"/, '"description": "AI-интеллект для трейдинга. Анализ сделок, журнал, контроль риска и развитие торговой дисциплины."');
  fs.writeFileSync(manifestPath, manifest);
}

console.log('KD Intelligence v1.9.0 production rebrand applied.');
