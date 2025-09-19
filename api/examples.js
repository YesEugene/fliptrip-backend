const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Путь к папке с примерами
const examplesDir = path.join(__dirname, '../data/examples');

// Список доступных примеров
const examples = [
  {
    id: 'paris-spa-relaxation',
    city: 'Paris',
    interests: ['Spa', 'Relaxation'],
    audience: 'Individual',
    file: 'paris-spa-relaxation.json'
  },
  {
    id: 'barcelona-cycling-architecture',
    city: 'Barcelona',
    interests: ['Cycling', 'Architecture'],
    audience: 'Individual',
    file: 'barcelona-cycling-architecture.json'
  },
  {
    id: 'rome-family-city-gems',
    city: 'Rome',
    interests: ['Family', 'City gems'],
    audience: 'Family',
    file: 'rome-family-city-gems.json'
  },
  {
    id: 'lisbon-romantic-culture',
    city: 'Lisbon',
    interests: ['Romantic', 'Culture'],
    audience: 'Couple',
    file: 'lisbon-romantic-culture.json'
  }
];

// GET /api/examples - получить список всех примеров
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      examples: examples.map(example => ({
        id: example.id,
        city: example.city,
        interests: example.interests,
        audience: example.audience
      }))
    });
  } catch (error) {
    console.error('Error getting examples list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get examples list'
    });
  }
});

// GET /api/examples/:id - получить конкретный пример
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Найти пример по ID
    const example = examples.find(ex => ex.id === id);
    if (!example) {
      return res.status(404).json({
        success: false,
        error: 'Example not found'
      });
    }

    // Прочитать файл с примером
    const filePath = path.join(examplesDir, example.file);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const exampleData = JSON.parse(fileContent);

    res.json({
      success: true,
      example: exampleData
    });
  } catch (error) {
    console.error('Error getting example:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get example'
    });
  }
});

module.exports = router;
