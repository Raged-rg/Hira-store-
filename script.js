/* ============================================================
   HIRA ABAYA STORE — script.js
   Premium UX: smooth animations, swipe slider, scroll reveal,
   back button, quick-view modal, lazy loading, RTL full support
   ============================================================ */

'use strict';

const phoneNumber = '9647842272224';
window.hiraProducts = window.hiraProducts || [];
let favorites   = JSON.parse(localStorage.getItem('hira_favorites')) || [];
let hira_cart   = JSON.parse(localStorage.getItem('hira_cart'))      || [];

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    injectModals();
    setupMobileScrollHeader();
    updateCartCounter();
    updateFavCounter();

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });
});

function initPage() {
    const isProductPage = window.location.pathname.includes('product.html');
    if (isProductPage) {
        const params    = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        renderProductDetail(productId);
    } else {
        renderProducts(hiraProducts);
        setupSearch();
        setupScrollReveal();
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay.active, #productModal.active').forEach(m => {
        m.classList.remove('active');
    });
    document.body.style.overflow = '';
}

/* ============================================================
   SMART HEADER — hide on scroll down, show on scroll up
   ============================================================ */
function setupMobileScrollHeader() {
    const header = document.querySelector('header');
    if (!header) return;

    let lastY = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const y = window.scrollY;
                if (window.innerWidth <= 768) {
                    if (y > lastY && y > 80) header.classList.add('hide-on-scroll');
                    else header.classList.remove('hide-on-scroll');
                } else {
                    header.classList.remove('hide-on-scroll');
                }
                lastY = y;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

/* ============================================================
   SCROLL REVEAL — fade + rise on scroll
   ============================================================ */
function setupScrollReveal() {
    const cards = document.querySelectorAll('.product-card');
    if (!cards.length) return;

    // Set initial invisible state
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(24px)';
        card.style.transition = `opacity 0.5s ease ${i * 0.05}s, transform 0.5s ease ${i * 0.05}s`;
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    cards.forEach(card => observer.observe(card));
}

/* ============================================================
   HOME PAGE — RENDER PRODUCTS
   ============================================================ */
function renderProducts(productsToRender) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = '';
    
    // Smooth fade-in effect
    grid.style.opacity = '0';
    requestAnimationFrame(() => {
        grid.style.opacity = '1';
    });

    // Requirement: Show exactly 8 products
    const limitedProducts = productsToRender.slice(0, 8);

    if (!limitedProducts.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:50px;color:#999;">لم يتم العثور على منتجات</div>';
        return;
    }

    limitedProducts.forEach(product => {
        const isFav = favorites.includes(product.id.toString());
        const card  = document.createElement('article');
        card.className = 'product-card';
        card.id = `product-${product.id}`;

        // Requirement: Click opens dedicated page
        card.onclick = () => {
            window.location.href = `product.html?id=${product.id}`;
        };

        card.innerHTML = `
            <div class="product-image-container">
                <div class="product-img-wrapper">
                    <img
                        src="${product.image}"
                        loading="lazy"
                        alt="${product.name}"
                        class="product-img"
                        style="object-position:${(product.imagePositionX !== undefined && product.imagePositionX !== null) ? product.imagePositionX : 50}% ${(product.imagePositionY !== undefined && product.imagePositionY !== null) ? product.imagePositionY : 50}%;transform:scale(${product.imageScale || 1});"
                        onerror="this.src='https://via.placeholder.com/400x600?text=لا+توجد+صورة'"
                    >
                </div>
                <button class="favorite-btn ${isFav ? 'active' : ''}"
                    onclick="toggleFavorite(event,'${product.id}',this)"
                    aria-label="أضف للمفضلة">
                    <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">${product.price} د.ع</div>
            </div>
        `;
        grid.appendChild(card);
    });

    setupScrollReveal();
}

function filterByPrice(min, max) {
    const products = window.hiraProducts || [];
    let filtered = products;
    if (min !== undefined && max !== undefined) {
        filtered = products.filter(p => {
            const price = parseInt(p.price.toString().replace(/,/g, ''));
            return price >= min && price <= max;
        });
    } else if (min !== undefined) {
        filtered = products.filter(p => {
            const price = parseInt(p.price.toString().replace(/,/g, ''));
            return price >= min;
        });
    }
    renderProducts(filtered);
    
    // Update UI active state
    if (typeof event !== 'undefined' && event && event.currentTarget) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');
    }
}

function setupSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.addEventListener('input', e => {
        const q = e.target.value.toLowerCase().trim();
        const products = window.hiraProducts || [];
        renderProducts(q ? products.filter(p => p.name.toLowerCase().includes(q)) : products);
    });
}

/* ============================================================
   PRODUCT DETAIL PAGE
   ============================================================ */
function renderProductDetail(productId) {
    const container = document.getElementById('product-detail');
    if (!container) return;

    // Reset selection state
    selectedDetailSize = null;

    const products = window.hiraProducts || [];
    const product = products.find(p => p.id.toString() === productId);
    if (!product) {
        container.innerHTML = '<div class="error-msg" style="text-align:center;padding:100px 20px;">المنتج غير موجود. <br><a href="index.html" class="btn-primary" style="display:inline-block;margin-top:20px;">العودة للمتجر</a></div>';
        return;
    }

    // Collect images
    let images = (product.images && product.images.length) ? product.images : [product.image];

    // Size buttons HTML
    const sizesArr = (product.sizes && product.sizes.length) ? product.sizes : ['52','54','56','58','60'];
    const sizeBtns = sizesArr.map(s =>
        `<button type="button" onclick="selectSizeDetail(this)">${s}</button>`
    ).join('');

    // Slider HTML
    const slidesHTML = images.map((img, i) =>
        `<img src="${img}" class="slider-slide ${i===0?'active':''}" alt="${product.name}" loading="${i===0?'eager':'lazy'}" onclick="openZoomDetail()">`
    ).join('');

    const thumbsHTML = images.length > 1
        ? images.map((img, i) =>
            `<img src="${img}" class="thumbnail-item ${i===0?'active':''}" loading="lazy" onclick="setDetailSlide(${i})" alt="صورة ${i+1}">`
          ).join('')
        : '';

    const navBtns = images.length > 1 ? `
        <button id="detailPrevBtn" class="slider-nav-btn" onclick="prevDetailSlide()" aria-label="السابق">&#10094;</button>
        <button id="detailNextBtn" class="slider-nav-btn detail-next" onclick="nextDetailSlide()" aria-label="التالي">&#10095;</button>
        <div class="slider-dots" id="detailDots">
            ${images.map((_,i) => `<div class="slider-dot ${i===0?'active':''}" onclick="setDetailSlide(${i})"></div>`).join('')}
        </div>
    ` : '';

    container.innerHTML = `
        <div class="product-detail-image">
            <div class="slider-container" id="detailSliderContainer">
                <div class="slider-inner" id="detailSliderInner">
                    ${slidesHTML}
                </div>
                ${navBtns}
            </div>
            ${thumbsHTML ? `<div class="thumbnails-container" id="detailThumbnails">${thumbsHTML}</div>` : ''}
        </div>
        <div class="product-detail-info">
            <a href="index.html" class="back-btn" aria-label="رجوع">
                <i class="fa fa-arrow-right"></i>
                <span>رجوع</span>
            </a>
            <h1>${product.name}</h1>
            <div class="price">${product.price} د.ع</div>
            <p class="description">${product.description.replace(/\n/g,'<br>')}</p>
            <span class="size-label">اختاري المقاس:</span>
            <div class="size-selector" id="detail-size-selector" data-product-id="${product.id}">
                ${sizeBtns}
            </div>
            <div class="size-guide-text">القياسات بالأرقام وتمثل طول العباية بالسنتيمتر</div>
            <button class="btn-primary" onclick="addToCartDetail('${product.id}','${product.name}','${product.price}','${product.image}')">
                <i class="fa fa-shopping-cart" style="margin-left:8px;"></i>
                أضف إلى السلة
            </button>
        </div>
    `;

    // Animate detail page in
    requestAnimationFrame(() => {
        container.style.opacity = '0';
        container.style.transform = 'translateY(14px)';
        container.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        requestAnimationFrame(() => {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        });
    });

    // Init slider state
    window.currentDetailIndex  = 0;
    window.currentDetailImages = images;

    // Touch swipe on detail slider
    const sliderEl = document.getElementById('detailSliderContainer');
    if (sliderEl) setupSwipe(sliderEl, nextDetailSlide, prevDetailSlide);
}

