const storageKey = 'needle-note-posts-v2';
const templateStorageKey = 'music-blog-template-config';
const defaultTemplateConfig = {
  'YOUR BLOG NAME': 'LuciTunes',
  'YOUR BLOG DESCRIPTION': 'The site where I show the music I enjoy.',
  'YOUR SHORT DESCRIPTION': 'A personal collection of music worth remembering',
  'YOUR YEAR': '2026',
  'YOUR JOURNAL TITLE': 'The Collection',
  'YOUR ABOUT TITLE': 'About LuciTunes',
  'YOUR POST TITLE': 'Music note',
  'YOUR BLOG NAME home': 'LuciTunes home',
  'YOUR JOURNAL LINK': 'The Collection',
  'YOUR ABOUT LINK': 'About LuciTunes',
  'YOUR LOGIN LINK': 'Login',
  'YOUR LOGIN LABEL': 'Editor access',
  'YOUR LOGIN HEADING.': 'Welcome back.',
  'YOUR LOGIN INSTRUCTIONS.': 'Sign in to write and manage your music notes.',
  'YOUR LOGIN BUTTON': 'Login',
  'YOUR CATEGORY': 'A personal music collection',
  'EST. YEAR': '2026',
  'YOUR MAIN': 'Welcome to LuciTunes',
  'HEADLINE HERE.': 'Music worth remembering',
  'HEADING HERE.': 'A personal listening archive',
  'GOES HERE.': 'A closer listen',
  'YOUR INTRODUCTION. Tell visitors what this blog is about and why they should read it.': 'A personal collection of the music I listen to, love, and recommend.',
  'YOUR CALL TO ACTION': 'View The Collection',
  'YOUR LATEST POST': 'My Latest Post',
  'YOUR JOURNAL LABEL': 'The Collection',
  'YOUR JOURNAL': 'The Collection',
  'YOUR JOURNAL INTRO. Use this page to collect your music notes, reviews, and discoveries.': 'Notes, ratings, and reflections on the music that stays with me.',
  'The Collection INTRO. Use this page to collect your music notes, reviews, and discoveries.': 'Notes, ratings, and reflections on the music that stays with me.',
  'YOUR SECTION LABEL': 'Recently heard',
  'YOUR POSTS HEADING': 'Reviews',
  'YOUR FILTER LABEL': 'Filter by genre',
  'YOUR EMPTY JOURNAL MESSAGE': 'No reviews yet. The first note is waiting to be written.',
  'YOUR ABOUT LABEL': 'About LuciTunes',
  'YOUR ABOUT': 'About LuciTunes',
  'YOUR ABOUT TEXT. Introduce yourself, your taste, and what readers can expect from your posts.': 'A personal space for sharing the music I enjoy and the stories I hear inside it.',
  'YOUR SECOND LABEL': 'The story behind the collection',
  'YOUR STORY': 'Listen closely',
  'YOUR SHORT BIO. Share who you are, what you listen to, and what readers will find on this site.': 'I collect songs, albums, and the feelings they leave behind.',
  'YOUR LONGER BIO. Add your background, your listening habits, your editorial point of view, or anything else you want visitors to know.': 'LuciTunes is a growing archive of personal listening notes, honest ratings, and music I want to return to.',
  'YOUR POST LABEL': 'Listening note',
  'YOUR EDITOR LABEL': 'Your studio',
  'YOUR EDITOR HEADING.': 'Write a note.',
  'YOUR EDITOR EDIT HEADING.': 'Edit your note.',
  'YOUR MODE': 'Editor mode',
  'YOUR PUBLISH BUTTON': 'Publish note',
  'YOUR SAVE BUTTON': 'Save changes',
  'YOUR FOOTER MESSAGE': 'Music for the moments between moments.',
  'YOUR BACK TO TOP LABEL': 'Back to top'
};
const templateConfig = { ...defaultTemplateConfig, ...JSON.parse(localStorage.getItem(templateStorageKey) || '{}') };
const supabaseUrl = 'https://wodiuznopzrsobqgbonw.supabase.co';
const supabaseKey = 'sb_publishable_XKLOB2aJjn0vS8iUAOZhHA_JVU02_sn';
const supabaseClient = window.supabase?.createClient(supabaseUrl, supabaseKey);
let posts = [];
let currentUser = null;
let editingPostId = null;
let selectedRating = 5;
let selectedFeatured = false;
let selectedImage = '';
let editingImageUrl = null;
const grid = document.querySelector('#post-grid');
const featuredSection = document.querySelector('#featured-section');
const featuredGrid = document.querySelector('#featured-grid');
const filter = document.querySelector('#genre-filter');
const emptyState = document.querySelector('#empty-state');
const detail = document.querySelector('#post-detail');
const latestFeature = document.querySelector('#latest-feature');
const postForm = document.querySelector('#post-form');
if (postForm && !document.querySelector('#reflection')) {
  const label = document.createElement('label');
  label.innerHTML = 'Extended reflection<textarea id="reflection" rows="7" placeholder="Write more about what you think and feel about this music..."></textarea>';
  postForm.querySelector('#note')?.parentElement.after(label);
}
if (postForm && !document.querySelector('#featured-toggle')) {
  const label = document.createElement('div');
  label.className = 'featured-toggle';
  label.innerHTML = '<button type="button" id="featured-toggle" aria-pressed="false" aria-label="Feature this post">◆</button><span>Feature this post (diamond pick)</span>';
  postForm.querySelector('#rating-input')?.closest('fieldset').after(label);
}
if (postForm && !document.querySelector('#genre-options')) {
  const datalist = document.createElement('datalist');
  datalist.id = 'genre-options';
  document.body.appendChild(datalist);
}
function splitGenres(genreString) { return (genreString || '').split(',').map((genre) => genre.trim()).filter(Boolean); }
function formatGenres(genreString) { return splitGenres(genreString).join(' / '); }
function updateGenreOptions() {
  const genreSet = new Set();
  posts.forEach((post) => splitGenres(post.genre).forEach((genre) => genreSet.add(genre)));
  const genreList = [...genreSet].sort((first, second) => first.localeCompare(second));
  const datalist = document.querySelector('#genre-options');
  if (datalist) datalist.innerHTML = genreList.map((genre) => `<option value="${genre}"></option>`).join('');
  if (filter) {
    const previousValue = filter.value;
    filter.innerHTML = '<option value="all">All categories</option>' + genreList.map((genre) => `<option value="${genre}">${genre}</option>`).join('');
    filter.value = genreList.includes(previousValue) ? previousValue : 'all';
  }
}
async function updateCustomizeLink() {
  const customizeLink = document.querySelector('.customize-link');
  if (!customizeLink || !supabaseClient) return;
  const { data: { user } } = await supabaseClient.auth.getUser();
  customizeLink.hidden = !user;
}
updateCustomizeLink();

