<template>
  <div class="login-container">
    <!-- 左侧展示区 -->
    <div class="left-section">
      <div class="image-container">
        <img src="https://ai-public.mastergo.com/ai/img_res/aca63b1356cd6e5d69f9ce3148fca942.jpg"
             alt="美食展示">
        <div class="overlay">
          <div class="content">
            <h2>探索美食</h2>
            <p>分享舌尖上的记忆</p>
          </div>
          <!-- <div class="indicators">
            <span class="indicator"></span>
            <span class="indicator active"></span>
            <span class="indicator"></span>
          </div> -->
        </div>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="right-section">
      <div class="header">
        <h1 class="logo">美食地图</h1>
        <el-link href="#" class="home-link">
          <span>返回首页</span>
          <el-icon><ArrowRight /></el-icon>
        </el-link>
      </div>

      <div class="form-container">
        <div class="form-header">
          <h1>创建账号</h1>
          <p>
            已有账号？
            <el-link type="primary" href="#">立即登录</el-link>
          </p>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" class="register-form">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item prop="firstName">
                <el-input
                  v-model="form.firstName"
                  placeholder="姓氏"
                  size="large"
                  class="form-input"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="lastName">
                <el-input
                  v-model="form.lastName"
                  placeholder="名字"
                  size="large"
                  class="form-input"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item prop="email">
            <el-input
              v-model="form.email"
              placeholder="电子邮箱"
              type="email"
              size="large"
              class="form-input"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              placeholder="设置密码"
              :type="showPassword ? 'text' : 'password'"
              size="large"
              class="form-input"
            >
              <template #suffix>
                <el-icon @click="showPassword = !showPassword" class="password-icon">
                  <View v-if="!showPassword" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="agreeToTerms">
            <el-checkbox v-model="form.agreeToTerms" class="terms-checkbox">
              我同意
              <el-link type="primary" href="#">服务条款</el-link>
              和
              <el-link type="primary" href="#">隐私政策</el-link>
            </el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="submit-button"
              @click="handleSubmit"
              :loading="loading"
            >
              创建账号
            </el-button>
          </el-form-item>
        </el-form>

        <div class="divider-section">
          <el-divider>
            <span class="divider-text">或使用以下方式</span>
          </el-divider>
        </div>

        <div class="social-buttons">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-button class="social-button" size="large">
                <el-icon><Platform /></el-icon>
                <span>Google</span>
              </el-button>
            </el-col>
            <el-col :span="12">
              <el-button class="social-button" size="large">
                <el-icon><Apple /></el-icon>
                <span>Apple</span>
              </el-button>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowRight, View, Hide, Platform, Apple } from '@element-plus/icons-vue'

