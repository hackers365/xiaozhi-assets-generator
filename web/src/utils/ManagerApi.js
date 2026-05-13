export const getUrlParameter = (name) => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(name)
}

export const getManagerDeviceId = () => getUrlParameter('device_id')

export const getManagerToken = () => {
  return localStorage.getItem('token') || getUrlParameter('manager_token') || ''
}

export const isManagerMode = () => Boolean(getManagerDeviceId() && getManagerToken())

export const managerRequest = async (path, options = {}) => {
  const token = getManagerToken()
  if (!token) {
    throw new Error('Manager authentication token not found')
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Console-Origin': window.location.origin,
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  })

  if (!response.ok) {
    let message = `HTTP ${response.status}: ${response.statusText}`
    try {
      const errorData = await response.clone().json()
      message = errorData.error || errorData.message || message
    } catch (_) {
      const text = await response.text().catch(() => '')
      if (text) message = text
    }
    throw new Error(message)
  }

  return response.json()
}

export const getAssetsCapabilities = async () => {
  const deviceId = getManagerDeviceId()
  if (!deviceId) {
    throw new Error('device_id not found')
  }
  const result = await managerRequest(`/user/devices/${encodeURIComponent(deviceId)}/assets/capabilities`)
  return result.data || result
}

export const createFlashSession = async ({ fileName = 'assets.bin', fileSize, sha256 = '', configSummary = {} }) => {
  const deviceId = getManagerDeviceId()
  if (!deviceId) {
    throw new Error('device_id not found')
  }
  const result = await managerRequest(`/user/devices/${encodeURIComponent(deviceId)}/assets/flash-sessions`, {
    method: 'POST',
    body: JSON.stringify({
      file_name: fileName,
      file_size: fileSize,
      sha256,
      config_summary: configSummary
    })
  })
  return result.data || result
}

export const startFlashSession = async (sessionId) => {
  const deviceId = getManagerDeviceId()
  if (!deviceId) {
    throw new Error('device_id not found')
  }
  const result = await managerRequest(`/user/devices/${encodeURIComponent(deviceId)}/assets/flash-sessions/${encodeURIComponent(sessionId)}/start`, {
    method: 'POST',
    body: JSON.stringify({})
  })
  return result.data || result
}

export const cancelFlashSession = async (sessionId) => {
  const deviceId = getManagerDeviceId()
  if (!deviceId || !sessionId) return
  await managerRequest(`/user/devices/${encodeURIComponent(deviceId)}/assets/flash-sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE'
  })
}
