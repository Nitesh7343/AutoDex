import React from 'react';
import { createRoot } from 'react-dom/client';
import { emptyProfile, normalizeProfile, profileStorage, type CustomLink, type Profile } from '../../src/profile';
import '../../src/styles.css';

type TextKey = Exclude<keyof Profile, 'customLinks'>;
type Field = { key: TextKey; label: string; placeholder?: string; multiline?: boolean; type?: string };
type Section = { title: string; description: string; fields: Field[] };
const profileTextKeys = Object.keys(emptyProfile).filter((key) => key !== 'customLinks') as TextKey[];

function parseProfileJson(json: string): Profile {
  const parsed: unknown = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('The file must contain a JSON object.');
  const envelope = parsed as Record<string, unknown>;
  if (envelope.format === 'autodex-profile' && envelope.version !== 1) throw new Error('This AutoDex backup version is not supported.');
  const source = envelope.format === 'autodex-profile' ? envelope.profile : parsed;
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('The file does not contain an AutoDex profile.');
  const data = source as Record<string, unknown>;
  const knownKeys = profileTextKeys.filter((key) => Object.prototype.hasOwnProperty.call(data, key));
  const hasLinks = Object.prototype.hasOwnProperty.call(data, 'customLinks');
  if (!knownKeys.length && !hasLinks) throw new Error('No AutoDex profile fields were found in this file.');
  for (const key of knownKeys) if (typeof data[key] !== 'string') throw new Error(`The "${key}" field must be text.`);
  if (hasLinks && !Array.isArray(data.customLinks)) throw new Error('The customLinks field must be a list.');
  const customLinks: CustomLink[] = (Array.isArray(data.customLinks) ? data.customLinks : []).map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`Link ${index + 1} is invalid.`);
    const link = item as Record<string, unknown>;
    if (typeof link.label !== 'string' || typeof link.url !== 'string') throw new Error(`Link ${index + 1} needs a name and URL.`);
    return { id: typeof link.id === 'string' && link.id ? link.id : crypto.randomUUID(), label: link.label, url: link.url };
  });
  return { ...emptyProfile, ...Object.fromEntries(knownKeys.map((key) => [key, data[key]])), customLinks } as Profile;
}

const sections: Section[] = [
  { title: 'Personal details', description: 'The basics most application forms ask for.', fields: [
    { key: 'fullName', label: 'Full name', placeholder: 'As it appears on your documents' },
    { key: 'firstName', label: 'First name' }, { key: 'lastName', label: 'Last name' },
    { key: 'email', label: 'Email', type: 'email' }, { key: 'phone', label: 'Phone number', type: 'tel' },
  ] },
  { title: 'Location', description: 'Your current mailing address.', fields: [
    { key: 'address', label: 'Street address' }, { key: 'city', label: 'City' },
    { key: 'state', label: 'State / region' }, { key: 'postalCode', label: 'Postal code' }, { key: 'country', label: 'Country' },
  ] },
  { title: 'Education', description: 'Structured details make college and education questions easier to match.', fields: [
    { key: 'college', label: 'College / university', placeholder: 'Institution name' },
    { key: 'degree', label: 'Degree', placeholder: 'e.g. B.Tech' },
    { key: 'course', label: 'Course / program', placeholder: 'e.g. Computer Science and Engineering' },
    { key: 'branch', label: 'Branch / specialization' },
    { key: 'rollNumber', label: 'Roll number / student ID' },
    { key: 'yearOfStudy', label: 'Current year of study', placeholder: 'e.g. 3rd year' },
    { key: 'graduationYear', label: 'Expected graduation year', placeholder: 'e.g. 2027' },
    { key: 'education', label: 'Additional education details', placeholder: 'Other courses, dates, or details', multiline: true },
  ] },
  { title: 'Work profile', description: 'Details that help with job application forms.', fields: [
    { key: 'headline', label: 'Professional headline', placeholder: 'e.g. Computer Science student' },
    { key: 'skills', label: 'Skills', placeholder: 'Separate skills with commas', multiline: true },
    { key: 'summary', label: 'Professional summary', multiline: true },
    { key: 'experience', label: 'Experience', placeholder: 'Role, company, dates, highlights', multiline: true },
  ] },
  { title: 'Profile links', description: 'Your main professional and coding profiles.', fields: [
    { key: 'linkedin', label: 'LinkedIn', type: 'url' }, { key: 'github', label: 'GitHub', type: 'url' },
    { key: 'leetcode', label: 'LeetCode', type: 'url' }, { key: 'codeforces', label: 'Codeforces', type: 'url' },
    { key: 'portfolio', label: 'Portfolio / project', type: 'url' },
  ] },
];

