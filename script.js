// 🔹 Supabase
const SUPABASE_URL = 'https://mkvpqnvlzdrujsqkdpmi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rdnBxbnZsemRydWpzcWtkcG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NDc4MDcsImV4cCI6MjA3NTQyMzgwN30.QuCU__UgvzofofS-T5Y-XzdLW7EakZZzh4DwQP4xAnA';

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔹 Dane i koszyk
let productsData = { candles: [], bouquets: [], promotions: [] };
let bestsellers = [];
let cart = [];
let currentProduct = null;
let cartVisible = false;

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
  const buttons = document.querySelectorAll('.categories button');
  buttons.forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.category').forEach(c => c.classList.add('hidden'));
      const cat = btn.dataset.cat;
      document.getElementById(cat).classList.remove('hidden');
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
    div.onclick = () => showProductDetail(p);
    container.appendChild(div);
  });
}

// 🔹 Modal
function showProductDetail(p) {
  currentProduct = p;
  document.getElementById('modalTitle').textContent = p.name;
  document.getElementById('modalImage').src = p.image || p.image2 || 'images/placeholder.jpg';
  document.getElementById('modalDesc').textContent = p.description || '';
  document.getElementById('modalPrice').textContent = `Cena: ${formatPrice(p.price)} zł`;
  document.getElementById('quantity').value = 1;
  document.getElementById('productModal').style.display = 'flex';
}
function closeModal() {
  document.getElementById('productModal').style.display = 'none';
}

// 🔹 Koszyk
function addToCart() {
  const qty = parseInt(document.getElementById('quantity').value);
  if (!currentProduct || qty < 1) return;
  const existing = cart.find(i => i.id === currentProduct.id);
  const itemPrice = Number(currentProduct.price || 0);
  if (existing) existing.quantity += qty;
  else cart.push({ id: currentProduct.id, name: currentProduct.name, price: itemPrice, quantity: qty });
  updateCart();
  closeModal();
  openCart();
}

function updateCart() {
  const list = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  list.innerHTML = '';
  if (cart.length === 0) {
    list.innerHTML = '<li>Twój koszyk jest pusty.</li>';
    totalEl.textContent = 'Łącznie: 0 zł';
  } else {
    let total = 0;
    cart.forEach(item => {
      total += item.price * item.quantity;
      const li = document.createElement('li');
      li.innerHTML = `${escapeHtml(item.name)} x${item.quantity} - ${(item.price * item.quantity).toFixed(2)} zł <button onclick="removeFromCart(${item.id})">🗑️</button>`;
      list.appendChild(li);
    });
    totalEl.textContent = `Łącznie: ${total.toFixed(2)} zł`;
  }
  document.getElementById('cartCount').textContent = cart.length;
  document.getElementById('cartForm').classList.add('hidden');
}

function removeFromCart(id) { cart = cart.filter(i => i.id !== id); updateCart(); }
function toggleCart() {
  const cartEl = document.getElementById('cart');
  cartVisible = !cartVisible;
  cartEl.classList.toggle('active', cartVisible);
  if (cartVisible) cartEl.classList.remove('hidden');
  else setTimeout(() => cartEl.classList.add('hidden'), 400);
}
function openCart() {
  const cartEl = document.getElementById('cart');
  cartEl.classList.remove('hidden');
  cartEl.classList.add('active');
  cartVisible = true;
}
function showCheckoutForm() {
  if (cart.length === 0) { alert("Koszyk jest pusty!"); return; }
  document.getElementById('cartForm').classList.remove('hidden');
}

// 🔹 Bestseller
function loadBestsellers() {
  const container = document.getElementById('bestsellers');
  container.innerHTML = '';
  bestsellers.forEach(p => {
    const div = document.createElement('div');
    div.className = 'bestseller-item';
    div.innerHTML = `
      <img src="${p.image || p.image2 || 'images/placeholder.jpg'}" alt="${escapeHtml(p.name)}">
      <div class="bestseller-label">BESTSELLER</div>
      <div class="bestseller-name">${escapeHtml(p.name)}</div>
      <div class="bestseller-price">${formatPrice(p.price)} zł</div>
    `;
    container.appendChild(div);
  });
}

// 🔹 Utility
function formatPrice(val) { return (Number(val) || 0).toFixed(2); }
function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 🔹 EmailJS - wysyłka zamówienia
emailjs.init("7WfAAPMnAEYw40agp");

function checkout() {
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;
  const address = document.getElementById('address').value;
  const payment = document.getElementById('payment').value;

  if (!name || !phone || !email || !address) return alert('Proszę wypełnić wszystkie pola.');

  const orderDetails = cart.map(i => `${i.name} x${i.quantity}`).join(', ');
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2);

  emailjs.send('service_9hspj2l', 'template_nythj6i', {
    from_name: name,
    from_email: email,
    phone,
    address,
    payment,
    order: orderDetails,
    total: totalPrice
  }).then(() => {
    alert('Zamówienie wysłane!');
    cart = [];
    updateCart();
    document.getElementById('cartForm').classList.add('hidden');
  }).catch(err => {
    console.error('Błąd wysyłki maila:', err);
    alert('Wystąpił błąd podczas wysyłki zamówienia. Spróbuj ponownie.');
  });
}

// 🔹 Inicjalizacja
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('home').classList.remove('hidden');
  loadProductsFromSupabase();
  loadCategories();
  if (localStorage.getItem('cookiesAccepted') === null) document.getElementById('cookieBanner').style.display = 'block';
  document.getElementById('cartToggle').addEventListener('click', toggleCart);
});
