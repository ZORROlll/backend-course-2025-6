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

// HTML-форма реєстрації
app.get('/RegisterForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'RegisterForm.html'));
});

// HTML-форма пошуку
app.get('/SearchForm.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'SearchForm.html'));
});

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

// GET /inventory - список усіх речей
app.get('/inventory', (req, res) => {
  const inventoryWithUrls = inventory.map(item => ({
    id: item.id,
    inventory_name: item.inventory_name,
    description: item.description,
    photo_url: item.photo_filename ? `/inventory/${item.id}/photo` : null
  }));

  res.json(inventoryWithUrls);
});

// GET /inventory/:id - одна конкретна річ
app.get('/inventory/:id', (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const item = inventory.find(i => i.id === itemId);

  if (!item) {
    return res.status(404).json({ error: 'Річ не знайдена' });
  }

  res.json({
    id: item.id,
    inventory_name: item.inventory_name,
    description: item.description,
    photo_url: item.photo_filename ? `/inventory/${item.id}/photo` : null
  });
});

// PUT /inventory/:id - оновлення назви/опису
app.put('/inventory/:id', (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const item = inventory.find(i => i.id === itemId);

  if (!item) {
    return res.status(404).json({ error: 'Річ не знайдена' });
  }

  const { inventory_name, description } = req.body;

  if (inventory_name !== undefined) {
    item.inventory_name = inventory_name;
  }

  if (description !== undefined) {
    item.description = description;
  }

  res.json({ message: 'Інформацію про річ оновлено' });
});

// GET /inventory/:id/photo - повертає фото
app.get('/inventory/:id/photo', (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const item = inventory.find(i => i.id === itemId);

  if (!item || !item.photo_filename) {
    return res.status(404).json({ error: 'Фото не знайдено' });
  }

  const photoPath = path.join(cachePath, item.photo_filename);
  if (!fs.existsSync(photoPath)) {
    return res.status(404).json({ error: 'Файл фото не знайдено' });
  }

  res.setHeader('Content-Type', 'image/jpeg');
  res.sendFile(photoPath);
});

// DELETE /inventory/:id - видалення речі
app.delete('/inventory/:id', (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  const itemIndex = inventory.findIndex(i => i.id === itemId);

  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Річ не знайдена' });
  }

  const item = inventory[itemIndex];

  if (item.photo_filename) {
    const photoPath = path.join(cachePath, item.photo_filename);
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
  }

  inventory.splice(itemIndex, 1);

  res.json({ message: 'Річ успішно видалена' });
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