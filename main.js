import { db, collection, getDocs } from './firebase-config.js';

// Initialize the main application data
async function initializeApp() {
    const globalLoader = document.getElementById('global-loader');
    const productGrid = document.getElementById('product-grid');
    const detailGrid = document.getElementById('product-detail');
    
    try {
        // Show loaders if they exist
        if (globalLoader) globalLoader.style.display = 'block';

        // Fetch products from Firebase Firestore
        const productsRef = collection(db, "products");
        const querySnapshot = await getDocs(productsRef);
        
        // Clear existing local products if any
        window.hiraProducts = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Reconstruct images array from individual image fields for backward compatibility
            const reconstructedImages = [data.image1, data.image2, data.image3, data.image4].filter(Boolean);
            if (reconstructedImages.length === 0 && data.images) {
                reconstructedImages.push(...data.images);
            } else if (reconstructedImages.length === 0 && data.image) {
                reconstructedImages.push(data.image);
            }
            
            window.hiraProducts.push({ 
                // Prioritize the ID saved from admin panel, fallback to Firestore document ID
                id: data.id || doc.id, 
                ...data,
                // Ensure image field works correctly with ImgBB urls
                image: data.image1 || data.image || data.imageUrl || 'https://via.placeholder.com/400x600?text=لا+توجد+صورة',
                images: reconstructedImages,
                name: data.name || 'منتج غير معروف',
                price: data.price || '0',
                description: data.description || 'لا يوجد وصف',
                sizes: data.sizes || []
            });
        });
        
        if (window.hiraProducts.length === 0) {
            console.warn("No products found in Firestore collection 'products'.");
        } else {
            console.log(`Successfully fetched ${window.hiraProducts.length} products from Firebase.`);
        }

    } catch (error) {
        console.error("Error fetching products from Firebase:", error);
        
        // Handle Error State in UI
        const errorMsg = `<div style="text-align:center; padding:40px; color:red; grid-column:1/-1; width:100%;">
            <i class="fa fa-exclamation-triangle" style="font-size: 30px; margin-bottom: 15px;"></i>
            <h3>خطأ في تحميل المنتجات</h3>
            <p>يرجى التأكد من اتصالك بالإنترنت والمحاولة مرة أخرى.</p>
        </div>`;
        
        if (productGrid) productGrid.innerHTML = errorMsg;
        if (detailGrid) detailGrid.innerHTML = errorMsg;
        
    } finally {
        // Hide loader
        if (globalLoader) globalLoader.style.display = 'none';
        
        // Safely call the render function defined in script.js
        if (typeof window.initPage === 'function') {
            window.initPage();
        } else {
            console.warn("initPage function not found. Ensure script.js is loaded properly.");
        }
    }
}

// Start execution safely ensuring DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
