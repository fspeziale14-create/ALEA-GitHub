// ========== ALEA — Costanti ==========

// ========== COSTANTI ==========
export const MENU_CATEGORIES = [
  { name: "APPETIZERS", items: ["Fritto della baia", "Gamberi coco loco", "Insalata caprese 'new style'", "Gold chicken nuggets", "Tostones & pulled beef", "Tostones & guacamole", "Tostones & gamberi al lime", "Party tostones", "Black bart mix"] },
  { name: "PASTA & INSALATE", items: ["Spaghetti meatballs", "Tagliolini jolly roger", "Spaghetti all'astice", "Rasta pasta", "Caesar salad", "Chicken nuggets caesar salad", "Gamberi al lime bowl", "Quinoa salad", "Gamberi coco loco caesar salad"] },
  { name: "SANDWICH DELLA BAIA", items: ["Mamacita meatballs po'boy", "Gold chicken po'boy", "Pulled pork po'boy", "Pulled beef po'boy", "Coco loco shrimp po'boy", "Lobster roll", "Cajun lobster roll", "Shrimp roll", "Bay burger", "Bay cheese burger", "Bay bacon burger", "The pirates burger", "Halloumi burger"] },
  { name: "GLI SPECIAL DEL GOLFO", items: ["Shrimp creole", "Chicken creole", "Jambalaya", "Cuban-style pulled beef", "Pirates' fajitas", "Kraken curry", "Chicken curry", "Chicken caribe", "Jamaican jerk chicken"] },
  { name: "MAINS", items: ["Tagliata di manzo", "Tagliata bayou", "Barbarossa steak", "BBQ ribs", "Grilled salmon", "Mango tango salmon", "Tagliata di tonno", "Aloha tuna", "Fish & chips"] },
  { name: "SHARING & KIDS MENU", items: ["Maxi fritto della baia", "Caribe bay", "Caribe ribs", "Kid chicken nuggets", "Cannoni al pomodoro", "Cannoni meatballs", "Kid fish & chips", "Bocconcini del capitano", "Burger del pirata", "Chicken burger del pirata"] },
  { name: "DOLCI & GELATO", items: ["Choco skull", "Pancakes della baia", "Churros", "Tropical ananas", "The bay cheesecake", "The key lime pie", "Coppa choc", "Coppa mango", "Helado vaniglia/cioccolato", "Helado fiesta"] },
  { name: "COCKTAILS & BEVERAGE", items: ["Mojito", "Pina Colada", "Daiquiri", "Bahama mama", "Dark'n stormy", "Kraken kiss", "Calypso", "Tiki passion", "Jungle jive", "Aperol sunset", "Hugo", "Spritz", "Negroni", "Blu hawaian", "Tequila sunrise", "Margarita", "Paloma", "Moscow mule", "Gin tonic/lemon", "Birra alla Spina", "Birra in Bottiglia", "Vino Calice/Bottiglia", "Soft Drinks", "Caffè/Amari"] }
];

