import { type Page, expect, type Locator } from '@playwright/test';

/**
 * Classe représentant la page d'accueil d'Auchan.fr
 * Utilise le design pattern "Page Object Model" (POM) pour séparer la logique de test des sélecteurs.
 */
export class AccueilPage {
  readonly page: Page;
  // Définition des éléments (Locators) de la page
  readonly boutonAccepterCookies: Locator;
  readonly boutonTypeCourse: Locator;
  readonly titremodaleChoisirLivraisonDrive: Locator;
  readonly champSaisieCP: Locator;
  readonly boutonAuchanDriveCambrai: Locator;
  readonly contexteHeaderDrive: Locator;
  readonly inputRechercherProduit: Locator;
  readonly rechercheSugestionCategorie: Locator;
  readonly zonePanier: Locator;

  constructor(page: Page) {
    this.page = page;

    // --- INITIALISATION DES LOCATORS ---

    // Bouton de gestion des cookies (ID spécifique)
    this.boutonAccepterCookies = page.locator('#onetrust-accept-btn-handler');

    // Bouton pour ouvrir la sélection du mode de livraison
    this.boutonTypeCourse = page.getByRole('button', { name: 'Faire mes courses en drive ou en livraison' });

    // Titre de la modale pour confirmer qu'elle est bien ouverte
    this.titremodaleChoisirLivraisonDrive = page.getByText(/Choisir un drive ou la livraison/i);

    // Champ de texte pour saisir le code postal ou la ville
    this.champSaisieCP = page.getByPlaceholder(/Code postal, ville/i);
    
    // Sélecteur complexe : On cherche un bouton avec le texte "Choisir" ET qui possède un label contenant "Cambrai"
    this.boutonAuchanDriveCambrai = page.locator('button')
      .filter({ hasText: /^Choisir$/ }) // ^ et $ forcent le texte exact
      .and(page.locator('[aria-label*="Cambrai"]'));
    
    // Élément dans le header qui affiche le magasin actuellement sélectionné
    this.contexteHeaderDrive = page.locator('span.context-header__pos');

    // Barre de recherche principale
    this.inputRechercherProduit = page.getByRole('searchbox', { name: 'Rechercher un produit...' });

    // Suggestion cliquable dans la liste déroulante lors de la recherche
    this.rechercheSugestionCategorie = page.getByRole('link').filter({ hasText: 'Lait demi-écrémé' }).first();
    
    // Zone du panier qui contient le prix (ex: 5,99€) et/ou la pastille de quantité
    this.zonePanier = page.locator('.header-cart, .context-header__cart, #mini-cart');

   /* // On cherche le lien qui mène au panier, c'est universel sur Auchan
    this.zonePanier = page.locator('a[href*="/cart/"], .header-cart');*/
  }

  /** Navigue vers le site Auchan */
  async goto() {
    await this.page.goto('https://www.auchan.fr');
  }

  /** Gère la bannière de cookies si elle apparaît */
  async accepterCookies() {
    // On attend 5s max. Si elle n'est pas là, le catch() évite de faire planter le test.
    await this.boutonAccepterCookies.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
    if (await this.boutonAccepterCookies.isVisible()) {
      await this.boutonAccepterCookies.click();
    }
  }

  /** Ouvre la modale de sélection du mode de livraison */
  async choisirTypeCourse() {
    await this.boutonTypeCourse.click();
    // On vérifie que la modale est visible avant de continuer
    await this.titremodaleChoisirLivraisonDrive.first().waitFor({ state: 'visible' });
  }

  /** Saisit le code postal avec une stratégie anti-blocage */
  async remplirCodePostalVille(cp: string) {
    await this.champSaisieCP.waitFor({ state: 'visible' });
    await this.champSaisieCP.click();

    // On vide le champ proprement (Ctrl+A puis Backspace)
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Backspace');

    // On tape lentement (150ms entre chaque touche) pour laisser l'API Auchan charger
    await this.champSaisieCP.pressSequentially(cp, { delay: 150 });

    // Sécurité : Si le réseau a sauté des caractères, on force la valeur avec fill()
    if (await this.champSaisieCP.inputValue() !== cp) {
        await this.champSaisieCP.fill(cp);
    }

    // Petite pause et simulation de "Flèche Bas" pour déclencher l'apparition des suggestions
    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press('ArrowDown');
  }

  /** Sélectionne la suggestion "Cambrai" et valide le magasin */
  async sélectionnerAuchanDriveCambrai() {
    // On cherche n'importe quel élément de liste (li) contenant "Cambrai"
    const suggestion = this.page.locator('li').filter({ hasText: /Cambrai/i }).first();
    await suggestion.waitFor({ state: 'visible', timeout: 15000 });
    await suggestion.click();

    // On clique sur le bouton "Choisir" du magasin Cambrai
    await this.boutonAuchanDriveCambrai.waitFor({ state: 'visible' });
    await this.boutonAuchanDriveCambrai.click();
    
    // Vérification finale : le header doit maintenant afficher le bon magasin
    await expect(this.contexteHeaderDrive).toHaveText(/Auchan Drive Cambrai/i, { timeout: 15000 });
  }

  /** Effectue une recherche de produit et clique sur une suggestion */
  async rechercherUnProduit(produit: string) {
    await this.inputRechercherProduit.waitFor({ state: 'visible' });
    await this.inputRechercherProduit.fill(produit);
    await this.rechercheSugestionCategorie.waitFor({ state: 'visible', timeout: 10000 });
    await this.rechercheSugestionCategorie.click();
  }

  /** Ajoute au panier un pack de lait BIO spécifique en utilisant la carte produit */
  async ajouterAuPanierSpecifiqueBio() {
    // Stratégie robuste : On localise le conteneur du produit (article) via ses textes
    const carteProduit = this.page.locator('article, .product-item, .pwa-product-tile')
      .filter({ hasText: /BIO/i })   // Doit contenir BIO
      .filter({ hasText: /6x1l/i })  // Doit être le pack de 6
      .first();

    await carteProduit.waitFor({ state: 'visible', timeout: 15000 });
    
    // Dans cette carte uniquement, on cherche le bouton "Ajouter"
    const boutonAjouter = carteProduit.locator('button').filter({ hasText: /Ajouter/i });
    
    // On s'assure que le bouton est à l'écran (scroll) avant de cliquer
    await boutonAjouter.scrollIntoViewIfNeeded();
    await boutonAjouter.click();
    
    console.log(`🛒 Clic sur "Ajouter" pour le produit BIO.`);
  }
}