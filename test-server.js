import express from 'express';
const app = express();
const port = 3000;

// Middleware pour afficher les logs des requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Route pour tester l'API
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Le serveur fonctionne correctement',
    dogs: [
      {
        id: 1,
        name: 'Luc',
        level: 2,
        stats: {
          strength: 12,
          agility: 9,
          defense: 8
        }
      },
      {
        id: 2,
        name: 'Lynda',
        level: 2,
        stats: {
          strength: 8,
          agility: 14,
          defense: 7
        }
      }
    ]
  });
});

// Démarrer le serveur
app.listen(port, '0.0.0.0', () => {
  console.log(`Serveur de test démarré sur http://0.0.0.0:${port}`);
  console.log('Pour vérifier si Luc et Lynda sont configurés, visitez /api/test');
});