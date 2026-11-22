# 🍕 CookiWebImport — Importer Przepisów do Cookidoo (Thermomix TM6 / TM5 / TM7)

> Uniwersalny system i dodatek do **Home Assistant** umożliwiający wyszukiwanie w największych portalach kulinarnych (**Przepisownia.pl, Kwestia Smaku, Ania Gotuje**) oraz automatyczny, masowy import przepisów ze zdjęciami i nastawami dotykowymi prosto do konta **Vorwerk Cookidoo**.

---

## 📌 Spis treści
1. [Integracja z Home Assistant (Add-on / Ingress)](#-integracja-z-home-assistant-ha)
2. [Funkcje systemu](#-funkcje-systemu)
3. [Instalacja lokalna (Localhost)](#-instalacja-lokalna)
4. [Instalacja przez Docker / Docker-Compose](#-instalacja-przez-docker)
5. [Logowanie do Cookidoo (2 metody)](#-logowanie-do-cookidoo)
6. [Zarządzanie i usuwanie przepisów](#-zarządzanie-i-usuwanie-przepisów)
7. [Wyszukiwanie w zewnętrznych portalach](#-wyszukiwanie-w-zewnętrznych-portalach)
8. [Tryb Offline i Książka Kucharska](#-tryb-offline-i-książka-kucharska)

---

## 🏠 Integracja z Home Assistant (HA)

Tak! Z aplikacji **CookiWebImport** można w prosty sposób korzystać bezpośrednio wewnątrz Home Assistant jako **oficjalny dodatek (Add-on) z obsługą Ingress**:

### Metoda A: Dodatek Home Assistant Add-on (Zalecana dla Home Assistant OS / Supervised)
Dzięki mechanizmowi **HA Ingress**, strona aplikacji pojawia się bezpośrednio w **menu bocznym Home Assistant** (jak Zigbee2MQTT, Node-RED czy File Editor), bez potrzeby otwierania dodatkowych portów w routerze.

1. Skopiuj folder z projektem lub dodaj repozytorium do Home Assistant:
   - W Home Assistant przejdź do: **Ustawienia** &rarr; **Dodatki** &rarr; **Sklep z dodatkami** &rarr; Menu 3 kropki w prawym górnym rogu &rarr; **Repozytoria**.
   - Wklej adres URL Twojego repozytorium GitHub z projektem CookiWebImport.
   *(Alternatywnie: skopiuj folder projektu do katalogu `/addons/cookiwebimport` w Home Assistant przez Sambę lub SSH).*
2. Kliknij dodatek **CookiWebImport** i wybierz **Zainstaluj**.
3. W zakładce **Konfiguracja** możesz (opcjonalnie) wpisać swój login/hasło lub ciasteczko sesji Cookidoo.
4. Zaznacz opcję **„Pokaż na pasku bocznym”** i kliknij **Uruchom**.
5. W menu bocznym Home Assistant pojawi się ikonka **CookiWebImport** – po jej kliknięciu masz natychmiastowy dostęp do pełnego panelu!

### Metoda B: Panel Iframe (dla Home Assistant Container / Core)
Jeśli masz już uruchomiony CookiWebImport w Dockerze lub na komputerze w sieci lokalnej (np. `http://192.168.1.50:3000`), dodaj w `configuration.yaml` Home Assistant:

```yaml
panel_iframe:
  cookiwebimport:
    title: "CookiWebImport"
    icon: "mdi:silverware-fork-knife"
    url: "http://192.168.1.50:3000"
```

Po przeładowaniu konfiguracji Home Assistant, CookiWebImport pojawi się na pasku bocznym jako zintegrowany panel!

---

## ✨ Funkcje systemu

- 🚀 **Masowy import do Cookidoo ze zdjęciami:** Wysyła oryginalne zdjęcia potraw bezpośrednio do chmury Vorwerk Cloudinary.
- ⚙️ **Natywne przyciski dotykowe Thermomix:** Automatycznie generuje interaktywne kafelki `TTS` na ekranie TM6/TM7 (np. dotknięcie kafelka na ekranie Thermomixa automatycznie ustawia `2 min / 37°C / obr. 2` lub `tryb ciasto`).
- 🔎 **Dynamiczna multi-wyszukiwarka:** Przeszukuj jednocześnie **Przepisownię Thermomix (50 000+ oficjalnych przepisów TM)**, **Kwestię Smaku** oraz **Ania Gotuje**.
- ☁️ **Menedżer Cookidoo i usuwanie przepisów:** Wyświetlaj swoje utworzone przepisy w Cookidoo, usuwaj pojedynczo lub zaznaczaj hurtowo checkboxami i usuwaj jednym kliknięciem.
- 🌾 **Dedykowany zestaw bezglutenowy i pizzy:** Bogata biblioteka gotowych przepisów na ciasto neapolitańskie, chleby bezglutenowe, foccacię, desery i obiady.
- 🌐 **Uniwersalny scraper WWW:** Wklej link z dowolnego bloga kulinarnego lub surowy tekst przepisu.
- 📖 **Książka kucharska Offline:** Samodzielna strona HTML z możliwością druku do PDF i pracy bez aktywnego abonamentu Cookidoo.

---

## 🚀 Instalacja lokalna

Wymagania: **Node.js 20+**

```bash
# Sklonuj lub przejdź do katalogu projektu
cd cookiwebimport

# Zainstaluj zależności
npm install

# Uruchomienie serwera
npm start
```

Otwórz w przeglądarce: **[http://localhost:3000](http://localhost:3000)**

---

## 🐳 Instalacja przez Docker

Aplikację można błyskawicznie uruchomić w kontenerze Docker:

```bash
docker compose up -d
```

Wszystkie pobrane przepisy oraz dane sesji będą trwale przechowywane w wolumenie Docker (`/data`).

---

## 🔑 Logowanie do Cookidoo

System obsługuje dwie metody autoryzacji:

### Metoda 1: Ciasteczko sesji `_oauth2_proxy` (Zalecana, 100% odporna na 2FA / CAPTCHA)
1. Zaloguj się w przeglądarce na stronie [cookidoo.pl](https://cookidoo.pl).
2. Wciśnij klawisz `F12` (Narzędzia deweloperskie).
3. Wejdź w zakładkę **Aplikacja** (Application) &rarr; **Pliki cookie** (Cookies) &rarr; `https://cookidoo.pl`.
4. Znajdź ciasteczko o nazwie `_oauth2_proxy` i skopiuj jego wartość (długi ciąg znaków).
5. Wklej je w panelu w okienku logowania.

### Metoda 2: Bezpośrednie logowanie E-mail i Hasło
Wpisz swój e-mail i hasło w formularzu logowania – aplikacja przeprowadzi oficjalny proces autoryzacji OAuth2/PKCE CIAM.

---

## 🗑️ Zarządzanie i usuwanie przepisów

W górnym pasku przełączników kliknij:
- **`☁️ Moje w Cookidoo`**:
  - Wyświetla wszystkie przepisy aktualnie utworzone na Twoim koncie Cookidoo.
  - Kliknij **`🗑️ Usuń z Cookidoo`** na wybranej karcie, aby usunąć pojedynczy przepis.
  - Zaznacz checkboxy przy wielu przepisach i kliknij **`🗑️ Usuń zaznaczone z Cookidoo`** na pływającym pasku, aby wyczyścić konto hurtowo!
- **`📂 Twoja Biblioteka TM`**:
  - Pozwala zarządzać lokalną bazą przepisów i usuwać zaimportowane z sieci pozycje.

---

## 📖 Tryb Offline i Książka Kucharska

Jeśli skończył Ci się 30-dniowy darmowy okres próbny na danym koncie Cookidoo:
- Kliknij przycisk **„📖 Książka Offline”** w prawym górnym rogu panelu.
- Każdy krok zawiera wyodrębnione nastawy urządzenia (np. `⚙️ 2 min/37°C/obr. 2`, `⚙️ tryb ciasto`).
- Dostępne jest odhaczanie składników oraz opcja **„Drukuj / Zapisz jako PDF”**.
