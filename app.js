// ▼▼▼ 設定エリア (書き換えてください) ▼▼▼
const MY_LIFF_ID = "2009080549-aia5HOne"; 
const BASE_URL   = "https://exaggerative-zavier-nonfluidly.ngrok-free.dev/"; // ngrokのURL
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲


let lineProfile = null;
let calendar = null;

async function main() {
    try {
        await liff.init({ liffId: MY_LIFF_ID });
        if (!liff.isLoggedIn()) { liff.login(); return; }

        const profile = await liff.getProfile();
        lineProfile = profile;

        // ユーザー状態確認
        try {
            const response = await fetch(`${BASE_URL}/check_user`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ userId: profile.userId })
            });

            if (!response.ok) throw new Error("API Error");
            const userStatus = await response.json();

            document.getElementById('loading').style.display = 'none';

            if (userStatus.status === 'registered') {
                if (userStatus.role === 'student') {
                    // 学生 -> カレンダー表示
                    showStudentCalendar(userStatus.name);
                } else {
                    // 教師 -> 管理画面
                    document.getElementById('teacher-page').style.display = 'block';
                }
            } else {
                // 未登録 -> 登録フォーム
                showRegistrationForm(profile);
            }

        } catch (e) {
            alert("エラー: " + e.message);
        }
    } catch (err) {
        alert("LIFF初期化エラー: " + err);
    }
}

// --------------------------------------------------
// 画面表示関数
// --------------------------------------------------
function showRegistrationForm(profile) {
    document.getElementById('display-name').innerText = profile.displayName;
    if (profile.pictureUrl) document.getElementById('profile-img').src = profile.pictureUrl;
    document.getElementById('registration-form').style.display = 'block';
}

function showStudentCalendar(userName) {
    document.getElementById('student-page').style.display = 'block';
    
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ja',
        height: 'auto',
        
        // ★イベント(予約)をサーバーから取得
        events: async function(info, successCallback, failureCallback) {
            try {
                const res = await fetch(`${BASE_URL}/get_schedules`, {
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                });
                const events = await res.json();
                successCallback(events);
            } catch (e) {
                failureCallback(e);
            }
        },

        // ★日付クリックで予約処理
        dateClick: async function(info) {
            const dateStr = info.dateStr;
            const confirmMsg = `${dateStr} に面談を予約しますか？`;
            
            if (!confirm(confirmMsg)) return;

            // サーバーへ送信
            try {
                const res = await fetch(`${BASE_URL}/book`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({
                        userId: lineProfile.userId,
                        userName: lineProfile.displayName, // LINEの名前を使う
                        date: dateStr
                    })
                });

                const result = await res.json();

                if (result.status === 'success') {
                    alert("予約しました！");
                    // カレンダーを再読み込みして、新しい予定を表示
                    calendar.refetchEvents();
                } else {
                    alert("エラー: " + result.message);
                }
            } catch (e) {
                alert("通信エラー: " + e);
            }
        }
    });
    calendar.render();
}

// --------------------------------------------------
// 登録関連 (変更なし)
// --------------------------------------------------
window.toggleTeacherAuth = function(isTeacher) {
    const authArea = document.getElementById('teacher-auth-area');
    authArea.style.display = isTeacher ? 'block' : 'none';
    if (!isTeacher) document.getElementById('teacher-pass').value = "";
};

window.registerUser = async function() {
    const roleEl = document.querySelector('input[name="role"]:checked');
    if (!roleEl) return alert("役割が選択されていません");
    const role = roleEl.value;
    if (role === 'teacher' && document.getElementById('teacher-pass').value !== "anabuki-js27") {
        return alert("パスワードが違います");
    }

    const btn = document.querySelector('.btn-primary');
    btn.disabled = true;
    btn.innerText = "送信中...";

    try {
        const response = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                userId: lineProfile.userId,
                displayName: lineProfile.displayName,
                role: role
            })
        });
        const result = await response.json();
        if (result.status === 'success') {
            document.getElementById('registration-form').style.display = 'none';
            document.getElementById('complete-message').style.display = 'block';
        } else {
            alert("登録失敗: " + result.message);
            btn.disabled = false;
        }
    } catch (error) {
        alert("エラー: " + error);
        btn.disabled = false;
    }
};

main();
