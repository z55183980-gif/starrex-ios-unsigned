<template>
  <div class="chat-page" :class="{ 'chat-page--embedded': Boolean(props.embeddedCsUserId) }">
    <div class="chat-header">
      <van-icon name="arrow-left" @click="handleBack" />
      <div class="header-info">
        <span class="chat-name">{{ chatName }}</span>
        <span v-if="chatType === 'group'" class="member-count">({{ memberCount }}人)</span>
        <span v-if="chatType === 'private' && isOnline" class="online-status">在线</span>
      </div>
      <van-icon name="ellipsis" @click="showSettings = true" />
    </div>

    <div class="message-list" ref="messageListRef" @scroll="onScroll">
      <div v-if="initialLoading" class="loading-wrap">
        <van-loading size="24" />
      </div>
      
      <div v-if="hasMore && !initialLoading" class="load-more" @click="loadMore">
        <van-loading v-if="loadingMore" size="20" />
        <span v-else>加载更多</span>
      </div>

      <template v-for="(msg, idx) in messages" :key="msg.id">
        <div v-if="showTimeTag(idx)" class="time-divider">
          <span>{{ formatMsgTime(msg.sendTime) }}</span>
        </div>

        <div v-if="msg.msgType === 0" class="system-msg">
          {{ msg.content }}
        </div>

        <div v-else class="message-item" :class="{ 'is-self': msg.isSelf }">
          <van-image 
            v-if="!msg.isSelf"
            :src="getMessageAvatar(msg)"
            width="36" 
            height="36"
            class="msg-avatar"
            @click="viewProfile(msg.fromId)"
          />
          
          <div class="msg-content-wrap">
            <span v-if="chatType === 'group' && !msg.isSelf" class="msg-nickname">
              {{ msg.nickname }}
            </span>
            
            <div class="msg-bubble" :class="getMsgBubbleClass(msg)">
              <template v-if="msg.msgType === 1">
                {{ msg.content }}
              </template>
              
              <template v-else-if="msg.msgType === 2">
                <van-image 
                  :src="getFullUrl(msg.content)" 
                  width="150" 
                  fit="cover"
                  @click="previewImage(getFullUrl(msg.content))"
                />
              </template>
              
              <template v-else-if="msg.msgType === 6">
                <div class="redpacket-msg" @click="openRedpacket(msg)">
                  <van-icon name="red-packet" />
                  <span>{{ msg.content || '恭喜发财' }}</span>
                </div>
              </template>
              
              <template v-else>
                {{ msg.content }}
              </template>
            </div>
            
            <div v-if="msg.isSelf" class="msg-status">
              <van-icon v-if="msg.status === 'sending'" name="loading" class="spinning" />
              <van-icon v-else-if="msg.status === 'failed'" name="warning-o" class="failed" @click="resend(msg)" />
              <span v-else-if="msg.read" class="read-status">已读</span>
            </div>
          </div>
          
          <van-image 
            v-if="msg.isSelf"
            :src="getFullAvatarUrl(myAvatar)" 
            width="36" 
            height="36"
            class="msg-avatar"
          />
        </div>
      </template>
    </div>

    <div
      v-if="showCsPresets"
      class="cs-preset-bar"
    >
      <button
        v-for="(item, index) in csPresets"
        :key="index"
        type="button"
        class="cs-preset-chip"
        @click="sendPresetQuestion(item.question)"
      >
        {{ item.question }}
      </button>
    </div>

    <div class="input-area">
      <div class="input-row">
        <div class="input-main">
          <van-field
            ref="inputFieldRef"
            v-model="inputText"
            type="textarea"
            :rows="1"
            autosize
            placeholder=""
            class="msg-input"
            @focus="onInputFocus"
            @keydown.enter.exact.prevent="sendText"
          />
        </div>
        
        <div class="input-icon" @click="toggleEmoji">
          <van-icon :name="showEmoji ? 'keyboard-o' : 'smile-o'" />
        </div>

        <div class="input-icon" @click="chooseImage">
          <van-icon name="photo-o" />
        </div>
        
        <div class="send-btn" @click="sendText">
          发送
        </div>
      </div>
      
      <div v-show="showEmoji" class="bottom-panel emoji-panel">
        <div class="emoji-content">
          <span 
            v-for="emoji in emojis" 
            :key="emoji" 
            class="emoji-item"
            @click="insertEmoji(emoji)"
          >
            {{ emoji }}
          </span>
        </div>
        <div v-if="!props.embeddedCsUserId" class="emoji-actions">
          <div class="emoji-del" @click="deleteEmoji">
            <van-icon name="revoke" />
          </div>
        </div>
      </div>
      
    </div>

    <van-action-sheet 
      v-model:show="showSettings" 
      :actions="settingActions"
      cancel-text="取消"
      @select="onSettingSelect"
    />

    <van-popup v-model:show="showRedpacket" position="bottom" round :style="{ height: '50%' }">
      <div class="redpacket-form">
        <div class="popup-header">
          <span>发红包</span>
          <van-icon name="cross" @click="showRedpacket = false" />
        </div>
        <van-form @submit="sendRedpacket">
          <van-cell-group inset>
            <van-field
              v-model="redpacketAmount"
              type="number"
              label="金额"
              placeholder="输入红包金额"
              :rules="[{ required: true, message: '请输入金额' }]"
            />
            <van-field
              v-model="redpacketRemark"
              label="祝福语"
              placeholder="恭喜发财，大吉大利"
            />
          </van-cell-group>
          <div class="form-footer">
            <van-button type="danger" block native-type="submit">
              塞钱进红包
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <input 
      ref="imageInputRef" 
      type="file" 
      accept="image/*" 
      style="display: none"
      @change="onImageSelected"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Icon as VanIcon, Image as VanImage, Field as VanField, Button as VanButton,
  ActionSheet as VanActionSheet, Popup as VanPopup, Form as VanForm,
  CellGroup as VanCellGroup, Loading as VanLoading, ImagePreview,
  showToast, showConfirmDialog
} from 'vant'
import { imWS, IM_MSG_TYPES, TARGET_TYPE, MSG_TYPE } from '@/utils/imWebSocket'
import { useImStore } from '@/stores/im'
import { useConfigStore } from '@/stores/config'
import { fetchMessages, fetchUserInfo, uploadFile, quitGroup } from '@/api/im'
import { resolveMediaUrl, resolveAvatarUrl } from '@/utils/mediaUrl'
import { compressImageIfNeeded, IM_IMAGE_MAX_BYTES } from '@/utils/imageCompress'
import { getUserInfo } from '@/utils/auth'
import dayjs from 'dayjs'

