/**
 * Interface texts in English and Serbian Cyrillic.
 *
 * The extension keeps its own tables instead of relying only on chrome.i18n, so the language can
 * be chosen in the settings independently of Chrome's language. (The extension's name,
 * description and shortcut name in chrome://extensions follow Chrome's language, via _locales.)
 *
 * Texts ending in `Html` contain simple markup and are inserted with innerHTML; they are fixed
 * strings from this file, never user input.
 */

export type Lang = 'sr' | 'en';
export type LangSetting = 'auto' | Lang;
export const LANG_SETTINGS: readonly LangSetting[] = ['auto', 'sr', 'en'];

const en = {
  // Status pill on the video
  listening: 'Listening',
  muted: 'Muted',
  manual: '(manual)',
  pillTitle: 'Neleceni: click (or Alt+Shift+M) to mute or un-mute by hand',
  noteOcrError: 'OCR error: {error}',
  noteNeedsClick: 'Click the page once to let audio play',
  debugNoCaption: '(no caption)',

  // Toolbar badge (at most 4 characters)
  badgeOn: 'ON',
  badgeMuted: 'MUTE',

  // Popup
  popupEnabled: 'Enabled',
  popupNotYoutube: 'Not on YouTube',
  popupNotYoutubeDetail: 'Open a video from a watched channel.',
  popupOff: 'Off',
  popupOffDetail: 'Turn on “Enabled” to start.',
  popupIdle: 'Idle',
  popupIdleDetail: 'This tab is not playing a video from a watched channel.',
  popupCaption: 'Caption: {line}',
  popupNoCaption: 'No name caption read yet.',
  popupToggle: 'Mute / un-mute',
  popupSettings: 'Settings',

  // Settings page
  optTitle: 'Neleceni settings',
  optIntro:
    "Reads the speaker's name caption on the video and mutes the stream while a listed speaker holds the floor. Works on live streams and on replays.",
  optPrivacy:
    'Privacy: the extension reads only the caption area of the video, on your computer, to recognise the name. Nothing is stored or sent anywhere.',
  optLanguage: 'Језик / Language',
  optLangAuto: 'Automatic (Chrome’s language)',
  optEnabled: 'Enabled',
  optSpeakers: 'Speakers to mute',
  optSpeakersHint:
    'One name per line, as it appears in the caption. Cyrillic and Latin both work (“Александар Вучић” also matches “Aleksandar Vučić”). Every word must match; a surname alone matches anyone with that surname.',
  optGroups: 'Parliamentary groups to mute',
  optGroupsHint:
    'One group per line, as it appears on the second line of the caption, e.g. “Александар Вучић - Србија побеђује”. Every speaker from a listed group is muted, whatever their name.',
  optChannels: 'Channels',
  optChannelsHintHtml:
    'Channel handles (<code>@ParlamentSrbija</code>) or IDs (<code>UC…</code>), one per line. Leave empty to watch every YouTube video.',
  optRegion: 'Caption position',
  optRegionHint:
    'Where the name caption sits, in percent of the video frame. The default covers both caption sizes the parliament uses. The line right above the parliamentary group line (the one with “ - ”) is read as the speaker’s name; the group line itself is ignored. Without a group line, the top line is used. Turn on the debug view to see exactly what is read.',
  optLeft: 'Left %',
  optTop: 'Top %',
  optWidth: 'Width %',
  optHeight: 'Height %',
  optDetection: 'Detection',
  optInterval: 'Check every (ms)',
  optWhite: 'White threshold (100–255)',
  optLangs: 'OCR language',
  optLangsSrp: 'Serbian Cyrillic',
  optLangsBoth: 'Serbian Cyrillic + Latin',
  optLangsLatn: 'Serbian Latin',
  optWhiteHint:
    'Caption letters are white: a pixel counts as text when red, green and blue are all at least the threshold. Lower it if names are missed, raise it if the background leaks in.',
  optConfirmations: 'Other-name readings to un-mute',
  optMinConfidence: 'Min. confidence for other names (%)',
  optReleaseAfter: 'Un-mute after N s without the name (0 = off)',
  optDetectionHint:
    'The mute starts on the first reading of a listed name and ends when another speaker’s name has been read the given number of times. A caption that disappears does not end the mute, because the speech usually goes on.',
  optDisplay: 'Display and shortcut',
  optShowBadge: 'Show the status pill on the video (click it to mute or un-mute by hand)',
  optDebug: 'Debug view: show the processed caption crop and the OCR text under the pill',
  optShortcutHtml:
    'Keyboard shortcut: <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd> mutes or un-mutes by hand until the next speaker’s caption appears. <a href="#" data-action="shortcuts">Change the shortcut</a>.',
  optSave: 'Save',
  optReset: 'Reset to defaults',
  optSaved: 'Saved',
  optDefaultsRestored: 'Defaults restored',
};

export type MessageKey = keyof typeof en;

