const clarityScalars = {
  opac: { label: 'Opac', base: [4, 4, 5, 5, 6], extra: [6, 6, 7, 8, 9] },
  clar: { label: 'Clar', base: [5, 5, 6, 6, 7], extra: [7, 8, 9, 9, 10] },
  perfect: { label: 'Perfect', base: [5, 6, 6, 7, 8], extra: [8, 9, 9, 11, 12] },
  stralucitor: { label: 'Strălucitor', base: [7, 8, 9, 10, 11, 12], extra: [10, 12, 13, 15, 16, 18] },
  excelent: { label: 'Excelent', base: [8, 9, 10, 11, 12, 14, 16], extra: [12, 13, 15, 16, 18, 21, 24] }
};

const scalarClarities = (mapRow = (base, extra) => ({ base, extra })) => Object.fromEntries(
  Object.entries(clarityScalars).map(([key, clarity]) => [key, {
    label: clarity.label,
    levels: clarity.base.map((base, index) => mapRow(base, clarity.extra[index], index, key))
  }])
);

const percentBonus = (id, label, valueKey = 'extra', prefix = '') => ({ id, label, valueKey, prefix, suffix: '%' });
const numberBonus = (id, label, valueKey, prefix = '+') => ({ id, label, valueKey, prefix });
const elementalBase = (attribute, resistance, power, valueKey = 'base') => [
  { label: attribute, valueKey, prefix: '+' },
  { label: resistance, valueKey, suffix: '%' },
  { label: power, valueKey, suffix: '%' }
];

const jadeRows = {
  opac: [[175,4,1050,7,4,4,2],[200,4,1200,8,4,4,2],[225,5,1350,9,5,5,3],[250,5,1500,10,5,5,3],[275,6,1650,11,6,6,3]],
  clar: [[225,5,1350,9,5,5,3],[250,5,1500,10,5,5,3],[275,6,1650,11,6,6,3],[300,6,1800,12,6,6,3],[325,7,1950,13,7,7,4]],
  perfect: [[250,5,1500,10,5,5,3],[275,6,1650,11,6,6,3],[300,6,1800,12,6,6,3],[350,7,2100,14,7,7,4],[400,8,2400,16,8,8,4]],
  stralucitor: [[325,7,1950,13,7,7,4],[375,8,2250,15,8,8,4],[425,9,2550,17,9,9,5],[475,10,2850,19,10,10,5],[525,11,3150,21,11,11,6],[600,12,3600,24,12,12,6]],
  excelent: [[375,8,2250,15,8,8,4],[425,9,2550,17,9,9,5],[475,10,2850,19,10,10,5],[525,11,3150,21,11,11,6],[600,12,3600,24,12,12,6],[675,14,4050,27,14,14,7],[800,16,4800,32,16,16,8]]
};

const resourceClarities = (rows, resourceKey) => Object.fromEntries(Object.entries(rows).map(([key, values]) => [key, {
  label: clarityScalars[key].label,
  levels: values.map(([resource, base, maximum, maximumPercent, absorb, regenerate, restore]) => ({
    [resourceKey]: resource, base, maximum, maximumPercent, absorb, regenerate, restore
  }))
}]));

const rubyRows = {
  opac: [[4,6,105,70],[4,6,120,80],[5,7,135,90],[5,8,150,100],[6,9,165,105]],
  clar: [[5,7,135,90],[5,8,150,100],[6,9,165,110],[6,9,180,120],[7,10,195,130]],
  perfect: [[5,8,150,100],[6,9,165,110],[6,9,180,120],[7,11,210,140],[8,12,240,160]],
  stralucitor: [[7,10,195,130],[8,12,225,150],[9,13,255,170],[10,15,285,190],[11,16,315,210],[12,18,360,240]],
  excelent: [[8,12,225,150],[9,13,255,170],[10,15,285,190],[11,16,315,210],[12,18,360,240],[14,20,405,270],[16,24,480,320]]
};
const rubyClarities = Object.fromEntries(Object.entries(rubyRows).map(([key, rows]) => [key, { label: clarityScalars[key].label, levels: rows.map(([base, averageDamage, attackValue, defense]) => ({ base, averageDamage, attackValue, defense, averageResistance: averageDamage })) }]));