function applyTemplateConfig() {
  const replacements = Object.entries(templateConfig).filter(([key]) => key !== 'email' && key !== 'password').sort(([first], [second]) => second.length - first.length);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    replacements.forEach(([placeholder, value]) => {
      if (node.nodeValue.includes(placeholder)) node.nodeValue = node.nodeValue.split(placeholder).join(templateConfig[`show_${placeholder}`] === false ? '' : (value || placeholder));
    });
    if (templateConfig['YOUR BLOG NAME']) node.nodeValue = node.nodeValue.split('YOUR & NAME').join(templateConfig['YOUR BLOG NAME']);
  });
  Object.entries(templateConfig).filter(([key, value]) => key.startsWith('show_') && value === false).forEach(([key]) => { const placeholder = key.slice(5); textNodes.forEach((node) => { node.nodeValue = node.nodeValue.split(placeholder).join(''); }); });
  Object.entries(templateConfig).sort(([first], [second]) => second.length - first.length).forEach(([placeholder, value]) => { if (value) document.title = document.title.split(placeholder).join(value); });
  if (templateConfig['YOUR BLOG DESCRIPTION']) document.querySelector('meta[name="description"]')?.setAttribute('content', templateConfig['YOUR BLOG DESCRIPTION']);
  const visibilitySelectors = { showLatest: '.latest-feature', showJournal: '.journal-section', showAbout: '.about-section', showJournalLink: 'a[href="journal.html"]', showAboutLink: 'a[href="about.html"]' };
  Object.entries(visibilitySelectors).forEach(([key, selector]) => { if (templateConfig[key] === false) document.querySelectorAll(selector).forEach((element) => { element.hidden = true; }); });
}
applyTemplateConfig();