const props = defineProps({
  embeddedCsUserId: {
    type: [Number, String],
    default: null
  }
})
const emit = defineEmits(['close'])

const route = useRoute()
const router = useRouter()
const imStore = useImStore()
const configStore = useConfigStore()

const chatId = computed(() => props.embeddedCsUserId
  ? `private_${props.embeddedCsUserId}`
  : route.params.chatId)
const targetType = computed(() => {
  const id = chatId.value || ''
  if (id.startsWith('group_')) return TARGET_TYPE.GROUP
  return TARGET_TYPE.PRIVATE
})
const targetId = computed(() => {
  const id = chatId.value || ''
  return parseInt(id.replace(/^(private_|group_)/, '')) || 0
})
const chatType = computed(() => targetType.value === TARGET_TYPE.GROUP ? 'group' : 'private')
const chatName = ref(props.embeddedCsUserId ? '在线客服' : (route.query.name || '聊天'))

const currentUserId = ref(localStorage.getItem('userId') || 'me')
const myAvatar = ref('')
const defaultAvatar = '/assets/img/cat.jpeg'
const customerServiceAvatar = '/assets/img/img_kf_kf01.avif'
const isCustomerService = computed(() => Boolean(props.embeddedCsUserId) || route.query.service === '1')
const csPresets = computed(() => {
  if (!isCustomerService.value || !configStore.csPresetEnabled) return []
  return Array.isArray(configStore.csAutoReplyPresets) ? configStore.csAutoReplyPresets : []
})
const showCsPresets = computed(() => csPresets.value.length > 0)

