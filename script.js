// -----------------------------
// script.js - ulepszona wersja z EmailJS
// -----------------------------

// 🔹 Supabase
const SUPABASE_URL = 'https://mkvpqnvlzdrujsqkdpmi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rdnBxbnZsemRydWpzcWtkcG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDc4MDcsImV4cCI6MjA3NTQyMzgwN30.QuCU__UgvzofofS-T5Y-XzdLW7EakZZzh4DwQP4xAnA';
let supabase;

// 🔹 EmailJS
const EMAILJS_SERVICE = 'service_9hspj2l';
const EMAILJS_TEMPLATE = 'template_nythj6i';
const EMAILJS_PUBLIC_KEY = '7WfAAPMnAEYw40agp';

// 🔹 Dane i koszyk
let productsData = { candles: [], bouquets: [], promotions: [] };
let bestsellers = [];
let cart = [];
let currentProduct = null;
let cartVisible = false;

// -----------------------------
// Inicjalizacja
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (SUPABASE_KEY && SUPABASE_KEY !== 'REPLACE_WITH_YOUR_ANON_KEY') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } else {
    console.warn('Supabase key not set.');
  }

  document.getElementById('home').classList.remove('hidden');
  if (supabase) loadProductsFromSupabase();

  loadCategories();

  const cookieBanner = document.getElementById('cookieBanner');
  if (localStorage.getItem('cookiesAccepted') === 'true') {
    cookieBanner.style.display = 'none';
    setTimeout(showNewsletter, 5000);
  } else {
    cookieBanner.style.display = 'flex';
    cookieBanner.style.pointerEvents = 'auto';
  }

  document.getElementById('cartToggle').addEventListener('click', toggleCart);

  document.querySelectorAll('header nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
      const target = document.getElementById(btn.dataset.target);
      if (target) {
        target.classList.remove('hidden');
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      }
      document.querySelector('nav').classList.remove('show');
      document.querySelector('.menu-toggle').setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeNewsletter();
      const c = document.getElementById('cart');
      if (c.classList.contains('active')) toggleCart();
    }
  });

  updateCart();
});

// -----------------------------
// Pobranie produktów
// -----------------------------
async function loadProductsFromSupabase() {
  try {
    const { data: products, error } = await supabase.from('products').select('*');
    if (error) {
      console.error('Błąd pobierania produktów:', error);
      return;
    }
    if (!products || !Array.isArray(products)) return;

    productsData = { candles: [], bouquets: [], promotions: [] };
    bestsellers = [];

    products.forEach(p => {
      const cat = (p.category || '').toLowerCase();
      if (cat === 'candles') productsData.candles.push(p);
      else if (cat === 'bouquets') productsData.bouquets.push(p);
      else if (cat === 'promotions') productsData.promotions.push(p);
      if (p.bestseller) bestsellers.push(p);
    });

    loadBestsellers();
    loadProducts('candles'); 
    loadProducts('bouquets');
    loadProducts('promotions');
  } catch (e) {
    console.error('loadProductsFromSupabase exception:', e);
  }
}

// -----------------------------
// Kategorie
// -----------------------------
function loadCategories() {
  document.querySelectorAll('.categories button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.category').forEach(c => c.classList.add('hidden'));
      const el = document.getElementById(btn.dataset.cat);
      if (el) {
        el.classList.remove('hidden');
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      }
    };
  });
}

// -----------------------------
// Wstawianie produktów
// -----------------------------
function loadProducts(cat) {
  const container = document.getElementById(cat);
  if (!container || !productsData[cat]) return;
  container.innerHTML = '';
  productsData[cat].forEach(p => {
    const div = document.createElement('div');
    div.className = 'product-card';
    const imgSrc = p.image || p.image2 || 'images/placeholder.jpg';
    const safeName = escapeHtml((p.name || 'Produkt').toString());
    div.innerHTML = `
      <img src="${imgSrc}" alt="${safeName}">
      <h3>${safeName}</h3>
      <p>${formatPrice(Number(p.price || 0))} zł</p>
    `;
    div.addEventListener('click', () => showProductDetail(p));
    container.appendChild(div);
  });
}

// -----------------------------
// Modal produktu
// -----------------------------
function showProductDetail(p) {
  currentProduct = p;
  document.getElementById('modalTitle').textContent = p.name || '';
  document.getElementById('modalImage').src = p.image || p.image2 || 'images/placeholder.jpg';
  document.getElementById('modalImage').alt = p.name || 'Produkt';
  document.getElementById('modalDesc').textContent = p.description || '';
  document.getElementById('modalPrice').textContent = `${formatPrice(Number(p.price || 0))} zł`;
  document.getElementById('quantity').value = 1;
  const modal = document.getElementById('productModal');
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}
function closeModal() { const m=document.getElementById('productModal'); m.classList.add('hidden'); m.style.display='none'; }

