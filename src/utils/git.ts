import {execSync} from 'child_process'

export interface GitUserInfo {
  name?: string
  email?: string
}

/**
 * 获取Git用户信息
 * @returns Git用户信息对象，包含name和email
 */
export function getGitUserInfo(): GitUserInfo {
  const userInfo: GitUserInfo = {}
  try {
    const name = execSync('git config user.name', {encoding: 'utf8'}).trim()
    if (name) {
      userInfo.name = name
    }
    const email = execSync('git config user.email', {encoding: 'utf8'}).trim()
    if (email) {
      userInfo.email = email
    }
  } catch (error) {
    return userInfo
  }
  return userInfo
}
/**
 * 检查是否在Git仓库中
 * @returns 如果在Git仓库中返回true，否则返回false
 */
export function getIsGitRepository(): boolean {
  try {
    execSync('git rev-parse --git-dir', {encoding: 'utf8', stdio: 'ignore'})
    return true
  } catch (error) {
    // 在MCP环境下可能因为工作目录、权限等问题导致失败
    return false
  }
}

// 增强版用户信息获取，支持多种fallback策略
export function getUserInfoWithFallback(): string {
  // 策略1: 尝试Git配置（如果是Git仓库）
  if (getIsGitRepository()) {
    try {
      const gitUser = getGitUserInfo()
      const userInfo = gitUser.email || gitUser.name
      if (userInfo) {
        return userInfo
      }
    } catch (error) {
      // Git配置获取失败，继续尝试其他方案
    }
  }

  // 策略2: 环境变量
  const envUserInfo = getUserInfoFromEnv()
  if (envUserInfo) {
    return envUserInfo
  }

  // 策略3: 系统用户信息
  const systemUserInfo = getUserInfoFromSystem()
  if (systemUserInfo) {
    return systemUserInfo
  }

  // 最终fallback
  return 'f2c_匿名'
}

// 从环境变量获取用户信息
function getUserInfoFromEnv(): string {
  // 常见的用户信息环境变量
  const envVars = [
    'GIT_AUTHOR_EMAIL',
    'GIT_COMMITTER_EMAIL',
    'EMAIL',
    'GIT_AUTHOR_NAME',
    'GIT_COMMITTER_NAME',
    'USER',
    'USERNAME',
    'LOGNAME',
  ]

  for (const envVar of envVars) {
    const value = process.env[envVar]
    if (value && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

// 从系统获取用户信息
function getUserInfoFromSystem(): string {
  try {
    const whoami = execSync('whoami', {encoding: 'utf8', timeout: 5000}).trim()
    // Windows系统移除域名部分
    if (process.platform === 'win32' && whoami.includes('\\')) {
      return whoami.split('\\').pop() || ''
    }
    return whoami
  } catch (error) {
    return ''
  }
}
