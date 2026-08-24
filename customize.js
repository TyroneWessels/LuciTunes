const configKey = 'music-blog-template-config';
const supabaseClient = window.supabase?.createClient('https://wodiuznopzrsobqgbonw.supabase.co', 'sb_publishable_XKLOB2aJjn0vS8iUAOZhHA_JVU02_sn');
const fields = [
  ['YOUR BLOG NAME', 'Blog name', 'YOUR BLOG NAME'],
  ['YOUR SHORT DESCRIPTION', 'Browser title', 'YOUR SHORT DESCRIPTION'],
  ['YOUR BLOG DESCRIPTION', 'Site description', 'YOUR BLOG DESCRIPTION'],
  ['YOUR YEAR', 'Footer year', 'YOUR YEAR'],
  ['YOUR JOURNAL TITLE', 'Journal browser title', 'YOUR JOURNAL TITLE'],
  ['YOUR ABOUT TITLE', 'About browser title', 'YOUR ABOUT TITLE'],
  ['YOUR POST TITLE', 'Post browser title', 'YOUR POST TITLE'],
  ['YOUR JOURNAL LINK', 'Journal navigation text', 'YOUR JOURNAL LINK'],
  ['YOUR ABOUT LINK', 'About navigation text', 'YOUR ABOUT LINK'],
  ['YOUR LOGIN LINK', 'Login navigation text', 'YOUR LOGIN LINK'],
  ['YOUR CATEGORY', 'Home category', 'YOUR CATEGORY'],
  ['EST. YEAR', 'Established text', 'EST. YEAR'],
  ['YOUR MAIN', 'Hero headline, line 1', 'YOUR MAIN'],
  ['HEADLINE HERE.', 'Hero headline, line 2', 'HEADLINE HERE.'],
  ['YOUR INTRODUCTION. Tell visitors what this blog is about and why they should read it.', 'Hero introduction', 'Tell visitors what this blog is about...'],
  ['YOUR CALL TO ACTION', 'Hero button text', 'YOUR CALL TO ACTION'],
  ['YOUR LATEST POST', 'Latest post label', 'YOUR LATEST POST'],
  ['YOUR JOURNAL LABEL', 'Journal page label', 'YOUR JOURNAL LABEL'],
  ['YOUR JOURNAL', 'Journal headline', 'YOUR JOURNAL'],
  ['YOUR JOURNAL INTRO. Use this page to collect your music notes, reviews, and discoveries.', 'Journal introduction', 'Describe your journal...'],
  ['YOUR SECTION LABEL', 'Journal section label', 'YOUR SECTION LABEL'],
  ['YOUR POSTS HEADING', 'Posts heading', 'YOUR POSTS HEADING'],
  ['YOUR FILTER LABEL', 'Filter label', 'YOUR FILTER LABEL'],
  ['YOUR EMPTY JOURNAL MESSAGE', 'Empty journal message', 'YOUR EMPTY JOURNAL MESSAGE'],
  ['YOUR ABOUT', 'About headline', 'YOUR ABOUT'],
  ['YOUR ABOUT LABEL', 'About section label', 'YOUR ABOUT LABEL'],
  ['YOUR ABOUT TEXT. Introduce yourself, your taste, and what readers can expect from your posts.', 'About text', 'Introduce yourself and your point of view...'],
  ['YOUR SECOND LABEL', 'About secondary label', 'YOUR SECOND LABEL'],
  ['YOUR STORY', 'About story headline', 'YOUR STORY'],
  ['YOUR SHORT BIO. Share who you are, what you listen to, and what readers will find on this site.', 'About short bio', 'Share who you are...'],
  ['YOUR LONGER BIO. Add your background, your listening habits, your editorial point of view, or anything else you want visitors to know.', 'About longer bio', 'Add your longer bio...'],
  ['YOUR POST LABEL', 'Post detail label', 'YOUR POST LABEL'],
  ['YOUR LOGIN LINK', 'Login link text', 'YOUR LOGIN LINK'],
  ['YOUR LOGIN LABEL', 'Login section label', 'YOUR LOGIN LABEL'],
  ['YOUR LOGIN HEADING.', 'Login heading', 'YOUR LOGIN HEADING.'],
  ['YOUR LOGIN INSTRUCTIONS.', 'Login instructions', 'YOUR LOGIN INSTRUCTIONS.'],
  ['YOUR LOGIN BUTTON', 'Login button text', 'YOUR LOGIN BUTTON'],
  ['YOUR EDITOR LABEL', 'Editor section label', 'YOUR EDITOR LABEL'],
  ['YOUR EDITOR HEADING.', 'Editor heading', 'YOUR EDITOR HEADING.'],
  ['YOUR MODE', 'Editor mode label', 'YOUR MODE'],
  ['YOUR PUBLISH BUTTON', 'Publish button text', 'YOUR PUBLISH BUTTON'],
  ['YOUR FOOTER MESSAGE', 'Footer message', 'YOUR FOOTER MESSAGE'],
  ['YOUR BACK TO TOP LABEL', 'Back-to-top link text', 'YOUR BACK TO TOP LABEL']
];
const visibilityOptions = [
  ['showLatest', 'Show newest-post feature', '.latest-feature'],
  ['showJournal', 'Show journal/reviews section', '.journal-section'],
  ['showAbout', 'Show About section', '.about-section'],
  ['showJournalLink', 'Show Journal navigation link', 'a[href="journal.html"]'],
  ['showAboutLink', 'Show About navigation link', 'a[href="about.html"]']
];
document.body.hidden = true;
const authCheck = supabaseClient ? supabaseClient.auth.getUser() : Promise.resolve({ data: { user: null } });
authCheck.then(({ data: { user } }) => { if (!user) { window.location.replace('index.html'); return; } document.body.hidden = false; buildForm(); });
function buildForm() {
  const saved = JSON.parse(localStorage.getItem(configKey) || '{}');
  const form = document.querySelector('#customizer-form');
  fields.forEach(([placeholder, label, hint], index) => { const wrapper = document.createElement('div'); wrapper.className = 'customizer-field'; const safePlaceholder = placeholder.replaceAll('"', '&quot;'); const shown = saved[`show_${placeholder}`] !== false; wrapper.innerHTML = `<span class="field-number">${String(index + 1).padStart(2, '0')}</span><label for="field-${index}">${label}</label><input id="field-${index}" data-placeholder="${safePlaceholder}" value="${(saved[placeholder] || '').replaceAll('"', '&quot;')}" placeholder="${hint.replaceAll('"', '&quot;')}"><label class="field-visibility"><input type="checkbox" data-field-visibility="${safePlaceholder}" ${shown ? 'checked' : ''}> Show this on the site</label>`; form.appendChild(wrapper); });
  const visibilityHeading = document.createElement('p');
  visibilityHeading.className = 'customizer-subheading';
  visibilityHeading.textContent = 'Show or hide sections';
  form.appendChild(visibilityHeading);
  const visibilityGroup = document.createElement('div');
  visibilityGroup.className = 'visibility-options';
  visibilityOptions.forEach(([key, label]) => { const checked = saved[key] !== false; const wrapper = document.createElement('label'); wrapper.className = 'visibility-option'; wrapper.innerHTML = `<input type="checkbox" data-visibility="${key}" ${checked ? 'checked' : ''}><span>${label}</span>`; visibilityGroup.appendChild(wrapper); });
  form.appendChild(visibilityGroup);
  form.addEventListener('input', saveAndRefresh);
  document.querySelector('#reset-button').addEventListener('click', () => { localStorage.removeItem(configKey); location.reload(); });
  document.querySelector('#download-button').addEventListener('click', downloadPreview);
}
function saveAndRefresh() { const config = {}; document.querySelectorAll('#customizer-form input[data-placeholder]').forEach((input) => { if (input.value.trim()) config[input.dataset.placeholder] = input.value.trim(); }); document.querySelectorAll('#customizer-form input[data-field-visibility]').forEach((input) => { config[`show_${input.dataset.fieldVisibility}`] = input.checked; }); document.querySelectorAll('#customizer-form input[data-visibility]').forEach((input) => { config[input.dataset.visibility] = input.checked; }); localStorage.setItem(configKey, JSON.stringify(config)); document.querySelector('#preview').contentWindow.location.reload(); document.querySelector('#save-status').textContent = 'Saved in this browser'; }
function downloadPreview() { const html = `<!doctype html>${document.querySelector('#preview').contentDocument.documentElement.outerHTML}`; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([html], { type: 'text/html' })); link.download = 'my-music-blog-home.html'; link.click(); URL.revokeObjectURL(link.href); }
function initThemeToggle() {
  const toggle = document.querySelector('#theme-toggle');
  if (!toggle) return;
  const icon = toggle.querySelector('.theme-toggle-icon');
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    if (icon) icon.textContent = theme === 'dark' ? '☀' : '☾';
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  };
  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
  toggle.addEventListener('click', () => {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    applyTheme(nextTheme);
  });
}
initThemeToggle();
