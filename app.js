// ▼▼▼ ここにあなたのLIFF IDを入れてください ▼▼▼
const MY_LIFF_ID = "2009080549-aia5HOne"; 
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// バックエンドのURL (Step 3で書き換えます)
const API_URL = "http://YOUR_EC2_IP:8000/register"; 

// --------------------------------------------------
// 1. メイン処理 (アプリ起動時に動く)
// --------------------------------------------------
async function main() {
    // デバッグ用: 開始を知らせる
    console.log("App started");

    try {
        // LIFFの初期化
        await liff.init({ liffId: MY_LIFF_ID });
        
        // ログインチェック
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        // プロフィール取得
        const profile = await liff.getProfile();
        console.log("Profile got:", profile);

        // 画面に名前などを反映
        document.getElementById('display-name').innerText = profile.displayName;
        // 画像がある場合のみセット
        if (profile.pictureUrl) {
            document.getElementById('profile-img').src = profile.pictureUrl;
        }

        // グローバル変数に保存（送信時に使うため）
        window.lineProfile = profile;

        // ★ここで初めて「読み込み中」を消して「入力フォーム」を出す
        document.getElementById('loading').style.display = 'none';
        document.getElementById('registration-form').style.display = 'block';

    } catch (error) {
        // エラーが起きたら画面に出す
        alert("初期化エラー:\n" + error);
        console.error(error);
    }
}

// --------------------------------------------------
// 2. UI操作関数 (教師/学生の切り替え)
// --------------------------------------------------
function toggleTeacherAuth(isTeacher) {
    const authArea = document.getElementById('teacher-auth-area');
    if (isTeacher) {
        authArea.style.display = 'block';
    } else {
        authArea.style.display = 'none';
        document.getElementById('teacher-pass').value = ""; // リセット
    }
}

// --------------------------------------------------
// 3. 登録ボタンを押した時の処理
// --------------------------------------------------
async function registerUser() {
    const role = document.querySelector('input[name="role"]:checked').value;
    
    // --- パスワードチェック ---
    if (role === 'teacher') {
        const pass = document.getElementById('teacher-pass').value;
        if (pass !== "anabuki-js27") {
            alert("パスワードが違います。\n教師登録は許可された人のみ可能です。");
            return; 
        }
    }

    const profile = window.lineProfile;
    const btn = document.querySelector('.btn-primary');
    
    // 二重送信防止
    btn.disabled = true;
    btn.innerText = "送信中...";

    try {
        // ★Step 3でここに fetch() を書きます
        
        // 仮の成功アラート
        alert(`【テスト成功】\n名前: ${profile.displayName}\n権限: ${role}\n\nこれからバックエンドに送信します！`);

        // 完了画面へ
        document.getElementById('registration-form').style.display = 'none';
        document.getElementById('complete-message').style.display = 'block';

    } catch (error) {
        console.error(error);
        alert("送信エラーが発生しました。");
        btn.disabled = false;
        btn.innerText = "連携を開始する";
    }
}

// 最後にメイン関数を実行してスタート！
main();