/* --- Detail Slider --- */
function updateDetailSlider(direction) {
    const slides    = document.querySelectorAll('#detailSliderInner .slider-slide');
    const thumbs    = document.querySelectorAll('#detailThumbnails .thumbnail-item');
    const dots      = document.querySelectorAll('#detailDots .slider-dot');
    const idx       = window.currentDetailIndex;

    slides.forEach((s, i) => {
        s.classList.toggle('active', i === idx);
    });
    thumbs.forEach((t, i) => t.classList.toggle('active', i === idx));
    dots.forEach((d, i)   => d.classList.toggle('active', i === idx));
}

function nextDetailSlide() {
    if (!window.currentDetailImages || window.currentDetailImages.length <= 1) return;
    window.currentDetailIndex = (window.currentDetailIndex + 1) % window.currentDetailImages.length;
    updateDetailSlider('next');
}
function prevDetailSlide() {
    if (!window.currentDetailImages || window.currentDetailImages.length <= 1) return;
    window.currentDetailIndex = (window.currentDetailIndex - 1 + window.currentDetailImages.length) % window.currentDetailImages.length;
    updateDetailSlider('prev');
}
function setDetailSlide(index) {
    window.currentDetailIndex = index;
    updateDetailSlider();
}

function openZoomDetail() {
    const img = window.currentDetailImages && window.currentDetailImages[window.currentDetailIndex];
    if (!img) return;
    const overlay = document.getElementById('zoomOverlay');
    const zImg    = document.getElementById('zoomedImage');
    if (overlay && zImg) {
        zImg.src = img;
        overlay.style.display = 'flex';
        requestAnimationFrame(() => overlay.style.opacity = '1');
    }
}

let selectedDetailSize = null;
function selectSizeDetail(btn) {
    Array.from(btn.parentElement.children).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedDetailSize = btn.innerText;
}

function addToCartDetail(id, name, price, image) {
    if (!selectedDetailSize) {
        showCustomAlert('يرجى اختيار القياس قبل المتابعة', 'اختار القياس', 'حسنًا');
        return;
    }
    pushToCart(id, name, price, selectedDetailSize, image);
    triggerCardPop(id);
}

/* ============================================================
   SHARED HELPERS
   ============================================================ */
