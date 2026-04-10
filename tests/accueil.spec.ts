import { test, expect } from '@playwright/test';
import { AccueilPage } from '../pages/AccueilPage';

test.describe('Tests tunnel d\'achat Auchan', () => {

  test('Recherche de produit après sélection du Drive Cambrai', async ({ page }) => {
    const accueilPage = new AccueilPage(page);

    // 1. Initialisation : Navigation et Cookies
    await accueilPage.goto();
    await accueilPage.accepterCookies();

    // 2. Sélection du mode de retrait
    await accueilPage.choisirTypeCourse();
    
    // On enchaîne la saisie et la validation du magasin
    await accueilPage.remplirCodePostalVille('Cambrai');
    await accueilPage.sélectionnerAuchanDriveCambrai();

    // 3. Recherche produit
    await accueilPage.rechercherUnProduit('lait');

    // 4. Assertion Finale : Vérifier que l'URL a changé ou qu'un titre de rayon est présent
    // Cela confirme que le clic sur la suggestion a bien fonctionné
    await expect(page).toHaveURL(/.*keywords=lait/i);
    // Ou vérifier le titre de la page de résultats
    await expect(page.locator('h1')).toContainText(/Lait/i);


  });

});