let cart = [];
let currentProduct = null;
let cartVisible = false;
let productsData = {};
let bestsellers = [];

// 🔹 Wczytanie produktów z JSON
fetch('products.json')
  .then(response => response.json())
  .then(data => {
    productsData = data;
    bestsellers = [...productsData.candles, ...productsData.bouquets];
    loadBestsellers();
  })
  .catch(err => console.error('Błąd wczytywania produktów:', err));

// 🔹 Nawigacja
document.querySelectorAll('nav button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('main section').forEach(s=>s.classList.add('hidden'));
    document.getElementById(btn.dataset.target).classList.remove('hidden');
    if(btn.dataset.target==='products') loadCategories();
  });
});

// 🔹 Kategorie produktów
function loadCategories(){
  const buttons = document.querySelectorAll('.categories button');
  buttons.forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelectorAll('.category').forEach(c=>c.innerHTML='');
      const cat = btn.dataset.cat;
      loadProducts(cat);
      document.querySelectorAll('.category').forEach(c=>c.classList.add('hidden'));
      document.getElementById(cat).classList.remove('hidden');
    };
  });
}

// 🔹 Produkty
function loadProducts(cat){
  const container = document.getElementById(cat);
  if(!productsData[cat]) return;
  productsData[cat].forEach(p=>{
    const div = document.createElement('div');
    div.className='product-card';
    if(cat==='promotions'){
      div.innerHTML=`<img src="${p.img1}" alt="${p.name}"><img src="${p.img2}" alt="${p.name}"><h3>${p.name}</h3><p>${p.price} zł</p>`;
    } else div.innerHTML=`<img src="${p.img}" alt="${p.name}"><h3>${p.name}</h3><p>${p.price} zł</p>`;
    div.onclick = ()=>showProductDetail(p, cat);
    container.appendChild(div);
  });
}

// 🔹 Modal
function showProductDetail(p,cat){
  currentProduct = p;
  document.getElementById('modalTitle').textContent = p.name;
  const modalImage = document.getElementById('modalImage');
  if(cat === 'promotions') modalImage.src = p.img1;
  else modalImage.src = p.img;
  modalImage.style.objectFit = 'contain';
  document.getElementById('modalDesc').textContent = p.desc;
  document.getElementById('modalPrice').textContent = `Cena: ${p.price} zł`;
  document.getElementById('quantity').value = 1;
  document.getElementById('productModal').style.display = 'flex';
}
function closeModal(){document.getElementById('productModal').style.display='none';}

// 🔹 Koszyk
function addToCart(){
  const qty = parseInt(document.getElementById('quantity').value);
  if(!currentProduct || qty<1) return;
  const existing = cart.find(i => i.name === currentProduct.name);
  if(existing) existing.quantity += qty;
  else cart.push({name: currentProduct.name, price: currentProduct.price, quantity: qty});
  updateCart();
  closeModal();
  openCart();
}

function updateCart(){
  const list=document.getElementById('cartItems');
  const totalEl=document.getElementById('cartTotal');
  list.innerHTML='';
  if(cart.length===0){ 
    list.innerHTML='<li>Twój koszyk jest pusty.</li>'; 
    totalEl.textContent='Łącznie: 0 zł'; 
  } else {
    let total=0;
    cart.forEach(item=>{
      total+=item.price*item.quantity;
      const li=document.createElement('li');
      li.innerHTML=`${item.name} x${item.quantity} - ${(item.price*item.quantity).toFixed(2)} zł <button onclick="removeFromCart('${item.name}')">🗑️</button>`;
      list.appendChild(li);
    });
    totalEl.textContent=`Łącznie: ${total.toFixed(2)} zł`;
  }
  document.getElementById('cartCount').textContent=cart.length;
  document.getElementById('cartForm').classList.add('hidden');
}

function removeFromCart(name){cart=cart.filter(i=>i.name!==name); updateCart();}

// 🔹 Koszyk wysuwanie
document.getElementById('cartToggle').addEventListener('click', toggleCart);
function toggleCart(){
  const cartEl=document.getElementById('cart');
  cartVisible=!cartVisible;
  cartEl.classList.toggle('active',cartVisible);
  if(cartVisible)cartEl.classList.remove('hidden');
  else setTimeout(()=>cartEl.classList.add('hidden'),400);
}
function openCart(){
  const cartEl=document.getElementById('cart');
  cartEl.classList.remove('hidden');
  cartEl.classList.add('active');
  cartVisible=true;
}
function showCheckoutForm(){
  if(cart.length===0){alert("Koszyk jest pusty!"); return;}
  document.getElementById('cartForm').classList.remove('hidden');
}
function checkout(){
  if(!document.getElementById('name').value ||
     !document.getElementById('phone').value ||
     !document.getElementById('email').value ||
     !document.getElementById('address').value){
    alert('Uzupełnij wszystkie dane!');
    return;
  }
  alert('Zamówienie w przygotowaniu!');
  cart=[];
  updateCart();
  document.getElementById('cartForm').reset();
}

// 🔹 Bestseller – tylko na stronie głównej
function loadBestsellers(){
  const container = document.getElementById('bestsellers');
  container.innerHTML='';
  bestsellers.forEach(p=>{
    const div = document.createElement('div');
    div.className='bestseller-item';
    div.innerHTML=`
      <img src="${p.img}" alt="${p.name}">
      <div class="bestseller-label">BESTSELLER</div>
      <div class="bestseller-name">${p.name}</div>
      <div class="bestseller-price">${p.price} zł</div>
    `;
    container.appendChild(div);
  });
  animateBestsellers();
}

let bsScroll=0;
function animateBestsellers(){
  const bestsellersContainer=document.getElementById('bestsellers');
  if(!bestsellersContainer) return;
  bsScroll-=0.3;
  if(Math.abs(bsScroll) >= bestsellersContainer.scrollWidth/2) bsScroll = 0;
  bestsellersContainer.style.transform=`translateX(${bsScroll}px)`;
  requestAnimationFrame(animateBestsellers);
}

// 🔹 Ciasteczka
function acceptCookies() {
  localStorage.setItem('cookiesAccepted', 'true');
  document.getElementById('cookieBanner').style.display = 'none';
  showNewsletter();
}
function declineCookies() {
  localStorage.setItem('cookiesAccepted', 'false');
  document.getElementById('cookieBanner').style.display = 'none';
  showNewsletter();
}

// 🔹 Newsletter
function showNewsletter() {
  const accepted = localStorage.getItem('cookiesAccepted');
  if(accepted) {
    document.getElementById('newsletterPopup').style.display = 'flex';
  }
}
function closeNewsletter() {
  document.getElementById('newsletterPopup').style.display = 'none';
}
function subscribeNewsletter() {
  const email = document.getElementById('newsletterEmail').value;
  if(!email) { alert('Podaj adres email!'); return; }
  alert(`Dziękujemy! Zapisano ${email} do newslettera.`);
  closeNewsletter();
}

// 🔹 Pokaz banner jeśli nie podjęto decyzji
window.addEventListener('load', ()=>{
  if(localStorage.getItem('cookiesAccepted') === null) {
    document.getElementById('cookieBanner').style.display = 'block';
  }
});

// 🔹 MENU toggle
function toggleMenu(){
  document.querySelector('nav').classList.toggle('show');
}
