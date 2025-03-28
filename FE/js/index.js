// import jwtDecode from "https://cdn.jsdelivr.net/npm/jwt-decode@3.1.2/build/jwt-decode.esm.js";
// import jwtDecode from "jwt-decode";
import jwtDecode from "../node_modules/jwt-decode/build/jwt-decode.esm.js";
const baseURL = 'http://localhost:3000';

// جيب التوكن من localStorage
const rawToken = localStorage.getItem("token");

// فك التوكن عشان نجيب الـ role
let bearer = 'user'; // قيمة افتراضية لو مفيش role
if (rawToken) {
    try {
        const decoded = jwtDecode(rawToken);
        console.log(decoded)
        bearer = decoded.role || 'user'; // استخدم الـ role لو موجود، وإلا استخدم bearer
    } catch (error) {
        console.error('Error decoding token:', error);
    }
}

// إنشاء التوكن بالـ prefix الجديد
const token = `${bearer} ${rawToken}`;

let globalProfile = {};
let selectedFiles = []; // لتخزين الملفات المختارة
let likedMessages = {};
const headers = {
    'Content-Type': 'application/json; charset=UTF-8',
    'authorization': token
};
const clintIo = io(baseURL, {
    auth: { token: token }
});

clintIo.on("socket_Error", data => {
    console.log({ socketError: data });

})

clintIo.on("likePost", data => {
    console.log({ data });

})

//images links
let avatar = './avatar/Avatar-No-Background.png'
let meImage = avatar
let friendImage = avatar
let currentChatDestId = null;
//save socket id
// clintIo.emit("updateSocketId", { token })


//collect messageInfo
function sendMessage(destId) {
    console.log({ destId });
    const message = $("#messageBody").val().trim();


    const data = { content: message, destId, images: [] };
    console.log(selectedFiles)
    if (selectedFiles.length > 0) {
        console.log('Selected Files:', selectedFiles);
        let loadedImages = 0;
        const totalImages = selectedFiles.length;

        // Loop على كل الصور
        Array.from(selectedFiles).forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                data.images.push(reader.result); // نضيف كل base64 string للـ array
                loadedImages++;

                // لما كل الصور تتحول لـ base64، نبعت الرسالة
                if (loadedImages === totalImages) {
                    console.log('Final data to send:', data);
                    clintIo.emit('sendMessage', data);
                    $("#messageBody").val('');
                    $("#messageImage").val('');
                    $("#imagePreview").empty();
                    selectedFiles = [];
                }
            };
            reader.readAsDataURL(file);
        });
    } else {
        clintIo.emit('sendMessage', data);
        $("#messageBody").val('');
        $("#messageImage").val('');
        $("#imagePreview").empty();
        selectedFiles = [];
    }
}
//sendCompleted
// في successMessage
clintIo.on('successMessage', (data) => {
    console.log(globalProfile);
    console.log("Event triggered:", data);

    const { message } = data;
    const isMe = message.senderId._id.toString() === globalProfile._id.toString();
    const messageTime = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    const readMark = isMe
        ? (message.read ? `<span id='${message._id.toString()}' class="read-mark mx-1">✔✔</span>` : `<span id='${message._id.toString()}' class="read-mark mx-1">✔</span>`)
        : '';

    let attachmentHTML = '';
    if (message.attachment?.length > 0) {
        attachmentHTML = '<div class="attachments mt-2">';
        message.attachment.forEach((att) => {
            let attUrl = att.secure_url.replace('}', ''); // تنظيف الـ URL
            attachmentHTML += `
                <img src="${attUrl}" alt="Attachment" class="attachment-image" style="max-width: 100px; border-radius: 8px;" />
            `;
        });
        attachmentHTML += '</div>';
    }

    const div = document.createElement('div');
    div.className = isMe ? `me p-2 ${message.read ? 'read' : ''}` : 'myFriend p-2';
    div.dir = 'ltr';
    div.dataset.messageId = message._id.toString(); // إضافة معرف الرسالة للـ div
    let profileImage = isMe ? meImage : friendImage;
    profileImage = profileImage.replace('}', ''); // تنظيف الـ URL

    div.innerHTML = `
        <img class="chatImage" src="${profileImage}" alt="" srcset="">
        <span class="mx-2">${message.content || ''}</span>
        <span class="message-time">${messageTime}</span>
        ${attachmentHTML}
        ${readMark}
<button class="like-btn ${message.likedBy?.includes(globalProfile._id) ? 'liked' : ''}" data-message-id="${message._id.toString()}">
        <i class="fas fa-heart"></i> 
        <span class="like-count">${message.likes || 0}</span>
    </button>
`;
    const messageList = document.getElementById('messageList');

    if (messageList.firstChild) {
        messageList.insertBefore(div, messageList.firstChild);
    } else {
        messageList.appendChild(div);
    }
    console.log("After insertBefore (successMessage):", messageList.innerHTML);

    requestAnimationFrame(() => {
        messageList.scrollTop = 0;
        console.log("Message list scrollTop (successMessage):", messageList.scrollTop, "scrollHeight:", messageList.scrollHeight);
    });

    $(".noResult").hide();
});

