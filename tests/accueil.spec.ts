import { test, expect } from '@playwright/test';
import { AccueilPage } from '../pages/AccueilPage';

test('Test complet : Drive Cambrai et Lait Bio', async ({ page }) => {
  const accueilPage = new AccueilPage(page);

  await accueilPage.goto();
  await accueilPage.accepterCookies();
  await accueilPage.choisirTypeCourse();
  
  // Etape Code Postal
  await accueilPage.remplirCodePostalVille('59400');
  await accueilPage.sélectionnerPremierResultat(); // Clique sur la suggestion Cambrai
  await accueilPage.validerMagasinCambrai();       // Clique sur "Choisir"
  
  // Etape Recherche et Ajout
  await accueilPage.rechercherUnProduit('Lait');
  const maCarteBio = await accueilPage.ajouterAuPanierSpecifiqueBio();
  
  // Etape Multiplication (pour en avoir 3 au total)
  await accueilPage.multiplierQuantite(maCarteBio, 2);

  // Vérification finale au niveau du panier
  //await expect(accueilPage.zonePanier).not.toContainText(/0,00/);
  await accueilPage.modaleConnexion('tubiana.severine@gmail.com');
});