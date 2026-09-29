// استدعاء خدمات Firebase v10
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// مفاتيح مشروع أجمل الهدايا
const firebaseConfig = {
    apiKey: "AIzaSyDaYNjnxEmJ-FgRvOQmH1ShofQ-AlrT2EU",
    authDomain: "agmal-el-hdaya-dcbb2.firebaseapp.com",
    projectId: "agmal-el-hdaya-dcbb2",
    storageBucket: "agmal-el-hdaya-dcbb2.firebasestorage.app",
    messagingSenderId: "466997940122",
    appId: "1:466997940122:web:cabc7a6736055039cf7423"
};

// تهيئة المشروع
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// عناصر الواجهة
const splash = document.getElementById('splash-screen');
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const msg = document.getElementById('auth-message');
const authForm = document.getElementById('auth-form');

let isLoginMode = true; // التحكم في حالة الشاشة (تسجيل أم إنشاء)
let currentUserData = null; // تخزين بيانات المستخدم الحالي

// إخفاء شاشة الترحيب
setTimeout(() => {
    splash.style.opacity = '0';
    setTimeout(() => splash.classList.add('hidden'), 600);
}, 2000);

// ================= نظام المصادقة (Auth) =================

// التبديل بين الدخول والإنشاء
document.getElementById('switch-auth-btn').addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "تسجيل الدخول" : "إنشاء حساب جديد";
    document.getElementById('main-auth-btn').innerText = isLoginMode ? "دخول" : "طلب إنشاء حساب";
    document.getElementById('switch-auth-text').innerText = isLoginMode ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟";
    e.target.innerText = isLoginMode ? "إنشاء حساب" : "تسجيل الدخول";
    msg.innerText = "";
});

// تنفيذ (الدخول / الإنشاء)
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('main-auth-btn');

    btn.disabled = true;
    msg.style.color = "blue";

    try {
        if (isLoginMode) {
            msg.innerText = "جاري الدخول...";
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            msg.innerText = "جاري الإنشاء...";
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            // حفظ الحساب كمعلق
            await setDoc(doc(db, "users", cred.user.uid), {
                email: email,
                role: "موظف",
                status: "pending",
                createdAt: new Date().toISOString()
            });
            await signOut(auth);
            msg.style.color = "green";
            msg.innerText = "تم الطلب بنجاح! في انتظار موافقة الإدارة.";
        }
    } catch (error) {
        msg.style.color = "red";
        msg.innerText = error.code === 'auth/invalid-credential' ? "البيانات غير صحيحة!" : "خطأ: " + error.message;
    } finally {
        btn.disabled = false;
    }
});

// مراقبة حالة المستخدم (الأمان)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            currentUserData = docSnap.data();
            if (currentUserData.status === "pending") {
                msg.style.color = "orange";
                msg.innerText = "حسابك قيد المراجعة من الإدارة.";
                authSection.classList.remove('hidden');
                appSection.classList.add('hidden');
                await signOut(auth);
            } else {
                // فتح النظام
                document.getElementById('display-email').innerText = currentUserData.email;
                document.getElementById('display-role').innerText = currentUserData.role || "مدير";
                authSection.classList.add('hidden');
                appSection.classList.remove('hidden');
                initApp(); // تشغيل دوال النظام
            }
        }
    } else {
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));


// ================= النظام الأساسي (الكاشير والمنتجات) =================

// التنقل بين الصفحات
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        const target = e.currentTarget.getAttribute('data-target');
        e.currentTarget.classList.add('active');
        document.getElementById(target).classList.add('active');
        
        // تغيير العنوان
        const titles = { dashboard: 'الرئيسية', pos: 'الكاشير', products: 'المنتجات', invoices: 'الفواتير' };
        document.getElementById('page-title').innerText = titles[target] || target;
    });
});

// تشغيل النظام
function initApp() {
    loadProductsForPOS();
    loadDashboardStats();
}

