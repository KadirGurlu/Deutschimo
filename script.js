const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const sidebar = document.getElementById('sidebar');
const mobileMenu = document.getElementById('mobileMenu');
const toast = document.getElementById('toast');

function openPage(pageId) {
  pages.forEach(page => page.classList.toggle('active', page.id === pageId));
  navItems.forEach(item => item.classList.toggle('active', item.dataset.page === pageId));
  sidebar.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach(item => item.addEventListener('click', () => openPage(item.dataset.page)));
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => openPage(button.dataset.go)));

mobileMenu.addEventListener('click', () => sidebar.classList.toggle('open'));

document.querySelectorAll('.theme-option').forEach(option => {
  option.addEventListener('click', () => {
    document.body.dataset.theme = option.dataset.themeChoice;
    document.querySelectorAll('.theme-option').forEach(btn => btn.classList.remove('active'));
    option.classList.add('active');
  });
});

document.querySelectorAll('.task input').forEach(input => {
  input.addEventListener('change', () => {
    input.closest('.task').classList.toggle('done', input.checked);
    if (input.checked) {
      toast.classList.add('show');
      window.setTimeout(() => toast.classList.remove('show'), 2200);
    }
  });
});

document.querySelectorAll('.level-tabs button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.level-tabs button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    const level = button.textContent.trim();
    document.querySelectorAll('.course-card').forEach(card => {
      card.style.display = level === 'Tümü' || card.querySelector('.course-cover span').textContent.trim() === level ? '' : 'none';
    });
  });
});

const searchInput = document.querySelector('.search-box input');
searchInput.addEventListener('keydown', event => {
  if (event.key === 'Enter' && searchInput.value.trim()) {
    toast.textContent = `“${searchInput.value.trim()}” için sonuçlar hazırlanıyor.`;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2200);
  }
});

document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
  }
});
