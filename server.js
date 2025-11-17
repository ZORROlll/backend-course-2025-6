const { program } = require('commander');
const http = require('http');
const fs = require('fs');
const path = require('path');

program
  .requiredOption('-h, --host <host>', 'Адреса сервера')
  .requiredOption('-p, --port <port>', 'Порт сервера')
  .requiredOption('-c, --cache <path>', 'Шлях до директорії кешу')
  .parse(process.argv);

const options = program.opts();

// Перевіряємо наявність директорії кешу й створюємо її за потреби
const cachePath = path.resolve(options.cache);
if (!fs.existsSync(cachePath)) {
  console.log(`Створюю директорію кешу: ${cachePath}`);
  fs.mkdirSync(cachePath, { recursive: true });
}

// Створюємо HTTP-сервер
const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Сервіс інвентаризації працює.\n');
  } else if (req.url === '/health' && req.method === 'GET') {
    const healthInfo = {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(healthInfo));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Сторінку не знайдено.\n');
  }
});

// Обробка помилок сервера
server.on('error', (error) => {
  console.error('Помилка сервера:', error.message);
  process.exit(1);
});

// Запуск сервера
server.listen(options.port, options.host, () => {
  console.log('=== Сервіс інвентаризації ===');
  console.log(`Сервер запущено: http://${options.host}:${options.port}`);
  console.log(`Директорія кешу: ${cachePath}`);
  console.log('=============================');
});

// Коректне завершення роботи
process.on('SIGINT', () => {
  console.log('\nЗавершення роботи сервера...');
  server.close(() => {
    console.log('Сервер зупинено.');
    process.exit(0);
  });
});
 
module.exports = server;
