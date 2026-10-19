import React from 'react';
import { createRoot } from 'react-dom/client';
import { emptyProfile, normalizeProfile, profileStorage, type CustomLink, type Profile } from '../../src/profile';
import '../../src/styles.css';

type TabName = 'fill' | 'links';
type QuickLink = { label: string; url: string; kind: string };
const quickKeys: { key: keyof Profile; label: string; kind: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', kind: 'in' }, { key: 'github', label: 'GitHub', kind: '⌘' },
  { key: 'leetcode', label: 'LeetCode', kind: 'L' }, { key: 'codeforces', label: 'Codeforces', kind: 'CF' },
  { key: 'portfolio', label: 'Portfolio', kind: '↗' },
];
function openLink(url: string) {
  const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try { new URL(withProtocol); chrome.tabs.create({ url: withProtocol }); } catch { /* Invalid user-entered links are ignored. */ }
}
function openSettingsPage() {
  void chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
}

function Popup() {
  const [profile, setProfile] = React.useState<Profile>(emptyProfile);
  const [tab, setTab] = React.useState<TabName>('fill');
  const [status, setStatus] = React.useState('');
  const [copied, setCopied] = React.useState('');
  React.useEffect(() => { profileStorage.getValue().then((saved) => setProfile(normalizeProfile(saved))); }, []);

  async function copyLink(url: string, id: string) {
    let success = false;
    try {
      await navigator.clipboard.writeText(url);
      success = true;
    } catch {
      const field = document.createElement('textarea');
      field.value = url;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      success = document.execCommand('copy');
      field.remove();
    }
    setCopied(success ? id : '');
    setStatus(success ? 'Link copied to clipboard.' : 'Could not copy this link.');
    window.setTimeout(() => setCopied(''), 1800);
  }

  async function fillCurrentPage() {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab?.id) return setStatus('Open a webpage with a form first.');
    try {
      const result = await chrome.tabs.sendMessage(activeTab.id, { type: 'AUTODEX_FILL', profile }) as { count?: number };
      const count = result?.count ?? 0;
      setStatus(count ? `Filled ${count} ${count === 1 ? 'field' : 'fields'}. Review your answers before submitting.` : 'No empty fields matched your saved details.');
    } catch {
      setStatus('This page cannot be filled. Refresh the page and try again.');
    }
  }
  const profileLinks: QuickLink[] = quickKeys.flatMap(({ key, label, kind }) => {
    const url = profile[key];
    return typeof url === 'string' && url.trim() ? [{ label, url, kind }] : [];
  });
  const extraLinks = profile.customLinks.filter((link: CustomLink) => link.label.trim() && link.url.trim());
  const links = [
    ...profileLinks,
    ...extraLinks.map((link) => ({ label: link.label, url: link.url, kind: /resume|cv|document/i.test(link.label) ? 'PDF' : '↗' })),
  ];
  const ready = Object.entries(profile).some(([key, value]) => key !== 'customLinks' && typeof value === 'string' && value.trim());

  return <main className="popup">
    <header className="popup-heading"><div className="brand"><div className="brand-mark"><img src="/icons/autodex.svg" alt="" /></div><div><strong>AutoDex</strong><span>Ready for your next form</span></div></div><button className="settings-button" aria-label="Edit profile" title="Edit profile" onClick={openSettingsPage}>⚙</button></header>
    <nav className="popup-tabs" role="tablist" aria-label="AutoDex tools">
      <button role="tab" aria-selected={tab === 'fill'} className={tab === 'fill' ? 'active' : ''} onClick={() => { setTab('fill'); setStatus(''); }}>✦ <span>Fill form</span></button>
      <button role="tab" aria-selected={tab === 'links'} className={tab === 'links' ? 'active' : ''} onClick={() => { setTab('links'); setStatus(''); }}>↗ <span>Important links</span>{links.length > 0 && <i>{links.length}</i>}</button>
    </nav>
    {tab === 'fill' ? <section className="popup-panel" role="tabpanel">
      <div className="popup-intro"><span className="eyebrow">CURRENT PAGE</span><h1>{ready ? (profile.fullName || 'Your profile is ready') : 'Set up your profile'}</h1><p>{ready ? 'Fill matching empty fields, then review your answers.' : 'Add your details once to make form filling quicker.'}</p></div>
      <button className="primary-button popup-action" onClick={fillCurrentPage} disabled={!ready}><span>✦</span> Fill this page</button>
      {status && <p className="status" role="status">{status}</p>}
      <button className="edit-profile-link" onClick={openSettingsPage}>{ready ? 'Update your details' : 'Create your profile'} <span>↗</span></button>
      <div className="popup-note"><span>◈</span> Details stay on this device. Nothing submits automatically.</div>
    </section> : <section className="popup-panel links-panel" role="tabpanel">
      <div className="links-title"><div><span className="eyebrow">QUICK ACCESS</span><h1>Important links</h1></div><button className="small-add" onClick={openSettingsPage} aria-label="Add or edit links" title="Add or edit links">＋</button></div>
      {links.length ? <div className="quick-links">{links.map((link, index) => { const id = `${link.label}-${index}`; return <div className="quick-link" key={id}><button className="link-open" onClick={() => openLink(link.url)} aria-label={`Open ${link.label}`}><span className="link-avatar">{link.kind}</span><span className="quick-link-name"><strong>{link.label}</strong><small>{link.url.replace(/^https?:\/\//, '')}</small></span><span className="link-arrow">↗</span></button><button className={`copy-link ${copied === id ? 'copied' : ''}`} onClick={() => void copyLink(link.url, id)} aria-label={`Copy ${link.label} link`} title={copied === id ? 'Copied' : 'Copy link'}>{copied === id ? 'Copied ✓' : 'Copy'}</button></div>; })}</div> : <div className="empty-links"><span className="empty-links-icon">↗</span><h2>Your links live here</h2><p>Add GitHub, LinkedIn, portfolio, project, or document URLs to open them from this menu.</p><button className="primary-button" onClick={openSettingsPage}>Add your first link</button></div>}
      {links.length > 0 && <button className="edit-profile-link links-edit" onClick={openSettingsPage}>Manage links <span>↗</span></button>}
      {status && <p className="status copy-status" role="status">{status}</p>}
      <div className="popup-note"><span>◈</span> Links open in a new tab.</div>
    </section>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<Popup />);
