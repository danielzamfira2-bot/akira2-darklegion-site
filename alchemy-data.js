window.ALCHEMY_CATALOG = Object.freeze({
  ruby: {
    itemId: 'rubin-dragon-mitic',
    name: 'Rubin Dragon Mitic',
    source: 'https://ro-wiki.metin2.gameforge.com/index.php/Rubin_Dragon_Mitic_%28Opac%29',
    baseBonuses: ['Putere', 'Rezistență la foc', 'Puterea focului'],
    possibleBonuses: [
      { id: 'averageDamage', label: 'Pagubă medie', valueKey: 'averageDamage', suffix: '%' },
      { id: 'attackValue', label: 'Valoarea atacului', valueKey: 'attackValue', prefix: '+' },
      { id: 'defense', label: 'Apărare', valueKey: 'defense', prefix: '+' },
      { id: 'averageResistance', label: 'Rezistență la paguba medie', valueKey: 'averageResistance', suffix: '%' }
    ],
    clarities: {
      opac: {
        label: 'Opac',
        levels: [
          { base: 4, averageDamage: 6, attackValue: 105, defense: 70, averageResistance: 6 },
          { base: 4, averageDamage: 6, attackValue: 120, defense: 80, averageResistance: 6 },
          { base: 5, averageDamage: 7, attackValue: 135, defense: 90, averageResistance: 7 },
          { base: 5, averageDamage: 8, attackValue: 150, defense: 100, averageResistance: 8 },
          { base: 6, averageDamage: 9, attackValue: 165, defense: 105, averageResistance: 9 }
        ]
      },
      clar: {
        label: 'Clar',
        levels: [
          { base: 5, averageDamage: 7, attackValue: 135, defense: 90, averageResistance: 7 },
          { base: 5, averageDamage: 8, attackValue: 150, defense: 100, averageResistance: 8 },
          { base: 6, averageDamage: 9, attackValue: 165, defense: 110, averageResistance: 9 },
          { base: 6, averageDamage: 9, attackValue: 180, defense: 120, averageResistance: 9 },
          { base: 7, averageDamage: 10, attackValue: 195, defense: 130, averageResistance: 10 }
        ]
      },
      perfect: {
        label: 'Perfect',
        levels: [
          { base: 5, averageDamage: 8, attackValue: 150, defense: 100, averageResistance: 8 },
          { base: 6, averageDamage: 9, attackValue: 165, defense: 110, averageResistance: 9 },
          { base: 6, averageDamage: 9, attackValue: 180, defense: 120, averageResistance: 9 },
          { base: 7, averageDamage: 11, attackValue: 210, defense: 140, averageResistance: 11 },
          { base: 8, averageDamage: 12, attackValue: 240, defense: 160, averageResistance: 12 }
        ]
      },
      stralucitor: {
        label: 'Strălucitor',
        levels: [
          { base: 7, averageDamage: 10, attackValue: 195, defense: 130, averageResistance: 10 },
          { base: 8, averageDamage: 12, attackValue: 225, defense: 150, averageResistance: 12 },
          { base: 9, averageDamage: 13, attackValue: 255, defense: 170, averageResistance: 13 },
          { base: 10, averageDamage: 15, attackValue: 285, defense: 190, averageResistance: 15 },
          { base: 11, averageDamage: 16, attackValue: 315, defense: 210, averageResistance: 16 },
          { base: 12, averageDamage: 18, attackValue: 360, defense: 240, averageResistance: 18 }
        ]
      },
      excelent: {
        label: 'Excelent',
        levels: [
          { base: 8, averageDamage: 12, attackValue: 225, defense: 150, averageResistance: 12 },
          { base: 9, averageDamage: 13, attackValue: 255, defense: 170, averageResistance: 13 },
          { base: 10, averageDamage: 15, attackValue: 285, defense: 190, averageResistance: 15 },
          { base: 11, averageDamage: 16, attackValue: 315, defense: 150, averageResistance: 16 },
          { base: 12, averageDamage: 18, attackValue: 360, defense: 240, averageResistance: 18 },
          { base: 14, averageDamage: 20, attackValue: 405, defense: 270, averageResistance: 20 },
          { base: 16, averageDamage: 24, attackValue: 480, defense: 320, averageResistance: 24 }
        ]
      }
    }
  }
});
