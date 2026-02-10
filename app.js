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

            const userStatus = await response.json();
            document.getElementById('loading').style.display = 'none';

            if (userStatus.status === 'registered') {
                if (userStatus.role === 'student') {
                    showStudentCalendar(userStatus.name);
                } else {
                    // 教師画面へ
                    showTeacherDashboard(userStatus.name);
                }
            } else {
                // ★ここでエラーが出ていました。下に関数を追加しました！
                showRegistrationForm(profile);
            }

        } catch (e) {
            alert("APIエラー: " + e.message);
        }
    } catch (err) {
        alert("LIFF初期化エラー: " + err);
    }
}

// --------------------------------------------------
// ★追加: これが抜けていました！(登録フォーム表示)
// --------------------------------------------------
function showRegistrationForm(profile) {
    document.getElementById('display-name').innerText = profile.displayName;
    if (profile.pictureUrl) document.getElementById('profile-img').src = profile.pictureUrl;
    
    // 他の画面を隠してフォームを出す
    document.getElementById('student-page').style.display = 'none';
    document.getElementById('teacher-page').style.display = 'none';
    document.getElementById('registration-form').style.display = 'block';
}

// --------------------------------------------------
// 共通: イベント取得関数
// --------------------------------------------------
async function fetchEvents(info, successCallback, failureCallback) {
    try {
        const res = await fetch(`${BASE_URL}/get_schedules`, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const events = await res.json();
        successCallback(events);
    } catch (e) {
        failureCallback(e);
    }
}

// --------------------------------------------------
// 学生用カレンダー
// --------------------------------------------------
function showStudentCalendar(userName) {
    document.getElementById('student-page').style.display = 'block';
    
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ja',
        height: 'auto',
        events: fetchEvents, 

        // 日付クリックで予約
        dateClick: async function(info) {
            if (!confirm(`${info.dateStr} に面談を予約しますか？`)) return;

            try {
                const res = await fetch(`${BASE_URL}/book`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({
                        userId: lineProfile.userId,
                        userName: lineProfile.displayName,
                        date: info.dateStr
                    })
                });
                const result = await res.json();
                if (result.status === 'success') {
                    alert("予約しました！");
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
// 教師用ダッシュボード (削除機能付き)
// --------------------------------------------------
function showTeacherDashboard(userName) {
    document.getElementById('teacher-page').style.display = 'block';
    
    const calendarEl = document.getElementById('teacher-calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ja',
        height: 'auto',
        events: fetchEvents, 
        eventColor: '#e74c3c', // 赤色

        // 予約クリックで削除
        eventClick: async function(info) {
            const eventObj = info.event;
            const confirmMsg = `【予約削除】\n名前: ${eventObj.title}\n日付: ${eventObj.startStr}\n\nこの予約を取り消しますか？`;
            
            if (!confirm(confirmMsg)) return;

            try {
                const res = await fetch(`${BASE_URL}/delete_schedule`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({ id: eventObj.id }) 
                });

                const result = await res.json();
                if (result.status === 'success') {
                    alert("削除しました。");
                    eventObj.remove(); 
                } else {
                    alert("削除失敗: " + result.message);
                }
            } catch (e) {
                alert("通信エラー: " + e);
            }
        }
    });
    calendar.render();
}

// --------------------------------------------------
// 登録関連
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
