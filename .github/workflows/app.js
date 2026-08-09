/* ==========================================================================
   DUO PRIVATE CHAT - CLIENT MODULE (SUPABASE, FIREBASE & SOCKET REALTIME)
   ========================================================================== */

class DuoChatApp {
  constructor() {
    this.provider = localStorage.getItem('duo_db_provider') || 'socket';
    this.supabase = null;
    this.supabaseChannel = null;
    this.socket = null;
    this.localBroadcastChannel = null;

    // Room & Profile State
    this.roomCode = '';
    this.myUser = { id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, nickname: '', avatar: '❤️' };
    this.partnerUser = null;
    this.messages = [];
    this.selectedImageData = null;

    // Supabase Config
    this.supabaseUrl = localStorage.getItem('duo_sb_url') || '';
    this.supabaseKey = localStorage.getItem('duo_sb_key') || '';

    this.initElements();
    this.attachEventListeners();
    this.loadSavedPreferences();
    this.initLocalBroadcastSync();
    this.initMobileVisibilityHandler();
  }

  initElements() {
    this.loginScreen = document.getElementById('loginScreen');
    this.chatScreen = document.getElementById('chatScreen');

    this.loginForm = document.getElementById('loginForm');
    this.roomCodeInput = document.getElementById('roomCodeInput');
    this.nicknameInput = document.getElementById('nicknameInput');
    this.avatarPickerTrigger = document.getElementById('avatarPickerTrigger');
    this.currentAvatarDisplay = document.getElementById('currentAvatarDisplay');
    this.avatarPopover = document.getElementById('avatarPopover');
    this.genPasscodeBtn = document.getElementById('genPasscodeBtn');
    this.copyInviteLinkBtn = document.getElementById('copyInviteLinkBtn');

    this.loginSettingsBtn = document.getElementById('loginSettingsBtn');
    this.loginBackendBadge = document.getElementById('loginBackendBadge');
    this.headerPartnerAvatar = document.getElementById('headerPartnerAvatar');
    this.headerPartnerName = document.getElementById('headerPartnerName');
    this.headerPartnerStatus = document.getElementById('headerPartnerStatus');
    this.headerStatusIndicator = document.getElementById('headerStatusIndicator');
    this.backendBadge = document.getElementById('backendBadge');
    this.shareHeaderBtn = document.getElementById('shareHeaderBtn');
    this.settingsBtn = document.getElementById('settingsBtn');

    this.chatMain = document.getElementById('chatMain');
    this.waitingBanner = document.getElementById('waitingBanner');
    this.displayRoomCode = document.getElementById('displayRoomCode');
    this.shareRoomBtn = document.getElementById('shareRoomBtn');
    this.messagesContainer = document.getElementById('messagesContainer');
    this.typingIndicator = document.getElementById('typingIndicator');

    this.messageInput = document.getElementById('messageInput');
    this.sendMsgBtn = document.getElementById('sendMsgBtn');
    this.attachImageBtn = document.getElementById('attachImageBtn');
    this.imageFileInput = document.getElementById('imageFileInput');
    this.imagePreviewBar = document.getElementById('imagePreviewBar');
    this.imagePreviewImg = document.getElementById('imagePreviewImg');
    this.removeImageBtn = document.getElementById('removeImageBtn');
    this.toggleStickersBtn = document.getElementById('toggleStickersBtn');
    this.stickerDrawer = document.getElementById('stickerDrawer');
    this.quickPillsGrid = document.getElementById('quickPillsGrid');

    this.settingsModalOverlay = document.getElementById('settingsModalOverlay');
    this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
    this.dbProviderSelect = document.getElementById('dbProviderSelect');
    this.supabaseUrlInput = document.getElementById('supabaseUrlInput');
    this.supabaseKeyInput = document.getElementById('supabaseKeyInput');
    this.saveDbConfigBtn = document.getElementById('saveDbConfigBtn');

    this.lightboxModal = document.getElementById('lightboxModal');
    this.lightboxImg = document.getElementById('lightboxImg');
    this.closeLightboxBtn = document.getElementById('closeLightboxBtn');
  }

