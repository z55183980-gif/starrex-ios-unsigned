
import request from './request'

export function fetchConversations() {
  return request.get('/v1/im/conversations')
}

export function fetchMessages(params) {
  return request.get('/v1/im/messages', { params })
}

export function sendMessage(data) {
  return request.post('/v1/im/send', data)
}

export function fetchUnreadCount() {
  return request.get('/v1/im/unread')
}

export function markAsRead(data) {
  return request.post('/v1/im/read', data)
}

export function fetchContacts() {
  return request.get('/v1/im/contacts')
}

export function fetchFriendRequests() {
  return request.get('/v1/im/friend-requests')
}

export function sendFriendRequest(data) {
  return request.post('/v1/im/friend-request', data)
}

export function handleFriendRequest(data) {
  return request.post('/v1/im/friend-request/handle', data)
}

export function setFriendRemark(data) {
  return request.post('/v1/im/friend/remark', data)
}

export function blockUser(data) {
  return request.post('/v1/im/friend/block', data)
}

export function deleteFriend(data) {
  return request.post('/v1/im/friend/delete', data)
}

export function fetchGroups() {
  return request.get('/v1/im/groups')
}

export function createGroup(data) {
  return request.post('/v1/im/group/create', data)
}

export function fetchGroupMembers(groupId) {
  return request.get(`/v1/im/group/${groupId}/members`)
}

export function inviteToGroup(groupId, data) {
  return request.post(`/v1/im/group/${groupId}/invite`, data)
}

export function kickFromGroup(groupId, data) {
  return request.post(`/v1/im/group/${groupId}/kick`, data)
}

export function setGroupAdmin(groupId, data) {
  return request.post(`/v1/im/group/${groupId}/admin`, data)
}

export function quitGroup(groupId) {
  return request.post(`/v1/im/group/${groupId}/quit`)
}

export function setConversationTop(data) {
  return request.post('/v1/im/conversation/top', data)
}

export function deleteConversation(data) {
  return request.post('/v1/im/conversation/delete', data)
}

export function setConversationMute(data) {
  return request.post('/v1/im/conversation/mute', data)
}

export function uploadFile(formData) {
  return request({
    url: '/v1/im/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function searchUser(keyword) {
  return request.get('/v1/im/user/search', { params: { keyword } })
}

export function fetchUserInfo(userId) {
  return request.get('/v1/im/user', { params: { userId } })
}

export function updateUserAvatar(avatar) {
  return request.post('/v1/im/user/avatar', { avatar })
}

export function contactCustomerService() {
  return request.get('/v1/im/customer-service')
}
