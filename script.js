const phoneNumber = '9647842272224';
window.hiraProducts = window.hiraProducts || [];
let favorites = JSON.parse(localStorage.getItem('hira_favorites')) || [];
let hira_cart = JSON.parse(localStorage.getItem('hira_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    injectModals();
    setupMobileScrollHeader();
    updateCartCounter();
    updateFavCounter();

    // ESC key to close active modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                modal.classList.remove('active');
            });
            document.body.style.overflow = '';
        }
    });
});

function initPage() {
    // hiraProducts is populated from Firebase now
    const isProductPage = window.location.pathname.includes('product.html');

    if (isProductPage) {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        renderProductDetail(productId);
    } else {
        renderProducts(hiraProducts);
        setupSearch();
    }
}

// --- High-End Mobile UX: Smart Header Scroll ---
function setupMobileScrollHeader() {
    let lastScrollY = window.scrollY;
    const header = document.querySelector('header');

    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.innerWidth <= 768) {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                header.classList.add('hide-on-scroll');
            } else if (currentScrollY < lastScrollY) {
                header.classList.remove('hide-on-scroll');
            }
            lastScrollY = currentScrollY;
        } else {
            header.classList.remove('hide-on-scroll');
        }
    }, { passive: true });
}

// --- Home Page Functions ---

