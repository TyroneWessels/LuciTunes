const storageKey = 'needle-note-posts-v2';
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
const reviewers = ['Lucille', 'Modest'];
if (postForm && !document.querySelector('#reviewer')) {
  const label = document.createElement('label');
  label.innerHTML = `Reviewer<select id="reviewer">${reviewers.map((name) => `<option value="${name}">${name}</option>`).join('')}</select>`;
  postForm.querySelector('#genre')?.closest('.form-row').after(label);
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
function stars(rating) { return '★'.repeat(rating) + '<span class="empty-stars">' + '★'.repeat(5 - rating) + '</span>'; }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function safeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}
function postCardMarkup(post, index) {
  const artist = escapeHtml(post.artist);
  const title = escapeHtml(post.title);
  const note = escapeHtml(post.note);
  const reviewer = escapeHtml(post.reviewer || reviewers[0]);
  const genre = escapeHtml(formatGenres(post.genre));
  const imageUrl = safeUrl(post.image_url);
  return `<article class="post-card"><a class="post-card-link" href="post.html?id=${post.id}"><div class="post-image">${post.featured ? '<span class="diamond-badge" title="Featured">◆</span>' : ''}<span class="post-index">0${index + 1} / ${post.created_at ? new Date(post.created_at).getFullYear() : new Date().getFullYear()}</span>${imageUrl ? `<img src="${imageUrl}" alt="${artist} - ${title}">` : '<span class="image-placeholder">No<br>Cover<br>Image</span>'}</div><div class="post-content"><div class="post-meta"><span>${genre}</span><span>${post.created_at ? new Date(post.created_at).toLocaleDateString('en-GB') : 'Recently'}</span></div><h3>${artist}<br><span>${title}</span></h3><p class="post-byline">Reviewed by ${reviewer}</p><p class="post-note">${note}</p><div class="post-footer"><span class="stars" aria-label="${post.rating} out of 5 stars">${stars(post.rating)}</span>${post.spotify ? `<span class="spotify-link">Listen on Spotify ↗</span>` : ''}</div></div></a>${currentUser && post.author_id === currentUser.id ? `<div class="post-actions"><button class="secondary-button edit-post" data-post-id="${post.id}" type="button">Edit</button><button class="danger-button delete-post" data-post-id="${post.id}" type="button">Delete</button></div>` : ''}</article>`;
}
function renderPosts() {
  if (!grid || !filter || !emptyState) return;
  const genre = filter.value;
  const nonFeaturedPosts = posts.filter((post) => !post.featured);
  const visiblePosts = genre === 'all' ? nonFeaturedPosts : nonFeaturedPosts.filter((post) => splitGenres(post.genre).includes(genre));
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
  const artist = escapeHtml(post.artist);
  const title = escapeHtml(post.title);
  const reviewer = escapeHtml(post.reviewer || reviewers[0]);
  const genre = escapeHtml(formatGenres(post.genre));
  const imageUrl = safeUrl(post.image_url);
  return `<a class="latest-link" href="post.html?id=${post.id}">${imageUrl ? `<img src="${imageUrl}" alt="${artist} - ${title}">` : '<span class="latest-placeholder">No<br>Post<br>Yet</span>'}<span class="latest-overlay"><span class="post-meta">${genre} / ${post.created_at ? new Date(post.created_at).toLocaleDateString('en-GB') : 'Recently'} / Reviewed by ${reviewer}</span><strong>${artist}<br><em>${title}</em></strong><span class="latest-cta">Read the full note →</span></span></a>`;
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
  const artist = escapeHtml(post.artist);
  const title = escapeHtml(post.title);
  const note = escapeHtml(post.note);
  const reflection = escapeHtml(post.reflection || '');
  const reviewer = escapeHtml(post.reviewer || reviewers[0]);
  const genre = escapeHtml(formatGenres(post.genre));
  const imageUrl = safeUrl(post.image_url);
  const spotifyUrl = safeUrl(post.spotify);
  document.title = `${post.artist} - ${post.title}`;
  detail.innerHTML = `<a class="back-link" href="journal.html">← Back to journal</a><div class="detail-layout"><div class="detail-image">${imageUrl ? `<img src="${imageUrl}" alt="${artist} - ${title}">` : '<span class="image-placeholder">No<br>Cover<br>Image</span>'}</div><article class="detail-copy"><p class="eyebrow">${genre} <span class="line"></span> ${post.created_at ? new Date(post.created_at).toLocaleDateString('en-GB') : 'Recently'}</p><h1>${artist}<br><em>${title}</em></h1><p class="detail-byline">Reviewed by ${reviewer}</p><div class="detail-rating">${stars(post.rating)}</div><p class="detail-note">${note}</p>${reflection ? `<div class="reflection"><p class="eyebrow">Extended reflection</p><p>${reflection}</p></div>` : ''}${spotifyUrl ? `<a class="text-link" href="${spotifyUrl}" target="_blank" rel="noopener">Listen on Spotify <span>↗</span></a>` : ''}</article></div>`;
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
  document.querySelector('#reviewer').value = post.reviewer || reviewers[0];
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
function closeModal(id) { document.querySelector(`#${id}`).hidden = true; document.body.style.overflow = ''; if (id === 'editor-modal') resetPostForm(); }
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
    renderPosts();
  });
  editor.appendChild(button);
}
addSignOutControl();
document.querySelector('#login-button')?.addEventListener('click', async () => { const { data: { user } } = supabaseClient ? await supabaseClient.auth.getUser() : { data: { user: null } }; openModal(user ? 'editor-modal' : 'login-modal'); });
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.addEventListener('click', (event) => { if (event.target === backdrop) closeModal(backdrop.id); }));
document.querySelector('#login-form')?.addEventListener('submit', async (event) => { event.preventDefault(); const email = document.querySelector('#email').value; const password = document.querySelector('#password').value; const message = document.querySelector('#login-message'); if (!supabaseClient) { message.textContent = 'Supabase is not connected.'; return; } const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password }); if (error) { message.textContent = error.message; return; } currentUser = data.user; closeModal('login-modal'); openModal('editor-modal'); });
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
if (postForm) postForm.addEventListener('submit', async (event) => { event.preventDefault(); const message = document.querySelector('#post-message'); if (!supabaseClient) { message.textContent = 'Supabase is not connected.'; return; } const { data: { user } } = await supabaseClient.auth.getUser(); if (!user) { message.textContent = 'Please sign in before publishing.'; return; } let imageUrl = editingImageUrl; if (selectedImage) { const filePath = `${user.id}/${Date.now()}.jpg`; const imageBlob = await fetch(selectedImage).then((response) => response.blob()); const { error: uploadError } = await supabaseClient.storage.from('post-images').upload(filePath, imageBlob, { contentType: 'image/jpeg', upsert: false }); if (uploadError) { message.textContent = uploadError.message; return; } imageUrl = supabaseClient.storage.from('post-images').getPublicUrl(filePath).data.publicUrl; } const postData = { artist: document.querySelector('#artist').value.trim(), title: document.querySelector('#title').value.trim(), genre: splitGenres(document.querySelector('#genre').value).join(', '), rating: selectedRating, note: document.querySelector('#note').value.trim(), reflection: document.querySelector('#reflection').value.trim() || null, spotify: document.querySelector('#spotify').value.trim() || null, image_url: imageUrl, featured: selectedFeatured, reviewer: document.querySelector('#reviewer').value }; const result = editingPostId ? await supabaseClient.from('posts').update(postData).eq('id', editingPostId).eq('author_id', user.id) : await supabaseClient.from('posts').insert({ ...postData, author_id: user.id }); if (result.error) { message.textContent = result.error.message; return; } await loadPosts(); resetPostForm(); closeModal('editor-modal'); });
document.querySelector('#cancel-edit')?.addEventListener('click', () => { resetPostForm(); });
if (filter) filter.addEventListener('change', renderPosts);

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
document.querySelectorAll('#rating-input button').forEach((star) => star.classList.toggle('active', Number(star.dataset.rating) <= selectedRating));
renderPosts();
loadPosts();
loadPostDetail();