const header = document.querySelector('.site-header')

function syncHeaderState() {
  if (!header) return
  header.toggleAttribute('data-scrolled', window.scrollY > 8)
}

syncHeaderState()
window.addEventListener('scroll', syncHeaderState, { passive: true })