const catalog = {
  ruby: {
    itemId: 'rubin-dragon-mitic', name: 'Rubin Dragon Mitic', source: 'https://ro-wiki.metin2.gameforge.com/index.php/Rubin_Dragon_Mitic_%28Opac%29',
    baseBonuses: elementalBase('Putere', 'Rezistență la foc', 'Puterea focului'),
    possibleBonuses: [percentBonus('averageDamage','Pagubă medie','averageDamage'), numberBonus('attackValue','Valoarea atacului','attackValue'), numberBonus('defense','Apărare','defense'), percentBonus('averageResistance','Rezistență la paguba medie','averageResistance')],
    clarities: rubyClarities
  },
  diamond: {
    itemId: 'diamant-dragon-mitic', name: 'Diamant Dragon Mitic', source: 'https://ro-wiki.metin2.gameforge.com/index.php/Diamant_Dragon_Mitic_%28Opac%29',
    baseBonuses: elementalBase('INT', 'Rezistență la gheață', 'Puterea gheții'),
    possibleBonuses: [percentBonus('skillDamage','Paguba abilității'), percentBonus('skillResistance','Rezistență la paguba abilității'), numberBonus('magicDefense','Apărare magică','extra'), numberBonus('magicAttack','Valoarea atacului magic','extra')],
    clarities: scalarClarities()
  },
  jade: {
    itemId: 'jad-dragon-mitic', name: 'Jad Dragon Mitic', source: 'https://ro-wiki.metin2.gameforge.com/index.php/Jad_Dragon_Mitic_%28Opac%29',
    baseBonuses: [{label:'PM',valueKey:'resource',prefix:'+'},{label:'Rezistență la vânt',valueKey:'base',suffix:'%'},{label:'Puterea vântului',valueKey:'base',suffix:'%'}],
    possibleBonuses: [numberBonus('maxHp','Max. PV','maximum'),percentBonus('maxHpPercent','Max. PV','maximumPercent'),percentBonus('absorbHp','Daune absorbite de PV','absorb'),percentBonus('regenerateHp','Regenerare PV','regenerate'),percentBonus('restoreHp','Șansă de a reface PV','restore')],
    clarities: resourceClarities(jadeRows, 'resource')
  },
  sapphire: {
    itemId: 'safir-dragon-mitic', name: 'Safir Dragon Mitic', source: 'https://ro-wiki.metin2.gameforge.com/index.php/Piatra_Spiritului_Dragon_Safir',
    baseBonuses: elementalBase('DEX', 'Rezistență la pământ', 'Puterea pământului'),
    possibleBonuses: ['Ninja','Șaman','Sura','Războinic','Lycan'].flatMap((race, index) => [percentBonus(`strong${index}`,`Tare împotriva ${race}`),percentBonus(`resist${index}`,`Rezistență împotriva ${race}`)]),
    clarities: scalarClarities()
  },
  garnet: {
    itemId: 'granat-dragon-mitic', name: 'Granat Dragon Mitic', source: 'https://ro-wiki.metin2.gameforge.com/index.php/Piatra_Spiritului_Dragon_Granat',
    baseBonuses: [{label:'PV',valueKey:'resource',prefix:'+'},{label:'Rezistență la fulger',valueKey:'base',suffix:'%'},{label:'Puterea fulgerului',valueKey:'base',suffix:'%'}],
    possibleBonuses: [numberBonus('maxMp','Max. PM','maximum'),percentBonus('maxMpPercent','Max. PM','maximumPercent'),percentBonus('regenerateMp','Regenerare PM','regenerate'),percentBonus('absorbMp','Daune absorbite de PM','absorb'),percentBonus('restoreMp','Șansă de a reface PM','restore')],
    clarities: resourceClarities(Object.fromEntries(Object.entries(jadeRows).map(([key, rows]) => [key, rows.map(([resource, ...rest]) => [resource * 3, ...rest.map((value, index) => index === 1 ? value / 2 : value)])])), 'resource')
  },
  onyx: {
    itemId: 'onyx-dragon-mitic', name: 'Onyx Dragon Mitic', source: 'https://ro-wiki.metin2.gameforge.com/index.php/Piatra_Spiritului_Dragon_Onyx',
    baseBonuses: elementalBase('VIT', 'Rezistență la întunecare', 'Puterea întunecată'),
    possibleBonuses: [percentBonus('arrowAvoid','Șansă de a evita atacul cu săgeți','base'),percentBonus('piercingResistance','Rezistență la lovituri pătrunzătoare','base'),percentBonus('criticalResistance','Rezistență la lovituri critice','base'),percentBonus('bodyBlock','Șansă de a bloca atacul corporal','base'),percentBonus('bodyReflect','Șansă de a reflecta atacul corporal','base')],
    clarities: scalarClarities()
  },
  amethyst: {
    itemId: 'ametist-dragon-mitic', name: 'Ametist Dragon Mitic', source: 'https://ro-wiki.metin2.gameforge.com/index.php/Piatra_Spiritului_Dragon_Ametist',
    baseBonuses: [{label:'Tare împotriva Diavolului',valueKey:'base',prefix:'+',suffix:'%'},{label:'Precizie',valueKey:'base',prefix:'+'},{label:'Voință SungMa (VIT)',valueKey:'base',prefix:'+'}],
    possibleBonuses: [numberBonus('sungmaStr','Voință SungMa (STR)','base'),numberBonus('sungmaRes','Voință SungMa (RES)','base'),numberBonus('sungmaInt','Voință SungMa (INT)','base'),percentBonus('metinPower','Putere împotriva Pietrelor Metin','metin')],
    clarities: scalarClarities((base) => ({base, metin: Math.ceil(base / 2)}))
  }
};

window.ALCHEMY_CATALOG = Object.freeze(catalog);
