<template>
  <div class="login-container">
    <!-- 左侧展示区 -->
    <div class="left-section">
      <div class="image-container">
        <img src="https://ai-public.mastergo.com/ai/img_res/aca63b1356cd6e5d69f9ce3148fca942.jpg">
      </div>
      <div class="overlay">
        <div class="content">
          <h2>探索美食</h2>
          <p>分享舌尖上的记忆</p>
        </div>
      </div>
    </div>

    <!-- 右侧表单区 -->
    <div class="right-section">
      <div class="right-box">
        <div class="header">
          <h1 class="logo">未境·美食地图</h1>
          <span>
            <el-link :href="'/'" class="home-link">
              <span>返回首页</span>
              <el-icon>
                <ArrowRight />
              </el-icon>
            </el-link>
          </span>
        </div>

        <div>
          <div class="form-container">
            <div class="form-header">
              <h1>{{ isRegister ? "创建账号" : "登录账号" }}</h1>
              <p>
                {{ isRegister ? "已有账号？" : "还没有账号？" }}
                <span @click="toggleRegisterOrLogin">
                  {{ isRegister ? "立即登录" : "立即注册" }}
                </span>
              </p>
            </div>

            <el-form :model="form" :rules="rules" ref="formRef" class="register-form">
              <el-form-item v-if="isRegister" prop="nickname">
                <el-input v-model="form.nickname" placeholder="昵称" size="large" class="form-input" />
              </el-form-item>
              <el-form-item prop="email">
                <el-input v-model="form.email" placeholder="电子邮箱" type="email" size="large" class="form-input" />
              </el-form-item>

              <el-form-item prop="password">
                <el-input v-model="form.password" :placeholder="isRegister ? '设置密码' : '密码'" :type="showPassword ? 'text' : 'password'"
                  size="large" class="form-input">
                  <template #suffix>
                    <el-icon @click="showPassword = !showPassword" class="password-icon">
                      <View v-if="!showPassword" />
                      <Hide v-else />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item prop="verifyCode">
                <div class="captcha-container">
                  <el-input v-model="form.verifyCode" placeholder="验证码" size="large" class="form-input captcha-input" />
                  <div class="captcha-box" @click="refreshCaptcha" title="点击刷新验证码">
                    <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" class="captcha-img" />
                    <el-button v-else :loading="captchaLoading" type="primary" text class="refresh-btn">获取验证码</el-button>
                  </div>
                </div>
              </el-form-item>

              <el-form-item prop="agreeToTerms">
                <el-checkbox v-model="form.agreeToTerms" class="terms-checkbox">
                  我同意&nbsp;
                  <el-link type="primary" href="#">服务条款</el-link>
                  &nbsp;和&nbsp;
                  <el-link type="primary" href="#">隐私政策</el-link>
                </el-checkbox>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" size="large" class="submit-button" @click="handleSubmit" :loading="loading">
                  {{ isRegister ? "创建账号" : "登录" }}
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowRight, View, Hide, Platform, Apple } from '@element-plus/icons-vue'
import { login, register, getCode } from '@/api/user';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex'; // Add Vuex store

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
    const router = useRouter()
    const store = useStore() // Initialize Vuex store
    const formRef = ref()
    const showPassword = ref(false)
    const loading = ref(false)
    const isRegister = ref(false)

    const form = reactive({
      nickname: '',
      email: '',
      password: '',
      verifyCode: '',
      agreeToTerms: false
    })
    
    // 验证码相关
    const captchaUrl = ref('')
    const captchaLoading = ref(false)
    
    // 获取验证码
    const refreshCaptcha = async () => {
      try {
        captchaLoading.value = true
        const res = await getCode()
        // 处理图片流数据
        if (res instanceof Blob) {
          // 释放之前的URL对象，避免内存泄漏
          if (captchaUrl.value && captchaUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(captchaUrl.value)
          }
          // 创建新的URL对象
          captchaUrl.value = URL.createObjectURL(res)
        } else {
          ElMessage.warning('获取验证码失败，请重试')
        }
      } catch (err) {
        console.error('获取验证码错误:', err)
        ElMessage.error('获取验证码失败，请检查网络连接')
      } finally {
        captchaLoading.value = false
      }
    }
    
    // 组件挂载时获取验证码
    onMounted(() => {
      refreshCaptcha()
    })

    const rules = {
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
      ],
      verifyCode: [
        { required: true, message: '请输入验证码', trigger: 'blur' }
      ],
      nickname: [
        { required: true, message: '请输入昵称', trigger: 'blur' },
        { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
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

    // 切换登录还是注册
    const toggleRegisterOrLogin = () => {
      isRegister.value = !isRegister.value
    };

    const handleSubmit = async () => {
      try {
        await formRef.value.validate()
        loading.value = true

        if (isRegister.value) {
          // 注册请求
          const registerData = {
            nickName: form.nickname,
            email: form.email,
            password: form.password,
            verifyCode: form.verifyCode
          }
          
          try {
            const res = await register(registerData)
            if (res.code === '200') {
              ElMessage.success('注册成功！')
              // 注册成功后切换到登录状态
              isRegister.value = false
              // 清空表单
              form.password = ''
            } else {
              ElMessage.error(res.message || '注册失败，请稍后重试')
            }
          } catch (err) {
            console.error('注册请求错误:', err)
            ElMessage.error('注册失败，请检查网络连接')
          }
        } else {
          // 登录请求
          const loginData = {
            email: form.email,
            password: form.password,
            verifyCode: form.verifyCode
          }
          
          try {
            const res = await login(loginData)
            if (res.code === '200') {
              ElMessage.success('登录成功！')
              // 保存用户信息到本地存储和 Vuex
              localStorage.setItem('user', JSON.stringify(res.data))
              try {
                store.commit('user/SET_TOKEN', res.data.jwtToken); // Store token in Vuex (namespaced)
                store.commit('user/SET_USER', res.data); // Store user data in Vuex (namespaced)
                // 跳转到首页
              } catch (error) {
                console.error('保存 token 失败:', error)
                ElMessage.error('保存登录信息失败')
              }
              router.push('/')
            } else {
              ElMessage.error(res.message || '登录失败，请检查账号密码')
            }
          } catch (err) {
            console.error('登录请求错误:', err)
            ElMessage.error('登录失败，请检查网络连接')
          }
        }
        
        loading.value = false
      } catch (error) {
        console.log('表单验证失败:', error)
        loading.value = false
      }
    }

    return {
      formRef,
      form,
      rules,
      showPassword,
      loading,
      handleSubmit,
      isRegister,
      toggleRegisterOrLogin,
      captchaUrl,
      captchaLoading,
      refreshCaptcha
    }
  }
}
</script>

