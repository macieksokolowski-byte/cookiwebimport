/**
 * Baza sprawdzonych przepisów Thermomix z podziałem na typy posiłków i filtry dietetyczne.
 * Każdy przepis posiada dokładne parametry Thermomixa (czas, temperatura, obroty, tryb ciasto)
 * oraz zdjęcie gotowe do synchronizacji z Cookidoo.
 */

export const MEAL_TYPES = [
  { id: "all", name: "Wszystkie posiłki", icon: "🍽️" },
  { id: "breakfast", name: "Śniadania", icon: "🥐" },
  { id: "lunch", name: "Obiady i Dania główne", icon: "🍲" },
  { id: "soup", name: "Zupy", icon: "🥣" },
  { id: "supper", name: "Kolacje", icon: "🥗" },
  { id: "pizza-bread", name: "Pizza i Pieczywo", icon: "🍕" },
  { id: "dessert", name: "Desery i Wypieki", icon: "🍰" },
  { id: "snack", name: "Przekąski i Sosy", icon: "🥫" },
];

export const RECIPES = [
  // ==========================================
  // PIZZA I PIECZYWO
  // ==========================================
  {
    id: "pizza-neapolitanska",
    title: "Włoskie ciasto na pizzę neapolitańską",
    mealType: "pizza-bread",
    mealTypeName: "Pizza i Pieczywo",
    isGlutenFree: false,
    isVegetarian: true,
    description: "Prawdziwa włoska pizza z puszystymi, chrupiącymi brzegami (cornicione). Długie wyrastanie zapewnia lekkość i doskonały smak.",
    prepTime: 15,
    totalTime: 120,
    yield: { value: 4, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80",
    ingredients: [
      { text: "320 g wody w temperaturze pokojowej" },
      { text: "3 g drożdży świeżych (lub 1 g suszonych)" },
      { text: "500 g mąki pszennej typ 00 (lub luksusowa typ 500/550)" },
      { text: "12 g soli morskiej drobnej" },
      { text: "10 g oliwy z oliwek extra virgin" }
    ],
    instructions: [
      "Do naczynia miksującego wlej 320 g wody, dodaj 3 g drożdży i 10 g oliwy, podgrzej 2 min/37°C/obr. 2.",
      "Dodaj 500 g mąki pszennej typ 00 oraz 12 g soli. Wyrabiaj ciasto 3 min/obr. 4.",
      "Przełóż ciasto na blat lekko oprószony mąką, uformuj kulę i przełóż do lekko naoliwionej miski. Przykryj wilgotną ściereczką lub folią spożywczą i odstaw na 2 godziny do wyrośnięcia.",
      "Wyrośnięte ciasto podziel na 4 równe kule (po ok. 210-220 g). Ułóż na tacy, przykryj i odstaw na kolejne 30-45 minut.",
      "Rozciągaj kulki dłońmi od środka ku brzegom (nie wałkuj wałkiem, aby zachować pęcherzyki powietrza w brzegach).",
      "Nałóż sos pomidorowy, ser mozzarella i ulubione dodatki. Piecz w maksymalnej temperaturze piekarnika (250°C-300°C) najlepiej na rozgrzanym kamieniu do pizzy przez 5-7 minut."
    ],
    hints: "Mąka typ 00 ma wysoką zawartość białka i nadaje ciastu elastyczność. Jeśli masz czas, przygotuj ciasto dzień wcześniej i wstaw kule do lodówki na 24h na powolną fermentację zimną.",
    tags: ["pizza", "włoska", "ciasto", "neapolitańska", "wegetariańskie"]
  },
  {
    id: "pizza-szybka",
    title: "Szybka pizza domowa na cienkim cieście",
    mealType: "pizza-bread",
    mealTypeName: "Pizza i Pieczywo",
    isGlutenFree: false,
    isVegetarian: true,
    description: "Błyskawiczne ciasto na pizzę, które nie wymaga długiego czekania. Od wsypania składników do pieca w zaledwie 30 minut!",
    prepTime: 10,
    totalTime: 30,
    yield: { value: 2, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
    ingredients: [
      { text: "200 g wody letniej" },
      { text: "25 g drożdży świeżych (lub 7 g drożdży suszonych instant)" },
      { text: "1 łyżeczka cukru (ok. 5 g)" },
      { text: "400 g mąki pszennej (typ 450, 500 lub 550)" },
      { text: "30 g oliwy z oliwek" },
      { text: "1 łyżeczka soli (ok. 5 g)" }
    ],
    instructions: [
      "Do naczynia miksującego wlej 200 g wody letniej, dodaj 25 g drożdży i 1 łyżeczkę cukru, podgrzej 2 min/37°C/obr. 2.",
      "Dodaj 400 g mąki pszennej, 30 g oliwy z oliwek i 1 łyżeczkę soli. Wyrabiaj ciasto 2 min/obr. 4.",
      "Pozostaw ciasto w naczyniu na 10 minut, aby lekko ruszyło.",
      "Przełóż ciasto na blat, podziel na 2 części i rozwałkuj na papierze do pieczenia na cienkie placki.",
      "Posmaruj sosem pomidorowym, posyp serem i ułóż ulubione dodatki (szynka, pieczarki, kukurydza).",
      "Piecz w piekarniku nagrzanym do 220°C (termoobieg) przez 12-15 minut, aż brzegi będą złociste i chrupiące."
    ],
    hints: "Aby spód był wyjątkowo chrupiący, blachę do pieczenia wstaw do nagrzewającego się piekarnika, a pizzę zsuwaj na gorącą blachę wraz z papierem do pieczenia.",
    tags: ["pizza", "szybka", "dla dzieci", "kolacja"]
  },
  {
    id: "pizza-bezglutenowa",
    title: "Chrupiąca pizza bezglutenowa",
    mealType: "pizza-bread",
    mealTypeName: "Pizza i Pieczywo",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Najlepszy przepis na bezglutenowy spód do pizzy. Ciasto jest elastyczne, nie kruszy się i po upieczeniu ma chrupiące, złociste brzegi.",
    prepTime: 15,
    totalTime: 45,
    yield: { value: 2, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    ingredients: [
      { text: "230 g ciepłej wody" },
      { text: "15 g drożdży świeżych (lub 5 g suchych)" },
      { text: "1 łyżeczka cukru lub miodu" },
      { text: "260 g bezglutenowej mąki do pieczenia chleba/pizzy (np. Schär Mix B lub Mehl Farine)" },
      { text: "20 g mąki ryżowej lub kukurydzianej" },
      { text: "1 płaska łyżeczka mielonej babki jajowatej (psyllium husk - klucz do elastyczności!)" },
      { text: "25 g oliwy z oliwek" },
      { text: "1 łyżeczka soli" }
    ],
    instructions: [
      "Do naczynia miksującego wlej 230 g ciepłej wody, dodaj 15 g drożdży i 1 łyżeczkę cukru, podgrzej 2 min/37°C/obr. 2.",
      "Dodaj 260 g mąki bezglutenowej, 20 g mąki ryżowej, 1 łyżeczkę babki jajowatej, 25 g oliwy z oliwek oraz 1 łyżeczkę soli.",
      "Wymieszaj składniki 1 min 30 s/obr. 4 (ciasto bezglutenowe ma luźniejszą, kremowo-kleistą konsystencję niż ciasto pszenne).",
      "Przełóż połowę ciasta na arkusz papieru do pieczenia natłuszczony oliwą. Zwilżonymi wodą lub naoliwionymi dłońmi uformuj okrągły spód o grubości ok. 5 mm z lekko podwyższonym brzegiem.",
      "Podpiecz sam spód bez dodatków w piekarniku rozgrzanym do 220°C przez 8-10 minut.",
      "Wyjmij podpieczony spód, szybko nałóż sos pomidorowy, starty ser mozzarella oraz ulubione bezglutenowe dodatki.",
      "Piecz kolejne 8-10 minut w 220°C, aż ser całkowicie się rozpuści, a brzegi będą rumiane i chrupiące."
    ],
    hints: "Babka jajowata (psyllium husk) wiąże wodę i zastępuje siatkę glutenową – sprawia, że ciasto po upieczeniu nie jest kruche ani twarde jak tektura.",
    tags: ["bezglutenowe", "pizza", "wegetariańskie", "zdrowe"]
  },
  {
    id: "focaccia-wloska",
    title: "Włoska Focaccia z oliwą, rozmarynem i solą morską",
    mealType: "pizza-bread",
    mealTypeName: "Pizza i Pieczywo",
    isGlutenFree: false,
    isVegetarian: true,
    description: "Tradycyjne puszyste włoskie pieczywo focaccia, z charakterystycznymi dołeczkami wypełnionymi oliwą extra virgin i świeżym rozmarynem.",
    prepTime: 15,
    totalTime: 60,
    yield: { value: 6, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&q=80",
    ingredients: [
      { text: "300 g wody letniej" },
      { text: "20 g drożdży świeżych" },
      { text: "1 łyżeczka miodu lub cukru" },
      { text: "500 g mąki pszennej chlebowej (typ 550 lub 650)" },
      { text: "50 g oliwy z oliwek extra virgin" },
      { text: "1.5 łyżeczki soli drobnej" },
      { text: "2 gałązki świeżego rozmarynu (same igiełki)" },
      { text: "gruba sól morska w płatkach do posypania" }
    ],
    instructions: [
      "Do naczynia miksującego wlej 300 g wody, dodaj 20 g drożdży i 1 łyżeczkę miodu, podgrzej 2 min/37°C/obr. 2.",
      "Dodaj 500 g mąki, 20 g oliwy z oliwek i 1.5 łyżeczki soli. Wyrabiaj ciasto 3 min/obr. 4.",
      "Blachę do pieczenia obficie wysmaruj oliwą z oliwek. Wyłóż ciasto na blachę, rozciągnij delikatnie dłońmi i odstaw w ciepłe miejsce na 35 minut.",
      "Palcami zrób w wyrośniętym cieście głębokie dołeczki. Całość polej pozostałymi 30 g oliwy z oliwek, powciskaj igiełki rozmarynu i posyp grubą solą morską.",
      "Piecz w piekarniku nagrzanym do 200°C przez 20-25 minut na piękny złoty kolor."
    ],
    hints: "Przed włożeniem do pieca możesz skropić wierzch focacci 2 łyżkami wody zmieszanej z oliwą – dzięki temu skórka będzie niesamowicie chrupiąca, a środek puszysty.",
    tags: ["focaccia", "włoska", "pieczywo", "przekąska"]
  },
  {
    id: "chleb-bezglutenowy-ziarna",
    title: "Puszysty chleb bezglutenowy z ziarnami",
    mealType: "pizza-bread",
    mealTypeName: "Pizza i Pieczywo",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Niezawodny, wilgotny bochenek chleba bezglutenowego. Nie kruszy się przy krojeniu i zachowuje świeżość nawet przez 4 dni.",
    prepTime: 10,
    totalTime: 70,
    yield: { value: 1, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
    ingredients: [
      { text: "450 g letniej wody" },
      { text: "25 g drożdży świeżych" },
      { text: "1 łyżeczka miodu" },
      { text: "400 g uniwersalnej mąki bezglutenowej do chleba (np. Schär Bread Mix B)" },
      { text: "30 g oleju rzepakowego lub oliwy" },
      { text: "1.5 łyżeczki soli morskiej" },
      { text: "30 g nasion siemienia lnianego" },
      { text: "30 g ziaren słonecznika łuskanego" },
      { text: "20 g nasion dyni" }
    ],
    instructions: [
      "Do naczynia miksującego wlej 450 g letniej wody, dodaj 25 g drożdży i 1 łyżeczkę miodu, podgrzej 2 min/37°C/obr. 2.",
      "Dodaj 400 g mąki bezglutenowej, 30 g oleju i 1.5 łyżeczki soli. Wymieszaj ciasto 1 min 30 s/obr. 4.",
      "Dodaj 30 g siemienia lnianego, 30 g słonecznika i 20 g pestek dyni. Wymieszaj 20 s/obr. wsteczne 3.",
      "Keksówkę (ok. 25-30 cm) wyłóż papierem do pieczenia. Przełóż ciasto, a wierzch wygładź łyżką zamoczoną w zimnej wodzie. Posyp garścią dodatkowych ziaren.",
      "Odstaw keksówkę w ciepłe miejsce przykrytą ściereczką na 30 minut, aż ciasto podwoi objętość.",
      "Wstaw do piekarnika nagrzanego do 200°C (góra-dół) i piecz przez 45-50 minut. Po upieczeniu wyjmij bochenek z formy i ostudź na kratce przed krojeniem."
    ],
    hints: "Wstaw na spód piekarnika małą blaszkę z gorącą wodą – para sprawi, że chleb wyrośnie wyższy i uzyska cudowną, chrupiącą skórkę.",
    tags: ["chleb", "bezglutenowe", "śniadanie", "wypieki"]
  },
  {
    id: "bulki-bezglutenowe",
    title: "Chrupiące bułeczki śniadaniowe bezglutenowe",
    mealType: "breakfast",
    mealTypeName: "Śniadania",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Puszyste w środku i chrupiące z zewnątrz bułeczki bez glutenu. Idealne do przekrojenia na kanapki lub burgery.",
    prepTime: 15,
    totalTime: 45,
    yield: { value: 6, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=800&q=80",
    ingredients: [
      { text: "260 g letniej wody" },
      { text: "20 g drożdży świeżych" },
      { text: "1 łyżeczka cukru" },
      { text: "300 g bezglutenowej mąki uniwersalnej lub chlebowej" },
      { text: "1 czubata łyżka łusek babki jajowatej" },
      { text: "25 g oliwy z oliwek" },
      { text: "1 łyżeczka soli" },
      { text: "sezam lub czarnuszka do posypania" }
    ],
    instructions: [
      "Do naczynia miksującego wlej 260 g wody, dodaj 20 g drożdży i 1 łyżeczkę cukru, podgrzej 2 min/37°C/obr. 2.",
      "Dodaj 300 g mąki bezglutenowej, 1 czubatą łyżkę babki jajowatej, 25 g oliwy i 1 łyżeczkę soli. Wymieszaj 2 min/obr. 4.",
      "Blachę wyłóż papierem do pieczenia. Dłońmi zwilżonymi wodą formuj 6 zgrabnych okrągłych bułek i układaj w odstępach na blasze.",
      "Odstaw bułeczki do wyrośnięcia w ciepłe miejsce na 20-25 minut.",
      "Pędzelkiem delikatnie posmaruj wierzch wodą lub oliwą i posyp sezamem lub czarnuszką.",
      "Piecz w piekarniku nagrzanym do 200°C przez 22-25 minut, aż będą rumiane i po stuknięciu od spodu wydadzą głuchy dźwięk."
    ],
    hints: "Zwilżanie dłoni zimną wodą sprawia, że bezglutenowe ciasto w ogóle nie klei się do rąk podczas formowania bułek.",
    tags: ["bułki", "bezglutenowe", "śniadanie", "pieczywo"]
  },

  // ==========================================
  // ŚNIADANIA (BREAKFAST)
  // ==========================================
  {
    id: "szakszuka-thermomix",
    title: "Aromatyczna szakszuka z pomidorami i jajkami",
    mealType: "breakfast",
    mealTypeName: "Śniadania",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Królowa śniadań – jajka sadzone w gęstym sosie ze słodkich pomidorów, papryki, czosnku i kuminu.",
    prepTime: 10,
    totalTime: 20,
    yield: { value: 2, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&q=80",
    ingredients: [
      { text: "1 mała cebula" },
      { text: "1 ząbek czosnku" },
      { text: "1 czerwona papryka (pokrojona na kawałki)" },
      { text: "20 g oliwy z oliwek" },
      { text: "400 g pomidorów krojonych z puszki" },
      { text: "1 łyżeczka mielonego kuminu" },
      { text: "0.5 łyżeczki słodkiej papryki" },
      { text: "0.5 łyżeczki soli i szczypta pieprzu" },
      { text: "3-4 świeże jajka" },
      { text: "świeża kolendra lub pietruszka do posypania" }
    ],
    instructions: [
      "Do naczynia miksującego wrzuć 1 cebulę, 1 ząbek czosnku i paprykę, rozdrobnij 4 s/obr. 5. Zgarnij kopystką na dno naczynia.",
      "Dodaj 20 g oliwy z oliwek, duś 3 min/120°C/obr. 1.",
      "Dodaj 400 g pomidorów, 1 łyżeczkę kuminu, 0.5 łyżeczki słodkiej papryki, sól i pieprz. Gotuj 8 min/100°C/obr. 1.",
      "Przelej gęsty sos na patelnię lub do naczynia żaroodpornego, zrób wgłębienia łyżką i wbij ostrożnie jajka.",
      "Gotuj pod przykryciem na małym ogniu przez 4-5 minut, aż białka się zetną, a żółtka pozostaną płynne. Posyp świeżymi ziołami."
    ],
    hints: "Jeśli wolisz przygotować całość w naczyniu Thermomix: po ugotowaniu sosu wbij jajka bezpośrednio na sos i gotuj 5 min/Varoma/obr. wsteczne 1.",
    tags: ["śniadanie", "szakszuka", "bezglutenowe", "wegetariańskie"]
  },
  {
    id: "pancakes-bezglutenowe-borowki",
    title: "Puszyste pancakes bezglutenowe z borówkami",
    mealType: "breakfast",
    mealTypeName: "Śniadania",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Amerykańskie puszyste placki bez grama glutenu. Cudownie miękkie, podawane z syropem klonowym i świeżymi owocami.",
    prepTime: 5,
    totalTime: 20,
    yield: { value: 4, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80",
    ingredients: [
      { text: "200 g maślanki lub kefiru" },
      { text: "2 jajka" },
      { text: "30 g roztopionego masła" },
      { text: "150 g mąki bezglutenowej (np. ryżowa lub uniwersalna)" },
      { text: "1 łyżeczka proszku do pieczenia bezglutenowego" },
      { text: "1 łyżka cukru waniliowego" },
      { text: "1 szczypta soli" },
      { text: "100 g świeżych borówek" }
    ],
    instructions: [
      "Do naczynia miksującego wlej 200 g maślanki, wbij 2 jajka i dodaj 30 g roztopionego masła, wymieszaj 15 s/obr. 4.",
      "Dodaj 150 g mąki bezglutenowej, 1 łyżeczkę proszku do pieczenia, 1 łyżkę cukru waniliowego i szczyptę soli. Zmiksuj 25 s/obr. 4.",
      "Rozgrzej suchą patelnię teflonową na średnim ogniu. Nakładaj porcje ciasta (po 2 łyżki na placek), na wierzch wrzuć kilka borówek.",
      "Smaż ok. 2 minuty do pojawienia się pęcherzyków powietrza na powierzchni, przewróć na drugą stronę i smaż jeszcze 1 minutę na złoty kolor."
    ],
    hints: "Maślanka wchodzi w reakcję z proszkiem do pieczenia, sprawiając, że placki bezglutenowe rosną niesamowicie wysokie i puszyste.",
    tags: ["śniadanie", "pancakes", "bezglutenowe", "dla dzieci"]
  },
  {
    id: "pasta-jajeczna-suszony-pomidor",
    title: "Kremowa pasta jajeczna z suszonymi pomidorami",
    mealType: "breakfast",
    mealTypeName: "Śniadania",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Ekspresowa pasta kanapkowa z ugotowanych jajek, suszonych pomidorów i szczypiorku – gotowa w 20 sekund!",
    prepTime: 5,
    totalTime: 5,
    yield: { value: 4, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80",
    ingredients: [
      { text: "4 jajka ugotowane na twardo i ostudzone" },
      { text: "50 g suszonych pomidorów z zalewy oliwnej" },
      { text: "50 g serka śmietankowego lub twarogu" },
      { text: "1 łyżeczka musztardy dijon" },
      { text: "2 gałązki świeżego szczypiorku" },
      { text: "szczypta soli i świeżo mielonego pieprzu" }
    ],
    instructions: [
      "Do naczynia miksującego wrzuć szczypiorek i 50 g suszonych pomidorów, rozdrobnij 4 s/obr. 6. Zgarnij kopystką na dno.",
      "Dodaj 4 obrane jajka przekrojone na połówki, 50 g serka śmietankowego, 1 łyżeczkę musztardy, sól i pieprz.",
      "Wymieszaj 6 s/obr. 4 (jeśli wolisz bardzo gładką pastę, miksuj kolejne 5 s/obr. 5).",
      "Przełóż do miseczki. Podawaj ze świeżym chlebem bezglutenowym lub bułeczkami."
    ],
    hints: "Użycie 1 łyżeczki oliwy ze słoiczka po suszonych pomidorach nadaje paście głęboki, śródziemnomorski aromat.",
    tags: ["śniadanie", "pasta", "jajka", "szybkie", "bezglutenowe"]
  },

  // ==========================================
  // OBIADY I DANIA GŁÓWNE (LUNCH / DINNER)
  // ==========================================
  {
    id: "calzone-wloskie",
    title: "Calzone – włoski pieczony pieróg z mozzarellą",
    mealType: "lunch",
    mealTypeName: "Obiady i Dania główne",
    isGlutenFree: false,
    isVegetarian: false,
    description: "Zamknięta pizza w formie okazałego pieroga, wypełniona ciągnącym serem mozzarella, sosem pomidorowym, szynką i pieczarkami.",
    prepTime: 20,
    totalTime: 50,
    yield: { value: 3, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1536964549204-cce9eab227bd?w=800&q=80",
    ingredients: [
      { text: "220 g wody" },
      { text: "15 g drożdży świeżych" },
      { text: "400 g mąki pszennej typ 00 lub 500" },
      { text: "20 g oliwy z oliwek" },
      { text: "1 łyżeczka soli" },
      { text: "200 g sera mozzarella w kulce lub tartego" },
      { text: "100 g szynki prosciutto cotto lub gotowanej" },
      { text: "6 łyżek gęstego sosu pomidorowego" }
    ],
    instructions: [
      "Do naczynia miksującego wlej 220 g wody i dodaj 15 g drożdży, podgrzej 2 min/37°C/obr. 2.",
      "Dodaj 400 g mąki, 20 g oliwy i 1 łyżeczkę soli. Wyrabiaj ciasto 2 min 30 s/obr. 4.",
      "Wyjmij ciasto, uformuj 3 równe kule i odstaw pod przykryciem na 25 minut do podrośnięcia.",
      "Rozwałkuj każdą kulę na okrągły placek. Na jedną połowę wyłóż sos pomidorowy, szynkę i porwaną mozzarellę.",
      "Złóż ciasto na pół tworząc półksiężyc. Dokładnie zawiń i dociśnij brzegi w warkocz, aby farsz nie wypłynął w trakcie pieczenia.",
      "Wierzch posmaruj odrobiną oliwy i zrób małe nacięcie nożem na parę. Piecz w 220°C przez 15-18 minut."
    ],
    hints: "Pamiętaj, by nie nakładać farszu zbyt blisko brzegów, w przeciwnym razie ciasto nie sklei się prawidłowo.",
    tags: ["calzone", "pizza", "obiad", "włoska"]
  },
  {
    id: "risotto-grzybowe",
    title: "Kremowe risotto grzybowe z parmezanem",
    mealType: "lunch",
    mealTypeName: "Obiady i Dania główne",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Klasyczne włoskie risotto z ryżu arborio, z podsmażanymi pieczarkami, białym winem i tartym parmezanem. Naturalnie bezglutenowe!",
    prepTime: 10,
    totalTime: 30,
    yield: { value: 4, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=800&q=80",
    ingredients: [
      { text: "40 g sera parmezan w kawałku" },
      { text: "1 mała szalotka lub cebula" },
      { text: "1 ząbek czosnku" },
      { text: "40 g masła" },
      { text: "20 g oliwy z oliwek" },
      { text: "250 g pieczarek lub borowików pokrojonych w plasterki" },
      { text: "320 g ryżu do risotto (np. arborio lub carnaroli)" },
      { text: "60 g białego wytrawnego wina (lub bulionu)" },
      { text: "750 g bulionu warzywnego gorącego" },
      { text: "0.5 łyżeczki soli" }
    ],
    instructions: [
      "Do suchego naczynia miksującego wrzuć 40 g parmezanu, zetrzyj 10 s/obr. 10. Przełóż do miseczki.",
      "Do naczynia wrzuć cebulę i czosnek, rozdrobnij 3 s/obr. 5. Zgarnij kopystką na dno.",
      "Dodaj 20 g oliwy, 20 g masła i 250 g grzybów, duś 4 min/120°C/obr. wsteczne 1.",
      "Dodaj 320 g ryżu do risotto, praż bez miarki 3 min/120°C/obr. wsteczne 1.",
      "Wlej 60 g białego wina, odparuj 1 min/100°C/obr. wsteczne 1.",
      "Wlej 750 g gorącego bulionu i sól. Gotuj 14 min/100°C/obr. wsteczne 1.",
      "Dodaj starty parmezan i pozostałe 20 g masła, wymieszaj kopystką i pozostaw w naczyniu pod przykryciem na 2 minuty przed podaniem."
    ],
    hints: "Obroty wsteczne chronią ziarna ryżu przed zmiażdżeniem przez noże, zachowując idealną strukturę al dente.",
    tags: ["obiad", "risotto", "bezglutenowe", "wegetariańskie"]
  },
  {
    id: "curry-ciecierzyca-kokos",
    title: "Kremowe curry z ciecierzycą i mleczkiem kokosowym",
    mealType: "lunch",
    mealTypeName: "Obiady i Dania główne",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Rozgrzewające, aromatyczne danie jednogarnkowe z ciecierzycą, pomidorami, szpinakiem i nutą imbiru. Wspaniałe z ryżem jaśminowym.",
    prepTime: 10,
    totalTime: 25,
    yield: { value: 4, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80",
    ingredients: [
      { text: "1 cebula przekrojona na pół" },
      { text: "2 ząbki czosnku" },
      { text: "15 g świeżego imbiru" },
      { text: "20 g oleju kokosowego lub rzepakowego" },
      { text: "1 czubata łyżka żółtej pasty curry lub przyprawy curry" },
      { text: "1 łyżeczka kurkumy" },
      { text: "400 g pomidorów krojonych z puszki" },
      { text: "400 g mleczka kokosowego (min. 70-80% ekstraktu)" },
      { text: "400 g ugotowanej ciecierzycy (1 puszka, odsączona)" },
      { text: "80 g świeżego szpinaku baby" },
      { text: "1 łyżeczka soli i sok z 0.5 limonki" }
    ],
    instructions: [
      "Do naczynia miksującego wrzuć cebulę, czosnek i imbir, rozdrobnij 4 s/obr. 6. Zgarnij na dno naczynia.",
      "Dodaj 20 g oleju, pastę curry i kurkumę, duś 3 min/120°C/obr. 1.",
      "Dodaj 400 g pomidorów, 400 g mleczka kokosowego i 1 łyżeczkę soli. Gotuj 10 min/100°C/obr. 1.",
      "Dodaj 400 g odsączonej ciecierzycy, gotuj 5 min/100°C/obr. wsteczne 1.",
      "Dodaj świeży szpinak i sok z limonki, wymieszaj kopystką 1 min/obr. wsteczne 1, aż szpinak zwiędnie w gorącym sosie."
    ],
    hints: "Podawaj z ugotowanym ryżem basmati lub bezglutenowym chlebkiem naan posypanym świeżą kolendrą.",
    tags: ["obiad", "curry", "bezglutenowe", "wegańskie", "wegetariańskie"]
  },

  // ==========================================
  // ZUPY (SOUPS)
  // ==========================================
  {
    id: "krem-pomidory-pieczone",
    title: "Aksamitny krem z pomidorów z mozzarellą",
    mealType: "soup",
    mealTypeName: "Zupy",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Gęsta, aromatyczna zupa ze słodkich pomidorów pelati z dodatkiem czosnku, ziół prowansalskich i ciągnącego sera mozzarella.",
    prepTime: 5,
    totalTime: 20,
    yield: { value: 4, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
    ingredients: [
      { text: "1 cebula" },
      { text: "2 ząbki czosnku" },
      { text: "25 g oliwy z oliwek" },
      { text: "800 g pomidorów krojonych (2 puszki)" },
      { text: "200 g bulionu warzywnego" },
      { text: "1 łyżeczka suszonego oregano lub ziół prowansalskich" },
      { text: "1 łyżeczka cukru" },
      { text: "1 łyżeczka soli" },
      { text: "1 kulka sera mozzarella (125 g) porwana na kawałki" },
      { text: "świeża bazylia do dekoracji" }
    ],
    instructions: [
      "Do naczynia miksującego wrzuć cebulę i czosnek, rozdrobnij 4 s/obr. 5. Zgarnij składniki na dno naczynia.",
      "Dodaj 25 g oliwy z oliwek, podduś 3 min/120°C/obr. 1.",
      "Dodaj 800 g pomidorów, 200 g bulionu, 1 łyżeczkę ziół, 1 łyżeczkę cukru i sól. Gotuj 12 min/100°C/obr. 1.",
      "Zmiksuj zupę na idealnie gładki krem 1 min/obr. 8 (stopniowo zwiększając obroty od 4 do 8).",
      "Rozlej do misek, na wierzch połóż kawałki mozzarelli i listki świeżej bazylii."
    ],
    hints: "Dodatek 1 łyżeczki cukru idealnie neutralizuje naturalną kwasowość pomidorów z puszki.",
    tags: ["zupa", "krem", "pomidory", "bezglutenowe", "wegetariańskie"]
  },
  {
    id: "krem-dynia-imbir",
    title: "Złocisty krem z dyni z mleczkiem kokosowym i imbirem",
    mealType: "soup",
    mealTypeName: "Zupy",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Kremowa, rozgrzewająca zupa z dyni hokkaido, z dodatkiem świeżego imbiru, soku z pomarańczy i prażonych pestek dyni.",
    prepTime: 10,
    totalTime: 25,
    yield: { value: 4, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800&q=80",
    ingredients: [
      { text: "1 cebula" },
      { text: "15 g świeżego imbiru" },
      { text: "20 g masła lub oliwy" },
      { text: "500 g dyni hokkaido (pokrojonej w kostkę, ze skórką)" },
      { text: "1 marchewka pokrojona w plastry" },
      { text: "400 g bulionu warzywnego" },
      { text: "150 g mleczka kokosowego" },
      { text: "1 łyżeczka soli, szczypta gałki muszkatołowej" },
      { text: "pestki dyni do posypania" }
    ],
    instructions: [
      "Do naczynia miksującego wrzuć cebulę i imbir, rozdrobnij 4 s/obr. 6. Zgarnij na dno naczynia.",
      "Dodaj 20 g masła, duś 3 min/120°C/obr. 1.",
      "Dodaj 500 g dyni, 1 marchewkę i 400 g bulionu warzywnego. Gotuj 16 min/100°C/obr. 1.",
      "Dodaj 150 g mleczka kokosowego, sól i gałkę muszkatołową. Zmiksuj całość 1 min/obr. 9 na jedwabisty krem.",
      "Podawaj posypane uprażonymi pestkami dyni."
    ],
    hints: "Dynia Hokkaido nie wymaga obierania – jej cienka skórka mięknie podczas gotowania i nadaje zupie piękny, głęboki pomarańczowy kolor.",
    tags: ["zupa", "dynia", "krem", "bezglutenowe", "jesień"]
  },

  // ==========================================
  // KOLACJE (SUPPER)
  // ==========================================
  {
    id: "spod-tarty-bezglutenowy",
    title: "Krucha tarta ze szpinakiem i serem feta",
    mealType: "supper",
    mealTypeName: "Kolacje",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Kruchy bezglutenowy spód wypełniony duszonym szpinakiem z czosnkiem, grecką fetą i kremową masą jajeczną.",
    prepTime: 15,
    totalTime: 40,
    yield: { value: 6, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1519869325930-281384150729?w=800&q=80",
    ingredients: [
      { text: "200 g mąki bezglutenowej uniwersalnej" },
      { text: "100 g zimnego masła w kawałkach" },
      { text: "1 jajko do ciasta + 3 jajka do farszu" },
      { text: "20 g zimnej wody" },
      { text: "300 g świeżego szpinaku baby" },
      { text: "2 ząbki czosnku" },
      { text: "150 g sera feta pokruszonego" },
      { text: "100 g śmietanki 30% lub jogurtu greckiego" },
      { text: "1 łyżeczka soli i pieprz" }
    ],
    instructions: [
      "Do naczynia wsyp 200 g mąki bezglutenowej, dodaj 100 g masła, 1 jajko, 20 g wody i 0.5 łyżeczki soli. Wymieszaj 25 s/obr. 4 na kulę ciasta.",
      "Wyłóż ciastem formę do tarty (26 cm), nakłuj widelcem i podpiecz 12 min/190°C.",
      "Do naczynia miksującego wrzuć 2 ząbki czosnku, rozdrobnij 3 s/obr. 8. Dodaj łyżkę oliwy i szpinak, duś 4 min/120°C/obr. wsteczne 1.",
      "Dodaj 3 jajka, 100 g śmietanki, sól i pieprz, wymieszaj 15 s/obr. 3.",
      "Wylej masę szpinakową na podpieczony spód, posyp 150 g fety i piecz 20-25 minut w 180°C na złocisty kolor."
    ],
    hints: "Tarta smakuje wyśmienicie zarówno na ciepło prosto z piekarnika, jak i na zimno następnego dnia w lunchboxie.",
    tags: ["kolacja", "tarta", "szpinak", "bezglutenowe", "wegetariańskie"]
  },
  {
    id: "nalesniki-bezglutenowe",
    title: "Elastyczne naleśniki bezglutenowe",
    mealType: "supper",
    mealTypeName: "Kolacje",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Naleśniki bez grama glutenu, które zwijają się bez problemu i nie pękają. Doskonałe na słono (ze szpinakiem/pieczarkami) lub na słodko.",
    prepTime: 5,
    totalTime: 20,
    yield: { value: 8, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=800&q=80",
    ingredients: [
      { text: "400 g mleka lub napoju roślinnego" },
      { text: "2 duże jajka" },
      { text: "180 g mąki bezglutenowej uniwersalnej" },
      { text: "20 g oleju rzepakowego lub stopionego masła" },
      { text: "1 szczypta soli" }
    ],
    instructions: [
      "Do naczynia miksującego wlej 400 g mleka, wbij 2 jajka, dodaj 180 g mąki bezglutenowej, 20 g oleju i szczyptę soli.",
      "Zmiksuj całość 30 s/obr. 5. Zgarnij mąkę ze ścianek i miksuj ponownie 15 s/obr. 5.",
      "Odstaw ciasto w naczyniu na 10 minut – mąka bezglutenowa potrzebuje chwili na wchłonięcie płynu.",
      "Smaż cienkie naleśniki na dobrze rozgrzanej patelni po ok. 1.5 minuty z jednej i 1 minutę z drugiej strony."
    ],
    hints: "Dodatek 20 g tłuszczu bezpośrednio do ciasta zapobiega przywieraniu naleśników do patelni.",
    tags: ["naleśniki", "kolacja", "bezglutenowe", "szybkie"]
  },

  // ==========================================
  // DESERY I WYPIEKI (DESSERT)
  // ==========================================
  {
    id: "brownie-bezglutenowe",
    title: "Mocno czekoladowe brownie bezglutenowe",
    mealType: "dessert",
    mealTypeName: "Desery i Wypieki",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Wilgotne, intensywnie czekoladowe ciasto z chrupiącą skorupką i rozpływającym się wnętrzem.",
    prepTime: 10,
    totalTime: 35,
    yield: { value: 12, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80",
    ingredients: [
      { text: "200 g gorzkiej czekolady (min. 60-70% kakao)" },
      { text: "150 g masła pokrojonego na kawałki" },
      { text: "3 duże jajka" },
      { text: "120 g cukru trzcinowego" },
      { text: "80 g mąki migdałowej lub mąki ryżowej" },
      { text: "25 g gorzkiego kakao" },
      { text: "1 szczypta soli morskiej" }
    ],
    instructions: [
      "Do naczynia miksującego wrzuć 200 g czekolady połamanej na kostki i 150 g masła. Rozpuść 4 min/50°C/obr. 2.",
      "Dodaj 3 jajka i 120 g cukru trzcinowego, wymieszaj 30 s/obr. 4.",
      "Dodaj 80 g mąki migdałowej, 25 g kakao i szczyptę soli. Wymieszaj 20 s/obr. 3.",
      "Formę kwadratową (ok. 20x20 cm) wyłóż papierem do pieczenia i przelej gęstą masę czekoladową.",
      "Piecz w piekarniku nagrzanym do 175°C przez 20-23 minuty. Środek powinien być ścięty, ale wilgotny przy dotknięciu patyczkiem."
    ],
    hints: "Użycie mąki migdałowej nadaje ciastu cudowny orzechowy posmak i sprawia, że jest naturalnie bezglutenowe i pełne zdrowych kwasów tłuszczowych.",
    tags: ["brownie", "czekolada", "bezglutenowe", "deser"]
  },
  {
    id: "gofry-bezglutenowe",
    title: "Chrupiące gofry bezglutenowe",
    mealType: "dessert",
    mealTypeName: "Desery i Wypieki",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Ekspresowe, złociste gofry z Thermomixa – chrupiące na zewnątrz i puszyste jak chmurka w środku.",
    prepTime: 5,
    totalTime: 15,
    yield: { value: 6, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=800&q=80",
    ingredients: [
      { text: "200 g mleka" },
      { text: "2 jajka (oddzielnie białka i żółtka)" },
      { text: "60 g masła roztopionego" },
      { text: "180 g mąki bezglutenowej uniwersalnej" },
      { text: "1.5 łyżeczki proszku do pieczenia (bezglutenowego)" },
      { text: "1 łyżka cukru waniliowego" },
      { text: "1 szczypta soli" }
    ],
    instructions: [
      "Załóż motylek. Do czystego i suchego naczynia miksującego wlej 2 białka i dodaj szczyptę soli, ubijaj 2 min/obr. 3.5. Przełóż pianę do osobnej miski i wyjmij motylek.",
      "Do naczynia wlej 200 g mleka, 2 żółtka, 60 g roztopionego masła, wsyp 180 g mąki bezglutenowej, 1.5 łyżeczki proszku i 1 łyżkę cukru waniliowego.",
      "Wymieszaj masę 30 s/obr. 4.",
      "Dodaj ubitą wcześniej pianę z białek i wymieszaj delikatnie 15 s/obr. wsteczne 2.5.",
      "Piecz w dobrze rozgrzanej, natłuszczonej gofrownicy (min. 1000W) przez 4-5 minut, aż będą mocno zrumienione. Studź na kratce, aby nie straciły chrupkości."
    ],
    hints: "Studzenie gofrów na kratce (zamiast na płaskim talerzu) to sekret ich niesamowitej chrupkości – wilgoć może swobodnie odparować od spodu.",
    tags: ["gofry", "bezglutenowe", "deser", "śniadanie"]
  },
  {
    id: "budyn-waniliowy-bezglutenowy",
    title: "Aksamitny budyń waniliowy z prawdziwą wanilią",
    mealType: "dessert",
    mealTypeName: "Desery i Wypieki",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Prawdziwy domowy budyń na mleku, żółtkach i skrobi ziemniaczanej, z ziarenkami laski wanilii. Żadnych sztucznych barwników!",
    prepTime: 5,
    totalTime: 12,
    yield: { value: 4, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&q=80",
    ingredients: [
      { text: "500 g mleka 3.2%" },
      { text: "2 żółtka jaj" },
      { text: "40 g skrobi ziemniaczanej lub kukurydzianej" },
      { text: "50 g cukru lub ksylitolu" },
      { text: "1 laska wanilii (ziarenka) lub 1 łyżeczka ekstraktu z wanilii" },
      { text: "15 g masła" }
    ],
    instructions: [
      "Do naczynia miksującego wlej 500 g mleka, dodaj 2 żółtka, 40 g skrobi ziemniaczanej, 50 g cukru, ziarenka z laski wanilii i 15 g masła.",
      "Wymieszaj 10 s/obr. 5.",
      "Gotuj budyń 8 min/90°C/obr. 3.",
      "Po ugotowaniu zmiksuj 10 s/obr. 4 na aksamitną gładkość.",
      "Przelej do salaterek i podawaj z sokiem malinowym lub świeżymi owocami."
    ],
    hints: "Jeśli lubisz bardzo gęsty budyń, zwiększ ilość skrobi do 50 g.",
    tags: ["deser", "budyń", "wanilia", "bezglutenowe", "dla dzieci"]
  },

  // ==========================================
  // PRZEKĄSKI I SOSY (SNACK)
  // ==========================================
  {
    id: "sos-pomidorowy-pizza",
    title: "Aromatyczny sos pomidorowy do pizzy",
    mealType: "snack",
    mealTypeName: "Przekąski i Sosy",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Idealnie zbalansowany, gęsty sos pomidorowy z włoskich pomidorów pelati, czosnku, oregano i świeżej bazylii.",
    prepTime: 5,
    totalTime: 15,
    yield: { value: 4, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?w=800&q=80",
    ingredients: [
      { text: "1 ząbek czosnku" },
      { text: "20 g oliwy z oliwek" },
      { text: "400 g pomidorów krojonych z puszki (lub passaty)" },
      { text: "1 łyżeczka suszonego oregano" },
      { text: "0.5 łyżeczki soli morskiej" },
      { text: "0.5 łyżeczki cukru (do złamania kwasowości pomidorów)" },
      { text: "5 listków świeżej bazylii" }
    ],
    instructions: [
      "Do naczynia miksującego wrzuć 1 ząbek czosnku, rozdrobnij 3 s/obr. 8. Czosnek zgarnij kopystką ze ścianek na dno naczynia.",
      "Dodaj 20 g oliwy z oliwek, podduś czosnek 3 min/120°C/obr. 1.",
      "Dodaj 400 g pomidorów krojonych, 1 łyżeczkę oregano, 0.5 łyżeczki soli i 0.5 łyżeczki cukru. Gotuj 10 min/100°C/obr. 1.",
      "Dodaj świeże listki bazylii i zmiksuj całość 15 s/obr. 7 na gładki, aksamitny sos.",
      "Przelej do słoiczka. Przed nałożeniem na surowe ciasto sos powinien całkowicie ostygnąć."
    ],
    hints: "Nigdy nie nakładaj gorącego sosu na surowe ciasto do pizzy, ponieważ ciasto stanie się zakalcowate i wilgotne.",
    tags: ["sos", "pizza", "pomidory", "baza", "bezglutenowe"]
  },
  {
    id: "hummus-klasyczny",
    title: "Kremowy hummus klasyczny z tahini i cytryną",
    mealType: "snack",
    mealTypeName: "Przekąski i Sosy",
    isGlutenFree: true,
    isVegetarian: true,
    description: "Niezrównanie gładki, aksamitny hummus bliskowschodni z ugotowanej ciecierzycy, pasty sezamowej tahini, czosnku i kuminu.",
    prepTime: 5,
    totalTime: 5,
    yield: { value: 6, unitText: "portion" },
    image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=800&q=80",
    ingredients: [
      { text: "1 ząbek czosnku" },
      { text: "400 g ciecierzycy ugotowanej (1 puszka, odsączona)" },
      { text: "60 g pasty tahini" },
      { text: "30 g oliwy z oliwek" },
      { text: "30 g soku ze świeżej cytryny" },
      { text: "40 g bardzo zimnej wody z lodem" },
      { text: "1 łyżeczka mielonego kuminu" },
      { text: "0.5 łyżeczki soli" }
    ],
    instructions: [
      "Do naczynia miksującego wrzuć 1 ząbek czosnku, rozdrobnij 3 s/obr. 8. Zgarnij na dno.",
      "Dodaj 400 g odsączonej ciecierzycy, 60 g tahini, 30 g oliwy, 30 g soku z cytryny, 1 łyżeczkę kuminu i 0.5 łyżeczki soli.",
      "Zmiksuj 1 min/obr. 7 z pomocą kopystki.",
      "Wlej 40 g lodowatej wody przez otwór w pokrywie i miksuj kolejne 1 min/obr. 8 na puszysty, jasny krem.",
      "Przełóż na talerz, polej oliwą z oliwek i posyp słodką papryką w proszku."
    ],
    hints: "Dodatek lodowatej wody pod koniec miksowania to sekret arabskich szefów kuchni – napowietrza pastę i nadaje jej ultra-kremową konsystencję.",
    tags: ["przekąska", "hummus", "ciecierzyca", "bezglutenowe", "wegańskie"]
  }
];
