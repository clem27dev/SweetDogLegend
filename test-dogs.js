import { initialDogs, initialResources } from './server/data/initial.js';
import fs from 'fs';

// Fonction pour tester les chiens initiaux
function testInitialDogs() {
  console.log("=== TEST DES CHIENS DE DÉPART ===");
  
  // Vérifier si les chiens existent
  if (!initialDogs || initialDogs.length === 0) {
    console.error("ERREUR: Les chiens initiaux n'ont pas été trouvés!");
    return false;
  }
  
  // Vérifier s'il y a exactement 2 chiens
  if (initialDogs.length !== 2) {
    console.error(`ERREUR: Il devrait y avoir exactement 2 chiens, mais il y en a ${initialDogs.length}`);
    return false;
  }
  
  // Vérifier les noms des chiens
  const luc = initialDogs.find(dog => dog.name === "Luc");
  const lynda = initialDogs.find(dog => dog.name === "Lynda");
  
  if (!luc) {
    console.error("ERREUR: Le chien 'Luc' n'a pas été trouvé!");
    return false;
  }
  
  if (!lynda) {
    console.error("ERREUR: Le chien 'Lynda' n'a pas été trouvé!");
    return false;
  }
  
  // Vérifier les statistiques des chiens
  console.log("Chien Luc trouvé :");
  console.log(`- Niveau: ${luc.level}`);
  console.log(`- Force: ${luc.stats.strength}`);
  console.log(`- Agilité: ${luc.stats.agility}`);
  console.log(`- Défense: ${luc.stats.defense}`);
  
  console.log("\nChien Lynda trouvé :");
  console.log(`- Niveau: ${lynda.level}`);
  console.log(`- Force: ${lynda.stats.strength}`);
  console.log(`- Agilité: ${lynda.stats.agility}`);
  console.log(`- Défense: ${lynda.stats.defense}`);
  
  console.log("\n=== TEST RÉUSSI ===");
  console.log("Les chiens Luc et Lynda ont été correctement configurés comme chiens de départ.");
  
  return true;
}

// Exécuter le test
testInitialDogs();