const getFullUrl = (url) => resolveMediaUrl(url, '')
const getFullAvatarUrl = (avatar) => resolveAvatarUrl(avatar, defaultAvatar)
const getMessageAvatar = (msg) => {
  if (isCustomerService.value && !msg.isSelf) return customerServiceAvatar
  return getFullAvatarUrl(msg.avatar)
}

const normalizeMsgTime = (t) => {
  if (!t) return Date.now()
  const n = Number(t)
  return n > 0 && n < 1e12 ? n * 1000 : n
}

const mapApiMessage = (m) => ({
  id: m.msgId ?? m.id,
  msgType: m.msgType ?? 1,
  content: m.content,
  isSelf: Boolean(m.isSelf),
  fromId: m.fromUid ?? m.fromId,
  avatar: m.fromAvatar || m.sender?.avatar,
  nickname: m.fromName || m.sender?.nickname,
  sendTime: normalizeMsgTime(m.createdAt ?? m.sendTime),
  status: m.status || 'sent'
})

const messages = ref([])
const inputText = ref('')
const hasMore = ref(true)
const loadingMore = ref(false)
const initialLoading = ref(true)
const messageListRef = ref(null)

const isOnline = ref(false)
const memberCount = ref(0)

const showEmoji = ref(false)
const showSettings = ref(false)
const showRedpacket = ref(false)
const imageInputRef = ref(null)
const inputFieldRef = ref(null)
const lastCsSendAt = ref(0)

const redpacketAmount = ref('')
const redpacketRemark = ref('')

const emojis = ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', 
               '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗',
               '🤔', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐',
               '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝', '🤤',
               '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
               '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '💕', '💖']

const lastMsgId = ref(null)

const settingActions = computed(() => {
  const actions = [
    { name: '查看资料', value: 'profile' },
    { name: imStore.isMuted(chatId.value) ? '取消免打扰' : '消息免打扰', value: 'mute' }
  ]
  if (chatType.value === 'group') {
    actions.push({ name: '群成员', value: 'members' })
    actions.push({ name: '退出群聊', value: 'quit', color: '#ee0a24' })
  }
  actions.push({ name: '清空聊天记录', value: 'clear', color: '#ee0a24' })
  return actions
})

const normalizeTimestamp = (ts) => {
  if (!ts) return Date.now()
  return ts < 10000000000 ? ts * 1000 : ts
}

const showTimeTag = (idx) => {
  if (idx === 0) return true
  const prev = messages.value[idx - 1]
  const curr = messages.value[idx]
  return dayjs(normalizeTimestamp(curr.sendTime)).diff(dayjs(normalizeTimestamp(prev.sendTime)), 'minute') > 5
}

const formatMsgTime = (timestamp) => {
  const time = dayjs(normalizeTimestamp(timestamp))
  const now = dayjs()
  
  if (now.isSame(time, 'day')) return time.format('HH:mm')
  if (now.subtract(1, 'day').isSame(time, 'day')) return '昨天 ' + time.format('HH:mm')
  if (now.isSame(time, 'year')) return time.format('MM-DD HH:mm')
  return time.format('YYYY-MM-DD HH:mm')
}

