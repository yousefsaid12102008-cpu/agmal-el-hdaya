// استدعاء خدمات فايربيز (نفس الإصدار اللي ظهر في الكود بتاعك 12.19.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// مفاتيح الربط الخاصة بمكتبة أجمل الهدايا
const firebaseConfig = {
    apiKey: "AIzaSyDaYNjnxEmJ-FgRvOQmH1ShofQ-AlrT2EU",
    authDomain: "agmal-el-hdaya-dcbb2.firebaseapp.com",
    projectId: "agmal-el-hdaya-dcbb2",
    storageBucket: "agmal-el-hdaya-dcbb2.firebasestorage.app",
    messagingSenderId: "466997940122",
    appId: "1:466997940122:web:cabc7a6736055039cf7423",
    measurementId: "G-H5YJ6RVCMR"
};

// تهيئة المشروع
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// جلب عناصر الواجهة
const splashScreen = document.getElementById('splash-screen');
const authContainer = document.getElementById('auth-container');
const dashboard = document.getElementById('dashboard');
const authMessage = document.getElementById('auth-message');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');

// التحكم في شاشة الترحيب
setTimeout(() => {
    splashScreen.style.opacity = '0';
    setTimeout(() => {
        splashScreen.classList.add('hidden');
    }, 1000);
}, 3000);

// مراقبة حالة تسجيل الدخول
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // المستخدم مسجل دخول، نجلب بياناته من قاعدة البيانات
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.status === "pending") {
                authMessage.innerText = "حسابك قيد المراجعة من الإدارة.";
                authMessage.style.color = "orange";
                authContainer.classList.remove('hidden');
                dashboard.classList.add('hidden');
                await signOut(auth); // خروج إجباري لأنه معلق
            } else if (userData.status === "approved" || userData.role === "admin") {
                // دخول ناجح
                authContainer.classList.add('hidden');
                dashboard.classList.remove('hidden');
            }
        }
    } else {
        // مفيش مستخدم، نعرض شاشة الدخول
        authContainer.classList.remove('hidden');
        dashboard.classList.add('hidden');
    }
});

// طلب إنشاء حساب جديد
registerBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if(!email || !password) {
        authMessage.innerText = "الرجاء إدخال البريد وكلمة المرور.";
        authMessage.style.color = "red";
        return;
    }

    try {
        registerBtn.disabled = true;
        registerBtn.innerText = "جاري الإنشاء...";
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // أول حساب تعمله خليه أدمن، لكن إحنا هنبرمجه كـ pending وتقدر تعدله من فايربيز
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: "employee", // سيتم ترقيته كمدير من السيرفر
            status: "pending", 
            createdAt: new Date()
        });
        
        authMessage.innerText = "تم طلب إنشاء الحساب بنجاح. في انتظار موافقة الإدارة.";
        authMessage.style.color = "green";
        await signOut(auth);
        
    } catch (error) {
        authMessage.innerText = "خطأ: " + error.message;
        authMessage.style.color = "red";
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerText = "طلب إنشاء حساب";
    }
});

// تسجيل الدخول
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if(!email || !password) return;

    try {
        loginBtn.disabled = true;
        loginBtn.innerText = "جاري الدخول...";
        await signInWithEmailAndPassword(auth, email, password);
        authMessage.innerText = "";
    } catch (error) {
        authMessage.innerText = "بيانات الدخول غير صحيحة.";
        authMessage.style.color = "red";
        await signOut(auth);
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerText = "تسجيل الدخول";
    }
});

// تسجيل الخروج
logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
});