function renderProducts(productsToRender) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (productsToRender.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #777;">لم يتم العثور على منتجات</div>';
        return;
    }

    productsToRender.forEach(product => {
        const isFav = favorites.includes(product.id.toString());

        const card = document.createElement('article');
        card.className = 'product-card';
        card.id = `product-${product.id}`;
        card.setAttribute('onclick', `openProductModal('${product.id}')`);
        card.innerHTML = `
            <div class="product-image-container">
                <div class="product-img-wrapper">
                    <img src="${product.image}" loading="lazy" alt="${product.name}" class="product-img" style="object-position: ${product.imagePositionX || 50}% ${product.imagePositionY || 50}%; transform: scale(${product.imageScale || 1});" onerror="this.src='https://via.placeholder.com/400x600?text=لا+توجد+صورة'">
                </div>
                <button class="favorite-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, '${product.id}', this)">
                    <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">${product.price} د.ع</div>
                <div class="size-selector" data-product-id="${product.id}">
                    <button type="button" onclick="selectSize(event, this)">52</button>
                    <button type="button" onclick="selectSize(event, this)">54</button>
                    <button type="button" onclick="selectSize(event, this)">56</button>
                    <button type="button" onclick="selectSize(event, this)">58</button>
                    <button type="button" onclick="selectSize(event, this)">60</button>
                </div>
                <button class="btn-primary" onclick="addToCart(event, '${product.id}', '${product.name}', '${product.price}', '${product.image}')">أضف إلى السلة</button>
                <a href="product.html?id=${product.id}" class="btn-secondary">التفاصيل</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = hiraProducts.filter(p => p.name.toLowerCase().includes(query));
        renderProducts(filtered);
    });
}

// --- Product Detail Page Functions ---

function renderProductDetail(productId) {
    const container = document.getElementById('product-detail');
    if (!container) return;

    const product = hiraProducts.find(p => p.id.toString() === productId);

    if (!product) {
        container.innerHTML = '<div class="error-msg">المنتج غير موجود.</div>';
        return;
    }

    let images = [];
    if(product.images && Array.isArray(product.images) && product.images.length > 0) {
        images = product.images;
    } else if (product.image) {
        images = [product.image];
    }

    container.innerHTML = `
        <div class="product-detail-image">
            <div class="slider-container" style="height: 500px; border-radius: 12px; overflow: hidden; position: relative;">
                <button id="detailPrevBtn" class="slider-nav-btn" onclick="prevDetailSlide()" style="right: 10px; left: auto;">&#10094;</button>
                <img id="detailSliderImage" src="${images[0]}" alt="${product.name}" style="width:100%; height:100%; object-fit:cover; object-position: ${product.imagePositionX || 50}% ${product.imagePositionY || 50}%; transform: scale(${product.imageScale || 1});" onclick="openZoomDetail()">
                <button id="detailNextBtn" class="slider-nav-btn" onclick="nextDetailSlide()" style="left: 10px; right: auto;">&#10095;</button>
            </div>
            <div id="detailThumbnails" class="thumbnails-container" style="display: flex; gap: 10px; margin-top: 15px; justify-content: center;">
                ${images.map((img, idx) => `<img src="${img}" class="thumbnail-item ${idx === 0 ? 'active' : ''}" onclick="setDetailSlide(${idx})">`).join('')}
            </div>
        </div>
        <div class="product-detail-info">
            <h1>${product.name}</h1>
            <div class="price">${product.price} د.ع</div>
            <p class="description">${product.description.replace(/\n/g, '<br>')}</p>
            
            <span class="size-label">اختاري المقاس:</span>
            <div class="size-selector" id="detail-size-selector" data-product-id="${product.id}">
                <button type="button" onclick="selectSizeDetail(this)">52</button>
                <button type="button" onclick="selectSizeDetail(this)">54</button>
                <button type="button" onclick="selectSizeDetail(this)">56</button>
                <button type="button" onclick="selectSizeDetail(this)">58</button>
                <button type="button" onclick="selectSizeDetail(this)">60</button>
            </div>
            <div class="size-guide-text" style="font-size: 13px; color: #888; text-align: center; margin-bottom: 20px;">القياسات بالأرقام وتمثل طول العباية بالسنتيمتر</div>
            
            <button class="btn-primary" onclick="addToCartDetail('${product.id}', '${product.name}', '${product.price}', '${product.image}')">
                أضف إلى السلة
            </button>
        </div>
    `;

    // Initialize Detail Slider State
    window.currentDetailIndex = 0;
    window.currentDetailImages = images;
    
    // Add touch support for detail slider
    const detailSlider = document.getElementById("detailSliderImage");
    if(detailSlider) {
        let startX = 0;
        detailSlider.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, {passive: true});
        detailSlider.addEventListener("touchend", e => {
            let endX = e.changedTouches[0].clientX;
            if(startX - endX > 50) nextDetailSlide();
            if(endX - startX > 50) prevDetailSlide();
        }, {passive: true});
    }
}

// Detail Page Slider Functions
function updateDetailSlider() {
    const img = document.getElementById("detailSliderImage");
    const thumbnails = document.querySelectorAll("#detailThumbnails .thumbnail-item");
    if(img && window.currentDetailImages[window.currentDetailIndex]) {
        img.src = window.currentDetailImages[window.currentDetailIndex];
        thumbnails.forEach((t, i) => {
            if(i === window.currentDetailIndex) t.classList.add('active');
            else t.classList.remove('active');
        });
    }
}

function nextDetailSlide() {
    if(!window.currentDetailImages || window.currentDetailImages.length <= 1) return;
    window.currentDetailIndex = (window.currentDetailIndex + 1) % window.currentDetailImages.length;
    updateDetailSlider();
}

function prevDetailSlide() {
    if(!window.currentDetailImages || window.currentDetailImages.length <= 1) return;
    window.currentDetailIndex = (window.currentDetailIndex - 1 + window.currentDetailImages.length) % window.currentDetailImages.length;
    updateDetailSlider();
}

function setDetailSlide(index) {
    window.currentDetailIndex = index;
    updateDetailSlider();
}

function openZoomDetail() {
    const zoomOverlay = document.getElementById("zoomOverlay");
    const zoomImg = document.getElementById("zoomedImage");
    if(zoomOverlay && zoomImg && window.currentDetailImages[window.currentDetailIndex]) {
        zoomOverlay.style.display = "flex";
        zoomImg.src = window.currentDetailImages[window.currentDetailIndex];
    }
}

let selectedDetailSize = null;
function selectSizeDetail(btnElement) {
    const siblings = btnElement.parentElement.children;
    for (let btn of siblings) {
        btn.classList.remove('selected');
    }
    btnElement.classList.add('selected');
    selectedDetailSize = btnElement.innerText;
}

function addToCartDetail(id, name, price, image) {
    if (!selectedDetailSize) {
        showCustomAlert("رجاءً يرجى اختيار القياس قبل المتابعة", "اختار القياس", "حسنًا");
        return;
    }
    
    const size = selectedDetailSize;
    pushToCart(id, name, price, size, image);
    triggerCardPop(id);
}

// --- Animation Core --- //
function triggerCardPop(id) {
    const card = document.getElementById(`product-${id}`);
    if (card) {
        card.classList.remove('tap-pop');
        // trigger reflow
        void card.offsetWidth;
        card.classList.add('tap-pop');
    }
}

// --- Shared Functions ---

function selectSize(event, btnElement) {
    event.stopPropagation();
    const container = btnElement.parentElement;
    const siblings = container.children;
    for (let btn of siblings) {
        btn.classList.remove('selected');
    }
    btnElement.classList.add('selected');
}

function addToCart(event, id, name, price, image) {
    if (event) event.stopPropagation();

    const selectorContainer = event ? event.target.parentElement.querySelector('.size-selector') : null;
    let size = null;
    
    if (selectorContainer) {
         const selectedBtn = selectorContainer.querySelector('.selected');
         if (selectedBtn) size = selectedBtn.innerText;
    } else if (document.getElementById('modal-size-selector')) {
         const selectedBtn = document.getElementById('modal-size-selector').querySelector('.selected');
         if (selectedBtn) size = selectedBtn.innerText;
    }

    if (!size) {
        showCustomAlert("رجاءً يرجى اختيار القياس قبل المتابعة", "اختار القياس", "حسنًا");
        return;
    }

    pushToCart(id, name, price, size, image);
    triggerCardPop(id);
    
    // Close modal if triggered from Product Lightbox modal
    if(document.getElementById('product-modal-overlay') && document.getElementById('product-modal-overlay').classList.contains('active')) {
        closeProductModal();
    }
}

function pushToCart(id, name, price, size, image) {
    const parsedPrice = parseInt(price) || 0;
    const existing = hira_cart.find(i => i.id === id && i.size === size);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        hira_cart.push({ id, name, price: parsedPrice, size, image, quantity: 1 });
    }
    
    saveCart();
    showToast("تمت الإضافة إلى السلة", true);
}

function toggleFavorite(event, id, btnElement) {
    event.stopPropagation();
    event.preventDefault();

    const index = favorites.indexOf(id.toString());
    const icon = btnElement.querySelector('i');

    if (index > -1) {
        favorites.splice(index, 1);
        btnElement.classList.remove('active');
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
        showToast("تمت الإزالة من المفضلة");
    } else {
        favorites.push(id.toString());
        btnElement.classList.add('active');
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        showToast("تمت الإضافة للمفضلة", true);
        triggerCardPop(id);
    }
    localStorage.setItem('hira_favorites', JSON.stringify(favorites));
    updateFavCounter();
}

// --- Favorites System Core --- //

function updateFavCounter() {
    const badges = document.querySelectorAll('#fav-badge');
    badges.forEach(b => b.innerText = favorites.length);
}

function openFavModal() {
    renderFavItems();
    document.getElementById('fav-modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeFavModal(event) {
    if (event && event.target !== event.currentTarget && !event.target.classList.contains('modal-close')) return;
    const modal = document.getElementById('fav-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function renderFavItems() {
    const container = document.getElementById('fav-items');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (favorites.length === 0) {
        container.innerHTML = '<div class="empty-cart-msg">لا توجد منتجات مفضلة حالياً</div>';
        return;
    }

    favorites.forEach(id => {
        const product = hiraProducts.find(p => p.id.toString() === id.toString());
        if(!product) return;

        container.innerHTML += `
            <div class="cart-item" id="fav-row-${product.id}">
                <div style="width: 70px; height: 90px; overflow: hidden; border-radius: 6px; flex-shrink: 0; cursor:pointer;" onclick="closeFavModal(); setTimeout(() => openProductModal('${product.id}'), 100);">
                    <img src="${product.image}" loading="lazy" class="cart-item-img" style="width: 100%; height: 100%; margin: 0; object-position: ${product.imagePositionX || 50}% ${product.imagePositionY || 50}%; transform: scale(${product.imageScale || 1});">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${product.name}</div>
                    <div class="cart-item-price">${product.price} د.ع</div>
                    <div class="fav-item-actions" style="margin-top: 10px;">
                        <div class="fav-item-size-selector" id="fav-size-${product.id}">
                            <button type="button" onclick="selectSize(event, this)">52</button>
                            <button type="button" onclick="selectSize(event, this)">54</button>
                            <button type="button" onclick="selectSize(event, this)">56</button>
                            <button type="button" onclick="selectSize(event, this)">58</button>
                            <button type="button" onclick="selectSize(event, this)">60</button>
                        </div>
                        <button class="btn-fav-add" onclick="addFromFav('${product.id}', '${product.name}', '${product.price}', '${product.image}')">أضف إلى السلة</button>
                    </div>
                </div>
                <button class="remove-cart-item" onclick="removeFavoriteDirectly('${product.id}')" style="align-self: flex-start;"><i class="fa fa-times"></i></button>
            </div>
        `;
    });
}

function addFromFav(id, name, price, image) {
    const selectorContainer = document.getElementById(`fav-size-${id}`);
    const selectedBtn = selectorContainer.querySelector('.selected');
    
    if (!selectedBtn) {
        showCustomAlert("رجاءً يرجى اختيار القياس قبل المتابعة", "اختار القياس", "حسنًا");
        return;
    }
    
    const size = selectedBtn.innerText;
    pushToCart(id, name, price, size, image);
}

function removeFavoriteDirectly(id) {
    const index = favorites.indexOf(id.toString());
    if (index > -1) {
        favorites.splice(index, 1);
        localStorage.setItem('hira_favorites', JSON.stringify(favorites));
        updateFavCounter();
        renderFavItems();
        
        // Try to re-render main view to keep hearts synced
        try {
            if (document.getElementById('product-grid')) {
                const query = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';
                if (query) {
                    renderProducts(hiraProducts.filter(p => p.name.toLowerCase().includes(query)));
                } else {
                    renderProducts(hiraProducts);
                }
            }
        } catch(e) {}
    }
}

// --- Cart Core System --- //

function updateCartCounter() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = hira_cart.reduce((sum, item) => sum + item.quantity, 0);
    badges.forEach(b => b.innerText = count);
}

function saveCart() {
    localStorage.setItem('hira_cart', JSON.stringify(hira_cart));
    updateCartCounter();
}

function openCartModal() {
    renderCartItems();
    document.getElementById('cart-modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartModal(event) {
    if (event && event.target !== event.currentTarget && !event.target.classList.contains('modal-close')) return;
    const modal = document.getElementById('cart-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function renderCartItems() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total-price');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (hira_cart.length === 0) {
        container.innerHTML = '<div class="empty-cart-msg">السلة فارغة حالياً</div>';
        totalEl.innerText = '0 د.ع';
        return;
    }

    let total = 0;
    hira_cart.forEach((item, index) => {
        total += item.price * item.quantity;
        
        const product = hiraProducts.find(p => p.id.toString() === item.id.toString());
        const imgPosX = product ? (product.imagePositionX || 50) : 50;
        const imgPosY = product ? (product.imagePositionY || 50) : 50;
        const imgScale = product ? (product.imageScale || 1) : 1;

        container.innerHTML += `
            <div class="cart-item">
                <div style="width: 70px; height: 90px; overflow: hidden; border-radius: 6px; flex-shrink: 0;">
                    <img src="${item.image}" loading="lazy" class="cart-item-img" style="width: 100%; height: 100%; margin: 0; object-position: ${imgPosX}% ${imgPosY}%; transform: scale(${imgScale});">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">${item.price} د.ع</div>
                    <div class="cart-item-size">المقاس: ${item.size}</div>
                </div>
                <div class="cart-item-actions">
                    <button class="remove-cart-item" onclick="removeFromCart(${index})"><i class="fa fa-trash"></i></button>
                    <div class="quantity-controls">
                        <button onclick="updateQuantity(${index}, 1)">+</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, -1)">-</button>
                    </div>
                </div>
            </div>
        `;
    });
    totalEl.innerText = total + ' د.ع';
}

function updateQuantity(index, change) {
    hira_cart[index].quantity += change;
    if (hira_cart[index].quantity <= 0) {
        hira_cart.splice(index, 1);
    }
    saveCart();
    renderCartItems();
}

function removeFromCart(index) {
    hira_cart.splice(index, 1);
    saveCart();
    renderCartItems();
}

function openCheckoutFromCart() {
    if (hira_cart.length === 0) {
        showCustomAlert("السلة فارغة.");
        return;
    }
    closeCartModal();
    
    const summaryPanel = document.getElementById('order-summary-panel');
    if (summaryPanel) {
        let total = hira_cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        let count = hira_cart.reduce((s, i) => s + i.quantity, 0);
        summaryPanel.innerHTML = `
            <div style="text-align: right; background: #fafafa; padding: 10px; border-radius: 8px;">
                <strong>عدد المنتجات:</strong> ${count}<br>
                <strong>المجموع الكلي:</strong> ${total} د.ع
            </div>
        `;
    }
    document.getElementById('order-form-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// --- Modals & Checkout Flow --- //

function injectModals() {
    if (document.getElementById('order-form-overlay')) return; // Already injected
    
    const modalsHTML = `
    <!-- Toast Message Component -->
    <div id="toast-container" class="toast-message">
        <i class="fa fa-check-circle" id="toast-icon"></i> <span id="toast-text"></span>
    </div>

    <!-- Custom Alert Overlay -->
    <div id="custom-alert-overlay" class="modal-overlay" onclick="closeCustomAlert()">
        <div class="modal-content custom-alert-content" onclick="event.stopPropagation()">
            <h3 id="custom-alert-title" class="custom-alert-title" style="display:none;"></h3>
            <div class="custom-alert-icon" id="custom-alert-icon" style="display:none;"></div>
            <p id="custom-alert-message" class="custom-alert-message"></p>
            <button id="custom-alert-btn" class="btn-primary custom-alert-btn" onclick="closeCustomAlert()">موافق</button>
        </div>
    </div>
    <!-- Favorites Modal -->
    <div id="fav-modal-overlay" class="modal-overlay" onclick="closeFavModal(event)">
        <div class="cart-modal-content modal-content" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="closeFavModal()"><i class="fa fa-times"></i></button>
            <h2 style="font-family: var(--font-arabic); margin-bottom: 20px; font-size: 24px; text-align: center;">المفضلة ❤️</h2>
            <div id="fav-items" class="cart-items-container">
                <!-- fav items injected here -->
            </div>
            <div class="cart-summary">
                <button class="btn-secondary" onclick="closeFavModal()" style="width: 100%; padding: 12px;">متابعة التسوق</button>
            </div>
        </div>
    </div>

    <!-- Cart Modal -->
    <div id="cart-modal-overlay" class="modal-overlay" onclick="closeCartModal(event)">
        <div class="cart-modal-content modal-content" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="closeCartModal()"><i class="fa fa-times"></i></button>
            <h2 style="font-family: var(--font-arabic); margin-bottom: 20px; font-size: 24px; text-align: center;">سلة المشتريات</h2>
            <div id="cart-items" class="cart-items-container">
                <!-- items injected here -->
            </div>
            <div class="cart-summary">
                <div class="cart-total-row">
                    <span>المجموع:</span>
                    <span id="cart-total-price">0 د.ع</span>
                </div>
                <button class="btn-primary" onclick="openCheckoutFromCart()" style="width: 100%; margin-bottom: 10px; padding: 14px;">إتمام الطلب</button>
                <button class="btn-secondary" onclick="closeCartModal()" style="width: 100%; padding: 12px;">متابعة التسوق</button>
            </div>
        </div>
    </div>

    <!-- Advanced Product Modal -->
    <div id="productModal" class="modal-overlay" onclick="closeProductModal(event)">
      <div class="modal-content" onclick="event.stopPropagation()">
        <span id="closeModal" onclick="closeProductModal()">&times;</span>

        <!-- SLIDER -->
        <div class="slider-container">
          <button id="prevBtn" onclick="prevSlide()">&#10094;</button>
          <img id="sliderImage" />
          <button id="nextBtn" onclick="nextSlide()">&#10095;</button>
        </div>

        <!-- THUMBNAILS -->
        <div id="thumbnails"></div>

        <h2 id="modalName"></h2>
        <p id="modalPrice"></p>
        <p id="modalDescription"></p>

        <!-- SIZE -->
        <div class="size-guide-text" style="font-size: 13px; color: #888; text-align: right; margin-bottom: 5px;">اختاري المقاس (طول العباية بالسم):</div>
        <select id="sizeSelect"></select>

        <button id="addToCartBtn" onclick="addToCartFromModal()">أضف إلى السلة</button>
      </div>
    </div>

    <!-- ZOOM VIEW -->
    <div id="zoomOverlay" onclick="closeZoom()">
      <img id="zoomedImage">
    </div>

    <!-- Order Form Modal -->
    <div id="order-form-overlay" class="modal-overlay" onclick="closeOrderForm(event)">
        <div class="modal-content order-modal-content" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="closeOrderForm()"><i class="fa fa-times"></i></button>
            
            <div id="order-form-container">
                <h2 style="font-family: var(--font-arabic); text-align: center; margin-bottom: 20px; font-size: 24px;">إتمام الطلب</h2>
                <div class="order-summary" id="order-summary-panel">
                    <!-- details injected here from cart -->
                </div>
                
                <form id="checkout-form" onsubmit="submitOrder(event)">
                    <div class="form-group">
                        <label>الاسم الكامل <span style="color:red">*</span></label>
                        <input type="text" id="order-name" placeholder="أدخل اسمك الكامل" required>
                    </div>
                    <div class="form-group">
                        <label>رقم الهاتف <span style="color:red">*</span></label>
                        <input type="tel" id="order-phone" placeholder="مثال: 078xxxxxxx" required>
                    </div>
                    <div class="form-group">
                        <label>المحافظة <span style="color:red">*</span></label>
                        <select id="order-gov" required>
                            <option value="">اختر المحافظة...</option>
                            <option value="بغداد">بغداد</option>
                            <option value="البصرة">البصرة</option>
                            <option value="نينوى">نينوى</option>
                            <option value="أربيل">أربيل</option>
                            <option value="النجف">النجف</option>
                            <option value="كربلاء">كربلاء</option>
                            <option value="كركوك">كركوك</option>
                            <option value="الأنبار">الأنبار</option>
                            <option value="ديالى">ديالى</option>
                            <option value="بابل">بابل</option>
                            <option value="ميسان">ميسان</option>
                            <option value="ذي قار">ذي قار</option>
                            <option value="الديوانية">الديوانية</option>
                            <option value="المثنى">المثنى</option>
                            <option value="واسط">واسط</option>
                            <option value="السليمانية">السليمانية</option>
                            <option value="دهوك">دهوك</option>
                            <option value="حلبجة">حلبجة</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>العنوان التفصيلي <span style="color:red">*</span></label>
                        <input type="text" id="order-address" placeholder="المنطقة، المحلة، الزقاق، الدار..." required>
                    </div>
                    <div class="form-group">
                        <label>أقرب نقطة دالة <span style="color:red">*</span></label>
                        <input type="text" id="order-landmark" placeholder="مثال: قرب مدرسة، أو جامع، أو مطعم..." required>
                    </div>
                    
                    <button type="submit" class="btn-primary" style="margin-top: 15px;">تأكيد وإرسال الطلب</button>
                    <div id="order-success-msg" style="display: none; color: #25D366; text-align: center; margin-top: 15px; font-weight: bold; font-size: 16px;">
                        <i class="fa fa-check-circle"></i> تم تأكيد طلبك! جاري تحويلك لواتساب...
                    </div>
                </form>
            </div>
        </div>
    </div>
    `;
    const container = document.createElement('div');
    container.innerHTML = modalsHTML;
    document.body.appendChild(container);
}

let currentIndex = 0;
let currentImages = [];

function initSlider(images){
  currentImages = images.slice(0,4);
  currentIndex = 0;
  updateSlider();
  renderThumbnails();
}

function updateSlider(){
  if(currentImages.length > 0) {
      document.getElementById("sliderImage").src = currentImages[currentIndex];
      // update active thumbnail class
      let container = document.getElementById("thumbnails");
      if(container) {
          Array.from(container.children).forEach((child, idx) => {
              if(idx === currentIndex) child.classList.add("active");
              else child.classList.remove("active");
          });
      }
  } else {
      document.getElementById("sliderImage").src = "https://via.placeholder.com/600x800?text=لا+توجد+صورة";
  }
}

function nextSlide(){
  if(currentImages.length === 0) return;
  currentIndex = (currentIndex + 1) % currentImages.length;
  updateSlider();
}

function prevSlide(){
  if(currentImages.length === 0) return;
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  updateSlider();
}

function renderThumbnails(){
  let container = document.getElementById("thumbnails");
  if(!container) return;
  container.innerHTML = "";

  currentImages.forEach((img, index)=>{
    let t = document.createElement("img");
    t.src = img;
    if(index === currentIndex) t.classList.add("active");

    t.onclick = () => {
      currentIndex = index;
      updateSlider();
    };

    container.appendChild(t);
  });
}

function openProductModal(productId) {
    const product = hiraProducts.find(p => p.id.toString() === productId.toString());
    if (!product) return;
    
    let images = [];
    if(product.images && Array.isArray(product.images) && product.images.length > 0) {
        images = product.images;
    } else if (product.image) {
        images = [product.image];
    }
    
    initSlider(images);

    document.getElementById("modalName").innerText = product.name;
    document.getElementById("modalPrice").innerText = product.price + " د.ع";
    document.getElementById("modalDescription").innerHTML = product.description.replace(/\n/g, '<br>');

    let select = document.getElementById("sizeSelect");
    select.innerHTML = "";

    let sizesToUse = [];
    if(product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        sizesToUse = product.sizes;
    } else {
        sizesToUse = ["52", "54", "56", "58", "60"]; // Fallback for old data
    }
    
    sizesToUse.forEach(size => {
        let opt = document.createElement("option");
        opt.value = size;
        opt.textContent = size;
        select.appendChild(opt);
    });

    window.currentProduct = product;

    document.getElementById('productModal').classList.add('active');
    document.body.style.overflow = 'hidden'; 
    
    let startX = 0;
    let slider = document.getElementById("sliderImage");
    
    let newSlider = slider.cloneNode(true);
    slider.parentNode.replaceChild(newSlider, slider);
    slider = newSlider;

    slider.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
    });

    slider.addEventListener("touchend", e => {
      let endX = e.changedTouches[0].clientX;
      if(startX - endX > 50) nextSlide();
      if(endX - startX > 50) prevSlide();
    });
    
    slider.onclick = () => {
        let zoomOverlay = document.getElementById("zoomOverlay");
        let zoomImg = document.getElementById("zoomedImage");
        if(currentImages.length > 0) {
            zoomOverlay.style.display = "flex";
            zoomImg.src = currentImages[currentIndex];
        }
    };
}

function closeProductModal(event) {
    if (event && event.target !== event.currentTarget && event.target.id !== 'closeModal') return;
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeZoom() {
    document.getElementById("zoomOverlay").style.display = "none";
}

function addToCartFromModal() {
    let size = document.getElementById("sizeSelect").value;
    if (!size) {
        showCustomAlert("رجاءً يرجى اختيار القياس قبل المتابعة", "اختار القياس", "حسنًا");
        return;
    }
    
    let product = window.currentProduct;
    let img = (product.images && product.images.length > 0) ? product.images[0] : product.image;
    
    pushToCart(product.id, product.name, product.price, size, img);
    triggerCardPop(product.id);
    closeProductModal();
}

function closeOrderForm(event) {
    if (event && event.target !== event.currentTarget && !event.target.classList.contains('modal-close')) return;
    const modal = document.getElementById('order-form-overlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function submitOrder(event) {
    event.preventDefault();
    
    if (hira_cart.length === 0) {
        showCustomAlert("السلة فارغة. عد للتسوق أولاً.");
        return;
    }
    
    const name = document.getElementById('order-name').value;
    const phone = document.getElementById('order-phone').value;
    const gov = document.getElementById('order-gov').value;
    const address = document.getElementById('order-address').value;
    const landmark = document.getElementById('order-landmark').value;

    if (!name || !phone || !gov || !address || !landmark) {
        showCustomAlert("الرجاء ملء جميع الحقول المطلوبة.");
        return;
    }

    document.getElementById('order-success-msg').style.display = 'block';
    const btn = document.querySelector('#checkout-form button[type="submit"]');
    if (btn) btn.disabled = true;

    setTimeout(() => {
        sendWhatsAppDetailed({ name, phone, gov, address, landmark });
        
        // Clear Cart
        hira_cart = [];
        saveCart();
        
        closeOrderForm();
        document.getElementById('checkout-form').reset();
        document.getElementById('order-success-msg').style.display = 'none';
        if (btn) btn.disabled = false;
    }, 1500);
}

function sendWhatsAppDetailed(customerInfo) {
    let message = `طلب جديد:

🛍️ المنتجات:`;
    
    let totalItems = 0;
    let totalPrice = 0;

    hira_cart.forEach(item => {
        // 1. CLEAN IMAGE URL:
        let imageUrl = item.image ? item.image.trim() : "";
        
        // 2. FORCE DIRECT LINK (IMGBB):
        if (imageUrl.includes('ibb.co') && !imageUrl.includes('i.ibb.co')) {
            imageUrl = imageUrl.replace('ibb.co', 'i.ibb.co');
        }
        
        // 3. ENSURE CORRECT URL FORMAT:
        if (imageUrl && !imageUrl.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i)) {
            imageUrl += '.jpg';
        }

        try {
            imageUrl = new URL(imageUrl, window.location.href).href;
        } catch (e) {}

        // 6. DEBUG LOG:
        console.log("Final Image URL:", imageUrl);

        message += `
* ${item.name}
  السعر: ${item.price} د.ع
  القياس: ${item.size}
  الكمية: ${item.quantity}
  الصورة: ${imageUrl}
`;
        totalItems += item.quantity;
        totalPrice += item.price * item.quantity;
    });

    message += `
📊 المجموع:
عدد القطع: ${totalItems}
السعر الكلي: ${totalPrice} د.ع

👤 معلومات الزبون:
* الاسم: ${customerInfo.name}
* الهاتف: ${customerInfo.phone}
* المحافظة: ${customerInfo.gov}
* العنوان: ${customerInfo.address} - ${customerInfo.landmark}
`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

// --- Costum Alert System & Toast --- //

let toastTimeout;
function showToast(message, isSuccess = false) {
    const toast = document.getElementById('toast-container');
    const toastText = document.getElementById('toast-text');
    const icon = document.getElementById('toast-icon');
    
    if (toast && toastText) {
        toastText.innerText = message;
        
        if (isSuccess) {
            icon.className = 'fa fa-check-circle';
            icon.style.color = '#25D366';
        } else {
            icon.className = 'fa fa-info-circle';
            icon.style.color = '#fff';
        }
        
        toast.classList.add('show');
        
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

function showCustomAlert(message, title = "", buttonText = "موافق", isSuccess = false) {
    const msgEl = document.getElementById('custom-alert-message');
    const titleEl = document.getElementById('custom-alert-title');
    const btnEl = document.getElementById('custom-alert-btn');
    const iconEl = document.getElementById('custom-alert-icon');
    
    if (msgEl) {
        msgEl.innerText = message;
        
        if (title) {
            titleEl.innerText = title;
            titleEl.style.display = 'block';
        } else {
            titleEl.style.display = 'none';
        }
        
        if (btnEl) btnEl.innerText = buttonText;
        
        if (isSuccess && iconEl) {
            iconEl.innerHTML = '<i class="fa fa-check-circle" style="color: #25D366; font-size: 40px; margin-bottom: 10px;"></i>';
            iconEl.style.display = 'block';
        } else {
            if (iconEl) iconEl.style.display = 'none';
        }
        
        document.getElementById('custom-alert-overlay').classList.add('active');
    }
}

function closeCustomAlert() {
    const alertModal = document.getElementById('custom-alert-overlay');
    if (alertModal) {
        alertModal.classList.remove('active');
    }
}