const sr: Record<MessageKey, string> = {
  listening: 'Чује се',
  muted: 'Утишано',
  manual: '(ручно)',
  pillTitle: 'Neleceni: клик (или Alt+Shift+M) ручно утишава или враћа звук',
  noteOcrError: 'Грешка при препознавању: {error}',
  noteNeedsClick: 'Кликните једном на страницу да би се звук чуо',
  debugNoCaption: '(нема натписа)',

  badgeOn: 'УКЉ',
  badgeMuted: 'ТИХО',

  popupEnabled: 'Укључено',
  popupNotYoutube: 'Није YouTube',
  popupNotYoutubeDetail: 'Отворите видео са праћеног канала.',
  popupOff: 'Искључено',
  popupOffDetail: 'Укључите „Укључено“ да би проширење радило.',
  popupIdle: 'Мирује',
  popupIdleDetail: 'Ова картица не приказује видео са праћеног канала.',
  popupCaption: 'Натпис: {line}',
  popupNoCaption: 'Натпис са именом још није прочитан.',
  popupToggle: 'Утишај / врати звук',
  popupSettings: 'Подешавања',

  optTitle: 'Neleceni — подешавања',
  optIntro:
    'Чита натпис са именом говорника на видеу и утишава пренос док говори особа са списка. Ради на преносима уживо и на снимцима.',
  optPrivacy:
    'Приватност: проширење чита само део слике са натписом, на вашем рачунару, да би препознало име. Ништа се не чува нити шаље.',
  optLanguage: 'Језик / Language',
  optLangAuto: 'Аутоматски (језик Chrome-а)',
  optEnabled: 'Укључено',
  optSpeakers: 'Кога утишати',
  optSpeakersHint:
    'Једно име у сваком реду, онако како пише у натпису. Ћирилица и латиница се рачунају као исто („Александар Вучић“ препознаје и „Aleksandar Vučić“). Свака реч мора да се поклопи; само презиме препознаје свакога са тим презименом.',
  optGroups: 'Посланичке групе које треба утишати',
  optGroupsHint:
    'Једна група у сваком реду, онако како пише у другом реду натписа, нпр. „Александар Вучић - Србија побеђује“. Утишава се сваки говорник из групе са списка, без обзира на име.',
  optChannels: 'Канали',
  optChannelsHintHtml:
    'Ознаке канала (<code>@ParlamentSrbija</code>) или ID-јеви (<code>UC…</code>), један у реду. Оставите празно да проширење ради на свим YouTube видеима.',
  optRegion: 'Положај натписа',
  optRegionHint:
    'Део слике у коме стоји натпис са именом, у процентима. Подразумевана вредност покрива обе величине натписа које користи Скупштина. Као име говорника чита се ред одмах изнад реда са посланичком групом (онај са „ - “); сам ред са групом се занемарује. Ако реда са групом нема, чита се горњи ред. Укључите приказ за отклањање грешака да видите шта се тачно чита.',
  optLeft: 'Лево %',
  optTop: 'Горе %',
  optWidth: 'Ширина %',
  optHeight: 'Висина %',
  optDetection: 'Препознавање',
  optInterval: 'Провера на сваких (ms)',
  optWhite: 'Праг беле боје (100–255)',
  optLangs: 'Писмо натписа',
  optLangsSrp: 'Српска ћирилица',
  optLangsBoth: 'Српска ћирилица + латиница',
  optLangsLatn: 'Српска латиница',
  optWhiteHint:
    'Слова натписа су бела: тачка на слици се рачуна као текст кад су њена црвена, зелена и плава компонента бар колико праг. Смањите праг ако имена не бивају препозната, повећајте га ако се у текст меша позадина.',
  optConfirmations: 'Колико пута друго име да би се вратио звук',
  optMinConfidence: 'Најмања поузданост за друга имена (%)',
  optReleaseAfter: 'Врати звук после N s без имена (0 = искључено)',
  optDetectionHint:
    'Утишавање почиње чим се први пут прочита име са списка, а престаје кад се име другог говорника прочита задати број пута. Нестанак натписа не враћа звук, јер говор обично траје и даље.',
  optDisplay: 'Приказ и пречица',
  optShowBadge: 'Прикажи ознаку стања на видеу (клик на њу ручно утишава или враћа звук)',
  optDebug: 'Приказ за отклањање грешака: исечак натписа и препознати текст испод ознаке',
  optShortcutHtml:
    'Пречица на тастатури: <kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd> ручно утишава или враћа звук до појаве натписа следећег говорника. <a href="#" data-action="shortcuts">Промени пречицу</a>.',
  optSave: 'Сачувај',
  optReset: 'Врати подразумевано',
  optSaved: 'Сачувано',
  optDefaultsRestored: 'Враћена су подразумевана подешавања',
};

export const MESSAGES: Record<Lang, Record<MessageKey, string>> = { en, sr };

/** The browser's interface language, e.g. "sr", "en-US". */
function browserLanguage(): string {
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage) return chrome.i18n.getUILanguage();
  } catch {
    // not in an extension context
  }
  return typeof navigator !== 'undefined' ? navigator.language : 'en';
}

/** Serbian when chosen, or when "auto" and the browser runs in Serbian; English otherwise. */
export function resolveLang(setting: LangSetting, uiLanguage: string = browserLanguage()): Lang {
  if (setting !== 'auto') return setting;
  return uiLanguage.toLowerCase().startsWith('sr') ? 'sr' : 'en';
}

/** The text for `key`, with `{name}` placeholders filled in. */
export function t(lang: Lang, key: MessageKey, vars: Record<string, string | number> = {}): string {
  return MESSAGES[lang][key].replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}
