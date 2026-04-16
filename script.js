const phoneNumber = '9647842272224';
let favorites = JSON.parse(localStorage.getItem('hira_favorites')) || [];

document.addEventListener('DOMContentLoaded', () => {
    injectModals();
    initPage();
    setupMobileScrollHeader();
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
        // Only apply on mobile screens
        if (window.innerWidth <= 768) {
            const currentScrollY = window.scrollY;
            
            // If scrolling down aggressively, hide header
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                header.classList.add('hide-on-scroll');
            } 
            // If scrolling up, immediately reveal it
            else if (currentScrollY < lastScrollY) {
                header.classList.remove('hide-on-scroll');
            }
            lastScrollY = currentScrollY;
        } else {
            // Guarantee visible on desktop
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
                <button class="btn-primary" onclick="proceedToCheckout(event, '${product.id}', '${product.name}', '${product.price}', '${product.image}')">اطلب الآن</button>
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
            
            <button class="btn-primary" onclick="checkoutDetail('${product.id}', '${product.name}', '${product.price}', '${product.image}')">
                اطلب الآن
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

function checkoutDetail(id, name, price, image) {
    if (!selectedDetailSize) {
        alert("الرجاء اختيار المقاس أولاً.");
        return;
    }
    openOrderForm(id, name, price, selectedDetailSize, image);
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

function proceedToCheckout(event, id, name, price, image) {
    event.stopPropagation();

    const selectorContainer = event.target.parentElement.querySelector('.size-selector');
    const selectedBtn = selectorContainer.querySelector('.selected');

    if (!selectedBtn) {
        alert("الرجاء اختيار المقاس أولاً.");
        return;
    }
    const size = selectedBtn.innerText;
    openOrderForm(id, name, price, size, image);
}

function sendWhatsApp(name, price, size) {
    const message = `مرحباً، أود طلب المنتج التالي:\n\nالاسم: ${name}\nالسعر: ${price}\nالمقاس: ${size}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
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

// --- Modals & Order Form Logic ---

function injectModals() {
    if (document.getElementById('product-modal-overlay')) return; // Already injected
    
    const modalsHTML = `
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
                <h2 style="font-family: var(--font-arabic); text-align: center; margin-bottom: 20px; font-size: 24px;">إكمال الطلب</h2>
                <div class="order-summary" id="order-summary-panel" style="text-align: center;">
                    <!-- details injected here -->
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
                    
                    <button type="submit" class="btn-primary" style="margin-top: 15px;">تأكيد الطلب</button>
                    <!-- Success indicator hidden by default -->
                    <div id="order-success-msg" style="display: none; color: #25D366; text-align: center; margin-top: 15px; font-weight: bold; font-size: 16px;">
                        <i class="fa fa-check-circle"></i> تم تسجيل طلبك بنجاح! جاري تحويلك...
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

let currentOrderDetails = {};

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
            <button class="btn-primary" onclick="proceedFromModal(event, '${product.id}', '${product.name}', '${product.price}', '${product.image}')">اطلب الآن</button>
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

function proceedFromModal(event, id, name, price, image) {
    const selectorContainer = document.getElementById('modal-size-selector');
    const selectedBtn = selectorContainer.querySelector('.selected');
    if (!selectedBtn) {
        alert("الرجاء اختيار المقاس أولاً.");
        return;
    }
    const size = selectedBtn.innerText;
    closeProductModal();
    openOrderForm(id, name, price, size, image);
}

function openOrderForm(id, name, price, size, image = '') {
    currentOrderDetails = { id, name, price, size, image };
    const summaryPanel = document.getElementById('order-summary-panel');
    if (summaryPanel) {
        let imgHtml = image ? `<img src="${image}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">` : '';
        summaryPanel.innerHTML = `
            ${imgHtml}
            <div style="text-align: right;">
                المنتج: <strong>${name}</strong><br>
                المقاس: <strong>${size}</strong><br>
                السعر: <strong>${price} د.ع</strong>
            </div>
        `;
    }
    document.getElementById('order-form-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
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
        sendWhatsAppDetailed(
            currentOrderDetails.id,
            currentOrderDetails.name, 
            currentOrderDetails.price, 
            currentOrderDetails.size, 
            { name, phone, gov, address, landmark },
            currentOrderDetails.image
        );
        closeOrderForm();
        
        document.getElementById('checkout-form').reset();
        document.getElementById('order-success-msg').style.display = 'none';
        if (btn) btn.disabled = false;
    }, 1500);
}

function sendWhatsAppDetailed(productId, productName, price, size, customerInfo, imagePath) {
    // Dynamically generate the absolute URL for GitHub Pages
    // This perfectly resolves the repository subfolder (e.g. username.github.io/repo/Images/1.jpg)
    let imageLink = new URL(imagePath, window.location.href).href;

    const message = `طلب جديد:
- اسم المنتج: ${productName}
- السعر: ${price} د.ع
- القياس المختار: ${size}

معلومات الزبون:
- الاسم: ${customerInfo.name}
- رقم الهاتف: ${customerInfo.phone}
- المحافظة: ${customerInfo.gov}
- العنوان: ${customerInfo.address} - ${customerInfo.landmark}

صورة المنتج:
${imageLink}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}