//receiveMessage
clintIo.on("receiveMessage", (data) => {
    console.log({ RM: data });
    const { message } = data;

    const isMe = message.senderId._id.toString() === globalProfile._id.toString();
    const senderId = message.senderId._id.toString();
    const receiverId = message.resverId?._id.toString();

    if ((isMe && receiverId !== currentChatDestId) || (!isMe && senderId !== currentChatDestId)) {
        console.log("Message ignored - not for current chat:", message);
        const userDiv = document.querySelector(`.chatUser[data-user-id="${senderId}"]`);
        if (userDiv) {
            const unreadSpan = userDiv.querySelector('.unread-count');
            if (unreadSpan) {
                let currentCount = parseInt(unreadSpan.textContent) || 0;
                currentCount += 1;
                unreadSpan.textContent = currentCount;
                unreadSpan.style.display = 'inline-block';
            }
        }
        return;
    }

    const messageTime = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    const readMark = isMe
        ? (message.read ? `<span id='${message._id.toString()}' class="read-mark mx-1">✔✔</span>` : `<span id='${message._id.toString()}' class="read-mark mx-1">✔</span>`)
        : '';

    if (!isMe && senderId === currentChatDestId) {
        clintIo.emit('messageRead', { messageId: message._id });
    }

    let attachmentHTML = '';
    if (message.attachment && message.attachment.length > 0) {
        attachmentHTML = '<div class="attachments mt-2">';
        message.attachment.forEach((att) => {
            let attUrl = att.secure_url.replace('}', '');
            attachmentHTML += `
                <img src="${attUrl}" alt="Attachment" class="attachment-image" style="max-width: 100px; border-radius: 8px;" />
            `;
        });
        attachmentHTML += '</div>';
    }

    const div = document.createElement('div');
    div.className = isMe ? `me p-2 ${message.read ? 'read' : ''}` : 'myFriend p-2';
    div.dir = 'ltr';
    div.dataset.messageId = message._id.toString(); // إضافة معرف الرسالة للـ div
    let profileImage = isMe ? meImage : friendImage;
    profileImage = profileImage.replace('}', '');

    div.innerHTML = `
        <img class="chatImage" src="${profileImage}" alt="" srcset="">
        <span class="mx-2">${message.content || ''}</span>
        <span class="message-time">${messageTime}</span>
        ${attachmentHTML}
        ${readMark}
    <button class="like-btn ${message.likedBy?.includes(globalProfile._id) ? 'liked' : ''}" data-message-id="${message._id.toString()}">
        <i class="fas fa-heart"></i> 
        <span class="like-count">${message.likes || 0}</span>
    </button>
`;
    const messageList = document.getElementById('messageList');

    if (messageList.firstChild) {
        messageList.insertBefore(div, messageList.firstChild);
    } else {
        messageList.appendChild(div);
    }
    console.log("After insertBefore (receiveMessage):", messageList.innerHTML);



    requestAnimationFrame(() => {
        messageList.scrollTop = 0;
        console.log("Message list scrollTop (receiveMessage):", messageList.scrollTop, "scrollHeight:", messageList.scrollHeight);
    });

    $(".noResult").hide();

});


