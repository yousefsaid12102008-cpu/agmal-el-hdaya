// استدعاء خدمات فايربيز
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

// تشغيل فايربيز
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ربط عناصر الواجهة
const splashScreen = document.getElementById('splash-screen');
const authContainer = document.getElementById('auth-container');
const dashboard = document.getElementById('dashboard');
const authMessage = document.getElementById('auth-message');

// إخفاء شاشة الترحيب بعد ثانيتين
setTimeout(() => {
    splashScreen.classList.add('hidden');
}, 2000);

// مراقبة حالة المستخدم 
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.status === "pending") {
                authMessage.innerText = "حسابك قيد المراجعة.";
                authMessage.style.color = "orange";
                authContainer.classList.remove('hidden');
                dashboard.classList.add('hidden');
                signOut(auth);
            } else {
                authContainer.classList.add('hidden');
                dashboard.classList.remove('hidden');
            }
        } else {
            authContainer.classList.add('hidden');
            dashboard.classList.remove('hidden');
        }
    } else {
        authContainer.classList.remove('hidden');
        dashboard.classList.add('hidden');
    }
});

// إنشاء حساب جديد
document.getElementById('register-btn').addEventListener('click', async () => {
    // سحب القيم فوراً وقت الضغط وتجاهل المسافات
    const emailVal = document.getElementById('email').value.trim();
    const passwordVal = document.getElementById('password').value.trim();
    
    if(emailVal === "" || passwordVal === "") {
        authMessage.innerText = "برجاء كتابة الإيميل والباسورد في المربعات أولاً!";
        authMessage.style.color = "red";
        return;
    }

    try {
        authMessage.innerText = "جاري إنشاء الحساب...";
        authMessage.style.color = "blue";
        const userCredential = await createUserWithEmailAndPassword(auth, emailVal, passwordVal);
        const user = userCredential.user;
        
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: "employee",
            status: "pending" 
        });
        
        authMessage.innerText = "تم طلب الحساب بنجاح. في انتظار الموافقة.";
        authMessage.style.color = "green";
        signOut(auth);
        
    } catch (error) {
        // ترجمة أشهر أخطاء فايربيز عشان نفهم المشكلة
        if(error.code === 'auth/email-already-in-use') {
            authMessage.innerText = "هذا الإيميل مسجل بالفعل، جرب تسجيل الدخول.";
        } else if (error.code === 'auth/weak-password') {
            authMessage.innerText = "كلمة المرور ضعيفة، يجب أن تكون 6 أحرف أو أرقام على الأقل.";
        } else {
            authMessage.innerText = "خطأ: " + error.message;
        }
        authMessage.style.color = "red";
    }
});

// تسجيل الدخول
document.getElementById('login-btn').addEventListener('click', async () => {
    const emailVal = document.getElementById('email').value.trim();
    const passwordVal = document.getElementById('password').value.trim();
    
    if(emailVal === "" || passwordVal === "") {
        authMessage.innerText = "برجاء كتابة الإيميل والباسورد أولاً!";
        authMessage.style.color = "red";
        return;
    }

    try {
        authMessage.innerText = "جاري الدخول...";
        authMessage.style.color = "blue";
        await signInWithEmailAndPassword(auth, emailVal, passwordVal);
        authMessage.innerText = "";
    } catch (error) {
        authMessage.innerText = "بيانات الدخول غير صحيحة.";
        authMessage.style.color = "red";
    }
});

// تسجيل الخروج
document.getElementById('logout-btn').addEventListener('click', () => {
    signOut(auth);
});
