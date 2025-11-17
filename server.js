const { program } = require('commander');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const http = require('http');

program
  .requiredOption('-h, --host <host>', 'Адреса сервера')
  .requiredOption('-p, --port <port>', 'Порт сервера')
  .requiredOption('-c, --cache <path>', 'Шлях до директорії кешу')
  .parse(process.argv);

const options = program.opts();

// Перевіряємо/створюємо директорію кешу
const cachePath = path.resolve(options.cache);
if (!fs.existsSync(cachePath)) {
  console.log(`Створюю директорію кешу: ${cachePath}`);
  fs.mkdirSync(cachePath, { recursive: true });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Налаштування multer для завантаження файлів
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, cachePath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// "База даних" у пам'яті
let inventory = [];
let nextId = 1;

// POST /register - реєстрація нового пристрою
app.post('/register', upload.single('photo'), (req, res) => {
  const { inventory_name, description } = req.body;

  if (!inventory_name) {
    return res.status(400).json({ error: "Ім'я речі обов'язкове" });
  }

  const newItem = {
    id: nextId++,
    inventory_name,
    description: description || '',
    photo_filename: req.file ? req.file.filename : null
  };

  inventory.push(newItem);

  res.status(201).json({
    message: 'Пристрій успішно зареєстрований',
    id: newItem.id
  });
});

// Створюємо HTTP сервер з допомогою модуля http
const server = http.createServer(app);

// Запускаємо сервер з параметрами --host та --port
server.listen(options.port, options.host, () => {
  console.log('=== Сервіс інвентаризації ===');
  console.log(`Сервер запущено: http://${options.host}:${options.port}`);
  console.log(`Директорія кешу: ${cachePath}`);
  console.log('=============================');
});

module.exports = app;