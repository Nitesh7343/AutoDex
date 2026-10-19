import type { Profile } from '../src/profile';

type Fillable = HTMLInputElement | HTMLTextAreaElement | HTMLElement;
const textControls = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea, [contenteditable="true"], [role="textbox"][contenteditable="true"]';
const ignoredTypes = new Set(['password', 'file', 'checkbox', 'radio', 'submit', 'button', 'reset', 'hidden']);
const rules: [keyof Profile, RegExp, RegExp?][] = [
  ['email', /e ?mail/, /email/], ['phone', /phone|mobile|telephone|tel/, /tel/],
  ['firstName', /first ?name|given ?name/, /given-name/], ['lastName', /last ?name|family ?name|surname/, /family-name/],
  ['college', /college|university|institution|school name/, undefined],
  ['degree', /degree|qualification/, undefined], ['course', /course|program|programme/, undefined],
  ['branch', /branch|speciali[sz]ation|major|discipline/, undefined],
  ['rollNumber', /roll ?number|roll ?no|student ?id|registration ?number|enrol(?:l)?ment ?number|matriculation/, undefined],
  ['graduationYear', /graduation year|year of graduation|expected (?:year|date) of (?:graduation|completion)|passing year|year of passing/, undefined],
  ['yearOfStudy', /current year|year of study|current semester|which year|year/, undefined],
  ['fullName', /full ?name|your name|^name$|^name /, /name/],
  ['address', /street|address ?line|mailing address/, /street-address|address-line/],
  ['city', /city|town/, /address-level2/], ['state', /state|province|region/, /address-level1/],
  ['postalCode', /zip|postal ?code/, /postal-code/], ['country', /country/, /country-name|country/],
  ['linkedin', /linkedin/, undefined], ['github', /github/, undefined], ['leetcode', /leetcode/, undefined],
  ['codeforces', /codeforces/, undefined], ['portfolio', /portfolio|personal ?website|website|project ?url|resume|résumé|cv/, /url/],
  ['headline', /headline|professional title|job title/, undefined], ['skills', /skills|technologies/, undefined],
  ['experience', /experience|employment|work history/, undefined],
  ['education', /education|academic details|educational background/, undefined],
  ['summary', /summary|about you|additional information/, undefined],
];

function questionContext(element: Fillable) {
  const labelledBy = (element.getAttribute('aria-labelledby') ?? '').split(/\s+/)
    .map((id) => (document.getElementById(id) as HTMLElement | null)?.innerText ?? '').join(' ');
  const label = 'labels' in element && element.labels
    ? Array.from(element.labels).map((item) => item.innerText).join(' ')
    : '';
  // Google Forms groups each prompt and its answer control in a list item.
  const formQuestion = (element.closest('[role="listitem"]') as HTMLElement | null)?.innerText ?? '';
  const nearbyLabel = element.parentElement?.innerText ?? '';
  return [formQuestion, labelledBy, label, element.getAttribute('aria-label'), element.getAttribute('placeholder'),
    'name' in element ? element.name : '', element.id, element.getAttribute('autocomplete'), nearbyLabel]
    .filter(Boolean).join(' ').toLowerCase().replace(/[_-]/g, ' ');
}

function identify(element: Fillable, profile: Profile): keyof Profile | undefined {
  if (element instanceof HTMLInputElement && (ignoredTypes.has(element.type.toLowerCase()) || element.disabled || element.readOnly)) return;
  if (element instanceof HTMLTextAreaElement && (element.disabled || element.readOnly)) return;
  if (element instanceof HTMLElement && element.getAttribute('contenteditable') === 'true' && element.getAttribute('aria-disabled') === 'true') return;
  const context = questionContext(element);
  const auto = element.getAttribute('autocomplete')?.toLowerCase() ?? '';
  for (const [key, pattern, autoPattern] of rules) {
    if ((pattern.test(context) || (autoPattern && autoPattern.test(auto))) && typeof profile[key] === 'string' && profile[key].trim()) return key;
  }
  return undefined;
}

function setTextValue(element: Fillable, value: string) {
  if (element instanceof HTMLInputElement) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(element, value);
  } else if (element instanceof HTMLTextAreaElement) {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    setter?.call(element, value);
  } else {
    element.focus();
    element.textContent = value;
  }
  element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function normalizeChoice(value: string) { return value.trim().toLocaleLowerCase().replace(/\s+/g, ' '); }

async function fillChoice(element: HTMLSelectElement | HTMLElement, value: string) {
  if (element instanceof HTMLSelectElement) {
    if (element.disabled || element.value) return false;
    const option = Array.from(element.options).find((item) => normalizeChoice(item.textContent ?? '') === normalizeChoice(value));
    if (!option) return false;
    element.value = option.value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  if (element.getAttribute('aria-disabled') === 'true' || element.getAttribute('aria-expanded') === 'true') return false;
  element.click();
  await new Promise((resolve) => setTimeout(resolve, 150));
  const options = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
  const match = options.find((option) => normalizeChoice(option.innerText) === normalizeChoice(value));
  if (!match) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return false; }
  match.click();
  return true;
}

function fillExactOptions(profile: Profile) {
  let count = 0;
  const options = Array.from(document.querySelectorAll<HTMLElement>('[role="radio"], [role="checkbox"]'));
  for (const option of options) {
    const key = identify(option, profile);
    if (!key || option.getAttribute('aria-disabled') === 'true') continue;
    const isCheckbox = option.getAttribute('role') === 'checkbox';
    const values = key === 'skills' ? String(profile[key]).split(/[,;\n]/).map((item) => normalizeChoice(item)).filter(Boolean) : [normalizeChoice(String(profile[key]))];
    const optionText = normalizeChoice(option.getAttribute('aria-label') || option.innerText);
    if (!values.includes(optionText)) continue;
    if (option.getAttribute('aria-checked') === 'true') continue;
    if (!isCheckbox && option.closest('[role="radiogroup"]')?.querySelector('[role="radio"][aria-checked="true"]')) continue;
    option.click();
    count += 1;
    if (!isCheckbox) break;
  }
  return count;
}

async function fill(profile: Profile) {
  let count = 0;
  const seen = new Set<Element>();
  document.querySelectorAll<Fillable>(textControls).forEach((element) => {
    if (seen.has(element)) return;
    seen.add(element);
    const key = identify(element, profile);
    if (!key || ('value' in element && String(element.value).trim()) || (element.isContentEditable && element.textContent?.trim())) return;
    setTextValue(element, String(profile[key]));
    count += 1;
  });

  count += fillExactOptions(profile);
  const choiceControls = Array.from(document.querySelectorAll<HTMLSelectElement | HTMLElement>('select, [role="combobox"]'));
  for (const element of choiceControls) {
    const key = identify(element, profile);
    if (!key) continue;
    if (await fillChoice(element, String(profile[key]))) count += 1;
  }
  return count;
}

export default defineContentScript({ matches: ['<all_urls>'], main() {
  browser.runtime.onMessage.addListener((rawMessage: unknown, _sender, sendResponse) => {
    const message = rawMessage as { type?: string; profile?: Profile };
    if (message.type !== 'AUTODEX_FILL' || !message.profile) { sendResponse({ count: 0 }); return true; }
    void fill(message.profile).then((count) => sendResponse({ count }));
    return true;
  });
} });