<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: center;
}

.left-section {
  position: relative;
  width: 60vw;
  height: 100vh;
}

.left-section .image-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.left-section .image-container img {
  width: 100%;
  height: 100%;
  object-fit: fill;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2);
}

.overlay .content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  text-align: center;
  color: #fff;
}

.right-section {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: self-start;
  width: 40vw;
  height: 100vh;
  color: #fff;
  background-color: #111827;
  padding: 50px;
}

.right-box {
  width: 100%;
}

.right-section .header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  width: 100%;
}

.right-section .header span,
.right-section .header span .el-icon {
  color: #9ca3af;
}

.right-section .form-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  padding: 0 50px 0 50px;
}

.right-section .form-container .form-header p {
  margin-bottom: 25px;
  color: #9ca3af;
}

.right-section .form-container .form-header p {
  display: flex;
  align-items: center;
}

.right-section .form-container .form-header p span {
  color: #5064cb;
  cursor: pointer;
}

:deep(.form-input .el-input__wrapper) {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 8px;
}

:deep(.form-input .el-input__wrapper),
:deep(.form-input .el-input__wrapper.is-focus),
:deep(.form-input .el-input__wrapper:hover) {
  box-shadow: none;
}

.captcha-container {
  display: flex;
  width: 100%;
  gap: 10px;
}

.captcha-input {
  flex: 1;
}

.captcha-box {
  width: 120px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background-color: #1f2937;
  border: 1px solid #374151;
}

.captcha-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.refresh-btn {
  width: 100%;
  height: 100%;
  padding: 0;
  font-size: 14px;
}

.terms-checkbox {
  color: #9ca3af;
}

:deep(.terms-checkbox .el-checkbox__label) {
  display: flex;
  align-items: center;
}

:deep(.terms-checkbox .el-checkbox__input.is-checked+.el-checkbox__label) {
  color: #9ca3af;
}

.terms-checkbox .el-link {
  color: #5064cb;
}

:deep(.terms-checkbox .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #6366f1;
  border-color: #6366f1;
}

.register-form .submit-button {
  width: 100%;
  background: #6366f1;
  border-color: #6366f1;
  border-radius: 8px;
  font-weight: 500;
}

/* 小屏设备 */
@media (max-width:767px) {
  .left-section {
    display: none;
  }

  .right-section {
    width: 100vw;
    background: url("https://ai-public.mastergo.com/ai/img_res/aca63b1356cd6e5d69f9ce3148fca942.jpg") no-repeat center center;
    background-size: cover;
  }

  .right-section::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    /* 灰色+透明度 */
    z-index: 1;
  }

  .right-section .right-box {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    padding: 20px;
    width: 100%;
    height: 100%;
  }

  .right-section .right-box .form-container {
    width: 90%;
    padding: 30px;
    border-radius: 8%;
    background-color: #191818;
    ;
  }
}

/* 平板等中等设备 */
@media (min-width:768px) and (max-width:991px) {
  .left-section {
    width: 50vw;
  }

  .right-section {
    width: 50vw;
  }
}
</style>