// -----------------------------
// Koszyk
// -----------------------------
function addToCart() {
  if (!currentProduct) return;
  const qty = parseInt(document.getElementById('quantity').value) || 1;
  const prod = { ...currentProduct, quantity: qty };
  const index = cart.findIndex(c => c.id === prod.id);
  if (index !== -1) cart[index].quantity += qty;
  else cart.push(prod);
  updateCart();
  closeModal();
}
function updateCart() {
  const list = document.getElementById('cartItems');
  list.innerHTML = '';
  let total = 0;
  if (cart.length === 0) {
    list.innerHTML = '<li>Twój koszyk jest pusty.</li>';
  } else {
    cart.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} x${item.quantity} - ${formatPrice(Number(item.price || 0) * item.quantity)} zł`;
      list.appendChild(li);
      total += (Number(item.price || 0) * item.quantity);
    });
  }
  document.getElementById('cartTotal').textContent = `Łącznie: ${formatPrice(total)} zł`;
  document.getElementById('cartCount').textContent = cart.reduce((a,b)=>a+(b.quantity||0),0);
}
function toggleCart() { 
  cartVisible = !cartVisible; 
  const c = document.getElementById('cart'); 
  if (cartVisible) {
    c.classList.add('active');
    c.classList.remove('hidden');
  } else {
    c.classList.remove('active');
  }
}

// -----------------------------
// Checkout z EmailJS
// -----------------------------
function showCheckoutForm() { document.getElementById('cartForm').classList.toggle('hidden'); }

async function checkout() {
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const address = document.getElementById('address').value.trim();
  const payment = document.getElementById('payment').value;
  const errEl = document.getElementById('checkoutError');
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

  if (!name || !phone || !email || !address) {
    if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Proszę uzupełnić wszystkie wymagane pola formularza.'; }
    return;
  }
  if (cart.length === 0) {
    if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Koszyk jest pusty. Dodaj produkty zanim wyślesz zamówienie.'; }
    return;
  }

  const itemsText = cart.map(i => `${i.name} x${i.quantity} - ${formatPrice(Number(i.price||0)*i.quantity)} zł`).join('\n');
  const totalPrice = formatPrice(cart.reduce((s,i)=>s + (Number(i.price||0)*i.quantity),0));

  try {
    await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, {
      name, phone, email, address, payment,
      items: itemsText,
      total: totalPrice
    }, EMAILJS_PUBLIC_KEY);

    alert('Zamówienie wysłane emailem do sprzedawcy!');
  } catch(e) {
    console.error('EmailJS error:', e);
    alert('Wystąpił błąd podczas wysyłania zamówienia emailem.');
  }

  cart = [];
  updateCart();
  document.getElementById('cartForm').classList.add('hidden');
  ['name','phone','email','address'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
}

// -----------------------------
// Newsletter
// -----------------------------
function showNewsletter() {
  const popup = document.getElementById('newsletterPopup');
  if (localStorage.getItem('newsletterClosed') !== 'true') {
    setTimeout(() => {
      popup.classList.remove('hidden');
      popup.style.display = 'flex';
      popup.style.pointerEvents = 'auto';
    }, 1000);
  }
}
function closeNewsletter() { localStorage.setItem('newsletterClosed','true'); const popup=document.getElementById('newsletterPopup'); popup.classList.add('hidden'); popup.style.display='none'; }
function subscribeNewsletter() {
  const email = document.getElementById('newsletterEmail').value.trim();
  if (!email || !validateEmail(email)) { alert('Wprowadź poprawny adres email.'); return; }
  alert('Zapisano do newslettera!');
  closeNewsletter();
}

// -----------------------------
// Cookies
// -----------------------------
function acceptCookies() { localStorage.setItem('cookiesAccepted','true'); document.getElementById('cookieBanner').style.display='none'; setTimeout(showNewsletter, 5000);}
function declineCookies() { localStorage.setItem('cookiesAccepted','false'); document.getElementById('cookieBanner').style.display='none'; }

// -----------------------------
// Bestsellery
// -----------------------------
function loadBestsellers() {
  const container = document.getElementById('bestsellers');
  container.innerHTML = '';
  bestsellers.forEach(p => {
    const div = document.createElement('div');
    div.className='bestseller-item';
    div.innerHTML = `
      <img src="${p.image || 'images/placeholder.jpg'}" alt="${escapeHtml(p.name || 'Bestseller')}">
      <span class="bestseller-label">Bestseller</span>
      <p class="bestseller-name">${escapeHtml(p.name || '')}</p>
      <p class="bestseller-price">${formatPrice(Number(p.price || 0))} zł</p>
    `;
    div.addEventListener('click',()=>showProductDetail(p));
    container.appendChild(div);
  });
}

// -----------------------------
// Pomocnicze
// -----------------------------
function formatPrice(num) { const n = Number(num || 0); return n.toFixed(2); }
function escapeHtml(text){ if (text===null||text===undefined) return ''; return String(text).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[m]); }
function toggleMenu(){ const nav = document.querySelector('nav'); nav.classList.toggle('show'); const expanded = nav.classList.contains('show'); document.querySelector('.menu-toggle').setAttribute('aria-expanded', String(expanded)); }
function validateEmail(email) { const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return re.test(email); }
