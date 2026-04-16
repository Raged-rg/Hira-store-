const phoneNumber = '9647842272224';
let favorites = JSON.parse(localStorage.getItem('hira_favorites')) || [];
let hira_cart = JSON.parse(localStorage.getItem('hira_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    injectModals();
    initPage();
    setupMobileScrollHeader();
    updateCartCounter();
});

function initPage() {
    // hiraProducts is loaded from data.js
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

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image-container" onclick="openProductModal('${product.id}')" style="cursor:pointer">
                <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x600?text=لا+توجد+صورة'">
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

    container.innerHTML = `
        <div class="product-detail-image">
           <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/600x800?text=لا+توجد+صورة'">
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
        alert("الرجاء اختيار المقاس أولاً.");
        return;
    }
    
    const size = selectedDetailSize;
    pushToCart(id, name, price, size, image);
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
        alert("الرجاء اختيار المقاس أولاً.");
        return;
    }

    pushToCart(id, name, price, size, image);
    
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
    alert("تمت الإضافة إلى السلة بنجاح!");
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
    } else {
        favorites.push(id.toString());
        btnElement.classList.add('active');
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
    }
    localStorage.setItem('hira_favorites', JSON.stringify(favorites));
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
        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" class="cart-item-img">
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
        alert("السلة فارغة.");
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

    <!-- Lightbox Product Modal -->
    <div id="product-modal-overlay" class="modal-overlay" onclick="closeProductModal(event)">
        <div class="modal-content product-modal-content" onclick="event.stopPropagation()">
            <button class="modal-close" onclick="closeProductModal()"><i class="fa fa-times"></i></button>
            <div id="product-modal-body">
                <!-- Content injected dynamically -->
            </div>
        </div>
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

function openProductModal(productId) {
    const product = hiraProducts.find(p => p.id.toString() === productId.toString());
    if (!product) return;

    const modalBody = document.getElementById('product-modal-body');
    if (!modalBody) return;
    
    modalBody.innerHTML = `
        <div class="product-modal-image">
           <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-modal-info">
            <h2>${product.name}</h2>
            <div class="price">${product.price} د.ع</div>
            <p class="desc">${product.description.replace(/\n/g, '<br>')}</p>
            <div class="size-selector" id="modal-size-selector">
                <button type="button" onclick="selectSize(event, this)">52</button>
                <button type="button" onclick="selectSize(event, this)">54</button>
                <button type="button" onclick="selectSize(event, this)">56</button>
                <button type="button" onclick="selectSize(event, this)">58</button>
                <button type="button" onclick="selectSize(event, this)">60</button>
            </div>
            <div class="size-guide-text" style="font-size: 13px; color: #888; text-align: center; margin-bottom: 20px;">القياسات بالأرقام وتمثل طول العباية بالسنتيمتر</div>
            <button class="btn-primary" onclick="addToCart(event, '${product.id}', '${product.name}', '${product.price}', '${product.image}')">أضف إلى السلة</button>
        </div>
    `;

    document.getElementById('product-modal-overlay').classList.add('active');
    document.body.style.overflow = 'hidden'; 
}

function closeProductModal(event) {
    if (event && event.target !== event.currentTarget && !event.target.classList.contains('modal-close')) return;
    const modal = document.getElementById('product-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
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
        alert("السلة فارغة. عد للتسوق أولاً.");
        return;
    }
    
    const name = document.getElementById('order-name').value;
    const phone = document.getElementById('order-phone').value;
    const gov = document.getElementById('order-gov').value;
    const address = document.getElementById('order-address').value;
    const landmark = document.getElementById('order-landmark').value;

    if (!name || !phone || !gov || !address || !landmark) {
        alert("الرجاء ملء جميع الحقول المطلوبة.");
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
        let imageLink = new URL(item.image, window.location.href).href;
        message += `
* ${item.name}
  السعر: ${item.price} د.ع
  القياس: ${item.size}
  الكمية: ${item.quantity}
  صورة:
  ${imageLink}
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