export default {
  name: 'LoginPage',
  components: {
    ArrowRight,
    View,
    Hide,
    Platform,
    Apple
  },
  setup() {
    const formRef = ref()
    const showPassword = ref(false)
    const loading = ref(false)
    
    const form = reactive({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      agreeToTerms: false
    })

    const rules = {
      firstName: [
        { required: true, message: '请输入姓氏', trigger: 'blur' }
      ],
      lastName: [
        { required: true, message: '请输入名字', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
      ],
      agreeToTerms: [
        { 
          validator: (rule, value, callback) => {
            if (!value) {
              callback(new Error('请同意服务条款和隐私政策'))
            } else {
              callback()
            }
          },
          trigger: 'change'
        }
      ]
    }

    const handleSubmit = async () => {
      try {
        await formRef.value.validate()
        loading.value = true
        
        // 模拟API调用
        setTimeout(() => {
          console.log('Form submitted:', form)
          ElMessage.success('注册成功！')
          loading.value = false
        }, 2000)
      } catch (error) {
        console.log('Validation failed:', error)
      }
    }

    return {
      formRef,
      form,
      rules,
      showPassword,
      loading,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  background: #f5f5f5;
}

.left-section {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.image-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), transparent);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 64px 32px;
}

.content {
  text-align: center;
  color: white;
  margin-bottom: 32px;
}

.content h2 {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 16px;
  margin: 0;
}

.content p {
  font-size: 1.25rem;
  margin: 0;
}

.indicators {
  display: flex;
  gap: 8px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
}

.indicator.active {
  background: white;
}

.right-section {
  flex: 1;
  background: #1a1a1a;
  padding: 32px 64px;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.logo {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

.home-link {
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}

.home-link:hover {
  color: white;
}

.form-container {
  flex: 1;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.form-header {
  margin-bottom: 32px;
}

.form-header h1 {
  color: white;
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.form-header p {
  color: #9ca3af;
  margin: 0;
}

.register-form {
  margin-bottom: 32px;
}

.form-input {
  margin-bottom: 16px;
}

:deep(.form-input .el-input__wrapper) {
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid #374151;
  border-radius: 8px;
}

:deep(.form-input .el-input__inner) {
  color: white;
}

:deep(.form-input .el-input__inner::placeholder) {
  color: #9ca3af;
}

:deep(.form-input .el-input__wrapper:hover) {
  border-color: #6366f1;
}

:deep(.form-input .el-input__wrapper.is-focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.password-icon {
  cursor: pointer;
  color: #9ca3af;
}

.password-icon:hover {
  color: white;
}

.terms-checkbox {
  color: #9ca3af;
}

:deep(.terms-checkbox .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #6366f1;
  border-color: #6366f1;
}

.submit-button {
  width: 100%;
  background: #6366f1;
  border-color: #6366f1;
  border-radius: 8px;
  font-weight: 500;
}

.submit-button:hover {
  background: #5855eb;
  border-color: #5855eb;
}

.divider-section {
  margin: 32px 0;
}

.divider-text {
  color: #9ca3af;
  font-size: 14px;
}

:deep(.el-divider__text) {
  background: #1a1a1a;
}

:deep(.el-divider--horizontal) {
  border-color: #374151;
}

.social-buttons {
  margin-bottom: 32px;
}

.social-button {
  width: 100%;
  background: transparent;
  border: 1px solid #374151;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.social-button:hover {
  background: #374151;
  border-color: #374151;
  color: white;
}

/* 响应式设计 */
/* 平板设备 */
@media (max-width: 1024px) {
  .right-section {
    padding: 32px 48px;
  }
}

/* 移动设备 */
@media (max-width: 768px) {
  .login-container {
    position: relative;
    min-height: 100vh;
    background-image: url('https://ai-public.mastergo.com/ai/img_res/aca63b1356cd6e5d69f9ce3148fca942.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }
  
  .login-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8));
    z-index: 1;
  }
  
  .left-section {
    display: none;
  }
  
  .right-section {
    position: relative;
    z-index: 2;
    background: transparent;
    padding: 30px 20px 10px;
    flex: 1;
    min-height: 100vh;
    height: auto;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    box-sizing: border-box;
    padding-top: 80px;
  }
  
  .header {
    position: absolute;
    top: 20px;
    left: 24px;
    right: 24px;
    margin-bottom: 0;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    z-index: 3;
  }
  
  .logo {
    font-size: 1.3rem;
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }
  
  .home-link {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  }
  
  .home-link:hover {
    color: white;
  }
  
  .form-container {
    max-width: min(400px, 92%);
    width: 100%;
    margin: 0 auto 10px;
    background: rgba(26, 26, 26, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 20px 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .form-header {
    margin-bottom: 16px;
    text-align: center;
  }
  
  .form-header h1 {
    font-size: 1.8rem;
    margin-bottom: 6px;
    color: white;
  }
  
  .form-header p {
    font-size: 15px;
    color: #9ca3af;
  }
  
  .register-form {
    margin-bottom: 16px;
  }
  
  .form-input {
    margin-bottom: 16px;
  }
  
  :deep(.form-input .el-input__wrapper) {
    padding: 12px 16px;
    background: rgba(31, 41, 55, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .divider-section {
    margin: 16px 0;
  }
  
  .social-buttons {
    margin-bottom: 0;
  }
}

/* 小屏幕移动设备 */
@media (max-width: 480px) {
  .left-section {
    height: 35vh;
    min-height: 250px;
    max-height: 300px;
  }
  
  .overlay {
    padding: 30px 20px;
  }
  
  .content h2 {
    font-size: 1.8rem;
    margin-bottom: 8px;
  }
  
  .content p {
    font-size: 1rem;
  }
  
  .right-section {
    padding: 16px 16px 5px;
    min-height: auto;
    padding-top: 65px;
  }
  
  .form-container {
    padding: 16px 16px;
    margin-bottom: 5px;
  }
  
  .header {
    margin-bottom: 24px;
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .logo {
    font-size: 1.2rem;
  }
  
  .home-link {
    align-self: flex-end;
    font-size: 13px;
  }
  
  .form-header {
    margin-bottom: 24px;
  }
  
  .form-header h1 {
    font-size: 1.6rem;
  }
  
  .form-header p {
    font-size: 14px;
  }
  
  .register-form {
    margin-bottom: 24px;
  }
  
  .form-input {
    margin-bottom: 14px;
  }
  
  .divider-section {
    margin: 24px 0;
  }
  
  .social-buttons {
    margin-bottom: 24px;
  }
  
  /* 优化表单行间距 */
  :deep(.el-row) {
    margin-left: -8px !important;
    margin-right: -8px !important;
  }
  
  :deep(.el-col) {
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
}

/* 超小屏幕设备 */
@media (max-width: 360px) {
  .left-section {
    height: 30vh;
    min-height: 200px;
    max-height: 250px;
  }
  
  .overlay {
    padding: 20px 16px;
  }
  
  .content h2 {
    font-size: 1.5rem;
    margin-bottom: 6px;
  }
  
  .content p {
    font-size: 0.9rem;
  }
  
  .right-section {
    padding: 12px 10px 4px;
    min-height: auto;
    padding-top: 55px;
  }
  
  .form-container {
    padding: 12px 12px;
    margin-bottom: 4px;
  }
  
  .header {
    margin-bottom: 20px;
  }
  
  .logo {
    font-size: 1.1rem;
  }
  
  .form-header h1 {
    font-size: 1.4rem;
  }
  
  .form-header p {
    font-size: 13px;
  }
  
  .register-form {
    margin-bottom: 20px;
  }
  
  .divider-section {
    margin: 20px 0;
  }
  
  .social-buttons {
    margin-bottom: 20px;
  }
}

/* 横屏模式优化 */
@media (max-width: 768px) and (orientation: landscape) and (max-height: 500px) {
  .login-container {
    flex-direction: row;
  }
  
  .left-section {
    height: 100vh;
    min-height: 100vh;
    flex: 0.4;
    max-height: none;
  }
  
  .overlay {
    padding: 20px;
    justify-content: center;
  }
  
  .right-section {
    height: 100vh;
    padding-top: 60px;
  }
  
  .form-container {
    max-height: calc(100vh - 80px);
    padding: 16px;
  }
  
  .content h2 {
    font-size: 1.6rem;
  }
  
  .content p {
    font-size: 0.9rem;
  }
  
  .right-section {
    flex: 0.6;
    min-height: 100vh;
    height: 100vh;
    padding: 10px 14px 10px;
    overflow-y: auto;
    justify-content: flex-start;
    padding-top: 50px;
  }
  
  .form-container {
    max-height: calc(100vh - 70px);
    overflow-y: auto;
    padding: 16px 14px;
    margin-bottom: 8px;
  }
  
  .header {
    margin-bottom: 16px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .form-header {
    margin-bottom: 16px;
  }
  
  .form-header h1 {
    font-size: 1.4rem;
  }
  
  .register-form {
    margin-bottom: 16px;
  }
  
  .divider-section {
    margin: 16px 0;
  }
  
  .social-buttons {
    margin-bottom: 16px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .submit-button,
  .social-button {
    min-height: 48px;
    font-size: 16px;
  }
  
  .home-link {
    min-height: 44px;
    display: flex;
    align-items: center;
    padding: 8px;
  }
  
  .password-icon {
    padding: 12px;
    margin: -12px;
    font-size: 18px;
  }
  
  :deep(.el-checkbox__input) {
    transform: scale(1.3);
  }
  
  :deep(.form-input .el-input__wrapper) {
    min-height: 48px;
  }
  
  :deep(.form-input .el-input__inner) {
    font-size: 16px;
  }
}
</style>