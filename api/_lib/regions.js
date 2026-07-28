const REGION_BY_COUNTRY = {
  // Africa
  'algeria': 'Africa', 'botswana': 'Africa', 'cameroon': 'Africa', 'dr congo': 'Africa',
  'egypt': 'Africa', 'ethiopia': 'Africa', 'ghana': 'Africa', 'ivory coast': 'Africa',
  'kenya': 'Africa', 'liberia': 'Africa', 'malawi': 'Africa', 'mauritius': 'Africa',
  'morocco': 'Africa', 'mozambique': 'Africa', 'namibia': 'Africa', 'nigeria': 'Africa',
  'rwanda': 'Africa', 'senegal': 'Africa', 'sierra leone': 'Africa', 'south africa': 'Africa',
  'tanzania': 'Africa', 'tunisia': 'Africa', 'uganda': 'Africa', 'zambia': 'Africa', 'zimbabwe': 'Africa',

  // Americas
  'argentina': 'Americas', 'bolivia': 'Americas', 'brazil': 'Americas', 'canada': 'Americas',
  'chile': 'Americas', 'colombia': 'Americas', 'costa rica': 'Americas', 'cuba': 'Americas',
  'dominican republic': 'Americas', 'ecuador': 'Americas', 'el salvador': 'Americas',
  'guatemala': 'Americas', 'honduras': 'Americas', 'jamaica': 'Americas', 'martinique': 'Americas',
  'mexico': 'Americas', 'nicaragua': 'Americas', 'panama': 'Americas', 'paraguay': 'Americas',
  'peru': 'Americas', 'saint lucia': 'Americas', 'trinidad and tobago': 'Americas',
  'united states': 'Americas', 'usa': 'Americas', 'uruguay': 'Americas', 'venezuela': 'Americas',

  // Asia
  'bangladesh': 'Asia', 'cambodia': 'Asia', 'china': 'Asia', 'hong kong': 'Asia', 'india': 'Asia',
  'indonesia': 'Asia', 'israel': 'Asia', 'japan': 'Asia', 'laos': 'Asia', 'malaysia': 'Asia',
  'myanmar': 'Asia', 'nepal': 'Asia', 'pakistan': 'Asia', 'philippines': 'Asia',
  'saudi arabia': 'Asia', 'singapore': 'Asia', 'south korea': 'Asia', 'sri lanka': 'Asia',
  'taiwan': 'Asia', 'thailand': 'Asia', 'turkey': 'Asia', 'united arab emirates': 'Asia',
  'uae': 'Asia', 'vietnam': 'Asia',

  // Oceania
  'australia': 'Oceania', 'cook islands': 'Oceania', 'fiji': 'Oceania', 'kiribati': 'Oceania',
  'marshall islands': 'Oceania', 'micronesia': 'Oceania', 'nauru': 'Oceania',
  'new zealand': 'Oceania', 'northern marianas': 'Oceania', 'palau': 'Oceania',
  'papua new guinea': 'Oceania', 'samoa': 'Oceania', 'solomon islands': 'Oceania',
  'tonga': 'Oceania', 'tuvalu': 'Oceania', 'vanuatu': 'Oceania',

  // Europe
  'austria': 'Europe', 'belgium': 'Europe', 'croatia': 'Europe', 'czech republic': 'Europe',
  'denmark': 'Europe', 'estonia': 'Europe', 'finland': 'Europe', 'france': 'Europe',
  'germany': 'Europe', 'greece': 'Europe', 'hungary': 'Europe', 'iceland': 'Europe',
  'ireland': 'Europe', 'italy': 'Europe', 'latvia': 'Europe', 'lithuania': 'Europe',
  'luxembourg': 'Europe', 'netherlands': 'Europe', 'norway': 'Europe', 'poland': 'Europe',
  'portugal': 'Europe', 'romania': 'Europe', 'scotland': 'Europe', 'serbia': 'Europe',
  'slovakia': 'Europe', 'slovenia': 'Europe', 'spain': 'Europe', 'sweden': 'Europe',
  'switzerland': 'Europe', 'ukraine': 'Europe', 'united kingdom': 'Europe', 'uk': 'Europe',
};

export function regionForCountry(country) {
  if (!country) return '';
  return REGION_BY_COUNTRY[String(country).trim().toLowerCase()] || '';
}
