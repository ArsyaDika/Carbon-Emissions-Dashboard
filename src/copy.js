// All user-facing explanatory copy lives here so it is easy to edit.
export const OWNER_NAME = 'Muhammad Arsya Dika Maulana';

// Static top header (always visible).
export const HEADER_TITLE = 'CARBON DASHBOARD · RICE FARMING EMISSIONS';
export const HEADER_NAME = OWNER_NAME;
export const ROLE_TERMS = ['Community Resilience', 'Regenerative Agriculture', 'Decarbonization'];
export const HEADER_ROLES = ROLE_TERMS.join(' • ');
export const HEADER_EMAIL = 'arsyadika25@gmail.com';
export const HEADER_LOCATION = 'Quito, Ecuador';
export const HEADER_LINKEDIN = { text: 'linkedin.com/in/arsya-dika', href: 'https://www.linkedin.com/in/arsya-dika' };

// Optional profile photo: set to a relative path such as 'assets/profile.jpg' to show it on the About step.
export const PROFILE_PHOTO = 'assets/profile.jpg';
export const PROFILE_PHOTO_ALT = 'Portrait of Dika';

// Name on the welcome hero (the header keeps the full OWNER_NAME).
export const HERO_NAME = 'Arsya Dika';

export const HERO = {
  keywords: ROLE_TERMS.join(' • ').toUpperCase(),
  name: HERO_NAME,
  subtitle: 'See the paddies behind the numbers: turning field records into a clear, trusted picture of rice-farming emissions and the reductions achieved.',
  button: 'Explore the dashboard ↓',
};

export const ABOUT_PARAGRAPHS = [
  "Hi! I'm Dika, an agronomist who loves working in the field and with data to help food supply chains cut their emissions. For the past 3.5 years I have worked in sustainable agriculture, where I focus on decarbonization, regenerative practices and supporting the farmers behind our food.",
  "I believe that regenerative farming and honest data go hand in hand. Working directly with 1,200+ farmers, I have seen better nutrient and water management, including alternate wetting and drying, cut emissions by around 30% and lift crop productivity by 20% above the farmer average. For me, carbon work is not only about counting emissions; it is about turning evidence into decisions that farmers and communities can feel.",
  "I enjoy collaborating with people from different backgrounds, from farmers and field teams to researchers and partners, and I am used to working across cultures and time zones in English and Bahasa Indonesia (and I am learning Spanish). I am currently based in Quito, Ecuador, and I am open to new opportunities in carbon, decarbonization, sustainable sourcing and regenerative agriculture, whether remote or relocating. Let's connect!",
];

// Desktop highlight cards on the About step: edit the four facts here.
export const ABOUT_HIGHLIGHTS = [
  { value: '1,200+', label: 'unique farmers' },
  { value: '~30%', label: 'lower emissions vs conventional' },
  { value: '+20%', label: 'crop productivity vs farmer average' },
  { value: '3.5 years', label: 'in sustainable agriculture' },
];

export const ABOUT = {
  label: 'ABOUT ME',
  title: ROLE_TERMS.join(' · '),
  paragraphs: ABOUT_PARAGRAPHS,
  highlights: ABOUT_HIGHLIGHTS,
  photo: PROFILE_PHOTO,
  photoAlt: PROFILE_PHOTO_ALT,
};

// The single light guide panel (last step after About; the "?" button opens it directly).
export const GUIDE = {
  title: 'Welcome to the Carbon Dashboard!',
  intro: 'Rice is a daily staple for billions of people, yet the paddies that grow it also release methane and other greenhouse gases. This dashboard turns monthly field records into a map of estimated emissions and shows how much farmers have reduced them compared with conventional practice. Pick a month, zoom in and see what changed across the period available.',
  doTitle: 'What you can do here:',
  doItems: [
    'Explore estimated emissions per hectare for each village on the satellite map.',
    'Drag the month slider, or switch to Cumulative to see everything since April 2024.',
    'Click a village to filter the KPIs and charts to it, then use Back to overview to return.',
    'Open Factors to see the management practices behind the numbers, and Data for definitions and credits.',
  ],
  notesTitle: 'Notes:',
  notes: [
    'Actual emissions are estimated from the practices recorded for the fields harvested in the selected period.',
    'Baseline is the expected emissions under conventional, pre-programme practice (baseline survey from 2021 until 2023, with IRRI). Reduction = Baseline − Actual.',
    'Data come from farmers enrolled in a farmer-support programme promoting nutrient management and alternate wetting and drying (AWD), aggregated to village level.',
  ],
  importantTitle: 'Important Notes on the Data',
  important: [
    'No colour does not mean zero. A village that is not drawn had no sampling and no harvest from that area in the selected month, so there is simply no data to show; it does not mean zero emissions.',
    'Small samples. Some villages have only a few farmers in a given month, so per-hectare values can swing widely; check the Farmers card.',
    'Totals vs per hectare. The popup and legend show tCO2e per hectare; the KPI cards also show totals in tCO2e. Total emissions = land area × actual emission per hectare.',
    'Boundaries. Village boundaries come from public administrative datasets (credits in the Data tab).',
  ],
};

export const DEFS = [
  ['Actual', 'Emissions estimated for the fields harvested in the selected period, based on the crop-management practices (nutrient and water management) recorded for that season.'],
  ['Baseline', 'The emissions expected from the same fields under the conventional practices farmers followed before the programme. This reference comes from a baseline survey of existing crop management carried out from 2021 until 2023, in collaboration with the International Rice Research Institute (IRRI). Comparison farmers from the same villages, matched by planting date, irrigation source and crop-establishment method, helped anchor the reference. Each season is compared with the baseline for the same planting period.'],
  ['Reduction', 'Baseline minus Actual. A positive value means emissions were avoided compared with business as usual.'],
  ['Total emissions', 'Total emissions = land area × actual emission per hectare. The totals come from the records; the per-hectare value is the total divided by the land area.'],
  ['Unit', 'tCO2e (tonnes of CO2 equivalent) in totals; tCO2e/ha for per-hectare values.'],
  ['Yield', 'Area-weighted average over the fields in scope.'],
  ['Farmers', 'Distinct farmers, counted once even if active in several months.'],
];

export const REDUCTION_TOOLTIP = 'Baseline = expected emissions under pre-programme conventional practice (surveyed from 2021 until 2023, with IRRI).';
export const BASELINE_TOOLTIP = 'Expected emissions per hectare under conventional, pre-programme practice (baseline survey from 2021 until 2023, with IRRI).';
export const ACTUAL_TOOLTIP = 'Estimated emissions per hectare after programme practices';
export const TOTAL_AREA_TOOLTIP = 'Sum of the land area of all fields harvested in the selected period (or since Apr 2024 in Cumulative mode).';

export const CUMULATIVE = {
  title: 'How Cumulative works',
  intro: 'Cumulative adds up every month from April 2024 up to the month you select.',
  bullets: [
    'Land area, harvest, emissions and reduction are added together.',
    'Ratios — tCO2e/ha, yield and reduction % — are recalculated from those totals, not averaged across months, so larger months count for more.',
    'Farmers are counted once, even if they harvested in several months.',
    'Months with no data are skipped; they are never treated as zero.',
  ],
};

export const FACTORS_FOOTNOTE = 'Representative averages from programme field records, applied across all periods.';