clintIo.on('userStatus', (data) => {
    const { userId, status } = data;
    console.log(`User ${userId} is now ${status}`);
    const userDiv = document.querySelector(`.chatUser[data-user-id="${userId}"]`);
    if (userDiv) {
        const statusSpan = userDiv.querySelector('.online-status');
        if (statusSpan) {
            statusSpan.style.display = status === 'online' ? 'inline-block' : 'none';
        }
    }
});

clintIo.on('messageLiked', (data) => {
    console.log('Message liked:', data);
    const { messageId, likes } = data;

    // تحديث زر الإعجاب في الرسالة المحددة
    const likeBtn = $(`.like-btn[data-message-id="${messageId}"]`);
    if (likeBtn.length) {
        likeBtn.find('.like-count').text(likes);
    }
});
// --------------------------

// إضافة عنصر لعرض حالة الكتابة
clintIo.on('typing', (data) => {
    const { senderId } = data;
    if (senderId === currentChatDestId) {
        const typingIndicator = document.getElementById('typingIndicator');
        if (!typingIndicator) {
            const messageList = document.getElementById('messageList');
            const div = document.createElement('div');
            div.id = 'typingIndicator';
            div.className = 'typing-indicator myFriend p-2'; // إضافة myFriend عشان يبقى على اليمين
            div.dir = 'ltr'; // اتجاه من الشمال لليمين (نفس الرسائل)
            div.innerHTML = '<span class="mx-2">Typing...</span>';
            messageList.insertBefore(div, messageList.firstChild);
            messageList.scrollTop = 0;
        }
    }
});

clintIo.on('stopTyping', (data) => {
    const { senderId } = data;
    if (senderId === currentChatDestId) {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
});

// ******************************************************************** Show chat conversation
function showData(destId, chat) {
    $("#sendMessage").attr("data-destId", destId);
    currentChatDestId = destId; // تحديث الـ destId المفتوح حاليًا
    const messageList = document.getElementById('messageList');
    messageList.innerHTML = '';
    if (chat?.length) {
        $(".noResult").hide();

        for (const message of chat) {
            const isMe = message.senderId._id.toString() === globalProfile._id.toString();
            const div = document.createElement('div');
            div.className = isMe ? `me p-2 ${message.read ? 'read' : ''}` : 'myFriend p-2';
            div.dir = 'ltr';

            const messageTime = new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });

            let attachmentHTML = '';
            if (message.attachment && message.attachment.length > 0) {
                attachmentHTML = '<div class="attachments mt-2">';
                message.attachment.forEach((att) => {
                    let attUrl = att.secure_url.replace('}', '');
                    attachmentHTML += `
                        <img src="${attUrl}" alt="Attachment" class="attachment-image" style="max-width: 100px; border-radius: 8px;" />
                    `;
                });
                attachmentHTML += '</div>';
            }

            const readMark = isMe
                ? (message.read ? `<span id='${message._id.toString()}' class="read-mark mx-1">✔✔</span>` : `<span id='${message._id.toString()}' class="read-mark mx-1">✔</span>`)
                : '';
            let profileImage = isMe ? meImage : friendImage;
            profileImage = profileImage.replace('}', '');

            div.innerHTML = `
                <img class="chatImage" src="${profileImage}" alt="" srcset="">
                <span class="mx-2">${message.content || ''}</span>
                <span class="message-time">${messageTime}</span>
                ${attachmentHTML}
                ${readMark}
                <button class="like-btn" data-message-id="${message._id.toString()}">
        <i class="fas fa-heart"></i> 
        <span class="like-count">${message.likes?.length || 0}</span>
    </button>
            `;
            messageList.appendChild(div);
            if (!isMe) clintIo.emit("updateMessages", { message: message })


        }

        messageList.scrollTop = 0;
    } else {
        const div = document.createElement('div');
        div.className = 'noResult text-center p-2';
        div.dir = 'ltr';
        div.innerHTML = `<span class="mx-2">Say Hi to start the conversation.</span>`;
        messageList.appendChild(div);
        messageList.scrollTop = 0;
    }
}

