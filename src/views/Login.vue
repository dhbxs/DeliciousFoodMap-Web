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
              <el-form-item prop="email" v-if="!isRegister">
                <el-input v-model="form.email" placeholder="电子邮箱" type="email" size="large" class="form-input" />
              </el-form-item>

              <div v-if="isRegister" class="email-combined-container">
                <el-form-item prop="emailPrefix" class="email-combined-item">
                  <el-input v-model="form.emailPrefix" placeholder="邮箱前缀" size="large" class="form-input" />
                </el-form-item>
                <el-form-item prop="emailSuffix" class="email-combined-item">
                  <el-select v-model="form.emailSuffix" placeholder="选择邮箱" size="large" class="form-input">
                    <el-option label="@gmail.com" value="@gmail.com" />
                    <el-option label="@qq.com" value="@qq.com" />
                    <el-option label="@163.com" value="@163.com" />
                    <el-option label="@126.com" value="@126.com" />
                    <el-option label="@sina.com" value="@sina.com" />
                    <el-option label="@hotmail.com" value="@hotmail.com" />
                    <el-option label="@outlook.com" value="@outlook.com" />
                    <el-option label="@yahoo.com" value="@yahoo.com" />
                  </el-select>
                </el-form-item>
              </div>

              <el-form-item prop="password">
                <el-input v-model="form.password" :placeholder="isRegister ? '设置密码' : '密码'" :type="showPassword ? 'text' : 'password'"
                  size="large" class="form-input">
                  <template #suffix>
                    <el-icon @click="togglePasswordVisibility" class="password-icon">
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
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowRight, View, Hide } from '@element-plus/icons-vue'
import { login, register, getCode } from '@/api/userApi';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex'; // Add Vuex store
import { debounce, throttle } from '@/utils/debounceThrottle'; // 导入防抖和节流函数

