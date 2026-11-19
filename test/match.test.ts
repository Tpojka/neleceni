import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { classify, lineMatchesGroup, lineMatchesName, normalize, pickSpeakerLine, similarLines, type OcrLine } from '../src/shared/match.ts';
import { channelKey } from '../src/content/channel.ts';

const TARGET = ['Александар Вучић'];
// Caption lines as Tesseract reports them: 40 px tall, `y0` from the top of the crop.
const line = (text: string, y0: number, confidence = 80, x0 = 0): OcrLine => ({
  text,
  confidence,
  x0,
  y0,
  x1: x0 + 600,
  y1: y0 + 40,
});

describe('normalize', () => {
  it('maps Cyrillic and Latin spellings to the same string', () => {
    assert.equal(normalize('Александар Вучић'), 'aleksandar vucic');
    assert.equal(normalize('Aleksandar Vučić'), 'aleksandar vucic');
    assert.equal(normalize('ЂОРЂЕ Џаковић, Љиљана'), 'djordje dzakovic ljiljana');
  });
});

describe('lineMatchesName', () => {
  it('matches clean and noisy OCR of the name', () => {
    assert.ok(lineMatchesName('Александар Вучић', TARGET[0]!));
    assert.ok(lineMatchesName('__Александар Вучић, | а', TARGET[0]!)); // real OCR output
    assert.ok(lineMatchesName('__Александар Вучи ___ а', TARGET[0]!)); // real OCR output, last letter lost
    assert.ok(lineMatchesName('АлександарВучић', TARGET[0]!)); // words glued together
    assert.ok(lineMatchesName('ALEKSANDAR VUČIĆ', TARGET[0]!));
    // Wide-shot readings from the replay: first name partly lost, surname intact.
    assert.ok(lineMatchesName('А екса · р Вучић »“\' =“', TARGET[0]!));
    assert.ok(lineMatchesName('ЦМ екса Вучић то', TARGET[0]!));
  });
  it('does not accept pieces alone or a matching first name with another surname', () => {
    assert.ok(!lineMatchesName('екса Вучић', 'Вучић Александар Петровић'));
    assert.ok(!lineMatchesName('Ана Вучић', TARGET[0]!));
    assert.ok(!lineMatchesName('Александра Вуковић', TARGET[0]!));
    assert.ok(!lineMatchesName('Александар Ђурић', TARGET[0]!));
    assert.ok(!lineMatchesName('екса уци', TARGET[0]!));
  });
  it('does not match other people', () => {
    assert.ok(!lineMatchesName('Ана Брнабић', TARGET[0]!));
    assert.ok(!lineMatchesName('Александар Јовановић', TARGET[0]!));
    assert.ok(!lineMatchesName('Милош Вучевић', TARGET[0]!));
    assert.ok(!lineMatchesName('Vuk Vučković', TARGET[0]!));
  });
});

describe('pickSpeakerLine', () => {
  it('takes the line right above the parliamentary group line', () => {
    const picked = pickSpeakerLine([line('– Александар Вучић - Србија побеђује', 85), line('Ана Брнабић', 40)]);
    assert.equal(picked?.text, 'Ана Брнабић');
  });
  it('skips background noise above the caption', () => {
    // Small caption at the bottom of the tall crop, with chamber noise read above it.
    const picked = pickSpeakerLine([
      line('Ммм Шшш', 5, 40),
      line('Миленко Јованов', 110),
      line('Александар Вучић - Србија побеђује', 152),
    ]);
    assert.equal(picked?.text, 'Миленко Јованов');
  });
  it('treats a dash-less line with too many words as the group line', () => {
    assert.equal(pickSpeakerLine([line('Александар Вучић Србија побеђује', 85)]), null);
  });
  it('ignores a line too far above the group line', () => {
    assert.equal(pickSpeakerLine([line('Ана Брнабић', 0), line('Александар Вучић - Србија побеђује', 120)]), null);
  });
  it('uses the top line when there is no group line', () => {
    assert.equal(pickSpeakerLine([line('Ана Брнабић', 60), line('Председник Народне скупштине', 104)])?.text, 'Ана Брнабић');
  });
});

