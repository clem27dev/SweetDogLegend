import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le serveur Express
const app = express();
const server = createServer(app);

// Importer les routes API principales
import('./server/routes.js').then(({ registerRoutes }) => {
  registerRoutes(app).then(() => {
    console.log('Routes API enregistrées avec succès');
  });
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'client', 'public')));

// Route par défaut pour envoyer l'index.html
app.get('*', (req, res) => {
  // Envoyer le fichier index.html pour toutes les autres requêtes
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur http://0.0.0.0:${PORT}`);
  console.log('Appuyez sur Ctrl+C pour arrêter le serveur');
});