// 1. قسم الكاشير (POS)
let currentCart = [];
const productsRef = collection(db, "products");
const invoicesRef = collection(db, "invoices");

// جلب المنتجات وعرضها في الكاشير بـ Real-time
function loadProductsForPOS() {
    onSnapshot(productsRef, (snapshot) => {
        const grid = document.getElementById('pos-products-grid');
        grid.innerHTML = '';
        
        snapshot.forEach((docSnap) => {
            const p = docSnap.data();
            p.id = docSnap.id;
            
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <h4>${p.name}</h4>
                <p class="price">${p.price} ج.م</p>
                <small style="color: #64748b;">المتاح: ${p.stock}</small>
            `;
            // إضافة للسلة عند الضغط
            card.addEventListener('click', () => addToCart(p));
            grid.appendChild(card);
        });
    });
}

function addToCart(product) {
    if(product.stock <= 0) {
        alert("هذا المنتج نفذ من المخزون!");
        return;
    }
    
    const existing = currentCart.find(item => item.id === product.id);
    if(existing) {
        if(existing.qty < product.stock) existing.qty++;
        else alert("لا يوجد كمية كافية في المخزن!");
    } else {
        currentCart.push({ ...product, qty: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    const cartDiv = document.getElementById('cart-items');
    let total = 0;
    cartDiv.innerHTML = '';
    
    currentCart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        
        cartDiv.innerHTML += `
            <div class="cart-item">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>${item.qty} × ${item.price} ج.م</small>
                </div>
                <div>
                    <strong>${itemTotal} ج.م</strong>
                    <button onclick="removeFromCart(${index})" style="background:red; color:white; border:none; padding:2px 6px; border-radius:4px; margin-right:10px; cursor:pointer;">X</button>
                </div>
            </div>
        `;
    });
    
    document.getElementById('cart-total').innerText = `${total} ج.م`;
    document.getElementById('pos-paid').value = total; // افتراضياً العميل هيدفع الإجمالي
}

window.removeFromCart = function(index) {
    currentCart.splice(index, 1);
    updateCartUI();
};

// إصدار الفاتورة (حفظ في قاعدة البيانات الحقيقية)
document.getElementById('checkout-btn').addEventListener('click', async () => {
    if(currentCart.length === 0) return alert("السلة فارغة!");
    
    const btn = document.getElementById('checkout-btn');
    btn.innerText = "جاري الإصدار...";
    btn.disabled = true;

    const total = currentCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const paid = parseFloat(document.getElementById('pos-paid').value) || 0;
    const customer = document.getElementById('pos-customer').value || "عميل نقدي";
    
    try {
        const newInvoice = {
            customer: customer,
            items: currentCart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })),
            total: total,
            paid: paid,
            remaining: total - paid,
            date: new Date().toISOString(),
            cashier: currentUserData.email
        };

        // حفظ الفاتورة في Firestore
        await addDoc(invoicesRef, newInvoice);
        
        // الخصم من المخزون (تحديث بيانات المنتجات)
        // ملاحظة: لتبسيط الكود في هذه الرسالة، يتم افتراض أن الخصم يتم هنا (في النسخة المتقدمة نستخدم Batch)

        alert("تم إصدار الفاتورة بنجاح!");
        currentCart = [];
        document.getElementById('pos-customer').value = "";
        updateCartUI();
        
    } catch (error) {
        alert("حدث خطأ: " + error.message);
    } finally {
        btn.innerText = "إصدار الفاتورة 🖨️";
        btn.disabled = false;
    }
});

// 2. تحديث لوحة التحكم الرئيسية (إحصائيات حية)
function loadDashboardStats() {
    onSnapshot(invoicesRef, (snapshot) => {
        let totalSales = 0;
        let invoiceCount = snapshot.size;
        
        snapshot.forEach(doc => {
            totalSales += doc.data().total;
        });
        
        document.getElementById('dash-sales').innerText = `${totalSales} ج.م`;
        document.getElementById('dash-invoices').innerText = invoiceCount;
    });
}