export default {
  name: 'LoginPage',
  components: {
    ArrowRight,
    View,
    Hide,
  },
  setup() {
    const router = useRouter()
    const store = useStore() // Initialize Vuex store
    const formRef = ref()
    const showPassword = ref(false)
    const loading = ref(false)
    const isRegister = ref(false)

    // 验证码相关
    const captchaId = ref('')
    const captchaUrl = ref('')
    const captchaLoading = ref(false)
    
    // 密码显示/隐藏切换（使用节流避免频繁切换）
    const togglePasswordVisibility = throttle(() => {
      showPassword.value = !showPassword.value
    }, 200)

    const form = reactive({
      nickname: '',
      email: '',
      emailPrefix: '',
      emailSuffix: 'gmail.com',
      password: '',
      verifyCode: '',
      agreeToTerms: false
    })
    
    // 获取验证码（原始函数）
    const _refreshCaptcha = async () => {
      try {
        captchaLoading.value = true
        getCode().then(res => {
          if (res.code === "200") {
            captchaId.value = res.data.captchaId;
            captchaUrl.value = res.data.captchaImageBase64;
          } else {
            ElMessage.warning('获取验证码失败，请重试')
          }
        });
      } catch (err) {
        console.error('获取验证码错误:', err)
        ElMessage.error('获取验证码失败，请检查网络连接')
      } finally {
        captchaLoading.value = false
      }
    }
    
    // 使用节流优化验证码刷新，防止频繁点击
    const refreshCaptcha = throttle(_refreshCaptcha, 2000, { leading: true, trailing: false })
    
    // 组件挂载时获取验证码
    onMounted(() => {
      refreshCaptcha()
    })
    
    // 组件卸载时清理防抖和节流函数
    onUnmounted(() => {
      // 取消所有防抖和节流函数
      if (refreshCaptcha.cancel) refreshCaptcha.cancel()
      if (toggleRegisterOrLogin.cancel) toggleRegisterOrLogin.cancel()
      if (handleSubmit.cancel) handleSubmit.cancel()
      if (validateEmailPrefix.cancel) validateEmailPrefix.cancel()
      if (validateEmail.cancel) validateEmail.cancel()
      if (togglePasswordVisibility.cancel) togglePasswordVisibility.cancel()
    })

    const rules = {
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
    };

    // 实时验证函数（使用防抖优化）
    const validateEmailPrefix = debounce((value) => {
      if (value && !/^[a-zA-Z0-9._-]+$/.test(value)) {
        ElMessage.warning('邮箱前缀只能包含字母、数字、点、下划线和连字符')
      }
    }, 500)
    
    const validateEmail = debounce((value) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        ElMessage.warning('请输入正确的邮箱地址格式')
      }
    }, 500)
    
    // 监听表单输入变化，添加实时验证
    watch(() => form.emailPrefix, (newValue) => {
      if (isRegister.value && newValue) {
        validateEmailPrefix(newValue)
      }
    })
    
    watch(() => form.email, (newValue) => {
      if (!isRegister.value && newValue) {
        validateEmail(newValue)
      }
    })

    watch(isRegister, (newValue) => {
      if (newValue) {
        rules.email = []
        rules.emailPrefix = [
          { required: true, message: '请输入邮箱前缀', trigger: 'blur' },
          { pattern: /^[a-zA-Z0-9._-]+$/, message: '邮箱前缀只能包含字母、数字、点、下划线和连字符', trigger: 'blur' }
        ]
        rules.emailSuffix = [{ required: true, message: '请选择邮箱后缀', trigger: 'change' }]
      } else {
        rules.email = [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
        delete rules.emailPrefix
        delete rules.emailSuffix
      }
    }, { immediate: true });


    // 切换登录还是注册（使用防抖避免快速切换）
    const _toggleRegisterOrLogin = () => {
      isRegister.value = !isRegister.value
    };
    const toggleRegisterOrLogin = debounce(_toggleRegisterOrLogin, 300);

    // 表单提交处理（原始函数）
    const _handleSubmit = async () => {
      try {
        await formRef.value.validate((valid) => {
          if (!valid) return Promise.reject(new Error('表单验证失败'))
        })
        loading.value = true

        if (isRegister.value) {
          // 注册请求 - 组合邮箱地址
          const fullEmail = `${form.emailPrefix}${form.emailSuffix}`
          const registerData = {
            nickName: form.nickname,
            email: fullEmail,
            password: form.password,
            verifyCode: form.verifyCode
          }
          
          try {
            const res = await register(registerData)
            if (res.code === '200') {
              ElMessage.success('注册成功！')
              // 注册成功后切换到登录状态
              isRegister.value = false
              // 清空表单，但保留邮箱信息用于登录
              form.email = `${form.emailPrefix}@${form.emailSuffix}`
              form.password = ''
              form.emailPrefix = ''
              form.emailSuffix = 'gmail.com'
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
            captchaId: captchaId.value,
            email: form.email,
            password: form.password,
            verifyCode: form.verifyCode
          }
          
          try {
            const res = await login(loginData)
            if (res.code === '200') {
              ElMessage.success('登录成功！')
              try {
                store.commit('user/SET_USER', res.data);
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
    
    // 使用防抖优化表单提交，防止重复提交
    const handleSubmit = debounce(_handleSubmit, 1000, true)

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
      refreshCaptcha,
      togglePasswordVisibility
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

.email-combined-container {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
}

.email-combined-item {
  flex: 1;
}

.email-combined-item:first-child {
  flex: 2;
}

.email-at {
  color: #9ca3af;
  font-size: 16px;
  font-weight: 500;
  margin: 0 4px;
}

:deep(.email-combined-item .el-input__wrapper) {
  background: rgba(31, 41, 55, 0.5);
  border-radius: 8px;
}

:deep(.email-combined-item .el-input__wrapper),
:deep(.email-combined-item .el-input__wrapper.is-focus),
:deep(.email-combined-item .el-input__wrapper:hover) {
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