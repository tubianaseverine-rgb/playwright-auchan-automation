import { test, expect } from '@playwright/test';
import { AccueilPage } from '../pages/AccueilPage';

test.describe('Tunnel d\'achat Auchan', () => {

  test('Ajout au panier du Lait Bio à Cambrai', async ({ page }) => {
    const accueilPage = new AccueilPage(page);

    await accueilPage.goto();
    await accueilPage.accepterCookies();
    await accueilPage.choisirTypeCourse();
    await accueilPage.remplirCodePostalVille('59400');
    await accueilPage.sélectionnerAuchanDriveCambrai();

    await accueilPage.rechercherUnProduit('lait');

    // Ajout du produit BIO spécifique
    await accueilPage.ajouterAuPanierSpecifiqueBio();

    // --- ASSERTION FINALE BASÉE SUR LE PRIX ---
    // On attend que le montant ne soit plus de 0,00€
    // C'est la preuve que le panier a été mis à jour
    await expect(accueilPage.zonePanier).not.toContainText(/0,00/, { timeout: 20000 });

    // Petit log de confirmation avec le montant final trouvé
    const montantFinal = await accueilPage.zonePanier.innerText();
    console.log(`✅ Test validé ! Panier mis à jour : ${montantFinal.trim()}`);
  });

});