import { test, expect } from '@playwright/test';
import { AccueilPage } from '../pages/AccueilPage';

/**
 * Suite de tests pour le tunnel d'achat du site Auchan.
 * .describe permet de regrouper plusieurs tests liés à une même fonctionnalité.
 */
test.describe('Tunnel d\'achat Auchan', () => {

  test('Ajout au panier du Lait Bio à Cambrai', async ({ page }) => {
    // Initialisation de la Page Object
    const accueilPage = new AccueilPage(page);

    // --- ÉTAPE 1 : Accès et configuration initiale ---
    await accueilPage.goto();
    await accueilPage.accepterCookies();

    // --- ÉTAPE 2 : Sélection du point de retrait (Drive) ---
    // On ouvre la sélection du type de course
    await accueilPage.choisirTypeCourse();
    
    // On saisit le code postal de Cambrai (59400)
    await accueilPage.remplirCodePostalVille('59400');
    
    // On sélectionne précisément le drive de Cambrai dans la liste
    await accueilPage.sélectionnerAuchanDriveCambrai();

    // --- ÉTAPE 3 : Recherche et sélection du produit ---
    // On lance une recherche générique pour le mot "lait"
    await accueilPage.rechercherUnProduit('lait');

    // On utilise la méthode spécifique pour ajouter le pack de lait BIO identifié
    await accueilPage.ajouterAuPanierSpecifiqueBio();

    // --- ÉTAPE 4 : Assertion (Vérification du résultat) ---
    /**
     * ASSERTION FINALE BASÉE SUR LE PRIX :
     * Pourquoi le prix plutôt que la pastille "1" ?
     * Parce que le texte du prix (ex: 5,99€) est souvent plus stable dans le DOM 
     * que l'élément graphique du compteur de quantité.
     * * On attend que le montant affiché dans la zone panier ne soit plus "0,00".
     * .not.toContainText(/0,00/) est très puissant car il attend 
     * automatiquement jusqu'à ce que la condition soit remplie (polling).
     */
    await expect(accueilPage.zonePanier).not.toContainText(/0,00/, { timeout: 20000 });

    // Extraction du texte final pour le journal de bord (log)
    const montantFinal = await accueilPage.zonePanier.innerText();
    
    // Affichage d'un message de succès dans la console pour confirmer la fin du test
    console.log(`✅ Test validé ! Panier mis à jour : ${montantFinal.trim()}`);
  });

});