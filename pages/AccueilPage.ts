import { type Page, expect, type Locator } from '@playwright/test';

export class AccueilPage {
  readonly page: Page;
  readonly boutonAccepterCookies: Locator;
  readonly boutonTypeCourse: Locator;
  readonly champSaisieCP: Locator;
  readonly boutonAuchanDriveCambrai: Locator;
  readonly contexteHeaderDrive: Locator;
  readonly inputRechercherProduit: Locator;
  readonly rechercheSugestionCategorie: Locator;
  readonly zonePanier: Locator;
  readonly boutonConnexion : Locator;
  readonly inputUsername : Locator;
  readonly boutonGoogleAuth : Locator;
  readonly boutonFermerModale : Locator;
  readonly boutonValiderMonPanier : Locator;

  constructor(page: Page) {
    this.page = page;
    this.boutonAccepterCookies = page.locator('#onetrust-accept-btn-handler');
    this.boutonTypeCourse = page.getByRole('button', { name: 'Faire mes courses en drive ou en livraison' });
    this.champSaisieCP = page.getByPlaceholder(/Code postal, ville/i);
    
    // Le bouton "Choisir" final pour Cambrai
    this.boutonAuchanDriveCambrai = page.locator('button')
      .filter({ hasText: /^Choisir$/ })
      .and(page.locator('[aria-label*="Cambrai"]'));
    
    this.contexteHeaderDrive = page.locator('span.context-header__pos');
    this.inputRechercherProduit = page.getByRole('searchbox', { name: 'Rechercher un produit...' });
    this.rechercheSugestionCategorie = page.getByRole('link').filter({ hasText: 'Lait demi-écrémé' }).first();
    this.zonePanier = page.locator('a[href="/checkout/cart/"]');
    this.boutonConnexion = page.getByRole('button', { name: 'Connexion' })
    this.inputUsername = page.locator('#username');
    this.boutonGoogleAuth = page.locator('a[href="/auth/resources/"]');
    this.boutonFermerModale = page.locator('[aria-label*="Fermer la fenêtre"]'); 
    this.boutonValiderMonPanier = page.getByRole('button', { name: 'Valider mon panier' });
    
  }

  async goto() {
    await this.page.goto('https://www.auchan.fr');
  }

  async accepterCookies() {
    await this.boutonAccepterCookies.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
    if (await this.boutonAccepterCookies.isVisible()) {
      await this.boutonAccepterCookies.click();
    }
  }

  async choisirTypeCourse() {
    await this.boutonTypeCourse.click();
  }

  /** Saisit le CP et s'assure qu'il est bien écrit en entier */
  async remplirCodePostalVille(cp: string) {
    await this.champSaisieCP.waitFor({ state: 'visible' });
    await this.champSaisieCP.click();
    
    // On utilise fill() pour injecter les 5 chiffres d'un coup, c'est plus stable
    await this.champSaisieCP.fill(cp);
    
    // On attend que la liste de suggestions apparaisse
    await this.page.waitForTimeout(1500); 
  }

  /** Sélectionne le premier élément de la liste de suggestions */
  async sélectionnerPremierResultat() {
    // On cible le premier <li> dans la liste de résultats qui apparaît
    const premiereSuggestion = this.page.locator('ul li').filter({ hasText: /59400/ }).first();
    
    await premiereSuggestion.waitFor({ state: 'visible' });
    await premiereSuggestion.click();
    console.log("📍 Première suggestion cliquée.");
  }

  async validerMagasinCambrai() {
    await this.boutonAuchanDriveCambrai.waitFor({ state: 'visible' });
    await this.boutonAuchanDriveCambrai.click();
    // Vérification que le magasin est bien sélectionné dans le header
    await expect(this.contexteHeaderDrive).toHaveText(/Auchan Drive Cambrai/i, { timeout: 15000 });
  }

  async rechercherUnProduit(produit: string) {
    await this.inputRechercherProduit.fill(produit);
    await this.rechercheSugestionCategorie.waitFor({ state: 'visible' });
    await this.rechercheSugestionCategorie.click();
  }

  async ajouterAuPanierSpecifiqueBio(): Promise<Locator> {
    const carteProduit = this.page.locator('article, .product-item')
      //.filter({ hasText: /BIO/i })
      .filter({ hasText: /LACTEL/i })
      //.filter({ hasText: /6x1l/i })
      .first();

    await carteProduit.waitFor({ state: 'visible' });
    const boutonAjouter = carteProduit.locator('button[aria-label*="au panier"]');
    await boutonAjouter.click();
    
    return carteProduit; 
  }

  async multiplierQuantite(carteProduit: Locator, clics: number) {
    const boutonPlus = carteProduit.locator('button[data-action="INCREASE"]');
    for (let i = 0; i < clics; i++) {
        await boutonPlus.waitFor({ state: 'visible' });
        await boutonPlus.click();
        await this.page.waitForTimeout(800); 
    }
    //await this.zonePanier.click();
    
  }

   async modaleConnexion(username: string) {
    //await this.boutonConnexion.click();
    //await this.inputUsername.fill(username);
    //await this.boutonGoogleAuth.click();
    await this.boutonFermerModale.click();
    await this.zonePanier.click();
    await this.boutonValiderMonPanier.click();
    await this.inputUsername.fill(username);
  }
}