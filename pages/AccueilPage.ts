import { type Page, expect, type Locator } from '@playwright/test';

export class AccueilPage {
  readonly page: Page;
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
    this.boutonAccepterCookies = page.locator('#onetrust-accept-btn-handler');
    this.boutonTypeCourse = page.getByRole('button', { name: 'Faire mes courses en drive ou en livraison' });
    this.titremodaleChoisirLivraisonDrive = page.getByText(/Choisir un drive ou la livraison/i);
    this.champSaisieCP = page.getByPlaceholder(/Code postal, ville/i);
    
    this.boutonAuchanDriveCambrai = page.locator('button')
      .filter({ hasText: /^Choisir$/ })
      .and(page.locator('[aria-label*="Cambrai"]'));
    
    this.contexteHeaderDrive = page.locator('span.context-header__pos');
    this.inputRechercherProduit = page.getByRole('searchbox', { name: 'Rechercher un produit...' });
    this.rechercheSugestionCategorie = page.getByRole('link').filter({ hasText: 'Lait demi-écrémé' }).first();
    
    // On cible la zone du panier qui contient le prix et la quantité
    this.zonePanier = page.locator('.header-cart, .context-header__cart, #mini-cart');
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
    await this.titremodaleChoisirLivraisonDrive.first().waitFor({ state: 'visible' });
  }

  async remplirCodePostalVille(cp: string) {
    await this.champSaisieCP.waitFor({ state: 'visible' });
    await this.champSaisieCP.click();
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Backspace');
    await this.champSaisieCP.pressSequentially(cp, { delay: 150 });

    // Sécurité si la saisie est incomplète
    if (await this.champSaisieCP.inputValue() !== cp) {
        await this.champSaisieCP.fill(cp);
    }

    await this.page.waitForTimeout(1000);
    await this.page.keyboard.press('ArrowDown');
  }

  async sélectionnerAuchanDriveCambrai() {
    const suggestion = this.page.locator('li').filter({ hasText: /Cambrai/i }).first();
    await suggestion.waitFor({ state: 'visible', timeout: 15000 });
    await suggestion.click();

    await this.boutonAuchanDriveCambrai.waitFor({ state: 'visible' });
    await this.boutonAuchanDriveCambrai.click();
    
    await expect(this.contexteHeaderDrive).toHaveText(/Auchan Drive Cambrai/i, { timeout: 15000 });
  }

  async rechercherUnProduit(produit: string) {
    await this.inputRechercherProduit.waitFor({ state: 'visible' });
    await this.inputRechercherProduit.fill(produit);
    await this.rechercheSugestionCategorie.waitFor({ state: 'visible', timeout: 10000 });
    await this.rechercheSugestionCategorie.click();
  }

  async ajouterAuPanierSpecifiqueBio() {
    // Ciblage par la "Carte Produit" pour être ultra-précis
    const carteProduit = this.page.locator('article, .product-item, .pwa-product-tile')
      .filter({ hasText: /BIO/i })
      .filter({ hasText: /6x1l/i })
      .first();

    await carteProduit.waitFor({ state: 'visible', timeout: 15000 });
    
    const boutonAjouter = carteProduit.locator('button').filter({ hasText: /Ajouter/i });
    await boutonAjouter.scrollIntoViewIfNeeded();
    await boutonAjouter.click();
    
    console.log(`🛒 Clic sur "Ajouter" pour le produit BIO.`);
  }
}