const getMsgBubbleClass = (msg) => {
  return {
    'bubble-self': msg.isSelf,
    'bubble-other': !msg.isSelf,
    'bubble-image': msg.msgType === MSG_TYPE.IMAGE,
    'bubble-redpacket': msg.msgType === MSG_TYPE.REDPACKET
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

const onScroll = (e) => {
  if (e.target.scrollTop < 50 && hasMore.value && !loadingMore.value) {
    loadMore()
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  loadingMore.value = true
  const oldHeight = messageListRef.value?.scrollHeight || 0
  
  try {
    const res = await fetchMessages({
      targetType: targetType.value,
      targetId: targetId.value,
      lastMsgId: lastMsgId.value,
      limit: 20
    })
    
    const list = (Array.isArray(res?.data) ? res.data : []).map(mapApiMessage)
    if (list.length > 0) {
      lastMsgId.value = list[0].id
      messages.value.unshift(...list)
    }
    hasMore.value = list.length >= 20
  } catch (e) {
    if (!e.message?.includes('404')) {
      console.error('加载消息失败:', e)
    }
    hasMore.value = false
  } finally {
    loadingMore.value = false
  }
  
  nextTick(() => {
    if (messageListRef.value) {
      const newHeight = messageListRef.value.scrollHeight
      messageListRef.value.scrollTop = newHeight - oldHeight
    }
  })
}

const sendText = async (overrideText) => {
  // 点击/回车会把 Event 当作首参传入，不能当文本用
  const fromPreset = typeof overrideText === 'string'
  const text = (fromPreset ? overrideText : inputText.value).trim()
  if (!text) return

  if (isCustomerService.value) {
    const now = Date.now()
    if (now - lastCsSendAt.value < 1000) {
      showToast('发送过快，请稍后再试')
      return
    }
    lastCsSendAt.value = now
  }
  
  if (!imWS.isConnected || !imWS.isAuthenticated) {
    showToast('正在连接...')
    try {
      await imStore.initIM()
    } catch (e) {
      showToast('连接失败，请重试')
      return
    }
  }
  
  const tempId = 'temp_' + Date.now()
  const msg = {
    id: tempId,
    msgType: MSG_TYPE.TEXT,
    content: text,
    fromId: currentUserId.value,
    sendTime: Date.now(),
    status: 'sending',
    isSelf: true
  }
  
  messages.value.push(msg)
  if (!fromPreset) {
    inputText.value = ''
  }
  showEmoji.value = false
  scrollToBottom()
  
  setTimeout(() => {
    const m = messages.value.find(x => x.id === tempId)
    if (m && m.status === 'sending') {
      m.status = 'failed'
    }
  }, 10000)
  
  imWS.send(IM_MSG_TYPES.SEND, {
    targetType: targetType.value,
    targetId: targetId.value,
    content: text,
    msgType: MSG_TYPE.TEXT,
    tempId
  })
}

const sendPresetQuestion = (question) => {
  sendText(question)
}

const toggleEmoji = () => {
  showEmoji.value = !showEmoji.value
}

const onInputFocus = () => {
  showEmoji.value = false
}

const insertEmoji = (emoji) => {
  inputText.value += emoji
}

const deleteEmoji = () => {
  if (inputText.value.length > 0) {
    const arr = Array.from(inputText.value)
    arr.pop()
    inputText.value = arr.join('')
  }
}

const chooseImage = () => {
  imageInputRef.value?.click()
}

const onImageSelected = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showToast('请选择图片文件')
    e.target.value = ''
    return
  }

  if (isCustomerService.value) {
    const now = Date.now()
    if (now - lastCsSendAt.value < 1000) {
      showToast('发送过快，请稍后再试')
      e.target.value = ''
      return
    }
    lastCsSendAt.value = now
  }
  
  try {
    let uploadFileData = file
    if (file.size > IM_IMAGE_MAX_BYTES) {
      uploadFileData = await compressImageIfNeeded(file, IM_IMAGE_MAX_BYTES)
    }

    const formData = new FormData()
    formData.append('file', uploadFileData)
    
    const res = await uploadFile(formData)
    const url = res.data?.url
    
    if (!url) throw new Error('上传失败')
    
    const tempId = 'temp_' + Date.now()
    const msg = {
      id: tempId,
      msgType: MSG_TYPE.IMAGE,
      content: url,
      fromId: currentUserId.value,
      sendTime: Date.now(),
      status: 'sending',
      isSelf: true
    }
    
    messages.value.push(msg)
    scrollToBottom()
    
    imWS.send(IM_MSG_TYPES.SEND, {
      targetType: targetType.value,
      targetId: targetId.value,
      content: url,
      msgType: MSG_TYPE.IMAGE,
      tempId
    })
    
    setTimeout(() => {
      const m = messages.value.find(x => x.id === tempId)
      if (m && m.status === 'sending') {
        m.status = 'failed'
      }
    }, 10000)
  } catch (err) {
    showToast(err?.message || '图片上传失败')
  } finally {
    e.target.value = ''
  }
}

const previewImage = (url) => {
  ImagePreview([url])
}

const sendRedpacket = () => {
  showRedpacket.value = false
  showToast('红包功能未开放')
}

const openRedpacket = () => {
  showToast('红包功能未开放')
}

const resend = (msg) => {
  msg.status = 'sending'
  
  imWS.send(IM_MSG_TYPES.SEND, {
    targetType: targetType.value,
    targetId: targetId.value,
    content: msg.content,
    msgType: msg.msgType,
    tempId: msg.id
  })
  
  setTimeout(() => {
    if (msg.status === 'sending') {
      msg.status = 'failed'
    }
  }, 10000)
}

const viewProfile = (userId) => {
  router.push({ name: 'UserProfile', params: { userId } })
}

const handleBack = () => {
  if (props.embeddedCsUserId) {
    emit('close')
    return
  }
  router.back()
}

const onSettingSelect = async (action) => {
  switch (action.value) {
    case 'profile':
      if (chatType.value === 'private') {
        router.push({ name: 'UserProfile', params: { userId: targetId.value } })
      }
      break
    case 'mute':
      imStore.toggleMute(chatId.value)
      showToast(imStore.isMuted(chatId.value) ? '已开启免打扰' : '已关闭免打扰')
      break
    case 'members':
      router.push({ name: 'GroupMembers', params: { groupId: targetId.value } })
      break
    case 'quit':
      try {
        await showConfirmDialog({ title: '确认退出群聊？' })
        await quitGroup(targetId.value)
        showToast('已退出')
        router.back()
      } catch {}
      break
    case 'clear':
      try {
        await showConfirmDialog({ title: '确认清空聊天记录？' })
        messages.value = []
        showToast('已清空')
      } catch {}
      break
  }
}

let wsCleanups = []

const loadInitialData = async () => {
  initialLoading.value = true
  try {
    const res = await fetchMessages({
      targetType: targetType.value,
      targetId: targetId.value,
      limit: 20
    })
    
    const list = Array.isArray(res?.data) ? res.data : []
    messages.value = list.map(mapApiMessage)
    if (messages.value.length > 0) {
      lastMsgId.value = messages.value[0].id
    }
    hasMore.value = list.length >= 20
  } catch (e) {
    if (!e.message?.includes('404')) {
      console.error('加载消息失败:', e)
    }
    messages.value = []
    hasMore.value = false
  } finally {
    initialLoading.value = false
  }
  
  if (chatType.value === 'private' && !route.query.name) {
    try {
      const userRes = await fetchUserInfo(targetId.value)
      const userData = userRes?.data?.user || userRes?.data || {}
      chatName.value = userData.nickname || userData.username || '聊天'
      isOnline.value = userData.online || false
    } catch (e) {
    }
  }
}

onMounted(async () => {
  try {
    const cached = getUserInfo() || JSON.parse(localStorage.getItem('userInfo') || '{}')
    const uid = cached.id ?? cached.userId
    if (uid != null && uid !== '') {
      currentUserId.value = String(uid)
      localStorage.setItem('userId', String(uid))
    }
    myAvatar.value = cached.avatar || ''
  } catch {}

  if (isCustomerService.value) {
    configStore.fetchConfig().catch(() => {})
  }
  
  if (!targetId.value) {
    showToast('无效的会话')
    router.back()
    return
  }
  
  const loadPromise = loadInitialData()
  
  await loadPromise
  
  imStore.markConversationRead(targetType.value, targetId.value)
  
  try {
    await imStore.initIM()
  } catch (e) {
    showToast('实时连接失败，消息可能延迟')
  }
  
  const unsubMsg = imWS.on(IM_MSG_TYPES.MESSAGE, (data) => {
    if (!data) return
    
    let msgTargetType, msgTargetId, msgData
    const myUserId = Number(currentUserId.value)
    
    if (data.message) {
      msgTargetType = data.targetType
      msgTargetId = data.targetId
      msgData = data.message
    } else if (data.msgId || data.content !== undefined) {
      msgTargetType = data.targetType || TARGET_TYPE.PRIVATE
      msgTargetId = data.fromUid === myUserId ? data.toUid : data.fromUid
      msgData = {
        id: data.msgId,
        content: data.content,
        msgType: data.msgType || 1,
        sendTime: data.createdAt || Date.now(),
        fromId: data.fromUid,
        sender: data.sender || {
          userId: data.fromUid,
          nickname: data.fromName,
          avatar: data.fromAvatar
        }
      }
    } else {
      return
    }
    
    if (msgTargetType === targetType.value && msgTargetId === targetId.value) {
      if (msgData.fromId !== myUserId) {
        const exists = messages.value.some(m => m.id === msgData.id)
        if (exists) return
        
        messages.value.push(mapApiMessage({
          ...msgData,
          fromUid: msgData.fromId,
          fromName: msgData.sender?.nickname,
          fromAvatar: msgData.sender?.avatar,
          isSelf: false
        }))
        scrollToBottom()
        
        imWS.send(IM_MSG_TYPES.READ, {
          targetType: targetType.value,
          targetId: targetId.value
        })
      }
    }
  })
  wsCleanups.push(unsubMsg)
  
  const unsubSent = imWS.on(IM_MSG_TYPES.SENT, (data) => {
    const msg = messages.value.find(m => m.id === data.tempId)
    if (msg) {
      msg.id = data.messageId || data.msgId
      msg.status = 'sent'
    }
  })
  wsCleanups.push(unsubSent)
  
  const unsubError = imWS.on('im_error', (data) => {
    if (data.tempId) {
      const idx = messages.value.findIndex(m => m.id === data.tempId)
      if (idx !== -1) {
        messages.value.splice(idx, 1)
      }
    }
    showToast(data.message || '发送过快，请稍后再试')
  })
  wsCleanups.push(unsubError)
  
  scrollToBottom()
})

onUnmounted(() => {
  wsCleanups.forEach(cleanup => cleanup())
  imStore.clearCurrentChat()
})
</script>

<style lang="less" scoped>
.chat-page {
  height: 100%;
  max-height: 100%;
  max-height: 100dvh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ededed;
  overflow: hidden;
  box-sizing: border-box;
}

.chat-header {
  flex: 0 0 calc(50.59px + env(safe-area-inset-top, 0px));
  height: calc(50.59px + env(safe-area-inset-top, 0px));
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: env(safe-area-inset-top, 0px) 12px 0;
  background: #ededed;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
    transform: scaleY(0.5);
  }
  
  .van-icon {
    font-size: 22px;
    color: #000;
    padding: 6px;
  }
  
  .header-info {
    flex: 1;
    text-align: center;
    
    .chat-name {
      font-size: 17px;
      font-weight: 500;
      color: #000;
    }
    
    .member-count {
      font-size: 12px;
      color: #888;
      margin-left: 2px;
    }
    
    .online-status {
      font-size: 11px;
      color: #07c160;
      margin-left: 6px;
    }
  }
}

