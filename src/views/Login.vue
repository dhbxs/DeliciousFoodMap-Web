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
            <el-link href="#" class="home-link">
              <span>返回首页</span>
              <el-icon>
                <ArrowRight />
              </el-icon>
            </el-link>
          </span>
        </div>

        <div class="form-container">
          <div class="form-header">
            <h1>创建账号</h1>
            <p>
              已有账号？
              <span>
                <el-link type="primary" href="#">立即登录</el-link>
              </span>
            </p>
          </div>

          <el-form :model="form" :rules="rules" ref="formRef" class="register-form">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item prop="firstName">
                  <el-input v-model="form.firstName" placeholder="姓氏" size="large" class="form-input" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item prop="lastName">
                  <el-input v-model="form.lastName" placeholder="名字" size="large" class="form-input" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item prop="email">
              <el-input v-model="form.email" placeholder="电子邮箱" type="email" size="large" class="form-input" />
            </el-form-item>

            <el-form-item prop="password">
              <el-input v-model="form.password" placeholder="设置密码" :type="showPassword ? 'text' : 'password'"
                size="large" class="form-input">
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
                我同意&nbsp;
                <el-link type="primary" href="#">服务条款</el-link>
                &nbsp;和&nbsp;
                <el-link type="primary" href="#">隐私政策</el-link>
              </el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" size="large" class="submit-button" @click="handleSubmit" :loading="loading">
                创建账号
              </el-button>
            </el-form-item>
          </el-form>

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

.right-section .form-container .form-header p,
.right-section .form-container .form-header p span {
  display: flex;
  align-items: center;
}

.right-section .form-container .form-header p .el-link {
  color: #5064cb;
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
    background-color: #191818;;
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