function Options() {
  const [profile, setProfile] = React.useState<Profile>(emptyProfile);
  const [loaded, setLoaded] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [backupStatus, setBackupStatus] = React.useState('');
  const importInput = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { profileStorage.getValue().then((value) => { setProfile(normalizeProfile(value)); setLoaded(true); }); }, []);
  function update(key: TextKey, value: string) { setProfile((current) => ({ ...current, [key]: value })); setSaved(false); }
  function updateLink(id: string, key: 'label' | 'url', value: string) {
    setProfile((current) => ({ ...current, customLinks: current.customLinks.map((link) => link.id === id ? { ...link, [key]: value } : link) }));
    setSaved(false);
  }
  function addLink() {
    const link: CustomLink = { id: crypto.randomUUID(), label: '', url: '' };
    setProfile((current) => ({ ...current, customLinks: [...current.customLinks, link] }));
    setSaved(false);
  }
  function removeLink(id: string) {
    setProfile((current) => ({ ...current, customLinks: current.customLinks.filter((link) => link.id !== id) }));
    setSaved(false);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const cleaned = { ...profile, customLinks: profile.customLinks.filter((link) => link.label.trim() && link.url.trim()) };
    setProfile(cleaned);
    await profileStorage.setValue(cleaned);
    setSaved(true);
  }
  function exportProfile() {
    const payload = { format: 'autodex-profile', version: 1, exportedAt: new Date().toISOString(), profile };
    const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = 'autodex-profile.json';
    anchor.click();
    URL.revokeObjectURL(blobUrl);
    setBackupStatus('Profile exported as autodex-profile.json.');
  }
  async function importProfile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    try {
      const imported = parseProfileJson(await file.text());
      if (!window.confirm('Import this backup and replace the profile currently saved in AutoDex?')) return;
      await profileStorage.setValue(imported);
      setProfile(imported);
      setSaved(true);
      setBackupStatus('Profile imported and saved on this device.');
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : 'Could not import this JSON file.');
    }
  }
  if (!loaded) return <div className="loading">Loading your profile…</div>;
  return <div className="settings-shell">
    <aside className="settings-aside"><a className="brand" href="#top"><div className="brand-mark"><img src="/icons/autodex.svg" alt="" /></div><div><strong>AutoDex</strong><span>FORM FILLER</span></div></a><div className="aside-note"><span className="aside-icon">✦</span><p>Fill the busywork. Keep your focus on the opportunity.</p></div><div className="aside-privacy">◈ Stored only in this browser</div></aside>
    <main className="settings-main" id="top"><div className="page-heading"><div><span className="eyebrow">YOUR SPACE</span><h1>Your profile</h1><p>Details and links ready for your next application.</p></div><span className="local-badge"><i /> Saved locally</span></div>
      <form onSubmit={save}>
        {sections.map((section, index) => <section className="form-section" key={section.title}><div className="section-heading"><span className="section-number">{String(index + 1).padStart(2, '0')}</span><div><h2>{section.title}</h2><p>{section.description}</p></div></div><div className="field-grid">{section.fields.map((field) => <label className={`field ${field.multiline ? 'wide' : ''}`} key={field.key}><span>{field.label}</span>{field.multiline ? <textarea value={profile[field.key]} placeholder={field.placeholder} rows={3} onChange={(event) => update(field.key, event.target.value)} /> : <input type={field.type ?? 'text'} autoComplete="off" value={profile[field.key]} placeholder={field.placeholder} onChange={(event) => update(field.key, event.target.value)} />}</label>)}</div></section>)}
        <section className="form-section"><div className="section-heading"><span className="section-number">06</span><div><h2>Important links</h2><p>Add profile, project, or document links. You can keep adding as many as you need.</p></div></div>
          {profile.customLinks.length > 0 && <div className="custom-links-editor">{profile.customLinks.map((link, index) => <div className="custom-link-row" key={link.id}><div className="custom-link-index">{String(index + 1).padStart(2, '0')}</div><label className="field"><span>Link name</span><input value={link.label} placeholder="e.g. Resume PDF" onChange={(event) => updateLink(link.id, 'label', event.target.value)} /></label><label className="field"><span>URL</span><input type="url" value={link.url} placeholder="https://…" onChange={(event) => updateLink(link.id, 'url', event.target.value)} /></label><button className="remove-link" type="button" aria-label={`Remove ${link.label || 'link'}`} onClick={() => removeLink(link.id)}>×</button></div>)}</div>}
          <button type="button" className="add-link-button" onClick={addLink}><span>＋</span> Add a profile or document link</button>
        </section>
        <section className="form-section backup-section"><div className="section-heading"><span className="section-number">07</span><div><h2>Import or export profile</h2><p>Back up your details to a JSON file or restore them on another browser.</p></div></div>
          <div className="backup-actions"><button type="button" className="secondary-button" onClick={exportProfile}>↓ Export JSON</button><button type="button" className="secondary-button" onClick={() => importInput.current?.click()}>↑ Import JSON</button><input ref={importInput} className="visually-hidden" type="file" accept=".json,application/json" onChange={importProfile} /></div>
          <p className="backup-hint">Your backup includes personal and education details. Keep the JSON file somewhere private.</p>
          {backupStatus && <p className="backup-status" role="status">{backupStatus}</p>}
        </section>
        <div className="save-row"><span className="save-hint">Your details stay on this device.</span><button className="primary-button save-button" type="submit">{saved ? '✓ Saved' : 'Save profile'}</button></div>
      </form>
    </main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<Options />);