describe('classify', () => {
  it('reports the target from the real two-line caption', () => {
    const lines = [line('__Александар Вучић, | а', 18, 63), line('– Александар Вучић - Србија побеђује“ #Ћ А', 82, 63)];
    assert.deepEqual(classify(lines, TARGET, 35), { kind: 'target', name: TARGET[0], line: 'Александар Вучић' });
  });
  it('does not mute a deputy whose group is named after the target', () => {
    const lines = [line('Ана Брнабић', 18), line('Александар Вучић - Србија побеђује', 82)];
    assert.deepEqual(classify(lines, TARGET, 35), { kind: 'other', line: 'Ана Брнабић' });
  });
  it('reads nothing when only the group line was recognised', () => {
    assert.deepEqual(classify([line('Александар Вучић - Србија побеђује', 82)], TARGET, 35), { kind: 'none' });
  });
  it('needs confidence before calling something another speaker', () => {
    assert.deepEqual(classify([line('Аракоашир Учи Вав', 18, 28)], TARGET, 35), { kind: 'none' });
  });
  it('accepts a low-confidence line that still spells the target', () => {
    assert.equal(classify([line('Александар Вучи', 18, 30)], TARGET, 35).kind, 'target');
  });
  // Readings logged from the 17 Nov 2026 replay in a real browser.
  it('handles real replay readings', () => {
    const replay = (top: string, bottom: string, conf = 50) => [line(top, 18, conf), line(bottom, 82, conf)];
    const k = (l: OcrLine[]) => classify(l, TARGET, 35).kind;
    assert.equal(k(replay('Миленко Јованов —', 'Александар ВучиЋ- УСрбија побеђује', 54)), 'other');
    assert.equal(k(replay('Миленко Јованбв. “У __', 'Александар ВучтЋ УСрбија побеђује.', 41)), 'other');
    assert.equal(k(replay('у. ипенкађованов', 'ФЏДдександар Ву Србија побеђује', 50)), 'none');
    assert.equal(k(replay('Александар Вучић :.', 'Александар Вучић обубија побеђује', 92)), 'target');
    assert.equal(k(replay('"Халексан р Вучић “> 47 =“ ние', 'жрксан о Вужј у Србија побеђује и', 38)), 'target');
    assert.equal(k(replay('"Фалекса дар Вучић % =', 'фудександар Ву у Србија побеђује |')), 'target');
    // Wide shot: both caption lines merged into one; the group-line dash keeps it from counting.
    assert.equal(k([line('__Алекбиндарвучнијрдајр Вучић - Сромја п', 18, 57)]), 'none');
  });
  it('reads both caption sizes in the 80–100 % crop', () => {
    // Large caption (4:01:12 in the replay): lines high in the crop.
    assert.equal(classify([line('Александар Вучић', 20), line('Александар Вучић - Србија побеђује', 64)], TARGET, 35).kind, 'target');
    // Small caption (7:22:40): lines low in the crop, Vučić only in the group line.
    assert.equal(classify([line('Миленко Јованов', 110), line('Александар Вучић - Србија побеђује', 152)], TARGET, 35).kind, 'other');
  });
  it('joins a caption line that OCR split into pieces (wide shot at 7:23:11)', () => {
    const lines = [
      line('У ексанћр Вучић', 110, 51, 40),
      line('ко', 112, 25, 700),
      line(',ександар Ву ~', 152, 62, 30),
      line('у', 154, 71, 400),
      line('. у Србија побеђује', 151, 71, 560),
    ];
    assert.equal(classify(lines, TARGET, 35).kind, 'target');
  });
  it('does not take a dash-less group line for the name when the name line was missed', () => {
    assert.equal(classify([line('Александар Вучић Србија', 152)], TARGET, 35).kind, 'none');
    assert.equal(classify([line('Александар Вучић ние', 110)], TARGET, 35).kind, 'target'); // short noise is fine
  });
  it('does not let a tall dash glue the name and group lines together', () => {
    const lines = [
      line('Александар Вучић ;', 110, 68, 40),
      { text: '—', confidence: 53, x0: 900, y0: 105, x1: 930, y1: 195 },
      line('Александар Вучић Србија побеђује“', 152, 51, 30),
    ];
    assert.equal(classify(lines, TARGET, 35).kind, 'target');
  });
  it('never counts a garbled reading of the target as another speaker', () => {
    assert.equal(classify([line('Хиоса ћр ву Вучић', 60, 63)], TARGET, 35).kind, 'none'); // 7:23:12
    assert.equal(classify([line('Милош Вучевић', 60, 80)], TARGET, 35).kind, 'other'); // similar surname is fine
  });
  // 1080p readings from the offline bench (17 Nov replay).
  it('accepts a long first name with several OCR errors next to a clean surname', () => {
    assert.ok(lineMatchesName('АпењСандар Вучић', TARGET[0]!)); // 4:01:12, large caption
    assert.ok(lineMatchesName('м аксанћр Вучић ид', TARGET[0]!)); // 7:23:10, wide shot
    assert.ok(!lineMatchesName('Александар Вулин', TARGET[0]!));
    assert.ok(!lineMatchesName('Андрија Вучић', TARGET[0]!));
  });
  it('finds a dash-less 3-word group line and skips junk lines', () => {
    const lines = [
      line('о ЖАО г,', 10, 0, 20),
      line('м ексанр Вучић “и', 100, 56, 40),
      line('« ександар Ву ‘“ ..уСрбија побеђује', 150, 59, 30),
    ];
    assert.equal(classify(lines, TARGET, 35).kind, 'target');
  });
  it('skips a junk line between the name and the group line', () => {
    const lines = [
      { text: 'алексанћр Вучић к“', confidence: 28, x0: 40, y0: 55, x1: 500, y1: 138 },
      { text: 'у РУЧа ~ о :', confidence: 5, x0: 300, y0: 56, x1: 600, y1: 104 },
      line(',ександар Ву ~ . у Србија побеђује', 130, 70, 30),
    ];
    assert.equal(classify(lines, TARGET, 35).kind, 'target');
  });
  it('does not count lower-case noise as another speaker', () => {
    assert.equal(classify([line('ииии тттт сссс', 30, 70)], TARGET, 35).kind, 'none');
  });
});