function selectSize(event, btn) {
    event.stopPropagation();
    Array.from(btn.parentElement.children).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function selectModalSize(btn, size) {
    Array.from(btn.parentElement.children).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('sizeSelect').value = size;
}

function addToCart(event, id, name, price, image) {
    if (event) event.stopPropagation();

    // Find size selector in same card
    let size = null;
    if (event) {
        const card     = event.target.closest('.product-card');
        const selector = card ? card.querySelector('.size-selector') : null;
        const sel      = selector ? selector.querySelector('.selected') : null;
        if (sel) size = sel.innerText;
    }

    if (!size) {
        showCustomAlert('يرجى اختيار القياس قبل المتابعة', 'اختار القياس', 'حسنًا');
        return;
    }

    pushToCart(id, name, price, size, image);
    triggerCardPop(id);
}

function pushToCart(id, name, price, size, image) {
    const parsed   = parseInt(price) || 0;
    const existing = hira_cart.find(i => i.id === id && i.size === size);
    if (existing) {
        existing.quantity += 1;
    } else {
        hira_cart.push({ id, name, price: parsed, size, image, quantity: 1 });
    }
    saveCart();
    showToast('تمت الإضافة إلى السلة ✓', true);
}

function toggleFavorite(event, id, btn) {
    event.stopPropagation();
    event.preventDefault();
    const idx  = favorites.indexOf(id.toString());
    const icon = btn.querySelector('i');

    if (idx > -1) {
        favorites.splice(idx, 1);
        btn.classList.remove('active');
        icon.className = 'fa-regular fa-heart';
        showToast('تمت الإزالة من المفضلة');
    } else {
        favorites.push(id.toString());
        btn.classList.add('active');
        icon.className = 'fa-solid fa-heart';
        showToast('تمت الإضافة للمفضلة ❤️', true);
        triggerCardPop(id);
    }
    localStorage.setItem('hira_favorites', JSON.stringify(favorites));
    updateFavCounter();
}

function triggerCardPop(id) {
    const card = document.getElementById(`product-${id}`);
    if (!card) return;
    card.classList.remove('tap-pop');
    void card.offsetWidth;
    card.classList.add('tap-pop');
}

/* ============================================================
   FAVORITES MODAL
   ============================================================ */
function updateFavCounter() {
    document.querySelectorAll('.fav-badge').forEach(b => b.innerText = favorites.length);
}

function openFavModal() {
    renderFavItems();
    openModal('fav-modal-overlay');
}
function closeFavModal(event) {
    if (shouldCloseModal(event)) closeModal('fav-modal-overlay');
}

function renderFavItems() {
    const container = document.getElementById('fav-items');
    if (!container) return;
    container.innerHTML = '';

    if (!favorites.length) {
        container.innerHTML = '<div class="empty-cart-msg"><i class="fa-regular fa-heart" style="font-size:32px;display:block;margin-bottom:10px;"></i>لا توجد منتجات مفضلة حالياً</div>';
        return;
    }

    favorites.forEach(id => {
        const p = hiraProducts.find(p => p.id.toString() === id.toString());
        if (!p) return;

        const sizes = (p.sizes && p.sizes.length) ? p.sizes : ['52','54','56','58','60'];
        const sizeBtns = sizes.map(s => `<button type="button" onclick="selectSize(event,this)">${s}</button>`).join('');

        container.innerHTML += `
            <div class="cart-item" id="fav-row-${p.id}">
                <div class="cart-item-thumb" onclick="closeFavModal();setTimeout(()=>openProductModal('${p.id}'),120);">
                    <img src="${p.image}" loading="lazy" class="cart-item-img" style="object-position:${p.imagePositionX||50}% ${p.imagePositionY||50}%;">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${p.name}</div>
                    <div class="cart-item-price">${p.price} د.ع</div>
                    <div class="fav-item-actions">
                        <div class="fav-item-size-selector" id="fav-size-${p.id}">${sizeBtns}</div>
                        <button class="btn-fav-add" onclick="addFromFav('${p.id}','${p.name}','${p.price}','${p.image}')">أضف للسلة</button>
                    </div>
                </div>
                <button class="remove-cart-item" onclick="removeFavoriteDirectly('${p.id}')" aria-label="حذف"><i class="fa fa-times"></i></button>
            </div>
        `;
    });
}

function addFromFav(id, name, price, image) {
    const sel = document.querySelector(`#fav-size-${id} .selected`);
    if (!sel) { showCustomAlert('يرجى اختيار القياس', 'اختار القياس', 'حسنًا'); return; }
    pushToCart(id, name, price, sel.innerText, image);
}

function removeFavoriteDirectly(id) {
    const idx = favorites.indexOf(id.toString());
    if (idx > -1) {
        favorites.splice(idx, 1);
        localStorage.setItem('hira_favorites', JSON.stringify(favorites));
        updateFavCounter();
        renderFavItems();
        // Sync hearts on grid
        const heartBtn = document.querySelector(`#product-${id} .favorite-btn`);
        if (heartBtn) {
            heartBtn.classList.remove('active');
            heartBtn.querySelector('i').className = 'fa-regular fa-heart';
        }
    }
}

/* ============================================================
   CART MODAL
   ============================================================ */
function updateCartCounter() {
    const count = hira_cart.reduce((s, i) => s + i.quantity, 0);
    document.querySelectorAll('.cart-badge').forEach(b => b.innerText = count);
}

function saveCart() {
    localStorage.setItem('hira_cart', JSON.stringify(hira_cart));
    updateCartCounter();
}

function openCartModal() {
    renderCartItems();
    openModal('cart-modal-overlay');
}
function closeCartModal(event) {
    if (shouldCloseModal(event)) closeModal('cart-modal-overlay');
}

function renderCartItems() {
    const container = document.getElementById('cart-items');
    const totalEl   = document.getElementById('cart-total-price');
    if (!container) return;
    container.innerHTML = '';

    if (!hira_cart.length) {
        container.innerHTML = '<div class="empty-cart-msg"><i class="fa fa-shopping-cart" style="font-size:32px;display:block;margin-bottom:10px;"></i>السلة فارغة حالياً</div>';
        if (totalEl) totalEl.innerText = '0 د.ع';
        return;
    }

    let total = 0;
    hira_cart.forEach((item, index) => {
        total += item.price * item.quantity;
        const p     = hiraProducts.find(p => p.id.toString() === item.id.toString());
        const posX  = (p && p.imagePositionX !== undefined && p.imagePositionX !== null) ? p.imagePositionX : 50;
        const posY  = (p && p.imagePositionY !== undefined && p.imagePositionY !== null) ? p.imagePositionY : 50;

        container.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-thumb">
                    <img src="${item.image}" loading="lazy" class="cart-item-img" style="object-position:${posX}% ${posY}%;">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${item.price} د.ع</div>
                    <div class="cart-item-size">المقاس: ${item.size}</div>
                </div>
                <div class="cart-item-actions">
                    <button class="remove-cart-item" onclick="removeFromCart(${index})" aria-label="حذف"><i class="fa fa-trash"></i></button>
                    <div class="quantity-controls">
                        <button onclick="updateQuantity(${index},1)">+</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${index},-1)">−</button>
                    </div>
                </div>
            </div>
        `;
    });
    if (totalEl) totalEl.innerText = total.toLocaleString('ar-IQ') + ' د.ع';
}

function updateQuantity(index, change) {
    hira_cart[index].quantity += change;
    if (hira_cart[index].quantity <= 0) hira_cart.splice(index, 1);
    saveCart();
    renderCartItems();
}
function removeFromCart(index) {
    hira_cart.splice(index, 1);
    saveCart();
    renderCartItems();
}

function openCheckoutFromCart() {
    if (!hira_cart.length) { showCustomAlert('السلة فارغة.'); return; }
    closeCartModal();

    const panel = document.getElementById('order-summary-panel');
    if (panel) {
        const total = hira_cart.reduce((s,i) => s + i.price*i.quantity, 0);
        const count = hira_cart.reduce((s,i) => s + i.quantity, 0);
        panel.innerHTML = `
            <div style="text-align:right;">
                <strong>عدد المنتجات:</strong> ${count}<br>
                <strong>المجموع الكلي:</strong> <span style="color:var(--matte-gold);font-weight:700;">${total.toLocaleString('ar-IQ')} د.ع</span>
            </div>
        `;
    }
    setTimeout(() => openModal('order-form-overlay'), 150);
}

/* ============================================================
   SLIDER HELPERS
   ============================================================ */

// Slider state for quick-view modal
let currentIndex  = 0;
let currentImages = [];
let autoSliderInterval = null;
let zoomScale = 1;
let panX = 0;
let panY = 0;
let isZoomed = false;

function resetZoom() {
    zoomScale = 1;
    panX = 0;
    panY = 0;
    isZoomed = false;
    document.querySelectorAll('#sliderInner .slider-slide').forEach(img => {
        img.style.transform = '';
        img.style.transition = '';
        img.style.cursor = '';
    });
}

function resetAutoSlider() {
    clearInterval(autoSliderInterval);
    if (currentImages.length > 1) {
        autoSliderInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % currentImages.length;
            updateSlider();
        }, 7000);
    }
}

function initSlider(images) {
    currentImages = images.slice(0, 10); // Allow up to 10 images instead of 4
    currentIndex  = 0;

    // Build slides inside slider-inner
    const inner = document.getElementById('sliderInner');
    if (inner) {
        inner.innerHTML = currentImages.map((img, i) =>
            `<img src="${img}" class="slider-slide ${i===0?'active':''}" loading="${i===0?'eager':'lazy'}" alt="صورة المنتج">`
        ).join('');
        // Swipe on modal slider
        setupSwipe(inner, nextSlide, prevSlide);
    }

    renderThumbnails();
    updateSliderNav();
    resetAutoSlider();
}

function updateSlider() {
    const slides = document.querySelectorAll('#sliderInner .slider-slide');
    const dots   = document.querySelectorAll('#modalDots .slider-dot');
    const idx    = currentIndex;

    slides.forEach((s, i) => {
        s.classList.toggle('active', i === idx);
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));

    // Sync thumbnails
    const container = document.getElementById('thumbnails');
    if (container) {
        Array.from(container.children).forEach((t, i) => t.classList.toggle('active', i === currentIndex));
    }
    resetZoom();
}

function updateSliderNav() {
    const navArea = document.getElementById('modalNavArea');
    if (!navArea) return;
    if (currentImages.length <= 1) {
        navArea.style.display = 'none';
    } else {
        navArea.style.display = 'block';
        navArea.innerHTML = `
            <button id="prevBtn" class="slider-nav-btn" onclick="prevSlide()" aria-label="السابق">&#10094;</button>
            <button id="nextBtn" class="slider-nav-btn detail-next" onclick="nextSlide()" aria-label="التالي">&#10095;</button>
            <div class="slider-dots" id="modalDots">
                ${currentImages.map((_,i) => `<div class="slider-dot ${i===0?'active':''}" onclick="goToSlide(${i})"></div>`).join('')}
            </div>
        `;
    }
}

function nextSlide() {
    if (!currentImages.length) return;
    currentIndex = (currentIndex + 1) % currentImages.length;
    updateSlider();
    resetAutoSlider();
}
function prevSlide() {
    if (!currentImages.length) return;
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    updateSlider();
    resetAutoSlider();
}
function goToSlide(i) {
    currentIndex = i;
    updateSlider();
    resetAutoSlider();
}

function renderThumbnails() {
    const container = document.getElementById('thumbnails');
    if (!container) return;
    container.innerHTML = '';
    if (currentImages.length <= 1) { container.style.display = 'none'; return; }
    container.style.display = 'flex';

    currentImages.forEach((img, i) => {
        const t = document.createElement('img');
        t.src = img;
        t.loading = 'lazy';
        t.className = `thumbnail-item ${i===currentIndex?'active':''}`;
        t.alt = `صورة ${i+1}`;
        t.onclick = () => { 
            currentIndex = i; 
            updateSlider(); 
            resetAutoSlider(); 
        };
        container.appendChild(t);
    });
}



function closeZoom() {
    const z = document.getElementById('zoomOverlay');
    if (z) { z.style.opacity='0'; setTimeout(()=>z.style.display='none',200); }
}


/* ============================================================
   ORDER / CHECKOUT
   ============================================================ */
function closeOrderForm(event) {
    if (shouldCloseModal(event)) closeModal('order-form-overlay');
}

function submitOrder(event) {
    event.preventDefault();
    if (!hira_cart.length) { showCustomAlert('السلة فارغة. عد للتسوق أولاً.'); return; }

    const name     = document.getElementById('order-name').value.trim();
    const phone    = document.getElementById('order-phone').value.trim();
    const gov      = document.getElementById('order-gov').value;
    const address  = document.getElementById('order-address').value.trim();
    const landmark = document.getElementById('order-landmark').value.trim();

    if (!name||!phone||!gov||!address||!landmark) {
        showCustomAlert('الرجاء ملء جميع الحقول المطلوبة.');
        return;
    }

    const successMsg = document.getElementById('order-success-msg');
    const btn        = document.querySelector('#checkout-form button[type="submit"]');
    if (successMsg) successMsg.style.display = 'block';
    if (btn) btn.disabled = true;

    setTimeout(() => {
        sendWhatsAppDetailed({ name, phone, gov, address, landmark });
        hira_cart = [];
        saveCart();
        closeOrderForm();
        document.getElementById('checkout-form').reset();
        if (successMsg) successMsg.style.display = 'none';
        if (btn) btn.disabled = false;
    }, 1500);
}

function sendWhatsAppDetailed(info) {
    let msg = `طلب جديد 🛍️\n\nالمنتجات:\n`;
    let totalItems = 0, totalPrice = 0;

    hira_cart.forEach(item => {
        let imgUrl = (item.image||'').trim();
        if (imgUrl.includes('ibb.co') && !imgUrl.includes('i.ibb.co'))
            imgUrl = imgUrl.replace('ibb.co','i.ibb.co');
        try { imgUrl = new URL(imgUrl, window.location.href).href; } catch(e){}

        msg += `• ${item.name}\n  السعر: ${item.price} د.ع | القياس: ${item.size} | الكمية: ${item.quantity}\n  الصورة: ${imgUrl}\n\n`;
        totalItems += item.quantity;
        totalPrice += item.price * item.quantity;
    });

    msg += `📊 المجموع:\nعدد القطع: ${totalItems}\nالإجمالي: ${totalPrice.toLocaleString('ar-IQ')} د.ع\n\n`;
    msg += `👤 معلومات الزبون:\nالاسم: ${info.name}\nالهاتف: ${info.phone}\nالمحافظة: ${info.gov}\nالعنوان: ${info.address}\nأقرب نقطة: ${info.landmark}`;

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */
function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active');
    document.body.style.overflow = '';
}
function shouldCloseModal(event) {
    if (!event) return true;
    return event.target === event.currentTarget || event.target.classList.contains('modal-close');
}

/* ============================================================
   TOUCH SWIPE HELPER
   ============================================================ */
function setupSwipe(el, onLeft, onRight) {
    if (!el) return;
    let startX = 0, startY = 0;
    let currentPanX = 0, currentPanY = 0;
    let initialDist = 0;
    let initialScale = 1;

    el.addEventListener('touchstart', e => {
        if (e.touches.length === 2) {
            initialDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialScale = zoomScale;
            clearInterval(autoSliderInterval);
        } else if (e.touches.length === 1) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            currentPanX = panX;
            currentPanY = panY;
            
            if (isZoomed) {
                const img = el.querySelector('.slider-inner .slider-slide.active');
                if (img) img.style.transition = 'none'; // smooth drag without transition lag
                clearInterval(autoSliderInterval);
            }
        }
    }, { passive: false });

    el.addEventListener('touchmove', e => {
        if (e.touches.length === 2) {
            e.preventDefault(); // prevent native page pinch zoom
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            zoomScale = Math.max(1, Math.min(initialScale * (dist / initialDist), 3.0));
            isZoomed = zoomScale > 1;
            const img = el.querySelector('.slider-inner .slider-slide.active');
            if (img) {
                img.style.transition = 'none';
                img.style.transform = `scale(${zoomScale}) translate(${panX}px, ${panY}px)`;
                img.style.cursor = isZoomed ? 'zoom-out' : 'zoom-in';
            }
        } else if (e.touches.length === 1 && isZoomed) {
            e.preventDefault(); // prevent scroll while panning
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            panX = currentPanX + (dx / zoomScale);
            panY = currentPanY + (dy / zoomScale);
            
            // Limit pan bounds so image doesn't fly off screen (allow more freedom)
            const maxPanX = (el.clientWidth / 1.5) * (zoomScale - 1) / zoomScale;
            const maxPanY = (el.clientHeight / 1.5) * (zoomScale - 1) / zoomScale;
            panX = Math.max(-maxPanX, Math.min(panX, maxPanX));
            panY = Math.max(-maxPanY, Math.min(panY, maxPanY));

            const img = el.querySelector('.slider-inner .slider-slide.active');
            if (img) {
                img.style.transform = `scale(${zoomScale}) translate(${panX}px, ${panY}px)`;
            }
        }
    }, { passive: false });

    el.addEventListener('touchend', e => {
        if (e.changedTouches.length === 1 && !isZoomed) {
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) {
                if (dx < 0) onLeft();
                else        onRight();
            }
        } else if (isZoomed) {
            const img = el.querySelector('.slider-inner .slider-slide.active');
            if (img) img.style.transition = 'transform 0.3s ease-in-out';
        }
    }, { passive: true });
}

/* ============================================================
   INJECT MODALS INTO DOM (called once on DOMContentLoaded)
   ============================================================ */
function injectModals() {
    if (document.getElementById('order-form-overlay')) return;

    const html = `
    <!-- Toast -->
    <div id="toast-container" class="toast-message">
        <i id="toast-icon" class="fa fa-check-circle"></i>
        <span id="toast-text"></span>
    </div>

    <!-- Custom Alert -->
    <div id="custom-alert-overlay" class="modal-overlay" onclick="closeCustomAlert()">
        <div class="modal-content custom-alert-content" onclick="event.stopPropagation()">
            <h3 id="custom-alert-title" class="custom-alert-title" style="display:none;"></h3>
            <div id="custom-alert-icon" style="display:none;"></div>
            <p id="custom-alert-message" class="custom-alert-message"></p>
            <button id="custom-alert-btn" class="btn-primary custom-alert-btn" onclick="closeCustomAlert()">موافق</button>
        </div>
    </div>

    <!-- Favorites Modal -->
    <div id="fav-modal-overlay" class="modal-overlay" onclick="closeFavModal(event)">
        <div class="cart-modal-content modal-content" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="closeFavModal()" aria-label="إغلاق"><i class="fa fa-times"></i></button>
            <h2 class="modal-title">المفضلة <i class="fa-solid fa-heart" style="color:var(--matte-gold);"></i></h2>
            <div id="fav-items" class="cart-items-container"></div>
            <div class="cart-summary">
                <button class="btn-secondary" onclick="closeFavModal()">متابعة التسوق</button>
            </div>
        </div>
    </div>

    <!-- Cart Modal -->
    <div id="cart-modal-overlay" class="modal-overlay" onclick="closeCartModal(event)">
        <div class="cart-modal-content modal-content" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="closeCartModal()" aria-label="إغلاق"><i class="fa fa-times"></i></button>
            <h2 class="modal-title">سلة المشتريات</h2>
            <div id="cart-items" class="cart-items-container"></div>
            <div class="cart-summary">
                <div class="cart-total-row">
                    <span>المجموع:</span>
                    <span id="cart-total-price">0 د.ع</span>
                </div>
                <button class="btn-primary" onclick="openCheckoutFromCart()">إتمام الطلب</button>
                <button class="btn-secondary" onclick="closeCartModal()">متابعة التسوق</button>
            </div>
        </div>
    </div>


    <!-- Zoom Overlay -->
    <div id="zoomOverlay" onclick="closeZoom()" style="opacity:0;transition:opacity 0.2s;">
        <img id="zoomedImage" alt="تكبير الصورة">
    </div>

    <!-- Order Form Modal -->
    <div id="order-form-overlay" class="modal-overlay" onclick="closeOrderForm(event)">
        <div class="modal-content order-modal-content" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="closeOrderForm()" aria-label="إغلاق"><i class="fa fa-times"></i></button>
            <h2 class="modal-title">إتمام الطلب</h2>
            <div class="order-summary" id="order-summary-panel"></div>
            <form id="checkout-form" onsubmit="submitOrder(event)">
                <div class="form-group">
                    <label>الاسم الكامل <span class="required">*</span></label>
                    <input type="text" id="order-name" placeholder="أدخل اسمك الكامل" required autocomplete="name">
                </div>
                <div class="form-group">
                    <label>رقم الهاتف <span class="required">*</span></label>
                    <input type="tel" id="order-phone" placeholder="مثال: 078xxxxxxx" required autocomplete="tel">
                </div>
                <div class="form-group">
                    <label>المحافظة <span class="required">*</span></label>
                    <select id="order-gov" required>
                        <option value="">اختر المحافظة...</option>
                        <option>بغداد</option><option>البصرة</option><option>نينوى</option>
                        <option>أربيل</option><option>النجف</option><option>كربلاء</option>
                        <option>كركوك</option><option>الأنبار</option><option>ديالى</option>
                        <option>بابل</option><option>ميسان</option><option>ذي قار</option>
                        <option>الديوانية</option><option>المثنى</option><option>واسط</option>
                        <option>السليمانية</option><option>دهوك</option><option>حلبجة</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>العنوان التفصيلي <span class="required">*</span></label>
                    <input type="text" id="order-address" placeholder="المنطقة، المحلة، الزقاق، الدار..." required>
                </div>
                <div class="form-group">
                    <label>أقرب نقطة دالة <span class="required">*</span></label>
                    <input type="text" id="order-landmark" placeholder="مثال: قرب مدرسة، أو جامع، أو مطعم..." required>
                </div>
                <button type="submit" class="btn-primary submit-order-btn">تأكيد وإرسال الطلب</button>
                <div id="order-success-msg" style="display:none;color:#25D366;text-align:center;margin-top:14px;font-weight:600;">
                    <i class="fa fa-check-circle"></i> تم تأكيد طلبك! جاري تحويلك لواتساب...
                </div>
            </form>
        </div>
    </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
}

/* ============================================================
   TOAST & CUSTOM ALERT
   ============================================================ */
let _toastTimer;
function showToast(message, isSuccess = false) {
    const toast    = document.getElementById('toast-container');
    const textEl   = document.getElementById('toast-text');
    const iconEl   = document.getElementById('toast-icon');
    if (!toast || !textEl) return;

    textEl.innerText   = message;
    iconEl.className   = isSuccess ? 'fa fa-check-circle' : 'fa fa-info-circle';
    iconEl.style.color = isSuccess ? '#25D366' : '#ddd';

    toast.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function showCustomAlert(message, title='', buttonText='موافق', isSuccess=false) {
    const msgEl   = document.getElementById('custom-alert-message');
    const titleEl = document.getElementById('custom-alert-title');
    const btnEl   = document.getElementById('custom-alert-btn');
    const iconEl  = document.getElementById('custom-alert-icon');
    if (!msgEl) return;

    msgEl.innerText = message;
    titleEl.style.display = title ? 'block' : 'none';
    if (title) titleEl.innerText = title;
    if (btnEl) btnEl.innerText = buttonText;

    if (iconEl) {
        iconEl.style.display = isSuccess ? 'block' : 'none';
        if (isSuccess) iconEl.innerHTML = '<i class="fa fa-check-circle" style="color:#25D366;font-size:36px;display:block;margin-bottom:8px;"></i>';
    }

    openModal('custom-alert-overlay');
}
function closeCustomAlert() { closeModal('custom-alert-overlay'); }