// ========== PREZZI MENU (da listino ufficiale) ==========
export const MENU_PRICES: Record<string, number> = {
  // APPETIZERS
  "Fritto della baia": 6.9, "Gamberi coco loco": 6.5, "Insalata caprese 'new style'": 6.6,
  "Gold chicken nuggets": 6.6, "Tostones & pulled beef": 6.8, "Tostones & guacamole": 5.9,
  "Tostones & gamberi al lime": 6.8, "Party tostones": 13.9, "Black bart mix": 12.8,
  // PASTA & INSALATE
  "Spaghetti meatballs": 12.5, "Tagliolini jolly roger": 12.9, "Spaghetti all'astice": 19.8,
  "Rasta pasta": 12.8, "Caesar salad": 13.4, "Chicken nuggets caesar salad": 13.4,
  "Gamberi al lime bowl": 12.4, "Quinoa salad": 12.4, "Gamberi coco loco caesar salad": 13.4,
  // SANDWICH DELLA BAIA
  "Mamacita meatballs po'boy": 14.2, "Gold chicken po'boy": 14.5, "Pulled pork po'boy": 13.4,
  "Pulled beef po'boy": 14.5, "Coco loco shrimp po'boy": 13.8, "Lobster roll": 19.8,
  "Cajun lobster roll": 19.8, "Shrimp roll": 14.0, "Bay burger": 10.5, "Bay cheese burger": 11.5,
  "Bay bacon burger": 12.5, "The pirates burger": 14.8, "Halloumi burger": 13.5,
  // GLI SPECIAL DEL GOLFO
  "Shrimp creole": 15.8, "Chicken creole": 15.2, "Jambalaya": 15.8, "Cuban-style pulled beef": 15.8,
  "Pirates' fajitas": 15.0, "Kraken curry": 16.8, "Chicken curry": 14.5,
  "Chicken caribe": 14.2, "Jamaican jerk chicken": 14.8,
  // MAINS
  "Tagliata di manzo": 21.5, "Tagliata bayou": 21.5, "Barbarossa steak": 22.0, "BBQ ribs": 15.6,
  "Grilled salmon": 15.5, "Mango tango salmon": 15.8, "Tagliata di tonno": 17.5,
  "Aloha tuna": 17.8, "Fish & chips": 14.5,
  // SHARING & KIDS MENU
  "Maxi fritto della baia": 28.6, "Caribe bay": 37.5, "Caribe ribs": 31.2,
  "Kid chicken nuggets": 6.5, "Cannoni al pomodoro": 5.5, "Cannoni meatballs": 6.5,
  "Kid fish & chips": 6.5, "Bocconcini del capitano": 6.5, "Burger del pirata": 6.5,
  "Chicken burger del pirata": 6.5,
  // DOLCI & GELATO
  "Choco skull": 6.9, "Pancakes della baia": 6.0, "Churros": 5.5, "Tropical ananas": 4.5,
  "The bay cheesecake": 6.9, "The key lime pie": 6.9, "Coppa choc": 5.5,
  "Coppa mango": 5.5, "Helado vaniglia/cioccolato": 4.5, "Helado fiesta": 13.5,
  // COCKTAILS & BEVERAGE (prezzi medi)
  "Mojito": 7.5, "Pina Colada": 8.0, "Daiquiri": 7.0, "Bahama mama": 8.0,
  "Dark'n stormy": 7.5, "Kraken kiss": 9.0, "Calypso": 8.5, "Tiki passion": 7.5,
  "Jungle jive": 7.5, "Aperol sunset": 7.5, "Hugo": 7.0, "Spritz": 7.0,
  "Negroni": 7.0, "Blu hawaian": 7.5, "Tequila sunrise": 7.5, "Margarita": 7.5,
  "Paloma": 7.5, "Moscow mule": 7.0, "Gin tonic/lemon": 7.5,
  "Birra alla Spina": 5.5, "Birra in Bottiglia": 5.0, "Vino Calice/Bottiglia": 4.0,
  "Soft Drinks": 3.5, "Caffè/Amari": 1.4,
};

const COURSE_STAGES = ['Antipasti', 'Primi', 'Secondi', 'Dolci', 'Bevande'];
const KITCHEN_COURSES = ['Antipasti', 'Primi', 'Secondi', 'Dolci', 'Piatti']; // escluse le Bevande
export const BEVERAGE_COURSES = ['Bevande']; // gestite solo dal personale

// ========== FUNZIONI UTILITY ==========
const checkFestivita = (dateString: string) => {
  const d = new Date(dateString);
  const day = d.getDate(); const month = d.getMonth() + 1; const year = d.getFullYear();
  const fisse = ['1-1', '6-1', '25-4', '1-5', '2-6', '15-8', '1-11', '8-12', '25-12', '26-12'];
  const isFissa = fisse.includes(`${day}-${month}`);
  const isPasqua2026 = (year === 2026 && month === 4 && (day === 5 || day === 6));
  return isFissa || isPasqua2026 ? 1 : 0;
};

const checkPrefestivo = (dateString: string) => {
  const d = new Date(dateString); d.setDate(d.getDate() + 1);
  return checkFestivita(d.toISOString().split('T')[0]) ? 1 : 0;
};

const getMeteoItaliano = (condition: string) => {
    switch(condition) { case 'sunny': return 'Sereno'; case 'cloudy': return 'Nuvoloso'; case 'rainy': return 'Pioggia'; default: return condition; }
};

const timeToMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const isTimeInShift = (t: string, start: string, end: string) => {
  const tm = timeToMinutes(t); const sm = timeToMinutes(start); const em = timeToMinutes(end);
  if (sm <= em) return tm >= sm && tm <= em;
  else return tm >= sm || tm <= em;
};

const isShiftFinished = (currentTime: string, start: string, end: string) => {
    const curr = timeToMinutes(currentTime); const s = timeToMinutes(start); const e = timeToMinutes(end);
    if (s <= e) return curr > e; 
    else return curr > e && curr < s; 
};

export const mapDays = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
export const weekDaysOrdered = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