function stars(rating) { return '★'.repeat(rating) + '<span class="empty-stars">' + '★'.repeat(5 - rating) + '</span>'; }
function postCardMarkup(post, index) {
  return `<article class="post-card"><a class="post-card-link" href="post.html?id=${post.id}"><div class="post-image">${post.featured ? '<span class="diamond-badge" title="Featured">◆</span>' : ''}<span class="post-index">0${index + 1} / ${post.created_at ? new Date(post.created_at).getFullYear() : new Date().getFullYear()}</span>${post.image_url ? `<img src="${post.image_url}" alt="${post.artist} - ${post.title}">` : '<span class="image-placeholder">No<br>Cover<br>Image</span>'}</div><div class="post-content"><div class="post-meta"><span>${formatGenres(post.genre)}</span><span>${post.created_at ? new Date(post.created_at).toLocaleDateString('en-GB') : 'Recently'}</span></div><h3>${post.artist}<br><span>${post.title}</span></h3><p class="post-note">${post.note}</p><div class="post-footer"><span class="stars" aria-label="${post.rating} out of 5 stars">${stars(post.rating)}</span>${post.spotify ? `<span class="spotify-link">Listen on Spotify ↗</span>` : ''}</div></div></a>${currentUser && post.author_id === currentUser.id ? `<div class="post-actions"><button class="secondary-button edit-post" data-post-id="${post.id}" type="button">Edit</button><button class="danger-button delete-post" data-post-id="${post.id}" type="button">Delete</button></div>` : ''}</article>`;
}
function renderPosts() {
  if (!grid || !filter || !emptyState) return;
  const genre = filter.value;
  const visiblePosts = genre === 'all' ? posts : posts.filter((post) => splitGenres(post.genre).includes(genre));
  grid.innerHTML = visiblePosts.map((post, index) => postCardMarkup(post, index)).join('');
  grid.querySelectorAll('.edit-post').forEach((button) => button.addEventListener('click', () => startEditing(button.dataset.postId)));
  grid.querySelectorAll('.delete-post').forEach((button) => button.addEventListener('click', () => deletePost(button.dataset.postId)));
  emptyState.hidden = visiblePosts.length > 0;
  renderFeaturedPosts();
}
function renderFeaturedPosts() {
  if (!featuredSection || !featuredGrid) return;
  const featuredPosts = posts.filter((post) => post.featured);
  featuredSection.hidden = featuredPosts.length === 0;
  featuredGrid.innerHTML = featuredPosts.map((post, index) => postCardMarkup(post, index)).join('');
  featuredGrid.querySelectorAll('.edit-post').forEach((button) => button.addEventListener('click', () => startEditing(button.dataset.postId)));
  featuredGrid.querySelectorAll('.delete-post').forEach((button) => button.addEventListener('click', () => deletePost(button.dataset.postId)));
}
async function loadPosts() {
  if (!supabaseClient || !grid) return;
  const { data: { user } } = await supabaseClient.auth.getUser();
  currentUser = user;
  const { data, error } = await supabaseClient.from('posts').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Could not load posts:', error.message);
    return;
  }
  posts = data || [];
  updateGenreOptions();
  renderPosts();
  renderLatestPost();
}
function postMarkup(post) {
  return `<a class="latest-link" href="post.html?id=${post.id}">${post.image_url ? `<img src="${post.image_url}" alt="${post.artist} - ${post.title}">` : '<span class="latest-placeholder">No<br>Post<br>Yet</span>'}<span class="latest-overlay"><span class="post-meta">${formatGenres(post.genre)} / ${post.created_at ? new Date(post.created_at).toLocaleDateString('en-GB') : 'Recently'}</span><strong>${post.artist}<br><em>${post.title}</em></strong><span class="latest-cta">Read the full note →</span></span></a>`;
}
function renderLatestPost() {
  if (!latestFeature) return;
  const latest = posts[0];
  latestFeature.querySelector('.latest-content').innerHTML = latest ? postMarkup(latest) : '<span class="latest-empty">Your newest post will appear here.</span>';
}
async function loadPostDetail() {
  if (!detail || !supabaseClient) return;
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { detail.innerHTML = '<p class="detail-status">No post selected.</p>'; return; }
  const { data: post, error } = await supabaseClient.from('posts').select('*').eq('id', id).single();
  if (error || !post) { detail.innerHTML = '<p class="detail-status">This post could not be found.</p>'; return; }
  document.title = `${post.artist} - ${post.title}`;
  detail.innerHTML = `<a class="back-link" href="journal.html">← Back to journal</a><div class="detail-layout"><div class="detail-image">${post.image_url ? `<img src="${post.image_url}" alt="${post.artist} - ${post.title}">` : '<span class="image-placeholder">No<br>Cover<br>Image</span>'}</div><article class="detail-copy"><p class="eyebrow">${formatGenres(post.genre)} <span class="line"></span> ${post.created_at ? new Date(post.created_at).toLocaleDateString('en-GB') : 'Recently'}</p><h1>${post.artist}<br><em>${post.title}</em></h1><div class="detail-rating">${stars(post.rating)}</div><p class="detail-note">${post.note}</p>${post.reflection ? `<div class="reflection"><p class="eyebrow">Extended reflection</p><p>${post.reflection}</p></div>` : ''}${post.spotify ? `<a class="text-link" href="${post.spotify}" target="_blank" rel="noopener">Listen on Spotify <span>↗</span></a>` : ''}</article></div>`;
}
function resetPostForm() {
  editingPostId = null;
  editingImageUrl = null;
  selectedImage = '';
  selectedFeatured = false;
  postForm?.reset();
  const featuredToggle = document.querySelector('#featured-toggle');
  if (featuredToggle) { featuredToggle.classList.remove('active'); featuredToggle.setAttribute('aria-pressed', 'false'); }
  if (imageStatus) imageStatus.textContent = 'No image selected';
  const heading = document.querySelector('#editor-title');
  const submit = postForm?.querySelector('button[type="submit"]');
  const cancel = document.querySelector('#cancel-edit');
  if (heading) heading.textContent = 'Write a note.';
  if (submit) submit.innerHTML = 'Publish note <span>→</span>';
  if (cancel) cancel.hidden = true;
}
function startEditing(postId) {
  const post = posts.find((item) => String(item.id) === String(postId));
  if (!post || !postForm) return;
  editingPostId = post.id;
  editingImageUrl = post.image_url || null;
  document.querySelector('#artist').value = post.artist;
  document.querySelector('#title').value = post.title;
  document.querySelector('#genre').value = post.genre;
  document.querySelector('#spotify').value = post.spotify || '';
  document.querySelector('#note').value = post.note;
  document.querySelector('#reflection').value = post.reflection || '';
  selectedRating = post.rating;
  selectedFeatured = !!post.featured;
  const featuredToggle = document.querySelector('#featured-toggle');
  if (featuredToggle) { featuredToggle.classList.toggle('active', selectedFeatured); featuredToggle.setAttribute('aria-pressed', String(selectedFeatured)); }
  selectedImage = '';
  if (imageStatus) imageStatus.textContent = post.image_url ? 'Existing image will be kept unless replaced' : 'No image selected';
  document.querySelectorAll('#rating-input button').forEach((star) => star.classList.toggle('active', Number(star.dataset.rating) <= selectedRating));
  document.querySelector('#editor-title').textContent = 'Edit your note.';
  postForm.querySelector('button[type="submit"]').innerHTML = 'Save changes <span>→</span>';
  const cancel = document.querySelector('#cancel-edit');
  if (cancel) cancel.hidden = false;
  openModal('editor-modal');
}
async function deletePost(postId) {
  if (!supabaseClient || !currentUser || !window.confirm('Delete this post?')) return;
  const { error } = await supabaseClient.from('posts').delete().eq('id', postId).eq('author_id', currentUser.id);
  if (error) { window.alert(error.message); return; }
  await loadPosts();
}
function openModal(id) { document.querySelector(`#${id}`).hidden = false; document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.querySelector(`#${id}`).hidden = true; document.body.style.overflow = ''; }
function addSignOutControl() {
  const editor = document.querySelector('#editor-modal .editor-heading');
  if (!editor || document.querySelector('#sign-out-button')) return;
  const button = document.createElement('button');
  button.id = 'sign-out-button';
  button.className = 'secondary-button sign-out-button';
  button.type = 'button';
  button.textContent = 'Sign out';
  button.addEventListener('click', async () => {
    await supabaseClient?.auth.signOut();
    closeModal('editor-modal');
    currentUser = null;
    document.querySelectorAll('.customize-link').forEach((link) => { link.hidden = true; });
    renderPosts();
  });
  editor.appendChild(button);
}
addSignOutControl();
document.querySelector('#login-button')?.addEventListener('click', async () => { const { data: { user } } = supabaseClient ? await supabaseClient.auth.getUser() : { data: { user: null } }; openModal(user ? 'editor-modal' : 'login-modal'); });
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.addEventListener('click', (event) => { if (event.target === backdrop) closeModal(backdrop.id); }));
document.querySelector('#login-form')?.addEventListener('submit', async (event) => { event.preventDefault(); const email = document.querySelector('#email').value; const password = document.querySelector('#password').value; const message = document.querySelector('#login-message'); if (!supabaseClient) { message.textContent = 'Supabase is not connected.'; return; } const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) { message.textContent = error.message; return; } currentUser = data.user; document.querySelectorAll('.customize-link').forEach((link) => { link.hidden = false; }); closeModal('login-modal'); openModal('editor-modal'); });
document.querySelectorAll('#rating-input button').forEach((button) => button.addEventListener('click', () => { selectedRating = Number(button.dataset.rating); document.querySelectorAll('#rating-input button').forEach((star) => star.classList.toggle('active', Number(star.dataset.rating) <= selectedRating)); }));
document.querySelector('#featured-toggle')?.addEventListener('click', (event) => { selectedFeatured = !selectedFeatured; event.target.classList.toggle('active', selectedFeatured); event.target.setAttribute('aria-pressed', String(selectedFeatured)); });
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 700;
        const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        const context = canvas.getContext('2d');
        context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
