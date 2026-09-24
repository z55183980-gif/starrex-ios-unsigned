<template>
  <van-popup v-model:show="visible" round class="add-bank-popup" :style="{ width: '92%' }">
    <div class="popup-content">
      <div class="popup-header">
        <div class="popup-title">添加银行卡</div>
      </div>
      <div class="popup-body">
        <div class="bank-tip-bar">
          <van-icon name="info-o" color="#26A17B" />
          <span>银行卡户名须与注册真实姓名一致，不可修改</span>
        </div>
        
        <div class="form-item">
          <div class="input-box">
            <input 
              type="text" 
              v-model="bankName" 
              placeholder="请输入银行名称（如：招商银行）" 
              class="bank-input" 
            />
          </div>
        </div>
        
        <div class="form-item">
          <div class="input-box">
            <input 
              type="text" 
              v-model="bankAccount" 
              placeholder="请输入银行卡号" 
              class="bank-input"
              maxlength="25"
            />
          </div>
        </div>
        
        <div class="form-item">
          <div class="input-box readonly">
            <input 
              type="text" 
              :value="accountName"
              placeholder="开户人姓名（注册真实姓名）" 
              class="bank-input"
              readonly
            />
          </div>
        </div>
        
        <div class="form-item">
          <div class="input-box">
            <input 
              type="text" 
              v-model="bankBranch" 
              placeholder="开户支行（选填）" 
              class="bank-input" 
            />
          </div>
        </div>
        
        <div class="tip-msg">
          温馨提示：请确保银行卡信息准确无误，以免影响提现
        </div>
        <div class="popup-btn" :class="{ disabled: !canSubmit }" @click="handleSubmit">确 定</div>
      </div>
    </div>
    
    <div class="close-circle-wrapper">
      <div class="close-circle" @click="visible = false">
        <van-icon name="cross" color="#fff" size="20" />
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { showToast } from 'vant'
import { withdrawApi } from '@/api/withdraw'

const props = defineProps({
  modelValue: Boolean,
  fundPassword: String,
  realName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = ref(false)
const bankName = ref('')
const bankAccount = ref('')
const bankBranch = ref('')

const accountName = computed(() => String(props.realName || '').trim())

const canSubmit = computed(() => {
  return bankName.value && bankAccount.value && accountName.value
})

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    bankName.value = ''
    bankAccount.value = ''
    bankBranch.value = ''
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleSubmit = async () => {
  if (!bankName.value) {
    showToast('请输入银行名称')
    return
  }
  if (!bankAccount.value) {
    showToast('请输入银行卡号')
    return
  }
  if (!accountName.value) {
    showToast('请先完善真实姓名后再绑定银行卡')
    return
  }
  
  try {
    const res = await withdrawApi.addAccount({
      type: 'bank',
      bankName: bankName.value,
      bankAccount: bankAccount.value,
      accountName: accountName.value,
      bankBranch: bankBranch.value,
      fundPassword: props.fundPassword
    })
    
    if (res.code === 0) {
      showToast('添加成功')
      visible.value = false
      emit('success')
    } else {
      showToast(res.message || '添加失败')
    }
  } catch (e) {
    showToast('添加失败')
  }
}
</script>

<style scoped>
.add-bank-popup {
  background: transparent !important;
  overflow: visible !important;
}
.popup-content {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}
.popup-header {
  padding: 20px 0 10px;
  text-align: center;
}
.popup-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}
.popup-body {
  padding: 10px 20px 25px;
}
.bank-tip-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #26A17B;
  background: rgba(38, 161, 123, 0.1);
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 15px;
}
.form-item {
  margin-bottom: 12px;
}
.input-box {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
  height: 44px;
  display: flex;
  align-items: center;
  padding: 0 12px;
}
.input-box.readonly {
  background: #f7f8fa;
}
.bank-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: #333;
}
.bank-input::placeholder {
  color: #999;
}
.tip-msg {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
  margin: 15px 0 20px;
}
.popup-btn {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border-radius: 6px;
  background: #26A17B;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
}
.popup-btn.disabled {
  background: #ccc;
}
.close-circle-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
.close-circle {
  width: 36px;
  height: 36px;
  border: 2px solid #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>