.message-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 0;
  -webkit-overflow-scrolling: touch;
  
  .loading-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
  }
  
  .load-more {
    text-align: center;
    padding: 10px 12px;
    color: #888;
    font-size: 12px;
  }
  
  .time-divider {
    text-align: center;
    padding: 12px 0;
    
    span {
      display: inline-block;
      padding: 4px 10px;
      font-size: 12px;
      color: #fff;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 4px;
    }
  }
  
  .system-msg {
    text-align: center;
    padding: 4px 10px;
    font-size: 12px;
    color: #888;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
    margin: 8px 12px;
    max-width: calc(100% - 24px);
  }
  
  .message-item {
    display: flex;
    margin-bottom: 16px;
    padding: 0 12px;
    
    &.is-self {
      justify-content: flex-end;
      
      .msg-content-wrap {
        align-items: flex-end;
        margin-right: 8px;
        margin-left: 0;
      }
      
      .msg-bubble {
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          top: 10px;
          right: -6px;
          width: 0;
          height: 0;
          border: 6px solid transparent;
          border-left-color: #95ec69;
          border-right: 0;
        }
      }
    }
    
    &:not(.is-self) {
      .msg-bubble {
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          top: 10px;
          left: -6px;
          width: 0;
          height: 0;
          border: 6px solid transparent;
          border-right-color: #fff;
          border-left: 0;
        }
      }
    }
    
    .msg-avatar {
      flex-shrink: 0;
      border-radius: 6px !important;
      overflow: hidden;
    }
    
    .msg-content-wrap {
      display: flex;
      flex-direction: column;
      margin: 0 8px;
      max-width: 65%;
      
      .msg-nickname {
        font-size: 12px;
        color: #888;
        margin-bottom: 3px;
        padding-left: 2px;
      }
      
      .msg-bubble {
        padding: 9px 12px;
        border-radius: 4px;
        word-break: break-word;
        line-height: 1.4;
        font-size: 16px;
        box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
        
        &.bubble-self {
          background: #95ec69;
          color: #000;
        }
        
        &.bubble-other {
          background: #fff;
          color: #000;
        }
        
        &.bubble-image {
          padding: 3px;
          background: transparent;
          box-shadow: none;
          
          &::after {
            display: none;
          }
        }
        
        &.bubble-redpacket {
          background: #fa9d3b;
          color: #fff;
          min-width: 200px;
          border-radius: 8px;
          padding: 12px;
          
          &::after {
            display: none;
          }
        }
      }
      
      .msg-status {
        margin-top: 3px;
        font-size: 11px;
        padding-right: 2px;
        
        .spinning {
          animation: spin 1s linear infinite;
          color: #888;
        }
        
        .failed {
          color: #fa5151;
          cursor: pointer;
        }
        
        .read-status {
          color: #888;
        }
      }
    }
  }
}