//get chat conversation between 2 users and pass it to ShowData fun
function displayChatUser(userId) {
    console.log({ userId });
    axios({
        method: 'get',
        url: `${baseURL}/message/chat/${userId}`,
        headers
    }).then(function (response) {
        const chat = response.data?.data;
        console.log({ users: chat[0] });
        console.log({ chat });
        if (chat.length > 0) {
            if (chat[0].senderId._id.toString() === globalProfile._id.toString()) {
                meImage = globalProfile.profileImage?.secure_url || avatar;
                friendImage = chat[0].resverId.profileImage?.secure_url || avatar;
            } else {
                friendImage = chat[0].senderId.profileImage?.secure_url || avatar;
                meImage = globalProfile.profileImage?.secure_url || avatar;
            }
            showData(userId, chat);

        } else {
            showData(userId, 0);
        }
        const userDiv = document.querySelector(`.chatUser[data-user-id="${userId}"]`);
        if (userDiv) {
            const unreadSpan = userDiv.querySelector('.unread-count');
            if (unreadSpan) {
                unreadSpan.textContent = '0';
                unreadSpan.style.display = 'none';
            }
        }
    }).catch(function (error) {
        console.log(error);
        console.log({ status: error.status });
        if (error.status == 404) {
            showData(userId, 0);
        } else {
            alert("Oops something went wrong");
        }
    });
}
// ********************************************************************

// ==============================================================================================


