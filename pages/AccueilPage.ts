import { type Page, expect, type Locator } from '@playwright/test';

export class AccueilPage {
  readonly page: Page;
  readonly boutonAccepterCookies: Locator;
  readonly boutonTypeCourse: Locator;
  readonly titremodaleChoisirLivraisonDrive: Locator;
  readonly champSaisieCP: Locator;
  readonly boutonAuchanDriveCambrai: Locator;
  readonly texteVosCourses: Locator;
  readonly texteAuchanDrive: Locator;
  readonly inputRechercherProduit: Locator;
  readonly rechercheSugestionCategorie: Locator;

  constructor(page: Page) {
    this.page = page;
    this.boutonAccepterCookies = page.locator('#onetrust-accept-btn-handler');
    this.boutonTypeCourse = page.getByRole('button', { name: 'Faire mes courses en drive ou en livraison' });
    this.titremodaleChoisirLivraisonDrive = page.getByText(/Choisir un drive ou la livraison/i);
    this.champSaisieCP = page.getByPlaceholder(/Code postal, ville/i);
    this.texteVosCourses = page.getByText(/C'est noté ! Vos courses/i);
    this.texteAuchanDrive = page.getByRole('button', { name: /Drive Auchan Drive Cambrai/i });
    
    // Correction : Ajout du point-virgule manquant et sélecteur searchbox
    this.inputRechercherProduit = page.getByRole('searchbox', { name: 'Rechercher un produit...' });
    
    // Optimisation : On cible le lien (parent) pour s'assurer que le clic est bien intercepté
    this.rechercheSugestionCategorie = page.getByRole('link').filter({ hasText: 'Lait demi-écrémé' }).first();

    this.boutonAuchanDriveCambrai = page.locator('button')
      .filter({ hasText: /^Choisir$/ })
      .and(page.locator('[aria-label*="Cambrai"]'));
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
    await this.champSaisieCP.fill(cp);
    // Note : Si la suggestion n'apparaît pas, repasse sur pressSequentially(cp, { delay: 100 })
  }

  async sélectionnerAuchanDriveCambrai() {
    const suggestion = this.page.locator('ul[role="listbox"] li, .journey__search-results-list-item').first();
    await suggestion.waitFor({ state: 'visible', timeout: 8000 });
    await suggestion.click();

    await this.boutonAuchanDriveCambrai.waitFor({ state: 'visible', timeout: 10000 });
    await this.boutonAuchanDriveCambrai.click();

    // On attend que la confirmation apparaisse PUIS disparaisse (le tunnel se ferme)
    await expect(this.texteVosCourses).toBeVisible({ timeout: 10000 });
    await expect(this.texteVosCourses).toBeHidden({ timeout: 10000 });
    
    // On vérifie que le header s'est mis à jour avec le bon magasin
    await expect(this.texteAuchanDrive).toBeVisible({ timeout: 10000 });
  }

  async rechercherUnProduit(produit: string) {
    await this.inputRechercherProduit.waitFor({ state: 'visible' });
    await this.inputRechercherProduit.fill(produit);
    
    // Attendre que la suggestion spécifique soit visible
    // Utiliser .first() pour éviter l'erreur de "strict mode violation" si plusieurs catégories matchent
    await this.rechercheSugestionCategorie.waitFor({ state: 'visible', timeout: 10000 });
    await this.rechercheSugestionCategorie.click();
  }
}