.redpacket-msg {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .van-icon {
    font-size: 36px;
    color: #fff;
  }
  
  span {
    font-size: 15px;
  }
}

.cs-preset-bar {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 8px 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background: #f7f7f7;
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  &::-webkit-scrollbar {
    display: none;
  }

  .cs-preset-chip {
    flex: 0 0 auto;
    max-width: 220px;
    padding: 6px 12px;
    border: 1px solid rgba(7, 193, 96, 0.35);
    border-radius: 16px;
    background: #fff;
    color: #07c160;
    font-size: 13px;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.input-area {
  flex: 0 0 auto;
  background: #f7f7f7;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  /* Keep input above home indicator / gesture bar */
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  
  .input-row {
    display: flex;
    align-items: flex-end;
    padding: 8px 6px;
    gap: 6px;
    
    .input-icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .van-icon {
        font-size: 28px;
        color: #181818;
      }
      
      &:active {
        opacity: 0.6;
      }
    }
    
    .input-main {
      flex: 1;
      min-width: 0;
      
      .msg-input {
        background: #fff;
        border-radius: 6px;
        min-height: 36px;
        
        :deep(.van-field__control) {
          max-height: 100px;
          min-height: 20px;
          font-size: 17px;
          line-height: 1.4;
        }
        
        :deep(.van-cell) {
          padding: 8px 12px;
          min-height: 36px;
        }
      }
      
      .voice-btn {
        background: #fff;
        border-radius: 6px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 17px;
        font-weight: 500;
        color: #181818;
        user-select: none;
        
        &:active, &.recording {
          background: #c9c9c9;
        }
      }
    }
    
    .send-btn {
      flex-shrink: 0;
      background: #07c160;
      color: #fff;
      font-size: 17px;
      font-weight: 500;
      padding: 0 14px;
      height: 36px;
      line-height: 36px;
      border-radius: 6px;
      
      &:active {
        background: #06ad56;
      }
    }
  }
  
  .bottom-panel {
    background: #f7f7f7;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .emoji-panel {
    height: 240px;
    display: flex;
    flex-direction: column;
    
    .emoji-content {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-wrap: wrap;
      align-content: flex-start;
      
      .emoji-item {
        width: 12.5%;
        text-align: center;
        font-size: 28px;
        padding: 8px 0;
        cursor: pointer;
        border-radius: 4px;
        
        &:active {
          background: #e5e5e5;
        }
      }
    }
    
    .emoji-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px 12px;
      border-top: 1px solid rgba(0, 0, 0, 0.05);
      background: #fff;
      
      .emoji-del {
        width: 56px;
        height: 36px;
        background: #f5f5f5;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .van-icon {
          font-size: 22px;
          color: #181818;
        }
        
        &:active {
          background: #e5e5e5;
        }
      }
    }
  }
  
  .more-panel {
    padding: 20px 10px;
    
    .more-grid {
      display: flex;
      flex-wrap: wrap;
      
      .more-item {
        width: 25%;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;
        
        .more-icon {
          width: 56px;
          height: 56px;
          background: #fff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          
          .van-icon {
            font-size: 30px;
            color: #181818;
          }
          
          &.redpacket {
            background: #fa9d3b;
            
            .van-icon {
              color: #fff;
            }
          }
          
          &.transfer {
            background: #1989fa;
            
            .van-icon {
              color: #fff;
            }
          }
          
          &:active {
            opacity: 0.7;
          }
        }
        
        span {
          font-size: 12px;
          color: #666;
        }
      }
    }
  }
}