  attachEventListeners() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && this.roomCodeInput) {
      this.roomCodeInput.value = roomParam;
    }

    if (this.genPasscodeBtn) {
      this.genPasscodeBtn.addEventListener('click', () => {
        const words = ['secret', 'nest', 'cozy', 'sweet', 'love', 'moon', 'star', 'haven'];
        const w1 = words[Math.floor(Math.random() * words.length)];
        const w2 = words[Math.floor(Math.random() * words.length)];
        const num = Math.floor(100 + Math.random() * 900);
        this.roomCodeInput.value = `${w1}-${w2}-${num}`;
      });
    }

    if (this.copyInviteLinkBtn) this.copyInviteLinkBtn.addEventListener('click', () => this.shareInviteLink());
    if (this.shareHeaderBtn) this.shareHeaderBtn.addEventListener('click', () => this.shareInviteLink());
    if (this.shareRoomBtn) this.shareRoomBtn.addEventListener('click', () => this.shareInviteLink());

    if (this.avatarPickerTrigger) {
      this.avatarPickerTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.avatarPopover.classList.toggle('hidden');
      });
    }

    document.querySelectorAll('.avatar-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentAvatarDisplay.textContent = btn.textContent;
        this.avatarPopover.classList.add('hidden');
      });
    });

    document.addEventListener('click', () => {
      if (this.avatarPopover) this.avatarPopover.classList.add('hidden');
    });

    if (this.loginForm) this.loginForm.addEventListener('submit', () => this.handleJoinRoom());

    if (this.sendMsgBtn) this.sendMsgBtn.addEventListener('click', () => this.handleSendMessage());

    if (this.messageInput) {
      this.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });

      this.messageInput.addEventListener('input', () => {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + 'px';
        this.sendTypingStatus();
      });
    }

    if (this.attachImageBtn) this.attachImageBtn.addEventListener('click', () => this.imageFileInput.click());
    if (this.imageFileInput) this.imageFileInput.addEventListener('change', (e) => this.handleImageSelect(e));
    if (this.removeImageBtn) this.removeImageBtn.addEventListener('click', () => this.clearSelectedImage());

    window.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let item of items) {
          if (item.type.indexOf('image') !== -1) {
            this.processImageFile(item.getAsFile());
            break;
          }
        }
      }
    });

    if (this.toggleStickersBtn) {
      this.toggleStickersBtn.addEventListener('click', () => {
        this.stickerDrawer.classList.toggle('hidden');
      });
    }

    if (this.quickPillsGrid) {
      this.quickPillsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-pill')) {
          this.messageInput.value = e.target.textContent;
          this.stickerDrawer.classList.add('hidden');
          this.handleSendMessage();
        }
      });
    }

    if (this.loginSettingsBtn) this.loginSettingsBtn.addEventListener('click', () => this.openSettingsModal());
    if (this.settingsBtn) this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
    if (this.closeSettingsBtn) this.closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
    if (this.saveDbConfigBtn) this.saveDbConfigBtn.addEventListener('click', () => this.saveSettings());

    document.querySelectorAll('[data-set-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-set-theme');
        this.setTheme(theme);
      });
    });

    if (this.closeLightboxBtn) this.closeLightboxBtn.addEventListener('click', () => this.lightboxModal.classList.add('hidden'));
    if (this.lightboxModal) {
      this.lightboxModal.addEventListener('click', (e) => {
        if (e.target === this.lightboxModal) this.lightboxModal.classList.add('hidden');
      });
    }
  }

  loadSavedPreferences() {
    const savedTheme = localStorage.getItem('duo_theme') || 'midnight';
    this.setTheme(savedTheme);

    const savedNickname = localStorage.getItem('duo_nickname');
    if (savedNickname && this.nicknameInput) this.nicknameInput.value = savedNickname;

    const savedRoom = localStorage.getItem('duo_room_code');
    if (savedRoom && this.roomCodeInput && !this.roomCodeInput.value) this.roomCodeInput.value = savedRoom;

    if (this.dbProviderSelect) this.dbProviderSelect.value = this.provider;
    if (this.supabaseUrlInput) this.supabaseUrlInput.value = this.supabaseUrl;
    if (this.supabaseKeyInput) this.supabaseKeyInput.value = this.supabaseKey;

    this.updateProviderBadge();
  }

  setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('duo_theme', themeName);
    document.querySelectorAll('.theme-chip').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-set-theme') === themeName);
    });
  }

  updateProviderBadge() {
    const badges = [this.backendBadge, this.loginBackendBadge].filter(Boolean);
    badges.forEach(badge => {
      if (this.provider === 'supabase' && this.supabaseUrl) {
        badge.innerHTML = '<i class="fa-solid fa-bolt"></i> Supabase';
      } else if (this.provider === 'firebase') {
        badge.innerHTML = '<i class="fa-solid fa-fire"></i> Firebase';
      } else {
        badge.innerHTML = '<i class="fa-solid fa-network-wired"></i> Realtime';
      }
    });
  }

  shareInviteLink() {
    const room = this.roomCodeInput.value.trim() || this.roomCode || 'secret-nest';
    const link = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(room)}`;

    if (navigator.share) {
      navigator.share({
        title: 'Join my Duo Private Chat',
        text: `Join my private room with code: ${room}`,
        url: link
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(link).then(() => {
        alert(`Invite link copied to clipboard!\n\n${link}`);
      }).catch(() => {
        alert(`Share code with partner: ${room}`);
      });
    }
  }

  // Handle Mobile Browser tab switching / App minimization
  initMobileVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.roomCode) {
        console.log('[Mobile Wakeup] Re-syncing socket connection...');
        if (this.socket && this.socket.connected) {
          this.socket.emit('join_room', {
            roomCode: this.roomCode,
            nickname: this.myUser.nickname,
            avatar: this.myUser.avatar
          });
        } else if (this.provider === 'socket') {
          this.initSocketFallback();
        }
      }
    });
  }

  initLocalBroadcastSync() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.localBroadcastChannel = new BroadcastChannel('duo_local_sync');
      this.localBroadcastChannel.onmessage = (e) => {
        const data = e.data;
        if (!data || data.roomCode !== this.roomCode) return;

        if (data.type === 'presence') {
          if (data.user.id !== this.myUser.id) {
            this.setPartnerOnline(data.user);
          }
        } else if (data.type === 'message') {
          if (data.payload.senderId !== this.myUser.id) {
            this.receiveMessagePayload(data.payload);
          }
        }
      };
    }
  }

  async handleJoinRoom() {
    const roomCode = this.roomCodeInput.value.trim().toLowerCase();
    const nickname = this.nicknameInput.value.trim();
    const avatar = this.currentAvatarDisplay.textContent.trim();

    if (!roomCode || !nickname) {
      alert('Please enter a secret room code and your nickname.');
      return;
    }

    this.roomCode = roomCode;
    this.myUser.nickname = nickname;
    this.myUser.avatar = avatar;

    localStorage.setItem('duo_nickname', nickname);
    localStorage.setItem('duo_room_code', roomCode);

    this.displayRoomCode.textContent = roomCode;

    this.loginScreen.classList.remove('active');
    this.chatScreen.classList.add('active');

    if (this.provider === 'supabase' && this.supabaseUrl && this.supabaseKey && window.supabase) {
      this.initSupabaseRealtime();
    } else {
      this.initSocketFallback();
    }

    if (this.localBroadcastChannel) {
      this.localBroadcastChannel.postMessage({
        type: 'presence',
        roomCode: this.roomCode,
        user: this.myUser
      });
    }

    this.loadSavedMessages();
  }

  setPartnerOnline(partner) {
    if (!partner) return;
    this.partnerUser = partner;
    this.headerPartnerAvatar.textContent = partner.avatar || '💖';
    this.headerPartnerName.textContent = partner.nickname || 'Partner';
    this.headerPartnerStatus.textContent = 'Online';
    this.headerStatusIndicator.className = 'status-indicator online';
    this.waitingBanner.classList.add('hidden');
  }

  setPartnerOffline() {
    this.headerPartnerStatus.textContent = 'Offline';
    this.headerStatusIndicator.className = 'status-indicator offline';
  }

  initSupabaseRealtime() {
    try {
      const createClient = window.supabase.createClient;
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
      const channelName = `duo-room-${this.roomCode}`;

      this.supabaseChannel = this.supabase.channel(channelName, {
        config: {
          broadcast: { self: true },
          presence: { key: this.myUser.id }
        }
      });

      this.supabaseChannel.on('broadcast', { event: 'message' }, ({ payload }) => {
        if (payload.senderId !== this.myUser.id) {
          this.receiveMessagePayload(payload);
        }
      });

      this.supabaseChannel.on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== this.myUser.id) {
          if (payload.isTyping) {
            this.typingIndicator.classList.remove('hidden');
          } else {
            this.typingIndicator.classList.add('hidden');
          }
        }
      });

      this.supabaseChannel.on('presence', { event: 'sync' }, () => {
        const state = this.supabaseChannel.presenceState();
        const users = Object.values(state).flat();
        const partner = users.find(u => u.id !== this.myUser.id);

        if (partner) {
          this.setPartnerOnline(partner);
        } else {
          this.setPartnerOffline();
        }
      });

      this.supabaseChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.supabaseChannel.track({
            id: this.myUser.id,
            nickname: this.myUser.nickname,
            avatar: this.myUser.avatar,
            onlineAt: new Date().toISOString()
          });
        }
      });

      console.log('[Supabase Realtime Subscribed]');
    } catch (err) {
      console.warn('Supabase initialization failed:', err);
      this.initSocketFallback();
    }
  }

  initSocketFallback() {
    if (typeof io !== 'undefined') {
      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io();

      this.socket.on('connect', () => {
        this.socket.emit('join_room', {
          roomCode: this.roomCode,
          nickname: this.myUser.nickname,
          avatar: this.myUser.avatar
        });
      });

      this.socket.on('room_joined', ({ user, partner, history }) => {
        if (partner) {
          this.setPartnerOnline(partner);
        }
        if (history && Array.isArray(history)) {
          history.forEach(msg => this.receiveMessagePayload(msg));
        }
      });

      this.socket.on('partner_status_change', ({ type, partner }) => {
        if (partner && (partner.socketId !== this.socket.id)) {
          if (type === 'connected') {
            this.setPartnerOnline(partner);
          } else {
            this.setPartnerOffline();
          }
        }
      });

      this.socket.on('receive_message', (payload) => {
        if (payload.senderId !== this.socket.id && payload.senderId !== this.myUser.id) {
          this.receiveMessagePayload(payload);
        }
      });
    }
  }

  async handleSendMessage() {
    const text = this.messageInput.value.trim();
    const hasImage = !!this.selectedImageData;

    if (!text && !hasImage) return;

    let imageUrl = null;

    if (hasImage && this.supabase) {
      imageUrl = await this.uploadToSupabaseStorage(this.selectedImageData);
    } else if (hasImage) {
      imageUrl = this.selectedImageData;
    }

    const payload = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      senderId: this.myUser.id,
      senderNickname: this.myUser.nickname,
      senderAvatar: this.myUser.avatar,
      text: text || '',
      imageUrl: imageUrl || null,
      timestamp: new Date().toISOString()
    };

    this.receiveMessagePayload(payload);

    if (this.supabaseChannel) {
      await this.supabaseChannel.send({
        type: 'broadcast',
        event: 'message',
        payload
      });
    } else if (this.socket) {
      this.socket.emit('send_message', payload);
    }

    if (this.localBroadcastChannel) {
      this.localBroadcastChannel.postMessage({
        type: 'message',
        roomCode: this.roomCode,
        payload
      });
    }

    this.messageInput.value = '';
    this.messageInput.style.height = 'auto';
    this.clearSelectedImage();
  }

  async uploadToSupabaseStorage(base64Image) {
    try {
      const response = await fetch(base64Image);
      const blob = await response.blob();
      const fileName = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 4)}.jpg`;

      const { data, error } = await this.supabase.storage
        .from('duo-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (error) throw error;

      const { data: publicUrlData } = this.supabase.storage
        .from('duo-photos')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (e) {
      console.warn('Storage upload fallback to base64:', e);
      return base64Image;
    }
  }

  sendTypingStatus() {
    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: this.myUser.id, isTyping: true }
      });

      if (this.typingTimeout) clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: this.myUser.id, isTyping: false }
        });
      }, 2000);
    }
  }

  receiveMessagePayload(payload) {
    if (this.messages.some(m => m.id === payload.id)) return;

    this.messages.push(payload);
    this.saveLocalMessages();
    this.renderMessages();
  }

  handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) this.processImageFile(file);
  }

  processImageFile(file) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 800;
        let w = img.width;
        let h = img.height;

        if (w > h && w > MAX_DIM) {
          h *= MAX_DIM / w;
          w = MAX_DIM;
        } else if (h > MAX_DIM) {
          w *= MAX_DIM / h;
          h = MAX_DIM;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        this.selectedImageData = canvas.toDataURL('image/jpeg', 0.85);
        this.imagePreviewImg.src = this.selectedImageData;
        this.imagePreviewBar.classList.remove('hidden');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  clearSelectedImage() {
    this.selectedImageData = null;
    if (this.imageFileInput) this.imageFileInput.value = '';
    if (this.imagePreviewBar) this.imagePreviewBar.classList.add('hidden');
  }

  renderMessages() {
    if (!this.messagesContainer) return;
    this.messagesContainer.innerHTML = '';

    this.messages.forEach(msg => {
      const isSent = msg.senderId === this.myUser.id;
      const msgRow = document.createElement('div');
      msgRow.className = `message-row ${isSent ? 'sent' : 'received'}`;

      let bodyHtml = '';

      if (msg.imageUrl) {
        bodyHtml += `<img src="${msg.imageUrl}" class="message-image" alt="Uploaded photo" />`;
      }
      if (msg.text) {
        bodyHtml += `<div style="${msg.imageUrl ? 'margin-top:6px;' : ''}">${this.escapeHtml(msg.text)}</div>`;
      }

      const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      msgRow.innerHTML = `
        <div class="message-bubble">${bodyHtml}</div>
        <div class="message-meta"><span>${timeStr}</span></div>
      `;

      const imgEl = msgRow.querySelector('.message-image');
      if (imgEl) {
        imgEl.addEventListener('click', () => {
          this.lightboxImg.src = imgEl.src;
          this.lightboxModal.classList.remove('hidden');
        });
      }

      this.messagesContainer.appendChild(msgRow);
    });

    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.chatMain) this.chatMain.scrollTop = this.chatMain.scrollHeight;
  }

  escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
  }

  saveLocalMessages() {
    if (this.roomCode) {
      localStorage.setItem(`duo_messages_${this.roomCode}`, JSON.stringify(this.messages.slice(-100)));
    }
  }

  loadSavedMessages() {
    const saved = localStorage.getItem(`duo_messages_${this.roomCode}`);
    if (saved) {
      try {
        this.messages = JSON.parse(saved);
        this.renderMessages();
      } catch (e) {
        this.messages = [];
      }
    }
  }

  openSettingsModal() {
    if (this.dbProviderSelect) this.dbProviderSelect.value = this.provider || 'socket';
    if (this.supabaseUrlInput) this.supabaseUrlInput.value = this.supabaseUrl || '';
    if (this.supabaseKeyInput) this.supabaseKeyInput.value = this.supabaseKey || '';
    if (this.settingsModalOverlay) {
      this.settingsModalOverlay.classList.remove('hidden');
    }
  }

  closeSettingsModal() {
    if (this.settingsModalOverlay) {
      this.settingsModalOverlay.classList.add('hidden');
    }
  }

  saveSettings() {
    if (this.dbProviderSelect) this.provider = this.dbProviderSelect.value;
    if (this.supabaseUrlInput) this.supabaseUrl = this.supabaseUrlInput.value.trim();
    if (this.supabaseKeyInput) this.supabaseKey = this.supabaseKeyInput.value.trim();

    localStorage.setItem('duo_db_provider', this.provider);
    localStorage.setItem('duo_sb_url', this.supabaseUrl);
    localStorage.setItem('duo_sb_key', this.supabaseKey);

    this.updateProviderBadge();
    this.closeSettingsModal();
    alert('Settings saved successfully!');
  }
}

window.duoChatApp = new DuoChatApp();