// ********************************************************* Show Users list 
// Display Users
function getUserData() {
    axios({
        method: 'get',
        url: `${baseURL}/users/profile`,
        headers
    }).then(function (response) {
        console.log({ D: response.data });
        const user = response.data?.data || response.data;
        globalProfile = user;

        // عين صورة المستخدم الحالي من البداية
        meImage = user.profileImage?.secure_url || avatar;

        console.log('User Name:', user.userName);
        document.getElementById("userName").innerHTML = `${user.userName || 'User'}`;
        console.log('Friends:', user.friends);
        showUsersData(user.friends || []);
    }).catch(function (error) {
        console.log(error);
        if (error.response) {
            if (error.response.status === 400 || error.response.status === 401) {
                console.log('Authentication error:', error.response.status, error.response.data);
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            } else {
                console.log('Other API error:', error.response.status, error.response.data);
                alert('Something went wrong. Please try again later.');
            }
        } else {
            console.log('Network Error or server unreachable');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    });
}
// Show friends list
function showUsersData(users = []) {
    console.log(users);
    let cartonna = '';
    for (let i = 0; i < users.length; i++) {
        let userImage = users[i].profileImage?.secure_url || avatar;
        userImage = userImage.replace('}', ''); // تنظيف الـ URL
        const unreadCount = users[i].countUnread || 0;
        const isOnline = users[i].isOnline || false;
        cartonna += `
            <div onclick="displayChatUser('${users[i]._id}')" class="chatUser my-2" data-user-id="${users[i]._id}">
                <img class="chatImage" src="${userImage}" alt="" srcset="">
                <span class="ps-2">${users[i].userName}</span>
                <span class="online-status ms-2" data-user-id="${users[i]._id}" style="display: ${isOnline ? 'inline-block' : 'none'}; width: 10px; height: 10px; border-radius: 50%; background-color: #10b981;"></span>
                <span class="unread-count badge bg-danger ms-2" style="display: ${unreadCount > 0 ? 'inline-block' : 'none'};">${unreadCount}</span>
            </div>
        `;
    }
    console.log(cartonna);
    document.getElementById('chatUsers').innerHTML = cartonna;
}
getUserData()

clintIo.on('messageUpdated', (data) => {
    console.log("Message updated:", data);
    const { messageId, read } = data;
    const messageDiv = document.querySelector(`[data-message-id='${messageId}']`);
    if (!messageDiv) console.error("Message div not found for ID:", messageId);
    if (messageDiv) {
        const readMarkSpan = messageDiv.querySelector('.read-mark');
        if (readMarkSpan) {
            readMarkSpan.innerHTML = read ? '✔✔' : '✔';
            if (read) {
                messageDiv.classList.add('read');
            } else {
                messageDiv.classList.remove('read');
            }
        }
    }
});

window.displayChatUser = displayChatUser;
window.sendMessage = sendMessage;

// ********************************************************* Show Users list

$(document).ready(() => {
    $("#attachImageBtn").on('click', () => {
        $("#messageImage").click();
    });

    $("#messageImage").on('change', (e) => {
        const files = e.target.files;
        const previewContainer = $("#imagePreview");

        if (files && files.length > 0) {
            Array.from(files).forEach((file) => {
                // التأكد إن الصورة مش متكررة
                if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                    selectedFiles.push(file);

                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = document.createElement('img');
                        img.src = event.target.result;
                        img.dataset.index = selectedFiles.length - 1; // ترقيم الصورة
                        img.style.maxWidth = '100px';
                        img.style.borderRadius = '8px';
                        img.className = 'attachment-image';

                        const removeBtn = document.createElement('span');
                        removeBtn.innerHTML = '✖';
                        removeBtn.style.color = 'red';
                        removeBtn.style.cursor = 'pointer';
                        removeBtn.style.marginLeft = '5px';
                        removeBtn.onclick = () => {
                            const fileIndex = parseInt(img.dataset.index);
                            selectedFiles.splice(fileIndex, 1); // حذف الصورة
                            img.remove();
                            removeBtn.remove();
                            // إعادة ترقيم الصور المتبقية
                            previewContainer.find('img').each((i, element) => {
                                element.dataset.index = i;
                            });
                        };

                        const container = document.createElement('div');
                        container.style.display = 'inline-block';
                        container.appendChild(img);
                        container.appendChild(removeBtn);
                        previewContainer.append(container);
                    };
                    reader.readAsDataURL(file);
                }
            });
            console.log('Updated selectedFiles:', selectedFiles); // للتأكد من القائمة
        }
    });
    $("#sendMessage").on('click', () => {
        const destId = $("#sendMessage").attr('data-destId');
        if (destId) {
            sendMessage(destId);
        }
    });

    $(document).on('click', '.like-btn', function () {
        const messageId = $(this).attr('data-message-id');
        const isLiked = likedMessages[messageId] || false; // هل الرسالة معمولها لايك من المستخدم؟
        const currentLikes = parseInt($(this).find('.like-count').text()) || 0;

        if (!isLiked) {
            // إذا مش معمول لايك، نضيف لايك
            clintIo.emit('likeMessage', { messageId, action: 'like' });
            likedMessages[messageId] = true;
            $(this).find('.like-count').text(currentLikes + 1);
            $(this).addClass('liked');
        } else {
            // إذا معمول لايك، نشيل اللايك
            clintIo.emit('likeMessage', { messageId, action: 'unlike' });
            likedMessages[messageId] = false;
            $(this).find('.like-count').text(currentLikes - 1);
            $(this).removeClass('liked');
        }
    });

    $("#messageBody").on('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const destId = $("#sendMessage").attr('data-destId');
            if (destId) {
                sendMessage(destId);
            }
        }
    });


    $("#logoutBtn").on('click', () => {
        // مسح الـ token من localStorage
        localStorage.removeItem('token');

        // قطع الاتصال بـ Socket.IO (اختياري)
        clintIo.disconnect();

        // تحويل المستخدم لصفحة الـ Login
        window.location.href = 'login.html'; // افتراضاً إن اسم صفحة الـ Login هو login.html
    });

    //  typing Code========

    let typingTimer; // تعريف المؤقت خارج الحدث
    const typingDelay = 1000; // مدة التأخير (ثانية واحدة)
    let isTyping = false; // متغير لتتبع حالة الكتابة

    $("#messageBody").on('input', (e) => {
        console.log("Input detected:", e.target.value);
        const destId = $("#sendMessage").attr('data-destId');
        if (!destId) return;

        // إذا كان المستخدم لسه مش بيكتب، نبعت إشعار "typing"
        if (!isTyping) {
            console.log("Sending typing event to:", destId);
            clintIo.emit('typing', { destId });
            isTyping = true; // نحدث الحالة لـ "بيكتب"
        }

        // إعادة ضبط المؤقت عند كل إدخال جديد
        clearTimeout(typingTimer);
        console.log("Timer reset, waiting for stop...");

        typingTimer = setTimeout(() => {
            console.log("Timer executed - Stop typing detected");
            clintIo.emit('stopTyping', { destId });
            isTyping = false; // نرجع الحالة لـ "مش بيكتب"
        }, typingDelay);
    });

});
