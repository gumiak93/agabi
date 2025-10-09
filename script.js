// 🔹 Supabase
const SUPABASE_URL = 'https://mkvpqnvlzdrujsqkdpmi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rdnBxbnZsemRydWpzcWtkcG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDc4MDcsImV4cCI6MjA3NTQyMzgwN30.QuCU__UgvzofofS-T5Y-XzdLW7EakZZzh4DwQP4xAnA';
let supabase;

// 🔹 Dane i koszyk
let productsData = { candles: [], bouquets: [], promotions: [] };
let bestsellers = [];
let cart = [];
let currentProduct = null;
let cartVisible = false;

// 🔹 Inicjalizacja
document.addEventListener("DOMContentLoaded", () => {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  document.getElementById('home').classList.remove('hidden');
  loadProductsFromSupabase();
  loadCategories();

  // Cookie banner
  const cookieBanner = document.getElementById('cookieBanner');
  if (localStorage.getItem('cookiesAccepted') === 'true') {
    cookieBanner.style.display = 'none';
    showNewsletter();
  } else {
    cookieBanner.style.display = 'flex';
    cookieBanner.style.pointerEvents = 'auto';
  }

  document.getElementById('cartToggle').addEventListener('click', toggleCart);

  document.querySelectorAll('header nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));
      document.getElementById(btn.dataset.target).classList.remove('hidden');
      document.querySelector('nav').classList.remove('show');
    });
  });
});

// 🔹 Pobranie produktów
async function loadProductsFromSupabase() {
  try {
    const { data: products, error } = await supabase.from('products').select('*');
    if (error) { console.error('Błąd pobierania produktów:', error); return; }

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

// 🔹 Kategorie
function loadCategories() {
  document.querySelectorAll('.categories button').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.category').forEach(c => c.classList.add('hidden'));
      document.getElementById(btn.dataset.cat).classList.remove('hidden');
    };
  });
}

// 🔹 Wstawianie produktów
function loadProducts(cat) {
  const container = document.getElementById(cat);
  if (!productsData[cat]) return;
  container.innerHTML = '';
  productsData[cat].forEach(p => {
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <img src="${p.image || p.image2 || 'images/placeholder.jpg'}" alt="${escapeHtml(p.name)}">
      <h3>${escapeHtml(p.name)}</h3>
      <p>${formatPrice(p.price)} zł</p>
    `;
    div.addEventListener('click', () => showProductDetail(p));
    container.appendChild(div);
  });
}

// 🔹 Modal produktu
function showProductDetail(p) {
  currentProduct = p;
  document.getElementById('modalTitle').textContent = p.name;
  document.getElementById('modalImage').src = p.image || p.image2 || 'images/placeholder.jpg';
  document.getElementById('modalDesc').textContent = p.description || '';
  document.getElementById('modalPrice').textContent = `${formatPrice(p.price)} zł`;
  document.getElementById('quantity').value = 1;
  document.getElementById('productModal').classList.remove('hidden');
}
function closeModal() { document.getElementById('productModal').classList.add('hidden'); }

// 🔹 Koszyk
function addToCart() {
  const qty = parseInt(document.getElementById('quantity').value);
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
  if (cart.length === 0) list.innerHTML = '<li>Twój koszyk jest pusty.</li>';
  else cart.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)} zł`;
    list.appendChild(li);
    total += item.price * item.quantity;
  });
  document.getElementById('cartTotal').textContent = `Łącznie: ${formatPrice(total)} zł`;
  document.getElementById('cartCount').textContent = cart.reduce((a,b)=>a+b.quantity,0);
}
function toggleCart() { 
  cartVisible = !cartVisible; 
  const c = document.getElementById('cart'); 
  cartVisible ? c.classList.add('active') : c.classList.remove('active'); 
}

// 🔹 Checkout
function showCheckoutForm() { document.getElementById('cartForm').classList.toggle('hidden'); }
function checkout() { alert('Zamówienie wysłane!'); cart=[]; updateCart(); document.getElementById('cartForm').classList.add('hidden'); }

// 🔹 Newsletter
function showNewsletter() {
  const popup = document.getElementById('newsletterPopup');
  if (localStorage.getItem('newsletterClosed') !== 'true') {
    popup.classList.remove('hidden');
    popup.style.display = 'flex';
    popup.style.pointerEvents = 'auto';
  }
}
function closeNewsletter() { localStorage.setItem('newsletterClosed','true'); const popup=document.getElementById('newsletterPopup'); popup.classList.add('hidden'); popup.style.display='none'; }
function subscribeNewsletter() { alert('Zapisano do newslettera!'); closeNewsletter(); }

// 🔹 Cookies
function acceptCookies() { localStorage.setItem('cookiesAccepted','true'); document.getElementById('cookieBanner').style.display='none'; showNewsletter(); }
function declineCookies() { localStorage.setItem('cookiesAccepted','false'); document.getElementById('cookieBanner').style.display='none'; showNewsletter(); }

// 🔹 Bestsellery
function loadBestsellers() {
  const container = document.getElementById('bestsellers');
  container.innerHTML = '';
  bestsellers.forEach(p => {
    const div = document.createElement('div');
    div.className='bestseller-item';
    div.innerHTML = `
      <img src="${p.image || 'images/placeholder.jpg'}" alt="${escapeHtml(p.name)}">
      <span class="bestseller-label">Bestseller</span>
      <p class="bestseller-name">${escapeHtml(p.name)}</p>
      <p class="bestseller-price">${formatPrice(p.price)} zł</p>
    `;
    div.addEventListener('click',()=>showProductDetail(p));
    container.appendChild(div);
  });
}

// 🔹 Pomocnicze
function formatPrice(num) { return num.toFixed(2); }
function escapeHtml(text){ return text.replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[m]); }
function toggleMenu(){ document.querySelector('nav').classList.toggle('show'); }
