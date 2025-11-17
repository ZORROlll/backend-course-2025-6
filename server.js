const { program } = require('commander');

program
  .requiredOption('-h, --host <host>', 'Адреса сервера')
  .requiredOption('-p, --port <port>', 'Порт сервера')
  .requiredOption('-c, --cache <path>', 'Шлях до директорії кешу')
  .parse(process.argv);

const options = program.opts();

console.log('=== Сервіс інвентаризації ===');
console.log('Хост:', options.host);
console.log('Порт:', options.port);
console.log('Шлях кешу:', options.cache);
console.log('=============================');

console.log('Сервер налаштовано. Готовий до запуску!');