const imageInput = document.querySelector('#post-image-input');
const dropzone = document.querySelector('#image-dropzone');
const imageStatus = document.querySelector('#image-status');
async function selectImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  if (imageStatus) imageStatus.textContent = 'Preparing image...';
  try {
    selectedImage = await resizeImage(file);
    if (imageStatus) imageStatus.textContent = `${file.name} ready to publish`;
  } catch {
    selectedImage = '';
    if (imageStatus) imageStatus.textContent = 'That image could not be loaded.';
  }
}
if (imageInput) imageInput.addEventListener('change', () => selectImage(imageInput.files[0]));
if (dropzone) {
  ['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove('dragging'); }));
  dropzone.addEventListener('drop', (event) => selectImage(event.dataTransfer.files[0]));
}
if (postForm) postForm.addEventListener('submit', async (event) => { event.preventDefault(); const message = document.querySelector('#post-message'); if (!supabaseClient) { message.textContent = 'Supabase is not connected.'; return; } const { data: { user } } = await supabaseClient.auth.getUser(); if (!user) { message.textContent = 'Please sign in before publishing.'; return; } let imageUrl = editingImageUrl; if (selectedImage) { const filePath = `${user.id}/${Date.now()}.jpg`; const imageBlob = await fetch(selectedImage).then((response) => response.blob()); const { error: uploadError } = await supabaseClient.storage.from('post-images').upload(filePath, imageBlob, { contentType: 'image/jpeg', upsert: false }); if (uploadError) { message.textContent = uploadError.message; return; } imageUrl = supabaseClient.storage.from('post-images').getPublicUrl(filePath).data.publicUrl; } const postData = { artist: document.querySelector('#artist').value.trim(), title: document.querySelector('#title').value.trim(), genre: splitGenres(document.querySelector('#genre').value).join(', '), rating: selectedRating, note: document.querySelector('#note').value.trim(), reflection: document.querySelector('#reflection').value.trim() || null, spotify: document.querySelector('#spotify').value.trim() || null, image_url: imageUrl, featured: selectedFeatured }; const result = editingPostId ? await supabaseClient.from('posts').update(postData).eq('id', editingPostId).eq('author_id', user.id) : await supabaseClient.from('posts').insert({ ...postData, author_id: user.id }); if (result.error) { message.textContent = result.error.message; return; } await loadPosts(); resetPostForm(); closeModal('editor-modal'); });
document.querySelector('#cancel-edit')?.addEventListener('click', () => { resetPostForm(); });
if (filter) filter.addEventListener('change', renderPosts);
document.querySelectorAll('#rating-input button').forEach((star) => star.classList.toggle('active', Number(star.dataset.rating) <= selectedRating));
renderPosts();
loadPosts();
loadPostDetail();