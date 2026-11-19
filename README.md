<img src="static/icons/icon128.png" width="64" height="64" alt="">

# Neleceni

**[Инсталирајте из продавнице Chrome Web Store](https://chromewebstore.google.com/detail/neleceni/ffkbnnalhdnnnaeemojkmgpajmaagnjl)**: бесплатно, ажурира се само.\
**[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/neleceni/ffkbnnalhdnnnaeemojkmgpajmaagnjl)**: free, updates itself.

**[Српски](#српски) · [English](#english)**

---

## Српски

### Шта је Neleceni

Neleceni је проширење за Google Chrome које само утишава звук YouTube видеа док говори особа коју сте изабрали.

Проширење прати натпис са именом говорника који телевизијски пренос приказује на слици. Кад препозна име са вашег списка, утиша звук. Кад се појави натпис са именом неког другог говорника, звук се враћа.

Направљено је за званични YouTube канал Народне скупштине Републике Србије, [@ParlamentSrbija](https://www.youtube.com/@ParlamentSrbija). Као пример, подразумевано утишава **Александра Вучића**, а списак особа мењате сами у подешавањима.

### Где и када ради

- **Прегледач:** Google Chrome на рачунару (Windows, macOS, Linux), верзија 116 или новија. Тестирано и у Brave-у; требало би да ради и у осталим прегледачима заснованим на Chromium-у (нпр. Edge).
- **Сајт:** само `www.youtube.com`. Не ради у YouTube апликацији за телефон, на `m.youtube.com`, нити у YouTube плејеру уграђеном у друге сајтове.
- **Канал:** подразумевано само @ParlamentSrbija. Друге канале додајете у подешавањима, али проширење ради само ако канал приказује име говорника белим словима на слици, као што то ради Скупштина.
- **Пренос уживо и снимци:** ради на оба. На снимку можете слободно да премотавате; проширење одмах поново прочита натпис.
- **Квалитет слике:** тестирано на 720p и 1080p. На нижем квалитету (480p и мање) слова су ситна и препознавање је мање поуздано.
- **Натпис мора да буде на екрану.** Проширење „види“ само оно што пише на слици. Ако говорник почне да говори пре него што се појави његов натпис (нпр. док се приказују општи кадрови сале), звук се утишава тек кад се натпис појави. За тај део користите пречицу **Alt+Shift+M**.
- **Видео без натписа се не утишава.** Нпр. конференције за новинаре на истом каналу обично немају натпис са именом говорника, па ту проширење не може да препозна ко говори. Ту користите пречицу или клик на ознаку.
- **Видео треба да буде видљив.** У картици која је у позадини Chrome успорава проширење, па утишавање може да касни. Најбоље је да видео буде у свом прозору или у режиму „слика у слици“ (picture-in-picture).

### Инсталација

#### Из продавнице Chrome Web Store (препоручено)

1. Отворите [Neleceni у продавници Chrome Web Store](https://chromewebstore.google.com/detail/neleceni/ffkbnnalhdnnnaeemojkmgpajmaagnjl) и кликните **Додај у Chrome** (Add to Chrome).
2. Отвориће се страница са подешавањима; горе десно изаберите језик (**Језик / Language**), а ако вам остала подразумевана подешавања одговарају, само је затворите.
3. Закачите иконицу проширења на траку са алаткама: кликните иконицу слагалице 🧩 десно од адресе, па чиоду поред **Neleceni**.
4. Отворите пренос или снимак са канала @ParlamentSrbija.

Chrome сам ажурира проширење кад изађе нова верзија.

> Ако сте проширење раније учитали ручно (ZIP или изворни код), уклоните ту копију у `chrome://extensions`, да не раде две истовремено. Подешавања се из ручно учитане копије не преносе; ако сте их мењали, унесите их поново.

#### Ручно: готов ZIP

Ако не желите продавницу, проширење можете да учитате и ручно, у режиму за програмере.

1. На страници [Releases](https://github.com/Tpojka/neleceni/releases/latest) преузмите датотеку `neleceni-<верзија>.zip` (одељак **Assets**).
2. Распакујте је у фасциклу коју нећете брисати ни премештати, нпр. `Documents/neleceni`. Chrome проширење учитава управо из те фасцикле.
3. У Chrome-у отворите `chrome://extensions`.
4. Горе десно укључите **Developer mode** (режим за програмере).
5. Кликните **Load unpacked** и изаберите распаковану фасциклу (ону у којој је датотека `manifest.json`). Отвориће се страница са подешавањима; горе десно изаберите језик (**Језик / Language**), а ако вам остала подразумевана подешавања одговарају, само је затворите.
6. Закачите иконицу проширења на траку са алаткама: кликните иконицу слагалице 🧩 десно од адресе, па чиоду поред **Neleceni**.
7. Отворите пренос или снимак са канала @ParlamentSrbija.

**Ажурирање:** преузмите нови ZIP и распакујте га преко старе фасцикле (замените постојеће датотеке). Затим у `chrome://extensions` кликните стрелицу за поновно учитавање (↻) на картици **Neleceni** и поново учитајте отворене YouTube картице. Подешавања остају сачувана.

#### Из изворног кода

Потребни су [Node.js](https://nodejs.org/) 23.6 или новији и, по жељи, [Git](https://git-scm.com/).

```sh
git clone https://github.com/Tpojka/neleceni.git
cd neleceni
npm install
npm run build
```

Готово проширење се налази у фасцикли `dist/`; учитајте га као у корацима 3–7 изнад. **Ажурирање:** `git pull`, `npm install`, `npm run build`, па ↻ на картици **Neleceni**.

> Chrome памти проширење по путањи до фасцикле. Ако фасциклу преместите или преименујете, уклоните проширење и поново га учитајте преко **Load unpacked**. Подешавања се тада враћају на подразумевана.

### Коришћење

Кад је проширење инсталирано, не морате ништа да подешавате: отворите пренос са канала @ParlamentSrbija и оно ради само.

- **Ознака на видеу.** У горњем десном углу плејера стоји мала ознака:
  - зелена тачка и **Чује се**: звук се чује;
  - црвено **Утишано · Александар Вучић**: звук је утишан, уз име које је препознато.

  Клик на ознаку ручно утишава или враћа звук.
- **Пречица Alt+Shift+M** ради исто што и клик на ознаку. Ручни избор важи док се на екрану не појави натпис са другим именом; после тога проширење опет ради само. Пречицу мењате на `chrome://extensions/shortcuts`.
- **Иконица на траци са алаткама** показује стање картице: **УКЉ** значи да проширење прати овај видео, **ТИХО** да је звук утишан.
- **Прозорчић проширења** (клик на иконицу) има прекидач **Укључено**, тренутно стање, дугме **Утишај / врати звук** и дугме **Подешавања**.

YouTube-ово дугме за звук и јачину звука проширење не дира. Ако сте сами утишали YouTube, проширење то неће поништити.

### Подешавања

Отварају се кликом на иконицу проширења → **Подешавања**, или у `chrome://extensions` преко детаља проширења **Neleceni** (опције проширења). Измене важе кад кликнете **Сачувај**; **Врати подразумевано** враћа почетна подешавања.

#### Језик: „Језик / Language“

Језик целог проширења: подешавања, прозорчић, ознака на видеу и иконица. **Аутоматски** (подразумевано) значи српски ако је Chrome на српском, а енглески иначе. Ако је ваш Chrome на енглеском, а желите српски, изаберите **Српски (ћирилица)**.

#### Кога утишати

Ово је главно подешавање. Упишите једно име у сваки ред, онако како пише у натпису на екрану.

**Пример: утишавање Александра Вучића** (ово је подразумевано подешавање):

```
Александар Вучић
```

- Упишите и име и презиме. Свака реч мора да се поклопи, па „Александар Вучић“ не утишава, рецимо, „Александар Вулин“ нити „Милош Вучевић“.
- Ћирилица и латиница се рачунају као исто: „Александар Вучић“ препознаје и „Aleksandar Vučić“. Велика и мала слова и квачице нису битни.
- Ако упишете само презиме („Вучић“), утишава се свако са тим презименом.
- Још једну особу додајете у нови ред:
  ```
  Александар Вучић
  Име Презиме
  ```
- Ако привремено не желите утишавање, искључите прекидач **Укључено** у прозорчићу проширења или у подешавањима.

> Натпис у Скупштини има два реда: име говорника и, испод њега, посланичку групу (нпр. „Александар Вучић - Србија побеђује“). Проширење чита **само ред са именом говорника**. Поље **Кога утишати** зато не утишава посланике из групе која носи Вучићево име; то ради поље **Посланичке групе које треба утишати** испод.

#### Посланичке групе које треба утишати

Ако желите да утишате целу посланичку групу, а не да набрајате посланике једног по једног, упишите групу онако како пише у другом реду натписа:

```
Александар Вучић - Србија побеђује
```

Тада се утишава сваки говорник из те групе, без обзира на име у првом реду. Довољан је и само назив („Србија побеђује“). Говорник из друге групе прекида утишавање као и иначе. Подразумевано је уписана управо ова група; обришите је ако желите да утишавате само особе из поља **Кога утишати**.

#### Канали

Канали на којима проширење ради, по један у реду: ознака канала (`@ParlamentSrbija`), ID канала (`UC…`) или цела адреса канала. Подразумевано: `@ParlamentSrbija` и његов ID. Ако оставите празно, проширење ради на свим YouTube видеима.

#### Положај натписа

Део слике у коме проширење тражи натпис, у процентима ширине и висине слике: **Лево %**, **Горе %**, **Ширина %**, **Висина %**. Подразумевано је 0 / 80 / 90 / 20, односно доњих 20 % слике, што покрива обе величине натписа које Скупштина користи. Мењајте ово само ако канал промени изглед натписа или ако додате други канал. Укључите **приказ за отклањање грешака** (испод) да видите шта проширење чита.

#### Препознавање

| Подешавање | Подразумевано | Чему служи |
|---|---|---|
| **Провера на сваких (ms)** | 1500 | Колико често се проверава натпис, у милисекундама. Мање значи брже утишавање, али више посла за рачунар. |
| **Праг беле боје (100–255)** | 225 | Колико бела морају да буду слова. Смањите ако имена не бивају препозната; повећајте ако се у текст меша позадина. |
| **Писмо натписа** | Српска ћирилица | Писмо којим канал пише натписе. Латиницу укључите само ако канал пише латиницом. |
| **Колико пута друго име да би се вратио звук** | 3 | Колико пута мора да се прочита друго име пре него што се звук врати. Мање значи да се звук враћа брже, али и да је грешка вероватнија. |
| **Најмања поузданост за друга имена (%)** | 35 | Колико поуздано мора да буде прочитано друго име да би се рачунало. Утиче само на враћање звука. |
| **Врати звук после N s без имена (0 = искључено)** | 0 | Враћа звук ако се име не види N секунди. Подразумевано је искључено, јер говор обично траје и кад натпис нестане са екрана. |

#### Приказ и пречица

- **Прикажи ознаку стања на видеу**: приказује ознаку „Чује се“ / „Утишано“ на видеу.
- **Приказ за отклањање грешака**: испод ознаке приказује исечак слике који проширење чита и текст који је препознало. Корисно кад подешавате положај натписа или праг беле боје.
- Линк **Промени пречицу** отвара страницу на којој мењате пречицу Alt+Shift+M.

### Шта проширење не може

- **Утишава сав звук, не само један глас.** Ако неко добаци док утишана особа говори, ни то се не чује.
- **Ради само кад је натпис на екрану.** Видети „Где и када ради“.
- **Почетак може да се чује.** Утишавање креће кад се натпис прочита, обично у року од секунде или две.
- **Не препознаје глас**, само натпис.

### Приватност

Све се дешава на вашем рачунару. Слике из видеа не напуштају прегледач, проширење не шаље никакве податке и не повезује се ни са каквим сервером. Тражи само две дозволе: `storage` (чување подешавања) и `offscreen` (покретање препознавања текста), и ради само на `www.youtube.com`. Детаљно: [политика приватности](PRIVACY.md).

### Лиценца

Neleceni је слободан софтвер под [MIT лиценцом](LICENSE): слободно га користите, мењате и делите, уз задржавање напомене о ауторским правима и текста лиценце. Уграђени алат за препознавање текста [Tesseract](https://github.com/naptha/tesseract.js) је под лиценцом Apache-2.0; видети [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## English

### What Neleceni is

Neleceni is a Google Chrome extension that automatically mutes a YouTube video while a speaker you choose has the floor.

It watches the name caption that the broadcast shows on the picture. When it recognises a name from your list, it mutes the sound. When a caption with another speaker's name appears, the sound comes back.

It was built for the official YouTube channel of the National Assembly of Serbia, [@ParlamentSrbija](https://www.youtube.com/@ParlamentSrbija). As an example, it mutes **Aleksandar Vučić** (Александар Вучић) by default; you choose who to mute in the settings.

### Where and when it works

- **Browser:** Google Chrome on a computer (Windows, macOS, Linux), version 116 or newer. Also tested in Brave; other Chromium-based browsers (such as Edge) should work too.
- **Site:** `www.youtube.com` only. Not the YouTube phone app, not `m.youtube.com`, and not YouTube players embedded in other sites.
- **Channel:** @ParlamentSrbija only, by default. You can add other channels in the settings, but the extension only works where the channel shows the speaker's name in white letters on the picture, as the Assembly does.
- **Live streams and replays:** both. You can skip around in a replay; the extension reads the caption again right away.
- **Video quality:** tested at 720p and 1080p. At lower quality (480p and below) the letters are small and recognition is less reliable.
- **The caption must be on screen.** The extension only "sees" what is written on the picture. If someone starts speaking before their caption appears (for example over wide shots of the chamber), the sound is muted only once the caption appears. Use **Alt+Shift+M** for that part.
- **Videos without a name caption are not muted.** Press conferences on the same channel, for example, usually show no speaker caption, so the extension cannot tell who is speaking. Use the shortcut or click the pill there.
- **Keep the video visible.** In a background tab Chrome slows the extension down, so muting can lag. Best results: the video in its own window, or in picture-in-picture.

### Installation

#### From the Chrome Web Store (recommended)

1. Open [Neleceni on the Chrome Web Store](https://chromewebstore.google.com/detail/neleceni/ffkbnnalhdnnnaeemojkmgpajmaagnjl) and click **Add to Chrome**.
2. The settings page opens; pick the language at the top right (**Језик / Language**), and if the other defaults suit you, just close it.
3. Pin the extension to the toolbar: click the puzzle icon 🧩 to the right of the address bar, then the pin next to **Neleceni**.
4. Open a live stream or a replay on @ParlamentSrbija.

Chrome updates the extension by itself when a new version comes out.

> If you loaded the extension by hand before (ZIP or source), remove that copy in `chrome://extensions` so the two don't run at once. Settings don't carry over from the hand-loaded copy; re-enter them if you had changed any.

#### By hand: the ready-made ZIP

If you'd rather not use the store, you can load the extension by hand, in developer mode.

1. On the [Releases](https://github.com/Tpojka/neleceni/releases/latest) page, download `neleceni-<version>.zip` (under **Assets**).
2. Unzip it into a folder you won't delete or move, e.g. `Documents/neleceni`. Chrome loads the extension from that very folder.
3. In Chrome, open `chrome://extensions`.
4. Turn on **Developer mode** (top right).
5. Click **Load unpacked** and choose the unzipped folder (the one containing `manifest.json`). The settings page opens; pick the language at the top right (**Језик / Language**), and if the other defaults suit you, just close it.
6. Pin the extension to the toolbar: click the puzzle icon 🧩 to the right of the address bar, then the pin next to **Neleceni**.
7. Open a live stream or a replay on @ParlamentSrbija.

**Updating:** download the new ZIP and unzip it over the old folder (replace the existing files). Then click the reload arrow (↻) on the **Neleceni** card in `chrome://extensions` and reload any open YouTube tabs. Your settings are kept.

#### From source

You need [Node.js](https://nodejs.org/) 23.6 or newer and, optionally, [Git](https://git-scm.com/).

```sh
git clone https://github.com/Tpojka/neleceni.git
cd neleceni
npm install
npm run build
```

The finished extension is in the `dist/` folder; load it as in steps 3–7 above. **Updating:** `git pull`, `npm install`, `npm run build`, then ↻ on the **Neleceni** card.

> Chrome identifies the extension by its folder path. If you move or rename the folder, remove the extension and load it again with **Load unpacked**. Its settings then go back to the defaults.

### Using it

Once installed, nothing needs setting up: open a stream on @ParlamentSrbija and it works on its own.

- **Status pill on the video.** A small label sits in the top-right corner of the player:
  - green dot and **Listening**: sound is on;
  - red **Muted · Александар Вучић**: sound is muted, with the name that was recognised.

  Click the pill to mute or un-mute by hand.
- **Alt+Shift+M** does the same as clicking the pill. A manual choice holds until a caption with a different name appears; then the extension takes over again. Change the shortcut at `chrome://extensions/shortcuts`.
- **Toolbar icon** shows the tab's state: **ON** means the extension is watching this video, **MUTE** means the sound is muted.
- **Popup** (click the toolbar icon): an **Enabled** switch, the current state, a **Mute / un-mute** button and a **Settings** button.

The extension does not touch YouTube's own mute button or volume. If you muted YouTube yourself, the extension won't undo it.

### Settings

Open them from the toolbar icon → **Settings**, or in `chrome://extensions` → **Neleceni** → **Details** → **Extension options**. Changes apply when you click **Save**; **Reset to defaults** restores the defaults.

#### Language: "Језик / Language"

The language of the whole extension: settings, popup, the pill on the video and the toolbar badge. **Automatic** (the default) means Serbian Cyrillic when Chrome runs in Serbian, English otherwise. You can also choose **Српски (ћирилица)** or **English** directly.

#### Who to mute: "Speakers to mute"

This is the main setting. Enter one name per line, as it appears in the on-screen caption.

**Example: muting Aleksandar Vučić** (this is the default):

```
Александар Вучић
```

- Enter both first name and surname. Every word must match, so "Александар Вучић" does not mute, for instance, "Александар Вулин" or "Милош Вучевић".
- Cyrillic and Latin count as the same: "Александар Вучић" also matches "Aleksandar Vučić". Upper/lower case and diacritics don't matter.
- A surname alone ("Вучић") mutes everyone with that surname.
- Add another person on a new line:
  ```
  Александар Вучић
  First Last
  ```
- To pause muting, turn off **Enabled** in the popup or in the settings.

> The Assembly's caption has two lines: the speaker's name and, below it, the parliamentary group (e.g. "Александар Вучић - Србија побеђује"). The extension reads **only the speaker's name line**. So "Speakers to mute" does not mute members of the group named after Vučić; **Parliamentary groups to mute** below does that.

#### Whole groups: "Parliamentary groups to mute"

To mute a whole parliamentary group instead of listing its deputies one by one, enter the group as it appears on the caption's second line:

```
Александар Вучић - Србија побеђује
```

Every speaker from that group is then muted, whatever name is on the first line. The party part alone ("Србија побеђује") also works. A speaker from another group ends the mute as usual. This group is listed by default; delete it to mute only the people under "Speakers to mute".

#### Which channels: "Channels"

Channels the extension works on, one per line: a channel handle (`@ParlamentSrbija`), a channel ID (`UC…`) or the full channel URL. Default: `@ParlamentSrbija` and its ID. Leave it empty to work on every YouTube video.

#### Where the caption is: "Caption position"

The part of the picture searched for the caption, in percent of the picture's width and height: **Left %**, **Top %**, **Width %**, **Height %**. The default is 0 / 80 / 90 / 20, the bottom 20 % of the picture, which covers both caption sizes the Assembly uses. Only change it if the channel changes its caption layout or you add another channel. Turn on **Debug view** (below) to see what the extension reads.

#### Recognition details: "Detection"

| Setting | Default | What it does |
|---|---|---|
| **Провера на сваких (ms)** | 1500 | How often the caption is checked, in milliseconds. Lower mutes sooner but costs more CPU. |
| **Праг беле боје (100–255)** | 225 | How white the letters must be. Lower it if names are missed; raise it if the background gets mixed into the text. |
| **OCR language** | Serbian Cyrillic | Script of the captions. Add Latin only if the channel writes in Latin script. |
| **Колико пута друго име да би се вратио звук** | 3 | How many times another name must be read before the sound comes back. Lower brings the sound back sooner but makes mistakes more likely. |
| **Најмања поузданост за друга имена (%)** | 35 | How confidently another name must be read to count. Only affects un-muting. |
| **Врати звук после N s без имена (0 = искључено)** | 0 | Brings the sound back when the name has not been seen for N seconds. Off by default, because a speech usually goes on after the caption disappears. |

#### Display and shortcut

- **Show the status pill on the video**: shows the Listening/Muted pill.
- **Debug view**: shows, under the pill, the image strip the extension reads and the text it recognised. Useful when adjusting "Caption position" or "White threshold".
- The **Change the shortcut** link opens the page where you change Alt+Shift+M.

### What it cannot do

- **It mutes all sound, not one voice.** If someone interrupts while the muted person is speaking, you won't hear that either.
- **It only works while the caption is on screen.** See "Where and when it works".
- **The start may be heard.** Muting starts when the caption is read, usually within a second or two.
- **It does not recognise voices**, only the caption.

### Privacy

Everything happens on your computer. Video frames never leave the browser; the extension sends no data and connects to no server. It asks for two permissions only: `storage` (to keep your settings) and `offscreen` (to run text recognition), and it runs only on `www.youtube.com`. Details: [privacy policy](PRIVACY.md).

### Licence

Neleceni is free software under the [MIT License](LICENSE): you may use, change and share it, keeping the copyright notice and licence text. The bundled text-recognition engine [Tesseract](https://github.com/naptha/tesseract.js) is under the Apache-2.0 licence; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## За програмере · For developers

How it works inside, the caption layouts it was tuned on, test results and build commands: [docs/how-it-works.md](docs/how-it-works.md).