describe('groups', () => {
  const GROUP = ['Александар Вучић - Србија побеђује'];
  const SNS = 'Александар Вучић - Србија побеђује';
  it('mutes every deputy of a listed group, whatever the name line says', () => {
    const lines = [line('Миленко Јованов', 110), line(SNS, 152)];
    assert.deepEqual(classify(lines, [], 35, GROUP), { kind: 'target', name: GROUP[0], line: 'Миленко Јованов' });
    assert.equal(classify([line('Ана Брнабић', 18), line(SNS, 82)], [], 35, GROUP).kind, 'target');
  });
  it('mutes when only the group line was read', () => {
    assert.deepEqual(classify([line(SNS, 82)], [], 35, GROUP), { kind: 'target', name: GROUP[0], line: GROUP[0] });
  });
  it('matches the group in Latin and in real noisy OCR readings', () => {
    assert.ok(lineMatchesGroup('Aleksandar Vučić - Srbija pobeđuje', GROUP[0]!));
    assert.ok(lineMatchesGroup('Александар ВучиЋ- УСрбија побеђује', GROUP[0]!));
    assert.ok(lineMatchesGroup('Александар ВучтЋ УСрбија побеђује.', GROUP[0]!));
    assert.ok(lineMatchesGroup('ФЏДдександар Ву Србија побеђује', GROUP[0]!));
    assert.ok(lineMatchesGroup(',ександар Ву ~ . у Србија побеђује', GROUP[0]!));
  });
  it('does not take the leader’s name line or another group for the group', () => {
    assert.ok(!lineMatchesGroup('Александар Вучић', GROUP[0]!));
    assert.ok(!lineMatchesGroup('Србија центар - СРЦЕ', GROUP[0]!));
    assert.ok(!lineMatchesGroup('Мирослав Алексић - Народни покрет Србије', GROUP[0]!));
    assert.ok(!lineMatchesGroup('Ивица Дачић - Социјалистичка партија Србије', GROUP[0]!));
  });
  it('counts a speaker from another group as someone else', () => {
    const lines = [line('Мирослав Алексић', 110), line('Мирослав Алексић - Народни покрет Србије', 152)];
    assert.deepEqual(classify(lines, [], 35, GROUP), { kind: 'other', line: 'Мирослав Алексић' });
  });
  it('accepts just the party part of the group name', () => {
    assert.equal(classify([line('Миленко Јованов', 110), line(SNS, 152)], [], 35, ['Србија побеђује']).kind, 'target');
  });
});

describe('similarLines', () => {
  it('treats OCR noise as the same caption and a new name as different', () => {
    assert.ok(similarLines('Александар Вучић', 'Александар Вучи'));
    assert.ok(!similarLines('Александар Вучић', 'Ана Брнабић'));
  });
});

describe('channelKey', () => {
  it('accepts handles, IDs and URLs', () => {
    assert.equal(channelKey('@ParlamentSrbija'), '@parlamentsrbija');
    assert.equal(channelKey('https://www.youtube.com/@ParlamentSrbija/streams'), '@parlamentsrbija');
    assert.equal(channelKey('/channel/UCghngrfQwzJ4aaPZ-UgNIZQ'), 'ucghngrfqwzj4aapz-ugnizq');
  });
});