.redpacket-form {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #eee;
    font-size: 16px;
    font-weight: bold;
  }
  
  .form-footer {
    padding: 20px 16px;
  }
}

/* PC 客服弹窗使用深色主题，普通 IM 页面仍保持原有浅色样式。 */
.chat-page--embedded {
  background: #151515;
  color: #ededed;

  .chat-header {
    background: #1d1d1d;
    border-bottom: 1px solid rgba(212, 171, 83, 0.22);

    &::after {
      background: rgba(212, 171, 83, 0.28);
    }

    .van-icon {
      color: #e4bd64;
    }

    .header-info .chat-name {
      color: #f3d882;
    }
  }

  .message-list {
    background: #151515;

    .load-more,
    .msg-nickname {
      color: #999;
    }

    .system-msg {
      color: #aaa;
      background: rgba(255, 255, 255, 0.07);
    }

    .message-item:not(.is-self) .msg-bubble {
      background: #292929;
      color: #ededed;
      box-shadow: 0 1px 1px rgba(0, 0, 0, 0.24);

      &::after {
        border-right-color: #292929;
      }
    }

    .msg-status .read-status {
      color: #999;
    }
  }

  .cs-preset-bar,
  .input-area,
  .bottom-panel {
    background: #1d1d1d;
    border-color: rgba(212, 171, 83, 0.2);
  }

  .cs-preset-bar .cs-preset-chip {
    border-color: rgba(212, 171, 83, 0.45);
    background: #292929;
    color: #f0cf79;
  }

  .input-area {
    border-top: 1px solid rgba(212, 171, 83, 0.22);

    .input-row .input-icon .van-icon {
      color: #d8c18a;
    }

    .input-main .msg-input {
      background: #292929;
      border: 0 !important;
      box-shadow: none !important;
      outline: 0;

      :deep(.van-cell),
      :deep(.van-field__control) {
        border: 0 !important;
        box-shadow: none !important;
        outline: 0;
        background: transparent;
        color: #ededed;
      }

      :deep(.van-cell::after) {
        display: none;
      }
    }

    .input-main .msg-input :deep(.van-field__control)::placeholder {
      color: #858585;
    }

    .bottom-panel {
      border-top-color: rgba(212, 171, 83, 0.16);
    }

    .emoji-content .emoji-item:active,
    .emoji-actions .emoji-del:active {
      background: #353535;
    }

    .emoji-actions .emoji-del {
      background: #292929;

      .van-icon {
        color: #d8c18a;
      }
    }
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
